# CPAM: Context-Preserving Adaptive Manipulation

Official code and project page for **CPAM: Context-Preserving Adaptive Manipulation for Zero-Shot Real Image Editing**.

[![Project Page](https://img.shields.io/badge/Project-Page-0ea5e9)](https://vdkhoi20.github.io/CPAM/)
[![arXiv](https://img.shields.io/badge/arXiv-2506.18438-b31b1b)](https://arxiv.org/abs/2506.18438)
[![Code](https://img.shields.io/badge/Code-GitHub-111827)](https://github.com/vdkhoi20/CPAM)

CPAM is a tuning-free diffusion editing framework for real images. It preserves context through adaptive self-attention control while localizing prompt-driven changes with mask-guided attention extraction. This release includes a cleaned runner for **Stable Diffusion 1.5**, **Stable Diffusion 2.1**, and **Stable Diffusion XL**.

## Highlights

- Zero-shot real image editing without fine-tuning.
- Unified command-line runner for SD1.5, SD2.1, and SDXL.
- Shared configuration and attention-control code with version-specific diffusion backends.
- Dataset mode compatible with the original IMBA-style benchmark layout.
- Project page source included under the Next.js app.

## Repository Layout

```text
CPAM/
├── cpam_script/
│   ├── attention.py
│   ├── config.py
│   ├── image_utils.py
│   ├── pipeline.py
│   └── backends/
│       ├── sd15/diffuser_utils.py
│       ├── sd21/diffuser_utils.py
│       └── sdxl/diffuser_utils.py
├── run_cpam.py
├── requirements.txt
├── src/app/             # project page source
└── public/              # project page assets
```

## Installation

```bash
git clone https://github.com/vdkhoi20/CPAM.git
cd CPAM
conda create -n cpam python=3.10 -y
conda activate cpam
pip install -r requirements.txt
```

The scripts use Hugging Face Diffusers checkpoints. If your environment is offline, prepare the model cache first and pass `--cache-dir` with `--local-files-only`.

## Usage

Run CPAM on one image:

```bash
python run_cpam.py \
  --version sd21 \
  --image path/to/image.png \
  --mask path/to/mask.png \
  --prompt "a small bonsai maple tree" \
  --output results/cpam_sd21.png
```

Run a benchmark-style dataset:

```bash
python run_cpam.py \
  --version sdxl \
  --dataset path/to/final_dataset_IMBA \
  --output results/imba_sdxl \
  --cache-dir path/to/huggingface_cache \
  --local-files-only
```

Available versions:

```text
sd15   Stable Diffusion 1.5, 512 x 512
sd21   Stable Diffusion 2.1, 768 x 768, v-prediction DDIM inversion
sdxl   Stable Diffusion XL, 1024 x 1024
```

Dataset mode expects:

```text
dataset/
├── data.json
├── images/
└── masks/
```

Each record follows the original ImageEditing schema with fields such as `img_name`, `target_text`, `object`, `retain_object`, and optional `alter_mask`.

## Project Page

The project page is built with Next.js and exported for GitHub Pages.

```bash
npm install
npm run build
```

The live page is available at [vdkhoi20.github.io/CPAM](https://vdkhoi20.github.io/CPAM/).

## Related Projects

- [CPAM Project Page](https://vdkhoi20.github.io/CPAM/)
- [PANDORA: Pixel-wise Attention Dissolution and Latent Guidance for Zero-Shot Object Removal](https://vdkhoi20.github.io/PANDORA/)
- [FocusDiff: Target-Aware Refocusing for Tuning-Free Diffusion Editing](https://github.com/vdkhoi20/FocusDiff)

## Citation

If you find this repository useful, please cite CPAM:

```bibtex
@article{vo2025cpam,
  title={CPAM: Context-Preserving Adaptive Manipulation for Zero-Shot Real Image Editing},
  author={Vo, Dinh-Khoi and Do, Thanh-Toan and Nguyen, Tam V. and Tran, Minh-Triet and Le, Trung-Nghia},
  journal={arXiv preprint arXiv:2506.18438},
  year={2025}
}
```

Related work from our group:

```bibtex
@inproceedings{vo2026focusdiff,
  title={Toward 360-Degree Indoor Panorama Editing via Tuning-Free Diffusion Model with Refocusing Cross-Attention},
  author={Vo, Dinh-Khoi and Le-Hinh, Nhut-Thanh and Huynh, Viet-Tham and Nguyen, Tam V. and Tran, Minh-Triet and Le, Trung-Nghia},
  booktitle={International Conference on Computational Collective Intelligence},
  year={2026}
}
```

```bibtex
@inproceedings{Vo2026ICME,
  title = {PANDORA: Pixel-wise Attention Dissolution and Latent Guidance for Zero-Shot Object Removal},
  author = {Vo, Dinh-Khoi and Nguyen, Van-Loc and Nguyen, Tam V. and Tran, Minh-Triet and Le, Trung-Nghia},
  booktitle = {IEEE International Conference on Multimedia and Expo (ICME)},
  year = {2026},
}

@inproceedings{Vo2026DemoICME,
  title={Zero-Shot Mass-Similar and Multi-Object Removal in Single Pass},
  author={Dinh-Khoi Vo and Van-Loc Nguyen and Tam V. Nguyen and Minh-Triet Tran and Trung-Nghia Le},
  booktitle={IEEE International Conference on Multimedia and Expo (ICME)},
  year={2026},
}
```
