from __future__ import annotations

import argparse
import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "assets" / "game" / "manifests" / "office-camera-scale-bible.json"
BOARD_PATH = ROOT / "assets" / "art" / "layout-references" / "office-camera-scale-calibration-v2.png"
WIDTH = 1600
HEIGHT = 1100


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.load_default(size=size)


def label(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, size: int, fill: str) -> None:
    draw.text(xy, value, font=font(size), fill=fill)


def panel(draw: ImageDraw.ImageDraw, bounds: tuple[int, int, int, int], title: str, colors: dict) -> None:
    draw.rounded_rectangle(bounds, radius=16, fill=colors["panel"], outline="#475569", width=2)
    label(draw, (bounds[0] + 20, bounds[1] + 16), title, 24, "#f8fafc")


def cell_grid(
    draw: ImageDraw.ImageDraw,
    origin: tuple[int, int],
    columns: int,
    rows: int,
    cell: int,
    fill: str,
    grid_color: str,
) -> None:
    x0, y0 = origin
    for row in range(rows):
        for column in range(columns):
            x = x0 + column * cell
            y = y0 + row * cell
            draw.rectangle((x, y, x + cell, y + cell), fill=fill, outline=grid_color, width=2)


def cross(draw: ImageDraw.ImageDraw, point: tuple[int, int], color: str) -> None:
    x, y = point
    draw.ellipse((x - 9, y - 9, x + 9, y + 9), outline=color, width=3)
    draw.line((x - 14, y, x + 14, y), fill=color, width=2)
    draw.line((x, y - 14, x, y + 14), fill=color, width=2)


def person(draw: ImageDraw.ImageDraw, x: int, floor_y: int, seated: bool, color: str) -> None:
    body_top = floor_y - (92 if seated else 140)
    draw.ellipse((x - 20, body_top - 40, x + 20, body_top), fill=color, outline="#0f172a", width=2)
    draw.rounded_rectangle((x - 25, body_top, x + 25, floor_y - 25), radius=10, fill="#94a3b8", outline="#0f172a", width=2)
    if seated:
        draw.line((x, floor_y - 34, x + 36, floor_y - 12), fill=color, width=7)
    else:
        draw.line((x - 10, floor_y - 28, x - 12, floor_y), fill=color, width=7)
        draw.line((x + 10, floor_y - 28, x + 12, floor_y), fill=color, width=7)


def draw_top_down_contract(draw: ImageDraw.ImageDraw, bible: dict) -> None:
    colors = bible["palette"]
    panel(draw, (30, 110, 780, 535), "A. WORKSTATION v2 / TOP-DOWN PHYSICS", colors)
    desk = bible["canonicalDesk"]
    origin = (75, 220)
    cell = 82
    cell_grid(
        draw,
        origin,
        desk["footprint"]["width"],
        desk["footprint"]["depth"],
        cell,
        colors["supportPlane"],
        colors["grid"],
    )
    label(draw, (75, 162), "ONE DESK = COMPLETE 3 x 2 TABLETOP", 24, "#f8fafc")
    label(draw, (365, 228), "FOOTPRINT  3 x 2", 22, "#f8fafc")
    label(draw, (365, 270), "SUPPORT    3 x 2", 22, colors["supportPlane"])
    label(draw, (365, 312), "HEIGHT     2.4", 22, "#cbd5e1")
    label(draw, (365, 354), "EXTRA FLOOR ROW  NONE", 22, colors["accepted"])
    label(draw, (365, 396), "BASE / SORT PIVOT  (1.5, 2)", 20, colors["pivot"])
    cross(draw, (origin[0] + int(1.5 * cell), origin[1] + 2 * cell), colors["pivot"])
    label(draw, (75, 460), "Legs + drawers = visible height, never footprint", 20, "#cbd5e1")


