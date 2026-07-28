#!/usr/bin/env python3
"""Overlay a neutral A1-style grid across the entire existing Office image."""

from __future__ import annotations

import argparse
import hashlib
import io
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
BACKGROUND_PATH = ROOT / "assets/art/backgrounds/office-c-background-modern-v3.png"
ACTIVE_MAP_PATH = ROOT / "assets/game/maps/office-c-v2.json"
MAP_PATH = ROOT / "assets/game/maps/office-full-grid-v1.json"
MANIFEST_PATH = ROOT / "assets/game/manifests/office-full-grid-v1.json"
OUTPUT_PATH = ROOT / "assets/art/layout-references/office-full-grid-v1/01-office-full-grid-a1.png"

SOURCE_SIZE = (1672, 941)
COLUMNS = 43
ROWS = 24


def font(size: int) -> ImageFont.ImageFont:
    candidates = [
        Path("C:/Windows/Fonts/arialbd.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default(size=size)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def repo_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def json_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def png_bytes(image: Image.Image) -> bytes:
    stream = io.BytesIO()
    image.save(stream, format="PNG", optimize=False, compress_level=9)
    return stream.getvalue()


def column_label(index: int) -> str:
    value = index + 1
    label = ""
    while value > 0:
        value -= 1
        label = chr(65 + value % 26) + label
        value //= 26
    return label


def boundary(index: int, count: int, pixels: int) -> int:
    return round(index * pixels / count)


def map_data() -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "id": "office-full-grid-v1",
        "status": "owner-coordinate-review",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "sourceBackground": {
            "file": repo_path(BACKGROUND_PATH),
            "sha256": sha256(BACKGROUND_PATH),
            "pixels": list(SOURCE_SIZE),
            "mustRemainByteIdentical": True,
        },
        "activeOfficeBaseline": {
            "file": repo_path(ACTIVE_MAP_PATH),
            "sha256": sha256(ACTIVE_MAP_PATH),
            "mustRemainByteIdentical": True,
        },
        "grid": {
            "columns": COLUMNS,
            "rows": ROWS,
            "columnLabels": [column_label(index) for index in range(COLUMNS)],
            "rowLabels": list(range(1, ROWS + 1)),
            "notation": "column-letter-row-number",
            "origin": "top-left",
            "xDirection": "right",
            "yDirection": "down",
            "coversEntireImage": True,
        },
        "classifications": [],
        "rules": {
            "ownerAssignsAllZones": True,
            "inferredFloorOrWallZones": False,
            "newCharacterOrPose": False,
            "newFurnitureOrArt": False,
            "activeOfficePromotion": False,
        },
    }


def render_grid() -> Image.Image:
    image = Image.open(BACKGROUND_PATH).convert("RGBA")
    if image.size != SOURCE_SIZE:
        raise RuntimeError(f"Unexpected background size: {image.size}")
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    label_font = font(9)
    for row in range(ROWS):
        top = boundary(row, ROWS, SOURCE_SIZE[1])
        bottom = boundary(row + 1, ROWS, SOURCE_SIZE[1])
        for column in range(COLUMNS):
            left = boundary(column, COLUMNS, SOURCE_SIZE[0])
            right = boundary(column + 1, COLUMNS, SOURCE_SIZE[0])
            tint = (15, 23, 42, 14) if (row + column) % 2 == 0 else (34, 211, 238, 9)
            draw.rectangle((left, top, right, bottom), fill=tint)
            label = f"{column_label(column)}{row + 1}"
            label_box = draw.textbbox((0, 0), label, font=label_font, stroke_width=1)
            label_width = label_box[2] - label_box[0]
            draw.rounded_rectangle((left + 2, top + 2, left + label_width + 6, top + 14), radius=2, fill=(2, 6, 23, 178))
            draw.text((left + 4, top + 3), label, font=label_font, fill=(255, 255, 255, 255), stroke_width=1, stroke_fill=(2, 6, 23, 255))
    for column in range(COLUMNS + 1):
        x = boundary(column, COLUMNS, SOURCE_SIZE[0])
        draw.line((x, 0, x, SOURCE_SIZE[1]), fill=(255, 255, 255, 185), width=1)
    for row in range(ROWS + 1):
        y = boundary(row, ROWS, SOURCE_SIZE[1])
        draw.line((0, y, SOURCE_SIZE[0], y), fill=(255, 255, 255, 185), width=1)
    draw.rectangle((0, 0, SOURCE_SIZE[0] - 1, SOURCE_SIZE[1] - 1), outline=(34, 211, 238, 255), width=3)
    return Image.alpha_composite(image, overlay).convert("RGB")


def manifest_data(map_content: bytes, output_content: bytes) -> dict[str, Any]:
    return {
        "version": 1,
        "id": "office.full-grid.v1",
        "status": "owner-coordinate-review",
        "updatedOn": "2026-07-28",
        "map": {"file": repo_path(MAP_PATH), "sha256": sha256_bytes(map_content)},
        "reviewOutput": {"file": repo_path(OUTPUT_PATH), "sha256": sha256_bytes(output_content)},
        "permissions": {
            "deterministicFullImageGrid": True,
            "zoneClassification": False,
            "newCharacterOrPose": False,
            "newFurnitureOrArt": False,
            "activeOfficePromotion": False,
        },
        "activeOfficeBaseline": {
            "file": repo_path(ACTIVE_MAP_PATH),
            "sha256": sha256(ACTIVE_MAP_PATH),
            "mustRemainByteIdentical": True,
        },
    }


def build_outputs() -> dict[Path, bytes]:
    map_content = json_bytes(map_data())
    output_content = png_bytes(render_grid())
    return {
        MAP_PATH: map_content,
        OUTPUT_PATH: output_content,
        MANIFEST_PATH: json_bytes(manifest_data(map_content, output_content)),
    }


def write_or_check(outputs: dict[Path, bytes], check: bool) -> None:
    stale = []
    for path, content in outputs.items():
        if check:
            if not path.exists() or path.read_bytes() != content:
                stale.append(repo_path(path))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
    if stale:
        raise SystemExit("Stale Office full-grid outputs: " + ", ".join(stale))
    action = "verified" if check else "built"
    print(f"Office full-image A1 grid {action}: 43 columns x 24 rows, no zones inferred, Active Office unchanged.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    write_or_check(build_outputs(), args.check)


if __name__ == "__main__":
    main()
