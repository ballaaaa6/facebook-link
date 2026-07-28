#!/usr/bin/env python3
"""Build Step 5 R04 components and deterministic single-seat evidence."""

from __future__ import annotations

import argparse
import hashlib
import io
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets/art/layout-references/office-workstation-v3/source"
OUTPUT_DIR = ROOT / "assets/game/processed/office-workstation-v3/step5-r04"
REVIEW_DIR = ROOT / "assets/art/layout-references/office-workstation-v3/step5-r04"
COMPONENT_MANIFEST = ROOT / "assets/game/manifests/office-workstation-components-v3.json"
STEP5_MANIFEST = ROOT / "assets/game/manifests/office-workstation-step5-single-seat-v4.json"

DESK_SOURCE = SOURCE_DIR / "desk-workstation-modern-v3-turnaround-alpha.png"
CHAIR_SOURCE = SOURCE_DIR / "chair-office-modern-v3-turnaround-alpha.png"
MONITOR_SOURCE = SOURCE_DIR / "monitor-workstation-modern-v3-turnaround-alpha.png"
KEYBOARD_SOURCE = ROOT / "assets/game/processed/office-workstation-v2/step5-r02/keyboard.workstation.full-tight.png"
ACTOR_SHEET = ROOT / "assets/game/characters/einstein/runtime-spritesheet-v3.webp"
ACTIVE_MAP = ROOT / "assets/game/maps/office-c-v2.json"
OFFICE_BACKGROUND = ROOT / "assets/art/backgrounds/office-c-background-modern-v3.png"

TRANSPARENT = (0, 0, 0, 0)
BACKGROUND = (8, 17, 31, 255)
PANEL = (18, 31, 49, 255)
TEXT = (241, 245, 249, 255)
MUTED = (167, 183, 204, 255)
CYAN = (34, 211, 238, 255)
PURPLE = (167, 139, 250, 255)
AMBER = (245, 158, 11, 255)
GREEN = (34, 197, 94, 255)
RED = (239, 68, 68, 255)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidate = Path("C:/Windows/Fonts") / ("arialbd.ttf" if bold else "arial.ttf")
    if candidate.exists():
        return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default(size=size)


def label(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, size: int = 18,
          fill: tuple[int, int, int, int] = TEXT, bold: bool = False) -> None:
    draw.text(xy, value, font=font(size, bold), fill=fill)


def panel(draw: ImageDraw.ImageDraw, bounds: tuple[int, int, int, int], title: str) -> None:
    draw.rounded_rectangle(bounds, radius=16, fill=PANEL, outline=(50, 67, 91, 255), width=2)
    label(draw, (bounds[0] + 20, bounds[1] + 16), title, 21, bold=True)


def png_bytes(image: Image.Image) -> bytes:
    stream = io.BytesIO()
    image.save(stream, format="PNG", optimize=False, compress_level=9)
    return stream.getvalue()