def draw_levels(draw: ImageDraw.ImageDraw, bible: dict) -> None:
    colors = bible["palette"]
    panel(draw, (810, 110, 1570, 535), "B. STRAIGHT ELEVATION / LEVELS", colors)
    floor_y = 470
    draw.line((850, floor_y, 1530, floor_y), fill="#94a3b8", width=3)
    for value, title in [(1, "SEAT 1.0"), (2.4, "WORK 2.4"), (3, "ADULT / WALL 3.0")]:
        y = floor_y - int(value * 100)
        draw.line((850, y, 1530, y), fill="#475569", width=1)
        label(draw, (855, y - 24), title, 16, "#94a3b8")
    person(draw, 980, floor_y, False, colors["actor"])
    person(draw, 1160, floor_y, True, colors["actor"])
    surface_y = floor_y - 240
    draw.rectangle((1270, surface_y, 1505, surface_y + 24), fill=colors["supportPlane"], outline="#0f172a", width=3)
    draw.line((1295, surface_y + 24, 1295, floor_y), fill="#64748b", width=8)
    draw.line((1480, surface_y + 24, 1480, floor_y), fill="#64748b", width=8)
    draw.rectangle((1245, surface_y - 28, 1530, floor_y + 8), outline=colors["overflow"], width=3)
    label(draw, (890, 492), "STANDING", 17, "#f8fafc")
    label(draw, (1090, 492), "SEATED", 17, "#f8fafc")
    label(draw, (1260, 492), "3 x 4 CANVAS / 3 x 2 FLOOR", 17, "#f8fafc")


def draw_equipment(draw: ImageDraw.ImageDraw, bible: dict) -> None:
    colors = bible["palette"]
    panel(draw, (30, 565, 780, 855), "C. ORIENTATION-AWARE EQUIPMENT BANDS", colors)
    cell = 48
    for title, x, monitor_row, keyboard_row, actor_row in [
        ("FAR ACTOR / FACES DOWN", 80, 1, 0, -1),
        ("NEAR ACTOR / FACES UP", 420, 0, 1, 2),
    ]:
        label(draw, (x, 620), title, 18, "#f8fafc")
        y0 = 690
        for row in range(2):
            fill = colors["monitorReservation"] if row == monitor_row else colors["keyboardReservation"]
            cell_grid(draw, (x, y0 + row * cell), 3, 1, cell, fill, colors["grid"])
            label(draw, (x + 160, y0 + row * cell + 12), "MONITOR 3 x 1" if row == monitor_row else "KEYBOARD 3 x 1", 14, fill)
        actor_y = y0 + actor_row * cell
        draw.ellipse((x + 54, actor_y + 6, x + 90, actor_y + 42), fill=colors["actor"], outline="#0f172a", width=2)
    label(draw, (80, 815), "Reservation = placement lane; artwork stays centered and may be smaller.", 17, "#cbd5e1")


def draw_pair_and_rejection(draw: ImageDraw.ImageDraw, bible: dict) -> None:
    colors = bible["palette"]
    panel(draw, (810, 565, 1570, 855), "D. PAIRED MODULE + REJECTED v1", colors)
    cell = 32
    origin = (855, 690)
    cell_grid(draw, origin, 3, 2, cell, colors["supportPlane"], colors["grid"])
    cell_grid(draw, (origin[0], origin[1] + 2 * cell), 3, 2, cell, colors["supportPlane"], colors["grid"])
    draw.rectangle((origin[0] + cell, origin[1] - cell, origin[0] + 2 * cell, origin[1]), fill=colors["seat"], outline=colors["grid"], width=2)
    draw.rectangle((origin[0] + cell, origin[1] + 4 * cell, origin[0] + 2 * cell, origin[1] + 5 * cell), fill=colors["seat"], outline=colors["grid"], width=2)
    label(draw, (855, 625), "ACCEPT: 3 x 2 + 3 x 2 TOUCH", 18, colors["accepted"])
    label(draw, (990, 700), "chairs outside", 16, "#cbd5e1")
    label(draw, (990, 735), "no gap between rows", 16, "#cbd5e1")
    label(draw, (990, 770), "no overlap", 16, "#cbd5e1")
    draw.rectangle((1260, 665, 1515, 790), fill="#334155", outline=colors["rejected"], width=4)
    draw.line((1260, 665, 1515, 790), fill=colors["rejected"], width=6)
    draw.line((1515, 665, 1260, 790), fill=colors["rejected"], width=6)
    label(draw, (1270, 625), "REJECT", 18, colors["rejected"])
    label(draw, (1280, 805), "5 x 4 / 5 x 3 / extra row", 16, "#cbd5e1")


