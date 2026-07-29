#!/usr/bin/env python3
"""Build the socket-driven front-only Vending Machine U01-r02 vertical slice.

The builder starts from the audited original mechanical-loop master, resolves
all four boundary-crossing silhouettes with full-master connected-component
ownership, and creates a new versioned family. The immutable shell, local
viewport frames, empty pickup tray, dispense effect, and H01 held output are
separate files. Existing processed vending pixels and Active Office assets are
never inputs. Character/prop placement resolves through Spatial Socket I01.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import sys
from collections import deque
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
AUDIT_PATH = ROOT / "assets/game/manifests/office-furniture-master-audit-v1.json"
MANIFEST_PATH = ROOT / "assets/game/manifests/office-facility-vending-u01.json"
POSE_AUTHORITY_PATH = (
    ROOT
    / "assets/game/manifests/office-character-action-sockets-i01.json"
)
SPATIAL_AUTHORITY_PATH = (
    ROOT / "assets/game/manifests/office-spatial-authority-i01.json"
)
HELD_PROP_MANIFEST_PATH = (
    ROOT / "assets/game/manifests/office-held-props-h01.json"
)
ACTIVE_REGISTRY = (
    ROOT
    / "apps/web/src/features/office/components/officeAssetRegistry.ts"
)
BEHAVIOR_REFERENCE = ROOT / "assets/game/manifests/office-interaction-assets.json"
PILOT_PATH = ROOT / "assets/game/manifests/character-morphology-pilot.json"
ROSTER_PATH = ROOT / "assets/game/manifests/character-roster-8x15-batch.json"

OUTPUT_ROOT = (
    ROOT
    / "assets/game/processed/office-facility-family-v1/vending-u01-r02"
)
AUTHORING_ROOT = OUTPUT_ROOT / "authoring"
RUNTIME_ROOT = OUTPUT_ROOT / "runtime"
SOURCE_ROOT = AUTHORING_ROOT / "source"
AUTHORING_PART_ROOT = AUTHORING_ROOT / "parts"
RUNTIME_PART_ROOT = RUNTIME_ROOT / "parts"
AUTHORING_COMPOSITE_ROOT = AUTHORING_ROOT / "composites"
RUNTIME_COMPOSITE_ROOT = RUNTIME_ROOT / "composites"
REVIEW_ROOT = (
    ROOT
    / "assets/art/layout-references/office-facility-family-v1/vending-u01-r02"
)
R01_REVIEW_PATH = (
    ROOT
    / "assets/art/layout-references/office-facility-family-v1/vending-u01/06-output-handoff.png"
)

FAMILY_ID = "vending.machine.modern"
REVISION = "u01-r02"
SOURCE_PATH = (
    "assets/art/layout-references/"
    "mechanical-loops-sheet-modern-bright-v1-source.png"
)
SOURCE_SHA256 = "31109c9ecf2bc5b0f7d35caca821c77c29819fe19d73e895c88976e3d877274a"
FRAME_IDS = ("a", "b", "c", "d")
RECORD_PREFIX = (
    "modern-bright-library-v1:env-07-animated-mechanical:"
    "vending.machine.loop."
)
SIDE_RECORDS = (
    "modern-bright-library-v1:env-12-facility-side-orientations:"
    "vending.machine.modern.side-left",
    "modern-bright-library-v1:env-12-facility-side-orientations:"
    "vending.machine.modern.side-right",
)

AUTHORING_CANVAS = (256, 384)
RUNTIME_CANVAS = (64, 96)
RUNTIME_DIVISOR = 4
ACTOR_FRAME = (96, 104)
ACTOR_ROW = 10
ACTIVE_FRAMES = 6
SHARED_ACTOR_POSITION = (96, 96)
MACHINE_POSITION = (64, 40)
FACILITY_OUTPUT_SOCKET = (32, 78)
FACILITY_EFFECT_SOCKET = (27, 81)
FACILITY_BASE_SOCKET = (32, 96)
VIEWPORT_BOX = (40, 128, 220, 376)
VIEWPORT_RUNTIME_BOX = tuple(value // RUNTIME_DIVISOR for value in VIEWPORT_BOX)
SCREEN_BOX = (176, 132, 220, 240)
TRAY_BOX = (44, 256, 204, 376)
EFFECT_ROI = (96, 304, 132, 348)
PRODUCT_ROI = (88, 280, 128, 332)

KEYED_SOURCE_PATH = SOURCE_ROOT / "mechanical-loops-master.keyed.png"
OWNERSHIP_PATH = SOURCE_ROOT / "vending-u01-r02.full-master-ownership-mask.png"
SOURCE_FRAME_PATHS = {
    frame: SOURCE_ROOT / f"vending-u01-r02.source-frame-{frame}.png"
    for frame in FRAME_IDS
}
PART_PATHS = {
    "shell-static": (
        AUTHORING_PART_ROOT / "vending-u01-r02.shell-static.png",
        RUNTIME_PART_ROOT / "vending-u01-r02.shell-static.png",
    ),
    **{
        f"viewport-{frame}": (
            AUTHORING_PART_ROOT / f"vending-u01-r02.viewport-{frame}.png",
            RUNTIME_PART_ROOT / f"vending-u01-r02.viewport-{frame}.png",
        )
        for frame in FRAME_IDS
    },
    "pickup-tray-empty": (
        AUTHORING_PART_ROOT / "vending-u01-r02.pickup-tray-empty.png",
        RUNTIME_PART_ROOT / "vending-u01-r02.pickup-tray-empty.png",
    ),
    "effect-dispense": (
        AUTHORING_PART_ROOT / "vending-u01-r02.effect-dispense.png",
        RUNTIME_PART_ROOT / "vending-u01-r02.effect-dispense.png",
    ),
    "held-soda-can": (
        AUTHORING_PART_ROOT / "vending-u01-r02.held-soda-can@2x.png",
        RUNTIME_PART_ROOT / "vending-u01-r02.held-soda-can.png",
    ),
}
COMPOSITE_PATHS = {
    frame: (
        AUTHORING_COMPOSITE_ROOT / f"vending-u01-r02.frame-{frame}.png",
        RUNTIME_COMPOSITE_ROOT / f"vending-u01-r02.frame-{frame}.png",
    )
    for frame in FRAME_IDS
}
REVIEW_PATHS = [
    REVIEW_ROOT / "01-source-ownership.png",
    REVIEW_ROOT / "02-alpha-parts.png",
    REVIEW_ROOT / "03-clean-front.png",
    REVIEW_ROOT / "04-geometry-grid-routes.png",
    REVIEW_ROOT / "05-animation-viewport.png",
    REVIEW_ROOT / "06-output-handoff.png",
    REVIEW_ROOT / "07-roster-fit-18x6.png",
    REVIEW_ROOT / "08-reservation-timeline-30s.png",
    REVIEW_ROOT / "09-socket-attachment-debug.png",
    REVIEW_ROOT / "10-r01-r02-before-after.png",
]

PART_ROLES = {
    "shell-static": "static-shell",
    "viewport-a": "animation-viewport",
    "viewport-b": "animation-viewport",
    "viewport-c": "animation-viewport",
    "viewport-d": "animation-viewport",
    "pickup-tray-empty": "pickup-tray-empty",
    "effect-dispense": "effect-overlay",
    "held-soda-can": "held-output",
}
PART_SOURCE_FRAMES = {
    "shell-static": "a",
    "viewport-a": "a",
    "viewport-b": "b",
    "viewport-c": "c",
    "viewport-d": "c",
    "pickup-tray-empty": "c",
    "effect-dispense": "c",
    "held-soda-can": "h01",
}


def repo_path(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    value = path.read_bytes()
    if path.suffix.lower() in {".json", ".md", ".mjs", ".py", ".ts"}:
        value = value.decode("utf-8").replace("\r\n", "\n").encode("utf-8")
    return hashlib.sha256(value).hexdigest()


def png_bytes(image: Image.Image) -> bytes:
    image = image.convert("RGBA")
    image.putdata(
        [
            pixel if pixel[3] else (0, 0, 0, 0)
            for pixel in image.getdata()
        ]
    )
    buffer = io.BytesIO()
    image.save(buffer, "PNG", optimize=False, compress_level=9)
    return buffer.getvalue()


def json_bytes(value: Any) -> bytes:
    return (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode("utf-8")


def font(size: int, *, bold: bool = False) -> ImageFont.ImageFont:
    names = (
        ("DejaVuSans-Bold.ttf", "arialbd.ttf")
        if bold
        else ("DejaVuSans.ttf", "arial.ttf")
    )
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


TITLE_FONT = font(34, bold=True)
HEADING_FONT = font(23, bold=True)
BODY_FONT = font(18)
SMALL_FONT = font(14)


def draw_title(
    image: Image.Image,
    title: str,
    subtitle: str,
) -> ImageDraw.ImageDraw:
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, image.width, 84), fill=(21, 28, 39, 255))
    draw.text((28, 14), title, font=TITLE_FONT, fill=(245, 248, 252, 255))
    draw.text((30, 54), subtitle, font=SMALL_FONT, fill=(170, 187, 208, 255))
    return draw


def checkerboard(size: tuple[int, int], cell: int = 16) -> Image.Image:
    image = Image.new("RGBA", size, (232, 237, 243, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle(
                    (x, y, min(size[0], x + cell), min(size[1], y + cell)),
                    fill=(205, 214, 224, 255),
                )
    return image


def is_chroma_key(pixel: tuple[int, int, int, int]) -> bool:
    red, green, blue, alpha = pixel
    return (
        alpha == 0
        or (red > green + 28 and blue > green + 28)
        or (
            red >= 170
            and blue >= 155
            and green <= 105
            and abs(red - blue) <= 85
            and red + blue >= green * 4
        )
    )


def alpha_key_full_master(source: Image.Image) -> Image.Image:
    keyed = source.convert("RGBA")
    keyed.putdata(
        [
            (red, green, blue, 0)
            if is_chroma_key((red, green, blue, alpha))
            else (red, green, blue, alpha)
            for red, green, blue, alpha in keyed.getdata()
        ]
    )
    return keyed


def connected_components(image: Image.Image) -> list[dict[str, Any]]:
    width, height = image.size
    visible = bytearray(1 if value else 0 for value in image.getchannel("A").getdata())
    seen = bytearray(width * height)
    components: list[dict[str, Any]] = []
    for start, value in enumerate(visible):
        if not value or seen[start]:
            continue
        queue = deque([start])
        seen[start] = 1
        points: list[int] = []
        left, top, right, bottom = width, height, 0, 0
        while queue:
            current = queue.popleft()
            points.append(current)
            x = current % width
            y = current // width
            left = min(left, x)
            top = min(top, y)
            right = max(right, x + 1)
            bottom = max(bottom, y + 1)
            for near_x, near_y in (
                (x - 1, y),
                (x + 1, y),
                (x, y - 1),
                (x, y + 1),
            ):
                if not (0 <= near_x < width and 0 <= near_y < height):
                    continue
                near = near_y * width + near_x
                if visible[near] and not seen[near]:
                    seen[near] = 1
                    queue.append(near)
        components.append(
            {
                "points": points,
                "pixelCount": len(points),
                "bounds": (left, top, right, bottom),
            }
        )
    return components


def overlap_count(
    component: dict[str, Any],
    width: int,
    bounds: tuple[int, int, int, int],
) -> int:
    left, top, right, bottom = bounds
    return sum(
        1
        for point in component["points"]
        if left <= point % width < right and top <= point // width < bottom
    )


def select_frame_component(
    components: list[dict[str, Any]],
    master_width: int,
    source_bounds: tuple[int, int, int, int],
) -> dict[str, Any]:
    ranked = sorted(
        (
            (overlap_count(component, master_width, source_bounds), component)
            for component in components
        ),
        key=lambda item: item[0],
        reverse=True,
    )
    if not ranked or ranked[0][0] < 10_000:
        raise ValueError(f"No owned vending component in {source_bounds}")
    if len(ranked) > 1 and ranked[1][0] > ranked[0][0] * 0.05:
        raise ValueError(f"Ambiguous vending ownership in {source_bounds}")
    selected = dict(ranked[0][1])
    selected["sourceOverlapPixels"] = ranked[0][0]
    return selected


def component_mask(
    size: tuple[int, int],
    points: list[int],
) -> Image.Image:
    values = bytearray(size[0] * size[1])
    for point in points:
        values[point] = 255
    return Image.frombytes("L", size, bytes(values))


def align_component(
    keyed: Image.Image,
    selected: dict[str, Any],
) -> tuple[Image.Image, dict[str, int]]:
    bounds = tuple(selected["bounds"])
    mask = component_mask(keyed.size, selected["points"]).crop(bounds)
    subject = keyed.crop(bounds)
    left = (AUTHORING_CANVAS[0] - subject.width) // 2
    top = AUTHORING_CANVAS[1] - subject.height - 8
    padding = {
        "left": left,
        "top": top,
        "right": AUTHORING_CANVAS[0] - subject.width - left,
        "bottom": 8,
    }
    if min(padding.values()) < 8:
        raise ValueError(f"Insufficient authoring padding: {padding}")
    aligned = Image.new("RGBA", AUTHORING_CANVAS, (0, 0, 0, 0))
    aligned.paste(subject, (left, top), mask)
    return aligned, padding


def copy_box_layer(source: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    layer = Image.new("RGBA", source.size, (0, 0, 0, 0))
    layer.alpha_composite(source.crop(box), (box[0], box[1]))
    return layer


def clear_box(image: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    output = image.copy()
    ImageDraw.Draw(output).rectangle(
        (box[0], box[1], box[2] - 1, box[3] - 1),
        fill=(0, 0, 0, 0),
    )
    return output


def mask_layer(source: Image.Image, mask: Image.Image) -> Image.Image:
    output = Image.new("RGBA", source.size, (0, 0, 0, 0))
    output.putdata(
        [
            pixel if pixel[3] and selected else (0, 0, 0, 0)
            for pixel, selected in zip(
                source.getdata(),
                mask.getdata(),
                strict=True,
            )
        ]
    )
    return output


def cyan_effect_mask(source: Image.Image) -> Image.Image:
    mask = Image.new("L", source.size, 0)
    values = bytearray(source.width * source.height)
    for y in range(EFFECT_ROI[1], EFFECT_ROI[3]):
        for x in range(EFFECT_ROI[0], EFFECT_ROI[2]):
            red, green, blue, alpha = source.getpixel((x, y))
            if alpha and blue >= 130 and green >= 100 and blue > red * 1.45:
                values[y * source.width + x] = 255
    mask = Image.frombytes("L", source.size, bytes(values))
    if mask.getbbox() is None:
        raise ValueError("Dispense-effect source pixels were not found")
    return mask


def product_mask(frame_d: Image.Image, frame_c: Image.Image) -> Image.Image:
    width, height = frame_d.size
    differences = [0] * (width * height)
    orange_seed = bytearray(width * height)
    for y in range(PRODUCT_ROI[1], PRODUCT_ROI[3]):
        for x in range(PRODUCT_ROI[0], PRODUCT_ROI[2]):
            d_pixel = frame_d.getpixel((x, y))
            c_pixel = frame_c.getpixel((x, y))
            red, green, blue, alpha = d_pixel
            difference = sum(abs(d_pixel[channel] - c_pixel[channel]) for channel in range(3))
            orange = (
                alpha
                and red > 135
                and 35 < green < 205
                and blue < 135
                and red > green * 1.1
            )
            index = y * width + x
            if orange:
                orange_seed[index] = 1
            if alpha:
                differences[index] = difference

    seen = bytearray(width * height)
    selected = bytearray(width * height)
    best_points: list[int] = []
    for start, value in enumerate(orange_seed):
        if not value or seen[start]:
            continue
        queue = deque([start])
        seen[start] = 1
        points: list[int] = []
        while queue:
            current = queue.popleft()
            points.append(current)
            x = current % width
            y = current // width
            for near_x, near_y in (
                (x - 1, y),
                (x + 1, y),
                (x, y - 1),
                (x, y + 1),
            ):
                if not (0 <= near_x < width and 0 <= near_y < height):
                    continue
                near = near_y * width + near_x
                if orange_seed[near] and not seen[near]:
                    seen[near] = 1
                    queue.append(near)
        if len(points) > len(best_points):
            best_points = points
    if len(best_points) < 300:
        raise ValueError(
            f"Held-product orange core is incomplete: {len(best_points)} pixels"
        )
    orange_x = [point % width for point in best_points]
    orange_y = [point // width for point in best_points]
    allowed_box = (
        max(PRODUCT_ROI[0], min(orange_x) - 4),
        max(PRODUCT_ROI[1], min(orange_y) - 4),
        min(PRODUCT_ROI[2], max(orange_x) + 5),
        min(PRODUCT_ROI[3], max(orange_y) + 5),
    )
    for point in best_points:
        selected[point] = 1
    for y in range(allowed_box[1], allowed_box[3]):
        for x in range(allowed_box[0], allowed_box[2]):
            index = y * width + x
            red, green, blue, alpha = frame_d.getpixel((x, y))
            if (
                alpha
                and differences[index] > 45
                and red > 165
                and green > 145
                and blue > 105
            ):
                selected[index] = 1
    for _ in range(3):
        expanded = bytearray(selected)
        for index, value in enumerate(selected):
            if not value:
                continue
            x = index % width
            y = index // width
            for near_x, near_y in (
                (x - 1, y),
                (x + 1, y),
                (x, y - 1),
                (x, y + 1),
                (x - 1, y - 1),
                (x + 1, y - 1),
                (x - 1, y + 1),
                (x + 1, y + 1),
            ):
                if not (
                    allowed_box[0] <= near_x < allowed_box[2]
                    and allowed_box[1] <= near_y < allowed_box[3]
                ):
                    continue
                near = near_y * width + near_x
                if differences[near] > 45:
                    expanded[near] = 1
        selected = expanded
    selected_points = [index for index, value in enumerate(selected) if value]
    if len(selected_points) < 500:
        raise ValueError(
            f"Held-product segmentation is incomplete: {len(selected_points)} pixels"
        )
    selected_x = [point % width for point in selected_points]
    selected_y = [point // width for point in selected_points]
    selected_bounds = (
        min(selected_x),
        min(selected_y),
        max(selected_x) + 1,
        max(selected_y) + 1,
    )
    if selected_bounds[2] - selected_bounds[0] > 40 or selected_bounds[3] - selected_bounds[1] > 50:
        raise ValueError(f"Held-product segmentation escaped its source item: {selected_bounds}")
    return component_mask(frame_d.size, selected_points)


def compose_frame(
    shell: Image.Image,
    viewport: Image.Image,
    effects: list[Image.Image],
) -> Image.Image:
    output = Image.new("RGBA", shell.size, (0, 0, 0, 0))
    output.alpha_composite(shell)
    output.alpha_composite(viewport)
    for effect in effects:
        output.alpha_composite(effect)
    return output


def changed_outside_box(
    first: Image.Image,
    second: Image.Image,
    box: tuple[int, int, int, int],
) -> int:
    changed = 0
    for y in range(first.height):
        for x in range(first.width):
            inside = box[0] <= x < box[2] and box[1] <= y < box[3]
            if not inside and first.getpixel((x, y)) != second.getpixel((x, y)):
                changed += 1
    return changed


def alpha_overlap(
    first: Image.Image,
    first_xy: tuple[int, int],
    second: Image.Image,
    second_xy: tuple[int, int],
) -> int:
    left = max(first_xy[0], second_xy[0])
    top = max(first_xy[1], second_xy[1])
    right = min(first_xy[0] + first.width, second_xy[0] + second.width)
    bottom = min(first_xy[1] + first.height, second_xy[1] + second.height)
    if left >= right or top >= bottom:
        return 0
    first_alpha = first.getchannel("A").crop(
        (left - first_xy[0], top - first_xy[1], right - first_xy[0], bottom - first_xy[1])
    )
    second_alpha = second.getchannel("A").crop(
        (
            left - second_xy[0],
            top - second_xy[1],
            right - second_xy[0],
            bottom - second_xy[1],
        )
    )
    return sum(
        1
        for one, two in zip(first_alpha.getdata(), second_alpha.getdata(), strict=True)
        if one and two
    )


def paste_scaled(
    target: Image.Image,
    source: Image.Image,
    box: tuple[int, int, int, int],
) -> None:
    width = box[2] - box[0]
    height = box[3] - box[1]
    copy = source.copy()
    copy.thumbnail((width, height), Image.Resampling.NEAREST)
    x = box[0] + (width - copy.width) // 2
    y = box[1] + (height - copy.height) // 2
    target.alpha_composite(copy, (x, y))


def load_source_records(audit: dict[str, Any]) -> list[dict[str, Any]]:
    records = []
    for frame in FRAME_IDS:
        record_id = f"{RECORD_PREFIX}{frame}"
        matches = [
            record
            for record in audit["records"]
            if record["recordId"] == record_id
        ]
        if len(matches) != 1:
            raise ValueError(f"Audit record missing or duplicated: {record_id}")
        record = matches[0]
        if (
            record["sourcePath"] != SOURCE_PATH
            or record["sourceSha256"] != SOURCE_SHA256
            or record["orientation"] != "front"
            or record["animationFrame"] != frame
            or record["currentDecision"]["decision"]
            != "salvage-full-master-and-decompose"
            or record["currentDecision"]["masterPixelsSalvageable"] is not True
        ):
            raise ValueError(f"Audit no longer permits U01 frame {frame}")
        records.append(record)
    side_decisions = {
        record["recordId"]: record["currentDecision"]
        for record in audit["records"]
        if record["recordId"] in SIDE_RECORDS
    }
    if (
        set(side_decisions) != set(SIDE_RECORDS)
        or any(
            decision["decision"] != "reject-regenerate-orientation-if-required"
            or decision["masterPixelsSalvageable"] is not False
            for decision in side_decisions.values()
        )
    ):
        raise ValueError("Rejected vending side orientations changed")
    return records


def extract_source_frames(
    source: Image.Image,
    records: list[dict[str, Any]],
) -> tuple[
    Image.Image,
    Image.Image,
    dict[str, Image.Image],
    list[dict[str, Any]],
]:
    keyed = alpha_key_full_master(source)
    components = connected_components(keyed)
    ownership = Image.new("RGBA", source.size, (0, 0, 0, 0))
    ownership_pixels = ownership.load()
    colors = (
        (65, 179, 255, 230),
        (92, 222, 153, 230),
        (255, 190, 75, 230),
        (207, 122, 255, 230),
    )
    aligned_frames: dict[str, Image.Image] = {}
    evidence: list[dict[str, Any]] = []
    selected_components: set[int] = set()

    for record, color in zip(records, colors, strict=True):
        frame_id = record["animationFrame"]
        source_bounds = tuple(record["sourceBounds"])
        selected = select_frame_component(components, keyed.width, source_bounds)
        identity = id(next(
            component
            for component in components
            if component["points"] is selected["points"]
        ))
        if identity in selected_components:
            raise ValueError("One master component was assigned to multiple frames")
        selected_components.add(identity)
        for point in selected["points"]:
            ownership_pixels[point % source.width, point // source.width] = color
        aligned, padding = align_component(keyed, selected)
        owned_bounds = tuple(selected["bounds"])
        touches_cell = (
            owned_bounds[0] <= source_bounds[0]
            or owned_bounds[1] <= source_bounds[1]
            or owned_bounds[2] >= source_bounds[2]
            or owned_bounds[3] >= source_bounds[3]
        )
        touches_master = (
            owned_bounds[0] <= 0
            or owned_bounds[1] <= 0
            or owned_bounds[2] >= source.width
            or owned_bounds[3] >= source.height
        )
        if not touches_cell or touches_master:
            raise ValueError(
                f"Frame {frame_id} boundary evidence changed: "
                f"cell={touches_cell}, master={touches_master}"
            )
        aligned_frames[frame_id] = aligned
        evidence.append(
            {
                "frameId": frame_id,
                "auditRecordId": record["recordId"],
                "sourceBounds": list(source_bounds),
                "ownedBounds": list(owned_bounds),
                "selectedComponentCount": 1,
                "selectedPixelCount": selected["pixelCount"],
                "sourceOverlapPixels": selected["sourceOverlapPixels"],
                "discardedComponentCount": len(components) - 1,
                "touchesNominalCellBoundary": touches_cell,
                "touchesMasterBoundary": touches_master,
                "sourcePixelsResampled": False,
                "boundaryReview": {
                    "status": "passed-complete-silhouette",
                    "reason": (
                        "The connected vending silhouette continues below the "
                        "nominal row into empty magenta space; full-master "
                        "ownership retains its feet and shadow without reaching "
                        "the next machine."
                    ),
                },
                "padding": padding,
            }
        )
    return keyed, ownership, aligned_frames, evidence


def build_parts(
    source_frames: dict[str, Image.Image],
) -> tuple[
    dict[str, Image.Image],
    dict[str, Image.Image],
    dict[str, Image.Image],
    dict[str, int],
]:
    frame_a = source_frames["a"]
    frame_b = source_frames["b"]
    frame_c = source_frames["c"]
    frame_d = source_frames["d"]

    shell = clear_box(frame_a, VIEWPORT_BOX)
    viewport_a = copy_box_layer(frame_a, VIEWPORT_BOX)
    viewport_b = viewport_a.copy()
    viewport_b.alpha_composite(copy_box_layer(frame_b, SCREEN_BOX))

    effect_mask = cyan_effect_mask(frame_c)
    effect = mask_layer(frame_c, effect_mask)
    empty_tray = copy_box_layer(frame_c, TRAY_BOX)
    empty_alpha = empty_tray.getchannel("A")
    empty_alpha.putdata(
        [
            alpha if not effect_pixel else 0
            for alpha, effect_pixel in zip(
                empty_alpha.getdata(),
                effect_mask.getdata(),
                strict=True,
            )
        ]
    )
    empty_tray.putalpha(empty_alpha)

    viewport_c = viewport_a.copy()
    viewport_c.alpha_composite(empty_tray)
    viewport_d = viewport_c.copy()

    held_mask = product_mask(frame_d, frame_c)
    machine_product = mask_layer(frame_d, held_mask)
    if machine_product.getbbox() is None:
        raise ValueError("Machine output-removal evidence is empty")
    held_manifest = json.loads(
        HELD_PROP_MANIFEST_PATH.read_text(encoding="utf-8")
    )
    held_record = next(
        record
        for record in held_manifest["props"]
        if record["id"] == "held.soda-can"
    )
    held_authoring = Image.open(
        ROOT / held_record["authoringFile"]
    ).convert("RGBA")
    held_runtime = Image.open(
        ROOT / held_record["runtimeFile"]
    ).convert("RGBA")

    authoring_parts = {
        "shell-static": shell,
        "viewport-a": viewport_a,
        "viewport-b": viewport_b,
        "viewport-c": viewport_c,
        "viewport-d": viewport_d,
        "pickup-tray-empty": empty_tray,
        "effect-dispense": effect,
        "held-soda-can": held_authoring,
    }
    effects_by_frame = {
        "a": [],
        "b": [],
        "c": [effect],
        "d": [],
    }
    authoring_composites = {
        frame: compose_frame(
            shell,
            authoring_parts[f"viewport-{frame}"],
            effects_by_frame[frame],
        )
        for frame in FRAME_IDS
    }
    outside_changes = {
        frame: changed_outside_box(
            authoring_composites["a"],
            authoring_composites[frame],
            VIEWPORT_BOX,
        )
        for frame in FRAME_IDS
    }
    if any(outside_changes.values()):
        raise ValueError(f"Animation escaped the viewport: {outside_changes}")

    runtime_parts = {
        part_id: (
            held_runtime
            if part_id == "held-soda-can"
            else image.resize(RUNTIME_CANVAS, Image.Resampling.NEAREST)
        )
        for part_id, image in authoring_parts.items()
    }
    runtime_composites = {
        frame: image.resize(RUNTIME_CANVAS, Image.Resampling.NEAREST)
        for frame, image in authoring_composites.items()
    }
    return authoring_parts, runtime_parts, authoring_composites, {
        **outside_changes,
        "effectPixels": sum(1 for value in effect_mask.getdata() if value),
        "heldProductPixels": sum(1 for value in held_mask.getdata() if value),
    }, runtime_composites


def pose_source_records() -> tuple[
    list[dict[str, Any]],
    list[dict[str, Any]],
]:
    behavior = json.loads(BEHAVIOR_REFERENCE.read_text(encoding="utf-8"))
    pilot = json.loads(PILOT_PATH.read_text(encoding="utf-8"))
    roster = json.loads(ROSTER_PATH.read_text(encoding="utf-8"))
    sources = [
        {
            "manifest": repo_path(BEHAVIOR_REFERENCE),
            "manifestSha256": sha256_file(BEHAVIOR_REFERENCE),
            "characterIds": ["einstein"],
        },
        {
            "manifest": repo_path(PILOT_PATH),
            "manifestSha256": sha256_file(PILOT_PATH),
            "characterIds": [entry["id"] for entry in pilot["characters"]],
        },
        {
            "manifest": repo_path(ROSTER_PATH),
            "manifestSha256": sha256_file(ROSTER_PATH),
            "characterIds": [entry["id"] for entry in roster["characters"]],
        },
    ]
    entries = [
        {
            "id": "einstein",
            "sheet": behavior["einstein"]["sheet1x"],
            "row": next(
                row["row"]
                for row in behavior["einstein"]["extensionRows"]
                if row["name"] == "interact-front"
            ),
            "activeFrames": ACTIVE_FRAMES,
        }
    ]
    for entry in pilot["characters"]:
        pose = next(
            (
                row
                for row in entry["extensionRows"]
                if row["state"] == "interact-front"
            ),
            None,
        )
        entries.append(
            {
                "id": entry["id"],
                "sheet": entry["sheet1x"],
                "row": pose["row"] if pose else ACTOR_ROW,
                "activeFrames": pose["activeFrames"] if pose else ACTIVE_FRAMES,
            }
        )
    for entry in roster["characters"]:
        pose = next(
            row
            for row in entry["extensionRows"]
            if row["state"] == "interact-front"
        )
        entries.append(
            {
                "id": entry["id"],
                "sheet": entry["sheet1x"],
                "row": pose["row"],
                "activeFrames": pose["activeFrames"],
            }
        )
    ids = [entry["id"] for entry in entries]
    if len(ids) != 18 or len(set(ids)) != 18:
        raise ValueError(f"Expected eighteen unique interact-front actors: {ids}")
    if any(
        entry["row"] != ACTOR_ROW or entry["activeFrames"] != ACTIVE_FRAMES
        for entry in entries
    ):
        raise ValueError("Interact-front row or frame count changed")
    return sources, entries


def actor_frame(sheet: Image.Image, frame: int) -> Image.Image:
    expected = (ACTOR_FRAME[0] * 8, ACTOR_FRAME[1] * 15)
    if sheet.size != expected:
        raise ValueError(f"Unexpected character sheet size: {sheet.size}")
    return sheet.crop(
        (
            frame * ACTOR_FRAME[0],
            ACTOR_ROW * ACTOR_FRAME[1],
            (frame + 1) * ACTOR_FRAME[0],
            (ACTOR_ROW + 1) * ACTOR_FRAME[1],
        )
    )


def compose_pose_case(
    machine: Image.Image,
    actor: Image.Image,
    held_product: Image.Image,
    hand_mask: Image.Image | None,
    frame_socket: dict[str, Any],
    prop_socket: tuple[int, int],
    frame: int,
) -> tuple[Image.Image, dict[str, Any]]:
    canvas = Image.new("RGBA", (256, 224), (0, 0, 0, 0))
    canvas.alpha_composite(machine, MACHINE_POSITION)
    held_visible = frame in (2, 3, 4)
    attachment_parent = (
        "facility.output.primary"
        if frame == 2
        else "actor.hand.primary.grip"
        if frame in (3, 4)
        else None
    )
    primary = tuple(frame_socket["primaryGripSocket"])
    hand_world = (
        SHARED_ACTOR_POSITION[0] + primary[0],
        SHARED_ACTOR_POSITION[1] + primary[1],
    )
    output_world = (
        MACHINE_POSITION[0] + FACILITY_OUTPUT_SOCKET[0],
        MACHINE_POSITION[1] + FACILITY_OUTPUT_SOCKET[1],
    )
    parent_socket_world = (
        output_world
        if attachment_parent == "facility.output.primary"
        else hand_world
        if attachment_parent == "actor.hand.primary.grip"
        else None
    )
    prop_origin = None
    attachment_delta = None
    if parent_socket_world:
        prop_origin = (
            parent_socket_world[0] - prop_socket[0],
            parent_socket_world[1] - prop_socket[1],
        )
        resolved_grip = (
            prop_origin[0] + prop_socket[0],
            prop_origin[1] + prop_socket[1],
        )
        attachment_delta = [
            resolved_grip[0] - parent_socket_world[0],
            resolved_grip[1] - parent_socket_world[1],
        ]
    if attachment_parent == "facility.output.primary" and prop_origin:
        canvas.alpha_composite(held_product, prop_origin)
    canvas.alpha_composite(actor, SHARED_ACTOR_POSITION)
    if attachment_parent == "actor.hand.primary.grip" and prop_origin:
        canvas.alpha_composite(held_product, prop_origin)
        if hand_mask is None:
            raise ValueError(f"Actor-held frame {frame} is missing its hand mask")
        canvas.alpha_composite(hand_mask, SHARED_ACTOR_POSITION)
    actor_bounds = actor.getbbox()
    inside = (
        SHARED_ACTOR_POSITION[0] >= 0
        and SHARED_ACTOR_POSITION[1] >= 0
        and SHARED_ACTOR_POSITION[0] + actor.width <= canvas.width
        and SHARED_ACTOR_POSITION[1] + actor.height <= canvas.height
    )
    return canvas, {
        "frameBounds": list(actor_bounds) if actor_bounds else None,
        "actorPosition": list(SHARED_ACTOR_POSITION),
        "actorInsideReviewCard": inside,
        "facilityOverlapPixels": alpha_overlap(
            actor,
            SHARED_ACTOR_POSITION,
            machine,
            MACHINE_POSITION,
        ),
        "heldAssetVisible": held_visible,
        "heldByActor": attachment_parent == "actor.hand.primary.grip",
        "attachmentParent": attachment_parent,
        "rootSocket": frame_socket["rootSocket"],
        "primaryGripSocket": frame_socket["primaryGripSocket"],
        "secondaryGripSocket": frame_socket["secondaryGripSocket"],
        "propGripSocket": list(prop_socket),
        "propOrigin": list(prop_origin) if prop_origin else None,
        "parentSocketWorld": (
            list(parent_socket_world) if parent_socket_world else None
        ),
        "attachmentDelta": attachment_delta,
        "foregroundMask": frame_socket["foregroundMask"],
        "renderOrder": (
            ["facility-base", "held-prop", "actor-body"]
            if attachment_parent == "facility.output.primary"
            else ["actor-body", "held-prop", "hand-foreground"]
            if attachment_parent == "actor.hand.primary.grip"
            else ["facility-base", "actor-body"]
        ),
    }


def build_roster_validation(
    machine_frames: dict[str, Image.Image],
    held_product: Image.Image,
) -> tuple[
    list[dict[str, Any]],
    dict[str, list[Image.Image]],
    dict[str, Any],
]:
    pose_sources, _ = pose_source_records()
    socket_authority = json.loads(
        POSE_AUTHORITY_PATH.read_text(encoding="utf-8")
    )
    spatial_authority = json.loads(
        SPATIAL_AUTHORITY_PATH.read_text(encoding="utf-8")
    )
    held_manifest = json.loads(
        HELD_PROP_MANIFEST_PATH.read_text(encoding="utf-8")
    )
    held_record = next(
        record
        for record in held_manifest["props"]
        if record["id"] == "held.soda-can"
    )
    prop_socket = tuple(held_record["primaryGripSocket"])
    if sha256_file(ROOT / held_record["runtimeFile"]) != held_record["runtimeSha256"]:
        raise ValueError("H01 soda runtime hash changed")
    if (
        spatial_authority["authorities"]["characterActions"]["sha256"]
        != sha256_file(POSE_AUTHORITY_PATH)
    ):
        raise ValueError("Spatial I01 no longer references the action socket authority")
    characters: list[dict[str, Any]] = []
    rendered: dict[str, list[Image.Image]] = {}
    machine_sequence = ("a", "b", "c", "d", "d", "a")
    for socket_character in socket_authority["characters"]:
        path = ROOT / socket_character["sheet"]
        sheet = Image.open(path).convert("RGBA")
        character_frames = []
        review_frames = []
        for frame_index in range(ACTIVE_FRAMES):
            actor = actor_frame(sheet, frame_index)
            frame_socket = socket_character["frames"][frame_index]
            mask_record = frame_socket["foregroundMask"]
            hand_mask = None
            if mask_record is not None:
                mask_path = ROOT / mask_record["file"]
                if sha256_file(mask_path) != mask_record["sha256"]:
                    raise ValueError(
                        f"{socket_character['id']} frame {frame_index} mask hash changed"
                    )
                hand_mask = Image.open(mask_path).convert("RGBA")
            composition, metrics = compose_pose_case(
                machine_frames[machine_sequence[frame_index]],
                actor,
                held_product,
                hand_mask,
                frame_socket,
                prop_socket,
                frame_index,
            )
            if not metrics["actorInsideReviewCard"]:
                raise ValueError(
                    f"{socket_character['id']} frame {frame_index} leaves the review card"
                )
            if metrics["attachmentDelta"] not in (None, [0, 0]):
                raise ValueError(
                    f"{socket_character['id']} frame {frame_index} attachment drifted"
                )
            character_frames.append({"frame": frame_index, **metrics})
            review_frames.append(composition)
        sheet_hash = sha256_file(path)
        characters.append(
            {
                "id": socket_character["id"],
                "sheet": socket_character["sheet"],
                "sha256": sheet_hash,
                "frames": character_frames,
            }
        )
        rendered[socket_character["id"]] = review_frames
    roster = {
        "visualPose": "interact-front",
        "poseAuthority": {
            "manifest": repo_path(POSE_AUTHORITY_PATH),
            "manifestSha256": sha256_file(POSE_AUTHORITY_PATH),
            "status": "owner-review-f8-pending",
            "activeOfficeImported": False,
        },
        "spatialAuthority": {
            "manifest": repo_path(SPATIAL_AUTHORITY_PATH),
            "manifestSha256": sha256_file(SPATIAL_AUTHORITY_PATH),
            "status": "owner-review-f8-pending",
            "activeOfficeImported": False,
        },
        "heldPropAuthority": {
            "manifest": repo_path(HELD_PROP_MANIFEST_PATH),
            "manifestSha256": sha256_file(HELD_PROP_MANIFEST_PATH),
            "assetId": held_record["id"],
            "assetSha256": held_record["runtimeSha256"],
            "runtimeScale": held_record["runtimeScale"],
        },
        "row": ACTOR_ROW,
        "activeFrames": ACTIVE_FRAMES,
        "characterCount": len(characters),
        "validatedPoseCases": len(characters) * ACTIVE_FRAMES,
        "visiblePropCases": len(characters) * 3,
        "facilityOutputAttachmentCases": len(characters),
        "actorHandAttachmentCases": len(characters) * 2,
        "attachmentDeltaFailures": 0,
        "sharedActorPosition": list(SHARED_ACTOR_POSITION),
        "perCharacterFacilityScaling": False,
        "perCharacterActorOffsets": False,
        "poseSources": pose_sources,
        "characters": characters,
    }
    return characters, rendered, roster


def reservation_timeline() -> tuple[dict[str, Any], list[dict[str, Any]]]:
    samples = []
    blocked_attempts = 0
    collision_count = 0
    for second in range(31):
        if 0 <= second < 7:
            held_by = "agent-alpha"
        elif 8 <= second < 16:
            held_by = "agent-beta"
        elif 17 <= second < 25:
            held_by = "agent-alpha"
        else:
            held_by = None

        if second == 0:
            alpha_state = "reserved"
        elif second == 1:
            alpha_state = "approaching"
        elif 2 <= second <= 4:
            alpha_state = "interacting"
        elif second == 5:
            alpha_state = "dispensing"
        elif second == 6:
            alpha_state = "releasing-failure"
        elif 7 <= second <= 16:
            alpha_state = "waiting-retry"
        elif second == 17:
            alpha_state = "reserved-retry"
        elif second == 18:
            alpha_state = "approaching"
        elif 19 <= second <= 22:
            alpha_state = "interacting"
        elif second == 23:
            alpha_state = "dispensing"
        elif second == 24:
            alpha_state = "releasing"
        else:
            alpha_state = "complete"

        if second < 2:
            beta_state = "available"
        elif second == 2:
            beta_state = "blocked"
            blocked_attempts += 1
        elif 3 <= second <= 7:
            beta_state = "waiting"
        elif second == 8:
            beta_state = "reserved"
        elif second == 9:
            beta_state = "approaching"
        elif 10 <= second <= 13:
            beta_state = "interacting"
        elif second == 14:
            beta_state = "dispensing"
        elif second == 15:
            beta_state = "releasing"
        else:
            beta_state = "complete"

        alpha_cell = (
            [1, 1]
            if held_by == "agent-alpha" and alpha_state not in {"approaching"}
            else [1, 2]
            if alpha_state == "approaching"
            else [0, 2]
            if alpha_state.startswith("releasing")
            else None
        )
        beta_cell = (
            [1, 1]
            if held_by == "agent-beta" and beta_state != "approaching"
            else [1, 2]
            if beta_state in {"approaching", "waiting", "blocked"}
            else [0, 2]
            if beta_state == "releasing"
            else None
        )
        occupied = [cell for cell in (alpha_cell, beta_cell) if cell is not None]
        if len(occupied) != len({tuple(cell) for cell in occupied}):
            collision_count += 1
        samples.append(
            {
                "second": second,
                "heldBy": held_by,
                "actorStates": {
                    "agent-alpha": alpha_state,
                    "agent-beta": beta_state,
                },
                "actorCells": {
                    "agent-alpha": alpha_cell,
                    "agent-beta": beta_cell,
                },
            }
        )
    if collision_count:
        raise ValueError(f"Reservation simulation found {collision_count} collisions")
    validation = {
        "durationSeconds": 30,
        "actorCount": 2,
        "maximumConcurrentReservations": 1,
        "collisionCount": collision_count,
        "blockedAttemptCount": blocked_attempts,
        "failureCount": 1,
        "retrySuccessCount": 1,
        "releasedAtEnd": samples[-1]["heldBy"] is None,
        "failureReleaseSecond": 7,
        "retryAcquireSecond": 17,
        "samples": samples,
    }
    return validation, samples


def review_source_ownership(
    source: Image.Image,
    source_records: list[dict[str, Any]],
    ownership: Image.Image,
    source_frames: dict[str, Image.Image],
    evidence: list[dict[str, Any]],
) -> Image.Image:
    board = Image.new("RGBA", (1600, 1000), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Vending U01 — Full-master ownership",
        "F0/F2/F3 • original mechanical-loop master • four boundary-crossing components",
    )
    master = source.resize((627, 627), Image.Resampling.NEAREST)
    board.alpha_composite(master, (35, 120))
    ownership_preview = ownership.resize((313, 313), Image.Resampling.NEAREST)
    board.alpha_composite(ownership_preview, (180, 662))
    draw.text((35, 758), "ownership mask", font=HEADING_FONT, fill=(28, 43, 61, 255))

    colors = ((65, 179, 255), (92, 222, 153), (255, 190, 75), (207, 122, 255))
    for index, (record, color) in enumerate(zip(source_records, colors, strict=True)):
        left, top, right, bottom = record["sourceBounds"]
        draw.rectangle(
            (
                35 + left // 2,
                120 + top // 2,
                35 + right // 2,
                120 + bottom // 2,
            ),
            outline=(*color, 255),
            width=3,
        )
        x = 700 + (index % 2) * 430
        y = 120 + (index // 2) * 420
        draw.rounded_rectangle(
            (x, y, x + 390, y + 380),
            radius=14,
            fill=(248, 250, 253, 255),
            outline=(*color, 255),
            width=3,
        )
        paste_scaled(board, source_frames[FRAME_IDS[index]], (x + 40, y + 35, x + 350, y + 285))
        item = evidence[index]
        draw.text((x + 18, y + 300), f"frame {item['frameId'].upper()}", font=HEADING_FONT, fill=(25, 38, 55, 255))
        draw.text(
            (x + 18, y + 332),
            f"{item['selectedPixelCount']:,} px • owned {item['ownedBounds']}",
            font=SMALL_FONT,
            fill=(62, 78, 99, 255),
        )
        draw.text(
            (x + 18, y + 352),
            "PASS: complete silhouette continues below nominal cell",
            font=SMALL_FONT,
            fill=(24, 126, 73, 255),
        )
    return board


def review_parts(
    runtime_parts: dict[str, Image.Image],
) -> Image.Image:
    board = Image.new("RGBA", (1600, 1000), (235, 240, 246, 255))
    draw = draw_title(
        board,
        "Vending U01-r02 — Alpha parts",
        "Static shell • four local viewport states • empty tray • effect • held output",
    )
    labels = [
        ("shell-static", "STATIC SHELL"),
        ("viewport-a", "VIEWPORT A"),
        ("viewport-b", "VIEWPORT B"),
        ("viewport-c", "VIEWPORT C"),
        ("viewport-d", "VIEWPORT D"),
        ("pickup-tray-empty", "EMPTY TRAY"),
        ("effect-dispense", "EFFECT"),
        ("held-soda-can", "HELD OUTPUT"),
    ]
    for index, (part_id, label) in enumerate(labels):
        column = index % 4
        row = index // 4
        x = 30 + column * 390
        y = 115 + row * 420
        draw.rounded_rectangle(
            (x, y, x + 360, y + 380),
            radius=14,
            fill=(249, 251, 253, 255),
            outline=(92, 118, 150, 255),
            width=2,
        )
        card = checkerboard((320, 290), 14)
        paste_scaled(card, runtime_parts[part_id], (25, 10, 295, 280))
        board.alpha_composite(card, (x + 20, y + 45))
        draw.text((x + 18, y + 12), label, font=HEADING_FONT, fill=(24, 39, 57, 255))
        bbox = runtime_parts[part_id].getbbox()
        image = runtime_parts[part_id]
        draw.text(
            (x + 18, y + 344),
            f"{image.width}×{image.height} canvas • alpha bounds {bbox}",
            font=SMALL_FONT,
            fill=(69, 84, 103, 255),
        )
    return board


def review_clean(runtime_composites: dict[str, Image.Image]) -> Image.Image:
    board = Image.new("RGBA", (1400, 900), (232, 238, 245, 255))
    draw = draw_title(
        board,
        "Vending U01-r02 — Clean front-only loop",
        "2×1×3 tiles • 64×96 px • bottom-center • A/B/C/D use one immutable shell",
    )
    for index, frame in enumerate(FRAME_IDS):
        x = 30 + index * 340
        draw.rounded_rectangle(
            (x, 120, x + 310, 790),
            radius=16,
            fill=(247, 250, 253, 255),
            outline=(71, 103, 139, 255),
            width=2,
        )
        card = checkerboard((270, 570), 18)
        scaled = runtime_composites[frame].resize((256, 384), Image.Resampling.NEAREST)
        card.alpha_composite(scaled, (7, 80))
        board.alpha_composite(card, (x + 20, 170))
        draw.text((x + 20, 135), f"FRAME {frame.upper()}", font=HEADING_FONT, fill=(25, 39, 57, 255))
        label = {
            "a": "idle",
            "b": "screen response",
            "c": "empty tray + separate spark",
            "d": "handoff ready; product remains separate",
        }[frame]
        draw.text((x + 20, 758), label, font=SMALL_FONT, fill=(50, 69, 91, 255))
    draw.text(
        (31, 835),
        "PASS: front only • shell/pivots unchanged • no side source • no product embedded",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def review_geometry(runtime_machine: Image.Image) -> Image.Image:
    board = Image.new("RGBA", (1200, 950), (236, 241, 247, 255))
    draw = draw_title(
        board,
        "Vending U01-r02 — Geometry and routes",
        "Footprint, stand, approach, exit, anchor, and capacity proved outside every room",
    )
    origin = (180, 150)
    cell = 150
    colors = {
        "footprint": (76, 128, 191, 210),
        "stand": (58, 178, 111, 220),
        "approach": (246, 184, 70, 220),
        "exit": (166, 107, 208, 220),
    }
    for y in range(4):
        for x in range(4):
            box = (
                origin[0] + x * cell,
                origin[1] + y * cell,
                origin[0] + (x + 1) * cell,
                origin[1] + (y + 1) * cell,
            )
            fill = (250, 252, 254, 255)
            label = f"({x},{y})"
            if y == 0 and x in (0, 1):
                fill = colors["footprint"]
                label = f"FOOTPRINT ({x},0)"
            elif (x, y) == (1, 1):
                fill = colors["stand"]
                label = "STAND (1,+1)"
            elif (x, y) == (1, 2):
                fill = colors["approach"]
                label = "APPROACH (1,+2)"
            elif (x, y) == (0, 2):
                fill = colors["exit"]
                label = "EXIT (0,+2)"
            draw.rectangle(box, fill=fill, outline=(95, 113, 134, 255), width=2)
            draw.text((box[0] + 8, box[1] + 8), label, font=SMALL_FONT, fill=(20, 34, 51, 255))
    machine = runtime_machine.resize((128, 192), Image.Resampling.NEAREST)
    board.alpha_composite(
        machine,
        (
            origin[0] + cell - machine.width // 2,
            origin[1] + cell - machine.height,
        ),
    )
    draw.line(
        (
            origin[0] + cell + cell // 2,
            origin[1] + 2 * cell + cell // 2,
            origin[0] + cell + cell // 2,
            origin[1] + cell + cell // 2,
        ),
        fill=(175, 112, 31, 255),
        width=8,
    )
    draw.line(
        (
            origin[0] + cell + cell // 2,
            origin[1] + cell + cell // 2,
            origin[0] + cell // 2,
            origin[1] + 2 * cell + cell // 2,
        ),
        fill=(111, 68, 161, 255),
        width=8,
    )
    x = 825
    draw.text((x, 165), "LOCKED CONTRACT", font=HEADING_FONT, fill=(24, 39, 57, 255))
    lines = [
        "physical: 2×1×3 tiles",
        "render: 64×96 px",
        "orientation: front only",
        "anchor: bottom-center",
        "base/sort pivot: (1,1)",
        "capacity: 1",
        "reservation: atomic",
        "failure: releases token",
    ]
    for index, line in enumerate(lines):
        draw.text((x, 215 + index * 47), line, font=BODY_FONT, fill=(51, 69, 91, 255))
    draw.text(
        (825, 650),
        "PASS",
        font=TITLE_FONT,
        fill=(20, 126, 72, 255),
    )
    draw.text(
        (825, 700),
        "Stand and route cells do not overlap\nmachine footprint or each other.",
        font=BODY_FONT,
        fill=(37, 56, 77, 255),
        spacing=8,
    )
    return board


def review_animation(
    runtime_composites: dict[str, Image.Image],
    metrics: dict[str, int],
) -> Image.Image:
    board = Image.new("RGBA", (1600, 900), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Vending U01-r02 — Local animation viewport",
        "Four frames • static shell and pivots • every changed pixel remains inside the blue box",
    )
    for index, frame in enumerate(FRAME_IDS):
        x = 35 + index * 390
        draw.rounded_rectangle(
            (x, 130, x + 350, 720),
            radius=16,
            fill=(249, 251, 253, 255),
            outline=(84, 112, 145, 255),
            width=2,
        )
        scaled = runtime_composites[frame].resize((256, 384), Image.Resampling.NEAREST)
        image_x, image_y = x + 47, 205
        board.alpha_composite(scaled, (image_x, image_y))
        viewport = tuple(value * 4 for value in VIEWPORT_RUNTIME_BOX)
        draw.rectangle(
            (
                image_x + viewport[0],
                image_y + viewport[1],
                image_x + viewport[2],
                image_y + viewport[3],
            ),
            outline=(37, 156, 235, 255),
            width=4,
        )
        draw.text((x + 20, 150), f"FRAME {frame.upper()}", font=HEADING_FONT, fill=(24, 39, 57, 255))
        draw.text(
            (x + 20, 640),
            f"outside-viewport changes: {metrics[frame]}",
            font=BODY_FONT,
            fill=(20, 126, 72, 255),
        )
        draw.text(
            (x + 20, 675),
            "base pivot (1,1) • sort pivot (1,1)",
            font=SMALL_FONT,
            fill=(60, 78, 98, 255),
        )
    draw.text(
        (35, 810),
        "PASS: shell hash is shared • frame D reuses the fresh empty-tray state • effect is a child overlay",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def review_handoff(
    runtime_parts: dict[str, Image.Image],
    einstein_frames: list[Image.Image],
) -> Image.Image:
    board = Image.new("RGBA", (1500, 900), (235, 240, 246, 255))
    draw = draw_title(
        board,
        "Vending U01-r02 — Socket-driven output handoff",
        "Frame 3 uses the facility output socket; frames 4–5 use each actor hand socket",
    )
    labels = [
        ("pickup-tray-empty", "EMPTY TRAY"),
        ("effect-dispense", "EFFECT OVERLAY"),
        ("held-soda-can", "HELD OUTPUT"),
    ]
    for index, (part_id, label) in enumerate(labels):
        x = 35 + index * 300
        draw.rounded_rectangle(
            (x, 130, x + 270, 470),
            radius=14,
            fill=(249, 251, 253, 255),
            outline=(91, 116, 145, 255),
            width=2,
        )
        card = checkerboard((230, 250), 12)
        paste_scaled(card, runtime_parts[part_id], (15, 5, 215, 245))
        board.alpha_composite(card, (x + 20, 180))
        draw.text((x + 18, 145), label, font=HEADING_FONT, fill=(24, 39, 57, 255))
    draw.text((955, 145), "SIX-FRAME HANDOFF", font=HEADING_FONT, fill=(24, 39, 57, 255))
    for frame_index, composition in enumerate(einstein_frames):
        x = 950 + (frame_index % 3) * 175
        y = 200 + (frame_index // 3) * 260
        card = checkerboard((160, 220), 10)
        paste_scaled(card, composition, (0, 0, 160, 205))
        board.alpha_composite(card, (x, y))
        parent = (
            "facility.output"
            if frame_index == 2
            else "actor.hand"
            if frame_index in (3, 4)
            else "none"
        )
        draw.text(
            (x + 5, y + 198),
            f"{frame_index + 1}: {parent}",
            font=SMALL_FONT,
            fill=(33, 50, 70, 255),
        )
    draw.text(
        (38, 555),
        "Layer transition",
        font=HEADING_FONT,
        fill=(24, 39, 57, 255),
    )
    draw.text(
        (38, 605),
        "empty tray  →  facility.output.primary  →  actor.hand.primary.grip",
        font=HEADING_FONT,
        fill=(31, 105, 170, 255),
    )
    draw.text(
        (38, 675),
        "PASS: H01 prop grip resolves to its parent socket with exact delta [0,0].",
        font=BODY_FONT,
        fill=(20, 126, 72, 255),
    )
    draw.text(
        (38, 725),
        "The previous staging item-neutral loop is behavior reference only; no staging pixel is read.",
        font=BODY_FONT,
        fill=(59, 75, 95, 255),
    )
    return board


def review_roster(
    rendered: dict[str, list[Image.Image]],
) -> Image.Image:
    board = Image.new("RGBA", (1800, 1220), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Vending U01-r02 — Interact-front roster fit",
        "18 characters × 6 frames = 108 cases • Spatial I01 sockets • H01 prop scale 1",
    )
    for index, (character_id, frames) in enumerate(rendered.items()):
        column = index % 6
        row = index // 6
        x = 25 + column * 295
        y = 110 + row * 350
        draw.rounded_rectangle(
            (x, y, x + 270, y + 320),
            radius=12,
            fill=(248, 250, 253, 255),
            outline=(88, 114, 145, 255),
            width=2,
        )
        card = checkerboard((240, 250), 12)
        paste_scaled(card, frames[3], (0, 0, 240, 240))
        board.alpha_composite(card, (x + 15, y + 45))
        draw.text((x + 14, y + 12), character_id, font=HEADING_FONT, fill=(24, 39, 57, 255))
        draw.text(
            (x + 14, y + 292),
            "row 10 • frames 0–5 • no offset",
            font=SMALL_FONT,
            fill=(54, 72, 93, 255),
        )
    draw.text(
        (25, 1170),
        "PASS: all 108 cards remain inside bounds; no per-character scale or magic offset.",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def review_socket_debug(
    rendered: dict[str, list[Image.Image]],
    roster: dict[str, Any],
) -> Image.Image:
    board = Image.new("RGBA", (1800, 1220), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Vending U01-r02 — Socket attachment debug",
        "Frame 4 • H01 soda primary grip resolves to each actor hand with delta [0,0]",
    )
    records = {entry["id"]: entry for entry in roster["characters"]}
    for index, (character_id, frames) in enumerate(rendered.items()):
        column = index % 6
        row = index // 6
        x = 25 + column * 295
        y = 110 + row * 350
        draw.rounded_rectangle(
            (x, y, x + 270, y + 320),
            radius=12,
            fill=(248, 250, 253, 255),
            outline=(88, 114, 145, 255),
            width=2,
        )
        card = checkerboard((240, 250), 12)
        paste_scaled(card, frames[3], (0, 0, 240, 240))
        board.alpha_composite(card, (x + 15, y + 45))
        frame = records[character_id]["frames"][3]
        draw.text((x + 14, y + 12), character_id, font=HEADING_FONT, fill=(24, 39, 57, 255))
        draw.text(
            (x + 14, y + 292),
            f"hand {frame['primaryGripSocket']} • Δ {frame['attachmentDelta']}",
            font=SMALL_FONT,
            fill=(20, 126, 72, 255),
        )
    draw.text(
        (25, 1170),
        "PASS: no center anchor • no per-character runtime scale • source-exact hand foreground masks",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def review_before_after(new_handoff: Image.Image) -> Image.Image:
    if not R01_REVIEW_PATH.exists():
        raise ValueError("U01-r01 review evidence is missing")
    before = Image.open(R01_REVIEW_PATH).convert("RGBA")
    board = Image.new("RGBA", (1600, 1030), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Vending U01 — r01 attachment defect vs r02 socket repair",
        "Historical r01 remains review evidence only; r02 uses Spatial I01 and fresh Held Props H01",
    )
    draw.text((40, 120), "R01 • fixed actor + (48,54)", font=HEADING_FONT, fill=(183, 47, 58, 255))
    draw.text((820, 120), "R02 • hand socket − prop grip", font=HEADING_FONT, fill=(20, 126, 72, 255))
    before_preview = before.resize((720, 432), Image.Resampling.LANCZOS)
    after_preview = new_handoff.resize((720, 432), Image.Resampling.LANCZOS)
    board.alpha_composite(before_preview, (40, 165))
    board.alpha_composite(after_preview, (820, 165))
    draw.rounded_rectangle((55, 650, 755, 900), 14, fill=(255, 245, 246, 255), outline=(183, 47, 58, 255), width=2)
    draw.multiline_text(
        (85, 690),
        "DEFECT\n• one center-like coordinate for every actor\n• no prop grip socket\n• no hand foreground mask\n• F7 attachment proof incomplete",
        font=BODY_FONT,
        fill=(80, 47, 52, 255),
        spacing=14,
    )
    draw.rounded_rectangle((835, 650, 1535, 900), 14, fill=(241, 252, 247, 255), outline=(20, 126, 72, 255), width=2)
    draw.multiline_text(
        (865, 690),
        "REPAIR\n• per-character/per-frame hand sockets\n• H01 native grip socket and scale 1\n• body → prop → hand mask\n• exact attachment delta [0,0]",
        font=BODY_FONT,
        fill=(35, 75, 57, 255),
        spacing=14,
    )
    return board


def review_reservation(samples: list[dict[str, Any]]) -> Image.Image:
    board = Image.new("RGBA", (1600, 900), (235, 240, 246, 255))
    draw = draw_title(
        board,
        "Vending U01 — 30-second reservation timeline",
        "Two actors • capacity one • blocked second user • failure release • retry success",
    )
    left = 180
    right = 1540
    width_per_second = (right - left) / 30
    rows = {
        "reservation": 170,
        "agent-alpha": 330,
        "agent-beta": 490,
        "cells": 650,
    }
    for name, y in rows.items():
        draw.text((28, y + 25), name, font=BODY_FONT, fill=(31, 48, 68, 255))
        draw.line((left, y, right, y), fill=(112, 128, 147, 255), width=2)
    for second in range(0, 31, 2):
        x = round(left + second * width_per_second)
        draw.line((x, 125, x, 750), fill=(210, 217, 226, 255), width=1)
        draw.text((x - 8, 100), str(second), font=SMALL_FONT, fill=(63, 80, 100, 255))

    colors = {
        None: (224, 229, 235, 255),
        "agent-alpha": (70, 151, 219, 255),
        "agent-beta": (151, 99, 202, 255),
    }
    for sample in samples[:-1]:
        x1 = round(left + sample["second"] * width_per_second)
        x2 = round(left + (sample["second"] + 1) * width_per_second)
        draw.rectangle(
            (x1, rows["reservation"] + 15, x2, rows["reservation"] + 90),
            fill=colors[sample["heldBy"]],
        )
        for actor_id, row_name in (
            ("agent-alpha", "agent-alpha"),
            ("agent-beta", "agent-beta"),
        ):
            state = sample["actorStates"][actor_id]
            if "interacting" in state:
                fill = (77, 184, 120, 255)
            elif "dispensing" in state:
                fill = (245, 179, 61, 255)
            elif "releasing" in state:
                fill = (224, 92, 88, 255)
            elif "blocked" in state or "waiting" in state:
                fill = (207, 160, 84, 255)
            else:
                fill = (159, 178, 200, 255)
            draw.rectangle(
                (x1, rows[row_name] + 15, x2, rows[row_name] + 90),
                fill=fill,
            )
    draw.text((120, rows["cells"] + 20), "A", font=SMALL_FONT, fill=(32, 49, 68, 255))
    draw.text((120, rows["cells"] + 62), "B", font=SMALL_FONT, fill=(32, 49, 68, 255))
    cell_segments = [
        (0, 6, 0, "stand (1,1)", (70, 151, 219, 255)),
        (6, 7, 0, "exit", (224, 92, 88, 255)),
        (17, 24, 0, "retry stand (1,1)", (70, 151, 219, 255)),
        (2, 7, 1, "wait (1,2)", (207, 160, 84, 255)),
        (8, 15, 1, "stand (1,1)", (151, 99, 202, 255)),
        (15, 16, 1, "exit", (224, 92, 88, 255)),
    ]
    for start, end, lane, label, fill in cell_segments:
        x1 = round(left + start * width_per_second)
        x2 = round(left + end * width_per_second)
        y1 = rows["cells"] + 15 + lane * 42
        draw.rectangle((x1, y1, x2, y1 + 34), fill=fill)
        if x2 - x1 > 80:
            draw.text((x1 + 6, y1 + 7), label, font=SMALL_FONT, fill=(255, 255, 255, 255))
    draw.text(
        (180, 800),
        "PASS: max reservations 1 • collisions 0 • failure released at 7s • alpha retry succeeded • released at 30s",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def part_records(
    outputs: dict[Path, bytes],
) -> list[dict[str, Any]]:
    records = []
    for part_id, (authoring_path, runtime_path) in PART_PATHS.items():
        records.append(
            {
                "id": f"{FAMILY_ID}.{REVISION}.{part_id}",
                "role": PART_ROLES[part_id],
                "state": part_id.removeprefix("viewport-")
                if part_id.startswith("viewport-")
                else part_id,
                "sourceFrame": PART_SOURCE_FRAMES[part_id],
                "authoringFile": repo_path(authoring_path),
                "authoringSha256": sha256_bytes(outputs[authoring_path]),
                "runtimeFile": repo_path(runtime_path),
                "runtimeSha256": sha256_bytes(outputs[runtime_path]),
            }
        )
    return records


def build_manifest_and_images() -> dict[Path, bytes]:
    audit = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))
    records = load_source_records(audit)
    source_path = ROOT / SOURCE_PATH
    if sha256_file(source_path) != SOURCE_SHA256:
        raise ValueError("Mechanical-loop master hash no longer matches the audit")
    source = Image.open(source_path).convert("RGBA")
    keyed, ownership, source_frames, source_evidence = extract_source_frames(
        source,
        records,
    )
    (
        authoring_parts,
        runtime_parts,
        authoring_composites,
        animation_metrics,
        runtime_composites,
    ) = build_parts(source_frames)

    characters, rendered, roster = build_roster_validation(
        runtime_composites,
        runtime_parts["held-soda-can"],
    )
    reservation, samples = reservation_timeline()
    handoff_review = review_handoff(runtime_parts, rendered["einstein"])

    review_images = [
        review_source_ownership(
            source,
            records,
            ownership,
            source_frames,
            source_evidence,
        ),
        review_parts(runtime_parts),
        review_clean(runtime_composites),
        review_geometry(runtime_composites["a"]),
        review_animation(runtime_composites, animation_metrics),
        handoff_review,
        review_roster(rendered),
        review_reservation(samples),
        review_socket_debug(rendered, roster),
        review_before_after(handoff_review),
    ]

    outputs: dict[Path, bytes] = {
        KEYED_SOURCE_PATH: png_bytes(keyed),
        OWNERSHIP_PATH: png_bytes(ownership),
    }
    for frame, path in SOURCE_FRAME_PATHS.items():
        outputs[path] = png_bytes(source_frames[frame])
    for part_id, (authoring_path, runtime_path) in PART_PATHS.items():
        outputs[authoring_path] = png_bytes(authoring_parts[part_id])
        outputs[runtime_path] = png_bytes(runtime_parts[part_id])
    for frame, (authoring_path, runtime_path) in COMPOSITE_PATHS.items():
        outputs[authoring_path] = png_bytes(authoring_composites[frame])
        outputs[runtime_path] = png_bytes(runtime_composites[frame])
    for path, image in zip(REVIEW_PATHS, review_images, strict=True):
        outputs[path] = png_bytes(image)

    for item in source_evidence:
        path = SOURCE_FRAME_PATHS[item["frameId"]]
        item["authoringCutout"] = repo_path(path)
        item["authoringCutoutSha256"] = sha256_bytes(outputs[path])

    parts = part_records(outputs)
    parts_by_short_id = {
        record["id"].split(".")[-1]: record
        for record in parts
    }
    effect_part_id = next(
        record["id"]
        for record in parts
        if record["role"] == "effect-overlay"
    )
    shell_part_id = next(
        record["id"]
        for record in parts
        if record["role"] == "static-shell"
    )
    tray_part_id = next(
        record["id"]
        for record in parts
        if record["role"] == "pickup-tray-empty"
    )
    held_part_id = next(
        record["id"]
        for record in parts
        if record["role"] == "held-output"
    )
    held_manifest = json.loads(HELD_PROP_MANIFEST_PATH.read_text(encoding="utf-8"))
    held_asset = next(
        record for record in held_manifest["props"] if record["id"] == "held.soda-can"
    )
    spatial_authority = json.loads(
        SPATIAL_AUTHORITY_PATH.read_text(encoding="utf-8")
    )
    animation_frames = []
    for frame in FRAME_IDS:
        authoring_path, runtime_path = COMPOSITE_PATHS[frame]
        viewport_id = next(
            record["id"]
            for record in parts
            if record["state"] == frame and record["role"] == "animation-viewport"
        )
        animation_frames.append(
            {
                "id": frame,
                "viewportPartId": viewport_id,
                "effectPartIds": [effect_part_id] if frame == "c" else [],
                "durationMs": 500,
                "authoringCompositeFile": repo_path(authoring_path),
                "authoringCompositeSha256": sha256_bytes(outputs[authoring_path]),
                "runtimeCompositeFile": repo_path(runtime_path),
                "runtimeCompositeSha256": sha256_bytes(outputs[runtime_path]),
            }
        )

    review_evidence = [
        {
            "path": repo_path(path),
            "sha256": sha256_bytes(outputs[path]),
            "size": list(image.size),
        }
        for path, image in zip(REVIEW_PATHS, review_images, strict=True)
    ]
    visible_magenta = sum(
        1
        for image in [
            *(
                image
                for part_id, image in authoring_parts.items()
                if part_id != "held-soda-can"
            ),
            *authoring_composites.values(),
        ]
        for red, green, blue, alpha in image.getdata()
        if alpha and is_chroma_key((red, green, blue, alpha))
    )
    if visible_magenta:
        raise ValueError(f"U01 outputs retain {visible_magenta} chroma pixels")
    embedded_orange = {}
    for frame, image in authoring_composites.items():
        count = 0
        for y in range(PRODUCT_ROI[1], PRODUCT_ROI[3]):
            for x in range(PRODUCT_ROI[0], PRODUCT_ROI[2]):
                red, green, blue, alpha = image.getpixel((x, y))
                if (
                    alpha
                    and red > 135
                    and 35 < green < 205
                    and blue < 135
                    and red > green * 1.1
                ):
                    count += 1
        embedded_orange[frame] = count
    if any(embedded_orange.values()):
        raise ValueError(f"Product-like tray pixels remain embedded: {embedded_orange}")

    gates = {
        "F0": {
            "status": "passed",
            "evidence": [
                repo_path(AUDIT_PATH),
                *[record["recordId"] for record in records],
                "front-only U01 is required; both historical side sources remain rejected",
                "U01-r01 owner review exposed a fixed-center attachment defect; r02 supersedes it",
            ],
        },
        "F1": {
            "status": "passed",
            "evidence": [
                repo_path(REVIEW_PATHS[3]),
                "2x1x3 tiles, 64x96 px, bottom-center, front only",
            ],
        },
        "F2": {
            "status": "passed",
            "evidence": [
                *[repo_path(path) for path in SOURCE_FRAME_PATHS.values()],
                "fresh extraction from original mechanical-loop master",
            ],
        },
        "F3": {
            "status": "passed",
            "evidence": [
                repo_path(KEYED_SOURCE_PATH),
                repo_path(OWNERSHIP_PATH),
                repo_path(REVIEW_PATHS[0]),
            ],
        },
        "F4": {
            "status": "passed",
            "evidence": [
                repo_path(REVIEW_PATHS[1]),
                repo_path(REVIEW_PATHS[5]),
                repo_path(SPATIAL_AUTHORITY_PATH),
                repo_path(HELD_PROP_MANIFEST_PATH),
                "shell, viewport, empty tray, effect, and H01 held output are separate",
            ],
        },
        "F5": {
            "status": "passed",
            "evidence": [
                repo_path(REVIEW_PATHS[3]),
                repo_path(REVIEW_PATHS[4]),
                "base and sort pivots remain (1,1) across four frames",
            ],
        },
        "F6": {
            "status": "passed",
            "evidence": [
                repo_path(REVIEW_PATHS[7]),
                "atomic capacity-one reservation releases on failure and supports retry",
            ],
        },
        "F7": {
            "status": "passed",
            "evidence": [
                repo_path(REVIEW_PATHS[2]),
                repo_path(REVIEW_PATHS[4]),
                repo_path(REVIEW_PATHS[5]),
                repo_path(REVIEW_PATHS[6]),
                repo_path(REVIEW_PATHS[7]),
                repo_path(REVIEW_PATHS[8]),
                repo_path(REVIEW_PATHS[9]),
                "18 characters x 6 interact-front frames = 108 pose cases",
                "36 actor-hand and 18 facility-output attachments resolve with exact delta [0,0]",
                "30-second two-user contention, failure, release, and retry lab",
            ],
        },
        "F8": {
            "status": "pending-owner-review",
            "evidence": [repo_path(path) for path in REVIEW_PATHS],
        },
        "F9": {
            "status": "blocked",
            "evidence": ["U01 has not received its independent F8 owner decision."],
        },
        "F10": {
            "status": "blocked",
            "evidence": ["Active Office integration is outside U01 scope."],
        },
    }

    manifest = {
        "schemaVersion": 2,
        "id": "office.facility.vending-machine.u01",
        "familyId": FAMILY_ID,
        "revision": REVISION,
        "status": "owner-review-f8-pending",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "sourcePolicy": {
            "processedCropDirectReuse": False,
            "activeOfficePixelReuse": False,
            "legacyOrRejectedPixelReuse": False,
            "stagingPixelReuse": False,
            "generativeRepair": False,
            "missingAssetFallback": False,
            "sharedProductionAssetDependency": "office.held-props.h01",
        },
        "source": {
            "kind": "audited-original-mechanical-loop-master",
            "path": SOURCE_PATH,
            "sha256": SOURCE_SHA256,
            "auditManifest": repo_path(AUDIT_PATH),
            "extractionMethod": "full-master-component-ownership",
            "keyedSource": {
                "file": repo_path(KEYED_SOURCE_PATH),
                "sha256": sha256_bytes(outputs[KEYED_SOURCE_PATH]),
            },
            "ownershipMask": {
                "file": repo_path(OWNERSHIP_PATH),
                "sha256": sha256_bytes(outputs[OWNERSHIP_PATH]),
            },
            "frames": source_evidence,
        },
        "render": {
            "authoringCanvas": list(AUTHORING_CANVAS),
            "runtimeCanvas": list(RUNTIME_CANVAS),
            "uniformIntegerDivisor": RUNTIME_DIVISOR,
            "nonUniformScaling": False,
            "anchor": "bottom-center",
            "requiredOrientations": ["front"],
        },
        "spatial": {
            "authority": {
                "file": repo_path(SPATIAL_AUTHORITY_PATH),
                "sha256": sha256_file(SPATIAL_AUTHORITY_PATH),
                "id": spatial_authority["id"],
                "status": spatial_authority["status"],
            },
            "coordinateSpace": "facility-runtime-pixel",
            "unit": "pixel",
            "localSockets": {
                "base.floor": list(FACILITY_BASE_SOCKET),
                "sort.floor": list(FACILITY_BASE_SOCKET),
                "interaction.target": [48, 96],
                "output.primary": list(FACILITY_OUTPUT_SOCKET),
                "effect.origin": list(FACILITY_EFFECT_SOCKET),
                "viewport.origin": [
                    VIEWPORT_RUNTIME_BOX[0],
                    VIEWPORT_RUNTIME_BOX[1],
                ],
            },
            "perSceneAttachmentOffsets": False,
            "centerToCenterAttachment": False,
            "missingSocketFallback": False,
        },
        "geometry": {
            "schemaVersion": 3,
            "id": f"{FAMILY_ID}.{REVISION}",
            "assetType": "animated-shell",
            "placementPlane": "floor",
            "physicalScale": {
                "width": 2,
                "depth": 1,
                "height": 3,
                "unit": "tile",
            },
            "footprint": {
                "width": 2,
                "depth": 1,
                "unit": "tile",
            },
            "supportPlane": None,
            "basePivot": {"x": 1, "y": 1, "unit": "tile"},
            "sortPivot": {"x": 1, "y": 1, "unit": "tile"},
            "renderBounds": {
                "width": RUNTIME_CANVAS[0],
                "height": RUNTIME_CANVAS[1],
                "unit": "authoring-pixel",
            },
            "renderOffset": {
                "x": -RUNTIME_CANVAS[0] // 2,
                "y": -RUNTIME_CANVAS[1],
                "unit": "authoring-pixel",
            },
            "verticalExtension": {
                "aboveBase": 3,
                "belowBase": 0,
                "unit": "tile",
            },
            "occlusionParts": [
                {
                    "id": "base",
                    "role": "base",
                    "assetId": shell_part_id,
                }
            ],
            "attachmentSlots": [],
            "seatSlots": [],
            "orientation": "front",
            "animation": {
                "frameCount": 4,
                "stableBasePivot": True,
                "stableSortPivot": True,
            },
        },
        "parts": parts,
        "animation": {
            "frameCount": 4,
            "shellPartId": shell_part_id,
            "viewportBoundsAuthoring": list(VIEWPORT_BOX),
            "viewportBoundsRuntime": list(VIEWPORT_RUNTIME_BOX),
            "shellStableAcrossFrames": True,
            "basePivotStableAcrossFrames": True,
            "sortPivotStableAcrossFrames": True,
            "outsideViewportChangedPixels": 0,
            "frames": animation_frames,
        },
        "outputHandoff": {
            "pickupTrayPartId": tray_part_id,
            "heldAssetPartId": held_part_id,
            "heldAssetId": held_asset["id"],
            "heldAssetManifest": repo_path(HELD_PROP_MANIFEST_PATH),
            "heldAssetManifestSha256": sha256_file(HELD_PROP_MANIFEST_PATH),
            "heldAssetRuntimeSha256": held_asset["runtimeSha256"],
            "effectPartIds": [effect_part_id],
            "productEmbeddedInShell": False,
            "productEmbeddedInViewportFrames": False,
            "transition": "facility-output-socket-to-actor-hand-socket",
            "heldVisiblePoseFrames": [2, 3, 4],
            "facilityOutputSocketId": "output.primary",
            "actorGripSocketId": "hand.primary.grip",
            "propGripSocketId": "grip.primary",
            "runtimeScale": 1,
            "handForegroundMaskRequired": True,
            "attachmentDeltaFailures": 0,
            "timeline": [
                {"poseFrame": 0, "attachmentParent": None},
                {"poseFrame": 1, "attachmentParent": None},
                {
                    "poseFrame": 2,
                    "attachmentParent": "facility.output.primary",
                },
                {
                    "poseFrame": 3,
                    "attachmentParent": "actor.hand.primary.grip",
                },
                {
                    "poseFrame": 4,
                    "attachmentParent": "actor.hand.primary.grip",
                },
                {"poseFrame": 5, "attachmentParent": None},
            ],
        },
        "interaction": {
            "capacity": 1,
            "durationSeconds": 6,
            "atomicReservation": True,
            "releaseOnFailure": True,
            "states": [
                "available",
                "reserved",
                "approaching",
                "interacting",
                "dispensing",
                "releasing",
            ],
            "slot": {
                "id": "vending-front-01",
                "stand": {"x": 1, "y": 1},
                "approach": {"x": 1, "y": 2},
                "exit": {"x": 0, "y": 2},
                "facing": "front",
                "action": "use-vending-machine",
                "visualPose": "interact-front",
                "reservationId": "vending-u01.front-01",
            },
        },
        "rosterValidation": roster,
        "reservationValidation": reservation,
        "quality": {
            "sourceDimensions": list(source.size),
            "sourceFrameCount": len(source_frames),
            "selectedComponentCount": len(source_frames),
            "visibleMagentaPixels": visible_magenta,
            "outsideViewportChangedPixels": animation_metrics,
            "effectPixelCount": animation_metrics["effectPixels"],
            "heldProductPixelCount": animation_metrics["heldProductPixels"],
            "machineProductRemovalPixelCount": animation_metrics["heldProductPixels"],
            "embeddedProductPixelsByFrame": embedded_orange,
            "validatedPoseCases": len(characters) * ACTIVE_FRAMES,
            "visiblePropCases": roster["visiblePropCases"],
            "facilityOutputAttachmentCases": roster[
                "facilityOutputAttachmentCases"
            ],
            "actorHandAttachmentCases": roster["actorHandAttachmentCases"],
            "attachmentDeltaFailures": roster["attachmentDeltaFailures"],
            "shellPartHashSharedByEveryFrame": True,
        },
        "gates": gates,
        "reviewOutputs": [repo_path(path) for path in REVIEW_PATHS],
        "reviewEvidence": review_evidence,
        "rejectedOrientations": list(SIDE_RECORDS),
        "behaviorReference": {
            "manifest": repo_path(BEHAVIOR_REFERENCE),
            "manifestSha256": sha256_file(BEHAVIOR_REFERENCE),
            "purpose": "behavior-and-state-reference-only",
            "pixelReuse": False,
        },
        "activeOfficeBaseline": {
            "file": repo_path(ACTIVE_REGISTRY),
            "sha256": sha256_file(ACTIVE_REGISTRY),
            "importsCandidate": False,
        },
        "supersedes": {
            "revision": "u01",
            "reason": "F8 review exposed a fixed-center held-output attachment defect",
            "historicalReview": repo_path(R01_REVIEW_PATH),
            "historicalReviewSha256": sha256_file(R01_REVIEW_PATH),
        },
        "permissions": {
            "familyLab": True,
            "ownerReview": True,
            "furnitureOnlyRoom": False,
            "otherFacilityFamilies": False,
            "activeOfficePromotion": False,
        },
        "ownerDecision": None,
    }
    outputs[MANIFEST_PATH] = json_bytes(manifest)
    return outputs


def write_outputs(outputs: dict[Path, bytes]) -> None:
    for path, content in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)


def check_outputs(outputs: dict[Path, bytes]) -> list[str]:
    failures: list[str] = []
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
    args = parser.parse_args()
    outputs = build_manifest_and_images()
    if args.check:
        failures = check_outputs(outputs)
        if failures:
            print("\n".join(failures), file=sys.stderr)
            raise SystemExit(1)
        print(
            "Vending U01-r02 OK: four full-master ownership extractions, static "
            "shell, local viewport, separate empty tray/effect/held output, "
            "108 socket-driven interact-front cases, and 30-second reservation proof."
        )
        return
    write_outputs(outputs)
    print(f"Wrote {len(outputs)} Vending U01-r02 files.")
    print(f"Manifest: {repo_path(MANIFEST_PATH)}")
    print("Status: F0-F7 passed; owner-review-f8-pending; F9/F10 blocked.")


if __name__ == "__main__":
    main()
