#!/usr/bin/env python3
"""Build the isolated Office background and semantic-grid v2 review candidate."""

from __future__ import annotations

import argparse
import hashlib
import io
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "assets/art/backgrounds/office-c-background-modern-v3.png"
CANDIDATE_PATH = ROOT / "assets/art/backgrounds/office-c-background-modern-v4-candidate.png"
ACTIVE_MAP_PATH = ROOT / "assets/game/maps/office-c-v2.json"
MAP_PATH = ROOT / "assets/game/maps/office-semantic-grid-v2.json"
MANIFEST_PATH = ROOT / "assets/game/manifests/office-semantic-grid-v2.json"
REVIEW_DIR = ROOT / "assets/art/layout-references/office-semantic-grid-v2"
SEMANTIC_PATH = REVIEW_DIR / "01-semantic-grid.png"
DEBUG_PATH = REVIEW_DIR / "02-boundary-debug.png"
COMPARISON_PATH = REVIEW_DIR / "03-before-after.png"
OWNER_WINDOW_PATH = REVIEW_DIR / "00-owner-window-highlight.png"
OWNER_FLOOR_PATH = REVIEW_DIR / "00-owner-floor-highlight.png"

WIDTH = 1672
HEIGHT = 941
COLUMNS = 43
ROWS = 24
WINDOW_SOURCE = (510, 119, 1050, 359)
WINDOW_TARGET = (510, 119, 1011, 353)
OLD_FLOOR_BOUNDARY_X = 1065
NEW_FLOOR_BOUNDARY_X = 1050
FLOOR_TOP_Y = 416
PILLAR_BOTTOM_Y = 442

COLORS = {
    "office-wall": (16, 185, 129),
    "outside-window": (249, 115, 22),
    "relax-wall": (2, 132, 199),
    "office-floor": (244, 180, 0),
    "relax-floor": (236, 64, 122),
    "pillar-left": (126, 87, 194),
    "pillar-center": (94, 53, 177),
    "pillar-right": (171, 71, 188),
}

ZONE_SPECS = [
    ("office-wall", "Office wall", ["C1-AA10"]),
    ("outside-window", "Outside window", ["N4-Z9"]),
    ("relax-wall", "Relaxation wall", ["AE1-AO10"]),
    ("office-floor", "Office floor", ["C11-AA11", "A12-AA24"]),
    ("relax-floor", "Relaxation floor", ["AE11-AO11", "AB12-AQ24"]),
    ("pillar-left", "Left pillar", ["A1-B11"]),
    ("pillar-center", "Center pillar", ["AB1-AD11"]),
    ("pillar-right", "Right pillar", ["AP1-AQ11"]),
]


def font(size: int) -> ImageFont.ImageFont:
    path = Path("C:/Windows/Fonts/arialbd.ttf")
    return ImageFont.truetype(str(path), size) if path.exists() else ImageFont.load_default(size=size)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def repo_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def json_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def png_bytes(image: Image.Image) -> bytes:
    stream = io.BytesIO()
    image.save(stream, format="PNG", optimize=False, compress_level=9)
    return stream.getvalue()


def boundary(index: int, count: int, pixels: int) -> int:
    return round(index * pixels / count)


def column_label(index: int) -> str:
    value = index + 1
    label = ""
    while value:
        value -= 1
        label = chr(65 + value % 26) + label
        value //= 26
    return label


def column_index(label: str) -> int:
    value = 0
    for character in label:
        value = value * 26 + ord(character) - 64
    return value - 1


def parse_cell(label: str) -> tuple[int, int]:
    split = 0
    while split < len(label) and label[split].isalpha():
        split += 1
    return column_index(label[:split]), int(label[split:]) - 1


def cells_in_range(cell_range: str) -> list[str]:
    start, end = cell_range.split("-")
    start_column, start_row = parse_cell(start)
    end_column, end_row = parse_cell(end)
    return [
        f"{column_label(column)}{row + 1}"
        for row in range(start_row, end_row + 1)
        for column in range(start_column, end_column + 1)
    ]


