from __future__ import annotations

import argparse
import hashlib
import io
import json
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets/art/layout-references/office-workstation-v3/step5-r03"
MEASUREMENT_PATH = ROOT / "assets/game/manifests/office-workstation-step5-r03-measurements.json"
R02_PATH = ROOT / "assets/game/manifests/office-workstation-step5-single-seat-v2.json"
BOARD_SIZE = (1600, 1000)

PATHS = {
    "runtimeCharacterSheet": "assets/game/characters/einstein/runtime-spritesheet-v3.webp",
    "seatedChairCalibration": "assets/game/characters/einstein/einstein-seated-chair-calibration-v1-source.png",
    "seatedCharacterCalibration": "assets/game/characters/einstein/einstein-seated-working-v1-source.png",
    "chairFrontSource": "assets/game/processed/office-library-modern-bright-v1/chair-office-modern-v1/chair.office.modern.front.png",
    "chairBackSource": "assets/game/processed/office-library-modern-bright-v1/chair-office-modern-v1/chair.office.modern.back.png",
    "rejectedDeskSeatSide": "assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.front.png",
    "rejectedDeskPublicSide": "assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.back.png",
    "monitorFront": "assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/monitor.front.png",
    "monitorBack": "assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/monitor.back.png",
    "keyboardTightSource": "assets/game/processed/office-workstation-v2/step5-r02/keyboard.workstation.full-tight.png",
}

COLORS = {
    "background": "#09111f",
    "panel": "#111d31",
    "panel2": "#17243a",
    "text": "#f1f5f9",
    "muted": "#9fb0c7",
    "grid": "#40516c",
    "cyan": "#22d3ee",
    "blue": "#38bdf8",
    "purple": "#a78bfa",
    "amber": "#f59e0b",
    "green": "#22c55e",
    "red": "#ef4444",
    "pink": "#f43f5e",
}


def repo_path(key: str) -> Path:
    return ROOT / PATHS[key]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rgba(key: str) -> Image.Image:
    return Image.open(repo_path(key)).convert("RGBA")


def size_bbox(image: Image.Image) -> dict:
    bbox = image.getchannel("A").getbbox()
    return {
        "imagePixels": {"width": image.width, "height": image.height},
        "alphaBounds": None if bbox is None else {
            "x": bbox[0], "y": bbox[1], "width": bbox[2] - bbox[0], "height": bbox[3] - bbox[1],
        },
    }


def is_chroma(pixel: tuple[int, int, int, int]) -> bool:
    red, green, blue, _ = pixel
    return red > 175 and blue > 160 and green < 120 and abs(red - blue) < 90


def remove_chroma(image: Image.Image) -> Image.Image:
    output = image.copy()
    pixels = output.load()
    for y in range(output.height):
        for x in range(output.width):
            if is_chroma(pixels[x, y]):
                pixels[x, y] = (0, 0, 0, 0)
    return output


def calibration_cell(image: Image.Image, row: int, column: int = 0) -> Image.Image:
    # The source sheet has six 246 px frame slots followed by unused chroma canvas.
    cell_width = 246
    cell_height = image.height // 2
    return image.crop((
        column * cell_width,
        row * cell_height,
        (column + 1) * cell_width,
        (row + 1) * cell_height,
    ))


def trimmed(image: Image.Image, padding: int = 0) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        return Image.new("RGBA", (1, 1))
    left = max(0, bbox[0] - padding)
    top = max(0, bbox[1] - padding)
    right = min(image.width, bbox[2] + padding)
    bottom = min(image.height, bbox[3] + padding)
    return image.crop((left, top, right, bottom))


def cell_measurement(image: Image.Image, row: int) -> dict:
    cell = remove_chroma(calibration_cell(image, row))
    return size_bbox(cell)


def runtime_frame(sheet: Image.Image, row: int, column: int) -> Image.Image:
    return sheet.crop((column * 96, row * 104, (column + 1) * 96, (row + 1) * 104))


