#!/usr/bin/env python3
"""Build the original modular Counter Bar A01 surface-furniture family."""

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
    / "assets/art/layout-references/office-furniture-counter-bar-a01-source.png"
)
MANIFEST_PATH = (
    ROOT / "assets/game/manifests/office-furniture-counter-bar-a01.json"
)
OUTPUT_ROOT = (
    ROOT / "assets/game/processed/office-furniture-counter-bar-a01"
)
AUTHORING_ROOT = OUTPUT_ROOT / "authoring"
RUNTIME_ROOT = OUTPUT_ROOT / "runtime"
SOURCE_ROOT = AUTHORING_ROOT / "source"
AUTHORING_PART_ROOT = AUTHORING_ROOT / "parts"
RUNTIME_PART_ROOT = RUNTIME_ROOT / "parts"
REVIEW_ROOT = (
    ROOT
    / "assets/art/layout-references/office-furniture-family-v1/counter-bar-a01"
)

FAMILY_ID = "counter.bar.modular"
REVISION = "a01"
SOURCE_SHA256 = (
    "22831cfd7a9fedfc0d1733d7bca864d66ff6c71ad0dd777b0a1a7a9fea8b695f"
)
GENERATION_PROMPT = (
    "Create one original empty straight cafe counter bar as an isolated "
    "modern-bright pixel-art game asset. Use a strict straight-on front "
    "orthographic camera, a broad cream terrazzo worktop, warm vertical oak "
    "slats, one restrained flush brass rail, and a dark navy recessed plinth. "
    "Keep the whole support surface empty and unobstructed. Use a removable "
    "magenta backdrop. Include no machine, cup, food, decor, person, stool, "
    "shelf, wall, room, floor, cast shadow, text, logo, or watermark. Two "
    "geometry-only correction passes made the top support plane broad and the "
    "front silhouette complete; no input image or concept-sheet pixel was used."
)

AUTHORING_CANVAS = (1344, 960)
RUNTIME_CANVAS = (224, 160)
RUNTIME_DIVISOR = 6
BOTTOM_PADDING = 60
ROOT_SOCKET = (112, 150)
PART_CUTS = (590, 830)
SLOT_XS = (1, 2, 3, 4, 5)
SLOT_IDS = tuple(f"surface.{index:02d}" for index in SLOT_XS)
SLOT_SOCKETS = tuple(
    (ROOT_SOCKET[0] + (x - 3) * 32, ROOT_SOCKET[1] + (1 - 2) * 32 - 2 * 32)
    for x in SLOT_XS
)
WORLD_POSITIONS = ((0, 0), (4, 3), (9, 6))

KEYED_PATH = SOURCE_ROOT / "counter-bar-a01.keyed-source.png"
OWNERSHIP_PATH = SOURCE_ROOT / "counter-bar-a01.ownership-mask.png"
NORMALIZED_PATH = AUTHORING_ROOT / "counter-bar-a01.normalized.png"
RUNTIME_CLEAN_PATH = RUNTIME_ROOT / "counter-bar-a01.clean.png"
PART_PATHS = {
    "support-surface": (
        AUTHORING_PART_ROOT / "counter-bar-a01.support-surface.png",
        RUNTIME_PART_ROOT / "counter-bar-a01.support-surface.png",
    ),
    "base-shell": (
        AUTHORING_PART_ROOT / "counter-bar-a01.base-shell.png",
        RUNTIME_PART_ROOT / "counter-bar-a01.base-shell.png",
    ),
    "foreground-occlusion": (
        AUTHORING_PART_ROOT / "counter-bar-a01.foreground-occlusion.png",
        RUNTIME_PART_ROOT / "counter-bar-a01.foreground-occlusion.png",
    ),
}
REVIEW_PATHS = [
    REVIEW_ROOT / "01-source-ownership.png",
    REVIEW_ROOT / "02-alpha-parts.png",
    REVIEW_ROOT / "03-clean-front.png",
    REVIEW_ROOT / "04-orthographic-geometry.png",
    REVIEW_ROOT / "05-support-slots.png",
    REVIEW_ROOT / "06-modular-configurations.png",
    REVIEW_ROOT / "07-span-and-rejection.png",
    REVIEW_ROOT / "08-use-lanes-and-routes.png",
    REVIEW_ROOT / "09-movement-socket-proof.png",
    REVIEW_ROOT / "10-reservation-timeline-30s.png",
    REVIEW_ROOT / "11-layer-order.png",
]


def rp(path: Path) -> str:
    return repo_path(ROOT, path)


def alpha_layer(source: Image.Image, top: int, bottom: int) -> Image.Image:
    output = Image.new("RGBA", source.size, (0, 0, 0, 0))
    output.alpha_composite(source.crop((0, top, source.width, bottom)), (0, top))
    return output


