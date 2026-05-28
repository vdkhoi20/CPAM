import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from einops import rearrange, repeat
from torchvision.io import read_image


class AttentionBase:
    def __init__(self, max_step=50):
        self.cur_step = 0
        self.num_att_layers = -1
        self.cur_att_layer = 0
        self.max_step = max_step

    def reset(self):
        self.cur_att_layer = 0
        self.cur_step = 0

    def after_step(self):
        self.cur_att_layer = 0
        self.cur_step = (self.cur_step + 1) % self.max_step
        if self.cur_step == 0:
            self.reset()

    def __call__(self, q, k, v, sim, attn, is_cross, place_in_unet, num_heads, **kwargs):
        out = self.forward(q, k, v, sim, attn, is_cross, place_in_unet, num_heads, **kwargs)
        self.cur_att_layer += 1
        if self.cur_att_layer == self.num_att_layers:
            self.after_step()
        return out

    def forward(self, q, k, v, sim, attn, is_cross, place_in_unet, num_heads, **kwargs):
        out = torch.einsum("b i j, b j d -> b i d", attn, v)
        return rearrange(out, "(b h) n d -> b n (h d)", h=num_heads)


def register_attention_editor_diffusers(model, editor: AttentionBase):
    def ca_forward(self, place_in_unet):
        def forward(x, encoder_hidden_states=None, attention_mask=None, context=None, mask=None):
            if encoder_hidden_states is not None:
                context = encoder_hidden_states
            if attention_mask is not None:
                mask = attention_mask

            to_out = self.to_out
            if isinstance(to_out, nn.modules.container.ModuleList):
                to_out = self.to_out[0]

            h = self.heads
            q = self.to_q(x)
            is_cross = context is not None
            context = context if is_cross else x
            k = self.to_k(context)
            v = self.to_v(context)
            q, k, v = map(lambda t: rearrange(t, "b n (h d) -> (b h) n d", h=h), (q, k, v))

            sim = torch.einsum("b i d, b j d -> b i j", q, k) * self.scale

            if mask is not None:
                mask = rearrange(mask, "b ... -> b (...)")
                max_neg_value = -torch.finfo(sim.dtype).max
                mask = repeat(mask, "b j -> (b h) () j", h=h)
                mask = mask[:, None, :].repeat(h, 1, 1)
                sim.masked_fill_(~mask, max_neg_value)

            attn = sim.softmax(dim=-1)
            out = editor(q, k, v, sim, attn, is_cross, place_in_unet, self.heads, scale=self.scale)
            return to_out(out)

        return forward

    def register_editor(net, count, place_in_unet):
        for _, subnet in net.named_children():
            if net.__class__.__name__ == "Attention":
                net.forward = ca_forward(net, place_in_unet)
                return count + 1
            if hasattr(net, "children"):
                count = register_editor(subnet, count, place_in_unet)
        return count

    cross_att_count = 0
    for net_name, net in model.unet.named_children():
        if "down" in net_name:
            cross_att_count += register_editor(net, 0, "down")
        elif "mid" in net_name:
            cross_att_count += register_editor(net, 0, "mid")
        elif "up" in net_name:
            cross_att_count += register_editor(net, 0, "up")
    editor.num_att_layers = cross_att_count


def load_image(image_path, device, size=512):
    image = read_image(image_path)
    image = image[:3].unsqueeze_(0).float() / 127.5 - 1.0
    image = F.interpolate(image, (size, size))
    return image.to(device)


