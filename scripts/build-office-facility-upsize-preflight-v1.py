#!/usr/bin/env python3
"""Build the four-family 2x2x4 visual preflight without production promotion."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import tempfile
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
REVIEW_REL = Path("assets/art/layout-references/office-facility-upsize-v1")
PROCESSED_REL = Path("assets/game/processed/office-facility-upsize-v1")
BATCH_MANIFEST_REL = Path(
    "assets/game/manifests/office-facility-upsize-2x2x4-preflight-v1.json"
)
DOC_REL = Path("docs/art/OFFICE_FACILITY_UPSIZE_2X2X4_PREFLIGHT_V1.md")
SOURCE_CELL = 627
AUTHORING_SIZE = (384, 512)
RUNTIME_SIZE = (96, 128)
ORIENTATIONS = ("front", "right", "back", "left")
CELL_ORIGINS = {
    "front": (0, 0),
    "right": (SOURCE_CELL, 0),
    "back": (0, SOURCE_CELL),
    "left": (SOURCE_CELL, SOURCE_CELL),
}
COLORS = {
    "ink": (20, 47, 64),
    "muted": (83, 111, 128),
    "panel": (255, 255, 255),
    "page": (237, 243, 246),
    "grid": (83, 111, 128, 70),
    "footprint": (236, 72, 153, 110),
    "approach": (245, 158, 11, 190),
    "cyan": (14, 165, 233, 190),
    "green": (16, 185, 129, 190),
    "violet": (139, 92, 246, 190),
}

FAMILIES = [
    {
        "slug": "coffee-machine-c02",
        "id": "office.facility.coffee-machine.c02",
        "familyId": "coffee.machine.generated-floor",
        "label": "Coffee Machine C02",
        "kind": "facility",
        "manifest": "assets/game/manifests/office-facility-coffee-machine-c02.json",
        "sourceChroma": (
            REVIEW_REL / "source/coffee-machine-c02-four-view-chroma.png"
        ).as_posix(),
        "sourceAlpha": (
            REVIEW_REL / "source-alpha/coffee-machine-c02-four-view-alpha.png"
        ).as_posix(),
        "supersedesAfterApproval": (
            "assets/game/manifests/office-facility-coffee-machine-c01-r02.json"
        ),
        "currentGeometry": "2x2x2 support-surface front-only",
        "action": "brew-coffee",
        "visualPose": "interact-front",
        "heldProp": "held.coffee-mug",
        "plannedInstances": 1,
        "plannedSlots": 1,
        "parts": [
            "immutable-shell[orientation]",
            "status-viewport[A-D]",
            "machine-local-controls[orientation]",
            "brew-light",
            "coffee-stream",
            "steam",
            "output-bay-empty",
            "existing-held-coffee-mug",
        ],
        "motionRegions": {
            "status-viewport": [24, 8, 72, 31],
            "controls": [17, 31, 79, 49],
            "dispense-effects": [22, 48, 74, 91],
        },
        "notes": (
            "New floor-standing identity. Counter A01-r02 is retained but is "
            "not a support dependency."
        ),
    },
    {
        "slug": "water-dispenser-w02",
        "id": "office.facility.water-dispenser.w02",
        "familyId": "water.dispenser.generated-floor",
        "label": "Water Dispenser W02",
        "kind": "facility",
        "manifest": "assets/game/manifests/office-facility-water-dispenser-w02.json",
        "sourceChroma": (
            REVIEW_REL / "source/water-dispenser-w02-four-view-chroma.png"
        ).as_posix(),
        "sourceAlpha": (
            REVIEW_REL / "source-alpha/water-dispenser-w02-four-view-alpha.png"
        ).as_posix(),
        "supersedesAfterApproval": (
            "assets/game/manifests/office-facility-water-dispenser-w01.json"
        ),
        "currentGeometry": "1x1x4 floor front-only",
        "action": "use-water-dispenser",
        "visualPose": "interact-front",
        "heldProp": "held.water-cup-clear",
        "plannedInstances": 2,
        "plannedSlots": 2,
        "parts": [
            "immutable-shell[orientation]",
            "status-viewport[A-D]",
            "machine-local-controls[orientation]",
            "reservoir-indicator[A-D]",
            "water-stream",
            "output-bay-empty",
            "existing-held-water-cup",
        ],
        "motionRegions": {
            "status-viewport": [25, 8, 71, 29],
            "controls": [18, 28, 78, 45],
            "dispense-effects": [20, 43, 76, 88],
        },
        "notes": "New broad hydration cabinet; no exposed bottle is embedded.",
    },
    {
        "slug": "vending-machine-u02",
        "id": "office.facility.vending-machine.u02",
        "familyId": "vending.machine.generated-floor",
        "label": "Vending Machine U02",
        "kind": "facility",
        "manifest": "assets/game/manifests/office-facility-vending-u02.json",
        "sourceChroma": (
            REVIEW_REL / "source/vending-machine-u02-four-view-chroma.png"
        ).as_posix(),
        "sourceAlpha": (
            REVIEW_REL / "source-alpha/vending-machine-u02-four-view-alpha.png"
        ).as_posix(),
        "supersedesAfterApproval": (
            "assets/game/manifests/office-facility-vending-u01.json"
        ),
        "currentGeometry": "2x1x3 floor front-only",
        "action": "use-vending-machine",
        "visualPose": "interact-front",
        "heldProp": "held.soda-can",
        "plannedInstances": 1,
        "plannedSlots": 1,
        "parts": [
            "immutable-shell[orientation]",
            "merchandise-viewport-empty",
            "display-viewport[A-D]",
            "machine-local-controls[orientation]",
            "dispense-effect",
            "pickup-tray-empty",
            "existing-held-soda-can",
        ],
        "motionRegions": {
            "empty-merchandise-viewport": [10, 8, 65, 90],
            "controls": [65, 16, 90, 73],
            "pickup-tray": [13, 90, 77, 113],
        },
        "notes": "No products, prices, coins, or packaging are embedded.",
    },
    {
        "slug": "massage-chair-r03",
        "id": "office.furniture.chair-massage.r03",
        "familyId": "chair.massage.generated-pod",
        "label": "Massage Chair R03",
        "kind": "seat",
        "manifest": "assets/game/manifests/office-furniture-chair-massage-r03.json",
        "sourceChroma": (
            REVIEW_REL / "source/massage-chair-r03-four-view-chroma.png"
        ).as_posix(),
        "sourceAlpha": (
            REVIEW_REL / "source-alpha/massage-chair-r03-four-view-alpha.png"
        ).as_posix(),
        "supersedesAfterApproval": (
            "assets/game/manifests/office-furniture-chair-massage-r02.json"
        ),
        "currentGeometry": "2x2x2 floor front-only",
        "action": "use-massage-chair",
        "visualPose": "working-front-seated",
        "heldProp": None,
        "plannedInstances": 1,
        "plannedSlots": 1,
        "parts": [
            "immutable-outer-shell[orientation]",
            "rear-occlusion",
            "fixed-seat",
            "foreground-occlusion",
            "status-light[A-D]",
            "roller-indicator[A-D]",
        ],
        "motionRegions": {
            "fixed-seat-and-occlusion": [18, 20, 79, 117],
            "status-light": [75, 32, 92, 58],
            "roller-indicator": [31, 42, 66, 93],
        },
        "notes": (
            "Four visual orientations are created, but production seating "
            "remains front-only until side seated-pose authority exists."
        ),
    },
]


def sha256(path: Path) -> str:
    if path.suffix.lower() in {".json", ".md", ".mjs", ".py", ".ts", ".tsx"}:
        return hashlib.sha256(path.read_bytes().replace(b"\r\n", b"\n")).hexdigest()
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def save_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    filename = "arialbd.ttf" if bold else "arial.ttf"
    return ImageFont.truetype(str(Path("C:/Windows/Fonts") / filename), size)


def alpha_components(alpha: Image.Image, threshold: int = 8) -> list[dict]:
    width, height = alpha.size
    pixels = alpha.load()
    visited: set[tuple[int, int]] = set()
    components = []
    for y in range(height):
        for x in range(width):
            if pixels[x, y] <= threshold or (x, y) in visited:
                continue
            queue = deque([(x, y)])
            visited.add((x, y))
            count = 0
            min_x = max_x = x
            min_y = max_y = y
            while queue:
                cx, cy = queue.popleft()
                count += 1
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)
                for nx, ny in (
                    (cx + 1, cy),
                    (cx - 1, cy),
                    (cx, cy + 1),
                    (cx, cy - 1),
                ):
                    if (
                        0 <= nx < width
                        and 0 <= ny < height
                        and (nx, ny) not in visited
                        and pixels[nx, ny] > threshold
                    ):
                        visited.add((nx, ny))
                        queue.append((nx, ny))
            components.append(
                {
                    "pixelCount": count,
                    "bounds": [min_x, min_y, max_x + 1, max_y + 1],
                }
            )
    return sorted(components, key=lambda item: item["pixelCount"], reverse=True)


def magenta_visible_pixels(image: Image.Image) -> int:
    count = 0
    for red, green, blue, alpha in image.convert("RGBA").getdata():
        if (
            alpha > 0
            and red > 180
            and blue > 180
            and green + 60 < min(red, blue)
        ):
            count += 1
    return count


def extract_views(family: dict) -> tuple[dict[str, Image.Image], list[dict]]:
    source = Image.open(ROOT / family["sourceAlpha"]).convert("RGBA")
    chroma = Image.open(ROOT / family["sourceChroma"]).convert("RGBA")
    if source.size != (SOURCE_CELL * 2, SOURCE_CELL * 2):
        raise ValueError(f"Unexpected source size for {family['slug']}: {source.size}")
    if any(
        source.getpixel(point)[3] != 0
        for point in (
            (0, 0),
            (source.width - 1, 0),
            (0, source.height - 1),
            (source.width - 1, source.height - 1),
        )
    ):
        raise ValueError(f"Transparent corners failed: {family['slug']}")
    if magenta_visible_pixels(source) != 0:
        raise ValueError(f"Visible chroma fringe remains: {family['slug']}")

    resampling = getattr(Image, "Resampling", Image)
    views: dict[str, Image.Image] = {}
    ownership = []
    for orientation in ORIENTATIONS:
        x, y = CELL_ORIGINS[orientation]
        source_box = [x, y, x + SOURCE_CELL, y + SOURCE_CELL]
        cell = source.crop(source_box)
        alpha = cell.getchannel("A")
        bounds = alpha.getbbox()
        if bounds is None:
            raise ValueError(f"Empty source cell: {family['slug']} {orientation}")
        left, top, right, bottom = bounds
        gutters = [left, top, SOURCE_CELL - right, SOURCE_CELL - bottom]
        if min(gutters) <= 0:
            raise ValueError(
                f"Source cell boundary touched: {family['slug']} {orientation}"
            )
        scaled = cell.resize((512, 512), resampling.LANCZOS)
        scaled_bounds = scaled.getchannel("A").getbbox()
        if scaled_bounds is None:
            raise ValueError(f"Empty scaled cell: {family['slug']} {orientation}")
        object_image = scaled.crop(scaled_bounds)
        if object_image.width > 368 or object_image.height > 496:
            raise ValueError(
                f"Normalized view exceeds canvas: {family['slug']} {orientation}"
            )
        authoring = Image.new("RGBA", AUTHORING_SIZE)
        paste_x = (AUTHORING_SIZE[0] - object_image.width) // 2
        paste_y = 496 - object_image.height
        authoring.alpha_composite(object_image, (paste_x, paste_y))
        views[orientation] = authoring
        components = alpha_components(alpha)
        ownership.append(
            {
                "orientation": orientation,
                "sourceCell": source_box,
                "alphaBoundsInCell": list(bounds),
                "transparentGutters": gutters,
                "touchesSourceCellBoundary": False,
                "selectedComponentCount": len(components),
                "selectedPixelCount": sum(
                    component["pixelCount"] for component in components
                ),
                "components": components,
            }
        )
    if chroma.getpixel((0, 0))[:3] == (0, 0, 0):
        raise ValueError(f"Chroma provenance is invalid: {family['slug']}")
    return views, ownership


def checker(size: tuple[int, int], cell: int = 24) -> Image.Image:
    image = Image.new("RGB", size, "#f4f7f8")
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle(
                    (x, y, min(x + cell, size[0]), min(y + cell, size[1])),
                    fill="#e5ecef",
                )
    return image


def board_base(title: str, subtitle: str) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGB", (1600, 1000), COLORS["page"])
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle(
        (28, 24, 1572, 976), 24, fill=COLORS["panel"], outline="#cad7df"
    )
    draw.text((70, 55), title, font=font(33, True), fill=COLORS["ink"])
    draw.text((70, 105), subtitle, font=font(19), fill=COLORS["muted"])
    return image, draw


def board_four_views(family: dict, runtime: dict[str, Image.Image]) -> Image.Image:
    image, draw = board_base(
        f"01 - {family['label']} four-side clean",
        "Fresh 2x2x4 visual identity; front, right, back, and left share one scale and baseline.",
    )
    panel = checker((1460, 760), 24)
    image.paste(panel, (70, 170))
    positions = [(115, 235), (475, 235), (835, 235), (1195, 235)]
    for orientation, position in zip(ORIENTATIONS, positions):
        sprite = runtime[orientation].resize((288, 384), Image.Resampling.NEAREST)
        image.paste(sprite, position, sprite)
        draw.text(
            (position[0] + 100, 650),
            orientation.upper(),
            font=font(18, True),
            fill=COLORS["ink"],
        )
    draw.text(
        (90, 890),
        "Runtime canvas 96x128 | authoring 384x512 | integer divisor 4",
        font=font(18),
        fill=COLORS["muted"],
    )
    return image


def board_ownership(family: dict, ownership: list[dict]) -> Image.Image:
    image, draw = board_base(
        f"02 - {family['label']} alpha and source ownership",
        "Each generated orientation remains inside one source cell; chroma removal leaves transparent corners.",
    )
    source = Image.open(ROOT / family["sourceAlpha"]).convert("RGBA")
    thumbnail = checker((760, 760), 20)
    source_thumb = source.resize((760, 760), Image.Resampling.LANCZOS)
    thumbnail.paste(source_thumb, (0, 0), source_thumb)
    thumb_draw = ImageDraw.Draw(thumbnail)
    thumb_draw.line((380, 0, 380, 760), fill="#0ea5e9", width=3)
    thumb_draw.line((0, 380, 760, 380), fill="#0ea5e9", width=3)
    image.paste(thumbnail, (70, 170))
    draw.text((890, 190), "OWNERSHIP METRICS", font=font(22, True), fill=COLORS["ink"])
    y = 245
    for record in ownership:
        draw.text(
            (890, y),
            record["orientation"].upper(),
            font=font(18, True),
            fill=COLORS["ink"],
        )
        draw.text(
            (1030, y),
            f"components {record['selectedComponentCount']}  |  pixels {record['selectedPixelCount']:,}",
            font=font(16),
            fill=COLORS["muted"],
        )
        draw.text(
            (1030, y + 27),
            f"gutters L/T/R/B {record['transparentGutters']}  |  boundary touch 0",
            font=font(16),
            fill=COLORS["muted"],
        )
        y += 100
    draw.text(
        (890, 690),
        "Visible magenta fringe pixels: 0",
        font=font(18, True),
        fill="#059669",
    )
    draw.text(
        (890, 735),
        "Original chroma and alpha masters are both hash-pinned.",
        font=font(16),
        fill=COLORS["muted"],
    )
    return image


def board_geometry(family: dict, runtime: dict[str, Image.Image]) -> Image.Image:
    image, draw = board_base(
        f"03 - {family['label']} scale and geometry",
        "Canonical person 1x1x3; facility physical scale 2x2x4; render box 3x4.",
    )
    stage = checker((1460, 730), 32)
    stage_draw = ImageDraw.Draw(stage, "RGBA")
    base_y = 650
    for x in range(0, stage.width + 1, 64):
        stage_draw.line((x, 90, x, 690), fill=COLORS["grid"], width=1)
    for y in range(90, 691, 64):
        stage_draw.line((0, y, stage.width, y), fill=COLORS["grid"], width=1)

    sprite = runtime["front"].resize((384, 512), Image.Resampling.NEAREST)
    stage.paste(sprite, (500, base_y - 512), sprite)
    stage_draw.rectangle(
        (564, base_y - 256, 820, base_y),
        outline=COLORS["footprint"],
        width=5,
    )
    stage_draw.rectangle(
        (500, base_y - 512, 884, base_y),
        outline=COLORS["cyan"],
        width=4,
    )
    person_x = 1030
    stage_draw.rounded_rectangle(
        (person_x, base_y - 384, person_x + 128, base_y),
        36,
        fill=(45, 67, 85, 210),
        outline=(255, 255, 255, 255),
        width=4,
    )
    stage_draw.ellipse(
        (person_x + 30, base_y - 384, person_x + 98, base_y - 316),
        fill=(245, 194, 145, 255),
    )
    image.paste(stage, (70, 175))
    draw.text((570, 880), "2 x 2 x 4", font=font(22, True), fill=COLORS["ink"])
    draw.text((1080, 880), "1 x 1 x 3", font=font(22, True), fill=COLORS["ink"])
    return image


def orientation_approach(orientation: str) -> tuple[int, int]:
    return {
        "front": (2, 4),
        "right": (4, 2),
        "back": (2, 0),
        "left": (0, 2),
    }[orientation]


def board_approaches(family: dict, runtime: dict[str, Image.Image]) -> Image.Image:
    image, draw = board_base(
        f"04 - {family['label']} floor placement and approach",
        "Four visual orientations exist; interaction enablement remains blocked until production pose tests pass.",
    )
    for index, orientation in enumerate(ORIENTATIONS):
        panel_x = 70 + index * 375
        panel_y = 190
        stage = checker((340, 690), 32)
        stage_draw = ImageDraw.Draw(stage, "RGBA")
        origin = (106, 320)
        for yy in range(2):
            for xx in range(2):
                stage_draw.rectangle(
                    (
                        origin[0] + xx * 64,
                        origin[1] + yy * 64,
                        origin[0] + (xx + 1) * 64,
                        origin[1] + (yy + 1) * 64,
                    ),
                    fill=COLORS["footprint"],
                    outline=(255, 255, 255, 210),
                    width=2,
                )
        ax, ay = orientation_approach(orientation)
        approach_boxes = {
            "front": (138, 448, 202, 512),
            "right": (266, 352, 330, 416),
            "back": (138, 128, 202, 192),
            "left": (10, 352, 74, 416),
        }
        stage_draw.rectangle(
            approach_boxes[orientation],
            fill=COLORS["approach"],
            outline=(255, 255, 255, 230),
            width=3,
        )
        sprite = runtime[orientation].resize((192, 256), Image.Resampling.NEAREST)
        stage.paste(sprite, (74, 192), sprite)
        image.paste(stage, (panel_x, panel_y))
        draw.text(
            (panel_x + 125, 900),
            orientation.upper(),
            font=font(18, True),
            fill=COLORS["ink"],
        )
        draw.text(
            (panel_x + 92, 925),
            f"approach local {ax},{ay}",
            font=font(14),
            fill=COLORS["muted"],
        )
    return image


def board_parts(family: dict, runtime: dict[str, Image.Image]) -> Image.Image:
    image, draw = board_base(
        f"05 - {family['label']} modular motion plan",
        "This board declares future child regions only; no production animation or actor cases are claimed.",
    )
    sprite = runtime["front"].resize((384, 512), Image.Resampling.NEAREST)
    image.paste(sprite, (150, 230), sprite)
    overlay = Image.new("RGBA", (384, 512))
    overlay_draw = ImageDraw.Draw(overlay, "RGBA")
    region_colors = [COLORS["cyan"], COLORS["green"], COLORS["violet"]]
    for color, (name, bounds) in zip(
        region_colors, family["motionRegions"].items()
    ):
        x1, y1, x2, y2 = [value * 4 for value in bounds]
        overlay_draw.rectangle((x1, y1, x2, y2), fill=(*color[:3], 55), outline=color, width=4)
    image.paste(overlay, (150, 230), overlay)
    draw.text((620, 210), "PLANNED COMPOSITION", font=font(22, True), fill=COLORS["ink"])
    y = 260
    for index, part in enumerate(family["parts"], 1):
        color = region_colors[(index - 1) % len(region_colors)]
        draw.rounded_rectangle((620, y - 6, 1480, y + 34), 9, fill=(*color[:3], 24))
        draw.text((640, y), f"{index:02d}  {part}", font=font(17), fill=COLORS["ink"])
        y += 54
    draw.text(
        (620, 790),
        "Shell / base pivot / footprint remain fixed in every future frame.",
        font=font(17, True),
        fill="#059669",
    )
    draw.text((620, 835), family["notes"], font=font(16), fill=COLORS["muted"])
    return image


def batch_lineup(runtime_by_family: dict[str, dict[str, Image.Image]]) -> Image.Image:
    image, draw = board_base(
        "00 - Facility 2x2x4 upsize batch lineup",
        "Four fresh front identities at one runtime scale; previous approved families remain untouched.",
    )
    stage = checker((1460, 750), 28)
    stage_draw = ImageDraw.Draw(stage, "RGBA")
    base_y = 640
    positions = [110, 440, 770, 1100]
    for family, x in zip(FAMILIES, positions):
        sprite = runtime_by_family[family["slug"]]["front"].resize(
            (288, 384), Image.Resampling.NEAREST
        )
        stage.paste(sprite, (x, base_y - 384), sprite)
        stage_draw.rectangle(
            (x + 48, base_y - 128, x + 240, base_y),
            outline=COLORS["footprint"],
            width=4,
        )
        stage_draw.text(
            (x + 20, 665),
            family["label"],
            font=font(17, True),
            fill=COLORS["ink"],
        )
    image.paste(stage, (70, 170))
    draw.text(
        (90, 900),
        "All: physical 2x2x4 | floor footprint 2x2 | render box 3x4 | visual orientations 4",
        font=font(19, True),
        fill=COLORS["ink"],
    )
    return image


def build(destination_root: Path) -> list[Path]:
    generated: list[Path] = []
    family_manifests: list[dict] = []
    runtime_by_family: dict[str, dict[str, Image.Image]] = {}
    for family in FAMILIES:
        views, ownership = extract_views(family)
        runtime: dict[str, Image.Image] = {}
        view_records = []
        for orientation, authoring in views.items():
            runtime_image = authoring.resize(RUNTIME_SIZE, Image.Resampling.LANCZOS)
            runtime[orientation] = runtime_image
            authoring_rel = (
                PROCESSED_REL
                / family["slug"]
                / "authoring"
                / f"{orientation}.png"
            )
            runtime_rel = (
                PROCESSED_REL / family["slug"] / "runtime" / f"{orientation}.png"
            )
            authoring_path = destination_root / authoring_rel
            runtime_path = destination_root / runtime_rel
            authoring_path.parent.mkdir(parents=True, exist_ok=True)
            runtime_path.parent.mkdir(parents=True, exist_ok=True)
            authoring.save(authoring_path, optimize=True)
            runtime_image.save(runtime_path, optimize=True)
            generated.extend([authoring_rel, runtime_rel])
            view_records.append(
                {
                    "orientation": orientation,
                    "authoring": {
                        "file": authoring_rel.as_posix(),
                        "sha256": sha256(authoring_path),
                        "size": list(AUTHORING_SIZE),
                    },
                    "runtime": {
                        "file": runtime_rel.as_posix(),
                        "sha256": sha256(runtime_path),
                        "size": list(RUNTIME_SIZE),
                    },
                    "sourceOwnership": next(
                        record
                        for record in ownership
                        if record["orientation"] == orientation
                    ),
                }
            )
        runtime_by_family[family["slug"]] = runtime

        review_images = [
            board_four_views(family, runtime),
            board_ownership(family, ownership),
            board_geometry(family, runtime),
            board_approaches(family, runtime),
            board_parts(family, runtime),
        ]
        review_names = [
            "01-four-side-clean.png",
            "02-alpha-source-ownership.png",
            "03-scale-geometry.png",
            "04-floor-approaches.png",
            "05-modular-motion-plan.png",
        ]
        review_records = []
        for name, image in zip(review_names, review_images):
            relative = REVIEW_REL / family["slug"] / name
            path = destination_root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            image.save(path, optimize=True)
            generated.append(relative)
            review_records.append(
                {
                    "path": relative.as_posix(),
                    "sha256": sha256(path),
                    "size": list(image.size),
                }
            )

        old_manifest = ROOT / family["supersedesAfterApproval"]
        source_chroma = ROOT / family["sourceChroma"]
        source_alpha = ROOT / family["sourceAlpha"]
        manifest = {
            "schemaVersion": 1,
            "id": family["id"],
            "familyId": family["familyId"],
            "revision": "generated-2x2x4-visual-preflight-r01",
            "status": "visual-preflight-owner-approved",
            "productionStage": "f3-owner-approved-production-authorized",
            "createdOn": "2026-07-30",
            "developmentOnly": True,
            "activeOfficePromotion": False,
            "supersedesAfterApproval": {
                "manifest": family["supersedesAfterApproval"],
                "manifestSha256": sha256(old_manifest),
                "currentGeometry": family["currentGeometry"],
                "oldPixelsUsed": False,
                "slotTransferBeforeF8": False,
            },
            "sourcePolicy": {
                "newBuiltInImageGeneration": True,
                "previousFamilyPixelReuse": False,
                "activeOfficePixelReuse": False,
                "processedForeignFamilyReuse": False,
                "generativeRepairAfterExtraction": False,
                "missingAssetFallback": False,
            },
            "imageGeneration": {
                "toolMode": "built-in-imagegen",
                "useCase": "stylized-concept",
                "generatedOn": "2026-07-30",
                "chromaKeyRemoval": (
                    "imagegen skill remove_chroma_key.py; auto-key border; "
                    "soft matte; thresholds 12/220; despill"
                ),
                "promptAuthority": DOC_REL.as_posix(),
            },
            "sources": {
                "chromaMaster": {
                    "file": family["sourceChroma"],
                    "sha256": sha256(source_chroma),
                    "size": list(Image.open(source_chroma).size),
                },
                "alphaMaster": {
                    "file": family["sourceAlpha"],
                    "sha256": sha256(source_alpha),
                    "size": list(Image.open(source_alpha).size),
                    "transparentCorners": True,
                    "visibleMagentaFringePixels": 0,
                },
                "cellLayout": {
                    "columns": 2,
                    "rows": 2,
                    "cellPixels": [SOURCE_CELL, SOURCE_CELL],
                    "orientationOrder": list(ORIENTATIONS),
                },
            },
            "render": {
                "physicalScale": {
                    "width": 2,
                    "depth": 2,
                    "height": 4,
                    "unit": "tile",
                },
                "footprint": {"width": 2, "depth": 2, "unit": "tile"},
                "renderBox": {"width": 3, "height": 4, "unit": "tile"},
                "authoringCanvas": list(AUTHORING_SIZE),
                "runtimeCanvas": list(RUNTIME_SIZE),
                "uniformIntegerDivisor": 4,
                "anchor": "bottom-center",
                "basePivotAuthoring": [192, 496],
                "basePivotRuntime": [48, 124],
                "sortPivotRuntime": [48, 124],
                "visualOrientations": list(ORIENTATIONS),
                "collisionChangesByOrientation": False,
            },
            "views": view_records,
            "interactionPreflight": {
                "capacityPerInstance": 1,
                "action": family["action"],
                "visualPose": family["visualPose"],
                "existingHeldProp": family["heldProp"],
                "newCoordinateSystem": False,
                "visualOrientationsCreated": list(ORIENTATIONS),
                "productionEnabledOrientations": [],
                "sideInteractionRequiresProductionProof": True,
                "sideSeatedPoseAvailable": (
                    False if family["kind"] == "seat" else None
                ),
                "plannedInstanceCount": family["plannedInstances"],
                "reservationSlotContribution": 0,
                "plannedReservationSlotsAfterF8": family["plannedSlots"],
            },
            "modularMotionPlan": {
                "parts": family["parts"],
                "declaredLocalRegionsRuntime": family["motionRegions"],
                "shellMustRemainImmutable": True,
                "basePivotMustRemainFixed": True,
                "sortPivotMustRemainFixed": True,
                "footprintMustRemainFixed": True,
                "seamLoopFramesBuilt": 0,
                "productionCasesBuilt": 0,
                "notes": family["notes"],
            },
            "validation": {
                "visualViewCount": 4,
                "sourceCellBoundaryTouchCount": 0,
                "unresolvedOwnershipCount": 0,
                "transparentCornerFailureCount": 0,
                "visibleMagentaFringePixels": 0,
                "nonUniformScaleCount": 0,
                "pivotMismatchCount": 0,
                "productionPoseCaseCount": 0,
                "productionOrientationCaseCount": 0,
            },
            "reviewOutputs": review_records,
            "gates": {
                "F0": {
                    "status": "passed",
                    "note": "Fresh generated source and no previous-family pixels.",
                },
                "F1": {
                    "status": "passed",
                    "note": "2x2x4 scale, 2x2 footprint, and 3x4 render box locked.",
                },
                "F2": {
                    "status": "passed",
                    "note": "Four source cells have isolated alpha ownership.",
                },
                "F3": {
                    "status": "passed",
                    "note": "Owner approved the exact four-side review hashes.",
                },
                "F4": {"status": "blocked"},
                "F5": {"status": "blocked"},
                "F6": {"status": "blocked"},
                "F7": {"status": "blocked"},
                "F8": {"status": "blocked"},
                "F9": {"status": "blocked"},
                "F10": {"status": "blocked"},
            },
            "permissions": {
                "visualOwnerReview": False,
                "productionBuild": True,
                "reservationSlotTransfer": False,
                "f9Replacement": False,
                "activeOfficePromotion": False,
            },
            "ownerDecision": {
                "decision": "approved",
                "decidedOn": "2026-07-30",
                "scope": "exact-family-review-output-hashes",
                "approvedReviewHashes": [
                    {
                        "path": review["path"],
                        "sha256": review["sha256"],
                    }
                    for review in review_records
                ],
                "notes": (
                    "Owner approved all four 2x2x4 candidates and authorized "
                    "the isolated F4-F8 production batch."
                ),
            },
        }
        manifest_rel = Path(family["manifest"])
        manifest_path = destination_root / manifest_rel
        save_json(manifest_path, manifest)
        generated.append(manifest_rel)
        family_manifests.append(
            {
                "id": family["id"],
                "label": family["label"],
                "manifest": manifest_rel.as_posix(),
                "sha256": sha256(manifest_path),
                "status": manifest["status"],
                "visualViewCount": 4,
                "plannedInstanceCount": family["plannedInstances"],
                "plannedReservationSlotsAfterF8": family["plannedSlots"],
            }
        )

    lineup = batch_lineup(runtime_by_family)
    lineup_rel = REVIEW_REL / "00-batch-2x2x4-lineup.png"
    lineup_path = destination_root / lineup_rel
    lineup_path.parent.mkdir(parents=True, exist_ok=True)
    lineup.save(lineup_path, optimize=True)
    generated.append(lineup_rel)

    counter_manifest_rel = (
        "assets/game/manifests/office-furniture-counter-bar-a01-r02.json"
    )
    current_f9_manifest_rel = (
        "assets/game/manifests/office-furniture-only-f9-v1.json"
    )
    batch_manifest = {
        "schemaVersion": 1,
        "id": "office.facility-upsize.2x2x4.preflight.v1",
        "status": "visual-preflight-owner-approved",
        "productionStage": "f3-owner-approved-production-authorized",
        "createdOn": "2026-07-30",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "scope": {
            "familyCount": 4,
            "visualViewCount": 16,
            "physicalScale": "2x2x4",
            "floorFootprint": "2x2",
            "renderBox": "3x4",
        },
        "families": family_manifests,
        "counterPolicy": {
            "manifest": counter_manifest_rel,
            "manifestSha256": sha256(ROOT / counter_manifest_rel),
            "status": "owner-approved-retained",
            "deleteAsset": False,
            "removeFromF9BeforeNewFamiliesPassF8": False,
            "plannedF9V2Placement": "retained-not-placed",
        },
        "slotPolicy": {
            "facilityV1ReadySlotsCurrent": 20,
            "newPreflightSlotContribution": 0,
            "plannedTransferredSlotsAfterAllF8": 5,
            "doubleCountOldAndNew": False,
        },
        "f9Policy": {
            "currentF9Manifest": current_f9_manifest_rel,
            "currentF9ManifestSha256": sha256(ROOT / current_f9_manifest_rel),
            "currentF9Changed": False,
            "plannedReplacement": "office.furniture-only-room.f9.v2",
            "workstationAnchorToPreserve": "C12",
            "workstationCountToPreserve": 10,
            "routeQueriesToRebuild": 200,
        },
        "reviewOutput": {
            "path": lineup_rel.as_posix(),
            "sha256": sha256(lineup_path),
            "size": list(lineup.size),
        },
        "gates": {
            "F3": {"status": "passed"},
            "F4": {"status": "blocked"},
            "F8": {"status": "blocked"},
            "F9": {"status": "blocked"},
            "F10": {"status": "blocked"},
        },
        "permissions": {
            "visualOwnerReview": False,
            "productionBuild": True,
            "f9Replacement": False,
            "activeOfficePromotion": False,
        },
        "ownerDecision": {
            "decision": "approved",
            "decidedOn": "2026-07-30",
            "scope": "exact-batch-lineup-and-family-review-hashes",
            "approvedReviewHashes": [
                {
                    "path": lineup_rel.as_posix(),
                    "sha256": sha256(lineup_path),
                }
            ],
            "approvedFamilyManifestHashes": [
                {
                    "manifest": family["manifest"],
                    "sha256": family["sha256"],
                }
                for family in family_manifests
            ],
            "notes": (
                "Owner approved Coffee C02, Water W02, Vending U02, and "
                "Massage R03 and authorized isolated F4-F8 production."
            ),
        },
    }
    batch_path = destination_root / BATCH_MANIFEST_REL
    save_json(batch_path, batch_manifest)
    generated.append(BATCH_MANIFEST_REL)
    return generated


def check() -> None:
    with tempfile.TemporaryDirectory(prefix="office-upsize-preflight-") as temporary:
        temporary_root = Path(temporary)
        expected = build(temporary_root)
        mismatches = []
        for relative in expected:
            generated = temporary_root / relative
            committed = ROOT / relative
            if not committed.exists() or generated.read_bytes() != committed.read_bytes():
                mismatches.append(relative.as_posix())
        expected_set = {relative.as_posix() for relative in expected}
        for family in FAMILIES:
            for directory in (
                PROCESSED_REL / family["slug"],
                REVIEW_REL / family["slug"],
            ):
                committed_dir = ROOT / directory
                if committed_dir.exists():
                    for path in committed_dir.rglob("*"):
                        if path.is_file():
                            relative = path.relative_to(ROOT).as_posix()
                            if relative not in expected_set:
                                mismatches.append(f"unexpected:{relative}")
        if mismatches:
            raise SystemExit(
                "Facility upsize visual preflight rebuild mismatch:\n"
                + "\n".join(mismatches)
            )
    print("Office Facility 2x2x4 visual preflight rebuild check passed.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.check:
        check()
        return
    for family in FAMILIES:
        for relative in (
            PROCESSED_REL / family["slug"],
            REVIEW_REL / family["slug"],
        ):
            path = ROOT / relative
            if path.exists():
                shutil.rmtree(path)
    lineup = ROOT / REVIEW_REL / "00-batch-2x2x4-lineup.png"
    if lineup.exists():
        lineup.unlink()
    generated = build(ROOT)
    print(
        f"Generated {len(generated)} Office Facility 2x2x4 preflight artifacts."
    )


if __name__ == "__main__":
    main()