def measurements() -> dict:
    images = {key: rgba(key) for key in PATHS}
    r02 = json.loads(R02_PATH.read_text(encoding="utf-8"))
    runtime = images["runtimeCharacterSheet"]
    chair_calibration = images["seatedChairCalibration"]
    actor_calibration = images["seatedCharacterCalibration"]

    runtime_rows = {}
    for name, row in (("workingBackSeated", 13), ("workingFrontSeated", 14)):
        runtime_rows[name] = {
            "row": row,
            "frames": [
                {"column": column, **size_bbox(runtime_frame(runtime, row, column))}
                for column in range(6)
            ],
        }

    calibration = {
        "grid": {
            "columns": 6,
            "rows": 2,
            "cellPixels": {"width": 246, "height": 362},
            "unusedRightCanvasPixels": chair_calibration.width - 6 * 246,
        },
        "rowMeaning": {"0": "back", "1": "front"},
        "chairComposite": {
            "back": cell_measurement(chair_calibration, 0),
            "front": cell_measurement(chair_calibration, 1),
        },
        "characterOnly": {
            "back": cell_measurement(actor_calibration, 0),
            "front": cell_measurement(actor_calibration, 1),
        },
    }

    preliminary = {}
    for orientation, runtime_name in (("back", "workingBackSeated"), ("front", "workingFrontSeated")):
        runtime_width = runtime_rows[runtime_name]["frames"][0]["alphaBounds"]["width"]
        actor_width = calibration["characterOnly"][orientation]["alphaBounds"]["width"]
        composite_width = calibration["chairComposite"][orientation]["alphaBounds"]["width"]
        scale = runtime_width / actor_width
        preliminary[orientation] = {
            "runtimeCharacterAlphaWidth": runtime_width,
            "sourceCharacterAlphaWidth": actor_width,
            "sourceCompositeAlphaWidth": composite_width,
            "sourceToRuntimeScale": round(scale, 6),
            "normalizedCombinedEnvelopeWidthCandidate": round(composite_width * scale),
            "status": "measurement-only-not-approved-chair-render-width",
        }

    keyboard = size_bbox(images["keyboardTightSource"])
    keyboard_width = keyboard["alphaBounds"]["width"]
    keyboard_height = keyboard["alphaBounds"]["height"]
    target_height = round(48 * keyboard_height / keyboard_width)
    surface_rows = r02["station"]["desk"]["surfaceRows"]
    measured_surface_depth = surface_rows["endExclusive"] - surface_rows["start"]

    return {
        "version": 1,
        "id": "office.workstation.step5.r03.measurements",
        "status": "deterministic-measurement-evidence",
        "updatedOn": "2026-07-28",
        "measurementPolicy": {
            "pixelBounds": "alpha end-exclusive bounds",
            "chromaRemoval": "threshold applied only to calibration-source copies",
            "creativeRedraw": False,
            "ownerApprovalRequired": True,
        },
        "sources": {
            key: {"path": PATHS[key], "sha256": sha256(repo_path(key)), **size_bbox(image)}
            for key, image in images.items()
        },
        "runtimeCharacter": {
            "sheetGrid": {"columns": 8, "rows": 15},
            "framePixels": {"width": 96, "height": 104},
            "seatedRows": runtime_rows,
        },
        "calibrationSources": calibration,
        "rejectedR02": {
            "deskDeclaredFootprint": {"width": 3, "depth": 2},
            "deskRenderPixels": r02["station"]["desk"]["renderPixels"],
            "declaredSurfaceRows": surface_rows,
            "measuredSurfaceDepthPixels": measured_surface_depth,
            "requiredSurfaceDepthPixels": 64,
            "surfaceDepthDeficitPixels": 64 - measured_surface_depth,
            "keyboardReservation": r02["station"]["equipment"]["keyboard"]["reservation"],
            "keyboardRenderPixels": r02["station"]["equipment"]["keyboard"]["renderPixels"],
            "chairRenderPixels": r02["station"]["equipment"]["chair"]["renderPixels"],
            "failure": "R02 declarations passed without matching the support-plane and seat-contact pixels.",
        },
        "r03ProposedGeometry": {
            "tilePixels": 32,
            "zLevels": {"floor": 0, "chairSeat": 1, "deskSupport": 2, "personTop": 3},
            "person": {"footprint": [1, 1], "logicalVolume": [1, 1, 3], "framePixels": [96, 104]},
            "chair": {"footprint": [1, 1], "logicalVolume": [1, 1, 2], "renderPixels": "unlocked"},
            "desk": {"footprint": [3, 2], "logicalVolume": [3, 2, 2], "supportPixels": [96, 64]},
            "monitor": {"reservation": [3, 1], "visual": "reuse-current-unscaled"},
            "keyboard": {
                "reservation": [1, 1],
                "maximumVisualEnvelope": [1.5, 1],
                "targetPixelsPreservingSourceAspect": [48, target_height],
            },
            "preliminaryCombinedPersonChairEnvelope": preliminary,
        },
        "gate": {
            "completed": ["P0", "P1", "P2", "P3"],
            "blocked": ["P4", "new-artwork", "renderer", "step6", "active-office"],
        },
    }


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    windows_name = "arialbd.ttf" if bold else "arial.ttf"
    windows_font = Path("C:/Windows/Fonts") / windows_name
    if windows_font.exists():
        return ImageFont.truetype(str(windows_font), size)
    try:
        name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
        return ImageFont.truetype(name, size)
    except OSError:
        return ImageFont.load_default(size=size)


