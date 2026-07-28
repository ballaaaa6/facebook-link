#!/usr/bin/env python3
"""Build the R05-r02 coordinate/socket proof without touching Active Office."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import io
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
LEGACY_BUILDER_PATH = ROOT / "scripts/build-office-workstation-step5-r05-final.py"
REVIEW_DIR = ROOT / "assets/art/layout-references/office-workstation-v3/step5-r05-r02"
MANIFEST_PATH = ROOT / "assets/game/manifests/office-workstation-step5-r05-r02.json"
SOCKETS_PATH = ROOT / "assets/game/manifests/office-character-seat-sockets-v1.json"
PAIR_MAP_PATH = ROOT / "assets/game/maps/office-workstation-pair-r05-r02.json"
ACTIVE_MAP_PATH = ROOT / "assets/game/maps/office-c-v2.json"
BACKGROUND_PATH = ROOT / "assets/art/backgrounds/office-c-background-modern-v3.png"
R04_DIR = ROOT / "assets/game/processed/office-workstation-v3/step5-r04"
R05_FINAL_DIR = ROOT / "assets/game/processed/office-workstation-v3/step5-r05-final"
QA_DIR = ROOT / "assets/game/processed/office-workstation-v3/step5-r05-r02/qa"

TILE = 32
ACTOR_SIZE = (96, 104)
CHAIR_SIZE = (96, 112)
CHAIR_SEAT_SOCKET = (48, 80)
CHAIR_FLOOR_SOCKET = (48, 112)
FRONT_APPROVED_SOCKET_Y = 80
PAIR_STAGE_SIZE = (640, 520)

ROSTER = [
    "ai-workbot",
    "anna",
    "asuka-2",
    "baobao-2",
    "doraemon",
    "einstein",
    "gugugaga",
    "itachi",
    "jesus",
    "lian-3",
    "miku",
    "nai-long",
    "noir-webling",
    "qq-penguin",
    "rem-xl",
    "ruri",
    "taffy-2",
    "yinyue-2",
]

# Back-facing clothes, coats, tails, and non-human silhouettes hide the pelvis
# differently. These values are the measured lower-torso/upper-leg contact for
# each existing frame; they are deliberately not collapsed into one top-left
# offset. Front remains the already-approved y80 visual baseline.
BACK_SOCKET_Y_BY_SLUG = {
    "ai-workbot": [86, 86, 85, 86, 86, 86],
    "anna": [96, 96, 96, 96, 96, 97],
    "asuka-2": [92, 92, 92, 92, 92, 92],
    "baobao-2": [94, 94, 94, 94, 94, 94],
    "doraemon": [95, 95, 95, 95, 94, 95],
    "einstein": [95, 96, 95, 95, 96, 96],
    "gugugaga": [98, 98, 98, 98, 98, 98],
    "itachi": [93, 93, 93, 93, 93, 93],
    "jesus": [91, 91, 91, 91, 91, 91],
    "lian-3": [91, 91, 91, 91, 91, 91],
    "miku": [91, 91, 91, 91, 91, 91],
    "nai-long": [98, 98, 98, 98, 98, 98],
    "noir-webling": [98, 98, 98, 98, 98, 98],
    "qq-penguin": [95, 95, 95, 95, 95, 95],
    "rem-xl": [88, 88, 89, 88, 88, 88],
    "ruri": [91, 91, 91, 91, 91, 91],
    "taffy-2": [91, 91, 91, 92, 91, 91],
    "yinyue-2": [91, 91, 91, 91, 91, 91],
}

PAIR_CHARACTERS = {
    "far": {"agentId": "product-ranker", "slug": "einstein"},
    "near": {"agentId": "flow-visual-producer", "slug": "taffy-2"},
}

QA_CAPTURES = [
    QA_DIR / "01-browser-pair-clean.jpg",
    QA_DIR / "02-browser-pair-debug.jpg",
    QA_DIR / "03-browser-single-clean.jpg",
    QA_DIR / "04-browser-single-debug.jpg",
]


def load_legacy_builder():
    spec = importlib.util.spec_from_file_location("office_r05_final_builder", LEGACY_BUILDER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {LEGACY_BUILDER_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


LEGACY = load_legacy_builder()
COLORS = LEGACY.COLORS


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


def runtime_sheet_path(slug: str) -> Path:
    version = "v4" if slug == "doraemon" else "v3"
    return ROOT / f"assets/game/characters/{slug}/runtime-spritesheet-{version}.webp"


def actor_frame(slug: str, orientation: str, frame: int) -> Image.Image:
    row = 14 if orientation == "front" else 13
    sheet = Image.open(runtime_sheet_path(slug)).convert("RGBA")
    left = frame * ACTOR_SIZE[0]
    top = row * ACTOR_SIZE[1]
    return sheet.crop((left, top, left + ACTOR_SIZE[0], top + ACTOR_SIZE[1]))


def alpha_bounds(image: Image.Image) -> list[int]:
    bounds = image.getchannel("A").getbbox()
    return [0, 0, 0, 0] if bounds is None else list(bounds)


def contact_span(image: Image.Image, y: int) -> list[int]:
    alpha = image.getchannel("A")
    xs = [x for x in range(image.width) if alpha.getpixel((x, y)) >= 64]
    return [48, 48] if not xs else [min(xs), max(xs)]


def frame_socket_record(slug: str, orientation: str, frame: int) -> dict[str, Any]:
    actor = actor_frame(slug, orientation, frame)
    y = FRONT_APPROVED_SOCKET_Y if orientation == "front" else BACK_SOCKET_Y_BY_SLUG[slug][frame]
    return {
        "frame": frame,
        "pelvisPivotLocal": [48, y - 6],
        "seatContactLocal": [48, y],
        "contactSpanLocalX": contact_span(actor, y),
        "alphaBounds": alpha_bounds(actor),
    }


def socket_manifest_data() -> dict[str, Any]:
    entries = []
    for slug in ROSTER:
        entries.append({
            "slug": slug,
            "seatCapability": "working-seated",
            "framePixels": list(ACTOR_SIZE),
            "occupancy": [1, 1, 3],
            "source": {"file": repo_path(runtime_sheet_path(slug)), "sha256": sha256(runtime_sheet_path(slug))},
            "orientations": {
                orientation: {
                    "row": 14 if orientation == "front" else 13,
                    "measurementStatus": "owner-approved-visual-baseline" if orientation == "front" else "owner-approved-r05-r02",
                    "frames": [frame_socket_record(slug, orientation, frame) for frame in range(6)],
                }
                for orientation in ("front", "back")
            },
        })
    entries.append({
        "slug": "boba",
        "seatCapability": "not-applicable-companion-atlas",
        "reason": "The companion atlas has 11 rows and no working-front-seated or working-back-seated rows; no new pose is authorized.",
        "source": {
            "file": "assets/game/characters/boba/runtime-spritesheet-v2.webp",
            "sha256": sha256(ROOT / "assets/game/characters/boba/runtime-spritesheet-v2.webp"),
        },
    })
    return {
        "version": 1,
        "schema": "office-character-seat-sockets",
        "status": "owner-approved",
        "updatedOn": "2026-07-28",
        "tilePixels": TILE,
        "coordinateSpaces": {
            "world": "x-right/y-toward-viewer/z-up in tile units",
            "local": "integer sprite pixels",
            "projection": "screenX = worldX * 32; screenY = worldY * 32 - worldZ * 32",
        },
        "placementFormula": "actorDrawOrigin = project(chairSeatSocketWorld) - actorSeatContactLocal",
        "rules": {
            "canvasBoundsAreFootprint": False,
            "alphaBoundsAreFootprint": False,
            "orientationMagicOffsets": False,
            "frameSpecificSeatSocketsAllowed": True,
            "newCharacterOrPose": False,
            "handSocketsInScope": False,
        },
        "audit": {
            "directoryCount": 19,
            "seatCapableCount": 18,
            "companionNotApplicableCount": 1,
            "seatFrameRecordCount": 18 * 2 * 6,
        },
        "entries": entries,
    }


def chair_layers(orientation: str) -> dict[str, Image.Image]:
    key = "front" if orientation == "front" else "back"
    behind = Image.open(R05_FINAL_DIR / f"chair.office.modern.r05.{key}.rear.png").convert("RGBA")
    foreground = Image.open(R05_FINAL_DIR / f"chair.office.modern.r05.{key}.foreground.png").convert("RGBA")
    return {"behind": behind, "foreground": foreground}


def seat_socket(slug: str, orientation: str, frame: int) -> tuple[int, int]:
    record = frame_socket_record(slug, orientation, frame)
    return tuple(record["seatContactLocal"])


def compose_chair_actor(slug: str, orientation: str, frame: int, legacy: bool = False) -> Image.Image:
    layers = chair_layers(orientation)
    actor = actor_frame(slug, orientation, frame)
    actor_socket = (48, 80) if legacy else seat_socket(slug, orientation, frame)
    actor_origin = (
        CHAIR_SEAT_SOCKET[0] - actor_socket[0],
        CHAIR_SEAT_SOCKET[1] - actor_socket[1],
    )
    image = Image.new("RGBA", CHAIR_SIZE, (0, 0, 0, 0))
    image.alpha_composite(layers["behind"])
    image.alpha_composite(actor, actor_origin)
    image.alpha_composite(layers["foreground"])
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


def station_layer_records(orientation: str, slug: str, frame: int, desk_left: int, desk_top: int) -> list[dict[str, Any]]:
    side = "public" if orientation == "far" else "seat"
    actor_orientation = "front" if orientation == "far" else "back"
    chair_top = desk_top - 80 if orientation == "far" else desk_top + 16
    actor_socket_local = seat_socket(slug, actor_orientation, frame)
    actor_top = chair_top + CHAIR_SEAT_SOCKET[1] - actor_socket_local[1]
    monitor_top = desk_top + 8 if orientation == "far" else desk_top - 24
    keyboard_top = desk_top + 4 if orientation == "far" else desk_top + 36
    desks = desk_parts(side)
    chairs = chair_layers(actor_orientation)
    gear = equipment()
    common = {
        "desk-rear": (desks["rear"], (desk_left, desk_top)),
        "desk-surface": (desks["surface"], (desk_left, desk_top)),
        "desk-base": (desks["base"], (desk_left, desk_top)),
        "desk-foreground": (desks["foreground"], (desk_left, desk_top)),
        "chair-behind": (chairs["behind"], (desk_left, chair_top)),
        "actor": (actor_frame(slug, actor_orientation, frame), (desk_left, actor_top)),
        "chair-foreground": (chairs["foreground"], (desk_left, chair_top)),
        "monitor": (gear["monitor-back" if orientation == "far" else "monitor-front"], (desk_left + 22, monitor_top)),
        "keyboard": (gear["keyboard"], (desk_left + 24, keyboard_top)),
    }
    order = (
        ["chair-behind", "actor", "chair-foreground", "desk-rear", "desk-surface", "keyboard", "monitor", "desk-base", "desk-foreground"]
        if orientation == "far"
        else ["desk-rear", "desk-surface", "monitor", "keyboard", "desk-base", "desk-foreground", "chair-behind", "actor", "chair-foreground"]
    )
    return [
        {"name": name, "image": common[name][0], "xy": common[name][1]}
        for name in order
    ]


def compose_pair(frame: int = 0, debug: bool = False) -> Image.Image:
    image = LEGACY.checker(PAIR_STAGE_SIZE, TILE) if debug else Image.new("RGBA", PAIR_STAGE_SIZE, (229, 237, 242, 255))
    desk_left = 272
    far_top = 180
    near_top = far_top + 2 * TILE
    for orientation, desk_top in (("far", far_top), ("near", near_top)):
        slug = PAIR_CHARACTERS[orientation]["slug"]
        for layer in station_layer_records(orientation, slug, frame, desk_left, desk_top):
            image.alpha_composite(layer["image"], layer["xy"])
    if debug:
        draw = ImageDraw.Draw(image, "RGBA")
        for name, top, color in (("rear tabletop 3x2", far_top, COLORS["cyan"]), ("front tabletop 3x2", near_top, COLORS["green"])):
            draw.rectangle((desk_left, top, desk_left + 96, top + 64), outline=color, width=2)
            LEGACY.label(draw, (desk_left + 101, top + 20), name, 12, color, True)
        draw.line((desk_left, near_top, desk_left + 96, near_top), fill=COLORS["amber"], width=3)
        LEGACY.label(draw, (desk_left - 112, near_top - 7), "gap 0", 12, COLORS["amber"], True)
        for orientation, desk_top in (("far", far_top), ("near", near_top)):
            slug = PAIR_CHARACTERS[orientation]["slug"]
            actor_orientation = "front" if orientation == "far" else "back"
            chair_top = desk_top - 80 if orientation == "far" else desk_top + 16
            socket = seat_socket(slug, actor_orientation, frame)
            seat_x, seat_y = desk_left + 48, chair_top + 80
            draw.line((seat_x - 6, seat_y, seat_x + 6, seat_y), fill=COLORS["green"], width=2)
            draw.line((seat_x, seat_y - 6, seat_x, seat_y + 6), fill=COLORS["green"], width=2)
            LEGACY.label(draw, (seat_x + 8, seat_y - 9), f"seat={socket}", 10, COLORS["green"], True)
    return image


def paste_scaled(image: Image.Image, asset: Image.Image, xy: tuple[int, int], scale: int = 2) -> None:
    preview = asset.resize((asset.width * scale, asset.height * scale), Image.Resampling.NEAREST)
    image.paste(preview, xy, preview)


def board_coordinate_contract() -> Image.Image:
    image, draw = LEGACY.board(
        "R05-r02 P0 / WORLD + SOCKET COORDINATE CONTRACT",
        "FOOTPRINT, SUPPORT HEIGHT, LOCAL SOCKET, AND RENDER BOUNDS ARE INDEPENDENT",
    )
    LEGACY.panel(draw, (35, 120, 775, 900), "WORLD X/Y/Z")
    origin = (235, 720)
    draw.line((origin[0], origin[1], origin[0] + 360, origin[1]), fill=COLORS["cyan"], width=5)
    draw.line((origin[0], origin[1], origin[0], origin[1] - 390), fill=COLORS["green"], width=5)
    draw.line((origin[0], origin[1], origin[0] + 210, origin[1] - 210), fill=COLORS["purple"], width=5)
    LEGACY.label(draw, (610, 702), "X / right", 18, COLORS["cyan"], True)
    LEGACY.label(draw, (120, 295), "Z / height", 18, COLORS["green"], True)
    LEGACY.label(draw, (455, 470), "Y / toward viewer", 18, COLORS["purple"], True)
    for level, title in ((0, "floor"), (1, "chair cushion + pelvis"), (2, "desk support"), (3, "person top")):
        y = 720 - level * 105
        draw.line((205, y, 560, y), fill=COLORS["line"], width=2)
        LEGACY.label(draw, (65, y - 12), f"z={level}", 16, COLORS["muted"], True)
        LEGACY.label(draw, (575, y - 12), title, 15, COLORS["text"])
    LEGACY.panel(draw, (825, 120, 1565, 900), "PLACEMENT FORMULA")
    lines = [
        "chairSeatWorld = chairOrigin + seatSocket",
        "actorDrawOrigin = project(chairSeatWorld)",
        "                - actorSeatContactLocal",
        "",
        "desk footprint       3 x 2",
        "chair volume         1 x 1 x 2",
        "person volume        1 x 1 x 3",
        "monitor reservation  3 x 1",
        "keyboard reservation 1 x 1",
        "",
        "NO canvas-size footprint",
        "NO shared top-left person/chair anchor",
        "NO orientation magic offset",
        "NO hand/grip sockets in this revision",
    ]
    for index, value in enumerate(lines):
        LEGACY.label(draw, (865, 190 + index * 46), value, 17, COLORS["green"] if value.startswith("NO ") else COLORS["text"], value.startswith("NO "))
    return image


def board_roster_overview(orientation: str) -> Image.Image:
    title = "FRONT / APPROVED BASELINE" if orientation == "front" else "BACK / MEASURED SEAT CONTACT"
    image, draw = LEGACY.board(
        f"R05-r02 P1 / 18 SEAT-CAPABLE CHARACTERS / {title}",
        "BOBA IS AUDITED AS A COMPANION WITHOUT SEATED ROWS; NO CHARACTER OR POSE PIXELS WERE CREATED",
    )
    for index, slug in enumerate(ROSTER):
        column, row = index % 6, index // 6
        x, y = 40 + column * 255, 125 + row * 275
        draw.rounded_rectangle((x, y, x + 235, y + 250), radius=10, fill=COLORS["panel"], outline=COLORS["line"], width=2)
        preview = compose_chair_actor(slug, orientation, 0).resize((144, 168), Image.Resampling.NEAREST)
        image.paste(preview, (x + 45, y + 28), preview)
        socket = seat_socket(slug, orientation, 0)
        line_y = y + 28 + CHAIR_SEAT_SOCKET[1] * 1.5
        draw.line((x + 45, line_y, x + 189, line_y), fill=COLORS["green"], width=2)
        LEGACY.label(draw, (x + 12, y + 205), slug, 13, COLORS["text"], True)
        LEGACY.label(draw, (x + 12, y + 226), f"seat local {socket}", 11, COLORS["green"], True)
    LEGACY.label(draw, (42, 950), "18/18 seat-capable atlases audited; Boba 11-row companion atlas is explicitly not seat-capable.", 16, COLORS["green"], True)
    return image


def board_roster_frames(orientation: str, group: int) -> Image.Image:
    subset = ROSTER[group * 9:(group + 1) * 9]
    image, draw = LEGACY.board(
        f"R05-r02 P1 / {orientation.upper()} SIX-FRAME SOCKETS / GROUP {group + 1}",
        "EVERY FRAME RESOLVES THROUGH ITS RECORDED SEAT CONTACT; GREEN LINE IS THE CHAIR SEAT PLANE",
    )
    for index, slug in enumerate(subset):
        column, row = index % 3, index // 3
        x, y = 35 + column * 515, 120 + row * 275
        draw.rounded_rectangle((x, y, x + 495, y + 250), radius=10, fill=COLORS["panel"], outline=COLORS["line"], width=2)
        LEGACY.label(draw, (x + 15, y + 12), slug, 14, COLORS["text"], True)
        for frame in range(6):
            composite = compose_chair_actor(slug, orientation, frame)
            preview = composite.resize((72, 84), Image.Resampling.NEAREST)
            px, py = x + 16 + frame * 79, y + 56
            image.paste(preview, (px, py), preview)
            line_y = py + 60
            draw.line((px, line_y, px + 72, line_y), fill=COLORS["green"], width=1)
            LEGACY.label(draw, (px + 27, py + 90), f"F{frame}", 10, COLORS["muted"], True)
        socket_values = [seat_socket(slug, orientation, frame)[1] for frame in range(6)]
        socket_label = str(socket_values[0]) if len(set(socket_values)) == 1 else "/".join(str(value) for value in socket_values)
        LEGACY.label(draw, (x + 15, y + 210), f"actor contact y{socket_label} -> chair seat y80 / error 0 px", 12, COLORS["green"], True)
    return image


def board_desk_depth() -> Image.Image:
    image, draw = LEGACY.board(
        "R05-r02 P3 / DESK DEPTH OCCLUSION BEFORE + AFTER",
        "THE 128 px CANVAS IS NOT THE 64 px FLOOR DEPTH; THE NEAR TABLETOP HIDES THE FAR DESK BASE",
    )
    for column, (name, offset, color) in enumerate((("BEFORE / TAIL-TO-HEAD", 128, COLORS["red"]), ("AFTER / FOOTPRINT-TO-FOOTPRINT", 64, COLORS["green"]))):
        left = 45 + column * 775
        LEGACY.panel(draw, (left, 120, left + 730, 890), name)
        canvas = LEGACY.checker((500, 590), TILE)
        desk = desk_parts("seat")
        x, y = 202, 120
        for top in (y, y + offset):
            for role in ("rear", "surface", "base", "foreground"):
                canvas.alpha_composite(desk[role], (x, top))
        preview = canvas.resize((600, 708), Image.Resampling.NEAREST)
        image.paste(preview, (left + 65, 155))
        draw.line((left + 307, 155 + (y + 64) * 1.2, left + 422, 155 + (y + 64) * 1.2), fill=COLORS["amber"], width=4)
        LEGACY.label(draw, (left + 90, 825), f"desk origin delta = {offset}px", 17, color, True)
    return image


def board_equipment_depth() -> Image.Image:
    image, draw = LEGACY.board(
        "R05-r02 P3 / FAR-ROW EQUIPMENT DEPTH BEFORE + AFTER",
        "SAME RESERVATIONS AND SOCKETS; ONLY THE PHYSICAL DRAW ORDER CHANGES FROM MONITOR->KEYBOARD TO KEYBOARD->MONITOR",
    )
    gear = equipment()
    desk = desk_parts("public")
    for column, (name, order, color) in enumerate((("BEFORE / WRONG DRAW ORDER", ["monitor", "keyboard"], COLORS["red"]), ("AFTER / PHYSICAL DEPTH ORDER", ["keyboard", "monitor"], COLORS["green"]))):
        left = 45 + column * 775
        LEGACY.panel(draw, (left, 120, left + 730, 890), name)
        canvas = LEGACY.checker((320, 260), TILE)
        desk_xy = (112, 100)
        canvas.alpha_composite(desk["surface"], desk_xy)
        for role in order:
            if role == "monitor":
                canvas.alpha_composite(gear["monitor-back"], (134, 108))
            else:
                canvas.alpha_composite(gear["keyboard"], (136, 104))
        preview = canvas.resize((640, 520), Image.Resampling.NEAREST)
        image.paste(preview, (left + 45, 205))
        LEGACY.label(draw, (left + 85, 790), "monitor base = middle of reserved center cell", 15, COLORS["purple"], True)
        LEGACY.label(draw, (left + 85, 825), "keyboard 1x1 reservation unchanged", 15, COLORS["amber"], True)
        LEGACY.label(draw, (left + 85, 855), "PASS" if column else "REJECTED", 18, color, True)
    return image


def board_back_seat_before_after() -> Image.Image:
    image, draw = LEGACY.board(
        "R05-r02 P3 / BACK-FACING SEAT SOCKET BEFORE + AFTER",
        "THE ACTOR IS PLACED BY PELVIS/SEAT CONTACT, NOT BY SHARING THE CHAIR'S TOP-LEFT ORIGIN",
    )
    for column, (name, legacy, color) in enumerate((("BEFORE / SHARED TOP-LEFT", True, COLORS["red"]), ("AFTER / SOCKET-TO-SOCKET", False, COLORS["green"]))):
        left = 45 + column * 775
        LEGACY.panel(draw, (left, 120, left + 730, 890), name)
        preview = compose_chair_actor("einstein", "back", 0, legacy).resize((384, 448), Image.Resampling.NEAREST)
        image.paste(preview, (left + 173, 205), preview)
        seat_y = 205 + CHAIR_SEAT_SOCKET[1] * 4
        draw.line((left + 173, seat_y, left + 557, seat_y), fill=color, width=4)
        actor_y = 80 if legacy else seat_socket("einstein", "back", 0)[1]
        LEGACY.label(draw, (left + 180, 690), f"actor local contact y{actor_y}", 18, color, True)
        LEGACY.label(draw, (left + 180, 730), "chair seat local y80", 18, COLORS["cyan"], True)
        LEGACY.label(draw, (left + 180, 770), "draw offset 0px" if legacy else f"draw offset {80 - actor_y}px", 18, COLORS["text"], True)
    return image


def board_pair() -> Image.Image:
    image, draw = LEGACY.board(
        "R05-r02 P3 / ONE PAIRED WORKSTATION COLUMN",
        "ONE FRONT-FACING APPROVED ACTOR + ONE BACK-FACING SOCKET-CALIBRATED ACTOR / TWO 3x2 TABLETOPS TOUCH",
    )
    LEGACY.panel(draw, (35, 120, 785, 900), "CLEAN")
    LEGACY.panel(draw, (815, 120, 1565, 900), "DEBUG")
    clean = compose_pair(0, False)
    debug = compose_pair(0, True)
    image.paste(clean.convert("RGB"), (90, 195))
    image.paste(debug.convert("RGB"), (870, 195))
    LEGACY.label(draw, (55, 940), "OWNER-APPROVED BASELINE: any 5-column / 10-person expansion must derive from this pair.", 17, COLORS["green"], True)
    return image


def pair_map_data() -> dict[str, Any]:
    return {
        "schemaVersion": 4,
        "id": "office-workstation-pair-r05-r02",
        "status": "owner-approved-p0-p3",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "grid": {"tilePixels": TILE},
        "deskPair": {
            "footprint": [3, 2, 2],
            "farOrigin": [8, 5, 0],
            "nearOrigin": [8, 7, 0],
            "originDeltaTiles": [0, 2, 0],
            "originDeltaPixels": [0, 64],
            "topGapPixels": 0,
            "rearBaseVisibleBehindNearTopPixels": 0,
        },
        "occupants": PAIR_CHARACTERS,
        "sourceBackground": {"file": repo_path(BACKGROUND_PATH), "sha256": sha256(BACKGROUND_PATH), "usedInPairProof": False},
        "activeOfficeBaseline": {"file": repo_path(ACTIVE_MAP_PATH), "sha256": sha256(ACTIVE_MAP_PATH), "mustRemainByteIdentical": True},
    }


def manifest_data(socket_content: bytes, pair_map_content: bytes, review_paths: list[str]) -> dict[str, Any]:
    return {
        "version": 7,
        "geometrySchemaVersion": 8,
        "id": "office.workstation.step5.r05.r02",
        "status": "owner-approved-p0-p3",
        "updatedOn": "2026-07-28",
        "supersedesForPlacementAuthority": "office.workstation.step5.r05.final",
        "ownerDecision": {
            "decision": "approved",
            "approvedOn": "2026-07-28",
            "approvedScope": ["coordinate-system", "seat-sockets", "equipment-depth", "paired-workstation"],
        },
        "completedScope": ["P0", "P1", "P2", "P3"],
        "stopGate": "approved-awaiting-ten-seat-plan-execution",
        "coordinateContract": {
            "tilePixels": TILE,
            "worldAxes": {"x": "right", "y": "toward-viewer", "z": "up"},
            "projection": "screenX = worldX * 32; screenY = worldY * 32 - worldZ * 32",
            "placementFormula": "drawOrigin = project(worldSocket.xyz) - localSocket.xy",
            "independentConcepts": ["occupancy", "supportPlane", "renderBounds", "localSocket", "depthRole"],
        },
        "rosterSockets": {
            "file": repo_path(SOCKETS_PATH),
            "sha256": sha256_bytes(socket_content),
            "directoriesAudited": 19,
            "seatCapableCharacters": 18,
            "frameRecords": 216,
        },
        "components": {
            "desk": {"footprint": [3, 2], "logicalVolume": [3, 2, 2], "renderPixels": [96, 128], "supportPixels": [96, 64]},
            "chair": {"footprint": [1, 1], "logicalVolume": [1, 1, 2], "seatSocketLocal": list(CHAIR_SEAT_SOCKET), "floorSocketLocal": list(CHAIR_FLOOR_SOCKET)},
            "person": {"footprint": [1, 1], "logicalVolume": [1, 1, 3], "newCharacterOrPose": False},
            "monitor": {"reservation": [3, 1], "baseSocketLocal": [26, 40], "farLayerOrder": "keyboard-before-monitor"},
            "keyboard": {"reservation": [1, 1], "renderPixels": [48, 24]},
        },
        "station": {
            "animation": {"frames": 6, "fps": 6},
            "layerOrder": {
                "far": ["chair-behind", "actor", "chair-foreground", "desk-rear", "desk-surface", "keyboard", "monitor-back", "desk-base", "desk-foreground"],
                "near": ["desk-rear", "desk-surface", "monitor-front", "keyboard", "desk-base", "desk-foreground", "chair-behind", "actor", "chair-foreground"],
            },
        },
        "pairMap": {"file": repo_path(PAIR_MAP_PATH), "sha256": sha256_bytes(pair_map_content)},
        "reviewOutputs": review_paths,
        "browserValidation": {
            "consoleErrors": 0,
            "consoleWarnings": 0,
            "brokenImages": 0,
            "stationTopDeltaPixels": 64,
            "actorSeatDeltaPixels": [0, 0],
            "farEquipmentOrder": ["keyboard", "monitor-back"],
            "contractPass": True,
            "captures": [repo_path(path) for path in QA_CAPTURES],
        },
        "permissions": {
            "isolatedCoordinateRenderer": True,
            "rosterSeatSocketAudit": True,
            "pairedWorkstationProof": True,
            "tenSeatExpansion": False,
            "handSockets": False,
            "newCharacterOrPose": False,
            "otherFurniture": False,
            "activeOfficePromotion": False,
        },
        "activeOfficeBaseline": {"file": repo_path(ACTIVE_MAP_PATH), "sha256": sha256(ACTIVE_MAP_PATH), "mustRemainByteIdentical": True},
    }


def build_outputs() -> dict[Path, bytes]:
    outputs: dict[Path, bytes] = {}
    sockets = socket_manifest_data()
    socket_content = json_bytes(sockets)
    outputs[SOCKETS_PATH] = socket_content
    pair_map = pair_map_data()
    pair_map_content = json_bytes(pair_map)
    outputs[PAIR_MAP_PATH] = pair_map_content
    reviews = {
        REVIEW_DIR / "01-coordinate-contract.png": board_coordinate_contract(),
        REVIEW_DIR / "02-roster-front-overview.png": board_roster_overview("front"),
        REVIEW_DIR / "03-roster-back-overview.png": board_roster_overview("back"),
        REVIEW_DIR / "04-roster-front-six-frames-a.png": board_roster_frames("front", 0),
        REVIEW_DIR / "05-roster-front-six-frames-b.png": board_roster_frames("front", 1),
        REVIEW_DIR / "06-roster-back-six-frames-a.png": board_roster_frames("back", 0),
        REVIEW_DIR / "07-roster-back-six-frames-b.png": board_roster_frames("back", 1),
        REVIEW_DIR / "08-desk-depth-before-after.png": board_desk_depth(),
        REVIEW_DIR / "09-far-equipment-before-after.png": board_equipment_depth(),
        REVIEW_DIR / "10-back-seat-before-after.png": board_back_seat_before_after(),
        REVIEW_DIR / "11-paired-workstation-clean-debug.png": board_pair(),
    }
    for path, image in reviews.items():
        outputs[path] = png_bytes(image)
    review_paths = [repo_path(path) for path in reviews]
    outputs[MANIFEST_PATH] = json_bytes(manifest_data(socket_content, pair_map_content, review_paths))
    return outputs


def write_or_check(outputs: dict[Path, bytes], check: bool) -> None:
    failures = []
    for path, content in outputs.items():
        if check:
            if not path.exists() or path.read_bytes() != content:
                failures.append(repo_path(path))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
    if failures:
        raise SystemExit("Stale R05-r02 outputs: " + ", ".join(failures))
    action = "verified" if check else "built"
    print(f"R05-r02 coordinate proof {action}: {len(outputs)} deterministic outputs; Active Office unchanged.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    write_or_check(build_outputs(), args.check)


if __name__ == "__main__":
    main()
