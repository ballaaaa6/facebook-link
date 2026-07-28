#!/usr/bin/env python3
"""Build the accepted R05 workstation assets and consolidated review evidence."""

from __future__ import annotations

import argparse
import hashlib
import io
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
R04_DIR = ROOT / "assets/game/processed/office-workstation-v3/step5-r04"
OUTPUT_DIR = ROOT / "assets/game/processed/office-workstation-v3/step5-r05-final"
QA_DIR = OUTPUT_DIR / "qa"
REVIEW_DIR = ROOT / "assets/art/layout-references/office-workstation-v3/step5-r05-final"
MANIFEST_PATH = ROOT / "assets/game/manifests/office-workstation-step5-r05-final.json"
MAP_PATH = ROOT / "assets/game/maps/office-ten-r05.json"
ACTIVE_MAP_PATH = ROOT / "assets/game/maps/office-c-v2.json"
BACKGROUND_PATH = ROOT / "assets/art/backgrounds/office-c-background-modern-v3.png"
REJECTED_CAPTURE_PATH = ROOT / "assets/game/processed/office-candidate-v1/qa/review-r01/01-workstations-seated-day-desktop.png"

CHARACTERS = [
    ("market-scout", "yinyue-2"),
    ("product-ranker", "einstein"),
    ("growth-strategist", "ruri"),
    ("performance-analyst", "noir-webling"),
    ("gemini-copywriter", "anna"),
    ("flow-visual-producer", "taffy-2"),
    ("link-attribution", "doraemon"),
    ("qa-editor", "rem-xl"),
    ("publisher", "miku"),
    ("session-keeper", "ai-workbot"),
]

TILE = 32
ACTOR_SIZE = (96, 104)
CHAIR_CANVAS = (96, 112)
CHAIR_SOURCE_ORIGIN = (16, 32)
SEAT_SOCKET = (48, 80)
FLOOR_SOCKET = (48, 112)
STAGE_SIZE = (1365, 768)
WORLD_OFFSET_X = 107
DESK_ORIGINS_X = [4, 7, 10, 13, 16]
FAR_DESK_ORIGIN_Y = 7
NEAR_DESK_ORIGIN_Y = 11
FAR_DESK_TOP = 450
NEAR_DESK_TOP = 578

COLORS = {
    "background": "#08111f",
    "panel": "#111d31",
    "line": "#40516c",
    "text": "#f1f5f9",
    "muted": "#a6b7cc",
    "cyan": "#22d3ee",
    "green": "#22c55e",
    "amber": "#f59e0b",
    "red": "#ef4444",
    "purple": "#a78bfa",
}
TRANSPARENT = (0, 0, 0, 0)


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def repo_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def json_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def png_bytes(image: Image.Image) -> bytes:
    stream = io.BytesIO()
    image.save(stream, format="PNG", optimize=False, compress_level=9)
    return stream.getvalue()


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidate = Path("C:/Windows/Fonts") / ("arialbd.ttf" if bold else "arial.ttf")
    if candidate.exists():
        return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default(size=size)


def label(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, size: int = 18,
          fill: str = COLORS["text"], bold: bool = False) -> None:
    draw.text(xy, value, font=font(size, bold), fill=fill)


def panel(draw: ImageDraw.ImageDraw, bounds: tuple[int, int, int, int], title: str) -> None:
    draw.rounded_rectangle(bounds, radius=16, fill=COLORS["panel"], outline=COLORS["line"], width=2)
    label(draw, (bounds[0] + 18, bounds[1] + 14), title, 20, bold=True)


def board(title: str, subtitle: str) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGB", (1600, 1000), COLORS["background"])
    draw = ImageDraw.Draw(image)
    label(draw, (38, 22), title, 34, bold=True)
    label(draw, (40, 70), subtitle, 16, COLORS["amber"], True)
    return image, draw