def cell_box(cell_range: str) -> tuple[int, int, int, int]:
    start, end = cell_range.split("-")
    start_column, start_row = parse_cell(start)
    end_column, end_row = parse_cell(end)
    return (
        boundary(start_column, COLUMNS, WIDTH),
        boundary(start_row, ROWS, HEIGHT),
        boundary(end_column + 1, COLUMNS, WIDTH) - 1,
        boundary(end_row + 1, ROWS, HEIGHT) - 1,
    )


def assignments() -> dict[str, str]:
    values: dict[str, str] = {}
    ordered = [
        "office-wall",
        "relax-wall",
        "office-floor",
        "relax-floor",
        "outside-window",
        "pillar-left",
        "pillar-center",
        "pillar-right",
    ]
    ranges = {zone_id: zone_ranges for zone_id, _, zone_ranges in ZONE_SPECS}
    for zone_id in ordered:
        for cell_range in ranges[zone_id]:
            for cell in cells_in_range(cell_range):
                values[cell] = zone_id
    return dict(sorted(values.items(), key=lambda item: (parse_cell(item[0])[1], parse_cell(item[0])[0])))


def build_candidate() -> Image.Image:
    source = Image.open(SOURCE_PATH).convert("RGBA")
    if source.size != (WIDTH, HEIGHT):
        raise RuntimeError(f"Unexpected source size: {source.size}")
    candidate = source.copy()

    wall_source = source.crop((456, WINDOW_SOURCE[1], 510, WINDOW_SOURCE[3]))
    candidate.paste(wall_source, (WINDOW_TARGET[2], WINDOW_SOURCE[1]))
    lower_wall = source.crop((456, WINDOW_TARGET[3], 510, WINDOW_SOURCE[3]))
    lower_wall = lower_wall.resize((WINDOW_TARGET[2] - WINDOW_TARGET[0], WINDOW_SOURCE[3] - WINDOW_TARGET[3]), Image.Resampling.LANCZOS)
    candidate.paste(lower_wall, (WINDOW_TARGET[0], WINDOW_TARGET[3]))
    window = source.crop(WINDOW_SOURCE).resize(
        (WINDOW_TARGET[2] - WINDOW_TARGET[0], WINDOW_TARGET[3] - WINDOW_TARGET[1]),
        Image.Resampling.LANCZOS,
    )
    candidate.paste(window, WINDOW_TARGET[:2])

    upper_wood = source.crop((1145, FLOOR_TOP_Y, 1160, PILLAR_BOTTOM_Y))
    candidate.paste(upper_wood, (NEW_FLOOR_BOUNDARY_X, FLOOR_TOP_Y))
    floor = source.crop((OLD_FLOOR_BOUNDARY_X, PILLAR_BOTTOM_Y, WIDTH, HEIGHT))
    floor = floor.resize((WIDTH - NEW_FLOOR_BOUNDARY_X, HEIGHT - PILLAR_BOTTOM_Y), Image.Resampling.LANCZOS)
    candidate.paste(floor, (NEW_FLOOR_BOUNDARY_X, PILLAR_BOTTOM_Y))
    return candidate.convert("RGB")


def draw_grid(image: Image.Image) -> Image.Image:
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    label_font = font(9)
    for column in range(COLUMNS + 1):
        x = boundary(column, COLUMNS, WIDTH)
        draw.line((x, 0, x, HEIGHT), fill=(255, 255, 255, 190), width=1)
    for row in range(ROWS + 1):
        y = boundary(row, ROWS, HEIGHT)
        draw.line((0, y, WIDTH, y), fill=(255, 255, 255, 190), width=1)
    for row in range(ROWS):
        top = boundary(row, ROWS, HEIGHT)
        for column in range(COLUMNS):
            left = boundary(column, COLUMNS, WIDTH)
            label = f"{column_label(column)}{row + 1}"
            text_box = draw.textbbox((0, 0), label, font=label_font, stroke_width=1)
            text_width = text_box[2] - text_box[0]
            draw.rounded_rectangle((left + 2, top + 2, left + text_width + 6, top + 14), radius=2, fill=(2, 6, 23, 185))
            draw.text((left + 4, top + 3), label, font=label_font, fill=(255, 255, 255, 255), stroke_width=1, stroke_fill=(2, 6, 23, 255))
    draw.rectangle((0, 0, WIDTH - 1, HEIGHT - 1), outline=(34, 211, 238, 255), width=3)
    return Image.alpha_composite(image.convert("RGBA"), overlay)