def board(title: str, subtitle: str) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGB", BOARD_SIZE, COLORS["background"])
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, 1600, 110), fill="#0d1930")
    draw.text((40, 24), title, font=font(34, True), fill=COLORS["text"])
    draw.text((42, 70), subtitle, font=font(17), fill=COLORS["muted"])
    draw.rounded_rectangle((1300, 27, 1558, 80), 12, fill="#3b1d25", outline=COLORS["red"], width=2)
    draw.text((1322, 43), "CALIBRATION ONLY / P0-P3", font=font(16, True), fill="#fecaca")
    return image, draw


def panel(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], title: str) -> None:
    draw.rounded_rectangle(box, 16, fill=COLORS["panel"], outline="#2c3c56", width=2)
    draw.text((box[0] + 24, box[1] + 20), title, font=font(22, True), fill=COLORS["text"])


def wrapped(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, width: int,
            size: int = 17, fill: str | None = None, spacing: int = 7) -> int:
    lines = textwrap.wrap(text, width=width)
    draw.multiline_text(xy, "\n".join(lines), font=font(size), fill=fill or COLORS["muted"], spacing=spacing)
    return len(lines) * (size + spacing)


def draw_grid(draw: ImageDraw.ImageDraw, origin: tuple[int, int], columns: int,
              rows: int, cell: int, fill: str = "#16243a") -> None:
    x, y = origin
    draw.rectangle((x, y, x + columns * cell, y + rows * cell), fill=fill, outline=COLORS["grid"], width=2)
    for index in range(1, columns):
        draw.line((x + index * cell, y, x + index * cell, y + rows * cell), fill=COLORS["grid"], width=2)
    for index in range(1, rows):
        draw.line((x, y + index * cell, x + columns * cell, y + index * cell), fill=COLORS["grid"], width=2)


def paste_contain(canvas: Image.Image, image: Image.Image, box: tuple[int, int, int, int],
                  scale_up: bool = True) -> tuple[int, int, int, int]:
    width = box[2] - box[0]
    height = box[3] - box[1]
    ratio = min(width / image.width, height / image.height)
    if not scale_up:
        ratio = min(1, ratio)
    resized = image.resize((max(1, round(image.width * ratio)), max(1, round(image.height * ratio))), Image.Resampling.NEAREST)
    x = box[0] + (width - resized.width) // 2
    y = box[1] + (height - resized.height) // 2
    canvas.paste(resized, (x, y), resized)
    return (x, y, x + resized.width, y + resized.height)


