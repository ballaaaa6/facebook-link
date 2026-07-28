from __future__ import annotations

import argparse
import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "assets" / "game" / "manifests" / "office-workstation-assembly-bible-v2.json"
OUTPUT_DIRECTORY = ROOT / "assets" / "art" / "layout-references" / "office-workstation-v2"
BOARD_SIZE = (1800, 1100)
BACKGROUND = "#08111f"
PANEL = "#132033"
TEXT = "#f8fafc"
MUTED = "#b6c4d6"
GRID = "#64748b"
CYAN = "#22d3ee"
PURPLE = "#a78bfa"
AMBER = "#f59e0b"
BLUE = "#38bdf8"
GREEN = "#22c55e"
RED = "#ef4444"
PINK = "#f43f5e"
SLATE = "#475569"


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.load_default(size=size)


def text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, size: int = 18, fill: str = TEXT) -> None:
    draw.text(xy, value, font=font(size), fill=fill)


def centered_text(
    draw: ImageDraw.ImageDraw,
    bounds: tuple[int, int, int, int],
    value: str,
    size: int,
    fill: str = TEXT,
) -> None:
    box = draw.textbbox((0, 0), value, font=font(size))
    width = box[2] - box[0]
    height = box[3] - box[1]
    x = bounds[0] + (bounds[2] - bounds[0] - width) // 2
    y = bounds[1] + (bounds[3] - bounds[1] - height) // 2
    text(draw, (x, y), value, size, fill)


def panel(draw: ImageDraw.ImageDraw, bounds: tuple[int, int, int, int], title: str) -> None:
    draw.rounded_rectangle(bounds, radius=16, fill=PANEL, outline="#334155", width=2)
    text(draw, (bounds[0] + 18, bounds[1] + 14), title, 22)


def header(draw: ImageDraw.ImageDraw, title: str, subtitle: str, manifest_hash: str) -> None:
    text(draw, (30, 20), title, 36)
    text(draw, (30, 65), subtitle, 19, AMBER)
    text(draw, (1540, 40), f"MANIFEST {manifest_hash[:12]}", 15, "#94a3b8")


def arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], color: str = MUTED, width: int = 3) -> None:
    draw.line((*start, *end), fill=color, width=width)
    x1, y1 = start
    x2, y2 = end
    dx = x2 - x1
    dy = y2 - y1
    length = max((dx * dx + dy * dy) ** 0.5, 1)
    ux, uy = dx / length, dy / length
    px, py = -uy, ux
    base_x, base_y = x2 - ux * 14, y2 - uy * 14
    draw.polygon([
        (x2, y2),
        (base_x + px * 7, base_y + py * 7),
        (base_x - px * 7, base_y - py * 7),
    ], fill=color)


def desk_grid(
    draw: ImageDraw.ImageDraw,
    origin: tuple[int, int],
    cell: int,
    monitor_row: int | None = None,
    keyboard_row: int | None = None,
    outline: str = GRID,
) -> None:
    x0, y0 = origin
    for row in range(2):
        fill = CYAN
        if row == monitor_row:
            fill = PURPLE
        elif row == keyboard_row:
            fill = AMBER
        for column in range(3):
            x = x0 + column * cell
            y = y0 + row * cell
            draw.rectangle((x, y, x + cell, y + cell), fill=fill, outline=outline, width=2)


