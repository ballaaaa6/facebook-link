#!/usr/bin/env python3
"""Build the isolated C12 ten-seat placement review from approved assets."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import io
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSEMBLY_PATH = ROOT / "scripts/build-office-workstation-step5-r05-r02.py"
BACKGROUND_PATH = ROOT / "assets/art/backgrounds/office-c-background-modern-v4-candidate.png"
SEMANTIC_MAP_PATH = ROOT / "assets/game/maps/office-semantic-grid-v2.json"
ACTIVE_MAP_PATH = ROOT / "assets/game/maps/office-c-v2.json"
SOCKETS_PATH = ROOT / "assets/game/manifests/office-character-seat-sockets-v1.json"
MAP_PATH = ROOT / "assets/game/maps/office-c12-ten-seat-v1.json"
MANIFEST_PATH = ROOT / "assets/game/manifests/office-c12-ten-seat-v1.json"
REVIEW_DIR = ROOT / "assets/art/layout-references/office-c12-ten-seat-v1"

OUTPUT_PATHS = {
    "combinedClean": REVIEW_DIR / "01-combined-clean.png",
    "combinedGrid": REVIEW_DIR / "02-combined-grid-highlighted.png",
    "furnitureGrid": REVIEW_DIR / "03-furniture-only-grid.png",
    "peopleGrid": REVIEW_DIR / "04-people-only-grid.png",
    "furnitureLayer": REVIEW_DIR / "05-furniture-layer-transparent.png",
    "peopleLayer": REVIEW_DIR / "06-people-layer-transparent.png",
}

WIDTH = 1672
HEIGHT = 941
COLUMNS = 43
ROWS = 24
TILE = 32
LOGICAL_SIZE = (COLUMNS * TILE, ROWS * TILE)

ANCHOR_CELL = "C12"
PROTECTED_ENVELOPE = "C12:S19"
CONTENT_FOOTPRINT = "D13:R18"
WALKWAY_RANGES = ["C12:S12", "C19:S19", "C13:C18", "S13:S18"]
DESK_COLUMNS = [3, 6, 9, 12, 15]
DESK_ROWS = {"far": 13, "near": 15}
CHAIR_ROWS = {"far": 12, "near": 17}

ROSTER = {
    "far": [
        ("market-scout", "yinyue-2"),
        ("product-ranker", "einstein"),
        ("growth-strategist", "ruri"),
        ("performance-analyst", "noir-webling"),
        ("gemini-copywriter", "anna"),
    ],
    "near": [
        ("flow-visual-producer", "taffy-2"),
        ("link-attribution", "doraemon"),
        ("qa-editor", "rem-xl"),
        ("publisher", "miku"),
        ("session-keeper", "ai-workbot"),
    ],
}

COLORS = {
    "anchor": (16, 185, 129),
    "walkway": (14, 165, 233),
    "content": (245, 158, 11),
    "furniture": (34, 211, 238),
    "people": (236, 72, 153),
    "ink": (8, 15, 28),
    "text": (235, 242, 250),
}


def load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


ASSEMBLY = load_module(ASSEMBLY_PATH, "office_c12_r05_r02_assembly")


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


def cell_range_box(cell_range: str) -> tuple[int, int, int, int]:
    start, end = cell_range.split(":")
    start_column, start_row = parse_cell(start)
    end_column, end_row = parse_cell(end)
    return (
        boundary(start_column, COLUMNS, WIDTH),
        boundary(start_row, ROWS, HEIGHT),
        boundary(end_column + 1, COLUMNS, WIDTH) - 1,
        boundary(end_row + 1, ROWS, HEIGHT) - 1,
    )


def cell_name(column: int, row: int) -> str:
    return f"{column_label(column)}{row + 1}"


def cell_range(column: int, row: int, width: int, height: int) -> str:
    return f"{cell_name(column, row)}:{cell_name(column + width - 1, row + height - 1)}"


def station_records() -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for orientation in ("far", "near"):
        row_roster = zip(ROSTER[orientation], DESK_COLUMNS, strict=True)
        for index, ((agent_id, slug), desk_column) in enumerate(row_roster, 1):
            desk_row = DESK_ROWS[orientation]
            chair_row = CHAIR_ROWS[orientation]
            actor_orientation = "front" if orientation == "far" else "back"
            monitor_row = desk_row + 1 if orientation == "far" else desk_row
            keyboard_row = desk_row if orientation == "far" else desk_row + 1
            records.append({
                "id": f"{orientation}-{index}",
                "agentId": agent_id,
                "characterSlug": slug,
                "orientation": orientation,
                "actorOrientation": actor_orientation,
                "deskOriginWorld": [desk_column, desk_row, 0],
                "deskFootprint": cell_range(desk_column, desk_row, 3, 2),
                "chairAndPersonCell": cell_name(desk_column + 1, chair_row),
                "monitorReservation": cell_range(desk_column, monitor_row, 3, 1),
                "keyboardReservation": cell_name(desk_column + 1, keyboard_row),
                "seatContactErrors": [[0, 0] for _ in range(6)],
            })
    return records


def logical_layers(frame: int = 0) -> dict[str, Image.Image]:
    combined = Image.new("RGBA", LOGICAL_SIZE, (0, 0, 0, 0))
    furniture = Image.new("RGBA", LOGICAL_SIZE, (0, 0, 0, 0))
    people = Image.new("RGBA", LOGICAL_SIZE, (0, 0, 0, 0))
    for record in station_records():
        desk_column, desk_row, _ = record["deskOriginWorld"]
        desk_left = desk_column * TILE
        desk_top = desk_row * TILE - 2 * TILE
        layers = ASSEMBLY.station_layer_records(
            record["orientation"],
            record["characterSlug"],
            frame,
            desk_left,
            desk_top,
        )
        for layer in layers:
            combined.alpha_composite(layer["image"], layer["xy"])
            target = people if layer["name"] == "actor" else furniture
            target.alpha_composite(layer["image"], layer["xy"])
    return {"combined": combined, "furniture": furniture, "people": people}


def scaled_layers() -> dict[str, Image.Image]:
    return {
        name: image.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
        for name, image in logical_layers().items()
    }


def draw_placement_highlights(image: Image.Image, people_only: bool = False) -> Image.Image:
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    for walkway_range in WALKWAY_RANGES:
        draw.rectangle(cell_range_box(walkway_range), fill=(*COLORS["walkway"], 55))
    draw.rectangle(
        cell_range_box(CONTENT_FOOTPRINT),
        fill=(*COLORS["content"], 42),
        outline=(*COLORS["content"], 255),
        width=5,
    )
    draw.rectangle(
        cell_range_box(PROTECTED_ENVELOPE),
        outline=(*COLORS["walkway"], 255),
        width=6,
    )
    anchor_box = cell_range_box(f"{ANCHOR_CELL}:{ANCHOR_CELL}")
    draw.rectangle(
        anchor_box,
        fill=(*COLORS["anchor"], 105),
        outline=(*COLORS["anchor"], 255),
        width=5,
    )
    if people_only:
        for record in station_records():
            cell = record["chairAndPersonCell"]
            draw.rectangle(
                cell_range_box(f"{cell}:{cell}"),
                fill=(*COLORS["people"], 62),
                outline=(*COLORS["people"], 255),
                width=3,
            )
    return Image.alpha_composite(image.convert("RGBA"), overlay)


def draw_grid(image: Image.Image) -> Image.Image:
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    label_font = font(9)
    for column in range(COLUMNS + 1):
        x = boundary(column, COLUMNS, WIDTH)
        draw.line((x, 0, x, HEIGHT), fill=(255, 255, 255, 180), width=1)
    for row in range(ROWS + 1):
        y = boundary(row, ROWS, HEIGHT)
        draw.line((0, y, WIDTH, y), fill=(255, 255, 255, 180), width=1)
    for row in range(ROWS):
        top = boundary(row, ROWS, HEIGHT)
        for column in range(COLUMNS):
            left = boundary(column, COLUMNS, WIDTH)
            label = cell_name(column, row)
            text_width = draw.textbbox((0, 0), label, font=label_font, stroke_width=1)[2]
            draw.rounded_rectangle(
                (left + 2, top + 2, left + text_width + 6, top + 14),
                radius=2,
                fill=(2, 6, 23, 185),
            )
            draw.text(
                (left + 4, top + 3),
                label,
                font=label_font,
                fill=(255, 255, 255, 255),
                stroke_width=1,
                stroke_fill=(2, 6, 23, 255),
            )
    return Image.alpha_composite(image.convert("RGBA"), overlay)


def add_legend(image: Image.Image, title: str, subtitle: str) -> Image.Image:
    legend_height = 170
    board = Image.new("RGBA", (WIDTH, HEIGHT + legend_height), (*COLORS["ink"], 255))
    board.alpha_composite(image.convert("RGBA"))
    draw = ImageDraw.Draw(board, "RGBA")
    draw.text((20, HEIGHT + 12), title, font=font(19), fill=COLORS["text"])
    draw.text((20, HEIGHT + 39), subtitle, font=font(13), fill=(174, 190, 208))
    items = [
        ("anchor", "Start: C12"),
        ("walkway", "Shared walkway: C12:S19 perimeter"),
        ("content", "Furniture + seats: D13:R18 (6 x 15)"),
        ("furniture", "Furniture: desks, chairs, monitors, keyboards"),
        ("people", "People: 10 existing seated characters"),
    ]
    x = 20
    y = HEIGHT + 78
    item_font = font(14)
    for color_id, text in items:
        text_width = draw.textbbox((0, 0), text, font=item_font)[2]
        item_width = text_width + 64
        if x + item_width > WIDTH - 20:
            x = 20
            y += 40
        draw.rounded_rectangle(
            (x, y, x + 24, y + 24),
            radius=4,
            fill=(*COLORS[color_id], 255),
        )
        draw.text((x + 33, y + 3), text, font=item_font, fill=COLORS["text"])
        x += item_width
    return board.convert("RGB")


def scene(layer: Image.Image, highlighted: bool, people_only: bool = False) -> Image.Image:
    background = Image.open(BACKGROUND_PATH).convert("RGBA")
    if people_only:
        background = Image.alpha_composite(
            background,
            Image.new("RGBA", background.size, (8, 15, 28, 52)),
        )
    if highlighted:
        background = draw_placement_highlights(background, people_only)
    background.alpha_composite(layer)
    return background


def map_data() -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "id": "office-c12-ten-seat-v1",
        "status": "owner-review",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "grid": {
            "columns": COLUMNS,
            "rows": ROWS,
            "origin": "top-left",
            "notation": "column-letter-row-number",
            "source": {
                "file": repo_path(SEMANTIC_MAP_PATH),
                "sha256": sha256(SEMANTIC_MAP_PATH),
            },
        },
        "placement": {
            "anchorCell": ANCHOR_CELL,
            "protectedEnvelope": {"range": PROTECTED_ENVELOPE, "size": [17, 8]},
            "contentFootprint": {"range": CONTENT_FOOTPRINT, "size": [15, 6]},
            "walkwayRanges": WALKWAY_RANGES,
            "rowRoles": {
                "12": "top-shared-walkway",
                "13": "far-chair-and-person",
                "14-15": "far-desks",
                "16-17": "near-desks",
                "18": "near-chair-and-person",
                "19": "bottom-shared-walkway",
            },
        },
        "stations": station_records(),
        "counts": {
            "desks": 10,
            "chairs": 10,
            "people": 10,
            "monitors": 10,
            "keyboards": 10,
        },
        "layers": {
            "background": repo_path(BACKGROUND_PATH),
            "furniture": repo_path(OUTPUT_PATHS["furnitureLayer"]),
            "people": repo_path(OUTPUT_PATHS["peopleLayer"]),
            "combinedUsesApprovedOcclusionOrder": True,
        },
        "sourceBackground": {
            "file": repo_path(BACKGROUND_PATH),
            "sha256": sha256(BACKGROUND_PATH),
            "mustRemainByteIdentical": True,
        },
        "seatSockets": {
            "file": repo_path(SOCKETS_PATH),
            "sha256": sha256(SOCKETS_PATH),
        },
        "componentAuthority": {
            "file": "assets/game/manifests/office-workstation-step5-r05-r02.json",
            "sha256": sha256(
                ROOT / "assets/game/manifests/office-workstation-step5-r05-r02.json"
            ),
        },
        "activeOfficeBaseline": {
            "file": repo_path(ACTIVE_MAP_PATH),
            "sha256": sha256(ACTIVE_MAP_PATH),
            "mustRemainByteIdentical": True,
        },
        "rules": {
            "deriveFromApprovedPair": True,
            "importRejectedTenSeatCoordinates": False,
            "newCharacterOrPose": False,
            "newFurnitureOrEquipment": False,
            "peopleAndFurnitureRemainSeparate": True,
        },
    }


def manifest_data(
    map_content: bytes,
    output_contents: dict[Path, bytes],
) -> dict[str, Any]:
    return {
        "version": 1,
        "id": "office.c12-ten-seat.v1",
        "status": "owner-review",
        "updatedOn": "2026-07-29",
        "map": {"file": repo_path(MAP_PATH), "sha256": sha256_bytes(map_content)},
        "reviewOutputs": [
            {"file": repo_path(path), "sha256": sha256_bytes(content)}
            for path, content in output_contents.items()
        ],
        "placementDecision": {
            "anchorCell": ANCHOR_CELL,
            "protectedEnvelope": PROTECTED_ENVELOPE,
            "contentFootprint": CONTENT_FOOTPRINT,
            "employeeCount": 10,
        },
        "permissions": {
            "isolatedOwnerReview": True,
            "reuseExistingArt": True,
            "activeOfficePromotion": False,
            "newCharacterOrPose": False,
            "newFurnitureOrEquipment": False,
        },
    }


def build_outputs() -> dict[Path, bytes]:
    layers = scaled_layers()
    clean = scene(layers["combined"], False)
    combined_grid = add_legend(
        draw_grid(scene(layers["combined"], True)),
        "C12 TEN-SEAT PLACEMENT - OWNER REVIEW",
        "The 8 x 17 protected envelope starts at C12; furniture occupies D13:R18 with a one-cell shared walkway.",
    )
    furniture_grid = add_legend(
        draw_grid(scene(layers["furniture"], True)),
        "FURNITURE-ONLY LAYER - C12 PLACEMENT",
        "Characters are removed; desks, chairs, monitors, and keyboards retain the approved station geometry.",
    )
    people_grid = add_legend(
        draw_grid(scene(layers["people"], True, people_only=True)),
        "PEOPLE-ONLY LAYER - 10 SEATED CHARACTERS",
        "Furniture is removed; magenta cells are the shared person/chair occupancy cells.",
    )
    output_contents = {
        OUTPUT_PATHS["combinedClean"]: png_bytes(clean.convert("RGB")),
        OUTPUT_PATHS["combinedGrid"]: png_bytes(combined_grid),
        OUTPUT_PATHS["furnitureGrid"]: png_bytes(furniture_grid),
        OUTPUT_PATHS["peopleGrid"]: png_bytes(people_grid),
        OUTPUT_PATHS["furnitureLayer"]: png_bytes(layers["furniture"]),
        OUTPUT_PATHS["peopleLayer"]: png_bytes(layers["people"]),
    }
    map_content = json_bytes(map_data())
    return {
        MAP_PATH: map_content,
        **output_contents,
        MANIFEST_PATH: json_bytes(manifest_data(map_content, output_contents)),
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
        raise SystemExit("Stale C12 ten-seat outputs: " + ", ".join(stale))
    action = "verified" if check else "built"
    print(
        f"C12 ten-seat v1 {action}: envelope C12:S19, "
        "content D13:R18, 10 people, Active Office unchanged."
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    write_or_check(build_outputs(), args.check)


if __name__ == "__main__":
    main()
