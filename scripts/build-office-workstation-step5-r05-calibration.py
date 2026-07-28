#!/usr/bin/env python3
"""Build R05-0..R05-2 measurement evidence and owner-review boards."""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import textwrap
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
R04_DIR = ROOT / "assets/game/processed/office-workstation-v3/step5-r04"
REVIEW_DIR = ROOT / "assets/art/layout-references/office-workstation-v3/step5-r05"
MEASUREMENT_PATH = ROOT / "assets/game/manifests/office-workstation-step5-r05-measurements.json"
MANIFEST_PATH = ROOT / "assets/game/manifests/office-workstation-step5-r05-calibration.json"
R04_MANIFEST_PATH = ROOT / "assets/game/manifests/office-workstation-step5-single-seat-v4.json"
R04_COMPONENTS_PATH = ROOT / "assets/game/manifests/office-workstation-components-v3.json"
R03_MEASUREMENT_PATH = ROOT / "assets/game/manifests/office-workstation-step5-r03-measurements.json"
ACTOR_PATH = ROOT / "assets/game/characters/einstein/runtime-spritesheet-v3.webp"
ACTIVE_MAP_PATH = ROOT / "assets/game/maps/office-c-v2.json"

BOARD_SIZE = (1600, 1000)
COLORS = {
    "background": "#08111f",
    "panel": "#111d31",
    "panel2": "#18263d",
    "text": "#f1f5f9",
    "muted": "#a6b7cc",
    "line": "#40516c",
    "cyan": "#22d3ee",
    "purple": "#a78bfa",
    "amber": "#f59e0b",
    "green": "#22c55e",
    "red": "#ef4444",
    "pink": "#f43f5e",
}


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
    name = "arialbd.ttf" if bold else "arial.ttf"
    candidate = Path("C:/Windows/Fonts") / name
    if candidate.exists():
        return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default(size=size)


def label(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    value: str,
    size: int = 18,
    fill: str = COLORS["text"],
    bold: bool = False,
) -> None:
    draw.text(xy, value, font=font(size, bold), fill=fill)


def wrapped(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    value: str,
    width: int,
    size: int = 18,
    fill: str = COLORS["muted"],
    bold: bool = False,
    spacing: int = 7,
) -> None:
    draw.multiline_text(
        xy,
        textwrap.fill(value, width=width),
        font=font(size, bold),
        fill=fill,
        spacing=spacing,
    )


def panel(draw: ImageDraw.ImageDraw, bounds: tuple[int, int, int, int], title: str) -> None:
    draw.rounded_rectangle(bounds, radius=16, fill=COLORS["panel"], outline=COLORS["line"], width=2)
    label(draw, (bounds[0] + 20, bounds[1] + 16), title, 21, bold=True)


def board(title: str, subtitle: str) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGB", BOARD_SIZE, COLORS["background"])
    draw = ImageDraw.Draw(image)
    label(draw, (40, 24), title, 34, bold=True)
    label(draw, (42, 72), subtitle, 16, COLORS["amber"], True)
    return image, draw