def render_semantic(candidate: Image.Image) -> Image.Image:
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    for zone_id, _, ranges in ZONE_SPECS:
        for cell_range in ranges:
            box = cell_box(cell_range)
            color = COLORS[zone_id]
            draw.rectangle(box, fill=(*color, 50), outline=(*color, 255), width=5)
    map_image = draw_grid(Image.alpha_composite(candidate.convert("RGBA"), overlay))
    return add_legend(map_image, "OFFICE SEMANTIC GRID V2 — OWNER REVIEW; ALL 1,032 CELLS CLASSIFIED")


def render_debug(candidate: Image.Image) -> Image.Image:
    image = draw_grid(candidate)
    draw = ImageDraw.Draw(image, "RGBA")
    window_box = cell_box("N4-Z9")
    restored_wall = cell_box("AA4-AA9")
    recovered_floor = cell_box("AB12-AB24")
    draw.rectangle(window_box, outline=(*COLORS["outside-window"], 255), width=7)
    draw.rectangle(restored_wall, fill=(*COLORS["office-wall"], 75), outline=(*COLORS["office-wall"], 255), width=7)
    draw.rectangle(recovered_floor, fill=(*COLORS["relax-floor"], 75), outline=(*COLORS["relax-floor"], 255), width=7)
    draw.line((NEW_FLOOR_BOUNDARY_X, boundary(11, ROWS, HEIGHT), NEW_FLOOR_BOUNDARY_X, HEIGHT), fill=(255, 255, 255, 255), width=4)
    return add_legend(image, "BOUNDARY DEBUG — WINDOW RIGHT: Z|AA x=1011 · FLOOR: AA|AB x=1050")


def add_legend(image: Image.Image, title: str) -> Image.Image:
    legend_height = 152
    board = Image.new("RGBA", (WIDTH, HEIGHT + legend_height), (9, 15, 27, 255))
    board.alpha_composite(image.convert("RGBA"), (0, 0))
    draw = ImageDraw.Draw(board, "RGBA")
    draw.text((20, HEIGHT + 12), title, font=font(19), fill=(255, 255, 255, 255))
    x = 20
    y = HEIGHT + 55
    item_font = font(15)
    for zone_id, name, ranges in ZONE_SPECS:
        text = f"{name}: {' + '.join(ranges)}"
        text_width = draw.textbbox((0, 0), text, font=item_font)[2]
        item_width = 30 + text_width + 30
        if x + item_width > WIDTH - 20:
            x = 20
            y += 38
        draw.rounded_rectangle((x, y, x + 22, y + 22), radius=3, fill=(*COLORS[zone_id], 255))
        draw.text((x + 30, y + 2), text, font=item_font, fill=(231, 237, 246, 255))
        x += item_width
    return board.convert("RGB")


def render_comparison(source: Image.Image, candidate: Image.Image) -> Image.Image:
    preview_size = (836, 471)
    board = Image.new("RGB", (WIDTH, 521), (9, 15, 27))
    board.paste(source.resize(preview_size, Image.Resampling.LANCZOS), (0, 50))
    board.paste(candidate.resize(preview_size, Image.Resampling.LANCZOS), (836, 50))
    draw = ImageDraw.Draw(board)
    draw.text((20, 13), "BEFORE — V3 ACTIVE BACKGROUND", font=font(20), fill=(255, 255, 255))
    draw.text((856, 13), "AFTER — V4 ISOLATED CANDIDATE", font=font(20), fill=(255, 255, 255))
    draw.line((836, 0, 836, 521), fill=(34, 211, 238), width=3)
    return board