def build_world_board(data: dict) -> Image.Image:
    image, draw = board(
        "STEP 5 R03 / WORLD PROJECTION AND Z LEVELS",
        "One coordinate system before any desk, chair, or renderer implementation.",
    )
    panel(draw, (38, 135, 790, 955), "A. TOP-DOWN OCCUPANCY (32 px = 1 tile)")
    draw_grid(draw, (95, 260), 6, 6, 78)
    desk = (173, 416, 407, 572)
    draw.rectangle(desk, fill="#164e63", outline=COLORS["cyan"], width=4)
    draw.line((173, 494, 407, 494), fill=COLORS["cyan"], width=3)
    draw.text((221, 457), "DESK 3 x 2", font=font(23, True), fill="#cffafe")
    actor_cell = (251, 572, 329, 650)
    draw.rectangle(actor_cell, fill="#3b285f", outline=COLORS["purple"], width=4)
    draw.text((262, 595), "1 x 1", font=font(18, True), fill="#ede9fe")
    frame = runtime_frame(rgba("runtimeCharacterSheet"), 14, 0)
    paste_contain(image, frame, (225, 520, 355, 700))
    draw.text((103, 716), "Person + chair share this ONE floor cell.", font=font(19, True), fill=COLORS["text"])
    wrapped(draw, (103, 756),
            "The 96 x 104 character pixels may overflow the 32 x 32 footprint. Hair, arms, clothing, and the chair silhouette do not enlarge collision space.",
            58, 17)

    panel(draw, (812, 135, 1562, 955), "B. VERTICAL LEVELS AND SCREEN PROJECTION")
    x_axis = 940
    floor_y = 790
    draw.line((900, floor_y, 1460, floor_y), fill=COLORS["grid"], width=4)
    for z, label, color in (
        (0, "z=0  floor / wheel contact", COLORS["muted"]),
        (1, "z=1  chair cushion / pelvis contact", COLORS["blue"]),
        (2, "z=2  desk support / chair back top", COLORS["cyan"]),
        (3, "z=3  person logical top", COLORS["purple"]),
    ):
        y = floor_y - z * 150
        draw.line((x_axis, y, 1450, y), fill=color, width=3)
        draw.ellipse((x_axis - 8, y - 8, x_axis + 8, y + 8), fill=color)
        draw.text((970, y - 16), label, font=font(20, True), fill=color)
    draw.line((x_axis, floor_y, x_axis, floor_y - 480), fill="#64748b", width=3)
    draw.polygon(((x_axis, floor_y - 500), (x_axis - 8, floor_y - 478), (x_axis + 8, floor_y - 478)), fill="#64748b")

    draw.rounded_rectangle((860, 205, 1515, 310), 12, fill=COLORS["panel2"], outline=COLORS["cyan"], width=2)
    draw.text((890, 229), "screenX = worldX * 32", font=font(25, True), fill="#cffafe")
    draw.text((890, 267), "screenY = worldY * 32 - worldZ * 32", font=font(25, True), fill="#cffafe")
    draw.text((866, 846), "LOCKED NOW", font=font(17, True), fill=COLORS["green"])
    draw.text((1010, 846), "footprints / volumes / z levels / projection", font=font(17), fill=COLORS["text"])
    draw.text((866, 888), "NOT LOCKED", font=font(17, True), fill=COLORS["amber"])
    draw.text((1010, 888), "chair pixel envelope / contact pixels / artwork", font=font(17), fill=COLORS["text"])
    return image


def draw_plan(draw: ImageDraw.ImageDraw, origin: tuple[int, int], orientation: str) -> None:
    x, y = origin
    cell = 88
    draw_grid(draw, origin, 3, 2, cell)
    monitor_row = 1 if orientation == "far" else 0
    keyboard_row = 0 if orientation == "far" else 1
    draw.rectangle((x, y + monitor_row * cell, x + 3 * cell, y + (monitor_row + 1) * cell),
                   fill="#403269", outline=COLORS["purple"], width=4)
    draw.text((x + 55, y + monitor_row * cell + 29), "MONITOR RESERVATION 3 x 1",
              font=font(17, True), fill="#ede9fe")
    keyboard_box = (
        x + cell, y + keyboard_row * cell,
        x + 2 * cell, y + (keyboard_row + 1) * cell,
    )
    draw.rectangle(keyboard_box, fill="#6b4213", outline=COLORS["amber"], width=4)
    draw.text((keyboard_box[0] + 18, keyboard_box[1] + 18), "KEY", font=font(17, True), fill="#fef3c7")
    draw.text((keyboard_box[0] + 18, keyboard_box[1] + 44), "1 x 1", font=font(17, True), fill="#fef3c7")
    actor_y = y - cell if orientation == "far" else y + 2 * cell
    draw.rectangle((x + cell, actor_y, x + 2 * cell, actor_y + cell),
                   fill="#164e63", outline=COLORS["blue"], width=4)
    draw.text((x + cell + 22, actor_y + 32), "SEAT", font=font(17, True), fill="#e0f2fe")


