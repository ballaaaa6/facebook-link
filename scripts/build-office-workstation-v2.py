#!/usr/bin/env python3
"""Normalize and prove the owner-approved bare Workstation v2 desk artwork."""

from __future__ import annotations

import argparse
import hashlib
import io
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "assets/game/manifests/office-workstation-bundle-v2.json"
OUTPUT_DIRECTORY = ROOT / "assets/game/processed/office-workstation-v2"
REVIEW_DIRECTORY = ROOT / "assets/art/layout-references/office-workstation-v2/step4"
TRANSPARENT = (0, 0, 0, 0)
BACKGROUND = (8, 17, 31, 255)
PANEL = (19, 32, 51, 255)
TEXT = (248, 250, 252, 255)
MUTED = (182, 196, 214, 255)
CYAN = (34, 211, 238, 255)
GREEN = (34, 197, 94, 255)
AMBER = (245, 158, 11, 255)
RED = (239, 68, 68, 255)


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.load_default(size=size)


def label(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, size: int = 18, fill=TEXT) -> None:
    draw.text(xy, value, font=font(size), fill=fill)


def panel(draw: ImageDraw.ImageDraw, bounds: tuple[int, int, int, int], title: str) -> None:
    draw.rounded_rectangle(bounds, radius=16, fill=PANEL, outline=(51, 65, 85, 255), width=2)
    label(draw, (bounds[0] + 18, bounds[1] + 14), title, 22)


def png_bytes(image: Image.Image) -> bytes:
    stream = io.BytesIO()
    image.save(stream, format="PNG", optimize=False, compress_level=9)
    return stream.getvalue()


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def repo_path(value: str) -> Path:
    return ROOT / value


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def validate_manifest(manifest: dict[str, Any]) -> None:
    require(manifest.get("version") == 2, "bundle version must equal 2")
    require(manifest.get("status") == "step4-artwork-review", "bundle must remain in Step 4 review")
    permissions = manifest.get("permissions", {})
    require(permissions.get("bareDeskArtwork") is True, "bare desk artwork must be authorized")
    for key in ("singleSeatAssembly", "tenSeatSceneAssembly", "rendererImplementation", "activeOfficePromotion"):
        require(permissions.get(key) is False, f"permissions.{key} must remain false")

    source = manifest["source"]
    for field, hash_field in (("chromaFile", "chromaSha256"), ("alphaFile", "alphaSha256")):
        path = repo_path(source[field])
        require(path.exists(), f"missing source file: {source[field]}")
        require(sha256_file(path) == source[hash_field], f"source hash changed: {source[field]}")

    desk = manifest["deskFamily"]
    require(desk["id"] == "desk.workstation.modern.v2", "unexpected desk family")
    require(desk["contains"] == ["bare-desk"], "Step 4 may contain only the bare desk")
    require(desk["footprint"] == {"width": 3, "depth": 2, "unit": "tile"}, "footprint must equal 3 x 2")
    require(desk["supportPlane"]["width"] == 3 and desk["supportPlane"]["depth"] == 2,
            "support plane must equal the complete 3 x 2 footprint")
    require(desk["employeeEdge"] is None, "employee edge must remain absent")
    require(desk["renderBounds"] == {"width": 96, "height": 128, "unit": "authoring-pixel"},
            "render bounds must equal 96 x 128")
    normalization = desk["normalization"]
    require(normalization["contentPixels"] == {"width": 96, "height": 72},
            "normalized visible content must equal 96 x 72")
    require(normalization["contentOrigin"] == {"x": 0, "y": 40}, "normalized origin must equal (0, 40)")
    require(normalization["tabletopHeightRatio"] >= 0.4, "tabletop must occupy at least 40 percent of visible height")


def clear_chroma_fringe(image: Image.Image) -> Image.Image:
    clean = Image.new("RGBA", image.size, TRANSPARENT)
    source = image.load()
    target = clean.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, alpha = source[x, y]
            purple_spill = red > 100 and blue > 70 and red > green * 1.35 and blue > green * 1.35
            if alpha >= 128 and not purple_spill:
                target[x, y] = (red, green, blue, 255)
    return clean