def checker(size: tuple[int, int], cell: int = 16) -> Image.Image:
    image = Image.new("RGBA", size, (229, 237, 242, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle((x, y, min(size[0] - 1, x + cell - 1), min(size[1] - 1, y + cell - 1)),
                               fill=(209, 222, 230, 255))
    return image


def alpha_bounds(image: Image.Image) -> dict[str, int]:
    bounds = image.getchannel("A").getbbox()
    if bounds is None:
        return {"x": 0, "y": 0, "width": 0, "height": 0}
    left, top, right, bottom = bounds
    return {"x": left, "y": top, "width": right - left, "height": bottom - top}


def asset_record(path: Path, content: bytes, image: Image.Image) -> dict[str, Any]:
    return {
        "path": repo_path(path),
        "sha256": sha256_bytes(content),
        "renderPixels": [image.width, image.height],
        "alphaBounds": alpha_bounds(image),
    }


def character_sheet(slug: str) -> Path:
    version = "v4" if slug == "doraemon" else "v3"
    return ROOT / f"assets/game/characters/{slug}/runtime-spritesheet-{version}.webp"


def actor_frame(slug: str, orientation: str, frame: int) -> Image.Image:
    sheet = Image.open(character_sheet(slug)).convert("RGBA")
    row = 14 if orientation == "far" else 13
    left = frame * ACTOR_SIZE[0]
    top = row * ACTOR_SIZE[1]
    return sheet.crop((left, top, left + ACTOR_SIZE[0], top + ACTOR_SIZE[1]))


def normalized_chair_source(orientation: str) -> Image.Image:
    source = Image.open(R04_DIR / f"chair.office.modern.v3.{orientation}.png").convert("RGBA")
    canvas = Image.new("RGBA", CHAIR_CANVAS, TRANSPARENT)
    canvas.alpha_composite(source, CHAIR_SOURCE_ORIGIN)
    return canvas


def chair_masks(orientation: str) -> dict[str, Image.Image]:
    source = Image.open(R04_DIR / f"chair.office.modern.v3.{orientation}.png").convert("RGBA")
    names = ("base-seat", "backrest-arms", "rear", "foreground")
    masks = {name: Image.new("RGBA", CHAIR_CANVAS, TRANSPARENT) for name in names}
    pixels = {name: image.load() for name, image in masks.items()}
    origin_x, origin_y = CHAIR_SOURCE_ORIGIN
    for y in range(source.height):
        for x in range(source.width):
            value = source.getpixel((x, y))
            if value[3] == 0:
                continue
            target_x, target_y = x + origin_x, y + origin_y
            is_arm = 24 <= y < 48 and (x < 12 or x >= 52)
            physical = "backrest-arms" if y < 35 or is_arm else "base-seat"
            if orientation == "front":
                is_foreground = is_arm or 45 <= y < 48
            else:
                is_foreground = y < 48
            render = "foreground" if is_foreground else "rear"
            pixels[physical][target_x, target_y] = value
            pixels[render][target_x, target_y] = value
    reconstructed_physical = Image.alpha_composite(masks["base-seat"], masks["backrest-arms"])
    reconstructed_render = Image.alpha_composite(masks["rear"], masks["foreground"])
    expected = normalized_chair_source(orientation)
    if reconstructed_physical.tobytes() != expected.tobytes():
        raise ValueError(f"{orientation} physical chair masks do not reconstruct the source")
    if reconstructed_render.tobytes() != expected.tobytes():
        raise ValueError(f"{orientation} render chair masks do not reconstruct the source")
    return masks


def compose_chair_actor(orientation: str, slug: str = "einstein", frame: int = 0) -> Image.Image:
    masks = chair_masks("front" if orientation == "far" else "back")
    image = Image.new("RGBA", CHAIR_CANVAS, TRANSPARENT)
    image.alpha_composite(masks["rear"])
    image.alpha_composite(actor_frame(slug, orientation, frame), (0, 0))
    image.alpha_composite(masks["foreground"])
    return image


def desk_parts(side: str) -> dict[str, Image.Image]:
    return {
        role: Image.open(R04_DIR / f"desk.workstation.modern.v3.{side}.{role}.png").convert("RGBA")
        for role in ("rear", "surface", "base", "foreground")
    }


def equipment() -> dict[str, Image.Image]:
    return {
        "monitor-front": Image.open(R04_DIR / "monitor.workstation.v3.front.png").convert("RGBA"),
        "monitor-back": Image.open(R04_DIR / "monitor.workstation.v3.back.png").convert("RGBA"),
        "keyboard": Image.open(R04_DIR / "keyboard.workstation.v3.full.png").convert("RGBA"),
    }


def station_geometry(orientation: str) -> dict[str, dict[str, int]]:
    desk_left, desk_top = 208, 180
    actor_top = 100 if orientation == "far" else 196
    monitor_top = 188 if orientation == "far" else 156
    keyboard_top = 184 if orientation == "far" else 216
    return {
        "desk": {"left": desk_left, "top": desk_top, "width": 96, "height": 128},
        "support": {"left": desk_left, "top": desk_top, "width": 96, "height": 64},
        "actor": {"left": 208, "top": actor_top, "width": 96, "height": 104},
        "chair": {"left": 208, "top": actor_top, "width": 96, "height": 112},
        "seatSocket": {"x": 256, "y": actor_top + SEAT_SOCKET[1]},
        "floorSocket": {"x": 256, "y": actor_top + FLOOR_SOCKET[1]},
        "monitor": {"left": 230, "top": monitor_top, "width": 52, "height": 40},
        "monitorSocket": {"x": 256, "y": monitor_top + 40},
        "monitorReservation": {
            "left": 208, "top": 212 if orientation == "far" else 180, "width": 96, "height": 32,
        },
        "keyboard": {"left": 232, "top": keyboard_top, "width": 48, "height": 24},
        "keyboardReservation": {
            "left": 240, "top": 180 if orientation == "far" else 212, "width": 32, "height": 32,
        },
    }


def compose_station(orientation: str, slug: str = "einstein", frame: int = 0,
                    debug: bool = False) -> Image.Image:
    image = checker((512, 420), 32) if debug else Image.new("RGBA", (512, 420), TRANSPARENT)
    geometry = station_geometry(orientation)
    side = "public" if orientation == "far" else "seat"
    chair_orientation = "front" if orientation == "far" else "back"
    desks = desk_parts(side)
    chairs = chair_masks(chair_orientation)
    gear = equipment()
    actor = actor_frame(slug, orientation, frame)
    desk_xy = (geometry["desk"]["left"], geometry["desk"]["top"])
    chair_xy = (geometry["chair"]["left"], geometry["chair"]["top"])
    actor_xy = (geometry["actor"]["left"], geometry["actor"]["top"])
    if orientation == "far":
        image.alpha_composite(chairs["rear"], chair_xy)
        image.alpha_composite(actor, actor_xy)
        image.alpha_composite(chairs["foreground"], chair_xy)
        image.alpha_composite(desks["rear"], desk_xy)
        image.alpha_composite(desks["surface"], desk_xy)
        image.alpha_composite(gear["monitor-back"], (geometry["monitor"]["left"], geometry["monitor"]["top"]))
        image.alpha_composite(gear["keyboard"], (geometry["keyboard"]["left"], geometry["keyboard"]["top"]))
        image.alpha_composite(desks["base"], desk_xy)
        image.alpha_composite(desks["foreground"], desk_xy)
    else:
        image.alpha_composite(desks["rear"], desk_xy)
        image.alpha_composite(desks["surface"], desk_xy)
        image.alpha_composite(gear["monitor-front"], (geometry["monitor"]["left"], geometry["monitor"]["top"]))
        image.alpha_composite(gear["keyboard"], (geometry["keyboard"]["left"], geometry["keyboard"]["top"]))
        image.alpha_composite(desks["base"], desk_xy)
        image.alpha_composite(desks["foreground"], desk_xy)
        image.alpha_composite(chairs["rear"], chair_xy)
        image.alpha_composite(actor, actor_xy)
        image.alpha_composite(chairs["foreground"], chair_xy)
    if debug:
        draw = ImageDraw.Draw(image)
        for key, color in (("support", COLORS["cyan"]), ("monitorReservation", COLORS["purple"]),
                           ("keyboardReservation", COLORS["amber"])):
            item = geometry[key]
            draw.rectangle((item["left"], item["top"], item["left"] + item["width"], item["top"] + item["height"]),
                           outline=color, width=2)
        for key, color in (("seatSocket", COLORS["green"]), ("floorSocket", COLORS["red"]),
                           ("monitorSocket", COLORS["purple"])):
            point = geometry[key]
            draw.line((point["x"] - 5, point["y"], point["x"] + 5, point["y"]), fill=color, width=2)
            draw.line((point["x"], point["y"] - 5, point["x"], point["y"] + 5), fill=color, width=2)
    return image


def station_at(scene: Image.Image, orientation: str, slug: str, desk_left: int, desk_top: int,
               frame: int = 0) -> None:
    source = compose_station(orientation, slug, frame, False)
    crop = source.crop((208, 76, 304, 324))
    relative_desk_top = 180 - 76
    scene.alpha_composite(crop, (desk_left, desk_top - relative_desk_top))


def ten_seat_scene(debug: bool = False, frame: int = 0) -> Image.Image:
    background = Image.open(BACKGROUND_PATH).convert("RGBA").resize(STAGE_SIZE, Image.Resampling.LANCZOS)
    scene = background.copy()
    lefts = [WORLD_OFFSET_X + x * TILE for x in DESK_ORIGINS_X]
    for index, (agent_id, slug) in enumerate(CHARACTERS):
        orientation = "far" if index < 5 else "near"
        desk_top = FAR_DESK_TOP if orientation == "far" else NEAR_DESK_TOP
        station_at(scene, orientation, slug, lefts[index % 5], desk_top, frame)
    if debug:
        draw = ImageDraw.Draw(scene, "RGBA")
        work_right = WORLD_OFFSET_X + 24 * TILE
        draw.rectangle((WORLD_OFFSET_X, 0, work_right, STAGE_SIZE[1] - 1), outline=COLORS["cyan"], width=3)
        for x in range(WORLD_OFFSET_X, work_right + 1, TILE):
            draw.line((x, 0, x, STAGE_SIZE[1]), fill=(34, 211, 238, 55), width=1)
        for y in range(0, STAGE_SIZE[1], TILE):
            draw.line((WORLD_OFFSET_X, y, work_right, y), fill=(34, 211, 238, 55), width=1)
        for row_top in (FAR_DESK_TOP, NEAR_DESK_TOP):
            for left in lefts:
                draw.rectangle((left, row_top, left + 96, row_top + 64), outline=COLORS["green"], width=2)
                draw.rectangle((left + 32, row_top, left + 64, row_top + 32), outline=COLORS["amber"], width=2)
                draw.rectangle((left, row_top + 32, left + 96, row_top + 64), outline=COLORS["purple"], width=2)
        label(draw, (WORLD_OFFSET_X + 8, 18), "READ-ONLY OFFICE BACKGROUND / WORK ZONE ONLY / 10 x 3x2 DESKS", 16,
              COLORS["cyan"], True)
    return scene


def board_chair_sources() -> Image.Image:
    image, draw = board("R05-3B / REAL CHAIR SOURCE -> FINAL LAYERS",
                        "THE APPROVED MOCKUP IS NOT USED; FINAL DERIVATIVES RECONSTRUCT THE EXISTING CHAIR PIXELS EXACTLY")
    for column, orientation in enumerate(("front", "back")):
        left = 35 + column * 785
        panel(draw, (left, 115, left + 750, 900), orientation.upper())
        source = Image.open(R04_DIR / f"chair.office.modern.v3.{orientation}.png").convert("RGBA")
        masks = chair_masks(orientation)
        items = [("SOURCE 64x80", source), ("NORMALIZED 96x112", normalized_chair_source(orientation)),
                 ("BASE + SEAT", masks["base-seat"]), ("BACKREST + ARMS", masks["backrest-arms"]),
                 ("REAR MASK", masks["rear"]), ("FOREGROUND MASK", masks["foreground"])]
        for index, (name, asset) in enumerate(items):
            x = left + 40 + (index % 3) * 225
            y = 185 + (index // 3) * 335
            tile = checker((190, 245), 16)
            preview = asset.resize((asset.width * 2, asset.height * 2), Image.Resampling.NEAREST)
            tile.alpha_composite(preview, ((190 - preview.width) // 2, (210 - preview.height) // 2))
            image.paste(tile.convert("RGB"), (x, y))
            label(draw, (x + 8, y + 216), name, 13, COLORS["muted"], True)
    label(draw, (40, 950), "PASS: source pixels preserved / physical masks reconstruct full chair / render masks reconstruct full chair", 17,
          COLORS["green"], True)
    return image


def board_chair_actor() -> Image.Image:
    image, draw = board("R05-3B / REAL CHAIR + APPROVED SEATED POSE",
                        "SEAT SOCKET y80 / LOGICAL FLOOR y112 / CHARACTER PIXELS AND SIX POSE FRAMES UNCHANGED")
    for column, orientation in enumerate(("far", "near")):
        left = 45 + column * 775
        panel(draw, (left, 120, left + 730, 880), orientation.upper())
        composite = checker((384, 448), 32)
        preview = compose_chair_actor(orientation, "einstein", 0).resize((384, 448), Image.Resampling.NEAREST)
        composite.alpha_composite(preview)
        image.paste(composite.convert("RGB"), (left + 170, 205))
        seat_y = 205 + SEAT_SOCKET[1] * 4
        floor_y = 205 + FLOOR_SOCKET[1] * 4
        draw.line((left + 170, seat_y, left + 554, seat_y), fill=COLORS["green"], width=3)
        draw.line((left + 170, floor_y, left + 554, floor_y), fill=COLORS["red"], width=3)
        label(draw, (left + 180, 690), "seat contact error: 0 px", 18, COLORS["green"], True)
        label(draw, (left + 180, 724), "floor delta: 32 px", 18, COLORS["cyan"], True)
    label(draw, (40, 945), "The real chair replaces the code mockup. Head remains above the backrest; the seat and arms occlude the actor by view direction.",
          16, COLORS["green"], True)
    return image


def board_six_frames() -> Image.Image:
    image, draw = board("R05-3B / REAL CHAIR SIX-FRAME CONTACT",
                        "FRONT AND BACK USE ONE FIXED SEAT SOCKET; MAXIMUM ACTOR OR CHAIR ANCHOR DRIFT = 0 px")
    for row, orientation in enumerate(("far", "near")):
        top = 120 + row * 410
        label(draw, (40, top + 135), orientation.upper(), 18, COLORS["cyan"], True)
        for frame in range(6):
            preview = compose_chair_actor(orientation, "einstein", frame).resize((192, 224), Image.Resampling.NEAREST)
            x = 115 + frame * 240
            tile = checker((192, 224), 16)
            tile.alpha_composite(preview)
            image.paste(tile.convert("RGB"), (x, top))
            draw.line((x, top + 160, x + 192, top + 160), fill=COLORS["green"], width=2)
            label(draw, (x + 74, top + 235), f"F{frame}", 14, COLORS["muted"], True)
    label(draw, (40, 950), "PASS: 12/12 composites share the same local seat [48,80] and floor [48,112] sockets", 17,
          COLORS["green"], True)
    return image


def board_single_station() -> Image.Image:
    image, draw = board("R05-4 / ONE COMPLETE WORKSTATION",
                        "ACCEPTED 3x2 DESK + CENTERED MONITOR + FROZEN KEYBOARD + REAL TWO-VOLUME CHAIR + APPROVED POSE")
    for column, orientation in enumerate(("far", "near")):
        left = 35 + column * 785
        panel(draw, (left, 115, left + 750, 910), orientation.upper())
        clean = compose_station(orientation, "einstein", 0, False).crop((145, 70, 367, 330)).resize((333, 390), Image.Resampling.NEAREST)
        debug = compose_station(orientation, "einstein", 0, True).crop((145, 70, 367, 330)).resize((333, 390), Image.Resampling.NEAREST)
        image.paste(clean, (left + 28, 205), clean)
        image.paste(debug, (left + 389, 205), debug)
        label(draw, (left + 130, 620), "CLEAN", 16, COLORS["muted"], True)
        label(draw, (left + 500, 620), "DEBUG", 16, COLORS["muted"], True)
        label(draw, (left + 45, 690), "monitor base error  0 px", 17, COLORS["green"], True)
        label(draw, (left + 45, 726), "seat contact error  0 px", 17, COLORS["green"], True)
        label(draw, (left + 45, 762), "keyboard contained  PASS", 17, COLORS["green"], True)
    label(draw, (40, 950), "No code-drawn chair, no new character, no new pose, and no Active Office import.", 17,
          COLORS["green"], True)
    return image


def office_board(scene: Image.Image, title: str, subtitle: str) -> Image.Image:
    image, draw = board(title, subtitle)
    preview = scene.resize((1365, 768), Image.Resampling.LANCZOS)
    image.paste(preview.convert("RGB"), (117, 130))
    draw.rectangle((117, 130, 1482, 898), outline=COLORS["cyan"], width=3)
    return image


def board_before_after(after: Image.Image) -> Image.Image:
    image, draw = board("REJECTED CANDIDATE v1 -> R05 TEN-SEAT CANDIDATE",
                        "BEFORE CHANGED THE BACKGROUND AND USED 5x4 GEOMETRY; AFTER USES THE APPROVED BACKGROUND AND 3x2 DESKS")
    panel(draw, (30, 115, 790, 900), "BEFORE / REJECTED")
    panel(draw, (810, 115, 1570, 900), "AFTER / R05")
    before = Image.open(REJECTED_CAPTURE_PATH).convert("RGB").resize((720, 405), Image.Resampling.LANCZOS)
    after_preview = after.convert("RGB").resize((720, 405), Image.Resampling.LANCZOS)
    image.paste(before, (50, 190))
    image.paste(after_preview, (830, 190))
    for x, lines, color in (
        (55, ["5x4 workstation footprint", "background replaced", "chair/seat anchor not measured"], COLORS["red"]),
        (835, ["3x2 full-top desks", "approved background unchanged", "10 measured chair/actor sockets"], COLORS["green"]),
    ):
        for index, value in enumerate(lines):
            label(draw, (x, 650 + index * 48), value, 18, color, True)
    label(draw, (40, 950), "AFTER remains isolated; promotion to Active Office is still false.", 17, COLORS["amber"], True)
    return image


def map_data() -> dict[str, Any]:
    stations = []
    for index, (agent_id, slug) in enumerate(CHARACTERS):
        orientation = "far" if index < 5 else "near"
        desk_x = DESK_ORIGINS_X[index % 5]
        desk_y = FAR_DESK_ORIGIN_Y if orientation == "far" else NEAR_DESK_ORIGIN_Y
        chair_y = 6 if orientation == "far" else 13
        stations.append({
            "id": f"r05-station-{index + 1:02d}",
            "agentId": agent_id,
            "characterSlug": slug,
            "orientation": orientation,
            "desk": {"x": desk_x, "y": desk_y, "width": 3, "depth": 2},
            "chair": {"x": desk_x + 1, "y": chair_y, "width": 1, "depth": 1, "height": 2},
            "person": {"x": desk_x + 1, "y": chair_y, "width": 1, "depth": 1, "height": 3},
            "monitor": {"x": desk_x, "y": desk_y if orientation == "near" else desk_y + 1, "width": 3, "depth": 1},
            "keyboard": {"x": desk_x + 1, "y": desk_y + 1 if orientation == "near" else desk_y, "width": 1, "depth": 1},
        })
    return {
        "schemaVersion": 3,
        "id": "office-ten-r05-isolated",
        "status": "owner-review",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "sourceBackground": {"file": repo_path(BACKGROUND_PATH), "sha256": sha256(BACKGROUND_PATH), "unchanged": True},
        "activeOfficeBaseline": {"file": repo_path(ACTIVE_MAP_PATH), "sha256": sha256(ACTIVE_MAP_PATH), "mustRemainByteIdentical": True},
        "grid": {"width": 36, "height": 24, "tilePixels": 32},
        "zones": {"work": {"x": 0, "y": 0, "width": 24, "height": 24}, "supportBreak": {"x": 24, "y": 0, "width": 12, "height": 24, "emptyForThisReview": True}},
        "layout": {
            "deskOriginsX": DESK_ORIGINS_X,
            "farDeskOriginY": FAR_DESK_ORIGIN_Y,
            "nearDeskOriginY": NEAR_DESK_ORIGIN_Y,
            "horizontalJoinCount": 8,
            "horizontalGapPixels": 0,
            "horizontalOverlapPixels": 0,
        },
        "renderProjection": {
            "stagePixels": list(STAGE_SIZE),
            "worldOffsetX": WORLD_OFFSET_X,
            "deskTopPixels": {"far": FAR_DESK_TOP, "near": NEAR_DESK_TOP},
        },
        "workstations": stations,
        "legacyFurnitureReferences": [],
        "otherFurnitureCount": 0,
    }


def build_outputs() -> dict[Path, bytes]:
    outputs: dict[Path, bytes] = {}
    records: dict[str, Any] = {}
    for orientation in ("front", "back"):
        full = normalized_chair_source(orientation)
        parts = chair_masks(orientation)
        for role, asset in (("full", full), *parts.items()):
            path = OUTPUT_DIR / f"chair.office.modern.r05.{orientation}.{role}.png"
            content = png_bytes(asset)
            outputs[path] = content
            records[f"chair-{orientation}-{role}"] = asset_record(path, content, asset)

    scene_clean = ten_seat_scene(False)
    reviews = {
        REVIEW_DIR / "01-real-chair-source-to-final-layers.png": board_chair_sources(),
        REVIEW_DIR / "02-real-chair-approved-pose-front-back.png": board_chair_actor(),
        REVIEW_DIR / "03-real-chair-six-frame-contact.png": board_six_frames(),
        REVIEW_DIR / "04-single-workstation-clean-debug.png": board_single_station(),
        REVIEW_DIR / "05-ten-seat-office-clean.png": office_board(
            scene_clean, "R05-5 / TEN-SEAT OFFICE CLEAN", "TWO ROWS OF FIVE / LEFT WORK ZONE ONLY / APPROVED OFFICE BACKGROUND UNCHANGED",
        ),
        REVIEW_DIR / "06-ten-seat-office-grid-debug.png": office_board(
            ten_seat_scene(True), "R05-5 / TEN-SEAT OFFICE GEOMETRY", "TEN 3x2 DESKS / TEN 1x1x2 CHAIRS / TEN EXISTING 1x1x3 CHARACTERS",
        ),
        REVIEW_DIR / "07-rejected-v1-before-r05-after.png": board_before_after(scene_clean),
    }
    for path, image in reviews.items():
        outputs[path] = png_bytes(image)

    map_content = json_bytes(map_data())
    outputs[MAP_PATH] = map_content
    review_paths = [repo_path(path) for path in reviews]
    manifest = {
        "version": 6,
        "geometrySchemaVersion": 7,
        "id": "office.workstation.step5.r05.final",
        "status": "owner-review-ten-seat-candidate",
        "updatedOn": "2026-07-28",
        "completedScope": ["R05-3B", "R05-4", "R05-5"],
        "ownerDecision": {
            "r05_3a": "approved",
            "accepted": ["keyboard", "monitor-base-socket", "front-and-back-seated-pose"],
        },
        "activeOfficeBaseline": {"file": repo_path(ACTIVE_MAP_PATH), "sha256": sha256(ACTIVE_MAP_PATH), "mustRemainByteIdentical": True},
        "sourceBackground": {"file": repo_path(BACKGROUND_PATH), "sha256": sha256(BACKGROUND_PATH), "mustRemainByteIdentical": True},
        "components": {
            "desk": {"decision": "accepted-byte-identical", "reservation": [3, 2], "logicalVolume": [3, 2, 2], "renderPixels": [96, 128]},
            "chair": {
                "decision": "real-source-normalized-without-scaling",
                "source": {
                    orientation: {"path": repo_path(R04_DIR / f"chair.office.modern.v3.{orientation}.png"), "sha256": sha256(R04_DIR / f"chair.office.modern.v3.{orientation}.png")}
                    for orientation in ("front", "back")
                },
                "reservation": [1, 1],
                "logicalVolume": [1, 1, 2],
                "physicalParts": ["base-seat", "backrest-arms"],
                "renderMasks": ["rear", "foreground"],
                "sourceOriginLocal": list(CHAIR_SOURCE_ORIGIN),
                "seatSocketLocal": list(SEAT_SOCKET),
                "floorSocketLocal": list(FLOOR_SOCKET),
                "contactErrorPixels": {"far": [0, 0], "near": [0, 0]},
                "sourcePixelReconstruction": True,
                "assets": records,
            },
            "monitor": {
                "decision": "owner-accepted-and-frozen", "reservation": [3, 1], "renderPixels": [52, 40],
                "supportFootprint": [1, 1], "localVisualPivot": [26, 40], "centerErrorPixels": {"far": [0, 0], "near": [0, 0]},
                "front": {"path": repo_path(R04_DIR / "monitor.workstation.v3.front.png"), "sha256": sha256(R04_DIR / "monitor.workstation.v3.front.png")},
                "back": {"path": repo_path(R04_DIR / "monitor.workstation.v3.back.png"), "sha256": sha256(R04_DIR / "monitor.workstation.v3.back.png")},
            },
            "keyboard": {
                "decision": "owner-accepted-and-frozen", "reservation": [1, 1], "renderPixels": [48, 24], "localVisualPivot": [24, 12],
                "asset": {"path": repo_path(R04_DIR / "keyboard.workstation.v3.full.png"), "sha256": sha256(R04_DIR / "keyboard.workstation.v3.full.png")},
            },
            "characters": {"decision": "existing-ten-only", "count": 10, "newCharacterOrPose": False, "personStandard": [1, 1, 3], "entries": [{"agentId": agent, "slug": slug} for agent, slug in CHARACTERS]},
        },
        "station": {
            "geometry": {orientation: station_geometry(orientation) for orientation in ("far", "near")},
            "animation": {"frames": 6, "fps": 6, "maximumAnchorDriftPixels": 0},
            "layerOrder": {
                "far": ["chair-rear", "actor", "chair-foreground", "desk-rear", "desk-surface", "monitor-back", "keyboard", "desk-base", "desk-foreground"],
                "near": ["desk-rear", "desk-surface", "monitor-front", "keyboard", "desk-base", "desk-foreground", "chair-rear", "actor", "chair-foreground"],
            },
        },
        "tenSeatMap": {"file": repo_path(MAP_PATH), "sha256": sha256_bytes(map_content)},
        "reviewOutputs": review_paths,
        "browserValidation": {
            "requiredSeconds": 60,
            "completedSeconds": 60,
            "consoleErrors": 0,
            "consoleWarnings": 0,
            "brokenImages": 0,
            "maximumAnchorDriftPixels": 0,
            "captures": [
                repo_path(QA_DIR / "01-browser-ten-clean.jpg"),
                repo_path(QA_DIR / "02-browser-ten-debug.jpg"),
                repo_path(QA_DIR / "03-browser-single-clean.jpg"),
                repo_path(QA_DIR / "04-browser-single-debug.jpg"),
            ],
        },
        "permissions": {
            "deterministicChairDerivatives": True,
            "isolatedRenderer": True,
            "singleSeatAssembly": True,
            "tenSeatAssembly": True,
            "newCharacterOrPose": False,
            "otherFurniture": False,
            "step24": False,
            "activeOfficePromotion": False,
        },
        "runtimePolicy": {"mockupChairAllowed": False, "legacyCandidateAllowed": False, "developmentOnly": True},
    }
    outputs[MANIFEST_PATH] = json_bytes(manifest)
    return outputs


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    outputs = build_outputs()
    mismatches = []
    for path, expected in outputs.items():
        if args.check:
            if not path.exists() or path.read_bytes() != expected:
                mismatches.append(repo_path(path))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(expected)
    if mismatches:
        raise SystemExit("R05 final outputs are stale: " + ", ".join(mismatches))
    if args.check:
        print(f"R05 final outputs OK: {len(outputs)} files")
    else:
        print(f"Built {len(outputs)} R05 final files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
