import json
import types
from pathlib import Path

import torch
from diffusers import DDIMScheduler, StableDiffusionPipeline, StableDiffusionXLPipeline
from torchvision.transforms.functional import to_tensor
from torchvision.utils import make_grid, save_image

from .attention import (
    AttentionBase,
    CPAMSelfAttentionControlMask,
    CPAMSelfAttentionControlMaskExpand,
    expand_mask,
    get_ref_object_token_ids,
    load_image,
    register_attention_editor_diffusers,
)
from .config import CPAMConfig
from .image_utils import open_rgb, read_mask, resize_mask


class CPAMEditor:
    """Unified wrapper around the original CPAM SD1.5, SD2.1, and SDXL scripts."""

    def __init__(self, config: CPAMConfig):
        self.config = config
        self.diffuser_utils = self._load_diffuser_utils(config.version)
        self.model = self._load_model()

    def _load_diffuser_utils(self, version: str):
        if version == "sd15":
            from .backends.sd15 import diffuser_utils

            return diffuser_utils
        if version == "sd21":
            from .backends.sd21 import diffuser_utils

            return diffuser_utils
        if version == "sdxl":
            from .backends.sdxl import diffuser_utils

            return diffuser_utils
        raise ValueError(f"Unsupported CPAM version: {version}")

    def _torch_dtype(self):
        if self.config.dtype == "float16":
            return torch.float16
        if self.config.dtype == "bfloat16":
            return torch.bfloat16
        return torch.float32

    def _load_model(self):
        model_path = self.config.resolved_model_path
        common_kwargs = {
            "cache_dir": self.config.cache_dir,
            "local_files_only": self.config.local_files_only,
        }

        if self.config.version == "sd15":
            scheduler = DDIMScheduler(
                beta_start=0.00085,
                beta_end=0.012,
                beta_schedule="scaled_linear",
                clip_sample=False,
                set_alpha_to_one=False,
            )
            model = self.diffuser_utils.OIICtrlPipeline.from_pretrained(
                model_path,
                scheduler=scheduler,
                safety_checker=None,
                requires_safety_checker=False,
                **common_kwargs,
            )
            return model.to(self.config.resolved_device)

        if self.config.version == "sd21":
            scheduler = DDIMScheduler(
                beta_start=0.00085,
                beta_end=0.012,
                beta_schedule="scaled_linear",
                clip_sample=False,
                set_alpha_to_one=False,
                prediction_type="v_prediction",
                steps_offset=1,
            )
            model = StableDiffusionPipeline.from_pretrained(
                model_path,
                scheduler=scheduler,
                torch_dtype=self._torch_dtype(),
                safety_checker=None,
                requires_safety_checker=False,
                **common_kwargs,
            ).to(self.config.resolved_device)
            model.invert = types.MethodType(self.diffuser_utils.invert, model)
            model.custom_call = types.MethodType(self.diffuser_utils.custom_call, model)
            return model

        sdxl_kwargs = {
            "torch_dtype": self._torch_dtype(),
            "use_safetensors": True,
            **common_kwargs,
        }
        if self.config.dtype == "float16":
            sdxl_kwargs["variant"] = "fp16"
        model = StableDiffusionXLPipeline.from_pretrained(model_path, **sdxl_kwargs).to(self.config.resolved_device)
        model.scheduler = DDIMScheduler.from_config(model.scheduler.config)
        model.invert = types.MethodType(self.diffuser_utils.invert, model)
        model.custom_call = types.MethodType(self.diffuser_utils.custom_call, model)
        return model

    def _prepare_source_image(self, image_path: str | Path):
        if self.config.version == "sd15":
            return load_image(str(image_path), self.config.resolved_device, self.config.image_size)
        return open_rgb(image_path, self.config.image_size)

    def _prepare_inversion(self, source_image):
        editor = AttentionBase(self.config.steps)
        register_attention_editor_diffusers(self.model, editor)

        if self.config.version == "sd15":
            start_code, intermediates = self.model.invert(
                source_image,
                prompt="",
                guidance_scale=self.config.guidance_scale,
                num_inference_steps=self.config.steps,
                return_intermediates=True,
            )
            return start_code.expand(2, -1, -1, -1), intermediates

        if self.config.version == "sd21":
            intermediates, start_code = self.model.invert(
                "",
                source_image,
                guidance_scale=0.0,
                eta=0.0,
                num_inference_steps=self.config.steps,
            )
            return start_code, intermediates

        start_code, intermediates = self.model.invert(
            source_image,
            prompt="",
            guidance_scale=1,
            num_inference_steps=self.config.steps,
        )
        return start_code, intermediates

    def _run_attention(self, start_code, intermediates, source_mask, target_mask, target_prompt, expand: bool):
        ref_token_ids_object = get_ref_object_token_ids(self.model, target_prompt, target_prompt)
        if expand:
            editor = CPAMSelfAttentionControlMaskExpand(
                start_step=self.config.step_query_value,
                start_layer=self.config.layer_query_value,
                mask_s=source_mask,
                mask_t=target_mask,
                total_steps=self.config.steps,
                ref_token_ids_object=ref_token_ids_object,
                thres_hold=self.config.threshold_value,
                step_change_mask=self.config.step_change_mask,
                version=self.config.version,
            )
        else:
            editor = CPAMSelfAttentionControlMask(
                start_step=self.config.step_query_value,
                start_layer=self.config.layer_query_value,
                mask_s=source_mask,
                mask_t=target_mask,
                total_steps=self.config.steps,
                version=self.config.version,
            )
        register_attention_editor_diffusers(self.model, editor)

        if self.config.version == "sd15":
            images = self.model(
                ["", target_prompt],
                latents=start_code,
                ref_intermediates=intermediates,
                guidance_scale=self.config.guidance_scale,
                num_inference_steps=self.config.steps,
            )
        elif self.config.version == "sd21":
            images = self.model.custom_call(
                prompt=["", "", target_prompt],
                latents=start_code,
                latents_intermediate=intermediates,
                custom_guidance_scale=self.config.guidance_scale,
                num_inference_steps=self.config.steps,
            )
        else:
            images = self.model.custom_call(
                prompt=target_prompt,
                latents=start_code,
                ref_intermediates=intermediates,
                guidance_scale=self.config.guidance_scale,
                num_inference_steps=self.config.steps,
            )
        return images, editor

    def edit_image(
        self,
        image_path: str | Path,
        mask_path: str | Path,
        prompt: str,
        output_path: str | Path,
        *,
        object_type: str = "object",
        save_grid: bool = True,
    ) -> None:
        source_image = self._prepare_source_image(image_path)
        source_mask = read_mask(mask_path, self.config.resolved_device)
        if object_type == "background":
            source_mask = 1.0 - source_mask
            target_mask = expand_mask(source_mask, 0.001)
        else:
            target_mask = expand_mask(source_mask, self.config.mask_scale)

        source_mask = source_mask.half()
        target_mask = target_mask.half()

        start_code, intermediates = self._prepare_inversion(source_image)
        images_expand, editor_expand = self._run_attention(
            start_code, intermediates, source_mask, target_mask, prompt, expand=True
        )
        images_fixed, _ = self._run_attention(start_code, intermediates, source_mask, target_mask, prompt, expand=False)
        self._save_result(images_expand, images_fixed, source_mask, target_mask, editor_expand, output_path, save_grid)

    def _save_result(self, images_expand, images_fixed, source_mask, target_mask, editor_expand, output_path, save_grid):
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        if not save_grid:
            if self.config.version == "sd15":
                image = images_expand[1]
            elif self.config.version == "sd21":
                image = images_expand[0]
            else:
                image = images_expand[0][0]
            if isinstance(image, torch.Tensor):
                save_image(image, str(output_path))
            else:
                image.save(output_path)
            return

        size = self.config.image_size
        src_mask = resize_mask(source_mask, size, channels=3)[0]
        tgt_mask = resize_mask(target_mask, size, channels=3)[0]
        refine_mask = resize_mask(editor_expand.refining_mask, size, channels=3)[0]

        if self.config.version == "sd15":
            image_compose = [images_expand[0], images_expand[1], src_mask, refine_mask, images_fixed[1]]
            nrow = 4
        elif self.config.version == "sd21":
            image_compose = [
                to_tensor(images_expand[0]).to(self.config.resolved_device),
                to_tensor(images_fixed[0]).to(self.config.resolved_device),
                src_mask,
                tgt_mask,
                refine_mask,
            ]
            nrow = 3
        else:
            image_compose = [
                to_tensor(images_expand[0][0]).to(self.config.resolved_device),
                to_tensor(images_fixed[0][0]).to(self.config.resolved_device),
                src_mask,
                tgt_mask,
                refine_mask,
            ]
            nrow = 3
        save_image(make_grid(image_compose, nrow=nrow), str(output_path))

    def run_dataset(
        self,
        dataset_root: str | Path,
        output_dir: str | Path,
        *,
        data_file: str = "data.json",
        limit: int | None = None,
    ) -> None:
        dataset_root = Path(dataset_root)
        output_dir = Path(output_dir)
        with open(dataset_root / data_file, "r") as f:
            records = json.load(f)
        if limit is not None:
            records = records[:limit]

        for idx, record in enumerate(records, start=1):
            old_step_query = self.config.step_query
            old_layer_query = self.config.layer_query
            if record.get("retain_object"):
                self.config.step_query = 3
                self.config.layer_query = 54 if self.config.version == "sdxl" else 7
            else:
                self.config.step_query = 100
                self.config.layer_query = 100
            stem = Path(record["img_name"]).stem
            mask_stem = record.get("alter_mask") or stem
            prompt = record["target_text"]
            print(f"[{idx}/{len(records)}] {record['img_name']} -> {prompt}")
            try:
                self.edit_image(
                    dataset_root / "images" / record["img_name"],
                    dataset_root / "masks" / f"{mask_stem}.png",
                    prompt,
                    output_dir / f"{stem}_{prompt}_result.png",
                    object_type=record.get("object", "object"),
                )
            finally:
                self.config.step_query = old_step_query
                self.config.layer_query = old_layer_query
