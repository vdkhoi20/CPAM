import argparse

from cpam_script import CPAMConfig, CPAMEditor


def parse_args():
    parser = argparse.ArgumentParser(description="Unified CPAM runner for SD1.5, SD2.1, and SDXL.")
    parser.add_argument("--version", choices=["sd15", "sd21", "sdxl"], default="sd15")
    parser.add_argument("--model-path", default=None)
    parser.add_argument("--device", default=None)
    parser.add_argument("--dtype", choices=["auto", "float32", "float16", "bfloat16"], default="auto")
    parser.add_argument("--cache-dir", default=None)
    parser.add_argument("--local-files-only", action="store_true")
    parser.add_argument("--steps", type=int, default=50)
    parser.add_argument("--guidance-scale", type=float, default=7.5)
    parser.add_argument("--mask-scale", type=float, default=0.1)
    parser.add_argument("--threshold", type=float, default=None)
    parser.add_argument("--step-query", type=int, default=None)
    parser.add_argument("--layer-query", type=int, default=None)
    parser.add_argument("--step-change-mask", type=int, default=1)
    parser.add_argument("--image", default=None)
    parser.add_argument("--mask", default=None)
    parser.add_argument("--prompt", default=None)
    parser.add_argument("--object-type", choices=["object", "background"], default="object")
    parser.add_argument("--output", default="results/cpam.png")
    parser.add_argument("--dataset", default=None)
    parser.add_argument("--data-file", default="data.json")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--save-image", action="store_true", help="Save only the edited image instead of a debug grid.")
    return parser.parse_args()


def main():
    args = parse_args()
    dtype = args.dtype
    if dtype == "auto":
        dtype = "float16" if args.version == "sdxl" else "float32"

    cfg = CPAMConfig(
        version=args.version,
        model_path=args.model_path,
        device=args.device,
        dtype=dtype,
        cache_dir=args.cache_dir,
        local_files_only=args.local_files_only,
        steps=args.steps,
        guidance_scale=args.guidance_scale,
        mask_scale=args.mask_scale,
        threshold=args.threshold,
        step_query=args.step_query,
        layer_query=args.layer_query,
        step_change_mask=args.step_change_mask,
    )
    editor = CPAMEditor(cfg)

    if args.dataset:
        editor.run_dataset(args.dataset, args.output, data_file=args.data_file, limit=args.limit)
        return

    if not (args.image and args.mask and args.prompt):
        raise SystemExit("Single-image mode requires --image, --mask, and --prompt, or use --dataset.")

    editor.edit_image(
        args.image,
        args.mask,
        args.prompt,
        args.output,
        object_type=args.object_type,
        save_grid=not args.save_image,
    )


if __name__ == "__main__":
    main()