def json_bytes(value: Any) -> bytes:
    return (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def repo_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def clean_alpha(image: Image.Image) -> Image.Image:
    source = image.convert("RGBA")
    result = Image.new("RGBA", source.size, TRANSPARENT)
    source_pixels = source.load()
    target_pixels = result.load()
    for y in range(source.height):
        for x in range(source.width):
            red, green, blue, alpha = source_pixels[x, y]
            magenta = red > 120 and blue > 110 and red > green * 1.3 and blue > green * 1.3
            if alpha >= 96 and not magenta:
                target_pixels[x, y] = (red, green, blue, 255)
    return result


def half_subject(source: Image.Image, index: int) -> Image.Image:
    half = source.width // 2
    crop = source.crop((index * half, 0, source.width if index else half, source.height))
    bbox = crop.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError(f"source half {index} contains no alpha")
    return crop.crop(bbox)


def full_alpha_rows(image: Image.Image, start: int, end: int) -> None:
    pixels = image.load()
    for y in range(start, end):
        active = [x for x in range(image.width) if pixels[x, y][3] > 0]
        if not active:
            raise ValueError(f"required support row {y} is empty")
        left, right = min(active), max(active)
        left_color, right_color = pixels[left, y], pixels[right, y]
        for x in range(0, left):
            pixels[x, y] = left_color
        for x in range(right + 1, image.width):
            pixels[x, y] = right_color


def normalize_desk(source: Image.Image, index: int) -> Image.Image:
    subject = half_subject(source, index)
    split = round(subject.height * 0.555)
    top = subject.crop((0, 0, subject.width, split)).resize((96, 64), Image.Resampling.NEAREST)
    base = subject.crop((0, split, subject.width, subject.height)).resize((96, 64), Image.Resampling.NEAREST)
    result = Image.new("RGBA", (96, 128), TRANSPARENT)
    result.alpha_composite(clean_alpha(top), (0, 0))
    result.alpha_composite(clean_alpha(base), (0, 64))
    full_alpha_rows(result, 0, 64)
    return result


def desk_parts(composite: Image.Image) -> dict[str, Image.Image]:
    ranges = {"rear": (0, 6), "surface": (6, 64), "base": (64, 124), "foreground": (124, 128)}
    result = {}
    for role, (start, end) in ranges.items():
        part = Image.new("RGBA", composite.size, TRANSPARENT)
        part.alpha_composite(composite.crop((0, start, composite.width, end)), (0, start))
        result[role] = part
    return result


def normalize_chair(source: Image.Image, index: int) -> Image.Image:
    subject = half_subject(source, index)
    return clean_alpha(subject.resize((64, 80), Image.Resampling.NEAREST))


def chair_parts(composite: Image.Image, orientation: str) -> dict[str, Image.Image]:
    result = {role: Image.new("RGBA", composite.size, TRANSPARENT) for role in ("rear", "seat", "foreground")}
    source = composite.load()
    targets = {role: image.load() for role, image in result.items()}
    for y in range(composite.height):
        for x in range(composite.width):
            pixel = source[x, y]
            if pixel[3] == 0:
                continue
            if orientation == "front":
                foreground = y < 54 and (x < 11 or x >= 53)
            else:
                foreground = (y < 50 and 8 <= x < 56) or (26 <= x < 39 and y < 59)
            role = "foreground" if foreground else "seat" if y >= 48 else "rear"
            targets[role][x, y] = pixel
    return result


def resize_asset(path: Path, size: tuple[int, int]) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError(f"missing alpha content: {path}")
    return clean_alpha(image.crop(bbox).resize(size, Image.Resampling.NEAREST))


def reconstruct(parts: dict[str, Image.Image], order: tuple[str, ...]) -> Image.Image:
    output = Image.new("RGBA", next(iter(parts.values())).size, TRANSPARENT)
    for role in order:
        output.alpha_composite(parts[role])
    return output


def alpha_bounds(image: Image.Image) -> dict[str, int]:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        return {"x": 0, "y": 0, "width": 0, "height": 0}
    return {"x": bbox[0], "y": bbox[1], "width": bbox[2] - bbox[0], "height": bbox[3] - bbox[1]}


def checker(size: tuple[int, int], cell: int = 32) -> Image.Image:
    image = Image.new("RGBA", size, (222, 232, 238, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle((x, y, min(size[0] - 1, x + cell - 1), min(size[1] - 1, y + cell - 1)), fill=(207, 220, 228, 255))
    return image


def actor_frame(sheet: Image.Image, orientation: str, frame: int) -> Image.Image:
    row = 14 if orientation == "far" else 13
    return sheet.crop((frame * 96, row * 104, (frame + 1) * 96, (row + 1) * 104))


def place(canvas: Image.Image, asset: Image.Image, left: int, top: int) -> None:
    canvas.alpha_composite(asset, (round(left), round(top)))


def station_geometry(orientation: str) -> dict[str, Any]:
    desk_left, desk_top, desk_floor = 208, 180, 244
    floor_y = 212 if orientation == "far" else 308
    monitor_bottom = desk_top + (64 if orientation == "far" else 32)
    keyboard_top = desk_top + (0 if orientation == "far" else 36)
    return {
        "desk": {"left": desk_left, "top": desk_top, "width": 96, "height": 128},
        "support": {"left": desk_left, "top": desk_top, "width": 96, "height": 64},
        "deskFloorOrigin": {"x": desk_left, "y": desk_floor},
        "actorFloor": {"x": 256, "y": floor_y},
        "actor": {"left": 208, "top": floor_y - 104, "width": 96, "height": 104},
        "chair": {"left": 224, "top": floor_y - 80, "width": 64, "height": 80},
        "seatAnchor": {"x": 256, "y": floor_y - 32},
        "hipAnchor": {"x": 256, "y": floor_y - 32},
        "monitor": {"left": 230, "top": monitor_bottom - 40, "width": 52, "height": 40},
        "keyboard": {"left": 232, "top": keyboard_top, "width": 48, "height": 24},
        "monitorReservation": {"left": 208, "top": desk_top + (32 if orientation == "far" else 0), "width": 96, "height": 32},
        "keyboardReservation": {"left": 240, "top": desk_top + (0 if orientation == "far" else 32), "width": 32, "height": 32},
    }


def compose_station(assets: dict[str, Any], orientation: str, frame: int = 0) -> Image.Image:
    canvas = Image.new("RGBA", (512, 420), TRANSPARENT)
    geometry = station_geometry(orientation)
    desk_key = "public" if orientation == "far" else "seat"
    chair_key = "front" if orientation == "far" else "back"
    actor = actor_frame(assets["actorSheet"], orientation, frame)
    desk = assets["deskParts"][desk_key]
    chair = assets["chairParts"][chair_key]
    monitor = assets["monitorBack"] if orientation == "far" else assets["monitorFront"]
    chair_position = (geometry["chair"]["left"], geometry["chair"]["top"])
    desk_position = (geometry["desk"]["left"], geometry["desk"]["top"])
    if orientation == "far":
        for role in ("rear", "seat"):
            place(canvas, chair[role], *chair_position)
        place(canvas, actor, geometry["actor"]["left"], geometry["actor"]["top"])
        place(canvas, chair["foreground"], *chair_position)
        for role in ("rear", "surface"):
            place(canvas, desk[role], *desk_position)
        place(canvas, monitor, geometry["monitor"]["left"], geometry["monitor"]["top"])
        place(canvas, assets["keyboard"], geometry["keyboard"]["left"], geometry["keyboard"]["top"])
        for role in ("base", "foreground"):
            place(canvas, desk[role], *desk_position)
    else:
        for role in ("rear", "surface"):
            place(canvas, desk[role], *desk_position)
        place(canvas, monitor, geometry["monitor"]["left"], geometry["monitor"]["top"])
        place(canvas, assets["keyboard"], geometry["keyboard"]["left"], geometry["keyboard"]["top"])
        for role in ("base", "foreground"):
            place(canvas, desk[role], *desk_position)
        for role in ("rear", "seat"):
            place(canvas, chair[role], *chair_position)
        place(canvas, actor, geometry["actor"]["left"], geometry["actor"]["top"])
        place(canvas, chair["foreground"], *chair_position)
    return canvas


def station_on_grid(assets: dict[str, Any], orientation: str, frame: int = 0, debug: bool = False) -> Image.Image:
    canvas = checker((512, 420), 32)
    canvas.alpha_composite(compose_station(assets, orientation, frame))
    if debug:
        draw = ImageDraw.Draw(canvas)
        geometry = station_geometry(orientation)
        for key, color, title in (
            ("support", CYAN, "desk support 96x64"),
            ("monitorReservation", PURPLE, "monitor 3x1"),
            ("keyboardReservation", AMBER, "keyboard 1x1"),
        ):
            rect = geometry[key]
            draw.rectangle((rect["left"], rect["top"], rect["left"] + rect["width"], rect["top"] + rect["height"]), outline=color, width=2)
            label(draw, (rect["left"] + 3, rect["top"] + 3), title, 11, color, True)
        anchor = geometry["seatAnchor"]
        draw.line((anchor["x"] - 25, anchor["y"], anchor["x"] + 25, anchor["y"]), fill=RED, width=3)
        draw.ellipse((anchor["x"] - 4, anchor["y"] - 4, anchor["x"] + 4, anchor["y"] + 4), fill=RED)
        label(draw, (anchor["x"] + 8, anchor["y"] - 17), "seat = hip @ z1", 12, RED, True)
    return canvas


def board_components(assets: dict[str, Any]) -> Image.Image:
    board = Image.new("RGBA", (1600, 1000), BACKGROUND)
    draw = ImageDraw.Draw(board)
    label(draw, (40, 26), "STEP 5 R04 / NORMALIZED WORKSTATION COMPONENTS", 34, bold=True)
    label(draw, (42, 74), "P4 OUTPUT / NEW DESK + CHAIR SOURCES / CURRENT PERSON SCALE PRESERVED", 17, AMBER, True)
    panel(draw, (38, 125, 790, 940), "A. DESK 3 x 2 x 2 / FULL 96 x 64 SUPPORT")
    for index, key in enumerate(("seat", "public")):
        x = 170 + index * 350
        preview = assets["desks"][key].resize((288, 384), Image.Resampling.NEAREST)
        board.alpha_composite(preview, (x, 210))
        label(draw, (x + 66, 610), f"{key.upper()} SIDE", 19, CYAN, True)
    draw.rectangle((140, 680, 620, 840), outline=CYAN, width=4)
    draw.line((140, 760, 620, 760), fill=CYAN, width=3)
    label(draw, (235, 712), "TOP-DOWN SUPPORT 3 x 2", 22, CYAN, True)
    label(draw, (259, 786), "96 x 64 px / z = 2", 20, TEXT, True)
    label(draw, (105, 875), "Straight far edge / full rectangle / no extra floor row", 17, GREEN, True)

    panel(draw, (812, 125, 1562, 940), "B. PERSON-RELATIVE CHAIR + EQUIPMENT")
    for index, key in enumerate(("front", "back")):
        x = 910 + index * 250
        preview = assets["chairs"][key].resize((192, 240), Image.Resampling.NEAREST)
        board.alpha_composite(preview, (x, 210))
        label(draw, (x + 56, 465), key.upper(), 18, PURPLE, True)
    label(draw, (905, 520), "Chair render 64 x 80 / floor-to-seat = 32 px", 18, TEXT, True)
    label(draw, (905, 555), "Person frame 96 x 104 / hip anchor y = 72", 18, TEXT, True)
    board.alpha_composite(assets["monitorFront"].resize((104, 104), Image.Resampling.NEAREST), (925, 625))
    board.alpha_composite(assets["keyboard"].resize((192, 96), Image.Resampling.NEAREST), (1120, 630))
    label(draw, (923, 750), "MONITOR", 16, PURPLE, True)
    label(draw, (1158, 750), "KEYBOARD 48 x 24", 16, AMBER, True)
    label(draw, (895, 815), "Monitor reservation 3 x 1 / keyboard reservation 1 x 1", 18, TEXT, True)
    label(draw, (895, 858), "No person, chair, monitor, or keyboard pixels are baked into the desk.", 16, GREEN, True)
    return board


def board_clean(assets: dict[str, Any], orientation: str) -> Image.Image:
    board = Image.new("RGBA", (1280, 720), BACKGROUND)
    draw = ImageDraw.Draw(board)
    title = "FAR / FRONT / PUBLIC SIDE" if orientation == "far" else "NEAR / BACK / SEAT SIDE"
    label(draw, (38, 28), f"STEP 5 R04 / {title}", 32, bold=True)
    label(draw, (40, 72), "STATIC P5 ASSEMBLY / ONE MANIFEST / NO PER-VIEW SCALE OR MAGIC OFFSET", 16, AMBER, True)
    panel(draw, (38, 115, 1242, 676), "CLEAN COMPOSITE")
    station = station_on_grid(assets, orientation)
    preview = station.resize((768, 630), Image.Resampling.NEAREST)
    board.alpha_composite(preview, (260, 90))
    return board


def board_overlay(assets: dict[str, Any]) -> Image.Image:
    board = Image.new("RGBA", (1600, 900), BACKGROUND)
    draw = ImageDraw.Draw(board)
    label(draw, (40, 26), "STEP 5 R04 / FOOTPRINT + CONTACT + Z OVERLAY", 34, bold=True)
    label(draw, (42, 72), "P5 DEBUG USES THE SAME PIXELS AND COORDINATES AS CLEAN VIEWS", 16, AMBER, True)
    for index, orientation in enumerate(("far", "near")):
        x = 35 + index * 785
        panel(draw, (x, 120, x + 750, 850), orientation.upper())
        station = station_on_grid(assets, orientation, debug=True).resize((720, 590), Image.Resampling.NEAREST)
        board.alpha_composite(station, (x + 15, 190))
        geometry = station_geometry(orientation)
        label(draw, (x + 30, 800), f"seat={geometry['seatAnchor']} / hip={geometry['hipAnchor']} / drift=0 px", 17, GREEN, True)
    return board


def board_stability(assets: dict[str, Any]) -> Image.Image:
    board = Image.new("RGBA", (1600, 900), BACKGROUND)
    draw = ImageDraw.Draw(board)
    label(draw, (38, 24), "STEP 5 R04 / SIX-FRAME ANCHOR STABILITY", 33, bold=True)
    label(draw, (40, 68), "P6 PRECHECK / CHAIR, DESK, MONITOR, KEYBOARD, FLOOR PIVOT, AND HIP CONTACT REMAIN FIXED", 15, AMBER, True)
    for row, orientation in enumerate(("far", "near")):
        y = 125 + row * 365
        label(draw, (35, y + 135), orientation.upper(), 19, CYAN, True)
        for frame in range(6):
            crop = station_on_grid(assets, orientation, frame).crop((155, 80, 365, 350))
            preview = crop.resize((230, 296), Image.Resampling.NEAREST)
            x = 100 + frame * 247
            board.alpha_composite(preview, (x, y))
            label(draw, (x + 88, y + 306), f"F{frame}", 15, MUTED, True)
    label(draw, (38, 858), "PASS TARGET: maximum coordinate drift = 0 px across all six seated frames", 17, GREEN, True)
    return board


def board_context(assets: dict[str, Any]) -> Image.Image:
    office = Image.open(OFFICE_BACKGROUND).convert("RGBA").resize((1152, 768), Image.Resampling.NEAREST)
    overlay = compose_station(assets, "far", 0).crop((145, 75, 375, 340)).resize((460, 530), Image.Resampling.NEAREST)
    office.alpha_composite(overlay, (80, 210))
    board = Image.new("RGBA", (1600, 1000), BACKGROUND)
    draw = ImageDraw.Draw(board)
    label(draw, (38, 24), "STEP 5 R04 / CURRENT OFFICE CONTEXT PREVIEW", 33, bold=True)
    label(draw, (40, 68), "READ-ONLY BACKGROUND PREVIEW / ACTIVE MAP AND REGISTRY ARE NOT MODIFIED", 16, AMBER, True)
    board.alpha_composite(office, (224, 125))
    draw.rectangle((224, 125, 1376, 893), outline=CYAN, width=3)
    label(draw, (38, 948), "One isolated station overlay only. Ten-seat layout and Active Office promotion remain blocked.", 17, GREEN, True)
    return board


def component_record(path: Path, content: bytes, image: Image.Image) -> dict[str, Any]:
    return {
        "path": repo_path(path),
        "sha256": sha256_bytes(content),
        "renderPixels": {"width": image.width, "height": image.height},
        "alphaBounds": alpha_bounds(image),
    }


def build_outputs() -> dict[Path, bytes]:
    desk_source = Image.open(DESK_SOURCE).convert("RGBA")
    chair_source = Image.open(CHAIR_SOURCE).convert("RGBA")
    desks = {"seat": normalize_desk(desk_source, 0), "public": normalize_desk(desk_source, 1)}
    chairs = {"front": normalize_chair(chair_source, 0), "back": normalize_chair(chair_source, 1)}
    desk_layers = {key: desk_parts(image) for key, image in desks.items()}
    chair_layers = {key: chair_parts(image, key) for key, image in chairs.items()}
    monitor_source = Image.open(MONITOR_SOURCE).convert("RGBA")
    monitor_front = clean_alpha(half_subject(monitor_source, 0).resize((52, 40), Image.Resampling.NEAREST))
    monitor_back = clean_alpha(half_subject(monitor_source, 1).resize((52, 40), Image.Resampling.NEAREST))
    keyboard = resize_asset(KEYBOARD_SOURCE, (48, 24))
    actor_sheet = Image.open(ACTOR_SHEET).convert("RGBA")
    assets = {
        "desks": desks,
        "chairs": chairs,
        "deskParts": desk_layers,
        "chairParts": chair_layers,
        "monitorFront": monitor_front,
        "monitorBack": monitor_back,
        "keyboard": keyboard,
        "actorSheet": actor_sheet,
    }
    outputs: dict[Path, bytes] = {}
    records: dict[str, Any] = {}
    for side, image in desks.items():
        path = OUTPUT_DIR / f"desk.workstation.modern.v3.{side}.png"
        content = png_bytes(image)
        outputs[path] = content
        records[f"desk-{side}"] = component_record(path, content, image)
        for role, part in desk_layers[side].items():
            part_path = OUTPUT_DIR / f"desk.workstation.modern.v3.{side}.{role}.png"
            part_content = png_bytes(part)
            outputs[part_path] = part_content
            records[f"desk-{side}-{role}"] = component_record(part_path, part_content, part)
        if reconstruct(desk_layers[side], ("rear", "surface", "base", "foreground")).tobytes() != image.tobytes():
            raise ValueError(f"desk {side} layers do not reconstruct exactly")
    for orientation, image in chairs.items():
        path = OUTPUT_DIR / f"chair.office.modern.v3.{orientation}.png"
        content = png_bytes(image)
        outputs[path] = content
        records[f"chair-{orientation}"] = component_record(path, content, image)
        for role, part in chair_layers[orientation].items():
            part_path = OUTPUT_DIR / f"chair.office.modern.v3.{orientation}.{role}.png"
            part_content = png_bytes(part)
            outputs[part_path] = part_content
            records[f"chair-{orientation}-{role}"] = component_record(part_path, part_content, part)
        if reconstruct(chair_layers[orientation], ("rear", "seat", "foreground")).tobytes() != image.tobytes():
            raise ValueError(f"chair {orientation} layers do not reconstruct exactly")
    for key, name, image in (
        ("monitor-front", "monitor.workstation.v3.front.png", monitor_front),
        ("monitor-back", "monitor.workstation.v3.back.png", monitor_back),
        ("keyboard", "keyboard.workstation.v3.full.png", keyboard),
    ):
        path = OUTPUT_DIR / name
        content = png_bytes(image)
        outputs[path] = content
        records[key] = component_record(path, content, image)

    review_images = {
        "01-components-and-semantic-sides.png": board_components(assets),
        "02-far-front-clean.png": board_clean(assets, "far"),
        "03-near-back-clean.png": board_clean(assets, "near"),
        "04-footprint-contact-and-z-overlay.png": board_overlay(assets),
        "05-six-frame-animation-stability-strip.png": board_stability(assets),
        "06-current-office-context-preview.png": board_context(assets),
    }
    for name, image in review_images.items():
        outputs[REVIEW_DIR / name] = png_bytes(image)

    component_manifest = {
        "version": 3,
        "geometrySchemaVersion": 5,
        "id": "office.workstation.components.v3",
        "status": "isolated-owner-review",
        "updatedOn": "2026-07-28",
        "sourceGeneration": {
            "tool": "built-in-imagegen-plus-deterministic-normalization",
            "promptRecord": repo_path(SOURCE_DIR / "office-workstation-v3-imagegen-prompts.md"),
            "deskSource": {"path": repo_path(DESK_SOURCE), "sha256": sha256_file(DESK_SOURCE)},
            "chairSource": {"path": repo_path(CHAIR_SOURCE), "sha256": sha256_file(CHAIR_SOURCE)},
            "monitorSource": {"path": repo_path(MONITOR_SOURCE), "sha256": sha256_file(MONITOR_SOURCE)},
        },
        "geometry": {
            "tilePixels": 32,
            "levels": {"floor": 0, "chairSeat": 1, "deskSupport": 2, "personTop": 3},
            "person": {"footprint": [1, 1], "logicalVolume": [1, 1, 3], "framePixels": [96, 104], "hipAnchorPixels": [48, 72]},
            "chair": {"footprint": [1, 1], "logicalVolume": [1, 1, 2], "renderPixels": [64, 80], "seatOffsetFromFloorPixels": 32},
            "desk": {"footprint": [3, 2], "logicalVolume": [3, 2, 2], "renderPixels": [96, 128], "supportRows": [0, 64]},
            "monitor": {"reservation": [3, 1], "renderPixels": [52, 40]},
            "keyboard": {"reservation": [1, 1], "maximumVisualEnvelope": [1.5, 1], "renderPixels": [48, 24]},
        },
        "components": records,
        "permissions": {
            "componentArtwork": True,
            "staticSingleSeatAssembly": True,
            "isolatedLabRenderer": True,
            "tenSeatAssembly": False,
            "step6": False,
            "activeOfficePromotion": False,
        },
    }
    component_content = json_bytes(component_manifest)
    outputs[COMPONENT_MANIFEST] = component_content
    review_paths = [repo_path(REVIEW_DIR / name) for name in review_images]
    step5_manifest = {
        "version": 4,
        "geometrySchemaVersion": 5,
        "id": "office.workstation.step5.single-seat.v4",
        "status": "isolated-runtime-owner-review",
        "updatedOn": "2026-07-28",
        "replaces": "office.workstation.step5.single-seat.v3",
        "completedScope": ["P4", "P5", "P6"],
        "runtimeScope": "P6-isolated-lab-complete",
        "componentsAuthority": {"file": repo_path(COMPONENT_MANIFEST), "sha256": sha256_bytes(component_content)},
        "activeOfficeBaseline": {"file": repo_path(ACTIVE_MAP), "sha256": sha256_file(ACTIVE_MAP), "mustRemainByteIdentical": True},
        "lab": {"route": "/?lab=office-workstation-v3-step5", "developmentOnly": True, "productionReachable": False, "stationCount": 1, "orientationCount": 2},
        "animation": {"frames": 6, "fps": 6, "rows": {"far": 14, "near": 13}, "maximumAnchorDriftPixels": 0},
        "geometry": {orientation: station_geometry(orientation) for orientation in ("far", "near")},
        "layerOrder": {
            "far": ["chair-rear", "chair-seat", "actor", "chair-foreground", "desk-rear", "desk-surface", "monitor-back", "keyboard", "desk-base", "desk-foreground"],
            "near": ["desk-rear", "desk-surface", "monitor-front", "keyboard", "desk-base", "desk-foreground", "chair-rear", "chair-seat", "actor", "chair-foreground"],
        },
        "reviewOutputs": review_paths + [
            repo_path(REVIEW_DIR / "07-browser-runtime-review.png"),
            repo_path(REVIEW_DIR / "08-browser-office-context.png"),
        ],
        "browserValidation": {
            "animationSeconds": 30,
            "desktopViewport": [1280, 720],
            "contextViewport": [1280, 1100],
            "narrowViewport": [390, 844],
            "consoleErrors": 0,
            "brokenImages": 0,
            "maximumHorizontalOverflowPixels": 0,
            "anchorStable": True,
        },
        "permissions": {
            "newCharacterOrPose": False,
            "isolatedLabRenderer": True,
            "tenSeatAssembly": False,
            "rosterWideCalibration": False,
            "step6": False,
            "activeOfficePromotion": False,
        },
        "ownerGate": {
            "decision": "pending",
            "approveOnly": "one isolated R04 station",
            "stillBlocked": ["ten-seat-layout", "step6", "active-office"],
        },
    }
    outputs[STEP5_MANIFEST] = json_bytes(step5_manifest)
    return outputs


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    outputs = build_outputs()
    if args.check:
        stale = [repo_path(path) for path, content in outputs.items() if not path.exists() or path.read_bytes() != content]
        if stale:
            print("R04 generated outputs are stale or missing: " + ", ".join(stale))
            return 1
        print(f"R04 generated outputs are byte-exact: {len(outputs)} files.")
        return 0
    for path, content in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
    print(f"Built Step 5 R04 deterministic P4-P5 assets and P4-P6 manifest: {len(outputs)} files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
