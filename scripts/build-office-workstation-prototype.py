#!/usr/bin/env python3
"""Build the deterministic Workstation Bundle v1 desk prototype."""

from __future__ import annotations

import argparse
import io
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets/game/processed/office-workstation-v1"
SOURCE = ROOT / "assets/art/layout-references/office-workstation-v1"
SIZE = 160
TRANSPARENT = (0, 0, 0, 0)
OUTLINE = (15, 23, 42, 255)
PANEL = (51, 65, 85, 255)
PANEL_LIGHT = (100, 116, 139, 255)
SURFACE = (226, 232, 240, 255)
SURFACE_LIGHT = (248, 250, 252, 255)
CYAN = (34, 211, 238, 255)
AMBER = (245, 158, 11, 255)
MAGENTA = (255, 0, 255, 255)


def rect(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill: tuple[int, int, int, int], outline=OUTLINE) -> None:
    draw.rectangle(box, fill=outline)
    x0, y0, x1, y1 = box
    if x1 - x0 > 3 and y1 - y0 > 3:
        draw.rectangle((x0 + 2, y0 + 2, x1 - 2, y1 - 2), fill=fill)


def front_parts() -> dict[str, Image.Image]:
    parts = {name: Image.new("RGBA", (SIZE, SIZE), TRANSPARENT) for name in ("rear", "surface", "base", "foreground")}

    rear = ImageDraw.Draw(parts["rear"])
    rect(rear, (0, 13, 159, 25), PANEL)
    rear.rectangle((8, 16, 151, 18), fill=PANEL_LIGHT)
    rear.rectangle((16, 21, 143, 23), fill=CYAN)

    surface = ImageDraw.Draw(parts["surface"])
    rect(surface, (0, 24, 159, 119), SURFACE)
    surface.rectangle((4, 28, 155, 32), fill=SURFACE_LIGHT)
    for x in range(32, 160, 32):
        surface.rectangle((x - 1, 34, x, 115), fill=(148, 163, 184, 255))
    for y in (56, 88):
        surface.rectangle((4, y, 155, y + 1), fill=(148, 163, 184, 255))
    surface.rectangle((4, 115, 155, 117), fill=AMBER)

    base = ImageDraw.Draw(parts["base"])
    rect(base, (8, 112, 23, 145), PANEL)
    rect(base, (136, 112, 151, 145), PANEL)
    rect(base, (20, 126, 139, 137), PANEL)
    base.rectangle((24, 129, 135, 131), fill=PANEL_LIGHT)

    foreground = ImageDraw.Draw(parts["foreground"])
    rect(foreground, (0, 108, 159, 124), PANEL)
    foreground.rectangle((6, 111, 153, 114), fill=PANEL_LIGHT)
    foreground.rectangle((12, 120, 147, 122), fill=CYAN)
    return parts


def orient(image: Image.Image, orientation: str) -> Image.Image:
    if orientation == "front":
        return image
    if orientation == "back":
        return image.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    if orientation == "left":
        return image.rotate(90, resample=Image.Resampling.NEAREST)
    return image.rotate(-90, resample=Image.Resampling.NEAREST)


def png_bytes(image: Image.Image) -> bytes:
    stream = io.BytesIO()
    image.save(stream, format="PNG", optimize=False, compress_level=9)
    return stream.getvalue()


def build_files() -> dict[Path, bytes]:
    canonical = front_parts()
    oriented: dict[str, dict[str, Image.Image]] = {}
    files: dict[Path, bytes] = {}
    for orientation in ("front", "back", "left", "right"):
        oriented[orientation] = {}
        for part_name, source in canonical.items():
            image = orient(source, orientation)
            oriented[orientation][part_name] = image
            files[OUTPUT / f"desk.modular.{orientation}.{part_name}.png"] = png_bytes(image)

    source_sheet = Image.new("RGBA", (SIZE * 4, SIZE), MAGENTA)
    for index, orientation in enumerate(("front", "back", "left", "right")):
        composite = Image.new("RGBA", (SIZE, SIZE), TRANSPARENT)
        for part_name in ("rear", "surface", "base", "foreground"):
            composite.alpha_composite(oriented[orientation][part_name])
        source_sheet.alpha_composite(composite, (index * SIZE, 0))
    files[SOURCE / "office-workstation-modular-v1-source.png"] = png_bytes(source_sheet)

    contact = Image.new("RGBA", (SIZE * 2, SIZE * 2), (17, 24, 39, 255))
    for index, orientation in enumerate(("front", "back", "left", "right")):
        composite = Image.new("RGBA", (SIZE, SIZE), TRANSPARENT)
        for part_name in ("rear", "surface", "base", "foreground"):
            composite.alpha_composite(oriented[orientation][part_name])
        contact.alpha_composite(composite, ((index % 2) * SIZE, (index // 2) * SIZE))
    files[OUTPUT / "contact-sheet.png"] = png_bytes(contact)
    return files


def write_metadata(check: bool) -> bool:
    metadata = {
        "id": "desk.modular.v1",
        "status": "accepted-staging",
        "generator": "scripts/build-office-workstation-prototype.py",
        "deterministic": True,
        "license": "project-authored",
        "commercialReviewRequired": False,
        "source": "assets/art/layout-references/office-workstation-v1/office-workstation-modular-v1-source.png",
        "physicalScaleTiles": {"width": 5, "depth": 4, "height": 2.4},
        "supportPlaneTiles": {"width": 5, "depth": 3},
        "renderBoxPixels": {"width": 160, "height": 160},
        "parts": ["rear", "surface", "base", "foreground"],
        "orientations": ["front", "back", "left", "right"],
        "containsEquipment": False,
        "containsChair": False,
        "containsCharacter": False,
    }
    expected = json.dumps(metadata, indent=2, sort_keys=True) + "\n"
    path = OUTPUT / "provenance.json"
    if check:
        return path.exists() and path.read_text(encoding="utf-8") == expected
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(expected, encoding="utf-8")
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    expected = build_files()
    stale: list[str] = []
    for path, content in expected.items():
        if args.check:
            if not path.exists() or path.read_bytes() != content:
                stale.append(path.relative_to(ROOT).as_posix())
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
    if not write_metadata(args.check):
        stale.append((OUTPUT / "provenance.json").relative_to(ROOT).as_posix())
    if stale:
        print("Workstation prototype outputs are missing or stale:")
        for path in stale:
            print(f"- {path}")
        return 1
    print("Workstation prototype outputs are deterministic and current.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