def build_desk_board(data: dict) -> Image.Image:
    image, draw = board(
        "STEP 5 R03 / DESK AND EQUIPMENT FOOTPRINTS",
        "Measured R02 failure at left; proposed geometry at right. Rectangles are contracts, not new artwork.",
    )
    panel(draw, (38, 135, 520, 955), "A. R02 REJECTED PIXELS")
    front = rgba("rejectedDeskSeatSide")
    back = rgba("rejectedDeskPublicSide")
    paste_contain(image, front, (75, 220, 275, 500))
    paste_contain(image, back, (285, 220, 485, 500))
    draw.text((96, 510), "historical front file", font=font(15), fill=COLORS["muted"])
    draw.text((309, 510), "historical back file", font=font(15), fill=COLORS["muted"])
    draw.rounded_rectangle((75, 560, 485, 730), 12, fill="#341c25", outline=COLORS["red"], width=3)
    rejected = data["rejectedR02"]
    draw.text((100, 585), "Declared desk footprint: 3 x 2", font=font(19, True), fill="#fecaca")
    draw.text((100, 625), f"Visible support band: {rejected['measuredSurfaceDepthPixels']} px", font=font(24, True), fill=COLORS["red"])
    draw.text((100, 665), "Required support depth: 64 px", font=font(24, True), fill=COLORS["cyan"])
    draw.text((100, 705), f"Deficit: {rejected['surfaceDepthDeficitPixels']} px", font=font(20, True), fill="#fecaca")
    wrapped(draw, (76, 775),
            "Root cause: CI trusted declared values. It did not compare the visible tabletop band, keyboard reservation, or seat contact against measured pixels.",
            45, 17)

    panel(draw, (542, 135, 1050, 955), "B. FAR STATION / PERSON ABOVE DESK")
    draw_plan(draw, (660, 390), "far")
    draw.text((596, 230), "FAR FROM ACTOR", font=font(17, True), fill=COLORS["purple"])
    draw.line((594, 265, 1000, 265), fill=COLORS["purple"], width=3)
    draw.text((596, 710), "NEAR ACTOR", font=font(17, True), fill=COLORS["amber"])
    wrapped(draw, (585, 770),
            "Keyboard reserves only the center 1 x 1 cell. Its 48 x 24 px visual may be 1.5 tiles wide, but remains inside the 96 x 64 support plane and cannot overlap the monitor.",
            48, 17)

    panel(draw, (1072, 135, 1562, 955), "C. NEAR STATION / PERSON BELOW DESK")
    draw_plan(draw, (1180, 390), "near")
    draw.text((1110, 230), "FAR FROM ACTOR", font=font(17, True), fill=COLORS["purple"])
    draw.line((1110, 265, 1520, 265), fill=COLORS["purple"], width=3)
    draw.text((1110, 710), "NEAR ACTOR", font=font(17, True), fill=COLORS["amber"])
    draw.rounded_rectangle((1110, 772, 1522, 910), 12, fill=COLORS["panel2"], outline=COLORS["cyan"], width=2)
    draw.text((1132, 795), "FULL DESK SUPPORT", font=font(18, True), fill=COLORS["cyan"])
    draw.text((1132, 832), "3 x 2 tiles = 96 x 64 px", font=font(24, True), fill=COLORS["text"])
    draw.text((1132, 872), "logical height = 2 / support z = 2", font=font(17), fill=COLORS["muted"])
    return image


def calibration_sprite(key: str, row: int) -> Image.Image:
    return trimmed(remove_chroma(calibration_cell(rgba(key), row)), 4)