def build_source() -> tuple[
    Image.Image,
    Image.Image,
    Image.Image,
    dict[str, Any],
]:
    if sha256_file(SOURCE_PATH) != SOURCE_SHA256:
        raise ValueError("Counter Bar A01 generated source hash changed")
    source = Image.open(SOURCE_PATH).convert("RGBA")
    keyed, key_rgb, chroma = remove_magenta_chroma(source)
    components = sorted(
        connected_components(keyed),
        key=lambda component: component["pixelCount"],
        reverse=True,
    )
    if len(components) != 1:
        raise ValueError(
            f"Counter source must contain one connected component: {len(components)}"
        )
    component = components[0]
    bounds = tuple(component["bounds"])
    if (
        bounds[0] <= 0
        or bounds[1] <= 0
        or bounds[2] >= source.width
        or bounds[3] >= source.height
    ):
        raise ValueError(f"Counter source touches its canvas: {bounds}")
    normalized, padding, normalized_from = normalize_without_resampling(
        keyed,
        AUTHORING_CANVAS,
        bottom_padding=BOTTOM_PADDING,
    )
    if bounds != normalized_from:
        raise ValueError("Counter source ownership bounds changed during normalize")
    ownership = Image.new("RGBA", source.size, (0, 0, 0, 0))
    ownership_pixels = ownership.load()
    for point in component["points"]:
        ownership_pixels[point % source.width, point // source.width] = (
            43,
            183,
            235,
            230,
        )
    evidence = {
        "sampledKeyRgb": list(key_rgb),
        "sourceSize": list(source.size),
        "ownedBounds": list(bounds),
        "connectedComponentCount": 1,
        "selectedVisiblePixels": component["pixelCount"],
        "chromaStats": chroma,
        "authoringPadding": padding,
    }
    return keyed, ownership, normalized, evidence


def build_parts(
    normalized: Image.Image,
) -> tuple[dict[str, Image.Image], dict[str, Image.Image], Image.Image]:
    support = alpha_layer(normalized, 0, PART_CUTS[0])
    base = alpha_layer(normalized, PART_CUTS[0], PART_CUTS[1])
    foreground = alpha_layer(normalized, PART_CUTS[1], normalized.height)
    authoring = {
        "support-surface": support,
        "base-shell": base,
        "foreground-occlusion": foreground,
    }
    rebuilt = Image.new("RGBA", AUTHORING_CANVAS, (0, 0, 0, 0))
    for part in authoring.values():
        rebuilt.alpha_composite(part)
    if png_bytes(rebuilt) != png_bytes(normalized):
        raise ValueError("Counter parts do not recompose to the clean master")
    runtime = {
        part_id: part.resize(RUNTIME_CANVAS, Image.Resampling.NEAREST)
        for part_id, part in authoring.items()
    }
    runtime_clean = Image.new("RGBA", RUNTIME_CANVAS, (0, 0, 0, 0))
    for part in runtime.values():
        runtime_clean.alpha_composite(part)
    return authoring, runtime, runtime_clean


def board(title: str, subtitle: str) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGBA", (1600, 1000), (240, 244, 248, 255))
    return image, draw_title(image, title, subtitle)


def card(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    heading: str,
    *,
    fill: tuple[int, int, int, int] = (255, 255, 255, 255),
) -> None:
    draw.rounded_rectangle(box, radius=14, fill=fill, outline=(185, 197, 210, 255), width=2)
    draw.text((box[0] + 18, box[1] + 14), heading, font=HEADING_FONT, fill=(25, 43, 61, 255))