def expand_mask(mask, scale=0.15):
    object_size = torch.sum(mask)
    kernel_size = int(torch.sqrt(object_size).item() * scale)
    if kernel_size == 0:
        return mask
    source_mask = torch.tensor(mask.clone().detach(), dtype=torch.float32).unsqueeze(0).unsqueeze(0)
    dilation = torch.ones(1, 1, kernel_size, kernel_size).to(source_mask.device)
    expanded = F.conv2d(source_mask, dilation, padding=kernel_size // 2)
    expanded = torch.where(expanded > 0, torch.tensor(1.0).to(source_mask.device), torch.tensor(0.0).to(source_mask.device))
    return expanded.squeeze()


def get_ref_object_token_ids(model, sentence, object_text):
    prompt = [sentence, object_text]
    ids = model.tokenizer(prompt, padding="max_length", max_length=77, return_tensors="pt")
    object_token_ids = ids["input_ids"][1]
    padding_token_id = object_token_ids[-1].item()
    ref_tokens_object = []
    for token in object_token_ids[1:]:
        if token == padding_token_id:
            break
        ref_tokens_object.append(token.item())
    ref_tokens_object = torch.tensor(ref_tokens_object)

    sentence_token_ids = ids["input_ids"][0]
    for first_id in range(len(sentence_token_ids) - len(ref_tokens_object) + 1):
        if torch.equal(sentence_token_ids[first_id : first_id + len(ref_tokens_object)], ref_tokens_object):
            break
    assert first_id < len(sentence_token_ids) - 1, "token object must be a sequence of sentence"
    return list(range(first_id, first_id + len(ref_tokens_object)))


class CPAMSelfAttentionControl(AttentionBase):
    MODEL_LAYERS = {"sd15": 16, "sd21": 16, "sdxl": 70}

    def __init__(self, start_step=4, start_layer=10, layer_idx=None, step_idx=None, total_steps=50, version="sd21"):
        super().__init__(total_steps)
        self.version = version
        self.total_steps = total_steps
        self.start_step = start_step
        self.start_layer = start_layer
        total_layers = self.MODEL_LAYERS.get(version, 16)
        stop_layer = total_layers if version == "sd15" else total_layers + 1
        stop_step = total_steps if version == "sd15" else total_steps + 1
        self.layer_idx = layer_idx if layer_idx is not None else list(range(start_layer, stop_layer))
        self.step_idx = step_idx if step_idx is not None else list(range(start_step, stop_step))


class CPAMSelfAttentionControlMask(CPAMSelfAttentionControl):
    def __init__(
        self,
        start_step=4,
        start_layer=10,
        layer_idx=None,
        step_idx=None,
        total_steps=50,
        mask_s=None,
        mask_t=None,
        version="sd21",
    ):
        super().__init__(start_step, start_layer, layer_idx, step_idx, total_steps, version)
        self.mask_s = mask_s
        self.mask_t = mask_t

    def get_mask(self, h, w, target=True):
        mask = self.mask_t.clone() if target else self.mask_s.clone()
        mode = "nearest" if self.version != "sd15" else None
        if mode:
            mask = F.interpolate(mask.unsqueeze(0).unsqueeze(0), (h, w), mode=mode)
        else:
            mask = F.interpolate(mask.unsqueeze(0).unsqueeze(0), (h, w))
        return mask.reshape(-1).squeeze(-1)

    def masked_attention(self, q, k, v, num_heads, background=True, **kwargs):
        h = w = int(np.sqrt(q.shape[1]))
        q = rearrange(q, "(b h) n d -> b h n d", h=num_heads)
        sim = torch.einsum("b h i d,h j d -> b h i j", q, k) * kwargs.get("scale")

        if self.version == "sd15":
            mask = self.get_mask(h, w, not background).to(sim.dtype)
            if background:
                sim = sim + mask.masked_fill(mask == 1, torch.finfo(sim.dtype).min)
            else:
                sim = sim + mask.masked_fill(mask == 0, torch.finfo(sim.dtype).min).masked_fill(mask == 1, 0)
        else:
            mask = self.get_mask(h, w).unsqueeze(0).unsqueeze(0).unsqueeze(0).to(sim.dtype)
            neg_inf = -1e4 if sim.dtype == torch.float16 else -1e9
            sim = sim.masked_fill(mask == (1 if background else 0), neg_inf)

        attn = sim.softmax(-1)
        out = torch.einsum("b h i j, h j d -> b h i d", attn, v)
        return rearrange(out, "b h n d -> b n (h d)", h=num_heads)

    def forward(self, q, k, v, sim, attn, is_cross, place_in_unet, num_heads, **kwargs):
        h = w = int(np.sqrt(q.shape[1]))
        out_self = super().forward(q, k, v, sim, attn, is_cross, place_in_unet, num_heads, **kwargs)
        if is_cross:
            if self.version == "sdxl":
                return out_self
            mask = self.get_mask(h, w)
            q_object = q[-num_heads:, mask == 1, :]
            k_object = k[-num_heads:, :, :]
            v_object = v[-num_heads:, :, :]
            out_object = torch.einsum(
                "b i j, b j d -> b i d",
                (torch.einsum("b i d, b j d -> b i j", q_object, k_object) * kwargs.get("scale")).softmax(-1),
                v_object,
            )

            q_background = q[-num_heads:, mask == 0, :]
            k_background = k[:num_heads, :, :]
            v_background = v[:num_heads, :, :]
            out_background = torch.einsum(
                "b i j, b j d -> b i d",
                (torch.einsum("b i d, b j d -> b i j", q_background, k_background) * kwargs.get("scale")).softmax(-1),
                v_background,
            )

            out = torch.einsum("b i j, b j d -> b i d", attn, v)
            out[-num_heads:, mask == 1, :] = out_object
            out[-num_heads:, mask == 0, :] = out_background
            return rearrange(out, "(b h) n d -> b n (h d)", h=num_heads)

        out_intermediate, out_u_target, out_c_target = out_self.chunk(3)
        out_bg_u, out_bg_c = self.masked_attention(q[-2 * num_heads :], k[:num_heads], v[:num_heads], num_heads, background=True, **kwargs).chunk(2)
        out_fg_u, out_fg_c = self.masked_attention(q[-2 * num_heads :], k[:num_heads], v[:num_heads], num_heads, background=False, **kwargs).chunk(2)

        mask = self.get_mask(h, w).unsqueeze(-1)
        if self.version != "sd15":
            mask = mask.unsqueeze(0)

        if self.cur_step in self.step_idx and self.cur_att_layer // 2 in self.layer_idx:
            out_u_target = out_fg_u * mask + out_bg_u * (1 - mask)
            out_c_target = out_fg_c * mask + out_bg_c * (1 - mask)
        else:
            out_u_target = out_u_target * mask + out_bg_u * (1 - mask)
            out_c_target = out_c_target * mask + out_bg_c * (1 - mask)

        return torch.cat([out_intermediate, out_u_target, out_c_target], dim=0)


class CPAMSelfAttentionControlMaskExpand(CPAMSelfAttentionControlMask):
    def __init__(
        self,
        start_step=4,
        start_layer=10,
        layer_idx=None,
        step_idx=None,
        total_steps=50,
        mask_s=None,
        mask_t=None,
        thres_hold=0.25,
        ref_token_ids_object=None,
        step_change_mask=5,
        version="sd21",
    ):
        super().__init__(start_step, start_layer, layer_idx, step_idx, total_steps, mask_s, mask_t, version)
        self.step_change_mask = step_change_mask
        self.thres_hold = thres_hold
        self.refining_masks = []
        self.cross_attention_maps = []
        self.refining_mask = None
        self.ref_token_ids_object = ref_token_ids_object or [1]
        self.num_cross_attention = 0

    def aggregate_cross_attn_map(self):
        attns = torch.stack(self.cross_attention_maps, dim=0)
        attns = attns.sum(dim=0) / self.num_cross_attention
        attns = (attns - attns.min()) / (attns.max() - attns.min())
        return (attns >= self.thres_hold).to(attns.dtype)

    def add_attn_map(self, num_heads, attn):
        attn_ra = attn[-num_heads:]
        size = int(attn_ra.shape[1] ** 0.5)
        attn_ra = attn_ra[..., self.ref_token_ids_object]
        attn_ra = rearrange(attn_ra, "he (w h) d -> he d w h", w=size)
        attn_ra = F.interpolate(attn_ra, size=(64, 64), mode="nearest")
        attn_ra = rearrange(attn_ra, "he d w h -> (he d) w h")
        attn_ra = attn_ra.sum(dim=0) / attn_ra.shape[0] / torch.max(attn_ra)
        self.cross_attention_maps.append(attn_ra)

    def get_mask(self, h, w, target=True):
        if not target:
            mask = self.mask_s.clone()
        else:
            mask = self.mask_t.clone()
            if self.num_cross_attention >= self.step_change_mask * self.num_att_layers // 2:
                mask = self.refining_mask.clone()

        mode = "nearest" if self.version != "sd15" else None
        if mode:
            mask = F.interpolate(mask.unsqueeze(0).unsqueeze(0), (h, w), mode=mode)
        else:
            mask = F.interpolate(mask.unsqueeze(0).unsqueeze(0), (h, w))
        return mask.reshape(-1).squeeze(-1)

    def forward(self, q, k, v, sim, attn, is_cross, place_in_unet, num_heads, **kwargs):
        if is_cross:
            self.num_cross_attention += 1
            if self.num_cross_attention >= self.step_change_mask * self.num_att_layers // 2:
                self.add_attn_map(num_heads, attn)
                if self.num_cross_attention % (self.num_att_layers // 2) == 0:
                    self.refining_mask = self.aggregate_cross_attn_map()
                    self.refining_masks.append(self.refining_mask)
        return super().forward(q, k, v, sim, attn, is_cross, place_in_unet, num_heads, **kwargs)
