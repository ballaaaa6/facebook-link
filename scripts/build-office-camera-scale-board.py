from __future__ import annotations

import argparse
import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "assets" / "game" / "manifests" / "office-camera-scale-bible.json"
BOARD_PATH = ROOT / "assets" / "art" / "layout-references" / "office-camera-scale-calibration-v1.png"
WIDTH = 1600
HEIGHT = 1100


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.load_default(size=size)


def text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, size: int, fill: str) -> None:
    draw.text(xy, value, font=font(size), fill=fill)


def panel(draw: ImageDraw.ImageDraw, bounds: tuple[int, int, int, int], title: str, colors: dict) -> None:
    draw.rounded_rectangle(bounds, radius=16, fill=colors["panel"], outline="#475569", width=2)
    text(draw, (bounds[0] + 20, bounds[1] + 16), title, 24, "#f8fafc")


def grid(
    draw: ImageDraw.ImageDraw,
    origin: tuple[int, int],
    columns: int,
    rows: int,
    cell: int,
    colors: dict,
    fills: dict[tuple[int, int], str] | None = None,
) -> None:
    fills = fills or {}
    x0, y0 = origin
    for row in range(rows):
        for column in range(columns):
            x = x0 + column * cell
            y = y0 + row * cell
            draw.rectangle(
                (x, y, x + cell, y + cell),
                fill=fills.get((column, row), colors["footprint"]),
                outline=colors["grid"],
                width=1,
            )


def cross(draw: ImageDraw.ImageDraw, point: tuple[int, int], color: str, radius: int = 8) -> None:
    x, y = point
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), outline=color, width=3)
    draw.line((x - radius - 4, y, x + radius + 4, y), fill=color, width=2)
    draw.line((x, y - radius - 4, x, y + radius + 4), fill=color, width=2)


def draw_person(draw: ImageDraw.ImageDraw, x: int, floor_y: int, scale: float, color: str, seated: bool = False) -> None:
    head = int(13 * scale)
    body_height = int((42 if seated else 62) * scale)
    draw.ellipse((x - head, floor_y - body_height - head * 2, x + head, floor_y - body_height), fill=color, outline="#0f172a", width=2)
    draw.rounded_rectangle((x - int(16 * scale), floor_y - body_height, x + int(16 * scale), floor_y - int(12 * scale)), radius=8, fill="#94a3b8", outline="#0f172a", width=2)
    if seated:
        draw.line((x, floor_y - 16, x + int(26 * scale), floor_y - 4), fill=color, width=max(2, int(5 * scale)))
    else:
        draw.line((x - int(8 * scale), floor_y - 14, x - int(10 * scale), floor_y), fill=color, width=max(2, int(5 * scale)))
        draw.line((x + int(8 * scale), floor_y - 14, x + int(10 * scale), floor_y), fill=color, width=max(2, int(5 * scale)))


def blueprint(draw: ImageDraw.ImageDraw, bible: dict) -> None:
    colors = bible["palette"]
    panel(draw, (30, 110, 780, 565), "A. TOP-DOWN GEOMETRY / 32 PX TILE", colors)
    samples = bible["requiredFootprintSamples"]
    sample_x = 65
    for sample in samples:
        label = f"{sample['width']} x {sample['depth']}"
        text(draw, (sample_x, 160), label, 18, "#cbd5e1")
        grid(draw, (sample_x, 192), sample["width"], sample["depth"], 38, colors)
        sample_x += 145

    desk = bible["canonicalDesk"]
    origin = (65, 325)
    fills = {}
    for row in range(desk["footprint"]["depth"]):
        for column in range(desk["footprint"]["width"]):
            fills[(column, row)] = colors["supportPlane"] if row < desk["supportPlane"]["depth"] else colors["employeeEdge"]
    grid(draw, origin, 5, 4, 44, colors, fills)
    text(draw, (310, 332), "CANONICAL DESK", 22, "#f8fafc")
    text(draw, (310, 370), "5 x 4 footprint", 18, "#cbd5e1")
    text(draw, (310, 399), "5 x 3 support plane", 18, colors["supportPlane"])
    text(draw, (310, 428), "1-row employee edge", 18, colors["employeeEdge"])
    text(draw, (310, 457), "physical: 5 x 4 x 2.4", 18, "#cbd5e1")
    pivot = (origin[0] + 110, origin[1] + 176)
    cross(draw, pivot, colors["pivot"])
    text(draw, (310, 494), "base + sort pivot = (2.5, 4)", 18, colors["pivot"])
    text(draw, (560, 185), "CYAN = SUPPORT", 16, colors["supportPlane"])
    text(draw, (560, 215), "AMBER = EMPLOYEE EDGE", 16, colors["employeeEdge"])
    text(draw, (560, 245), "SLATE = COLLISION", 16, "#cbd5e1")