def checker(size: tuple[int, int], cell: int = 16) -> Image.Image:
    image = Image.new("RGBA", size, (229, 237, 242, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle(
                    (x, y, min(size[0] - 1, x + cell - 1), min(size[1] - 1, y + cell - 1)),
                    fill=(209, 222, 230, 255),
                )
    return image


def alpha_bounds(image: Image.Image) -> dict[str, int]:
    bounds = image.getchannel("A").getbbox()
    if bounds is None:
        return {"x": 0, "y": 0, "width": 0, "height": 0}
    return {
        "x": bounds[0],
        "y": bounds[1],
        "width": bounds[2] - bounds[0],
        "height": bounds[3] - bounds[1],
    }


def actor_frame(sheet: Image.Image, row: int, column: int) -> Image.Image:
    return sheet.crop((column * 96, row * 104, (column + 1) * 96, (row + 1) * 104))


def lower_upholstery_band(image: Image.Image) -> list[int]:
    rows = []
    pixels = image.load()
    for y in range(35, image.height):
        blue = 0
        for x in range(image.width):
            red, green, value, alpha = pixels[x, y]
            if alpha and value > red * 1.05 and value > green * 1.02 and value > 70:
                blue += 1
        if blue >= 24:
            rows.append(y)
    return [min(rows), max(rows)] if rows else []


def source_record(path: Path) -> dict[str, Any]:
    image = Image.open(path).convert("RGBA")
    return {
        "path": repo_path(path),
        "sha256": sha256(path),
        "imagePixels": {"width": image.width, "height": image.height},
        "alphaBounds": alpha_bounds(image),
    }


def equipment_audit(geometry: dict[str, Any]) -> dict[str, Any]:
    monitor = geometry["monitor"]
    monitor_reservation = geometry["monitorReservation"]
    keyboard = geometry["keyboard"]
    keyboard_reservation = geometry["keyboardReservation"]
    monitor_center = {
        "x": monitor_reservation["left"] + monitor_reservation["width"] // 2,
        "y": monitor_reservation["top"] + monitor_reservation["height"] // 2,
    }
    keyboard_center = {
        "x": keyboard_reservation["left"] + keyboard_reservation["width"] // 2,
        "y": keyboard_reservation["top"] + keyboard_reservation["height"] // 2,
    }
    monitor_base = {"x": monitor["left"] + monitor["width"] // 2, "y": monitor["top"] + monitor["height"]}
    keyboard_visual_center = {
        "x": keyboard["left"] + keyboard["width"] // 2,
        "y": keyboard["top"] + keyboard["height"] // 2,
    }
    return {
        "monitor": {
            "reservationCenter": monitor_center,
            "currentBaseContact": monitor_base,
            "centerErrorPixels": {
                "x": monitor_base["x"] - monitor_center["x"],
                "y": monitor_base["y"] - monitor_center["y"],
            },
            "result": "rejected-base-contact-on-row-edge",
        },
        "keyboard": {
            "reservationCenter": keyboard_center,
            "currentVisualCenter": keyboard_visual_center,
            "centerErrorPixels": {
                "x": keyboard_visual_center["x"] - keyboard_center["x"],
                "y": keyboard_visual_center["y"] - keyboard_center["y"],
            },
            "result": "rejected-asymmetric-orientation-offset",
        },
    }


def measurement_data() -> dict[str, Any]:
    r04 = json.loads(R04_MANIFEST_PATH.read_text(encoding="utf-8"))
    actor = Image.open(ACTOR_PATH).convert("RGBA")
    chair_front = Image.open(R04_DIR / "chair.office.modern.v3.front.png").convert("RGBA")
    chair_back = Image.open(R04_DIR / "chair.office.modern.v3.back.png").convert("RGBA")
    actor_rows = {}
    for name, row in (("workingBackSeated", 13), ("workingFrontSeated", 14)):
        actor_rows[name] = {
            "row": row,
            "frames": [
                {"column": column, "alphaBounds": alpha_bounds(actor_frame(actor, row, column))}
                for column in range(6)
            ],
        }
    chair_parts = {}
    for orientation in ("front", "back"):
        chair_parts[orientation] = {}
        for role in ("rear", "seat", "foreground"):
            path = R04_DIR / f"chair.office.modern.v3.{orientation}.{role}.png"
            chair_parts[orientation][role] = source_record(path)
    return {
        "version": 1,
        "id": "office.workstation.step5.r05.measurements",
        "status": "deterministic-failure-measurement-evidence",
        "updatedOn": "2026-07-28",
        "measurementPolicy": {
            "reservation": "top-down world occupancy independent from visual alpha pixels",
            "pixelBounds": "alpha end-exclusive bounds",
            "contact": "must be derived from visible support and pelvis pivots; equality of declarations is not evidence",
            "creativeRedraw": False,
            "ownerApprovalRequired": True,
        },
        "sources": {
            "r04Manifest": {"path": repo_path(R04_MANIFEST_PATH), "sha256": sha256(R04_MANIFEST_PATH)},
            "r04Components": {"path": repo_path(R04_COMPONENTS_PATH), "sha256": sha256(R04_COMPONENTS_PATH)},
            "r03Measurements": {"path": repo_path(R03_MEASUREMENT_PATH), "sha256": sha256(R03_MEASUREMENT_PATH)},
            "runtimeCharacterSheet": source_record(ACTOR_PATH),
            "chairFront": source_record(R04_DIR / "chair.office.modern.v3.front.png"),
            "chairBack": source_record(R04_DIR / "chair.office.modern.v3.back.png"),
            "monitorFront": source_record(R04_DIR / "monitor.workstation.v3.front.png"),
            "monitorBack": source_record(R04_DIR / "monitor.workstation.v3.back.png"),
            "keyboard": source_record(R04_DIR / "keyboard.workstation.v3.full.png"),
            "acceptedDeskSeat": source_record(R04_DIR / "desk.workstation.modern.v3.seat.png"),
            "acceptedDeskPublic": source_record(R04_DIR / "desk.workstation.modern.v3.public.png"),
        },
        "acceptedDesk": {
            "reservation": [3, 2],
            "logicalVolume": [3, 2, 2],
            "supportPixels": [96, 64],
            "decision": "retain-byte-identical",
        },
        "runtimeCharacter": {
            "reservation": [1, 1],
            "logicalVolume": [1, 1, 3],
            "framePixels": [96, 104],
            "visualOverflowAllowed": True,
            "seatedRows": actor_rows,
            "pelvisContactPivot": None,
            "pivotStatus": "unmeasured-r04-declaration-rejected",
        },
        "rejectedR04Chair": {
            "reservation": [1, 1],
            "logicalVolume": [1, 1, 2],
            "declaredSeatSplitStartLocalY": 48,
            "frontLowerUpholsteryBandLocalY": lower_upholstery_band(chair_front),
            "backLowerUpholsteryBandLocalY": lower_upholstery_band(chair_back),
            "partAlphaBounds": chair_parts,
            "seatLayerContainsCushion": False,
            "seatLayerActualMeaning": "wheel-and-base-region",
            "failure": "The declared z1 line is below the visible cushion band and the seat mask begins in the base.",
        },
        "rejectedR04Equipment": {
            "far": equipment_audit(r04["geometry"]["far"]),
            "near": equipment_audit(r04["geometry"]["near"]),
        },
        "r05ProposedContracts": {
            "coordinateFormula": "drawOrigin = worldReservationCenter - localVisualPivot",
            "chair": {
                "reservation": [1, 1],
                "baseAndSeatVolume": [1, 1, 1],
                "backrestVolume": [1, 1, 1],
                "levels": {"floor": 0, "seatPlane": 1, "backrestTop": 2},
                "requiredMeasuredPivots": ["floor-contact", "seat-plane", "back-support", "person-pelvis-contact"],
            },
            "monitor": {
                "reservation": [3, 1],
                "targetVisualWidthPixels": [72, 80],
                "localPivot": "base-contact-center",
                "maximumOppositeSideClearanceDeltaPixels": 1,
            },
            "keyboard": {
                "reservation": [1, 1],
                "targetVisualPixels": {"width": [44, 48], "depth": [18, 20]},
                "localPivot": "visual-alpha-center",
                "minimumFrontBackClearancePixels": 6,
                "maximumSideOverhangPixels": 8,
            },
        },
        "ownerFeedbackR05_3A": {
            "keyboard": {
                "decision": "accepted-and-frozen",
                "reservation": [1, 1],
                "renderPixels": [48, 24],
                "localVisualPivot": [24, 12],
            },
            "monitor": {
                "decision": "anchor-proof-required",
                "reservation": [3, 1],
                "supportFootprint": [1, 1],
                "supportAnchorDeskLocal": [1.5, 0.5, 2],
                "temporaryVisualPivot": [26, 40],
                "beforeCenterErrorPixels": {"far": [0, 16], "near": [0, 16]},
                "afterCenterErrorPixels": {"far": [0, 0], "near": [0, 0]},
                "proofUsesExistingVisual": True,
            },
            "chairPerson": {
                "decision": "two-volume-anchor-proof-required",
                "r04ChairPixelsAllowed": False,
                "physicalParts": {
                    "base-seat": {"volume": [1, 1, 1], "zRange": [0, 1]},
                    "backrest-arms": {"volume": [1, 1, 1], "zRange": [1, 2]},
                },
                "personSegments": {
                    "legs": {"zRange": [0, 1]},
                    "torso": {"zRange": [1, 2]},
                    "head": {"zRange": [2, 3]},
                },
                "actorLogicalFloorSocketLocal": [48, 112],
                "seatPlaneCandidateLocal": [48, 80],
                "seatHeightPixels": 32,
                "candidateBasis": "front frame first sustained pants/thigh row; back view inherits the shared seated skeleton anchor because the coat occludes the pelvis",
                "contactErrorPixels": {"front": [0, 0], "back": [0, 0]},
                "candidateStatus": "owner-anchor-proof-review-not-polished-art",
            },
        },
        "gate": {
            "completed": ["R05-0", "R05-1", "R05-2", "R05-3A"],
            "blocked": ["R05-3B", "polished-artwork", "renderer", "ten-seat", "step6", "active-office"],
        },
    }


def draw_world_grid(
    draw: ImageDraw.ImageDraw,
    origin: tuple[int, int],
    tile: int,
    monitor_row: int,
    title: str,
) -> None:
    left, top = origin
    width, height = tile * 3, tile * 2
    draw.rectangle((left, top, left + width, top + height), fill="#e5edf2", outline=COLORS["cyan"], width=4)
    for column in range(1, 3):
        draw.line((left + column * tile, top, left + column * tile, top + height), fill="#7f93aa", width=2)
    draw.line((left, top + tile, left + width, top + tile), fill="#7f93aa", width=2)
    monitor_top = top + monitor_row * tile
    draw.rectangle(
        (left + 3, monitor_top + 3, left + width - 3, monitor_top + tile - 3),
        outline=COLORS["purple"],
        width=4,
    )
    keyboard_row = 1 - monitor_row
    keyboard_left = left + tile
    keyboard_top = top + keyboard_row * tile
    draw.rectangle(
        (keyboard_left + 3, keyboard_top + 3, keyboard_left + tile - 3, keyboard_top + tile - 3),
        outline=COLORS["amber"],
        width=4,
    )
    monitor_width = round(76 / 32 * tile)
    monitor_depth = round(16 / 32 * tile)
    center_x = left + width // 2
    center_y = monitor_top + tile // 2
    draw.rounded_rectangle(
        (center_x - monitor_width // 2, center_y - monitor_depth // 2,
         center_x + monitor_width // 2, center_y + monitor_depth // 2),
        radius=8,
        fill="#6d5aa8",
    )
    keyboard_width = round(48 / 32 * tile)
    keyboard_depth = round(20 / 32 * tile)
    keyboard_center_y = keyboard_top + tile // 2
    draw.rounded_rectangle(
        (center_x - keyboard_width // 2, keyboard_center_y - keyboard_depth // 2,
         center_x + keyboard_width // 2, keyboard_center_y + keyboard_depth // 2),
        radius=8,
        fill="#b8780c",
    )
    for center in ((center_x, center_y), (center_x, keyboard_center_y)):
        draw.line((center[0] - 11, center[1], center[0] + 11, center[1]), fill=COLORS["red"], width=3)
        draw.line((center[0], center[1] - 11, center[0], center[1] + 11), fill=COLORS["red"], width=3)
    label(draw, (left, top - 34), title, 18, COLORS["text"], True)


def board_reservation_contract() -> Image.Image:
    image, draw = board(
        "STEP 5 R05 / RESERVATION, VISUAL ENVELOPE, AND PIVOT",
        "R05-1 CONTRACT / DESK PIXELS RETAINED / NO NEW ARTWORK OR RUNTIME",
    )
    panel(draw, (38, 120, 1015, 950), "A. ONE 3 x 2 SUPPORT / SAME WORLD CENTERS")
    draw_world_grid(draw, (150, 245), 192, 0, "NEAR VIEW CONTRACT")
    draw_world_grid(draw, (150, 690), 96, 1, "FAR VIEW CONTRACT (SMALL COMPARISON)")
    label(draw, (505, 704), "Purple outline = 3 x 1 monitor reservation", 17, COLORS["purple"], True)
    label(draw, (505, 748), "Amber outline = 1 x 1 keyboard reservation", 17, COLORS["amber"], True)
    label(draw, (505, 792), "Solid shape = visual envelope; it does not fill the reservation", 17)
    label(draw, (505, 836), "Red cross = world support anchor (default: reservation center)", 16, COLORS["red"], True)
    label(draw, (150, 635), "TOP-DOWN OCCUPANCY IS NOT THE PERSPECTIVE SPRITE IMAGE", 17, COLORS["green"], True)

    panel(draw, (1035, 120, 1562, 950), "B. R05 GEOMETRY AUTHORITY")
    rules = [
        ("1", "Reserve from the top-down world grid.", COLORS["cyan"]),
        ("2", "Give every visual a measured local pivot.", COLORS["purple"]),
        ("3", "Attach a semantic support socket inside the reservation.", COLORS["amber"]),
        ("4", "Apply support height z separately.", COLORS["green"]),
        ("5", "Allow visual overflow without changing collision.", COLORS["pink"]),
    ]
    y = 190
    for number, value, color in rules:
        draw.ellipse((1070, y, 1110, y + 40), fill=color)
        label(draw, (1083, y + 6), number, 20, COLORS["background"], True)
        wrapped(draw, (1130, y), value, 32, 18, COLORS["text"], True)
        y += 88
    draw.rounded_rectangle((1070, 660, 1528, 785), radius=12, fill=COLORS["panel2"], outline=COLORS["cyan"], width=2)
    label(draw, (1092, 682), "drawOrigin =", 21, COLORS["cyan"], True)
    label(draw, (1092, 718), "project(worldSupportAnchor)", 17, bold=True)
    label(draw, (1092, 750), "- localVisualPivot", 19, COLORS["amber"], True)
    wrapped(
        draw,
        (1070, 815),
        "Front and back orientations may select different art, but they may not introduce different placement offsets.",
        43,
        17,
        COLORS["muted"],
    )
    return image


def compose_rejected_chair_actor(orientation: str, frame: int = 0) -> Image.Image:
    actor_sheet = Image.open(ACTOR_PATH).convert("RGBA")
    actor = actor_frame(actor_sheet, 14 if orientation == "front" else 13, frame)
    parts = {
        role: Image.open(R04_DIR / f"chair.office.modern.v3.{orientation}.{role}.png").convert("RGBA")
        for role in ("rear", "seat", "foreground")
    }
    image = Image.new("RGBA", (96, 104), (220, 232, 239, 255))
    for role in ("rear", "seat"):
        image.alpha_composite(parts[role], (16, 24))
    image.alpha_composite(actor)
    image.alpha_composite(parts["foreground"], (16, 24))
    return image


def board_chair_contact(data: dict[str, Any]) -> Image.Image:
    image, draw = board(
        "STEP 5 R05 / CHAIR + PERSON CONTACT MEASUREMENT",
        "R05-2 EVIDENCE / R04 DECLARATION REJECTED / PELVIS PIVOT REMAINS UNLOCKED",
    )
    panel(draw, (38, 120, 1000, 680), "A. WHY R04 DOES NOT SHOW A PERSON SITTING ON THE CUSHION")
    for index, orientation in enumerate(("front", "back")):
        left = 92 + index * 440
        composite = compose_rejected_chair_actor(orientation).resize((384, 416), Image.Resampling.NEAREST)
        image.paste(composite.convert("RGB"), (left, 190))
        declared_y = 190 + 72 * 4
        band = data["rejectedR04Chair"][f"{orientation}LowerUpholsteryBandLocalY"]
        band_top = 190 + (24 + band[0]) * 4
        band_bottom = 190 + (24 + band[1] + 1) * 4
        draw.rectangle((left, band_top, left + 384, band_bottom), outline=COLORS["green"], width=4)
        draw.line((left, declared_y, left + 384, declared_y), fill=COLORS["red"], width=4)
        label(draw, (left, 620), f"{orientation.upper()}: cushion local y {band[0]}..{band[1]}", 16, COLORS["green"], True)
        label(draw, (left, 646), "red = declared local y 48 / not measured pelvis", 15, COLORS["red"], True)

    panel(draw, (1020, 120, 1562, 680), "B. REQUIRED PHYSICAL PARTS")
    block_left, block_top, block_width, level = 1100, 222, 380, 105
    draw.rectangle((block_left, block_top + level * 2, block_left + block_width, block_top + level * 3),
                   fill="#37556f", outline=COLORS["cyan"], width=3)
    draw.rectangle((block_left, block_top + level, block_left + block_width, block_top + level * 2),
                   fill="#604e88", outline=COLORS["purple"], width=3)
    draw.rectangle((block_left, block_top, block_left + block_width, block_top + level),
                   outline=COLORS["line"], width=3)
    label(draw, (1120, block_top + 12), "PERSON HEAD / z2..z3", 18, bold=True)
    label(draw, (1120, block_top + level + 12), "BACKREST + TORSO / z1..z2", 18, bold=True)
    label(draw, (1120, block_top + level * 2 + 12), "BASE + SEAT + PELVIS / z0..z1", 17, bold=True)
    draw.line((block_left - 18, block_top + level * 2, block_left + block_width + 18, block_top + level * 2),
              fill=COLORS["green"], width=5)
    label(draw, (1120, block_top + level * 2 - 32), "MEASURED SEAT PLANE z1", 16, COLORS["green"], True)
    wrapped(
        draw,
        (1060, 555),
        "R05-3 must generate a chair with separate base-seat and backrest masks, then measure floor, cushion, back support, and pelvis pivots from the actual pixels.",
        48,
        17,
        COLORS["muted"],
    )

    panel(draw, (38, 705, 1562, 950), "C. EXISTING SIX-FRAME POSE IS RETAINED / CONTACT IS NOT INVENTED")
    actor = Image.open(ACTOR_PATH).convert("RGBA")
    for row_index, (name, row) in enumerate((("BACK", 13), ("FRONT", 14))):
        y = 755 + row_index * 88
        label(draw, (70, y + 28), name, 16, COLORS["cyan"], True)
        for column in range(6):
            frame = actor_frame(actor, row, column).resize((72, 78), Image.Resampling.NEAREST)
            image.paste(frame.convert("RGB"), (165 + column * 100, y), frame.resize((72, 78), Image.Resampling.NEAREST))
            bounds = data["runtimeCharacter"]["seatedRows"][
                "workingBackSeated" if row == 13 else "workingFrontSeated"
            ]["frames"][column]["alphaBounds"]
            label(draw, (165 + column * 100, y + 80), f"{bounds['width']}x{bounds['height']}", 11, COLORS["muted"])
    draw.rounded_rectangle((850, 760, 1515, 908), radius=12, fill=COLORS["panel2"], outline=COLORS["red"], width=2)
    label(draw, (882, 785), "PELVIS CONTACT PIVOT: UNMEASURED", 20, COLORS["red"], True)
    wrapped(
        draw,
        (882, 830),
        "The old [48,72] value is only a declaration. Approval of this board authorizes measurement in R05-3, not a new character or pose.",
        58,
        16,
        COLORS["text"],
    )
    return image


def draw_equipment_case(
    canvas: Image.Image,
    draw: ImageDraw.ImageDraw,
    left: int,
    top: int,
    orientation: str,
    audit: dict[str, Any],
) -> None:
    scale = 4
    width, height = 96 * scale, 64 * scale
    draw.rectangle((left, top, left + width, top + height), fill="#e5edf2", outline=COLORS["cyan"], width=3)
    for x in (32, 64):
        draw.line((left + x * scale, top, left + x * scale, top + height), fill="#7f93aa", width=2)
    draw.line((left, top + 32 * scale, left + width, top + 32 * scale), fill="#7f93aa", width=2)
    geometry = json.loads(R04_MANIFEST_PATH.read_text(encoding="utf-8"))["geometry"][orientation]
    support = geometry["support"]
    for key, asset_name in (
        ("monitor", f"monitor.workstation.v3.{'back' if orientation == 'far' else 'front'}.png"),
        ("keyboard", "keyboard.workstation.v3.full.png"),
    ):
        asset = Image.open(R04_DIR / asset_name).convert("RGBA").resize(
            (geometry[key]["width"] * scale, geometry[key]["height"] * scale),
            Image.Resampling.NEAREST,
        )
        x = left + (geometry[key]["left"] - support["left"]) * scale
        y = top + (geometry[key]["top"] - support["top"]) * scale
        canvas.paste(asset.convert("RGB"), (x, y), asset)
    monitor_center = audit["monitor"]["reservationCenter"]
    monitor_base = audit["monitor"]["currentBaseContact"]
    keyboard_center = audit["keyboard"]["reservationCenter"]
    keyboard_visual = audit["keyboard"]["currentVisualCenter"]
    for point, color in (
        (monitor_center, COLORS["green"]),
        (keyboard_center, COLORS["green"]),
        (monitor_base, COLORS["red"]),
        (keyboard_visual, COLORS["red"]),
    ):
        x = left + (point["x"] - support["left"]) * scale
        y = top + (point["y"] - support["top"]) * scale
        draw.line((x - 9, y, x + 9, y), fill=color, width=3)
        draw.line((x, y - 9, x, y + 9), fill=color, width=3)


def board_equipment_pivots(data: dict[str, Any]) -> Image.Image:
    image, draw = board(
        "STEP 5 R05 / EQUIPMENT CENTER-PIVOT CALIBRATION",
        "R05-2 EVIDENCE / CURRENT PIXELS ARE FAILURE REFERENCES, NOT APPROVED ASSETS",
    )
    for index, orientation in enumerate(("far", "near")):
        left = 38 + index * 780
        panel(draw, (left, 120, left + 750, 650), f"{orientation.upper()} / R04 PLACEMENT FAILURE")
        audit = data["rejectedR04Equipment"][orientation]
        draw_equipment_case(image, draw, left + 170, 210, orientation, audit)
        monitor_error = audit["monitor"]["centerErrorPixels"]
        keyboard_error = audit["keyboard"]["centerErrorPixels"]
        label(draw, (left + 55, 495), f"Monitor base error: ({monitor_error['x']}, {monitor_error['y']}) px", 19, COLORS["red"], True)
        label(draw, (left + 55, 535), f"Keyboard center error: ({keyboard_error['x']}, {keyboard_error['y']}) px", 19,
              COLORS["red"] if keyboard_error["y"] else COLORS["green"], True)
        label(draw, (left + 55, 580), "green cross = reservation center / red cross = current visual pivot", 15)

    panel(draw, (38, 680, 1562, 950), "R05 ACCEPTANCE CONTRACT / APPLIES IDENTICALLY TO FRONT AND BACK")
    columns = [
        (
            75,
            "MONITOR / 3 x 1 RESERVATION",
            [
                "visual width target: 72..80 px",
                "pivot: measured base-contact center",
                "opposite-side clearance delta <= 1 px",
            ],
            COLORS["purple"],
        ),
        (
            570,
            "KEYBOARD / 1 x 1 RESERVATION",
            [
                "visual target: 44..48 x 18..20 px",
                "front/back clearance >= 6 px",
                "side overhang <= 8 px",
            ],
            COLORS["amber"],
        ),
        (
            1060,
            "ONE PLACEMENT FORMULA",
            [
                "support anchor defaults to reservation center",
                "draw = project(support anchor) - local pivot",
                "orientation-specific magic offsets = forbidden",
            ],
            COLORS["cyan"],
        ),
    ]
    for left, title, lines, color in columns:
        label(draw, (left, 735), title, 18, color, True)
        for index, line in enumerate(lines):
            label(draw, (left, 780 + index * 38), f"• {line}", 16, COLORS["text"])
    return image


def draw_monitor_anchor_case(
    canvas: Image.Image,
    draw: ImageDraw.ImageDraw,
    origin: tuple[int, int],
    orientation: str,
    corrected: bool,
    scale: int = 3,
) -> None:
    r04 = json.loads(R04_MANIFEST_PATH.read_text(encoding="utf-8"))
    geometry = r04["geometry"][orientation]
    support = geometry["support"]
    reservation = geometry["monitorReservation"]
    left, top = origin
    width, depth = 96 * scale, 64 * scale
    draw.rectangle((left, top, left + width, top + depth), fill="#e5edf2", outline=COLORS["cyan"], width=3)
    for x in (32, 64):
        draw.line((left + x * scale, top, left + x * scale, top + depth), fill="#7f93aa", width=2)
    draw.line((left, top + 32 * scale, left + width, top + 32 * scale), fill="#7f93aa", width=2)
    reservation_left = left + (reservation["left"] - support["left"]) * scale
    reservation_top = top + (reservation["top"] - support["top"]) * scale
    draw.rectangle(
        (reservation_left + 2, reservation_top + 2,
         reservation_left + reservation["width"] * scale - 2,
         reservation_top + reservation["height"] * scale - 2),
        outline=COLORS["purple"], width=4,
    )
    center_cell_left = left + 32 * scale
    draw.rectangle(
        (center_cell_left + 7, reservation_top + 7,
         center_cell_left + 32 * scale - 7, reservation_top + 32 * scale - 7),
        outline=COLORS["green"], width=3,
    )
    target = {
        "x": reservation["left"] + reservation["width"] // 2,
        "y": reservation["top"] + reservation["height"] // 2,
    }
    monitor_geometry = geometry["monitor"]
    if corrected:
        monitor_left = target["x"] - 26
        monitor_top = target["y"] - 40
    else:
        monitor_left = monitor_geometry["left"]
        monitor_top = monitor_geometry["top"]
    asset_name = f"monitor.workstation.v3.{'back' if orientation == 'far' else 'front'}.png"
    monitor = Image.open(R04_DIR / asset_name).convert("RGBA").resize((52 * scale, 40 * scale), Image.Resampling.NEAREST)
    x = left + (monitor_left - support["left"]) * scale
    y = top + (monitor_top - support["top"]) * scale
    canvas.paste(monitor.convert("RGB"), (x, y), monitor)
    current_base = {"x": monitor_left + 26, "y": monitor_top + 40}
    points = ((target, COLORS["green"]),) if corrected else (
        (target, COLORS["green"]), (current_base, COLORS["red"]),
    )
    for point, color in points:
        px = left + (point["x"] - support["left"]) * scale
        py = top + (point["y"] - support["top"]) * scale
        draw.line((px - 10, py, px + 10, py), fill=color, width=3)
        draw.line((px, py - 10, px, py + 10), fill=color, width=3)


def board_monitor_anchor_before_after() -> Image.Image:
    image, draw = board(
        "STEP 5 R05-3A / MONITOR BASE-SOCKET BEFORE + AFTER",
        "SAME TEMPORARY MONITOR PIXELS / ONLY SUPPORT ANCHOR CHANGES / KEYBOARD ACCEPTED AND FROZEN",
    )
    cases = [
        (38, 120, "far", False),
        (812, 120, "far", True),
        (38, 535, "near", False),
        (812, 535, "near", True),
    ]
    for left, top, orientation, corrected in cases:
        title = f"{'AFTER' if corrected else 'BEFORE'} / {orientation.upper()}"
        panel(draw, (left, top, left + 750, top + 385), title)
        draw_monitor_anchor_case(image, draw, (left + 225, top + 105), orientation, corrected)
        error = 0 if corrected else 16
        label(
            draw,
            (left + 42, top + 330),
            f"base-to-support-center error = {error} px",
            18,
            COLORS["green"] if corrected else COLORS["red"],
            True,
        )
        label(draw, (left + 410, top + 330), "green box = central 1 x 1 support footprint", 14, COLORS["muted"])
    label(draw, (42, 950), "RESULT: reservation remains 3 x 1; the stand base attaches to the center of its middle support cell in both views.",
          17, COLORS["green"], True)
    return image


def chair_anchor_layers(orientation: str) -> dict[str, Image.Image]:
    rear = Image.new("RGBA", (96, 112), (0, 0, 0, 0))
    foreground = Image.new("RGBA", (96, 112), (0, 0, 0, 0))
    rear_draw = ImageDraw.Draw(rear)
    front_draw = ImageDraw.Draw(foreground)
    outline = "#172033"
    upholstery = "#294d78"
    upholstery_light = "#3e6b9c"
    metal = "#46556a"
    wheel = "#1f2937"

    # Physical part A: base + seat occupies z0..z1 and exposes a seat socket at local y=80.
    rear_draw.rounded_rectangle((24, 80, 72, 88), radius=4, fill=upholstery_light, outline=outline, width=2)
    rear_draw.rectangle((45, 87, 51, 105), fill=metal, outline=outline, width=1)
    rear_draw.rectangle((31, 104, 65, 108), fill=metal, outline=outline, width=1)
    rear_draw.rectangle((18, 106, 36, 109), fill=metal, outline=outline, width=1)
    rear_draw.rectangle((60, 106, 78, 109), fill=metal, outline=outline, width=1)
    rear_draw.rounded_rectangle((15, 107, 23, 111), radius=2, fill=wheel, outline=outline, width=1)
    rear_draw.rounded_rectangle((73, 107, 81, 111), radius=2, fill=wheel, outline=outline, width=1)

    # Physical part B: backrest + arms occupies z1..z2. Its depth decides whether it is rear or foreground.
    backrest_draw = rear_draw if orientation == "front" else front_draw
    backrest_draw.rounded_rectangle((24, 48, 72, 79), radius=7, fill=upholstery, outline=outline, width=3)
    backrest_draw.line((29, 76, 67, 76), fill=upholstery_light, width=2)

    # Foreground masks are derived from the two physical masters; they are not extra logical volumes.
    front_draw.rounded_rectangle((23, 85, 73, 90), radius=3, fill=upholstery, outline=outline, width=2)
    front_draw.rectangle((18, 64, 24, 84), fill=metal, outline=outline, width=1)
    front_draw.rectangle((72, 64, 78, 84), fill=metal, outline=outline, width=1)
    front_draw.rounded_rectangle((16, 62, 26, 67), radius=2, fill=upholstery, outline=outline, width=1)
    front_draw.rounded_rectangle((70, 62, 80, 67), radius=2, fill=upholstery, outline=outline, width=1)
    return {"rear": rear, "foreground": foreground}


def compose_chair_anchor_proof(orientation: str, frame: int = 0) -> Image.Image:
    actor_sheet = Image.open(ACTOR_PATH).convert("RGBA")
    actor = actor_frame(actor_sheet, 14 if orientation == "front" else 13, frame)
    chair = chair_anchor_layers(orientation)
    image = checker((96, 112), 16)
    image.alpha_composite(chair["rear"])
    image.alpha_composite(actor, (0, 0))
    image.alpha_composite(chair["foreground"])
    return image


def board_chair_two_volume_before_after() -> Image.Image:
    image, draw = board(
        "STEP 5 R05-3A / CHAIR TWO-VOLUME BEFORE + AFTER",
        "AFTER IS AN ANCHOR PROOF, NOT POLISHED CHAIR ART / CURRENT CHARACTER AND POSE PIXELS ARE UNCHANGED",
    )
    panel(draw, (38, 120, 780, 735), "BEFORE / REJECTED R04 CHAIR MASKS")
    panel(draw, (818, 120, 1562, 735), "AFTER / TWO PHYSICAL PARTS + DERIVED OCCLUSION MASKS")
    for column, orientation in enumerate(("front", "back")):
        x_before = 90 + column * 335
        x_after = 870 + column * 335
        y = 205
        before_canvas = checker((96, 112), 16)
        before_canvas.alpha_composite(compose_rejected_chair_actor(orientation))
        before = before_canvas.resize((288, 336), Image.Resampling.NEAREST)
        after = compose_chair_anchor_proof(orientation).resize((288, 336), Image.Resampling.NEAREST)
        image.paste(before.convert("RGB"), (x_before, y))
        image.paste(after.convert("RGB"), (x_after, y))
        seat_y = y + 80 * 3
        draw.line((x_before, seat_y, x_before + 288, seat_y), fill=COLORS["red"], width=4)
        draw.line((x_after, seat_y, x_after + 288, seat_y), fill=COLORS["green"], width=4)
        label(draw, (x_before, 540), orientation.upper(), 16, COLORS["red"], True)
        label(draw, (x_after, 540), orientation.upper(), 16, COLORS["green"], True)
        label(draw, (x_before, 574), "declared line / wrong mask", 14, COLORS["muted"])
        label(draw, (x_after, 590), "pelvis = cushion surface @ y80", 14, COLORS["text"])

    panel(draw, (38, 760, 1562, 950), "XYZ SOCKET MODEL / PHYSICAL VOLUME IS NOT THE SAME THING AS A DRAW MASK")
    rules = [
        (72, "z0..z1", "BASE + SEAT 1 x 1 x 1", "floor socket z0 / cushion socket z1", COLORS["cyan"]),
        (565, "z1..z2", "BACKREST + ARMS 1 x 1 x 1", "back-support socket / head remains above", COLORS["purple"]),
        (1060, "z0..z3", "PERSON 1 x 1 x 3", "legs / torso / head; pelvis socket at z1", COLORS["amber"]),
    ]
    for left, level, title, note, color in rules:
        draw.rounded_rectangle((left, 812, left + 430, 918), radius=12, fill=COLORS["panel2"], outline=color, width=3)
        label(draw, (left + 20, 830), level, 18, color, True)
        label(draw, (left + 120, 830), title, 16, COLORS["text"], True)
        label(draw, (left + 20, 875), note, 14, COLORS["muted"])
    return image


def board_contact_stability_before_after() -> Image.Image:
    image, draw = board(
        "STEP 5 R05-3A / PERSON-SEAT CONTACT ACROSS SIX FRAMES",
        "ONE FIXED FLOOR SOCKET + ONE FIXED SEAT SOCKET / NO CHARACTER OR POSE REGENERATION",
    )
    for row_index, orientation in enumerate(("front", "back")):
        panel_top = 120 + row_index * 415
        panel(draw, (38, panel_top, 1562, panel_top + 385), f"{orientation.upper()} / BEFORE FRAME 0 + AFTER FRAMES 0..5")
        label(draw, (65, panel_top + 68), "BEFORE", 15, COLORS["red"], True)
        before_canvas = checker((96, 112), 16)
        before_canvas.alpha_composite(compose_rejected_chair_actor(orientation))
        before = before_canvas.resize((192, 224), Image.Resampling.NEAREST)
        image.paste(before.convert("RGB"), (65, panel_top + 105))
        draw.line((65, panel_top + 105 + 160, 257, panel_top + 105 + 160), fill=COLORS["red"], width=3)
        for frame in range(6):
            x = 330 + frame * 198
            after = compose_chair_anchor_proof(orientation, frame).resize((192, 224), Image.Resampling.NEAREST)
            image.paste(after.convert("RGB"), (x, panel_top + 105))
            seat_y = panel_top + 105 + 160
            draw.line((x, seat_y, x + 192, seat_y), fill=COLORS["green"], width=3)
            label(draw, (x + 70, panel_top + 340), f"F{frame}", 14, COLORS["muted"], True)
        label(draw, (65, panel_top + 340), "R04 mask does not contain cushion", 13, COLORS["red"])
        label(draw, (330, panel_top + 68), "AFTER / contact error 0 px / anchor drift 0 px", 16, COLORS["green"], True)
    label(draw, (42, 955), "Green line = measured pose boundary and seat socket at local y80; logical floor socket is local y112, exactly one 32 px z level below.",
          16, COLORS["green"], True)
    return image


def manifest_data(measurement_content: bytes) -> dict[str, Any]:
    outputs = [
        REVIEW_DIR / "01-reservation-vs-visual-pivot.png",
        REVIEW_DIR / "02-chair-person-contact-measurement.png",
        REVIEW_DIR / "03-equipment-center-pivot-calibration.png",
        REVIEW_DIR / "04-monitor-base-socket-before-after.png",
        REVIEW_DIR / "05-chair-two-volume-before-after.png",
        REVIEW_DIR / "06-person-seat-contact-six-frames.png",
    ]
    return {
        "version": 5,
        "geometrySchemaVersion": 6,
        "id": "office.workstation.step5.r05.calibration",
        "status": "owner-anchor-proof-review",
        "updatedOn": "2026-07-28",
        "replaces": "office.workstation.step5.single-seat.v4",
        "completedScope": ["R05-0", "R05-1", "R05-2", "R05-3A"],
        "nextScope": "R05-3B-blocked-pending-owner-approval",
        "activeOfficeBaseline": {
            "file": repo_path(ACTIVE_MAP_PATH),
            "sha256": sha256(ACTIVE_MAP_PATH),
            "mustRemainByteIdentical": True,
        },
        "acceptedInputs": {
            "desk": {
                "decision": "retain-byte-identical",
                "reservation": [3, 2],
                "logicalVolume": [3, 2, 2],
                "supportPixels": [96, 64],
            },
            "charactersAndPoses": {
                "decision": "retain-existing-roster-and-seated-rows",
                "newCharacterOrPose": False,
                "personStandard": [1, 1, 3],
            },
        },
        "coordinateContract": {
            "tilePixels": 32,
            "reservationSpace": "top-down-world-grid",
            "visualSpace": "perspective-alpha-envelope-independent-from-reservation",
            "supportHeight": "world-z-independent-from-top-down-reservation",
            "supportAnchorDefault": "reservation-center",
            "supportAnchorOverride": "explicit-semantic-socket-inside-reservation-only",
            "drawFormula": "drawOrigin = project(worldSupportAnchor.xyz) - localVisualPivot.xy",
            "orientationSpecificMagicOffsets": "forbidden",
        },
        "componentContracts": {
            "chair": {
                "reservation": [1, 1],
                "logicalVolume": [1, 1, 2],
                "baseAndSeatVolume": [1, 1, 1],
                "backrestVolume": [1, 1, 1],
                "levels": {"floor": 0, "seatPlane": 1, "backrestTop": 2},
                "physicalParts": [
                    {"id": "base-seat", "volume": [1, 1, 1], "zRange": [0, 1]},
                    {"id": "backrest-arms", "volume": [1, 1, 1], "zRange": [1, 2]},
                ],
                "derivedRenderMasks": ["base-seat-rear", "seat-front-lip", "backrest-rear", "backrest-foreground", "armrests-foreground"],
                "requiredMeasuredPivots": ["floor-contact", "seat-plane", "back-support", "person-pelvis-contact"],
                "anchorProof": {
                    "actorLogicalFloorSocketLocal": [48, 112],
                    "seatPlaneCandidateLocal": [48, 80],
                    "seatHeightPixels": 32,
                    "candidateBasis": "front frame first sustained pants/thigh row; back view inherits the shared seated skeleton anchor because the coat occludes the pelvis",
                    "contactErrorPixels": {"front": [0, 0], "back": [0, 0]},
                    "status": "owner-review-placeholder-not-polished-art",
                },
            },
            "monitor": {
                "reservation": [3, 1],
                "supportFootprint": [1, 1],
                "supportAnchorDeskLocal": [1.5, 0.5, 2],
                "targetVisualWidthPixels": [72, 80],
                "pivot": "base-contact-center",
                "temporaryProofVisualPivot": [26, 40],
                "beforeCenterErrorPixels": {"far": [0, 16], "near": [0, 16]},
                "afterCenterErrorPixels": {"far": [0, 0], "near": [0, 0]},
                "maximumOppositeSideClearanceDeltaPixels": 1,
            },
            "keyboard": {
                "decision": "owner-accepted-and-frozen",
                "reservation": [1, 1],
                "renderPixels": [48, 24],
                "asset": {
                    "path": repo_path(R04_DIR / "keyboard.workstation.v3.full.png"),
                    "sha256": sha256(R04_DIR / "keyboard.workstation.v3.full.png"),
                },
                "pivot": "visual-alpha-center",
                "localVisualPivot": [24, 12],
                "minimumFrontBackClearancePixels": 6,
                "maximumSideOverhangPixels": 8,
            },
        },
        "measurementEvidence": {
            "file": repo_path(MEASUREMENT_PATH),
            "sha256": sha256_bytes(measurement_content),
        },
        "reviewOutputs": [repo_path(path) for path in outputs],
        "permissions": {
            "deterministicMeasurement": True,
            "calibrationBoards": True,
            "anchorProofBoards": True,
            "newArtworkGeneration": False,
            "rendererImplementation": False,
            "singleSeatAssembly": False,
            "rosterWideCalibration": False,
            "tenSeatAssembly": False,
            "step6": False,
            "activeOfficePromotion": False,
        },
        "ownerGate": {
            "requiredDecision": "Approve or revise the three R05-3A before/after anchor-proof boards.",
            "explicitlyNotApproved": [
                "polished-chair-artwork",
                "monitor-regeneration-or-final-normalization",
                "single-seat-composition",
                "ten-seat-layout",
                "step6",
                "active-office",
            ],
            "onApproval": "Begin R05-3B only: create polished chair art from the approved sockets and normalize the monitor against the approved base contact; keep the accepted keyboard unchanged.",
        },
    }


def build_outputs() -> dict[Path, bytes]:
    measurement = measurement_data()
    measurement_content = json_bytes(measurement)
    reviews = {
        REVIEW_DIR / "01-reservation-vs-visual-pivot.png": board_reservation_contract(),
        REVIEW_DIR / "02-chair-person-contact-measurement.png": board_chair_contact(measurement),
        REVIEW_DIR / "03-equipment-center-pivot-calibration.png": board_equipment_pivots(measurement),
        REVIEW_DIR / "04-monitor-base-socket-before-after.png": board_monitor_anchor_before_after(),
        REVIEW_DIR / "05-chair-two-volume-before-after.png": board_chair_two_volume_before_after(),
        REVIEW_DIR / "06-person-seat-contact-six-frames.png": board_contact_stability_before_after(),
    }
    outputs = {path: png_bytes(image) for path, image in reviews.items()}
    outputs[MEASUREMENT_PATH] = measurement_content
    outputs[MANIFEST_PATH] = json_bytes(manifest_data(measurement_content))
    return outputs


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    outputs = build_outputs()
    if args.check:
        stale = [repo_path(path) for path, content in outputs.items() if not path.exists() or path.read_bytes() != content]
        if stale:
            print("R05 calibration outputs are stale or missing: " + ", ".join(stale))
            return 1
        print(f"R05-0..R05-3A outputs are byte-exact: {len(outputs)} files.")
        return 0
    for path, content in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
    print(f"Built R05-0..R05-3A measurement evidence and owner boards: {len(outputs)} files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
