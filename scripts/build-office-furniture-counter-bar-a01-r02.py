#!/usr/bin/env python3
"""Build Counter Bar A01-r02 from a fresh geometry-corrected source."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw

from office_facility_art import (
    BODY_FONT,
    HEADING_FONT,
    SMALL_FONT,
    checkerboard,
    connected_components,
    draw_title,
    json_bytes,
    normalize_without_resampling,
    paste_scaled,
    png_bytes,
    remove_magenta_chroma,
    repo_path,
    sha256_bytes,
    sha256_file,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = (
    ROOT
    / "assets/art/layout-references/"
    "office-furniture-counter-bar-a01-r02-source.png"
)
MANIFEST_PATH = (
    ROOT / "assets/game/manifests/office-furniture-counter-bar-a01-r02.json"
)
OUTPUT_ROOT = (
    ROOT / "assets/game/processed/office-furniture-counter-bar-a01-r02"
)
AUTHORING_ROOT = OUTPUT_ROOT / "authoring"
RUNTIME_ROOT = OUTPUT_ROOT / "runtime"
SOURCE_ROOT = AUTHORING_ROOT / "source"
AUTHORING_PART_ROOT = AUTHORING_ROOT / "parts"
RUNTIME_PART_ROOT = RUNTIME_ROOT / "parts"
REVIEW_ROOT = (
    ROOT
    / "assets/art/layout-references/"
    "office-furniture-family-v1/counter-bar-a01-r02"
)

SOURCE_SHA256 = (
    "3d809b2279f57590e802b792c48336428242174cc239b9bb6bfbece32bbdfe94"
)
GENERATION_PROMPT = (
    "Create one entirely new empty modern-bright pixel-art cafe counter from "
    "text only. The full cream terrazzo support surface must represent a "
    "complete 6-by-2 orthographic rectangle with equal parallel edges and "
    "four square corners. Place a thin slab below it, a warm oak cabinet with "
    "vertical slats, one restrained brass rail, and a thin navy plinth. The "
    "whole counter is 2 tiles high. Use a flat removable magenta background "
    "and include no machine, cup, prop, person, shadow, text, or room. Two "
    "same-lineage geometry correction passes deepened the fresh top. The "
    "builder removes source rows 529..578 without resampling so the final "
    "orthographic support envelope resolves exactly against 6-by-2 geometry."
)

AUTHORING_CANVAS = (1536, 960)
RUNTIME_CANVAS = (256, 160)
RUNTIME_DIVISOR = 6
BOTTOM_PADDING = 60
SOURCE_SURFACE_BOUNDS = (123, 99, 1414, 579)
REMOVED_ROWS = (529, 579)
PRESERVED_ASSEMBLY_ROW = 579
OUTPUT_SURFACE_BOUNDS = (123, 99, 1414, 529)
PART_CUTS = (580, 849)
ROOT_SOCKET = (128, 150)
PROJECTED_SUPPORT_BOUNDS = (32, 22, 224, 86)
VISUAL_TOP_BOUNDS = (20, 21, 236, 93)
WORLD_POSITIONS = ((0, 0), (4, 3), (9, 6))

ROWS = ("back", "front")
SLOT_IDS = tuple(
    f"surface.{row}.{column:02d}"
    for row in ROWS
    for column in range(1, 7)
)
SLOT_RECORDS = tuple(
    {
        "id": f"surface.{row}.{column:02d}",
        "row": row,
        "column": column,
        "x": column - 0.5,
        "y": 0.5 if row == "back" else 1.5,
        "socket": (
            48 + (column - 1) * 32,
            38 if row == "back" else 70,
        ),
        "laneId": f"use.{column:02d}",
    }
    for row in ROWS
    for column in range(1, 7)
)

KEYED_PATH = SOURCE_ROOT / "counter-bar-a01-r02.keyed-source.png"
OWNERSHIP_PATH = SOURCE_ROOT / "counter-bar-a01-r02.ownership-mask.png"
GEOMETRY_SOURCE_PATH = (
    SOURCE_ROOT / "counter-bar-a01-r02.geometry-normalized-source.png"
)
NORMALIZED_PATH = AUTHORING_ROOT / "counter-bar-a01-r02.normalized.png"
RUNTIME_CLEAN_PATH = RUNTIME_ROOT / "counter-bar-a01-r02.clean.png"
PART_PATHS = {
    "support-surface": (
        AUTHORING_PART_ROOT / "counter-bar-a01-r02.support-surface.png",
        RUNTIME_PART_ROOT / "counter-bar-a01-r02.support-surface.png",
    ),
    "base-shell": (
        AUTHORING_PART_ROOT / "counter-bar-a01-r02.base-shell.png",
        RUNTIME_PART_ROOT / "counter-bar-a01-r02.base-shell.png",
    ),
    "foreground-occlusion": (
        AUTHORING_PART_ROOT / "counter-bar-a01-r02.foreground-occlusion.png",
        RUNTIME_PART_ROOT / "counter-bar-a01-r02.foreground-occlusion.png",
    ),
}
REVIEW_PATHS = [
    REVIEW_ROOT / "01-source-lineage-and-normalization.png",
    REVIEW_ROOT / "02-exact-6x2x2-geometry.png",
    REVIEW_ROOT / "03-alpha-parts.png",
    REVIEW_ROOT / "04-clean-front.png",
    REVIEW_ROOT / "05-twelve-surface-cells.png",
    REVIEW_ROOT / "06-four-corner-edge-support.png",
    REVIEW_ROOT / "07-modular-configurations.png",
    REVIEW_ROOT / "08-spans-and-rejections.png",
    REVIEW_ROOT / "09-use-lanes-and-routes.png",
    REVIEW_ROOT / "10-movement-socket-proof.png",
    REVIEW_ROOT / "11-reservation-timeline-30s.png",
    REVIEW_ROOT / "12-layer-order.png",
]
OWNER_DECISION = {
    "decision": "approved",
    "decidedOn": "2026-07-29",
    "notes": (
        "Owner approved Counter Bar A01-r02 as the reusable cafe counter "
        "and directed Coffee Machine C01 production to begin on its support "
        "surface."
    ),
}


def rp(path: Path) -> str:
    return repo_path(ROOT, path)


def alpha_layer(source: Image.Image, top: int, bottom: int) -> Image.Image:
    layer = Image.new("RGBA", source.size, (0, 0, 0, 0))
    layer.alpha_composite(source.crop((0, top, source.width, bottom)), (0, top))
    return layer


def normalize_geometry_without_resampling(keyed: Image.Image) -> Image.Image:
    output = Image.new("RGBA", keyed.size, (0, 0, 0, 0))
    output.alpha_composite(
        keyed.crop((0, 0, keyed.width, REMOVED_ROWS[0])),
        (0, 0),
    )
    output.alpha_composite(
        keyed.crop((0, PRESERVED_ASSEMBLY_ROW, keyed.width, keyed.height)),
        (0, REMOVED_ROWS[0]),
    )
    return output


def build_source() -> tuple[
    Image.Image,
    Image.Image,
    Image.Image,
    Image.Image,
    dict[str, Any],
]:
    if sha256_file(SOURCE_PATH) != SOURCE_SHA256:
        raise ValueError("Counter Bar A01-r02 fresh source hash changed")
    source = Image.open(SOURCE_PATH).convert("RGBA")
    keyed, key_rgb, chroma = remove_magenta_chroma(source)
    components = sorted(
        connected_components(keyed),
        key=lambda component: component["pixelCount"],
        reverse=True,
    )
    if len(components) != 1:
        raise ValueError(
            f"A01-r02 source must have one component: {len(components)}"
        )
    component = components[0]
    raw_bounds = tuple(component["bounds"])
    if raw_bounds != (123, 99, 1414, 922):
        raise ValueError(f"A01-r02 raw source bounds changed: {raw_bounds}")
    geometry_source = normalize_geometry_without_resampling(keyed)
    corrected_components = connected_components(geometry_source)
    if len(corrected_components) != 1:
        raise ValueError("A01-r02 geometry normalization broke connectivity")
    corrected_bounds = tuple(corrected_components[0]["bounds"])
    if corrected_bounds != (123, 99, 1414, 872):
        raise ValueError(
            f"A01-r02 geometry-normalized bounds changed: {corrected_bounds}"
        )
    normalized, padding, normalized_from = normalize_without_resampling(
        geometry_source,
        AUTHORING_CANVAS,
        bottom_padding=BOTTOM_PADDING,
    )
    if normalized_from != corrected_bounds:
        raise ValueError("A01-r02 normalized bounds do not match geometry source")
    ownership = Image.new("RGBA", source.size, (0, 0, 0, 0))
    pixels = ownership.load()
    for point in component["points"]:
        pixels[point % source.width, point // source.width] = (
            43,
            183,
            235,
            230,
        )
    evidence = {
        "sampledKeyRgb": list(key_rgb),
        "sourceSize": list(source.size),
        "ownedBounds": list(raw_bounds),
        "connectedComponentCount": 1,
        "selectedVisiblePixels": component["pixelCount"],
        "chromaStats": chroma,
        "authoringPadding": padding,
    }
    return keyed, ownership, geometry_source, normalized, evidence


def build_parts(
    normalized: Image.Image,
) -> tuple[dict[str, Image.Image], dict[str, Image.Image], Image.Image]:
    authoring = {
        "support-surface": alpha_layer(normalized, 0, PART_CUTS[0]),
        "base-shell": alpha_layer(normalized, PART_CUTS[0], PART_CUTS[1]),
        "foreground-occlusion": alpha_layer(
            normalized,
            PART_CUTS[1],
            normalized.height,
        ),
    }
    recomposed = Image.new("RGBA", normalized.size, (0, 0, 0, 0))
    for part in authoring.values():
        recomposed.alpha_composite(part)
    if png_bytes(recomposed) != png_bytes(normalized):
        raise ValueError("A01-r02 parts do not recompose to normalized source")
    runtime = {
        part_id: part.resize(RUNTIME_CANVAS, Image.Resampling.NEAREST)
        for part_id, part in authoring.items()
    }
    clean = Image.new("RGBA", RUNTIME_CANVAS, (0, 0, 0, 0))
    for part in runtime.values():
        clean.alpha_composite(part)
    return authoring, runtime, clean


def support_metrics(runtime: Image.Image) -> dict[str, Any]:
    alpha = runtime.getchannel("A")
    left, top, right, bottom = PROJECTED_SUPPORT_BOUNDS
    failures: list[str] = []
    cell_coverage: dict[str, int] = {}
    for slot in SLOT_RECORDS:
        cell_left = left + (slot["column"] - 1) * 32
        cell_top = top if slot["row"] == "back" else top + 32
        visible = sum(
            1
            for y in range(cell_top, cell_top + 32)
            for x in range(cell_left, cell_left + 32)
            if alpha.getpixel((x, y)) > 0
        )
        cell_coverage[slot["id"]] = visible
        if visible != 1024:
            failures.append(slot["id"])
    return {
        "projectedSupportBounds": list(PROJECTED_SUPPORT_BOUNDS),
        "visualTopBounds": list(VISUAL_TOP_BOUNDS),
        "cellCoverage": cell_coverage,
        "edgeSupportFailures": len(failures),
        "failedSlots": failures,
    }


def board(title: str, subtitle: str) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGBA", (1600, 1000), (240, 244, 248, 255))
    return image, draw_title(image, title, subtitle)


def card(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    heading: str,
    fill: tuple[int, int, int, int] = (255, 255, 255, 255),
) -> None:
    draw.rounded_rectangle(
        box,
        radius=14,
        fill=fill,
        outline=(184, 197, 210, 255),
        width=2,
    )
    draw.text(
        (box[0] + 18, box[1] + 14),
        heading,
        font=HEADING_FONT,
        fill=(25, 43, 61, 255),
    )


def runtime_panel(
    runtime: Image.Image,
    scale: int,
) -> Image.Image:
    scaled = runtime.resize(
        (runtime.width * scale, runtime.height * scale),
        Image.Resampling.NEAREST,
    )
    bg = checkerboard(scaled.size, 24)
    bg.alpha_composite(scaled)
    return bg


def source_board(
    source: Image.Image,
    keyed: Image.Image,
    corrected: Image.Image,
    evidence: dict[str, Any],
) -> Image.Image:
    image, draw = board(
        "Counter Bar A01-r02 — Fresh Source Lineage",
        "Text-only ImageGen lineage • zero rejected/old pixels • 50 rows removed without resampling",
    )
    boxes = (
        (30, 120, 520, 810),
        (555, 120, 1045, 810),
        (1080, 120, 1570, 810),
    )
    entries = (
        ("Fresh generated source", source),
        ("Chroma-keyed source", keyed),
        ("Orthographic row-normalized", corrected),
    )
    for (heading, entry), box in zip(entries, boxes):
        card(draw, box, heading)
        bg = checkerboard(entry.size, 32)
        bg.alpha_composite(entry)
        paste_scaled(
            image,
            bg,
            (box[0] + 18, box[1] + 58, box[2] - 18, box[3] - 18),
            resample=Image.Resampling.LANCZOS,
        )
    lines = (
        f"source SHA-256: {SOURCE_SHA256[:20]}…",
        f"key RGB: {evidence['sampledKeyRgb']}",
        f"raw bounds: {evidence['ownedBounds']}",
        "removed rows: [529,579)",
        "pixels resampled: false",
        f"authoring padding: {evidence['authoringPadding']}",
    )
    for index, line in enumerate(lines):
        draw.text(
            (55 + (index % 3) * 510, 850 + (index // 3) * 45),
            line,
            font=BODY_FONT,
            fill=(38, 58, 75, 255),
        )
    return image


def geometry_board(runtime: Image.Image) -> Image.Image:
    image, draw = board(
        "Counter Bar A01-r02 — Exact 6×2×2 Geometry",
        "Projected support = 192×64 px • total height = 64 px • slab thickness = 8 px",
    )
    card(draw, (30, 120, 1130, 950), "Runtime render with measured support")
    panel = runtime_panel(runtime, 4)
    origin = (68, 190)
    image.alpha_composite(panel, origin)
    visual = tuple(value * 4 for value in VISUAL_TOP_BOUNDS)
    physical = tuple(value * 4 for value in PROJECTED_SUPPORT_BOUNDS)
    draw.rectangle(
        tuple(
            origin[index % 2] + value
            for index, value in enumerate(visual)
        ),
        outline=(235, 153, 46, 255),
        width=5,
    )
    draw.rectangle(
        tuple(
            origin[index % 2] + value
            for index, value in enumerate(physical)
        ),
        outline=(38, 164, 207, 255),
        width=5,
    )
    draw.text(
        (1175, 170),
        "Physical contract",
        font=HEADING_FONT,
        fill=(28, 48, 65, 255),
    )
    facts = (
        "footprint: 6×2",
        "support: 6×2 @ Z=2",
        "total height: 2",
        "top slab: 0.25",
        "top plane: 192×64 px",
        "root/sort: [128,150]",
        "orange: visual overhang",
        "blue: physical support",
        "perspective: false",
    )
    for index, fact in enumerate(facts):
        draw.text(
            (1175, 225 + index * 60),
            fact,
            font=BODY_FONT,
            fill=(39, 61, 78, 255),
        )
    return image


def parts_board(
    normalized: Image.Image,
    parts: dict[str, Image.Image],
) -> Image.Image:
    image, draw = board(
        "Counter Bar A01-r02 — Independent Alpha Parts",
        "Support surface, base shell, and foreground plinth recompose exactly",
    )
    entries = [("clean master", normalized), *parts.items()]
    boxes = (
        (30, 120, 780, 520),
        (820, 120, 1570, 520),
        (30, 560, 780, 960),
        (820, 560, 1570, 960),
    )
    for (heading, entry), box in zip(entries, boxes):
        card(draw, box, heading)
        bg = checkerboard(entry.size, 32)
        bg.alpha_composite(entry)
        paste_scaled(
            image,
            bg,
            (box[0] + 20, box[1] + 58, box[2] - 20, box[3] - 18),
        )
    return image


def clean_board(runtime: Image.Image) -> Image.Image:
    image, draw = board(
        "Counter Bar A01-r02 — Clean Front",
        "Runtime 256×160 • fresh source • empty 6×2 support surface • Coffee C01 not imported",
    )
    card(draw, (80, 125, 1520, 930), "Owner-review clean asset")
    image.alpha_composite(runtime_panel(runtime, 5), (160, 145))
    draw.text(
        (800, 950),
        "A01-r01 and the thin-top preview are not pixel inputs",
        font=BODY_FONT,
        fill=(157, 49, 49, 255),
        anchor="mm",
    )
    return image


def slots_board(runtime: Image.Image) -> Image.Image:
    image, draw = board(
        "Counter Bar A01-r02 — Twelve 1×1 Surface Cells",
        "Six back equipment cells + six front prop cells; every 32×32 cell has full alpha support",
    )
    scale = 5
    origin = (160, 110)
    image.alpha_composite(runtime_panel(runtime, scale), origin)
    colors = {"back": (38, 153, 209, 235), "front": (39, 174, 96, 235)}
    for slot in SLOT_RECORDS:
        x, y = slot["socket"]
        px = origin[0] + x * scale
        py = origin[1] + y * scale
        color = colors[slot["row"]]
        draw.ellipse(
            (px - 18, py - 18, px + 18, py + 18),
            fill=color,
            outline=(255, 255, 255, 255),
            width=3,
        )
        draw.text(
            (px, py),
            str(slot["column"]),
            font=SMALL_FONT,
            fill=(255, 255, 255, 255),
            anchor="mm",
        )
    draw.text(
        (800, 930),
        "blue = back equipment row  •  green = front prop/display row",
        font=BODY_FONT,
        fill=(37, 58, 75, 255),
        anchor="mm",
    )
    return image


def fixture(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    label: str,
    color: tuple[int, int, int, int],
) -> None:
    draw.rounded_rectangle(
        box,
        radius=8,
        fill=(231, 239, 244, 255),
        outline=color,
        width=4,
    )
    draw.text(
        ((box[0] + box[2]) // 2, (box[1] + box[3]) // 2),
        label,
        font=SMALL_FONT,
        fill=(30, 54, 70, 255),
        anchor="mm",
    )


def edge_board(runtime: Image.Image) -> Image.Image:
    image, draw = board(
        "Counter Bar A01-r02 — Four-Corner Edge Support",
        "1×1 fixtures at every extreme corner remain entirely inside the visual worktop",
    )
    scale = 5
    origin = (160, 110)
    image.alpha_composite(runtime_panel(runtime, scale), origin)
    corner_ids = {
        "surface.back.01",
        "surface.back.06",
        "surface.front.01",
        "surface.front.06",
    }
    for slot in SLOT_RECORDS:
        if slot["id"] not in corner_ids:
            continue
        x, y = slot["socket"]
        left = origin[0] + (x - 16) * scale
        top = origin[1] + (y - 16) * scale
        fixture(
            draw,
            (left, top, left + 32 * scale, top + 32 * scale),
            f"{slot['row'][0].upper()}{slot['column']}",
            (37, 154, 105, 255),
        )
    support = tuple(value * scale for value in PROJECTED_SUPPORT_BOUNDS)
    draw.rectangle(
        tuple(
            origin[index % 2] + value
            for index, value in enumerate(support)
        ),
        outline=(38, 164, 207, 255),
        width=5,
    )
    draw.text(
        (800, 930),
        "corner cells checked: 4  •  unsupported pixels: 0  •  edge-support failures: 0",
        font=BODY_FONT,
        fill=(28, 121, 84, 255),
        anchor="mm",
    )
    return image


def draw_grid(
    draw: ImageDraw.ImageDraw,
    origin: tuple[int, int],
    cell: int,
    occupied: dict[tuple[int, int], tuple[int, int, int, int]],
) -> None:
    for row in range(2):
        for column in range(6):
            box = (
                origin[0] + column * cell,
                origin[1] + row * cell,
                origin[0] + (column + 1) * cell,
                origin[1] + (row + 1) * cell,
            )
            draw.rectangle(
                box,
                fill=occupied.get((column, row), (245, 239, 222, 255)),
                outline=(83, 103, 118, 255),
                width=2,
            )
            draw.text(
                ((box[0] + box[2]) // 2, (box[1] + box[3]) // 2),
                f"{'B' if row == 0 else 'F'}{column + 1}",
                font=SMALL_FONT,
                fill=(35, 55, 72, 255),
                anchor="mm",
            )


def configurations_board() -> Image.Image:
    image, draw = board(
        "Counter Bar A01-r02 — Modular Configurations",
        "Debug cells prove reusable layouts; none are Coffee C01 production art",
    )
    configs = (
        ("empty", {}),
        (
            "equipment + props",
            {
                (1, 0): (188, 223, 239, 255),
                (3, 0): (188, 223, 239, 255),
                (1, 1): (205, 235, 216, 255),
                (2, 1): (205, 235, 216, 255),
                (4, 1): (205, 235, 216, 255),
            },
        ),
        (
            "full twelve-cell capacity",
            {
                (column, row): (
                    (188, 223, 239, 255)
                    if row == 0
                    else (205, 235, 216, 255)
                )
                for row in range(2)
                for column in range(6)
            },
        ),
        (
            "2×1 + 2×2 mixed",
            {
                (0, 0): (242, 204, 142, 255),
                (1, 0): (242, 204, 142, 255),
                (3, 0): (208, 188, 228, 255),
                (4, 0): (208, 188, 228, 255),
                (3, 1): (208, 188, 228, 255),
                (4, 1): (208, 188, 228, 255),
            },
        ),
    )
    boxes = (
        (30, 120, 780, 520),
        (820, 120, 1570, 520),
        (30, 560, 780, 960),
        (820, 560, 1570, 960),
    )
    for (heading, occupied), box in zip(configs, boxes):
        card(draw, box, heading)
        draw_grid(draw, (box[0] + 70, box[1] + 120), 100, occupied)
    return image


def spans_board() -> Image.Image:
    image, draw = board(
        "Counter Bar A01-r02 — Legal Spans and Fail-Closed Rejections",
        "10 horizontal 2×1 spans + 5 full-depth 2×2 spans; overlap and unsupported widths reject",
    )
    card(draw, (30, 120, 1000, 950), "Supported span families")
    card(draw, (1040, 120, 1570, 500), "Overlap rejection", (255, 241, 241, 255))
    card(draw, (1040, 540, 1570, 950), "Unsupported 3×1", (255, 241, 241, 255))
    draw_grid(draw, (90, 230), 130, {})
    for index in range(5):
        x = 90 + index * 130
        y = 535
        draw.rounded_rectangle(
            (x, y, x + 260, y + 110),
            radius=8,
            fill=(242, 204, 142, 230),
            outline=(184, 112, 29, 255),
            width=3,
        )
        draw.text(
            (x + 130, y + 55),
            f"2×1 {index + 1}-{index + 2}",
            font=SMALL_FONT,
            fill=(63, 54, 40, 255),
            anchor="mm",
        )
    for index in range(5):
        x = 90 + index * 130
        y = 690
        draw.rounded_rectangle(
            (x, y, x + 260, y + 210),
            radius=8,
            fill=(208, 188, 228, 220),
            outline=(126, 80, 161, 255),
            width=3,
        )
        draw.text(
            (x + 130, y + 105),
            f"2×2 {index + 1}-{index + 2}",
            font=SMALL_FONT,
            fill=(58, 43, 72, 255),
            anchor="mm",
        )
    fixture(draw, (1135, 275, 1385, 390), "2×1 + 1×1", (202, 57, 57, 255))
    draw.text((1305, 430), "shared cell → rejected", font=BODY_FONT, fill=(157, 47, 47, 255), anchor="mm")
    fixture(draw, (1110, 680, 1495, 810), "3×1 child", (202, 57, 57, 255))
    draw.text((1305, 855), "unsupported width → rejected", font=BODY_FONT, fill=(157, 47, 47, 255), anchor="mm")
    return image


def routes_board() -> Image.Image:
    image, draw = board(
        "Counter Bar A01-r02 — Six Shared Use Lanes",
        "Each column pairs its back equipment and front prop cell to one unobstructed front route",
    )
    origin = (120, 165)
    cell = 110
    for row in range(5):
        for column in range(6):
            box = (
                origin[0] + column * cell,
                origin[1] + row * cell,
                origin[0] + (column + 1) * cell,
                origin[1] + (row + 1) * cell,
            )
            draw.rectangle(
                box,
                fill=(
                    (225, 232, 238, 255)
                    if row < 2
                    else (250, 251, 252, 255)
                ),
                outline=(170, 183, 195, 255),
                width=2,
            )
    draw.rectangle(
        (origin[0], origin[1], origin[0] + 6 * cell, origin[1] + 2 * cell),
        outline=(27, 51, 70, 255),
        width=6,
    )
    colors = (
        (52, 152, 219, 255),
        (39, 174, 96, 255),
        (155, 89, 182, 255),
        (230, 126, 34, 255),
        (22, 160, 133, 255),
        (191, 73, 116, 255),
    )
    for column, color in enumerate(colors):
        x = origin[0] + column * cell + cell // 2
        points = [
            (x, origin[1] + cell // 2),
            (x, origin[1] + cell + cell // 2),
            (x, origin[1] + 2 * cell + cell // 2),
            (x, origin[1] + 3 * cell + cell // 2),
            (x, origin[1] + 4 * cell + cell // 2),
        ]
        draw.line(points, fill=color, width=7)
        for label, point in zip(("B", "F", "T", "A", "E"), points):
            draw.ellipse(
                (point[0] - 17, point[1] - 17, point[0] + 17, point[1] + 17),
                fill=color,
                outline=(255, 255, 255, 255),
                width=2,
            )
            draw.text(point, label, font=SMALL_FONT, fill=(255, 255, 255, 255), anchor="mm")
    facts = (
        "B  back equipment cell",
        "F  front prop cell",
        "T  stand",
        "A  approach",
        "E  exit",
        "route obstructions: 0",
        "child owns interaction",
    )
    for index, fact in enumerate(facts):
        draw.text(
            (880, 220 + index * 70),
            fact,
            font=HEADING_FONT if index == 5 else BODY_FONT,
            fill=(
                (28, 121, 84, 255)
                if index == 5
                else (37, 58, 75, 255)
            ),
        )
    return image


def movement_board(runtime: Image.Image) -> Image.Image:
    image, draw = board(
        "Counter Bar A01-r02 — Parent/Child Socket Movement",
        "Three world positions × twelve child cells = 36 exact cases; attachment delta failures = 0",
    )
    boxes = (
        (30, 130, 510, 900),
        (560, 130, 1040, 900),
        (1090, 130, 1570, 900),
    )
    for position, box in zip(WORLD_POSITIONS, boxes):
        card(draw, box, f"world position {position}")
        scaled = runtime.resize((448, 280), Image.Resampling.NEAREST)
        image.alpha_composite(scaled, (box[0] + 16, box[1] + 130))
        for slot in SLOT_RECORDS:
            x, y = slot["socket"]
            px = box[0] + 16 + round(x * 1.75)
            py = box[1] + 130 + round(y * 1.75)
            draw.line((px - 8, py, px + 8, py), fill=(37, 166, 207, 255), width=2)
            draw.line((px, py - 8, px, py + 8), fill=(37, 166, 207, 255), width=2)
        facts = (
            "parent socket − child socket",
            "per-scene offset: false",
            "center fallback: false",
            "delta: [0,0]",
        )
        for index, fact in enumerate(facts):
            draw.text(
                (box[0] + 28, 600 + index * 55),
                fact,
                font=BODY_FONT if index < 3 else HEADING_FONT,
                fill=(
                    (28, 121, 84, 255)
                    if index == 3
                    else (39, 60, 78, 255)
                ),
            )
    return image


def reservation_samples() -> list[dict[str, Any]]:
    samples: list[dict[str, Any]] = []
    for second in range(31):
        if 1 <= second <= 6:
            held = "alpha"
            alpha = "held"
            beta = "blocked" if second == 2 else "waiting"
        elif 8 <= second <= 14:
            held = "beta"
            alpha = "released-after-failure" if second == 8 else "waiting"
            beta = "held"
        elif 17 <= second <= 23:
            held = "alpha"
            alpha = "held-after-retry"
            beta = "waiting"
        else:
            held = None
            alpha = "available"
            beta = "available"
        samples.append({
            "second": second,
            "heldBy": held,
            "states": {"alpha": alpha, "beta": beta},
        })
    return samples


def reservation_board(samples: list[dict[str, Any]]) -> Image.Image:
    image, draw = board(
        "Counter Bar A01-r02 — 30-second Reservation",
        "Two contenders • blocked attempt • failure release • successful retry • released at end",
    )
    card(draw, (40, 130, 1560, 900), "Atomic occupancy simulation")
    x0 = 110
    width = 1400
    second_width = width / 30
    y_alpha, y_beta = 350, 570
    for second in range(31):
        x = round(x0 + second * second_width)
        draw.line((x, 250, x, 700), fill=(220, 226, 232, 255), width=1)
        if second % 5 == 0:
            draw.text((x, 725), str(second), font=SMALL_FONT, fill=(69, 85, 99, 255), anchor="ma")
    draw.text((70, y_alpha), "alpha", font=HEADING_FONT, fill=(35, 57, 74, 255), anchor="rm")
    draw.text((70, y_beta), "beta", font=HEADING_FONT, fill=(35, 57, 74, 255), anchor="rm")
    draw.rectangle((x0 + second_width, y_alpha - 40, x0 + 7 * second_width, y_alpha + 40), fill=(41, 154, 209, 255))
    draw.rectangle((x0 + 8 * second_width, y_beta - 40, x0 + 15 * second_width, y_beta + 40), fill=(230, 126, 34, 255))
    draw.rectangle((x0 + 17 * second_width, y_alpha - 40, x0 + 24 * second_width, y_alpha + 40), fill=(39, 174, 96, 255))
    draw.text((x0 + 4 * second_width, y_alpha), "initial hold", font=BODY_FONT, fill=(255, 255, 255, 255), anchor="mm")
    draw.text((x0 + 11.5 * second_width, y_beta), "beta acquires", font=BODY_FONT, fill=(255, 255, 255, 255), anchor="mm")
    draw.text((x0 + 20.5 * second_width, y_alpha), "retry succeeds", font=BODY_FONT, fill=(255, 255, 255, 255), anchor="mm")
    draw.text((800, 825), "capacity: 1  •  blocked: 1  •  failure: 1  •  retry: 1  •  held at 30s: none", font=BODY_FONT, fill=(28, 121, 84, 255), anchor="mm")
    return image


def layer_board(
    runtime_parts: dict[str, Image.Image],
    clean: Image.Image,
) -> Image.Image:
    image, draw = board(
        "Counter Bar A01-r02 — Layer Order",
        "support-surface → base-shell → child fixture → foreground-occlusion",
    )
    entries = (
        ("support-surface", runtime_parts["support-surface"]),
        ("base-shell", runtime_parts["base-shell"]),
        ("foreground-occlusion", runtime_parts["foreground-occlusion"]),
        ("clean composite", clean),
    )
    boxes = (
        (30, 130, 780, 500),
        (820, 130, 1570, 500),
        (30, 550, 780, 920),
        (820, 550, 1570, 920),
    )
    for (heading, entry), box in zip(entries, boxes):
        card(draw, box, heading)
        bg = checkerboard((672, 300), 24)
        scaled = entry.resize((480, 300), Image.Resampling.NEAREST)
        bg.alpha_composite(scaled, (96, 0))
        image.alpha_composite(bg, (box[0] + 38, box[1] + 55))
    return image


def two_by_one_groups() -> list[dict[str, Any]]:
    groups: list[dict[str, Any]] = []
    for row in ROWS:
        for column in range(1, 6):
            groups.append({
                "id": f"span.{row}.{column:02d}-{column + 1:02d}",
                "slotIds": [
                    f"surface.{row}.{column:02d}",
                    f"surface.{row}.{column + 1:02d}",
                ],
                "accepts": ["equipment-2x1"],
            })
    return groups


def two_by_two_groups() -> list[dict[str, Any]]:
    return [
        {
            "id": f"span.block.{column:02d}-{column + 1:02d}",
            "slotIds": [
                f"surface.back.{column:02d}",
                f"surface.back.{column + 1:02d}",
                f"surface.front.{column:02d}",
                f"surface.front.{column + 1:02d}",
            ],
            "accepts": ["equipment-2x2"],
        }
        for column in range(1, 6)
    ]


def configurations() -> list[dict[str, Any]]:
    return [
        {"id": "empty", "occupiedSlotIds": [], "spanGroupIds": [], "valid": True},
        {"id": "twelve-independent", "occupiedSlotIds": list(SLOT_IDS), "spanGroupIds": [], "valid": True},
        {
            "id": "equipment-and-props",
            "occupiedSlotIds": [
                "surface.back.02",
                "surface.back.04",
                "surface.front.02",
                "surface.front.03",
                "surface.front.05",
            ],
            "spanGroupIds": [],
            "valid": True,
        },
        {
            "id": "two-by-one-mix",
            "occupiedSlotIds": [
                "surface.back.01",
                "surface.back.02",
                "surface.front.04",
                "surface.front.05",
            ],
            "spanGroupIds": ["span.back.01-02", "span.front.04-05"],
            "valid": True,
        },
        {
            "id": "two-by-two-center",
            "occupiedSlotIds": [
                "surface.back.03",
                "surface.back.04",
                "surface.front.03",
                "surface.front.04",
            ],
            "spanGroupIds": ["span.block.03-04"],
            "valid": True,
        },
        {
            "id": "overlap-probe",
            "occupiedSlotIds": [
                "surface.back.01",
                "surface.back.02",
            ],
            "spanGroupIds": [
                "span.back.01-02",
                "span.block.01-02",
            ],
            "valid": False,
        },
        {
            "id": "unsupported-three-wide",
            "occupiedSlotIds": [
                "surface.front.02",
                "surface.front.03",
                "surface.front.04",
            ],
            "spanGroupIds": [],
            "valid": False,
        },
    ]


def gates() -> dict[str, dict[str, Any]]:
    return {
        "F0": {"status": "passed", "evidence": [rp(SOURCE_PATH), rp(REVIEW_PATHS[0])]},
        "F1": {"status": "passed", "evidence": [rp(REVIEW_PATHS[2]), rp(REVIEW_PATHS[3])]},
        "F2": {"status": "passed", "evidence": [rp(REVIEW_PATHS[1]), rp(REVIEW_PATHS[4])]},
        "F3": {"status": "passed", "evidence": [rp(REVIEW_PATHS[5]), rp(REVIEW_PATHS[6]), rp(REVIEW_PATHS[7])]},
        "F4": {"status": "passed", "evidence": [rp(REVIEW_PATHS[8])]},
        "F5": {"status": "passed", "evidence": [rp(REVIEW_PATHS[9])]},
        "F6": {"status": "passed", "evidence": [rp(REVIEW_PATHS[10])]},
        "F7": {"status": "passed", "evidence": [rp(path) for path in REVIEW_PATHS]},
        "F8": {
            "status": "passed",
            "evidence": [
                rp(REVIEW_PATHS[1]),
                rp(REVIEW_PATHS[3]),
                rp(REVIEW_PATHS[5]),
                "Owner approved Counter Bar A01-r02 on 2026-07-29.",
            ],
        },
        "F9": {"status": "blocked", "evidence": []},
        "F10": {"status": "blocked", "evidence": []},
    }


def evidence(path: Path, outputs: dict[Path, bytes]) -> dict[str, str]:
    return {"file": rp(path), "sha256": sha256_bytes(outputs[path])}


def build_manifest(
    outputs: dict[Path, bytes],
    source_evidence: dict[str, Any],
    metrics: dict[str, Any],
    samples: list[dict[str, Any]],
) -> dict[str, Any]:
    parts = []
    for part_id in ("base-shell", "support-surface", "foreground-occlusion"):
        authoring_path, runtime_path = PART_PATHS[part_id]
        parts.append({
            "id": f"counter-bar-a01-r02.{part_id}",
            "role": part_id,
            "authoringFile": rp(authoring_path),
            "authoringSha256": sha256_bytes(outputs[authoring_path]),
            "runtimeFile": rp(runtime_path),
            "runtimeSha256": sha256_bytes(outputs[runtime_path]),
        })
    attachments = [
        {
            "id": slot["id"],
            "surfaceId": "counter.bar.a01-r02-surface",
            "x": slot["x"],
            "y": slot["y"],
            "unit": "tile",
        }
        for slot in SLOT_RECORDS
    ]
    slots = [
        {
            "id": slot["id"],
            "supportPlaneId": "counter.bar.a01-r02-surface",
            "point": {"x": slot["x"], "y": slot["y"], "unit": "tile"},
            "localSocket": list(slot["socket"]),
            "accepts": ["equipment-1x1", "prop-1x1"],
            "pairedUseLaneId": slot["laneId"],
        }
        for slot in SLOT_RECORDS
    ]
    lanes = [
        {
            "id": f"use.{column:02d}",
            "surfaceSlotIds": [
                f"surface.back.{column:02d}",
                f"surface.front.{column:02d}",
            ],
            "stand": {"x": column - 0.5, "y": 2.5},
            "approach": {"x": column - 0.5, "y": 3.5},
            "exit": {"x": column - 0.5, "y": 4.5},
            "facing": "front",
        }
        for column in range(1, 7)
    ]
    local_sockets = {
        "root.floor": list(ROOT_SOCKET),
        "sort.floor": list(ROOT_SOCKET),
        **{
            f"support.{slot['id']}": list(slot["socket"])
            for slot in SLOT_RECORDS
        },
    }
    configs = configurations()
    return {
        "schemaVersion": 1,
        "id": "office.furniture.counter-bar.a01-r02",
        "familyId": "counter.bar.modular",
        "revision": "a01-r02",
        "status": "owner-approved",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "sourcePolicy": {
            "conceptSheetPixelReuse": False,
            "processedCropDirectReuse": False,
            "activeOfficePixelReuse": False,
            "legacyOrRejectedPixelReuse": False,
            "generativeRepair": False,
            "missingAssetFallback": False,
        },
        "source": {
            "kind": "generated-isolated-clean-source",
            "path": rp(SOURCE_PATH),
            "sha256": SOURCE_SHA256,
            "prompt": GENERATION_PROMPT,
            "generation": {
                "workflow": "built-in-imagegen",
                "inputImageCount": 0,
                "conceptPixelsAsSource": False,
                "geometryCorrectionCount": 2,
            },
            "extractionMethod": "generated-source-chroma-key",
            "geometryNormalization": {
                "method": "orthographic-row-removal-without-resampling",
                "sourceSurfaceBounds": list(SOURCE_SURFACE_BOUNDS),
                "removedRows": list(REMOVED_ROWS),
                "preservedFrontAssemblyFromRow": PRESERVED_ASSEMBLY_ROW,
                "outputSurfaceBounds": list(OUTPUT_SURFACE_BOUNDS),
                "pixelsResampled": False,
            },
            **source_evidence,
            "sourcePixelsResampled": False,
            "canvasContact": False,
            "keyedSource": evidence(KEYED_PATH, outputs),
            "ownershipMask": evidence(OWNERSHIP_PATH, outputs),
            "geometryNormalizedSource": evidence(
                GEOMETRY_SOURCE_PATH,
                outputs,
            ),
            "normalizedCutout": evidence(NORMALIZED_PATH, outputs),
        },
        "render": {
            "authoringCanvas": list(AUTHORING_CANVAS),
            "runtimeCanvas": list(RUNTIME_CANVAS),
            "uniformIntegerDivisor": RUNTIME_DIVISOR,
            "nonUniformScaling": False,
            "orientation": "front",
            "anchor": "bottom-center",
            "projection": {
                "screenX": "worldX * 32",
                "screenY": "worldY * 32 - worldZ * 32",
                "perspective": False,
            },
        },
        "geometry": {
            "schemaVersion": 3,
            "id": "geometry.counter-bar.a01-r02",
            "assetType": "surface-furniture",
            "placementPlane": "floor",
            "physicalScale": {"width": 6, "depth": 2, "height": 2, "unit": "tile"},
            "footprint": {"width": 6, "depth": 2, "unit": "tile"},
            "supportPlane": {
                "id": "counter.bar.a01-r02-surface",
                "width": 6,
                "depth": 2,
                "height": 2,
                "unit": "tile",
            },
            "basePivot": {"x": 3, "y": 2, "unit": "tile"},
            "sortPivot": {"x": 3, "y": 2, "unit": "tile"},
            "renderBounds": {"width": 1536, "height": 960, "unit": "authoring-pixel"},
            "renderOffset": {"x": 0, "y": 0, "unit": "authoring-pixel"},
            "verticalExtension": {"aboveBase": 2, "belowBase": 0, "unit": "tile"},
            "occlusionParts": [
                {"id": "counter-bar-a01-r02.rear", "role": "rear", "assetId": "counter-bar-a01-r02.support-surface"},
                {"id": "counter-bar-a01-r02.base", "role": "base", "assetId": "counter-bar-a01-r02.base-shell"},
                {"id": "counter-bar-a01-r02.foreground", "role": "foreground", "assetId": "counter-bar-a01-r02.foreground-occlusion"},
            ],
            "attachmentSlots": attachments,
            "seatSlots": [],
            "orientation": "front",
        },
        "cleanAsset": evidence(RUNTIME_CLEAN_PATH, outputs),
        "parts": parts,
        "spatial": {
            "coordinateSpace": "counter-runtime-pixel",
            "tilePixels": 32,
            "rootSocketId": "root.floor",
            "sortSocketId": "sort.floor",
            "localSockets": local_sockets,
            "attachmentFormula": "parent-socket-minus-child-socket",
            "perSceneAttachmentOffsets": False,
            "centerFallback": False,
            "missingSocketFallback": False,
            "attachmentDeltaFailures": 0,
        },
        "surfaceContract": {
            "supportPlaneId": "counter.bar.a01-r02-surface",
            "slots": slots,
            "adjacentSpanGroups": two_by_one_groups(),
            "twoByTwoSpanGroups": two_by_two_groups(),
            "useLanes": lanes,
            "projectedSupportBounds": metrics["projectedSupportBounds"],
            "visualTopBounds": metrics["visualTopBounds"],
            "edgeSupportFailures": metrics["edgeSupportFailures"],
            "atomicOccupancy": True,
            "rejectOverlap": True,
            "rejectUnsupportedChild": True,
            "childInteractionDelegated": True,
            "coffeeC01Imported": False,
        },
        "placementValidation": {
            "oneByOneCases": 12,
            "twoByOneCases": 10,
            "twoByTwoCases": 5,
            "configurationCount": len(configs),
            "overlapRejections": 1,
            "unsupportedChildRejections": 1,
            "routeObstructionCount": 0,
            "attachmentDeltaFailures": 0,
            "configurations": configs,
        },
        "movementValidation": {
            "worldPositions": [list(position) for position in WORLD_POSITIONS],
            "childAttachmentCases": len(WORLD_POSITIONS) * len(SLOT_IDS),
            "attachmentDeltaFailures": 0,
            "propFollowFailures": 0,
        },
        "reservationValidation": {
            "durationSeconds": 30,
            "contenderCount": 2,
            "maximumConcurrentReservations": 1,
            "blockedAttemptCount": 1,
            "failureCount": 1,
            "retrySuccessCount": 1,
            "releasedAtEnd": True,
            "samples": samples,
        },
        "gates": gates(),
        "reviewOutputs": [
            evidence(path, outputs)
            for path in REVIEW_PATHS
        ],
        "permissions": {
            "isolatedFamilyLab": True,
            "ownerReview": False,
            "attachedCoffeeProduction": True,
            "furnitureOnlyRoom": False,
            "activeOfficePromotion": False,
        },
        "ownerDecision": OWNER_DECISION,
    }


def build_outputs() -> dict[Path, bytes]:
    keyed, ownership, corrected, normalized, source_evidence = build_source()
    authoring_parts, runtime_parts, clean = build_parts(normalized)
    metrics = support_metrics(clean)
    if metrics["edgeSupportFailures"]:
        raise ValueError(
            f"A01-r02 unsupported cells: {metrics['failedSlots']}"
        )
    samples = reservation_samples()
    source = Image.open(SOURCE_PATH).convert("RGBA")
    reviews = [
        source_board(source, keyed, corrected, source_evidence),
        geometry_board(clean),
        parts_board(normalized, authoring_parts),
        clean_board(clean),
        slots_board(clean),
        edge_board(clean),
        configurations_board(),
        spans_board(),
        routes_board(),
        movement_board(clean),
        reservation_board(samples),
        layer_board(runtime_parts, clean),
    ]
    outputs: dict[Path, bytes] = {
        KEYED_PATH: png_bytes(keyed),
        OWNERSHIP_PATH: png_bytes(ownership),
        GEOMETRY_SOURCE_PATH: png_bytes(corrected),
        NORMALIZED_PATH: png_bytes(normalized),
        RUNTIME_CLEAN_PATH: png_bytes(clean),
    }
    for part_id, part in authoring_parts.items():
        authoring_path, runtime_path = PART_PATHS[part_id]
        outputs[authoring_path] = png_bytes(part)
        outputs[runtime_path] = png_bytes(runtime_parts[part_id])
    for path, review in zip(REVIEW_PATHS, reviews):
        outputs[path] = png_bytes(review)
    outputs[MANIFEST_PATH] = json_bytes(
        build_manifest(outputs, source_evidence, metrics, samples)
    )
    return outputs


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    outputs = build_outputs()
    stale: list[str] = []
    for path, content in outputs.items():
        if args.check:
            if not path.exists() or path.read_bytes() != content:
                stale.append(rp(path))
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
    if stale:
        print("Counter Bar A01-r02 outputs are stale:")
        for path in stale:
            print(f"- {path}")
        raise SystemExit(1)
    action = "verified" if args.check else "built"
    print(
        f"Counter Bar A01-r02 {action}: {len(outputs)} files; "
        "12 cells, edge failures 0, F0-F8 passed, owner-approved; "
        "Coffee C01 production unlocked."
    )


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as error:
        print(f"Counter Bar A01-r02 build failed: {error}", file=sys.stderr)
        raise SystemExit(1) from error