def draw_gate(draw: ImageDraw.ImageDraw, bible: dict) -> None:
    colors = bible["palette"]
    panel(draw, (30, 885, 1570, 1065), "E. OWNER GATE", colors)
    label(draw, (70, 945), "BLUEPRINT REVIEW", 28, colors["keyboardReservation"])
    label(draw, (390, 940), "NO DESK ART", 22, colors["rejected"])
    label(draw, (390, 980), "NO RENDERER", 22, colors["rejected"])
    label(draw, (700, 940), "NO 10-SEAT SCENE", 22, colors["rejected"])
    label(draw, (700, 980), "ACTIVE OFFICE UNCHANGED", 22, colors["accepted"])
    label(draw, (1100, 940), "NEXT AFTER APPROVAL:", 18, "#f8fafc")
    label(draw, (1100, 976), "one bare desk + one seat", 18, "#cbd5e1")


def render_board(bible: dict, manifest_bytes: bytes) -> bytes:
    colors = bible["palette"]
    image = Image.new("RGB", (WIDTH, HEIGHT), colors["background"])
    draw = ImageDraw.Draw(image)
    label(draw, (30, 22), "OFFICE CAMERA / SCALE BIBLE v2", 38, "#f8fafc")
    label(draw, (30, 70), "WORKSTATION RULE v2  |  BLUEPRINT REVIEW  |  1 TILE = 32 PX", 20, colors["keyboardReservation"])
    digest = hashlib.sha256(manifest_bytes).hexdigest()[:12]
    label(draw, (1320, 42), f"MANIFEST {digest}", 16, "#94a3b8")
    draw_top_down_contract(draw, bible)
    draw_levels(draw, bible)
    draw_equipment(draw, bible)
    draw_pair_and_rejection(draw, bible)
    draw_gate(draw, bible)
    payload = io.BytesIO()
    image.save(payload, format="PNG", optimize=False, compress_level=9)
    return payload.getvalue()


def validate(bible: dict) -> list[str]:
    failures = []
    if bible.get("version") != 2:
        failures.append("Bible version must equal 2")
    if bible.get("workstationRuleVersion") != 2:
        failures.append("Bible workstationRuleVersion must equal 2")
    if bible.get("status") != "blueprint-review":
        failures.append("Bible status must remain blueprint-review before owner approval")
    acceptance = bible.get("acceptance", {})
    for field in [
        "ownerApproval",
        "artworkGenerationAuthorized",
        "rendererImplementationAuthorized",
        "activeOfficePromotionAuthorized",
    ]:
        if acceptance.get(field) is not False:
            failures.append(f"Bible acceptance.{field} must remain false")
    if bible.get("geometrySchemaVersion") != 3:
        failures.append("Bible geometrySchemaVersion must equal 3")
    if bible.get("authoring", {}).get("tilePixels") != 32:
        failures.append("Bible tilePixels must equal 32")
    desk = bible.get("canonicalDesk", {})
    if desk.get("physicalScale") != {"width": 3, "depth": 2, "height": 2.4}:
        failures.append("Bible canonical desk scale must equal 3 x 2 x 2.4")
    if desk.get("footprint") != {"width": 3, "depth": 2}:
        failures.append("Bible canonical desk footprint must equal 3 x 2")
    support = desk.get("supportPlane", {})
    if (support.get("width"), support.get("depth"), support.get("height")) != (3, 2, 2.4):
        failures.append("Bible support plane must equal 3 x 2 at 2.4")
    if desk.get("employeeEdge") is not None:
        failures.append("Bible employeeEdge must be null")
    if bible.get("camera", {}).get("perspectiveConvergence") is not False:
        failures.append("Bible must disable perspective convergence")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description="Build or verify the Office Camera/Scale v2 board")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    bible = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    manifest_bytes = json.dumps(bible, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
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
    print("Office Camera/Scale Bible OK: Workstation Rule v2 blueprint board current.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
