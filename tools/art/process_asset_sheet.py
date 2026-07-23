#!/usr/bin/env python3
"""Slice a transparent asset sheet and emit validated, trimmed PNG assets."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--padding", type=int, default=8)
    return parser.parse_args()


def safe_filename(asset_id: str) -> str:
    return re.sub(r"[^a-z0-9._-]+", "-", asset_id.lower()) + ".png"


def proportional_bounds(index: int, count: int, extent: int) -> tuple[int, int]:
    return round(index * extent / count), round((index + 1) * extent / count)


def magenta_residue(image: Image.Image) -> int:
    count = 0
    for red, green, blue, alpha in image.getdata():
        if alpha > 32 and red > 175 and blue > 175 and green < 120:
            count += 1
    return count


def nearest_grid_index(position: float, extent: int, count: int) -> int:
    index = round((position / extent) * count - 0.5)
    return max(0, min(count - 1, index))


def split_component_masks(
    source: Image.Image, rows: int, columns: int
) -> dict[tuple[int, int], np.ndarray]:
    alpha = np.asarray(source.getchannel("A"))
    labels, component_count = ndimage.label(alpha > 8)
    masks = {
        (row, column): np.zeros(alpha.shape, dtype=bool)
        for row in range(rows)
        for column in range(columns)
    }

    for component_id in range(1, component_count + 1):
        component = labels == component_id
        pixel_count = int(component.sum())
        if pixel_count < 4:
            continue
        center_y, center_x = ndimage.center_of_mass(component)
        row = nearest_grid_index(center_y, source.height, rows)
        column = nearest_grid_index(center_x, source.width, columns)
        masks[(row, column)] |= component

    return masks


def main() -> None:
    args = parse_args()
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    source = Image.open(args.input).convert("RGBA")
    rows = manifest["rows"]
    columns = manifest["columns"]
    source_array = np.asarray(source)
    component_masks = split_component_masks(source, rows, columns)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    args.report.parent.mkdir(parents=True, exist_ok=True)

    results: list[dict[str, object]] = []
    for cell in manifest["cells"]:
        left, right = proportional_bounds(cell["column"], columns, source.width)
        top, bottom = proportional_bounds(cell["row"], rows, source.height)
        cell_mask = component_masks[(cell["row"], cell["column"])]
        isolated_array = source_array.copy()
        isolated_array[~cell_mask] = 0
        tile = Image.fromarray(isolated_array)
        alpha_mask = tile.getchannel("A").point(lambda alpha: 255 if alpha > 8 else 0)
        alpha_bbox = alpha_mask.getbbox()
        warnings: list[str] = []

        if alpha_bbox is None:
            results.append(
                {
                    "id": cell["id"],
                    "status": "failed",
                    "warnings": ["empty-alpha"],
                }
            )
            continue

        trimmed = tile.crop(alpha_bbox)
        residue = magenta_residue(trimmed)
        if residue:
            warnings.append("possible-magenta-residue")

        padded_width = trimmed.width + args.padding * 2
        padded_height = trimmed.height + args.padding * 2
        canvas = Image.new("RGBA", (padded_width, padded_height), (0, 0, 0, 0))
        canvas.alpha_composite(trimmed, (args.padding, args.padding))

        output_name = safe_filename(cell["id"])
        output_path = args.output_dir / output_name
        canvas.save(output_path, optimize=True)

        opaque_pixels = sum(1 for alpha in canvas.getchannel("A").getdata() if alpha > 8)
        coverage = opaque_pixels / (canvas.width * canvas.height)
        if coverage < 0.03:
            warnings.append("very-low-alpha-coverage")

        results.append(
            {
                "id": cell["id"],
                "status": "passed" if not warnings else "passed-with-warnings",
                "file": output_path.as_posix(),
                "sourceCell": {
                    "row": cell["row"],
                    "column": cell["column"],
                    "bounds": [left, top, right, bottom],
                },
                "trimBox": list(alpha_bbox),
                "size": [canvas.width, canvas.height],
                "anchor": [0.5, 1.0],
                "alphaCoverage": round(coverage, 4),
                "magentaResiduePixels": residue,
                "warnings": warnings,
            }
        )

    failed = sum(item["status"] == "failed" for item in results)
    warned = sum(item["status"] == "passed-with-warnings" for item in results)
    report = {
        "sheetId": manifest["id"],
        "source": args.input.as_posix(),
        "sourceSize": [source.width, source.height],
        "grid": [columns, rows],
        "summary": {
            "total": len(results),
            "passed": len(results) - failed,
            "warned": warned,
            "failed": failed,
        },
        "assets": results,
    }
    args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(report["summary"]))
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
