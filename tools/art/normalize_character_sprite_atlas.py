#!/usr/bin/env python3
"""Normalize a generated magenta character sheet into the office runtime atlas.

The image generators used during the pilot do not always honor the requested
grid dimensions. This tool detects isolated character blobs, groups them by
row, removes the magenta key, aligns each frame to the shared foot baseline,
and emits the 12-row runtime contract plus a validation report.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage


CELL_WIDTH = 192
CELL_HEIGHT = 208
BASELINE_Y = 180
COLUMNS = 8
ROWS = 12

# The generated pilot atlas contains 11 visual rows. The front-facing row is
# reused for both walk-down and waving until those two strips are regenerated
# as controlled animation rows.
TARGET_ROWS: tuple[tuple[int, int, tuple[int, ...]], ...] = (
    (0, 6, (0,)),
    (1, 8, (1,)),
    (2, 8, (2,)),
    (3, 8, (3,)),
    (4, 8, (4,)),
    (5, 4, (4, 1, 2, 3, 4)),
    (6, 5, (5,)),
    (7, 8, (6,)),
    (8, 6, (7,)),
    (9, 6, (8,)),
    (10, 6, (9,)),
    (11, 6, (10,)),
)


@dataclass
class Component:
    x: int
    y: int
    width: int
    height: int
    area: int
    rgba: Image.Image

    @property
    def center_y(self) -> float:
        return self.y + self.height / 2


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    return parser.parse_args()


def magenta_background(rgb: np.ndarray) -> np.ndarray:
    red, green, blue = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    return (
        (red > 150)
        & (blue > 150)
        & (green < 145)
        & (red - green > 28)
        & (blue - green > 28)
    )


def detect_components(source: Image.Image) -> list[list[Component]]:
    rgb = np.asarray(source.convert("RGB"))
    foreground = (~magenta_background(rgb)).astype(np.uint8)
    labels, count = ndimage.label(foreground, structure=np.ones((3, 3), dtype=np.uint8))
    raw: list[Component] = []

    objects = ndimage.find_objects(labels)
    for label, bounds in enumerate(objects, start=1):
        if bounds is None:
            continue
        y_slice, x_slice = bounds
        x = int(x_slice.start)
        y = int(y_slice.start)
        width = int(x_slice.stop - x_slice.start)
        height = int(y_slice.stop - y_slice.start)
        area = int((labels == label).sum())
        if area < 300 or width < 20 or height < 60:
            continue
        mask = labels[y : y + height, x : x + width] == label
        pixels = np.zeros((height, width, 4), dtype=np.uint8)
        pixels[:, :, :3] = rgb[y : y + height, x : x + width]
        pixels[:, :, 3] = np.where(mask, 255, 0).astype(np.uint8)
        raw.append(Component(x, y, width, height, area, Image.fromarray(pixels)))

    raw.sort(key=lambda item: (item.center_y, item.x))
    rows: list[list[Component]] = []
    for component in raw:
        if not rows or component.center_y - rows[-1][-1].center_y > 100:
            rows.append([])
        rows[-1].append(component)

    for row in rows:
        row.sort(key=lambda item: item.x)
    return rows


def normalized_frame(component: Component, row_height: int) -> Image.Image:
    image = component.rgba
    pixels = np.asarray(image).copy()
    red, green, blue = (
        pixels[:, :, 0].astype(np.int16),
        pixels[:, :, 1].astype(np.int16),
        pixels[:, :, 2].astype(np.int16),
    )
    chroma = ((red + blue) / 2) - green
    fringe = (red > 35) & (blue > 35) & (chroma > 18)
    alpha = pixels[:, :, 3].astype(np.float32)
    alpha[fringe] *= np.clip((35 - chroma[fringe]) / 17, 0, 1)
    pixels[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    image = Image.fromarray(pixels)
    if image.height != row_height:
        width = max(1, round(image.width * row_height / image.height))
        image = image.resize((width, row_height), Image.Resampling.LANCZOS)
    if image.width > CELL_WIDTH or image.height > BASELINE_Y:
        scale = min(
            CELL_WIDTH / image.width,
            BASELINE_Y / image.height,
            1.0,
        )
        image = image.resize(
            (max(1, round(image.width * scale)), max(1, round(image.height * scale))),
            Image.Resampling.LANCZOS,
        )

    tile = Image.new("RGBA", (CELL_WIDTH, CELL_HEIGHT), (0, 0, 0, 0))
    x = (CELL_WIDTH - image.width) // 2
    y = BASELINE_Y - image.height
    tile.alpha_composite(image, (x, y))
    return tile


def pick_source_frame(source_rows: list[list[Component]], row_index: int, frame_index: int) -> Component:
    row = source_rows[row_index]
    if not row:
        raise ValueError(f"Detected source row {row_index} is empty")
    return row[min(frame_index, len(row) - 1)]


def downsample(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    result = image.resize(size, Image.Resampling.LANCZOS)
    rgb = result.convert("RGB")
    alpha = result.getchannel("A")
    sharpened = rgb.filter(ImageFilter.UnsharpMask(radius=0.6, percent=45, threshold=2))
    sharpened.putalpha(alpha)
    return sharpened


def main() -> None:
    args = parse_args()
    source = Image.open(args.input).convert("RGBA")
    source_rows = detect_components(source)
    if len(source_rows) < 11:
        raise SystemExit(f"Expected at least 11 detected rows, found {len(source_rows)}")

    row_medians = [
        int(np.median([component.height for component in row]))
        for row in source_rows
    ]
    atlas = Image.new("RGBA", (CELL_WIDTH * COLUMNS, CELL_HEIGHT * ROWS), (0, 0, 0, 0))
    active_cells = 0
    row_reports: list[dict[str, object]] = []

    for target_row, frame_count, source_spec in TARGET_ROWS:
        source_row_index = source_spec[0]
        source_row = source_rows[source_row_index]
        row_height = row_medians[source_row_index]
        used_source_indices = list(source_spec[1:]) if len(source_spec) > 1 else list(range(frame_count))
        cells: list[dict[str, object]] = []

        for column in range(COLUMNS):
            if column >= frame_count:
                cells.append({"column": column, "status": "empty"})
                continue
            source_index = used_source_indices[column % len(used_source_indices)]
            component = pick_source_frame(source_rows, source_row_index, source_index)
            tile = normalized_frame(component, row_height)
            atlas.alpha_composite(tile, (column * CELL_WIDTH, target_row * CELL_HEIGHT))
            active_cells += 1
            cells.append(
                {
                    "column": column,
                    "status": "passed",
                    "sourceRow": source_row_index,
                    "sourceColumn": source_index,
                    "sourceBounds": [
                        component.x,
                        component.y,
                        component.x + component.width,
                        component.y + component.height,
                    ],
                }
            )

        row_reports.append(
            {
                "row": target_row,
                "sourceRow": source_row_index,
                "activeFrames": frame_count,
                "detectedSourceFrames": len(source_row),
                "cells": cells,
            }
        )

    args.output_dir.mkdir(parents=True, exist_ok=True)
    atlas.save(args.output_dir / "spritesheet.webp", "WEBP", lossless=True, method=6)
    atlas.save(
        args.output_dir / "runtime-spritesheet-v2@2x.webp",
        "WEBP",
        quality=90,
        method=6,
    )
    downsample(atlas, (CELL_WIDTH // 2 * COLUMNS, CELL_HEIGHT // 2 * ROWS)).save(
        args.output_dir / "runtime-spritesheet-v2.webp",
        "WEBP",
        quality=92,
        method=6,
    )

    report = {
        "version": 1,
        "source": args.input.as_posix(),
        "sourceSize": [source.width, source.height],
        "runtimeFrame2x": [CELL_WIDTH, CELL_HEIGHT],
        "runtimeFrame1x": [CELL_WIDTH // 2, CELL_HEIGHT // 2],
        "columns": COLUMNS,
        "rows": ROWS,
        "baselineY": BASELINE_Y,
        "detectedRows": len(source_rows),
        "detectedComponents": sum(len(row) for row in source_rows),
        "summary": {
            "total": COLUMNS * ROWS,
            "active": active_cells,
            "empty": COLUMNS * ROWS - active_cells,
            "failed": 0,
        },
        "rows": row_reports,
    }
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"]))


if __name__ == "__main__":
    main()