def rendered_scale(draw: ImageDraw.ImageDraw, bible: dict) -> None:
    colors = bible["palette"]
    panel(draw, (810, 110, 1570, 565), "B. STRAIGHT ELEVATION + LEVELS", colors)
    floor_y = 510
    draw.line((850, floor_y, 1530, floor_y), fill="#94a3b8", width=3)
    levels = bible["referenceLevels"]
    scale_y = 92
    for label, value in [("SEAT 1.0", levels["seat"]), ("WORK 2.4", levels["workSurface"]), ("WALL / ADULT 3.0", levels["wall"])]:
        y = floor_y - int(value * scale_y)
        draw.line((850, y, 1530, y), fill="#475569", width=1)
        text(draw, (855, y - 24), label, 16, "#94a3b8")
    draw_person(draw, 955, floor_y, 1.25, colors["character"])
    text(draw, (895, 525), "STANDING 1 x 1 x 3", 17, "#f8fafc")
    draw_person(draw, 1130, floor_y, 1.05, colors["character"], seated=True)
    draw.rectangle((1090, 420, 1168, 438), fill="#0ea5e9", outline="#0f172a", width=2)
    draw.line((1100, 438, 1100, floor_y), fill="#94a3b8", width=6)
    draw.line((1158, 438, 1158, floor_y), fill="#94a3b8", width=6)
    text(draw, (1058, 525), "SEATED 1 x 1 x 2", 17, "#f8fafc")
    desk_x0, desk_x1 = 1260, 1515
    surface_y = floor_y - int(levels["workSurface"] * scale_y)
    draw.rectangle((desk_x0, surface_y, desk_x1, surface_y + 22), fill=colors["supportPlane"], outline="#0f172a", width=3)
    draw.line((desk_x0 + 20, surface_y + 22, desk_x0 + 20, floor_y), fill="#64748b", width=8)
    draw.line((desk_x1 - 20, surface_y + 22, desk_x1 - 20, floor_y), fill="#64748b", width=8)
    draw.rectangle((desk_x0, surface_y + 22, desk_x1, surface_y + 55), outline=colors["overflow"], width=3)
    text(draw, (1265, 525), "SURFACE + UNDERFRAME", 17, "#f8fafc")


def geometry_anatomy(draw: ImageDraw.ImageDraw, bible: dict) -> None:
    colors = bible["palette"]
    panel(draw, (30, 595, 780, 855), "C. PIVOTS, BOUNDS, AND OVERFLOW", colors)
    footprint = (80, 680, 360, 800)
    render = (55, 635, 390, 820)
    draw.rectangle(render, outline=colors["overflow"], width=4)
    draw.rectangle(footprint, fill="#334155", outline="#94a3b8", width=2)
    draw.polygon([(100, 790), (190, 660), (335, 790)], fill="#64748b", outline="#0f172a")
    cross(draw, (220, 800), colors["pivot"])
    text(draw, (420, 652), "PURPLE: render bounds", 18, colors["overflow"])
    text(draw, (420, 690), "SLATE: floor footprint", 18, "#cbd5e1")
    text(draw, (420, 728), "PINK: base / sort pivot", 18, colors["pivot"])
    text(draw, (420, 766), "Overflow changes pixels,", 18, "#f8fafc")
    text(draw, (420, 794), "never collision.", 18, "#f8fafc")


def acceptance_pairs(draw: ImageDraw.ImageDraw, bible: dict) -> None:
    colors = bible["palette"]
    panel(draw, (810, 595, 1570, 855), "D. ACCEPT / REJECT", colors)
    text(draw, (850, 650), "ACCEPT", 20, colors["accepted"])
    grid(draw, (850, 690), 5, 2, 26, colors, {(c, r): colors["supportPlane"] for c in range(5) for r in range(2)})
    grid(draw, (980, 690), 5, 2, 26, colors, {(c, r): colors["supportPlane"] for c in range(5) for r in range(2)})
    text(draw, (850, 760), "Touching edges; no overlap", 16, "#cbd5e1")
    text(draw, (1210, 650), "REJECT", 20, colors["rejected"])
    draw.rectangle((1210, 690, 1505, 780), fill="#475569", outline=colors["rejected"], width=4)
    draw.rectangle((1230, 720, 1485, 745), fill="#94a3b8")
    draw.line((1230, 690, 1485, 780), fill=colors["rejected"], width=5)
    draw.line((1485, 690, 1230, 780), fill=colors["rejected"], width=5)
    text(draw, (1210, 795), "Front bitmap stretched to 5 x 4", 16, "#cbd5e1")