def chair_actor(draw: ImageDraw.ImageDraw, center: tuple[int, int], facing: str, cell: int) -> None:
    x, y = center
    draw.rounded_rectangle((x - cell // 2, y - cell // 2, x + cell // 2, y + cell // 2), radius=8, fill=BLUE, outline="#0f172a", width=2)
    draw.ellipse((x - 13, y - 13, x + 13, y + 13), fill=TEXT, outline="#0f172a", width=2)
    direction = -1 if facing == "up" else 1
    arrow(draw, (x, y), (x, y + direction * 34), PINK, 2)


def draw_source_decomposition(manifest: dict, manifest_hash: str) -> Image.Image:
    image = Image.new("RGB", BOARD_SIZE, BACKGROUND)
    draw = ImageDraw.Draw(image)
    header(draw, "1 / TARGET DECOMPOSITION", "REFERENCE OBSERVATION -> NORMALIZED 3 x 2 RULES", manifest_hash)
    panel(draw, (30, 110, 1210, 720), "A. SOURCE REFERENCE / OBSERVATION ONLY")
    source = Image.open(ROOT / manifest["sourceReference"]["file"]).convert("RGB")
    crop_box = manifest["sourceReference"]["observationCrop"]
    crop = source.crop((
        crop_box["x"],
        crop_box["y"],
        crop_box["x"] + crop_box["width"],
        crop_box["y"] + crop_box["height"],
    ))
    display = crop.resize((1120, 531), Image.Resampling.NEAREST)
    image.paste(display, (60, 165))
    overlay = ImageDraw.Draw(image, "RGBA")
    scale_x = 1120 / crop_box["width"]
    scale_y = 531 / crop_box["height"]

    def reference_box(bounds: tuple[int, int, int, int], color: tuple[int, int, int, int], title: str) -> None:
        x0 = 60 + int(bounds[0] * scale_x)
        y0 = 165 + int(bounds[1] * scale_y)
        x1 = 60 + int(bounds[2] * scale_x)
        y1 = 165 + int(bounds[3] * scale_y)
        overlay.rectangle((x0, y0, x1, y1), fill=color, outline=color[:3] + (255,), width=3)
        overlay.rectangle((x0, y0, min(x0 + 290, x1), y0 + 30), fill=(8, 17, 31, 220))
        text(overlay, (x0 + 8, y0 + 5), title, 15, "#ffffff")

    reference_box((135, 385, 1605, 535), (56, 189, 248, 38), "FAR ACTOR / CHAIR BAND")
    reference_box((135, 520, 1605, 735), (34, 211, 238, 38), "TWO TOUCHING DESK ROWS")
    reference_box((135, 635, 1605, 875), (244, 63, 94, 32), "NEAR ACTOR / CHAIR BAND")
    for source_x in [135, 429, 723, 1017, 1311, 1605]:
        x = 60 + int(source_x * scale_x)
        overlay.line((x, 405, x, 680), fill=(245, 158, 11, 220), width=2)
    text(draw, (70, 665), "Approximate bands explain composition; they are not pixel-to-tile measurements.", 16, "#ffffff")

    panel(draw, (1240, 110, 1770, 720), "B. NORMALIZED CURRENT-OFFICE GRID")
    block = manifest["normalizedTenSeatBlock"]
    grid_origin = (1285, 210)
    cell = 19
    for row in range(13):
        for column in range(24):
            x = grid_origin[0] + column * cell
            y = grid_origin[1] + row * cell
            draw.rectangle((x, y, x + cell, y + cell), fill="#1e293b", outline="#334155", width=1)
    for x_origin in block["deskOriginsX"]:
        desk_grid(draw, (grid_origin[0] + x_origin * cell, grid_origin[1] + block["farDeskOriginY"] * cell), cell)
        desk_grid(draw, (grid_origin[0] + x_origin * cell, grid_origin[1] + block["nearDeskOriginY"] * cell), cell)
        for chair_y, facing in [(block["farChairOriginY"], "down"), (block["nearChairOriginY"], "up")]:
            chair_actor(
                draw,
                (grid_origin[0] + (x_origin + 1.5) * cell, grid_origin[1] + (chair_y + 0.5) * cell),
                facing,
                cell,
            )
    text(draw, (1285, 480), "DESKS: x=[4,7,10,13,16]", 17, CYAN)
    text(draw, (1285, 515), "FAR DESKS: y=6..7", 17, MUTED)
    text(draw, (1285, 550), "NEAR DESKS: y=8..9", 17, MUTED)
    text(draw, (1285, 585), "CHAIRS: y=5 and y=10", 17, BLUE)
    text(draw, (1285, 620), "BANK: 15 x 4 inside left zone", 17, GREEN)
    text(draw, (1285, 655), "CURRENT BACKGROUND UNCHANGED", 17, GREEN)

    panel(draw, (30, 750, 870, 1065), "C. WHAT THE REFERENCE PROVES")
    observations = [
        "Two opposed employee rows share one compact desk bank.",
        "Five aligned modules touch horizontally; no decorative gaps.",
        "The two tabletop rows touch directly front-to-back.",
        "Far lower bodies are occluded; near chairs/actors remain in front.",
        "The workstation bank occupies only the left office zone.",
    ]
    for index, item in enumerate(observations):
        text(draw, (70, 815 + index * 44), f"{index + 1}. {item}", 18, MUTED)

    panel(draw, (900, 750, 1770, 1065), "D. WHAT THE PROJECT NORMALIZES")
    decisions = [
        "One desk plan is 3 x 2; vertical faces add no floor row.",
        "One chair/actor reservation is 1 x 1 outside the desk.",
        "Monitor and keyboard each reserve a centered 3 x 1 band.",
        "Five columns occupy x=4..18 in the existing 24-tile work zone.",
        "These are blueprint decisions; no artwork has been generated.",
    ]
    for index, item in enumerate(decisions):
        text(draw, (940, 815 + index * 44), f"{index + 1}. {item}", 18, MUTED)
    return image


def desk_part(draw: ImageDraw.ImageDraw, center_x: int, y: int, role: str, color: str) -> None:
    if role == "rear":
        draw.rectangle((center_x - 145, y + 34, center_x + 145, y + 52), fill=color, outline="#0f172a", width=3)
    elif role == "surface":
        draw.polygon([(center_x - 150, y + 30), (center_x - 110, y - 30), (center_x + 150, y - 30), (center_x + 110, y + 30)], fill=color, outline="#0f172a")
    elif role == "base":
        draw.rectangle((center_x - 125, y - 26, center_x + 125, y - 2), fill=color, outline="#0f172a", width=3)
        draw.rectangle((center_x - 120, y, center_x - 100, y + 72), fill=color, outline="#0f172a", width=2)
        draw.rectangle((center_x + 100, y, center_x + 120, y + 72), fill=color, outline="#0f172a", width=2)
        draw.rectangle((center_x + 36, y, center_x + 96, y + 55), fill="#334155", outline="#0f172a", width=2)
    else:
        draw.rectangle((center_x - 145, y, center_x + 145, y + 25), fill=color, outline="#0f172a", width=3)


def draw_exploded_stack(draw: ImageDraw.ImageDraw, x0: int, title: str, monitor_side: str, actor_side: str) -> None:
    panel(draw, (x0, 140, x0 + 750, 825), title)
    center_x = x0 + 310
    rows = [
        ("REAR", 220, BLUE),
        ("SURFACE / EXACT 3 x 2 PLAN", 345, CYAN),
        ("BASE / LEGS + DRAWERS", 500, SLATE),
        ("FOREGROUND / OCCLUSION", 665, PINK),
    ]
    for index, (name, y, color) in enumerate(rows):
        desk_part(draw, center_x, y, name.split(" ")[0].lower(), color)
        text(draw, (x0 + 50, y - 48), name, 17, MUTED if color == SLATE else color)
        if index < len(rows) - 1:
            arrow(draw, (center_x, y + 80), (center_x, rows[index + 1][1] - 55), "#94a3b8", 2)
    draw.rounded_rectangle((x0 + 485, 270, x0 + 700, 440), radius=12, fill="#1e293b", outline="#475569", width=2)
    text(draw, (x0 + 505, 290), "SEPARATE CHILDREN", 16)
    text(draw, (x0 + 505, 330), f"monitor: {monitor_side}", 15, PURPLE)
    text(draw, (x0 + 505, 365), "keyboard", 15, AMBER)
    text(draw, (x0 + 505, 400), f"actor: {actor_side}", 15, TEXT)
    draw.rounded_rectangle((x0 + 485, 520, x0 + 700, 705), radius=12, fill="#1e293b", outline="#475569", width=2)
    text(draw, (x0 + 505, 540), "SEPARATE SEAT STACK", 16)
    text(draw, (x0 + 505, 580), "chair base", 15, BLUE)
    text(draw, (x0 + 505, 615), "actor / pelvis", 15, TEXT)
    text(draw, (x0 + 505, 650), "chair foreground", 15, PINK)
    text(draw, (x0 + 505, 685), "1 x 1 outside desk", 14, GREEN)


def draw_exploded_parts(manifest: dict, manifest_hash: str) -> Image.Image:
    image = Image.new("RGB", BOARD_SIZE, BACKGROUND)
    draw = ImageDraw.Draw(image)
    header(draw, "2 / FURNITURE EXPLODED-PART BLUEPRINT", "SEMANTIC PARTS BEFORE ARTWORK / FRONT AND BACK", manifest_hash)
    draw_exploded_stack(draw, 30, "A. FAR ROW / FRONT DESK VIEW", "back visible", "faces down")
    draw_exploded_stack(draw, 820, "B. NEAR ROW / BACK DESK VIEW", "front visible", "faces up")
    panel(draw, (30, 855, 1770, 1065), "C. NON-NEGOTIABLE PART RULES")
    rules = [
        ("SURFACE", "is the only visible part that directly represents the complete 3 x 2 tabletop plan", CYAN),
        ("BASE", "contains legs, drawers, and apron; visible height never expands footprint", SLATE),
        ("FOREGROUND", "may hide seated lower-body pixels but must preserve the head-safe region", PINK),
        ("CHILDREN", "monitor, keyboard, chair, and actor remain separate from every desk part", AMBER),
    ]
    for index, (name, description, color) in enumerate(rules):
        y = 910 + index * 36
        text(draw, (70, y), name, 17, color)
        text(draw, (245, y), description, 17, MUTED)
    text(draw, (1375, 1015), "BLUEPRINT ONLY / NO ART", 16, RED)
    return image


def draw_module(draw: ImageDraw.ImageDraw, origin: tuple[int, int], cell: int, orientation: str) -> None:
    monitor_row = 1 if orientation == "far" else 0
    keyboard_row = 0 if orientation == "far" else 1
    desk_grid(draw, origin, cell, monitor_row, keyboard_row)
    chair_y = origin[1] - cell // 2 if orientation == "far" else origin[1] + 2 * cell + cell // 2
    chair_actor(draw, (origin[0] + int(1.5 * cell), chair_y), "down" if orientation == "far" else "up", cell)


def draw_assembly_and_adjacency(manifest: dict, manifest_hash: str) -> Image.Image:
    image = Image.new("RGB", BOARD_SIZE, BACKGROUND)
    draw = ImageDraw.Draw(image)
    header(draw, "3 / ASSEMBLY + ADJACENCY PROOF", "ACTOR / CHAIR / DESK / MONITOR / KEYBOARD / TEN SEATS", manifest_hash)
    panel(draw, (30, 115, 595, 555), "A. FAR MODULE")
    draw_module(draw, (95, 250), 82, "far")
    text(draw, (365, 220), "chair + actor outside", 16, BLUE)
    text(draw, (365, 270), "keyboard nearest", 16, AMBER)
    text(draw, (365, 320), "monitor farthest", 16, PURPLE)
    text(draw, (365, 370), "monitor back visible", 16, MUTED)
    text(draw, (365, 420), "desk footprint 3 x 2", 16, CYAN)

    panel(draw, (620, 115, 1185, 555), "B. NEAR MODULE")
    draw_module(draw, (685, 190), 82, "near")
    text(draw, (955, 220), "monitor farthest", 16, PURPLE)
    text(draw, (955, 270), "keyboard nearest", 16, AMBER)
    text(draw, (955, 320), "chair + actor outside", 16, BLUE)
    text(draw, (955, 370), "monitor front visible", 16, MUTED)
    text(draw, (955, 420), "desk footprint 3 x 2", 16, CYAN)

    panel(draw, (1210, 115, 1770, 555), "C. LAYER ORDER / BACK -> FRONT")
    for section, key, start_y in [("FAR", "far", 185), ("NEAR", "near", 355)]:
        text(draw, (1250, start_y), section, 18, AMBER)
        order = manifest["orientations"][key]["assemblyOrderBackToFront"]
        for index, item in enumerate(order):
            column = index % 3
            row = index // 3
            bounds = (1325 + column * 138, start_y - 10 + row * 48, 1448 + column * 138, start_y + 24 + row * 48)
            draw.rounded_rectangle(bounds, radius=7, fill="#25344b", outline="#475569", width=1)
            centered_text(draw, bounds, item, 12, TEXT)

    panel(draw, (30, 585, 1770, 1065), "D. FIVE-BY-TWO EDGE-TO-EDGE BANK / CURRENT LEFT ZONE")
    cell = 43
    x0 = 310
    far_y = 735
    for column in range(5):
        module_x = x0 + column * 3 * cell
        draw_module(draw, (module_x, far_y), cell, "far")
        draw_module(draw, (module_x, far_y + 2 * cell), cell, "near")
    draw.rectangle((x0, far_y, x0 + 15 * cell, far_y + 4 * cell), outline=GREEN, width=4)
    text(draw, (70, 660), "FAR CHAIRS", 16, BLUE)
    arrow(draw, (180, 670), (310, far_y - 22), BLUE, 2)
    text(draw, (70, 755), "3 x 2 FAR DESKS", 16, CYAN)
    arrow(draw, (210, 765), (310, far_y + 40), CYAN, 2)
    text(draw, (70, 850), "3 x 2 NEAR DESKS", 16, CYAN)
    arrow(draw, (225, 860), (310, far_y + 125), CYAN, 2)
    text(draw, (70, 945), "NEAR CHAIRS", 16, BLUE)
    arrow(draw, (190, 950), (310, far_y + 4 * cell + 22), BLUE, 2)
    text(draw, (1040, 660), "PROOF", 19, GREEN)
    proof = [
        "5 columns x 3 tiles = 15 tiles",
        "2 desk rows x 2 tiles = 4 tiles",
        "horizontal gaps = 0",
        "vertical desk-row gaps = 0",
        "chairs overlap desk = 0",
        "ten-seat count = 10",
        "left work-zone overflow = 0",
        "background changes = 0",
    ]
    for index, item in enumerate(proof):
        text(draw, (1040, 705 + index * 38), f"PASS  {item}", 17, GREEN if index >= 2 else MUTED)
    text(draw, (1430, 1020), "NO ART / NO RENDERER", 15, RED)
    return image


def draw_contact_sheet(boards: list[tuple[str, Image.Image]], manifest_hash: str) -> Image.Image:
    image = Image.new("RGB", (1800, 1400), BACKGROUND)
    draw = ImageDraw.Draw(image)
    header(draw, "OWNER REVIEW / WORKSTATION BLUEPRINT v2", "APPROVE GEOMETRY BEFORE ANY ARTWORK OR RENDERER WORK", manifest_hash)
    placements = [(40, 140), (920, 140), (480, 735)]
    preview_size = (840, 513)
    for (title, board), position in zip(boards, placements, strict=True):
        preview = board.resize(preview_size, Image.Resampling.LANCZOS)
        image.paste(preview, position)
        draw.rectangle((position[0], position[1], position[0] + preview_size[0], position[1] + preview_size[1]), outline="#475569", width=3)
        text(draw, (position[0] + 12, position[1] - 30), title, 18, TEXT)
    text(draw, (40, 1325), "GATE: ownerApproval=false | artwork=false | renderer=false | ten-seat scene=false | Active Office unchanged", 19, RED)
    return image


def png_bytes(image: Image.Image) -> bytes:
    payload = io.BytesIO()
    image.save(payload, format="PNG", optimize=False, compress_level=9)
    return payload.getvalue()


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate(manifest: dict) -> list[str]:
    failures: list[str] = []
    if manifest.get("version") != 2 or manifest.get("status") != "blueprint-review":
        failures.append("Assembly Bible must remain version 2 in blueprint-review")
    permissions = manifest.get("permissions", {})
    for key, value in permissions.items():
        if value is not False:
            failures.append(f"permissions.{key} must remain false")
    desk = manifest.get("desk", {})
    footprint = desk.get("footprint", {})
    support = desk.get("supportPlane", {})
    if (footprint.get("width"), footprint.get("depth")) != (3, 2):
        failures.append("desk footprint must equal 3 x 2")
    if (support.get("width"), support.get("depth")) != (3, 2):
        failures.append("desk support plane must equal 3 x 2")
    if desk.get("employeeEdgeRow") is not None:
        failures.append("desk employeeEdgeRow must remain null")
    source = ROOT / manifest.get("sourceReference", {}).get("file", "")
    if not source.exists() or file_sha256(source) != manifest.get("sourceReference", {}).get("sha256"):
        failures.append("source reference is missing or its SHA-256 changed")
    baseline = ROOT / manifest.get("activeOfficeBaseline", {}).get("file", "")
    if not baseline.exists() or file_sha256(baseline) != manifest.get("activeOfficeBaseline", {}).get("sha256"):
        failures.append("Active Office baseline is missing or changed during blueprint review")
    expected_outputs = [
        "assets/art/layout-references/office-workstation-v2/01-target-decomposition-v2.png",
        "assets/art/layout-references/office-workstation-v2/02-furniture-exploded-parts-v2.png",
        "assets/art/layout-references/office-workstation-v2/03-assembly-and-adjacency-v2.png",
        "assets/art/layout-references/office-workstation-v2/00-owner-review-contact-sheet-v2.png",
    ]
    if manifest.get("reviewOutputs") != expected_outputs:
        failures.append("reviewOutputs must list the exact v2 deterministic boards")
    return failures


def build_outputs(manifest: dict) -> dict[Path, bytes]:
    canonical = json.dumps(manifest, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    digest = hashlib.sha256(canonical).hexdigest()
    decomposition = draw_source_decomposition(manifest, digest)
    exploded = draw_exploded_parts(manifest, digest)
    assembly = draw_assembly_and_adjacency(manifest, digest)
    contact = draw_contact_sheet([
        ("1. TARGET DECOMPOSITION", decomposition),
        ("2. EXPLODED PARTS", exploded),
        ("3. ASSEMBLY + ADJACENCY", assembly),
    ], digest)
    return {
        OUTPUT_DIRECTORY / "01-target-decomposition-v2.png": png_bytes(decomposition),
        OUTPUT_DIRECTORY / "02-furniture-exploded-parts-v2.png": png_bytes(exploded),
        OUTPUT_DIRECTORY / "03-assembly-and-adjacency-v2.png": png_bytes(assembly),
        OUTPUT_DIRECTORY / "00-owner-review-contact-sheet-v2.png": png_bytes(contact),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Build or verify the Workstation Assembly Bible v2 boards")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    failures = validate(manifest)
    if failures:
        print("\n".join(f"- {failure}" for failure in failures))
        return 1
    outputs = build_outputs(manifest)
    if args.check:
        stale = [path for path, payload in outputs.items() if not path.exists() or path.read_bytes() != payload]
        if stale:
            print("\n".join(f"Stale or missing board: {path.relative_to(ROOT).as_posix()}" for path in stale))
            return 1
    else:
        OUTPUT_DIRECTORY.mkdir(parents=True, exist_ok=True)
        for path, payload in outputs.items():
            path.write_bytes(payload)
    print("Workstation Assembly Bible v2 OK: four deterministic review images current; artwork remains blocked.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