def map_data(candidate_content: bytes) -> dict[str, Any]:
    zone_metadata = [
        {
            "id": zone_id,
            "kind": zone_id,
            "label": name,
            "ranges": ranges,
            "color": f"#{COLORS[zone_id][0]:02x}{COLORS[zone_id][1]:02x}{COLORS[zone_id][2]:02x}",
        }
        for zone_id, name, ranges in ZONE_SPECS
    ]
    return {
        "schemaVersion": 1,
        "id": "office-semantic-grid-v2",
        "status": "owner-review",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "sourceBackground": {
            "file": repo_path(SOURCE_PATH),
            "sha256": sha256(SOURCE_PATH),
            "mustRemainByteIdentical": True,
        },
        "candidateBackground": {
            "file": repo_path(CANDIDATE_PATH),
            "sha256": sha256_bytes(candidate_content),
            "pixels": [WIDTH, HEIGHT],
        },
        "activeOfficeBaseline": {
            "file": repo_path(ACTIVE_MAP_PATH),
            "sha256": sha256(ACTIVE_MAP_PATH),
            "mustRemainByteIdentical": True,
        },
        "grid": {
            "columns": COLUMNS,
            "rows": ROWS,
            "origin": "top-left",
            "notation": "column-letter-row-number",
            "cellCount": COLUMNS * ROWS,
        },
        "zones": zone_metadata,
        "cellAssignments": assignments(),
        "physicalEdits": {
            "window": {
                "oldCells": "N4-AA9",
                "newCells": "N4-Z9",
                "restoredOfficeWallCells": "AA4-AA9",
                "sourcePixels": list(WINDOW_SOURCE),
                "targetPixels": list(WINDOW_TARGET),
                "newRightGridBoundaryX": boundary(26, COLUMNS, WIDTH),
            },
            "floor": {
                "recoveredRelaxationCells": "AB12-AB24",
                "oldBoundaryX": OLD_FLOOR_BOUNDARY_X,
                "newBoundaryX": NEW_FLOOR_BOUNDARY_X,
                "gridBoundary": "AA|AB",
            },
        },
        "rules": {
            "allCellsClassified": True,
            "pillarsExcludedFromFloor": True,
            "activeOfficePromotion": False,
            "newCharacterOrFurniture": False,
        },
    }


def manifest_data(map_content: bytes, candidate_content: bytes, review_contents: dict[Path, bytes]) -> dict[str, Any]:
    return {
        "version": 1,
        "id": "office.semantic-grid.v2",
        "status": "owner-review",
        "updatedOn": "2026-07-29",
        "map": {"file": repo_path(MAP_PATH), "sha256": sha256_bytes(map_content)},
        "candidateBackground": {"file": repo_path(CANDIDATE_PATH), "sha256": sha256_bytes(candidate_content)},
        "ownerEvidence": [
            {"file": repo_path(path), "sha256": sha256(path)}
            for path in (OWNER_WINDOW_PATH, OWNER_FLOOR_PATH)
        ],
        "reviewOutputs": [
            {"file": repo_path(path), "sha256": sha256_bytes(content)}
            for path, content in review_contents.items()
        ],
        "permissions": {
            "isolatedBackgroundCandidate": True,
            "semanticZoneReview": True,
            "activeOfficePromotion": False,
            "newCharacterOrFurniture": False,
        },
        "activeOfficeBaseline": {
            "file": repo_path(ACTIVE_MAP_PATH),
            "sha256": sha256(ACTIVE_MAP_PATH),
            "mustRemainByteIdentical": True,
        },
    }


def build_outputs() -> dict[Path, bytes]:
    candidate = build_candidate()
    source = Image.open(SOURCE_PATH).convert("RGB")
    candidate_content = png_bytes(candidate)
    review_contents = {
        SEMANTIC_PATH: png_bytes(render_semantic(candidate)),
        DEBUG_PATH: png_bytes(render_debug(candidate)),
        COMPARISON_PATH: png_bytes(render_comparison(source, candidate)),
    }
    map_content = json_bytes(map_data(candidate_content))
    return {
        CANDIDATE_PATH: candidate_content,
        MAP_PATH: map_content,
        **review_contents,
        MANIFEST_PATH: json_bytes(manifest_data(map_content, candidate_content, review_contents)),
    }


def write_or_check(outputs: dict[Path, bytes], check: bool) -> None:
    stale = []
    for path, content in outputs.items():
        if check:
            if not path.exists() or path.read_bytes() != content:
                stale.append(repo_path(path))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
    if stale:
        raise SystemExit("Stale Office semantic-grid v2 outputs: " + ", ".join(stale))
    action = "verified" if check else "built"
    print(f"Office semantic-grid v2 {action}: 1,032 cells classified, window N4-Z9, floor boundary AA|AB, Active Office unchanged.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    write_or_check(build_outputs(), args.check)


if __name__ == "__main__":
    main()