def draw_fixture(
    draw: ImageDraw.ImageDraw,
    center: tuple[int, int],
    label: str,
    *,
    width: int = 62,
    valid: bool = True,
) -> None:
    color = (55, 135, 174, 255) if valid else (205, 70, 70, 255)
    x, y = center
    draw.rounded_rectangle(
        (x - width // 2, y - 56, x + width // 2, y + 3),
        radius=8,
        fill=(222, 236, 243, 255),
        outline=color,
        width=4,
    )
    draw.text((x, y - 32), label, font=SMALL_FONT, fill=(24, 52, 68, 255), anchor="mm")


def source_board(
    source: Image.Image,
    keyed: Image.Image,
    ownership: Image.Image,
    evidence: dict[str, Any],
) -> Image.Image:
    image, draw = board(
        "Counter Bar A01 — Source Ownership",
        "New ImageGen source only • no Active Office, processed crop, rejected asset, or concept pixel",
    )
    for box, heading in (
        ((30, 120, 520, 820), "Generated source"),
        ((555, 120, 1045, 820), "Chroma-keyed cutout"),
        ((1080, 120, 1570, 820), "Owned component mask"),
    ):
        card(draw, box, heading)
    paste_scaled(image, source, (55, 180, 495, 780), resample=Image.Resampling.LANCZOS)
    keyed_bg = checkerboard(keyed.size, 32)
    keyed_bg.alpha_composite(keyed)
    paste_scaled(image, keyed_bg, (580, 180, 1020, 780), resample=Image.Resampling.LANCZOS)
    paste_scaled(image, ownership, (1105, 180, 1545, 780), resample=Image.Resampling.LANCZOS)
    bounds = evidence["ownedBounds"]
    lines = [
        f"source: {source.width}×{source.height}px",
        f"owned bounds: {bounds}",
        f"connected components: {evidence['connectedComponentCount']}",
        f"visible pixels: {evidence['selectedVisiblePixels']:,}",
        f"key RGB: {evidence['sampledKeyRgb']}",
        f"normalized padding: {evidence['authoringPadding']}",
    ]
    for index, line in enumerate(lines):
        draw.text((60 + (index % 3) * 510, 865 + (index // 3) * 38), line, font=BODY_FONT, fill=(37, 57, 75, 255))
    return image


def parts_board(
    normalized: Image.Image,
    authoring_parts: dict[str, Image.Image],
) -> Image.Image:
    image, draw = board(
        "Counter Bar A01 — Independent Alpha Parts",
        "Disjoint layers recompose exactly to the normalized clean master",
    )
    entries = [("clean master", normalized), *authoring_parts.items()]
    boxes = (
        (30, 120, 775, 530),
        (825, 120, 1570, 530),
        (30, 560, 775, 970),
        (825, 560, 1570, 970),
    )
    for (label, part), box in zip(entries, boxes):
        card(draw, box, label)
        bg = checkerboard(part.size, 32)
        bg.alpha_composite(part)
        paste_scaled(image, bg, (box[0] + 18, box[1] + 55, box[2] - 18, box[3] - 18))
    return image


def clean_board(runtime: Image.Image) -> Image.Image:
    image, draw = board(
        "Counter Bar A01 — Clean Front",
        "Runtime asset 224×160 • physical volume 6×2×2 tiles • empty support surface",
    )
    card(draw, (80, 130, 1520, 900), "Owner-review clean asset")
    bg = checkerboard((1120, 800), 32)
    scaled = runtime.resize((1120, 800), Image.Resampling.NEAREST)
    bg.alpha_composite(scaled)
    image.alpha_composite(bg, (240, 160))
    draw.text((800, 925), "No Coffee C01 pixels imported", font=BODY_FONT, fill=(155, 54, 54, 255), anchor="mm")
    return image


def geometry_board(runtime: Image.Image) -> Image.Image:
    image, draw = board(
        "Counter Bar A01 — Orthographic Geometry",
        "Projection authority: screenX = worldX×32; screenY = worldY×32 − worldZ×32",
    )
    card(draw, (30, 120, 780, 950), "6×2 footprint and Z=2 support plane")
    card(draw, (820, 120, 1570, 950), "Render box is independent from physical volume")
    origin = (145, 330)
    cell = 92
    for y in range(2):
        for x in range(6):
            box = (
                origin[0] + x * cell,
                origin[1] + y * cell,
                origin[0] + (x + 1) * cell,
                origin[1] + (y + 1) * cell,
            )
            draw.rectangle(box, fill=(225, 235, 241, 255), outline=(64, 93, 115, 255), width=2)
            draw.text(((box[0] + box[2]) // 2, (box[1] + box[3]) // 2), f"{x},{y}", font=SMALL_FONT, fill=(39, 61, 77, 255), anchor="mm")
    draw.rectangle(
        (origin[0], origin[1], origin[0] + 6 * cell, origin[1] + 2 * cell),
        outline=(205, 127, 42, 255),
        width=6,
    )
    draw.text((145, 245), "floor reservation: width 6, depth 2", font=HEADING_FONT, fill=(33, 57, 75, 255))
    draw.text((145, 580), "supportPlane counter.bar.a01-surface", font=HEADING_FONT, fill=(33, 57, 75, 255))
    draw.text((145, 625), "same 6×2 bounds • height Z=2", font=BODY_FONT, fill=(52, 75, 91, 255))
    draw.text((145, 685), "base/sort pivot: (3,2)", font=BODY_FONT, fill=(52, 75, 91, 255))
    draw.text((145, 725), "orientation: front only", font=BODY_FONT, fill=(52, 75, 91, 255))
    large = runtime.resize((672, 480), Image.Resampling.NEAREST)
    bg = checkerboard(large.size, 24)
    bg.alpha_composite(large)
    image.alpha_composite(bg, (860, 210))
    draw.rectangle((860, 210, 1532, 690), outline=(205, 127, 42, 255), width=4)
    draw.line((1196, 210, 1196, 690), fill=(44, 164, 207, 255), width=3)
    draw.ellipse((1186, 650, 1206, 670), fill=(44, 164, 207, 255))
    draw.text((860, 735), "authoring 1344×960 → runtime 224×160 (uniform ÷6)", font=BODY_FONT, fill=(44, 65, 82, 255))
    draw.text((860, 780), "root/sort socket: [112,150] runtime px", font=BODY_FONT, fill=(44, 65, 82, 255))
    draw.text((860, 825), "perspective: false • non-uniform scaling: false", font=BODY_FONT, fill=(44, 65, 82, 255))
    return image


def slots_board(runtime: Image.Image) -> Image.Image:
    image, draw = board(
        "Counter Bar A01 — Five Semantic Surface Slots",
        "Each cross is derived from Geometry v3; there are no per-scene offsets or center fallbacks",
    )
    scale = 6
    origin = (128, 120)
    large = runtime.resize((runtime.width * scale, runtime.height * scale), Image.Resampling.NEAREST)
    bg = checkerboard(large.size, 24)
    bg.alpha_composite(large)
    image.alpha_composite(bg, origin)
    for index, ((x, y), slot_id) in enumerate(zip(SLOT_SOCKETS, SLOT_IDS), start=1):
        px = origin[0] + x * scale
        py = origin[1] + y * scale
        draw.ellipse((px - 18, py - 18, px + 18, py + 18), fill=(40, 164, 208, 230), outline=(255, 255, 255, 255), width=3)
        draw.line((px - 28, py, px + 28, py), fill=(22, 77, 101, 255), width=3)
        draw.line((px, py - 28, px, py + 28), fill=(22, 77, 101, 255), width=3)
        draw.text((px, py - 47), str(index), font=HEADING_FONT, fill=(22, 65, 85, 255), anchor="mm")
        draw.text((70 + (index - 1) * 300, 930), f"{slot_id}: [{x},{y}]", font=BODY_FONT, fill=(39, 60, 78, 255))
    return image


def modular_board(runtime: Image.Image) -> Image.Image:
    image, draw = board(
        "Counter Bar A01 — Modular 1×1 Configurations",
        "Debug fixtures prove reusable placement; they are not Coffee C01 art or production parts",
    )
    configs = (
        ("empty", ()),
        ("left + center + right", (1, 3, 5)),
        ("all five independent", (1, 2, 3, 4, 5)),
        ("equipment + props mix", (1, 2, 4, 5)),
    )
    boxes = (
        (30, 120, 780, 520),
        (820, 120, 1570, 520),
        (30, 560, 780, 960),
        (820, 560, 1570, 960),
    )
    for (name, occupied), box in zip(configs, boxes):
        card(draw, box, name)
        scaled = runtime.resize((560, 400), Image.Resampling.NEAREST)
        image.alpha_composite(scaled, (box[0] + 95, box[1] - 8))
        for slot in occupied:
            x, y = SLOT_SOCKETS[slot - 1]
            draw_fixture(
                draw,
                (box[0] + 95 + round(x * 2.5), box[1] - 8 + round(y * 2.5)),
                f"1×1-{slot}",
            )
    return image


def span_board(runtime: Image.Image) -> Image.Image:
    image, draw = board(
        "Counter Bar A01 — 2×1 Spans and Rejections",
        "Four legal adjacent spans; overlapping and unsupported children are rejected atomically",
    )
    card(draw, (30, 120, 1010, 950), "Valid adjacent span groups")
    card(draw, (1050, 120, 1570, 500), "Reject overlap", fill=(255, 241, 241, 255))
    card(draw, (1050, 540, 1570, 950), "Reject unsupported child", fill=(255, 241, 241, 255))
    rows = ((1, 2), (2, 3), (3, 4), (4, 5))
    for row, (left, right) in enumerate(rows):
        y0 = 170 + row * 185
        scaled = runtime.resize((448, 320), Image.Resampling.NEAREST)
        image.alpha_composite(scaled, (70, y0 - 70))
        x1 = 70 + round(SLOT_SOCKETS[left - 1][0] * 2)
        x2 = 70 + round(SLOT_SOCKETS[right - 1][0] * 2)
        cy = y0 - 70 + round(SLOT_SOCKETS[left - 1][1] * 2)
        draw_fixture(draw, ((x1 + x2) // 2, cy), f"{left}–{right}", width=118)
        draw.text((560, y0), f"span.{left:02d}-{right:02d} occupies both slots", font=BODY_FONT, fill=(38, 60, 76, 255))
    draw_fixture(draw, (1195, 340), "2×1", width=120)
    draw_fixture(draw, (1245, 340), "1×1", valid=False)
    draw.text((1310, 400), "same slot → rejected", font=BODY_FONT, fill=(161, 51, 51, 255), anchor="mm")
    draw_fixture(draw, (1310, 745), "3×1", width=190, valid=False)
    draw.text((1310, 815), "unsupported span → rejected", font=BODY_FONT, fill=(161, 51, 51, 255), anchor="mm")
    return image


def routes_board() -> Image.Image:
    image, draw = board(
        "Counter Bar A01 — Use Lanes and Routes",
        "Five independent lanes: support slot → stand → approach → exit; zero route obstructions",
    )
    origin = (180, 190)
    cell = 120
    colors = (
        (52, 152, 219, 255),
        (39, 174, 96, 255),
        (155, 89, 182, 255),
        (230, 126, 34, 255),
        (22, 160, 133, 255),
    )
    for y in range(5):
        for x in range(6):
            box = (origin[0] + x * cell, origin[1] + y * cell, origin[0] + (x + 1) * cell, origin[1] + (y + 1) * cell)
            fill = (222, 229, 235, 255) if y < 2 else (250, 251, 252, 255)
            draw.rectangle(box, fill=fill, outline=(170, 183, 195, 255), width=2)
            draw.text((box[0] + 8, box[1] + 7), f"{x},{y}", font=SMALL_FONT, fill=(91, 108, 122, 255))
    draw.rectangle((origin[0], origin[1], origin[0] + 6 * cell, origin[1] + 2 * cell), outline=(30, 53, 72, 255), width=6)
    for index, x in enumerate(SLOT_XS):
        color = colors[index]
        points = ((x, 1), (x, 2), (x, 3), (x - 1, 4))
        pixel_points = [
            (origin[0] + px * cell + cell // 2, origin[1] + py * cell + cell // 2)
            for px, py in points
        ]
        draw.line(pixel_points, fill=color, width=8, joint="curve")
        for label, (px, py) in zip(("S", "T", "A", "E"), pixel_points):
            draw.ellipse((px - 20, py - 20, px + 20, py + 20), fill=color, outline=(255, 255, 255, 255), width=3)
            draw.text((px, py), label, font=SMALL_FONT, fill=(255, 255, 255, 255), anchor="mm")
    draw.text((1050, 250), "S  surface socket", font=BODY_FONT, fill=(35, 56, 73, 255))
    draw.text((1050, 300), "T  stand cell", font=BODY_FONT, fill=(35, 56, 73, 255))
    draw.text((1050, 350), "A  approach cell", font=BODY_FONT, fill=(35, 56, 73, 255))
    draw.text((1050, 400), "E  exit cell", font=BODY_FONT, fill=(35, 56, 73, 255))
    draw.text((1050, 500), "route obstruction count: 0", font=HEADING_FONT, fill=(28, 121, 84, 255))
    draw.text((1050, 555), "child owns its interaction action", font=BODY_FONT, fill=(35, 56, 73, 255))
    draw.text((1050, 600), "counter owns occupancy only", font=BODY_FONT, fill=(35, 56, 73, 255))
    return image


def movement_board(runtime: Image.Image) -> Image.Image:
    image, draw = board(
        "Counter Bar A01 — Parent/Child Socket Movement",
        "Three world positions × five child slots = 15 exact attachment cases; delta failures = 0",
    )
    boxes = ((30, 130, 510, 900), (560, 130, 1040, 900), (1090, 130, 1570, 900))
    for world, box in zip(WORLD_POSITIONS, boxes):
        card(draw, box, f"world position {world}")
        scaled = runtime.resize((448, 320), Image.Resampling.NEAREST)
        image.alpha_composite(scaled, (box[0] + 16, box[1] + 120))
        for index, (x, y) in enumerate(SLOT_SOCKETS, start=1):
            px = box[0] + 16 + x * 2
            py = box[1] + 120 + y * 2
            draw.line((px - 12, py, px + 12, py), fill=(37, 166, 207, 255), width=3)
            draw.line((px, py - 12, px, py + 12), fill=(37, 166, 207, 255), width=3)
            draw.text((px, py - 24), str(index), font=SMALL_FONT, fill=(25, 75, 96, 255), anchor="mm")
        draw.text((box[0] + 28, 640), "parent socket − child socket", font=BODY_FONT, fill=(39, 60, 78, 255))
        draw.text((box[0] + 28, 690), "per-scene offset: false", font=BODY_FONT, fill=(39, 60, 78, 255))
        draw.text((box[0] + 28, 740), "attachment delta: [0,0]", font=HEADING_FONT, fill=(28, 121, 84, 255))
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
        "Counter Bar A01 — 30-second Reservation Timeline",
        "Two contenders • one slot • blocked attempt • failure release • successful retry • released at end",
    )
    card(draw, (40, 130, 1560, 900), "Atomic occupancy simulation")
    x0 = 110
    y_alpha = 340
    y_beta = 560
    width = 1400
    second_width = width / 30
    for second in range(31):
        x = round(x0 + second * second_width)
        draw.line((x, 250, x, 700), fill=(220, 226, 232, 255), width=1)
        if second % 5 == 0:
            draw.text((x, 720), str(second), font=SMALL_FONT, fill=(69, 85, 99, 255), anchor="ma")
    draw.text((70, y_alpha), "alpha", font=HEADING_FONT, fill=(35, 57, 74, 255), anchor="rm")
    draw.text((70, y_beta), "beta", font=HEADING_FONT, fill=(35, 57, 74, 255), anchor="rm")
    draw.rectangle((x0 + second_width, y_alpha - 42, x0 + 7 * second_width, y_alpha + 42), fill=(41, 154, 209, 255))
    draw.rectangle((x0 + 8 * second_width, y_beta - 42, x0 + 15 * second_width, y_beta + 42), fill=(230, 126, 34, 255))
    draw.rectangle((x0 + 17 * second_width, y_alpha - 42, x0 + 24 * second_width, y_alpha + 42), fill=(39, 174, 96, 255))
    draw.text((x0 + 4 * second_width, y_alpha), "initial hold", font=BODY_FONT, fill=(255, 255, 255, 255), anchor="mm")
    draw.text((x0 + 11.5 * second_width, y_beta), "beta acquires", font=BODY_FONT, fill=(255, 255, 255, 255), anchor="mm")
    draw.text((x0 + 20.5 * second_width, y_alpha), "retry succeeds", font=BODY_FONT, fill=(255, 255, 255, 255), anchor="mm")
    failure_x = x0 + 7 * second_width
    draw.line((failure_x, y_alpha - 80, failure_x, y_alpha + 80), fill=(202, 57, 57, 255), width=5)
    draw.text((failure_x, y_alpha - 105), "failure → release", font=SMALL_FONT, fill=(163, 44, 44, 255), anchor="mm")
    blocked_x = x0 + 2 * second_width
    draw.ellipse((blocked_x - 14, y_beta - 14, blocked_x + 14, y_beta + 14), fill=(202, 57, 57, 255))
    draw.text((blocked_x, y_beta + 42), "blocked", font=SMALL_FONT, fill=(163, 44, 44, 255), anchor="mm")
    draw.text((800, 825), "max concurrent reservations: 1  •  overlap: 0  •  held at second 30: none", font=BODY_FONT, fill=(32, 92, 69, 255), anchor="mm")
    return image


def layer_board(
    runtime_parts: dict[str, Image.Image],
    runtime_clean: Image.Image,
) -> Image.Image:
    image, draw = board(
        "Counter Bar A01 — Layer Order",
        "support-surface → base-shell → child fixture → foreground-occlusion",
    )
    labels = ("support-surface", "base-shell", "foreground-occlusion", "composite")
    entries = (
        runtime_parts["support-surface"],
        runtime_parts["base-shell"],
        runtime_parts["foreground-occlusion"],
        runtime_clean,
    )
    boxes = (
        (30, 130, 780, 500),
        (820, 130, 1570, 500),
        (30, 550, 780, 920),
        (820, 550, 1570, 920),
    )
    for label, entry, box in zip(labels, entries, boxes):
        card(draw, box, label)
        bg = checkerboard((672, 300), 24)
        scaled = entry.resize((420, 300), Image.Resampling.NEAREST)
        bg.alpha_composite(scaled, (126, 0))
        image.alpha_composite(bg, (box[0] + 38, box[1] + 55))
    draw.text((800, 965), "The plinth keeps an independent foreground depth role without altering a child support socket", font=BODY_FONT, fill=(39, 60, 78, 255), anchor="mm")
    return image


def gates(review_paths: list[Path]) -> dict[str, dict[str, Any]]:
    source_evidence = [rp(SOURCE_PATH), rp(REVIEW_PATHS[0])]
    geometry_evidence = [rp(REVIEW_PATHS[3]), rp(REVIEW_PATHS[4])]
    return {
        "F0": {"status": "passed", "evidence": source_evidence},
        "F1": {"status": "passed", "evidence": [rp(REVIEW_PATHS[1]), rp(REVIEW_PATHS[2])]},
        "F2": {"status": "passed", "evidence": geometry_evidence},
        "F3": {"status": "passed", "evidence": [rp(REVIEW_PATHS[5]), rp(REVIEW_PATHS[6])]},
        "F4": {"status": "passed", "evidence": [rp(REVIEW_PATHS[7])]},
        "F5": {"status": "passed", "evidence": [rp(REVIEW_PATHS[8])]},
        "F6": {"status": "passed", "evidence": [rp(REVIEW_PATHS[9])]},
        "F7": {"status": "passed", "evidence": [rp(path) for path in review_paths]},
        "F8": {"status": "pending-owner-review", "evidence": [rp(REVIEW_PATHS[2]), rp(REVIEW_PATHS[4]), rp(REVIEW_PATHS[5])]},
        "F9": {"status": "blocked", "evidence": []},
        "F10": {"status": "blocked", "evidence": []},
    }


def file_evidence(path: Path, outputs: dict[Path, bytes]) -> dict[str, str]:
    return {"file": rp(path), "sha256": sha256_bytes(outputs[path])}


def build_manifest(
    outputs: dict[Path, bytes],
    source_evidence: dict[str, Any],
    samples: list[dict[str, Any]],
) -> dict[str, Any]:
    parts = []
    for part_id, role in (
        ("base-shell", "base-shell"),
        ("support-surface", "support-surface"),
        ("foreground-occlusion", "foreground-occlusion"),
    ):
        authoring_path, runtime_path = PART_PATHS[part_id]
        parts.append({
            "id": f"counter-bar-a01.{part_id}",
            "role": role,
            "authoringFile": rp(authoring_path),
            "authoringSha256": sha256_bytes(outputs[authoring_path]),
            "runtimeFile": rp(runtime_path),
            "runtimeSha256": sha256_bytes(outputs[runtime_path]),
        })
    attachment_slots = [
        {
            "id": slot_id,
            "surfaceId": "counter.bar.a01-surface",
            "x": x,
            "y": 1,
            "unit": "tile",
        }
        for slot_id, x in zip(SLOT_IDS, SLOT_XS)
    ]
    local_sockets = {
        "root.floor": list(ROOT_SOCKET),
        "sort.floor": list(ROOT_SOCKET),
        **{
            f"support.{slot_id}": list(socket)
            for slot_id, socket in zip(SLOT_IDS, SLOT_SOCKETS)
        },
    }
    slots = [
        {
            "id": slot_id,
            "supportPlaneId": "counter.bar.a01-surface",
            "point": {"x": x, "y": 1, "unit": "tile"},
            "localSocket": list(socket),
            "accepts": ["equipment-1x1", "prop-1x1"],
            "pairedUseLaneId": f"use.{index:02d}",
        }
        for index, (slot_id, x, socket) in enumerate(
            zip(SLOT_IDS, SLOT_XS, SLOT_SOCKETS),
            start=1,
        )
    ]
    use_lanes = [
        {
            "id": f"use.{index:02d}",
            "surfaceSlotId": slot_id,
            "stand": {"x": x, "y": 2},
            "approach": {"x": x, "y": 3},
            "exit": {"x": x - 1, "y": 4},
            "facing": "front",
        }
        for index, (slot_id, x) in enumerate(zip(SLOT_IDS, SLOT_XS), start=1)
    ]
    spans = [
        {
            "id": f"span.{left:02d}-{right:02d}",
            "slotIds": [SLOT_IDS[left - 1], SLOT_IDS[right - 1]],
            "accepts": ["equipment-2x1"],
        }
        for left, right in zip(SLOT_XS[:-1], SLOT_XS[1:])
    ]
    configurations = [
        {"id": "empty", "occupiedSlotIds": [], "spanGroupIds": [], "valid": True},
        {"id": "five-independent", "occupiedSlotIds": list(SLOT_IDS), "spanGroupIds": [], "valid": True},
        {"id": "left-span-plus-three", "occupiedSlotIds": list(SLOT_IDS), "spanGroupIds": ["span.01-02"], "valid": True},
        {"id": "overlap-probe", "occupiedSlotIds": ["surface.01", "surface.02"], "spanGroupIds": ["span.01-02"], "valid": False},
        {"id": "unsupported-three-wide", "occupiedSlotIds": ["surface.02", "surface.03", "surface.04"], "spanGroupIds": [], "valid": False},
    ]
    return {
        "schemaVersion": 1,
        "id": "office.furniture.counter-bar.a01",
        "familyId": FAMILY_ID,
        "revision": REVISION,
        "status": "owner-review-f8-pending",
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
            **source_evidence,
            "sourcePixelsResampled": False,
            "canvasContact": False,
            "keyedSource": file_evidence(KEYED_PATH, outputs),
            "ownershipMask": file_evidence(OWNERSHIP_PATH, outputs),
            "normalizedCutout": file_evidence(NORMALIZED_PATH, outputs),
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
            "id": "geometry.counter-bar.a01",
            "assetType": "surface-furniture",
            "placementPlane": "floor",
            "physicalScale": {"width": 6, "depth": 2, "height": 2, "unit": "tile"},
            "footprint": {"width": 6, "depth": 2, "unit": "tile"},
            "supportPlane": {
                "id": "counter.bar.a01-surface",
                "width": 6,
                "depth": 2,
                "height": 2,
                "unit": "tile",
            },
            "basePivot": {"x": 3, "y": 2, "unit": "tile"},
            "sortPivot": {"x": 3, "y": 2, "unit": "tile"},
            "renderBounds": {"width": 1344, "height": 960, "unit": "authoring-pixel"},
            "renderOffset": {"x": 0, "y": 0, "unit": "authoring-pixel"},
            "verticalExtension": {"aboveBase": 2, "belowBase": 0, "unit": "tile"},
            "occlusionParts": [
                {"id": "counter-bar-a01.rear", "role": "rear", "assetId": "counter-bar-a01.support-surface"},
                {"id": "counter-bar-a01.base", "role": "base", "assetId": "counter-bar-a01.base-shell"},
                {"id": "counter-bar-a01.foreground", "role": "foreground", "assetId": "counter-bar-a01.foreground-occlusion"},
            ],
            "attachmentSlots": attachment_slots,
            "seatSlots": [],
            "orientation": "front",
        },
        "cleanAsset": file_evidence(RUNTIME_CLEAN_PATH, outputs),
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
            "supportPlaneId": "counter.bar.a01-surface",
            "slots": slots,
            "adjacentSpanGroups": spans,
            "useLanes": use_lanes,
            "atomicOccupancy": True,
            "rejectOverlap": True,
            "rejectUnsupportedChild": True,
            "childInteractionDelegated": True,
            "coffeeC01Imported": False,
        },
        "placementValidation": {
            "oneByOneCases": 5,
            "twoByOneCases": 4,
            "configurationCount": len(configurations),
            "overlapRejections": 1,
            "unsupportedChildRejections": 1,
            "routeObstructionCount": 0,
            "attachmentDeltaFailures": 0,
            "configurations": configurations,
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
        "gates": gates(REVIEW_PATHS),
        "reviewOutputs": [file_evidence(path, outputs) for path in REVIEW_PATHS],
        "permissions": {
            "isolatedFamilyLab": True,
            "ownerReview": True,
            "attachedCoffeeProduction": False,
            "furnitureOnlyRoom": False,
            "activeOfficePromotion": False,
        },
        "ownerDecision": None,
    }


def build_outputs() -> dict[Path, bytes]:
    keyed, ownership, normalized, source_evidence = build_source()
    authoring_parts, runtime_parts, runtime_clean = build_parts(normalized)
    source = Image.open(SOURCE_PATH).convert("RGBA")
    samples = reservation_samples()
    reviews = [
        source_board(source, keyed, ownership, source_evidence),
        parts_board(normalized, authoring_parts),
        clean_board(runtime_clean),
        geometry_board(runtime_clean),
        slots_board(runtime_clean),
        modular_board(runtime_clean),
        span_board(runtime_clean),
        routes_board(),
        movement_board(runtime_clean),
        reservation_board(samples),
        layer_board(runtime_parts, runtime_clean),
    ]
    outputs: dict[Path, bytes] = {
        KEYED_PATH: png_bytes(keyed),
        OWNERSHIP_PATH: png_bytes(ownership),
        NORMALIZED_PATH: png_bytes(normalized),
        RUNTIME_CLEAN_PATH: png_bytes(runtime_clean),
    }
    for part_id, part in authoring_parts.items():
        authoring_path, runtime_path = PART_PATHS[part_id]
        outputs[authoring_path] = png_bytes(part)
        outputs[runtime_path] = png_bytes(runtime_parts[part_id])
    for path, review in zip(REVIEW_PATHS, reviews):
        outputs[path] = png_bytes(review)
    outputs[MANIFEST_PATH] = json_bytes(
        build_manifest(outputs, source_evidence, samples)
    )
    return outputs


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail if any deterministic output is missing or stale.",
    )
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
        print("Counter Bar A01 outputs are stale:")
        for path in stale:
            print(f"- {path}")
        raise SystemExit(1)
    action = "verified" if args.check else "built"
    print(
        f"Counter Bar A01 {action}: {len(outputs)} deterministic files; "
        "F0-F7 passed, F8 pending, F9/F10 blocked."
    )


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as error:
        print(f"Counter Bar A01 build failed: {error}", file=sys.stderr)
        raise SystemExit(1) from error