def build_contact_board(data: dict) -> Image.Image:
    image, draw = board(
        "STEP 5 R03 / CHARACTER AND CHAIR CONTACT",
        "Actual source pixels plus a contact model. No chair redraw and no final chair render size yet.",
    )
    panel(draw, (38, 135, 770, 955), "A. EXISTING CALIBRATION SOURCES (MEASURED)")
    for index, (label, row) in enumerate((("BACK", 0), ("FRONT", 1))):
        x = 80 + index * 340
        composite = calibration_sprite("seatedChairCalibration", row)
        actor = calibration_sprite("seatedCharacterCalibration", row)
        paste_contain(image, composite, (x, 220, x + 290, 555))
        draw.text((x + 105, 565), f"{label} composite", font=font(17, True), fill=COLORS["text"])
        paste_contain(image, actor, (x + 35, 625, x + 255, 850))
        draw.text((x + 84, 862), f"{label} person-only", font=font(15), fill=COLORS["muted"])
    back = data["r03ProposedGeometry"]["preliminaryCombinedPersonChairEnvelope"]["back"]
    front = data["r03ProposedGeometry"]["preliminaryCombinedPersonChairEnvelope"]["front"]
    draw.text((82, 905),
              f"Normalized combined envelope candidates: back {back['normalizedCombinedEnvelopeWidthCandidate']} px / front {front['normalizedCombinedEnvelopeWidthCandidate']} px",
              font=font(16, True), fill=COLORS["amber"])

    panel(draw, (792, 135, 1562, 955), "B. CONTACT MODEL TO APPROVE")
    x = 900
    floor_y = 825
    cell = 150
    draw.rectangle((x, floor_y - 3 * cell, x + cell, floor_y), fill="#18273f", outline=COLORS["grid"], width=3)
    for level in range(4):
        y = floor_y - level * cell
        draw.line((x - 55, y, x + 500, y), fill=COLORS["grid"], width=2)
        draw.text((x - 48, y - 30), f"z={level}", font=font(17, True), fill=COLORS["muted"])
    draw.rectangle((x, floor_y - cell, x + cell, floor_y), fill="#214763", outline=COLORS["blue"], width=4)
    draw.text((x + 24, floor_y - 90), "CHAIR BASE", font=font(16, True), fill="#e0f2fe")
    draw.rectangle((x, floor_y - 2 * cell, x + cell, floor_y - cell), fill="#302a59", outline=COLORS["purple"], width=4)
    draw.text((x + 17, floor_y - 245), "BACKREST", font=font(16, True), fill="#ede9fe")
    draw.line((x - 10, floor_y - cell, x + cell + 10, floor_y - cell), fill=COLORS["pink"], width=8)
    draw.text((x + 190, floor_y - cell - 18), "SEAT + PELVIS CONTACT AT z=1", font=font(21, True), fill="#fda4af")
    draw.rectangle((x + 18, floor_y - 3 * cell, x + cell - 18, floor_y - cell),
                   outline=COLORS["green"], width=5)
    draw.ellipse((x + 20, floor_y - 3 * cell + 10, x + cell - 20, floor_y - 2 * cell + 105),
                 outline=COLORS["green"], width=5)
    draw.text((x + 190, floor_y - 410), "HEAD ABOVE BACKREST", font=font(19, True), fill="#bbf7d0")
    draw.text((x + 190, floor_y - 270), "TORSO SUPPORTED BY REAR LAYER", font=font(19, True), fill="#ddd6fe")
    draw.text((x + 190, floor_y - 110), "LEGS / FEET MAY HANG BELOW SEAT", font=font(19, True), fill="#bae6fd")
    draw.rounded_rectangle((860, 850, 1510, 925), 12, fill="#341c25", outline=COLORS["amber"], width=2)
    draw.text((885, 872), "PIXEL ANCHORS AND FINAL CHAIR ENVELOPE REMAIN UNLOCKED FOR P4.",
              font=font(17, True), fill="#fde68a")
    return image


def png_bytes(image: Image.Image) -> bytes:
    output = io.BytesIO()
    image.save(output, format="PNG", optimize=False, compress_level=9)
    return output.getvalue()


def expected_outputs() -> dict[Path, bytes]:
    data = measurements()
    json_bytes = (json.dumps(data, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    return {
        MEASUREMENT_PATH: json_bytes,
        OUT_DIR / "01-world-projection-and-z-levels.png": png_bytes(build_world_board(data)),
        OUT_DIR / "02-desk-equipment-footprints.png": png_bytes(build_desk_board(data)),
        OUT_DIR / "03-character-chair-contact.png": png_bytes(build_contact_board(data)),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    outputs = expected_outputs()
    if args.check:
        failures = [
            str(path.relative_to(ROOT))
            for path, content in outputs.items()
            if not path.exists() or path.read_bytes() != content
        ]
        if failures:
            print("R03 calibration outputs are stale or missing: " + ", ".join(failures))
            return 1
        print("R03 calibration outputs are byte-exact and current.")
        return 0
    for path, content in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
    print("Built R03 P0-P3 measurements and three calibration boards.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
