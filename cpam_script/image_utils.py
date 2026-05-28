from pathlib import Path

import torch
import torch.nn.functional as F
from PIL import Image
from torchvision.io import read_image


def extract_object_mask(mask_image: torch.Tensor) -> torch.Tensor:
    if mask_image.shape[0] > 3:
        mask_image = mask_image[1]
    else:
        mask_image = mask_image[0]
    return (mask_image > 0.0).float()


def read_mask(path: str | Path, device: str) -> torch.Tensor:
    return extract_object_mask(read_image(str(path)).to(device))


def resize_mask(mask: torch.Tensor, size: int, channels: int = 3) -> torch.Tensor:
    mask = F.interpolate(mask.unsqueeze(0).unsqueeze(0), (size, size))
    return mask.repeat(1, channels, 1, 1)


def open_rgb(path: str | Path, size: int | None = None) -> Image.Image:
    image = Image.open(path).convert("RGB")
    if size is not None:
        image = image.resize((size, size))
    return image