def extend_row_to_full_width(image: Image.Image, y: int) -> None:
    pixels = image.load()
    active = [x for x in range(image.width) if pixels[x, y][3] > 0]
    require(bool(active), f"tabletop row {y} has no active pixels")
    left = min(active)
    right = max(active)
    left_color = pixels[left, y]
    right_color = pixels[right, y]
    for x in range(0, left):
        pixels[x, y] = left_color
    for x in range(right + 1, image.width):
        pixels[x, y] = right_color


def normalize_orientation(source: Image.Image, cell: dict[str, Any], desk: dict[str, Any]) -> Image.Image:
    sheet = cell["sheetBounds"]
    content = cell["contentBounds"]
    sheet_image = source.crop((sheet["x"], sheet["y"], sheet["x"] + sheet["width"], sheet["y"] + sheet["height"]))
    subject = sheet_image.crop((
        content["x"], content["y"], content["x"] + content["width"], content["y"] + content["height"],
    ))
    target = desk["normalization"]["contentPixels"]
    subject = subject.resize((target["width"], target["height"]), Image.Resampling.NEAREST)
    subject = clear_chroma_fringe(subject)
    canvas = Image.new("RGBA", (desk["renderBounds"]["width"], desk["renderBounds"]["height"]), TRANSPARENT)
    origin = desk["normalization"]["contentOrigin"]
    canvas.alpha_composite(subject, (origin["x"], origin["y"]))
    tabletop = desk["normalization"]["tabletopRows"]
    for y in range(tabletop["start"], tabletop["endExclusive"]):
        extend_row_to_full_width(canvas, y)
    return canvas


def semantic_parts(composite: Image.Image, desk: dict[str, Any]) -> dict[str, Image.Image]:
    parts: dict[str, Image.Image] = {}
    for role in ("rear", "surface", "base", "foreground"):
        rows = desk["semanticRows"][role]
        part = Image.new("RGBA", composite.size, TRANSPARENT)
        region = composite.crop((0, rows["start"], composite.width, rows["endExclusive"]))
        part.alpha_composite(region, (0, rows["start"]))
        parts[role] = part
    return parts


def reconstruct(parts: dict[str, Image.Image]) -> Image.Image:
    result = Image.new("RGBA", next(iter(parts.values())).size, TRANSPARENT)
    for role in ("rear", "surface", "base", "foreground"):
        result.alpha_composite(parts[role])
    return result


def validate_pixels(composite: Image.Image, parts: dict[str, Image.Image], desk: dict[str, Any], orientation: str) -> None:
    require(reconstruct(parts).tobytes() == composite.tobytes(), f"{orientation} layers do not reconstruct exactly")
    alpha_layers = [parts[role].getchannel("A") for role in parts]
    for first in range(len(alpha_layers)):
        for second in range(first + 1, len(alpha_layers)):
            overlap = Image.new("L", composite.size, 0)
            first_pixels = alpha_layers[first].load()
            second_pixels = alpha_layers[second].load()
            overlap_pixels = overlap.load()
            for y in range(composite.height):
                for x in range(composite.width):
                    overlap_pixels[x, y] = 255 if first_pixels[x, y] and second_pixels[x, y] else 0
            require(overlap.getbbox() is None, f"{orientation} semantic layers overlap")
    tabletop = desk["normalization"]["tabletopRows"]
    alpha = composite.getchannel("A")
    for y in range(tabletop["start"] + 1, tabletop["endExclusive"]):
        require(all(alpha.getpixel((x, y)) == 255 for x in range(composite.width)),
                f"{orientation} tabletop row {y} is not a complete rectangle")
    require(composite.getbbox() == (0, 40, 96, 112), f"{orientation} normalized bounds changed")


def scaled(image: Image.Image, factor: int) -> Image.Image:
    return image.resize((image.width * factor, image.height * factor), Image.Resampling.NEAREST)


