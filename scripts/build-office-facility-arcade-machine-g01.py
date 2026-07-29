"""Build the isolated Arcade Machine G01 visual preflight.

This producer intentionally stops before part decomposition, roster validation,
reservation simulation, F8 review, room composition, or Active Office import.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw

from office_facility_art import (
    BODY_FONT,
    HEADING_FONT,
    SMALL_FONT,
    TITLE_FONT,
    checkerboard,
    connected_components,
    draw_title,
    json_bytes,
    png_bytes,
    remove_magenta_chroma,
    sha256_bytes,
    sha256_file,
)

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "assets/game/manifests/office-facility-arcade-machine-g01.json"
AUDIT_PATH = ROOT / "assets/game/manifests/office-furniture-master-audit-v1.json"
FRONT_MASTER = ROOT / (
    "assets/art/layout-references/"
    "facility-lounge-sheet-modern-bright-v1-source.png"
)
LOOP_MASTER = ROOT / (
    "assets/art/layout-references/"
    "mechanical-loops-sheet-modern-bright-v1-source.png"
)
ACTIVE_OFFICE_BASELINE_SHA256 = {
    "apps/web/src/features/office/components/officeAssetRegistry.ts": (
        "1c8752653d8818e57564f28f61870ae3eddbdabc8e46229e1364c546ec7607ef"
    ),
    "assets/game/maps/office-c-v2.json": (
        "c40db448eb8e6d0f3fea67a41f716c0108aca63a4136cfad15293534273c618d"
    ),
    "apps/web/src/features/office/components/officeSceneRuntime.ts": (
        "87ba6dc8dfc9235ad3d7424d7321dcbd657576afb01fb1edbbc2a424c6c6ed93"
    ),
}
OUTPUT_ROOT = ROOT / (
    "assets/game/processed/office-facility-family-v1/arcade-machine-g01"
)
SOURCE_ROOT = OUTPUT_ROOT / "authoring/source"
RUNTIME_ROOT = OUTPUT_ROOT / "runtime/preflight"
REVIEW_ROOT = ROOT / (
    "assets/art/layout-references/office-facility-family-v1/"
    "arcade-machine-g01"
)

AUTHORING_CANVAS = (384, 384)
RUNTIME_CANVAS = (96, 96)
BOTTOM_PADDING = 32
FRONT_SOURCE_SHA256 = (
    "9c60ebe86d971b7af8be33b8f1ab07d005e83dd8e3af0e380379719ebe50a6b1"
)
LOOP_SOURCE_SHA256 = (
    "31109c9ecf2bc5b0f7d35caca821c77c29819fe19d73e895c88976e3d877274a"
)
AUDIT_PREFIX = "modern-bright-library-v1:"

FRONT_SPEC = {
    "frameId": "front",
    "auditRecordId": (
        f"{AUDIT_PREFIX}env-05-facility-lounge:machine.game.arcade.modern"
    ),
    "sourceBounds": (314, 627, 627, 940),
    "seed": (430, 800),
    "expectedBounds": (356, 638, 523, 926),
    "expectedPixels": 42762,
    "discardedOwner": "locker.bank.personal-15",
}
LOOP_SPECS = (
    {
        "frameId": "a",
        "auditRecordId": (
            f"{AUDIT_PREFIX}env-07-animated-mechanical:machine.arcade.loop.a"
        ),
        "sourceBounds": (0, 314, 314, 627),
        "seed": (170, 500),
        "expectedBounds": (68, 362, 278, 627),
        "expectedPixels": 51259,
    },
    {
        "frameId": "b",
        "auditRecordId": (
            f"{AUDIT_PREFIX}env-07-animated-mechanical:machine.arcade.loop.b"
        ),
        "sourceBounds": (314, 314, 627, 627),
        "seed": (470, 500),
        "expectedBounds": (368, 362, 579, 627),
        "expectedPixels": 51096,
    },
    {
        "frameId": "c",
        "auditRecordId": (
            f"{AUDIT_PREFIX}env-07-animated-mechanical:machine.arcade.loop.c"
        ),
        "sourceBounds": (627, 314, 940, 627),
        "seed": (780, 500),
        "expectedBounds": (670, 362, 882, 627),
        "expectedPixels": 51590,
    },
    {
        "frameId": "d",
        "auditRecordId": (
            f"{AUDIT_PREFIX}env-07-animated-mechanical:machine.arcade.loop.d"
        ),
        "sourceBounds": (940, 314, 1254, 627),
        "seed": (1080, 500),
        "expectedBounds": (972, 362, 1184, 627),
        "expectedPixels": 51355,
    },
)
SIDE_RECORDS = (
    f"{AUDIT_PREFIX}env-12-facility-side-orientations:"
    "machine.game.arcade.modern.side-left",
    f"{AUDIT_PREFIX}env-12-facility-side-orientations:"
    "machine.game.arcade.modern.side-right",
)

PROCESSED_PATHS = {
    "frontKeyed": SOURCE_ROOT / "facility-lounge-master.keyed.png",
    "frontMask": SOURCE_ROOT / "arcade-front.full-master-ownership-mask.png",
    "frontCutout": SOURCE_ROOT / "arcade-front.source.png",
    "loopKeyed": SOURCE_ROOT / "mechanical-loops-master.keyed.png",
    "loopMask": SOURCE_ROOT / "arcade-loops.full-master-ownership-mask.png",
    "runtimeFront": RUNTIME_ROOT / "arcade-front.png",
}
for spec in LOOP_SPECS:
    PROCESSED_PATHS[f"loop{spec['frameId'].upper()}"] = (
        SOURCE_ROOT / f"arcade-screen-source-{spec['frameId']}.png"
    )

REVIEW_SPECS = (
    ("01-source-ownership.png", (1800, 1100)),
    ("02-clean-front-alpha.png", (1600, 1000)),
    ("03-scale-actor-1x1x3.png", (1500, 950)),
    ("04-footprint-render-box.png", (1400, 950)),
    ("05-floor-approach-preview.png", (1600, 950)),
)
REVIEW_PATHS = tuple(REVIEW_ROOT / name for name, _ in REVIEW_SPECS)


def repo_path(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def intersect_area(
    first: tuple[int, int, int, int],
    second: tuple[int, int, int, int],
) -> int:
    left = max(first[0], second[0])
    top = max(first[1], second[1])
    right = min(first[2], second[2])
    bottom = min(first[3], second[3])
    return max(0, right - left) * max(0, bottom - top)


def component_for_seed(
    components: list[dict[str, Any]],
    seed: tuple[int, int],
    width: int,
) -> dict[str, Any]:
    index = seed[1] * width + seed[0]
    for component in components:
        if index in component["points"]:
            return component
    raise ValueError(f"No connected component owns source seed {seed}")


def component_layer(
    source: Image.Image,
    component: dict[str, Any],
) -> Image.Image:
    output = Image.new("RGBA", source.size, (0, 0, 0, 0))
    source_pixels = source.load()
    output_pixels = output.load()
    for index in component["points"]:
        x = index % source.width
        y = index // source.width
        output_pixels[x, y] = source_pixels[x, y]
    return output


def normalize_component(
    layer: Image.Image,
) -> Image.Image:
    bounds = layer.getbbox()
    if bounds is None:
        raise ValueError("Selected component is empty")
    subject = layer.crop(bounds)
    left = (AUTHORING_CANVAS[0] - subject.width) // 2
    top = AUTHORING_CANVAS[1] - BOTTOM_PADDING - subject.height
    if min(left, top, AUTHORING_CANVAS[0] - left - subject.width) < 32:
        raise ValueError(
            f"Arcade component lacks preflight padding: "
            f"subject={subject.size}, left={left}, top={top}"
        )
    output = Image.new("RGBA", AUTHORING_CANVAS, (0, 0, 0, 0))
    output.alpha_composite(subject, (left, top))
    return output


def touches_cell_boundary(
    component: dict[str, Any],
    bounds: tuple[int, int, int, int],
    width: int,
) -> bool:
    left, top, right, bottom = bounds
    for index in component["points"]:
        x = index % width
        y = index // width
        if not (left <= x < right and top <= y < bottom):
            continue
        if x in (left, right - 1) or y in (top, bottom - 1):
            return True
    return False


def ownership_record(
    spec: dict[str, Any],
    source: Image.Image,
    components: list[dict[str, Any]],
    audit_by_id: dict[str, dict[str, Any]],
    cutout_path: Path,
    discarded_owner: str,
) -> tuple[dict[str, Any], dict[str, bytes | Image.Image]]:
    audit = audit_by_id.get(spec["auditRecordId"])
    if audit is None:
        raise ValueError(f"Missing audit record: {spec['auditRecordId']}")
    decision = audit.get("currentDecision", {})
    if (
        decision.get("decision") != "salvage-full-master-and-decompose"
        or decision.get("masterPixelsSalvageable") is not True
        or tuple(audit.get("sourceBounds", ())) != spec["sourceBounds"]
        or audit.get("orientation") != "front"
    ):
        raise ValueError(f"Audit authority changed: {spec['auditRecordId']}")
    selected = component_for_seed(components, spec["seed"], source.width)
    if (
        tuple(selected["bounds"]) != spec["expectedBounds"]
        or selected["pixelCount"] != spec["expectedPixels"]
    ):
        raise ValueError(
            f"Selected ownership changed for {spec['frameId']}: "
            f"{selected['bounds']} / {selected['pixelCount']}"
        )
    selected_layer = component_layer(source, selected)
    normalized = normalize_component(selected_layer)
    normalized_bytes = png_bytes(normalized)
    discarded = []
    for component in components:
        if component is selected:
            continue
        if intersect_area(component["bounds"], spec["sourceBounds"]) <= 0:
            continue
        discarded.append(
            {
                "fullMasterBounds": list(component["bounds"]),
                "pixelCount": component["pixelCount"],
                "ownerFamilyId": discarded_owner,
                "reason": (
                    "Full-master connectivity places this component outside "
                    "the Arcade identity and links it to the adjacent audited family."
                ),
            }
        )
    if not discarded:
        raise ValueError(
            f"No neighboring component was proven for {spec['frameId']}"
        )
    full_bounds = selected["bounds"]
    touches_master = (
        full_bounds[0] == 0
        or full_bounds[1] == 0
        or full_bounds[2] == source.width
        or full_bounds[3] == source.height
    )
    if touches_master:
        raise ValueError(f"Arcade source touches master boundary: {spec['frameId']}")
    record = {
        "frameId": spec["frameId"],
        "auditRecordId": spec["auditRecordId"],
        "sourceBounds": list(spec["sourceBounds"]),
        "selectedComponent": {
            "seed": list(spec["seed"]),
            "fullMasterBounds": list(full_bounds),
            "pixelCount": selected["pixelCount"],
            "touchesNominalCellBoundary": touches_cell_boundary(
                selected,
                spec["sourceBounds"],
                source.width,
            ),
            "touchesMasterBoundary": False,
            "sourcePixelsResampled": False,
            "authoringCutout": repo_path(cutout_path),
            "authoringCutoutSha256": sha256_bytes(normalized_bytes),
        },
        "discardedComponents": discarded,
    }
    return record, {
        "bytes": normalized_bytes,
        "normalized": normalized,
        "selectedLayer": selected_layer,
        "selected": selected,
        "discarded": discarded,
    }


def ownership_mask(
    size: tuple[int, int],
    selected_components: list[dict[str, Any]],
    discarded_components: list[dict[str, Any]],
    width: int,
) -> Image.Image:
    output = Image.new("RGBA", size, (0, 0, 0, 0))
    pixels = output.load()
    for component in discarded_components:
        for index in component["points"]:
            pixels[index % width, index // width] = (236, 73, 85, 210)
    for component in selected_components:
        for index in component["points"]:
            pixels[index % width, index // width] = (54, 211, 153, 230)
    return output


def find_discarded_components(
    components: list[dict[str, Any]],
    selected: set[int],
    cells: list[tuple[int, int, int, int]],
) -> list[dict[str, Any]]:
    return [
        component
        for component in components
        if id(component) not in selected
        and any(intersect_area(component["bounds"], cell) > 0 for cell in cells)
    ]


def alpha_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    bounds = image.getbbox()
    if bounds is None:
        raise ValueError("Expected visible alpha")
    return bounds


def draw_wrapped(
    draw: ImageDraw.ImageDraw,
    text: str,
    box: tuple[int, int, int, int],
    *,
    fill: tuple[int, int, int, int] = (41, 55, 72, 255),
    font=BODY_FONT,
    line_height: int = 28,
) -> None:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=font)[2] <= box[2] - box[0]:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    y = box[1]
    for line in lines:
        if y + line_height > box[3]:
            break
        draw.text((box[0], y), line, font=font, fill=fill)
        y += line_height


def framed_panel(
    image: Image.Image,
    box: tuple[int, int, int, int],
    heading: str,
) -> tuple[ImageDraw.ImageDraw, tuple[int, int, int, int]]:
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle(box, radius=18, fill=(247, 249, 252, 255),
                           outline=(174, 188, 203, 255), width=2)
    draw.text((box[0] + 20, box[1] + 16), heading, font=HEADING_FONT,
              fill=(28, 52, 76, 255))
    return draw, (box[0] + 20, box[1] + 62, box[2] - 20, box[3] - 20)


def source_thumbnail(
    source: Image.Image,
    cells: list[tuple[int, int, int, int]],
    selected_bounds: list[tuple[int, int, int, int]],
    discarded_bounds: list[tuple[int, int, int, int]],
    box: tuple[int, int, int, int],
) -> Image.Image:
    thumb = source.convert("RGBA").resize(
        (box[2] - box[0], box[3] - box[1]),
        Image.Resampling.BILINEAR,
    )
    draw = ImageDraw.Draw(thumb)
    sx = thumb.width / source.width
    sy = thumb.height / source.height
    def outline(bounds: tuple[int, int, int, int], color, width: int) -> None:
        mapped = (
            round(bounds[0] * sx),
            round(bounds[1] * sy),
            round(bounds[2] * sx),
            round(bounds[3] * sy),
        )
        draw.rectangle(mapped, outline=color, width=width)

    for cell in cells:
        outline(cell, (68, 171, 247, 255), 4)
    for bounds in discarded_bounds:
        outline(bounds, (236, 73, 85, 255), 5)
    for bounds in selected_bounds:
        outline(bounds, (54, 211, 153, 255), 6)
    return thumb


def board_source_ownership(
    front_master: Image.Image,
    loop_master: Image.Image,
    front_record: dict[str, Any],
    loop_records: list[dict[str, Any]],
) -> Image.Image:
    image = Image.new("RGBA", (1800, 1100), (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Arcade Machine G01 — Source Ownership",
        "Visual preflight only · full original masters · selected green / neighbor red",
    )
    _, left = framed_panel(image, (40, 120, 880, 850), "Static identity front")
    _, right = framed_panel(image, (920, 120, 1760, 850), "Screen source frames A–D")
    front_thumb = source_thumbnail(
        front_master,
        [tuple(front_record["sourceBounds"])],
        [tuple(front_record["selectedComponent"]["fullMasterBounds"])],
        [
            tuple(component["fullMasterBounds"])
            for component in front_record["discardedComponents"]
        ],
        (left[0], left[1], left[2], left[1] + 650),
    )
    image.alpha_composite(front_thumb, (left[0], left[1]))
    loop_thumb = source_thumbnail(
        loop_master,
        [tuple(record["sourceBounds"]) for record in loop_records],
        [
            tuple(record["selectedComponent"]["fullMasterBounds"])
            for record in loop_records
        ],
        [
            tuple(component["fullMasterBounds"])
            for record in loop_records
            for component in record["discardedComponents"]
        ],
        (right[0], right[1], right[2], right[1] + 650),
    )
    image.alpha_composite(loop_thumb, (right[0], right[1]))
    draw.rectangle((50, 878, 1750, 1060), fill=(247, 249, 252, 255),
                   outline=(174, 188, 203, 255), width=2)
    draw.text((75, 900), "Ownership result", font=HEADING_FONT,
              fill=(28, 52, 76, 255))
    message = (
        "The full-master component containing the audited Arcade seed is retained. "
        "The second static-cell component belongs to the neighboring locker bank. "
        "The upper fragments intersecting A–D belong to the preceding vending row. "
        "No processed crop or rejected side orientation is an input."
    )
    draw_wrapped(draw, message, (75, 942, 1715, 1040), line_height=30)
    return image


def board_clean_alpha(
    front: Image.Image,
    loops: list[Image.Image],
) -> Image.Image:
    image = Image.new("RGBA", (1600, 1000), (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Arcade Machine G01 — Clean Front and Alpha",
        "Source-exact authoring cutout · no shell repaint · A–D remain source evidence",
    )
    _, clean_box = framed_panel(image, (40, 120, 780, 950), "Clean front")
    background = checkerboard((640, 640), 24)
    enlarged = front.resize((640, 640), Image.Resampling.NEAREST)
    background.alpha_composite(enlarged)
    image.alpha_composite(background, (clean_box[0] + 25, clean_box[1] + 15))
    bounds = alpha_bounds(front)
    draw.text(
        (clean_box[0] + 25, clean_box[1] + 675),
        f"Authoring canvas 384×384 · alpha bounds {bounds} · bottom padding 32",
        font=SMALL_FONT,
        fill=(52, 70, 88, 255),
    )
    _, loop_box = framed_panel(image, (820, 120, 1560, 950), "Audited A–D source cutouts")
    for index, loop in enumerate(loops):
        x = loop_box[0] + (index % 2) * 330
        y = loop_box[1] + (index // 2) * 310
        check = checkerboard((260, 260), 16)
        check.alpha_composite(loop.resize((260, 260), Image.Resampling.NEAREST))
        image.alpha_composite(check, (x, y))
        draw.text((x + 10, y + 266), chr(65 + index), font=HEADING_FONT,
                  fill=(28, 52, 76, 255))
    draw_wrapped(
        draw,
        "These loop cutouts prove source ownership only. Their cabinets and "
        "controls are forbidden from the future runtime family; only a measured "
        "screen-content viewport may be considered after silhouette approval.",
        (loop_box[0], loop_box[1] + 650, loop_box[2], loop_box[3]),
        font=SMALL_FONT,
        line_height=22,
    )
    return image


def draw_mannequin(
    image: Image.Image,
    origin: tuple[int, int],
    scale: int,
) -> None:
    draw = ImageDraw.Draw(image)
    x, baseline = origin
    head_radius = 5 * scale
    draw.ellipse(
        (
            x - head_radius,
            baseline - 92 * scale,
            x + head_radius,
            baseline - 82 * scale,
        ),
        fill=(67, 99, 128, 210),
    )
    draw.rounded_rectangle(
        (
            x - 8 * scale,
            baseline - 80 * scale,
            x + 8 * scale,
            baseline - 34 * scale,
        ),
        radius=3 * scale,
        fill=(84, 120, 151, 210),
    )
    draw.rectangle(
        (x - 8 * scale, baseline - 34 * scale, x - 2 * scale, baseline),
        fill=(67, 99, 128, 210),
    )
    draw.rectangle(
        (x + 2 * scale, baseline - 34 * scale, x + 8 * scale, baseline),
        fill=(67, 99, 128, 210),
    )


def board_scale(runtime_front: Image.Image) -> Image.Image:
    image = Image.new("RGBA", (1500, 950), (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Arcade Machine G01 — 1× Scale Preflight",
        "Canonical adult 1×1×3 · machine 2×2×3 · render envelope 3×3",
    )
    draw.rectangle((80, 150, 1420, 820), fill=(247, 249, 252, 255),
                   outline=(174, 188, 203, 255), width=2)
    baseline = 710
    scale = 5
    for tile in range(4):
        y = baseline - tile * 32 * scale
        draw.line((120, y, 1375, y), fill=(203, 212, 222, 255), width=2)
        draw.text((90, y - 10), f"{tile}", font=SMALL_FONT,
                  fill=(88, 105, 123, 255))
    arcade = runtime_front.resize((96 * scale, 96 * scale),
                                  Image.Resampling.NEAREST)
    image.alpha_composite(arcade, (650, baseline - 96 * scale))
    draw_mannequin(image, (390, baseline), scale)
    draw.rectangle(
        (390 - 16 * scale, baseline - 96 * scale,
         390 + 16 * scale, baseline),
        outline=(67, 99, 128, 255),
        width=3,
    )
    draw.rectangle(
        (650, baseline - 96 * scale, 650 + 96 * scale, baseline),
        outline=(54, 138, 198, 255),
        width=3,
    )
    draw.text((235, 755), "Neutral adult physical ruler", font=HEADING_FONT,
              fill=(28, 52, 76, 255))
    draw.text((760, 755), "Arcade inside 3×3 render box", font=HEADING_FONT,
              fill=(28, 52, 76, 255))
    draw_wrapped(
        draw,
        "The master front is intentionally shown without width stretching. "
        "Owner review decides whether this source-exact silhouette has enough "
        "visual bulk for the locked 2×2 footprint.",
        (160, 845, 1350, 925),
        line_height=28,
    )
    return image


def board_geometry(runtime_front: Image.Image) -> Image.Image:
    image = Image.new("RGBA", (1400, 950), (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Arcade Machine G01 — Footprint and Render Box",
        "Collision geometry is independent from alpha and render overflow",
    )
    _, top_down = framed_panel(image, (40, 120, 680, 900), "Top-down world cells")
    tile = 120
    origin = (top_down[0] + 110, top_down[1] + 110)
    for y in range(4):
        for x in range(3):
            box = (
                origin[0] + x * tile,
                origin[1] + y * tile,
                origin[0] + (x + 1) * tile,
                origin[1] + (y + 1) * tile,
            )
            fill = (102, 184, 222, 165) if x < 2 and y < 2 else (243, 246, 249, 255)
            draw.rectangle(box, fill=fill, outline=(117, 137, 157, 255), width=2)
            draw.text((box[0] + 9, box[1] + 8), f"({x},{y})",
                      font=SMALL_FONT, fill=(52, 70, 88, 255))
    draw.rectangle(
        (origin[0], origin[1], origin[0] + 2 * tile, origin[1] + 2 * tile),
        outline=(28, 116, 171, 255),
        width=6,
    )
    pivot = (origin[0] + tile, origin[1] + 2 * tile)
    draw.ellipse((pivot[0] - 10, pivot[1] - 10, pivot[0] + 10, pivot[1] + 10),
                 fill=(236, 100, 75, 255))
    draw.text((origin[0], origin[1] + 4 * tile + 35),
              "Blue = 2×2 floor footprint · red = base/sort pivot (1,2)",
              font=SMALL_FONT, fill=(52, 70, 88, 255))
    _, elevation = framed_panel(image, (720, 120, 1360, 900), "Front render envelope")
    scale = 5
    grid_left = elevation[0] + 70
    grid_top = elevation[1] + 95
    for y in range(4):
        draw.line(
            (grid_left, grid_top + y * 32 * scale,
             grid_left + 96 * scale, grid_top + y * 32 * scale),
            fill=(180, 192, 204, 255),
            width=2,
        )
    for x in range(4):
        draw.line(
            (grid_left + x * 32 * scale, grid_top,
             grid_left + x * 32 * scale, grid_top + 96 * scale),
            fill=(180, 192, 204, 255),
            width=2,
        )
    arcade = runtime_front.resize((96 * scale, 96 * scale),
                                  Image.Resampling.NEAREST)
    image.alpha_composite(arcade, (grid_left, grid_top))
    draw.rectangle((grid_left, grid_top, grid_left + 96 * scale,
                    grid_top + 96 * scale), outline=(54, 138, 198, 255), width=5)
    draw_wrapped(
        draw,
        "The 3×3 render envelope does not expand the collision footprint. "
        "The source remains bottom-centered and uniformly reduced 4:1.",
        (elevation[0] + 40, elevation[3] - 82, elevation[2] - 40, elevation[3]),
        font=SMALL_FONT,
        line_height=23,
    )
    return image


def board_floor_preview(runtime_front: Image.Image) -> Image.Image:
    image = Image.new("RGBA", (1600, 950), (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Arcade Machine G01 — Neutral Floor and Front Approach",
        "Preflight placement only · no reservation simulation · no room import",
    )
    draw.rectangle((45, 120, 1555, 900), fill=(247, 249, 252, 255),
                   outline=(174, 188, 203, 255), width=2)
    tile = 112
    origin = (190, 210)
    colors = {
        "footprint": (105, 186, 222, 175),
        "stand": (80, 196, 137, 180),
        "approach": (247, 190, 72, 180),
        "exit": (171, 132, 220, 180),
    }
    for y in range(5):
        for x in range(4):
            role = None
            if x < 2 and y < 2:
                role = "footprint"
            elif (x, y) == (1, 2):
                role = "stand"
            elif (x, y) == (1, 3):
                role = "approach"
            elif (x, y) == (0, 3):
                role = "exit"
            box = (
                origin[0] + x * tile,
                origin[1] + y * tile,
                origin[0] + (x + 1) * tile,
                origin[1] + (y + 1) * tile,
            )
            draw.rectangle(box, fill=colors.get(role, (239, 243, 247, 255)),
                           outline=(135, 151, 167, 255), width=2)
            if role:
                draw.text((box[0] + 10, box[1] + 10), role,
                          font=SMALL_FONT, fill=(39, 55, 70, 255))
    large = runtime_front.resize((96 * 4, 96 * 4), Image.Resampling.NEAREST)
    image.alpha_composite(large, (850, 376))
    draw_mannequin(image, (1235, 760), 4)
    draw.line((740, 760, 1440, 760), fill=(92, 110, 128, 255), width=4)
    draw.text((820, 785), "Machine", font=HEADING_FONT,
              fill=(28, 52, 76, 255))
    draw.text((1150, 785), "Neutral standing actor", font=HEADING_FONT,
              fill=(28, 52, 76, 255))
    legend_y = 850
    for index, (name, color) in enumerate(colors.items()):
        x = 130 + index * 350
        draw.rectangle((x, legend_y, x + 36, legend_y + 36), fill=color)
        draw.text((x + 50, legend_y + 6), name, font=BODY_FONT,
                  fill=(39, 55, 70, 255))
    return image


def build_outputs() -> dict[Path, bytes]:
    import json

    audit = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))
    audit_by_id = {
        record["recordId"]: record
        for record in audit["records"]
    }
    for record_id in SIDE_RECORDS:
        decision = audit_by_id.get(record_id, {}).get("currentDecision", {})
        if (
            decision.get("decision")
            != "reject-regenerate-orientation-if-required"
            or decision.get("masterPixelsSalvageable") is not False
        ):
            raise ValueError(f"Rejected side authority changed: {record_id}")
    if sha256_file(FRONT_MASTER) != FRONT_SOURCE_SHA256:
        raise ValueError("Facility lounge original master hash changed")
    if sha256_file(LOOP_MASTER) != LOOP_SOURCE_SHA256:
        raise ValueError("Mechanical loops original master hash changed")

    front_master = Image.open(FRONT_MASTER).convert("RGBA")
    loop_master = Image.open(LOOP_MASTER).convert("RGBA")
    front_keyed, _, _ = remove_magenta_chroma(front_master)
    loop_keyed, _, _ = remove_magenta_chroma(loop_master)
    front_components = connected_components(front_keyed)
    loop_components = connected_components(loop_keyed)

    front_record, front_art = ownership_record(
        FRONT_SPEC,
        front_keyed,
        front_components,
        audit_by_id,
        PROCESSED_PATHS["frontCutout"],
        FRONT_SPEC["discardedOwner"],
    )
    loop_records = []
    loop_art = []
    for spec in LOOP_SPECS:
        record, art = ownership_record(
            spec,
            loop_keyed,
            loop_components,
            audit_by_id,
            PROCESSED_PATHS[f"loop{spec['frameId'].upper()}"],
            "vending.machine.modern",
        )
        loop_records.append(record)
        loop_art.append(art)

    front_selected = [front_art["selected"]]
    loop_selected = [art["selected"] for art in loop_art]
    front_discarded = find_discarded_components(
        front_components,
        {id(component) for component in front_selected},
        [FRONT_SPEC["sourceBounds"]],
    )
    loop_discarded = find_discarded_components(
        loop_components,
        {id(component) for component in loop_selected},
        [spec["sourceBounds"] for spec in LOOP_SPECS],
    )
    front_mask = ownership_mask(
        front_keyed.size,
        front_selected,
        front_discarded,
        front_keyed.width,
    )
    loop_mask = ownership_mask(
        loop_keyed.size,
        loop_selected,
        loop_discarded,
        loop_keyed.width,
    )
    front_normalized = front_art["normalized"]
    runtime_front = front_normalized.resize(
        RUNTIME_CANVAS,
        Image.Resampling.NEAREST,
    )

    boards = (
        board_source_ownership(
            front_master,
            loop_master,
            front_record,
            loop_records,
        ),
        board_clean_alpha(
            front_normalized,
            [art["normalized"] for art in loop_art],
        ),
        board_scale(runtime_front),
        board_geometry(runtime_front),
        board_floor_preview(runtime_front),
    )
    outputs: dict[Path, bytes] = {
        PROCESSED_PATHS["frontKeyed"]: png_bytes(front_keyed),
        PROCESSED_PATHS["frontMask"]: png_bytes(front_mask),
        PROCESSED_PATHS["frontCutout"]: front_art["bytes"],
        PROCESSED_PATHS["loopKeyed"]: png_bytes(loop_keyed),
        PROCESSED_PATHS["loopMask"]: png_bytes(loop_mask),
        PROCESSED_PATHS["runtimeFront"]: png_bytes(runtime_front),
    }
    for spec, art in zip(LOOP_SPECS, loop_art, strict=True):
        outputs[PROCESSED_PATHS[f"loop{spec['frameId'].upper()}"]] = art["bytes"]
    for path, board in zip(REVIEW_PATHS, boards, strict=True):
        outputs[path] = png_bytes(board)

    front_keyed_bytes = outputs[PROCESSED_PATHS["frontKeyed"]]
    front_mask_bytes = outputs[PROCESSED_PATHS["frontMask"]]
    loop_keyed_bytes = outputs[PROCESSED_PATHS["loopKeyed"]]
    loop_mask_bytes = outputs[PROCESSED_PATHS["loopMask"]]
    source_records = [
        {
            "role": "static-front",
            "path": repo_path(FRONT_MASTER),
            "sha256": FRONT_SOURCE_SHA256,
            "auditManifest": repo_path(AUDIT_PATH),
            "auditManifestSha256": sha256_file(AUDIT_PATH),
            "extractionMethod": "full-master-component-ownership",
            "keyedSource": {
                "file": repo_path(PROCESSED_PATHS["frontKeyed"]),
                "sha256": sha256_bytes(front_keyed_bytes),
            },
            "ownershipMask": {
                "file": repo_path(PROCESSED_PATHS["frontMask"]),
                "sha256": sha256_bytes(front_mask_bytes),
            },
            "records": [front_record],
        },
        {
            "role": "screen-frame-source",
            "path": repo_path(LOOP_MASTER),
            "sha256": LOOP_SOURCE_SHA256,
            "auditManifest": repo_path(AUDIT_PATH),
            "auditManifestSha256": sha256_file(AUDIT_PATH),
            "extractionMethod": "full-master-component-ownership",
            "keyedSource": {
                "file": repo_path(PROCESSED_PATHS["loopKeyed"]),
                "sha256": sha256_bytes(loop_keyed_bytes),
            },
            "ownershipMask": {
                "file": repo_path(PROCESSED_PATHS["loopMask"]),
                "sha256": sha256_bytes(loop_mask_bytes),
            },
            "records": loop_records,
        },
    ]
    review_evidence = [
        {
            "path": repo_path(path),
            "sha256": sha256_bytes(outputs[path]),
            "size": list(size),
        }
        for path, (_, size) in zip(REVIEW_PATHS, REVIEW_SPECS, strict=True)
    ]
    preflight_paths = [repo_path(path) for path in REVIEW_PATHS]
    blocked = lambda reason: {"status": "blocked", "evidence": [reason]}
    manifest = {
        "schemaVersion": 1,
        "id": "office.facility.arcade-machine.g01",
        "familyId": "machine.game.arcade.modern",
        "revision": "g01-preflight-r01",
        "status": "visual-preflight-owner-review",
        "productionStage": "visual-preflight",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "plannedInteractionMode": "machine-local-controls",
        "plannedHeldProp": False,
        "sourcePolicy": {
            "processedCropDirectReuse": False,
            "activeOfficePixelReuse": False,
            "legacyOrRejectedPixelReuse": False,
            "sideOrientationReuse": False,
            "generativeRepair": False,
            "missingAssetFallback": False,
            "allowlist": [repo_path(FRONT_MASTER), repo_path(LOOP_MASTER)],
        },
        "sources": source_records,
        "render": {
            "physicalScale": {
                "width": 2, "depth": 2, "height": 3, "unit": "tile",
            },
            "footprint": {"width": 2, "depth": 2, "unit": "tile"},
            "renderBox": {"width": 3, "height": 3, "unit": "tile"},
            "authoringCanvas": list(AUTHORING_CANVAS),
            "runtimeCanvas": list(RUNTIME_CANVAS),
            "uniformIntegerDivisor": 4,
            "nonUniformScaling": False,
            "anchor": "bottom-center",
            "requiredOrientations": ["front"],
            "basePivot": {"x": 1, "y": 2, "unit": "tile"},
            "sortPivot": {"x": 1, "y": 2, "unit": "tile"},
        },
        "interactionPreview": {
            "capacity": 1,
            "visualPose": "interact-front",
            "action": "play-arcade-machine",
            "frontApproachCells": 1,
            "stand": {"x": 1, "y": 2},
            "approach": {"x": 1, "y": 3},
            "exit": {"x": 0, "y": 3},
            "heldController": False,
            "reservationSimulationBuilt": False,
            "rosterCasesBuilt": 0,
        },
        "preflightAssets": {
            "runtimeFront": {
                "file": repo_path(PROCESSED_PATHS["runtimeFront"]),
                "sha256": sha256_bytes(outputs[PROCESSED_PATHS["runtimeFront"]]),
                "size": list(RUNTIME_CANVAS),
            },
            "runtimeAlphaBounds": list(alpha_bounds(runtime_front)),
        },
        "gates": {
            "F0": {
                "status": "passed",
                "evidence": [repo_path(AUDIT_PATH), preflight_paths[0]],
            },
            "F1": {
                "status": "passed",
                "evidence": preflight_paths[2:5],
            },
            "F2": {
                "status": "passed",
                "evidence": [preflight_paths[0], preflight_paths[1]],
            },
            "F3": {
                "status": "passed",
                "evidence": [preflight_paths[0], preflight_paths[1]],
            },
            "F4": blocked("Part decomposition waits for visual approval."),
            "F5": blocked("Production sockets wait for visual approval."),
            "F6": blocked("Reservation and interaction wait for visual approval."),
            "F7": blocked("The 108-case isolated lab is outside preflight scope."),
            "F8": blocked("F8 has not started; visual approval comes first."),
            "F9": blocked("No furniture-only room composition is in G01 preflight."),
            "F10": blocked("Active Office promotion is forbidden in G01 preflight."),
        },
        "reviewOutputs": preflight_paths,
        "reviewEvidence": review_evidence,
        "visualApproval": None,
        "permissions": {
            "ownerReview": True,
            "fullSystemBuild": False,
            "furnitureOnlyRoom": False,
            "activeOfficePromotion": False,
        },
        "activeOfficeEvidence": [
            {
                "file": file,
                "sha256": sha256,
                "importsCandidate": False,
            }
            for file, sha256 in ACTIVE_OFFICE_BASELINE_SHA256.items()
        ],
    }
    outputs[MANIFEST_PATH] = json_bytes(manifest)
    return outputs


def write_outputs(outputs: dict[Path, bytes]) -> None:
    for path, content in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)


def check_outputs(outputs: dict[Path, bytes]) -> list[str]:
    failures = []
    for path, expected in outputs.items():
        if not path.exists():
            failures.append(f"Missing generated output: {repo_path(path)}")
        elif path.read_bytes() != expected:
            failures.append(f"Stale generated output: {repo_path(path)}")
    expected_paths = set(outputs)
    for directory in (OUTPUT_ROOT, REVIEW_ROOT):
        if not directory.exists():
            continue
        for path in directory.rglob("*"):
            if path.is_file() and path not in expected_paths:
                failures.append(f"Unexpected generated output: {repo_path(path)}")
    return failures


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    parser.add_argument(
        "--stage",
        choices=("preflight", "full"),
        default="preflight",
    )
    args = parser.parse_args()
    if args.stage == "full":
        print(
            "Arcade G01 full production is locked until visualApproval is recorded.",
            file=sys.stderr,
        )
        raise SystemExit(2)
    outputs = build_outputs()
    if args.check:
        failures = check_outputs(outputs)
        if failures:
            print("\n".join(failures), file=sys.stderr)
            raise SystemExit(1)
        print(
            "Arcade G01 preflight OK: two original-master authorities, "
            "five ownership-proven cutouts, five review boards, and F4-F10 blocked."
        )
        return
    write_outputs(outputs)
    print(f"Wrote {len(outputs)} Arcade G01 visual-preflight files.")
    print(f"Manifest: {repo_path(MANIFEST_PATH)}")
    print("Status: awaiting visual approval; full production remains locked.")


if __name__ == "__main__":
    main()