def orientations(draw: ImageDraw.ImageDraw, bible: dict) -> None:
    colors = bible["palette"]
    panel(draw, (30, 885, 1570, 1065), "E. ORIENTATION AND OCCLUSION GATE", colors)
    labels = [("FRONT 0°", 135), ("BACK 180°", 405), ("LEFT -90°", 675), ("RIGHT 90°", 945)]
    for label, x in labels:
        draw.rectangle((x, 950, x + 100, 1025), fill="#64748b", outline="#0f172a", width=2)
        if "LEFT" in label or "RIGHT" in label:
            draw.rectangle((x + 38, 930, x + 62, 1025), fill=colors["supportPlane"], outline="#0f172a", width=2)
        else:
            draw.rectangle((x, 930, x + 100, 955), fill=colors["supportPlane"], outline="#0f172a", width=2)
        text(draw, (x - 5, 1032), label, 16, "#f8fafc")
    draw_person(draw, 1285, 1030, 0.7, colors["character"])
    draw.rectangle((1235, 990, 1335, 1016), fill="#0ea5e9", outline="#0f172a", width=2)
    draw.rectangle((1235, 1016, 1335, 1040), fill="#334155", outline="#0f172a", width=2)
    text(draw, (1360, 945), "Foreground may cover", 16, "#cbd5e1")
    text(draw, (1360, 972), "lower body; head stays", 16, "#cbd5e1")
    text(draw, (1360, 999), "visible and sortable.", 16, "#cbd5e1")


def render_board(bible: dict, manifest_bytes: bytes) -> bytes:
    colors = bible["palette"]
    image = Image.new("RGB", (WIDTH, HEIGHT), colors["background"])
    draw = ImageDraw.Draw(image)
    text(draw, (30, 24), "OFFICE CAMERA / SCALE CALIBRATION v1", 38, "#f8fafc")
    text(draw, (30, 72), "GEOMETRY v3  |  ACCEPTED  |  1 TILE = 32 PX  |  NO PERSPECTIVE", 20, colors["accepted"])
    digest = hashlib.sha256(manifest_bytes).hexdigest()[:12]
    text(draw, (1320, 42), f"MANIFEST {digest}", 16, "#94a3b8")
    blueprint(draw, bible)
    rendered_scale(draw, bible)
    geometry_anatomy(draw, bible)
    acceptance_pairs(draw, bible)
    orientations(draw, bible)
    payload = io.BytesIO()
    image.save(payload, format="PNG", optimize=False, compress_level=9)
    return payload.getvalue()


def validate(bible: dict) -> list[str]:
    failures = []
    if bible.get("status") != "accepted":
        failures.append("Bible status must equal accepted")
    if bible.get("geometrySchemaVersion") != 3:
        failures.append("Bible geometrySchemaVersion must equal 3")
    if bible.get("authoring", {}).get("tilePixels") != 32:
        failures.append("Bible tilePixels must equal 32")
    desk = bible.get("canonicalDesk", {})
    expected = {
        "physicalScale": {"width": 5, "depth": 4, "height": 2.4},
        "footprint": {"width": 5, "depth": 4},
    }
    for field, value in expected.items():
        if desk.get(field) != value:
            failures.append(f"Bible canonicalDesk.{field} does not match Geometry v3")
    support = desk.get("supportPlane", {})
    if (support.get("width"), support.get("depth"), support.get("height")) != (5, 3, 2.4):
        failures.append("Bible canonical desk support plane must equal 5 x 3 at 2.4")
    if bible.get("camera", {}).get("perspectiveConvergence") is not False:
        failures.append("Bible must disable perspective convergence")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description="Build or verify the Office Camera/Scale calibration board")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    bible = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    manifest_bytes = json.dumps(
        bible,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    failures = validate(bible)
    if failures:
        print("\n".join(f"- {failure}" for failure in failures))
        return 1
    board = render_board(bible, manifest_bytes)
    if args.check:
        if not BOARD_PATH.exists():
            print(f"Missing generated board: {BOARD_PATH.relative_to(ROOT).as_posix()}")
            return 1
        if BOARD_PATH.read_bytes() != board:
            print(f"Stale generated board: {BOARD_PATH.relative_to(ROOT).as_posix()}")
            return 1
    else:
        BOARD_PATH.parent.mkdir(parents=True, exist_ok=True)
        BOARD_PATH.write_bytes(board)
    print("Office Camera/Scale Bible OK: accepted Geometry v3, deterministic board current.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