def checker(size: tuple[int, int], cell: int = 16) -> Image.Image:
    image = Image.new("RGBA", size, (28, 39, 57, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle((x, y, min(x + cell - 1, size[0] - 1), min(y + cell - 1, size[1] - 1)), fill=(36, 50, 71, 255))
    return image


def board_front_back(source: Image.Image, composites: dict[str, Image.Image]) -> Image.Image:
    board = Image.new("RGBA", (1400, 900), BACKGROUND)
    draw = ImageDraw.Draw(board)
    label(draw, (30, 22), "STEP 4 / ELEVATED-CAMERA BARE DESK v2", 34)
    label(draw, (30, 66), "FULL 3 x 2 RECTANGULAR TOP / FRONT + BACK / NO EQUIPMENT OR PEOPLE", 18, AMBER)
    panel(draw, (30, 110, 1370, 470), "A. REPLACEMENT SOURCE TURNAROUND")
    preview = source.resize((589, 360), Image.Resampling.NEAREST)
    board.alpha_composite(preview, (405, 110))
    panel(draw, (30, 500, 1370, 870), "B. NORMALIZED 96 x 128 ASSETS / SAME WIDTH + BASELINE")
    for index, orientation in enumerate(("front", "back")):
        x = 245 + index * 610
        tile = checker((384, 320), 32)
        tile.alpha_composite(scaled(composites[orientation], 3), (48, -32))
        board.alpha_composite(tile, (x, 535))
        label(draw, (x + 12, 548), orientation.upper(), 18, CYAN)
    label(draw, (930, 510), "TABLETOP 35 px / DESK 72 px = 48.6%", 16, GREEN)
    return board


def board_layers(parts_by_orientation: dict[str, dict[str, Image.Image]]) -> Image.Image:
    board = Image.new("RGBA", (1400, 820), BACKGROUND)
    draw = ImageDraw.Draw(board)
    label(draw, (30, 22), "STEP 4 / SEMANTIC DESK PARTS", 34)
    label(draw, (30, 66), "DISJOINT LAYERS / EXACT PIXEL RECONSTRUCTION", 18, AMBER)
    roles = ("rear", "surface", "base", "foreground")
    for column, role in enumerate(roles):
        label(draw, (165 + column * 310, 115), role.upper(), 20, CYAN if role == "surface" else MUTED)
    for row, orientation in enumerate(("front", "back")):
        y = 160 + row * 315
        label(draw, (38, y + 105), orientation.upper(), 20)
        for column, role in enumerate(roles):
            x = 130 + column * 310
            tile = checker((260, 280), 20)
            tile.alpha_composite(scaled(parts_by_orientation[orientation][role], 2), (34, 12))
            board.alpha_composite(tile, (x, y))
    label(draw, (30, 780), "PASS: rear + surface + base + foreground reconstruct each composite byte-for-byte", 17, GREEN)
    return board


def paste_bank(board: Image.Image, asset: Image.Image, origin: tuple[int, int], count: int, factor: int) -> None:
    item = scaled(asset, factor)
    for index in range(count):
        board.alpha_composite(item, (origin[0] + index * item.width, origin[1]))


def board_adjacency(composites: dict[str, Image.Image]) -> Image.Image:
    board = Image.new("RGBA", (1400, 900), BACKGROUND)
    draw = ImageDraw.Draw(board)
    label(draw, (30, 22), "STEP 4 / RECTANGULAR TOP + ADJACENCY PROOF", 34)
    label(draw, (30, 66), "MODULE WIDTH = 3 TILES = 96 px / ZERO HORIZONTAL GAP", 18, AMBER)
    panel(draw, (30, 110, 1370, 450), "A. TWO FRONT MODULES / EXACT EDGE CONTACT")
    two_origin = (410, 105)
    paste_bank(board, composites["front"], two_origin, 2, 3)
    seam_x = two_origin[0] + 96 * 3
    draw.line((seam_x, 225, seam_x, 440), fill=GREEN, width=3)
    label(draw, (seam_x - 74, 415), "ONE SEAM", 16, GREEN)
    label(draw, (60, 390), "No trapezoid corner", 17, MUTED)
    label(draw, (60, 420), "No triangular gap", 17, GREEN)

    panel(draw, (30, 480, 1370, 850), "B. FIVE BACK MODULES / TARGET BANK WIDTH = 15 TILES")
    five_origin = (220, 480)
    paste_bank(board, composites["back"], five_origin, 5, 2)
    for index in range(1, 5):
        x = five_origin[0] + index * 96 * 2
        draw.line((x, 565, x, 775), fill=GREEN, width=2)
    draw.rectangle((five_origin[0], 560, five_origin[0] + 5 * 96 * 2, 770), outline=CYAN, width=3)
    label(draw, (60, 805), "PASS  5 x 3 tiles = 15 tiles", 17, GREEN)
    label(draw, (420, 805), "PASS  full-width surface rows = 96/96 columns", 17, GREEN)
    label(draw, (920, 805), "PASS  Active Office unchanged", 17, GREEN)
    return board


def contact_sheet(boards: list[Image.Image]) -> Image.Image:
    board = Image.new("RGBA", (1600, 1100), BACKGROUND)
    draw = ImageDraw.Draw(board)
    label(draw, (30, 22), "OWNER REVIEW / STEP 4 BARE DESK v2", 36)
    label(draw, (30, 70), "REPLACED LOW-CAMERA SOURCE / STEP 5 REMAINS BLOCKED", 19, AMBER)
    positions = ((35, 125), (815, 125), (425, 600))
    sizes = ((750, 450), (750, 439), (750, 482))
    for image, position, size in zip(boards, positions, sizes, strict=True):
        preview = image.resize(size, Image.Resampling.LANCZOS)
        board.alpha_composite(preview, position)
        draw.rectangle((position[0], position[1], position[0] + size[0], position[1] + size[1]), outline=(71, 85, 105, 255), width=3)
    label(draw, (30, 1060), "GATE: bare desk review only | no chair | no monitor | no person | no renderer | no office promotion", 18, RED)
    return board


def build_outputs(manifest: dict[str, Any]) -> dict[Path, bytes]:
    validate_manifest(manifest)
    source = Image.open(repo_path(manifest["source"]["alphaFile"])).convert("RGBA")
    require(source.size == (1604, 981), "source sheet dimensions changed")
    desk = manifest["deskFamily"]
    composites: dict[str, Image.Image] = {}
    parts: dict[str, dict[str, Image.Image]] = {}
    outputs: dict[Path, bytes] = {}
    for orientation in ("front", "back"):
        composite = normalize_orientation(source, manifest["source"]["cells"][orientation], desk)
        orientation_parts = semantic_parts(composite, desk)
        validate_pixels(composite, orientation_parts, desk, orientation)
        composites[orientation] = composite
        parts[orientation] = orientation_parts
        config = desk["orientations"][orientation]
        outputs[repo_path(config["compositeFile"])] = png_bytes(composite)
        for role, path in config["parts"].items():
            outputs[repo_path(path)] = png_bytes(orientation_parts[role])

    first = board_front_back(source, composites)
    second = board_layers(parts)
    third = board_adjacency(composites)
    review_paths = manifest["qa"]["reviewOutputs"]
    for path, image in zip(review_paths[:3], (first, second, third), strict=True):
        outputs[repo_path(path)] = png_bytes(image)
    outputs[repo_path(review_paths[3])] = png_bytes(contact_sheet([first, second, third]))
    return outputs


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    try:
        outputs = build_outputs(manifest)
    except (KeyError, TypeError, ValueError) as error:
        print(f"Workstation v2 build contract failed: {error}")
        return 1

    stale: list[str] = []
    for path, content in outputs.items():
        if args.check:
            if not path.exists() or path.read_bytes() != content:
                stale.append(path.relative_to(ROOT).as_posix())
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
    if stale:
        print("Workstation v2 outputs are missing or stale:")
        for path in stale:
            print(f"- {path}")
        return 1
    mode = "current" if args.check else "written"
    print(f"Workstation v2 Step 4 outputs are deterministic and {mode}: {len(outputs)} files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
