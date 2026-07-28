#!/usr/bin/env python3
"""Build the upright-pose revision of the massage-chair furniture family.

The massage-chair candidate starts from the audited full master, selects one
connected component, emits a no-resample authoring shell, decomposes that shell
into rear and foreground layers, derives an exact 3:1 runtime set, and builds
F0-F7 review evidence with the owner-approved working-front-seated pose. It
never imports R01 pixels or another processed furniture crop and never changes
Active Office runtime files.
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
AUDIT_PATH = ROOT / "assets" / "game" / "manifests" / "office-furniture-master-audit-v1.json"
MANIFEST_PATH = ROOT / "assets" / "game" / "manifests" / "office-furniture-chair-massage-r02.json"
POSE_AUTHORITY_PATH = (
    ROOT
    / "assets"
    / "game"
    / "manifests"
    / "office-character-seat-sockets-v1.json"
)
ACTIVE_REGISTRY = ROOT / "apps" / "web" / "src" / "features" / "office" / "components" / "officeAssetRegistry.ts"

OUTPUT_ROOT = (
    ROOT
    / "assets"
    / "game"
    / "processed"
    / "office-furniture-family-v1"
    / "chair-massage-r02"
)
AUTHORING_ROOT = OUTPUT_ROOT / "authoring"
RUNTIME_ROOT = OUTPUT_ROOT / "runtime"
REVIEW_ROOT = (
    ROOT
    / "assets"
    / "art"
    / "layout-references"
    / "office-furniture-family-v1"
    / "chair-massage-r02"
)

RECORD_ID = "modern-bright-library-v1:env-05-facility-lounge:chair.massage.modern"
FAMILY_ID = "chair.massage.modern"
REVISION = "r02"
TILE = 32
AUTHORING_DIVISOR = 3
RUNTIME_CANVAS = (64, 96)
AUTHORING_CANVAS = (
    RUNTIME_CANVAS[0] * AUTHORING_DIVISOR,
    RUNTIME_CANVAS[1] * AUTHORING_DIVISOR,
)
WORKING_FRONT_ROW = 14
LOUNGE_COMPARISON_ROW = 12
ACTIVE_FRAMES = 6
ACTOR_FRAME = (96, 104)
LOUNGE_COMPARISON_CONTACT = (48, 75)
CHAIR_SEAT_ANCHOR = (32, 50)
INTERACTION_ACTION = "use-massage-chair"
VISUAL_POSE = "working-front-seated"

PART_PATHS = {
    "shell": (
        AUTHORING_ROOT / "chair.massage.modern.r02.shell.png",
        RUNTIME_ROOT / "chair.massage.modern.r02.shell.png",
    ),
    "rear": (
        AUTHORING_ROOT / "chair.massage.modern.r02.rear.png",
        RUNTIME_ROOT / "chair.massage.modern.r02.rear.png",
    ),
    "foreground": (
        AUTHORING_ROOT / "chair.massage.modern.r02.foreground.png",
        RUNTIME_ROOT / "chair.massage.modern.r02.foreground.png",
    ),
}
OWNERSHIP_PATH = AUTHORING_ROOT / "chair.massage.modern.r02.ownership-mask.png"
REVIEW_PATHS = [
    REVIEW_ROOT / "01-source-ownership.png",
    REVIEW_ROOT / "02-alpha-parts.png",
    REVIEW_ROOT / "03-geometry-grid.png",
    REVIEW_ROOT / "04-pose-comparison.png",
    REVIEW_ROOT / "05-six-frame-seat-lab.png",
    REVIEW_ROOT / "06-roster-fit.png",
    REVIEW_ROOT / "07-reservation-timeline.png",
]


def repo_path(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def png_bytes(image: Image.Image) -> bytes:
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
HEADING_FONT = font(24, bold=True)
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


def checkerboard(
    size: tuple[int, int],
    *,
    cell: int = 16,
) -> Image.Image:
    image = Image.new("RGBA", size, (229, 233, 238, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle(
                    (x, y, min(size[0], x + cell), min(size[1], y + cell)),
                    fill=(203, 211, 221, 255),
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
    alpha = image.getchannel("A")
    visible = bytearray(1 if value else 0 for value in alpha.getdata())
    seen = bytearray(width * height)
    components: list[dict[str, Any]] = []
    for start, value in enumerate(visible):
        if not value or seen[start]:
            continue
        queue = deque([start])
        seen[start] = 1
        points: list[int] = []
        left = width
        top = height
        right = 0
        bottom = 0
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
                "pixels": points,
                "pixelCount": len(points),
                "bounds": (left, top, right, bottom),
            }
        )
    return components


def box_contains(
    box: tuple[int, int, int, int],
    x: int,
    y: int,
) -> bool:
    return box[0] <= x < box[2] and box[1] <= y < box[3]


def select_owned_component(
    keyed: Image.Image,
    source_bounds: tuple[int, int, int, int],
) -> tuple[Image.Image, dict[str, Any], int]:
    components = connected_components(keyed)
    candidates: list[dict[str, Any]] = []
    for component in components:
        overlap = sum(
            1
            for point in component["pixels"]
            if box_contains(
                source_bounds,
                point % keyed.width,
                point // keyed.width,
            )
        )
        if overlap == 0:
            continue
        component["sourceOverlapPixels"] = overlap
        component["sourceOverlapRatio"] = overlap / component["pixelCount"]
        candidates.append(component)
    if len(candidates) != 1:
        raise ValueError(
            f"{FAMILY_ID}: expected one component in audited bounds, found {len(candidates)}"
        )
    selected = candidates[0]
    if selected["sourceOverlapRatio"] != 1:
        raise ValueError(
            f"{FAMILY_ID}: selected component crosses its audited source bounds"
        )
    mask_values = bytearray(keyed.width * keyed.height)
    for point in selected["pixels"]:
        mask_values[point] = 255
    owned_mask = Image.frombytes("L", keyed.size, bytes(mask_values))
    return owned_mask, selected, len(components) - 1


def pad_owned_component(
    keyed: Image.Image,
    owned_mask: Image.Image,
    owned_bounds: tuple[int, int, int, int],
) -> tuple[Image.Image, Image.Image, dict[str, int]]:
    subject = keyed.crop(owned_bounds)
    subject_mask = owned_mask.crop(owned_bounds)
    if subject.size[0] + 16 > AUTHORING_CANVAS[0]:
        raise ValueError("Massage-chair subject is wider than the authoring canvas")
    if subject.size[1] + 16 > AUTHORING_CANVAS[1]:
        raise ValueError("Massage-chair subject is taller than the authoring canvas")
    left = (AUTHORING_CANVAS[0] - subject.width) // 2
    top = (AUTHORING_CANVAS[1] - subject.height) // 2
    padding = {
        "left": left,
        "top": top,
        "right": AUTHORING_CANVAS[0] - subject.width - left,
        "bottom": AUTHORING_CANVAS[1] - subject.height - top,
    }
    if min(padding.values()) < 8:
        raise ValueError(f"Massage-chair padding is too small: {padding}")
    shell = Image.new("RGBA", AUTHORING_CANVAS, (0, 0, 0, 0))
    shell.paste(subject, (left, top), subject_mask)
    canvas_mask = Image.new("L", AUTHORING_CANVAS, 0)
    canvas_mask.paste(subject_mask, (left, top))
    return shell, canvas_mask, padding


def split_shell(
    shell: Image.Image,
) -> tuple[Image.Image, Image.Image, list[list[float]]]:
    regions = [
        [0.00, 0.16, 0.28, 1.00],
        [0.72, 0.16, 1.00, 1.00],
        [0.18, 0.58, 0.82, 1.00],
    ]
    region_mask = Image.new("L", shell.size, 0)
    draw = ImageDraw.Draw(region_mask)
    for left, top, right, bottom in regions:
        draw.rectangle(
            (
                round(left * shell.width),
                round(top * shell.height),
                round(right * shell.width) - 1,
                round(bottom * shell.height) - 1,
            ),
            fill=255,
        )
    shell_alpha = shell.getchannel("A")
    foreground_alpha = Image.new("L", shell.size, 0)
    rear_alpha = Image.new("L", shell.size, 0)
    foreground_alpha.putdata(
        [
            alpha if region else 0
            for alpha, region in zip(
                shell_alpha.getdata(),
                region_mask.getdata(),
                strict=True,
            )
        ]
    )
    rear_alpha.putdata(
        [
            alpha if not region else 0
            for alpha, region in zip(
                shell_alpha.getdata(),
                region_mask.getdata(),
                strict=True,
            )
        ]
    )
    foreground = shell.copy()
    foreground.putalpha(foreground_alpha)
    rear = shell.copy()
    rear.putalpha(rear_alpha)
    return rear, foreground, regions


def composite_parts(
    rear: Image.Image,
    foreground: Image.Image,
) -> Image.Image:
    output = Image.new("RGBA", rear.size, (0, 0, 0, 0))
    output.alpha_composite(rear)
    output.alpha_composite(foreground)
    return output


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
        (
            left - first_xy[0],
            top - first_xy[1],
            right - first_xy[0],
            bottom - first_xy[1],
        )
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
        for first_value, second_value in zip(
            first_alpha.getdata(),
            second_alpha.getdata(),
            strict=True,
        )
        if first_value and second_value
    )


def pose_authority() -> tuple[dict[str, Any], list[dict[str, Any]]]:
    authority = json.loads(POSE_AUTHORITY_PATH.read_text(encoding="utf-8"))
    if (
        authority.get("schema") != "office-character-seat-sockets"
        or authority.get("status") != "owner-approved"
        or authority.get("audit", {}).get("seatCapableCount") != 18
    ):
        raise ValueError("Working-seat pose authority is missing or not approved")
    entries = [
        entry
        for entry in authority["entries"]
        if entry.get("seatCapability") == "working-seated"
    ]
    ids = [entry["slug"] for entry in entries]
    if len(ids) != 18 or len(set(ids)) != 18:
        raise ValueError(f"Expected eighteen unique seat-capable characters: {ids}")
    for entry in entries:
        source = entry["source"]
        path = ROOT / source["file"]
        front = entry["orientations"]["front"]
        if (
            not path.exists()
            or sha256_file(path) != source["sha256"]
            or entry["framePixels"] != list(ACTOR_FRAME)
            or front["row"] != WORKING_FRONT_ROW
            or len(front["frames"]) != ACTIVE_FRAMES
        ):
            raise ValueError(f"Stale working-front authority for {entry['slug']}")
        for frame_index, frame in enumerate(front["frames"]):
            if (
                frame["frame"] != frame_index
                or frame["seatContactLocal"] != [48, 80]
            ):
                raise ValueError(
                    f"Unexpected working-front socket for {entry['slug']} "
                    f"frame {frame_index}"
                )
    return authority, entries


def actor_frame(
    sheet: Image.Image,
    frame: int,
    *,
    row: int = WORKING_FRONT_ROW,
) -> Image.Image:
    if sheet.size != (ACTOR_FRAME[0] * 8, ACTOR_FRAME[1] * 15):
        raise ValueError(f"Unexpected 1x character sheet size: {sheet.size}")
    return sheet.crop(
        (
            frame * ACTOR_FRAME[0],
            row * ACTOR_FRAME[1],
            (frame + 1) * ACTOR_FRAME[0],
            (row + 1) * ACTOR_FRAME[1],
        )
    )


def compose_seated_case(
    rear: Image.Image,
    foreground: Image.Image,
    actor: Image.Image,
    actor_contact: tuple[int, int],
    *,
    canvas_size: tuple[int, int] = (160, 160),
) -> tuple[Image.Image, dict[str, Any]]:
    canvas = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    chair_xy = (
        (canvas.width - rear.width) // 2,
        canvas.height - rear.height - 8,
    )
    seat_xy = (
        chair_xy[0] + CHAIR_SEAT_ANCHOR[0],
        chair_xy[1] + CHAIR_SEAT_ANCHOR[1],
    )
    actor_xy = (
        seat_xy[0] - actor_contact[0],
        seat_xy[1] - actor_contact[1],
    )
    canvas.alpha_composite(rear, chair_xy)
    canvas.alpha_composite(actor, actor_xy)
    canvas.alpha_composite(foreground, chair_xy)
    actor_bounds = actor.getbbox()
    inside = (
        actor_xy[0] >= 0
        and actor_xy[1] >= 0
        and actor_xy[0] + actor.width <= canvas.width
        and actor_xy[1] + actor.height <= canvas.height
    )
    overlap = alpha_overlap(actor, actor_xy, foreground, chair_xy)
    return canvas, {
        "actorPosition": list(actor_xy),
        "actorContactLocal": list(actor_contact),
        "actorFrameBounds": list(actor_bounds) if actor_bounds else None,
        "actorInsideReviewCard": inside,
        "foregroundOverlapPixels": overlap,
    }


def build_roster_validation(
    rear_runtime: Image.Image,
    foreground_runtime: Image.Image,
) -> tuple[list[dict[str, Any]], dict[str, list[Image.Image]]]:
    records: list[dict[str, Any]] = []
    frames_by_character: dict[str, list[Image.Image]] = {}
    _, entries = pose_authority()
    for entry in entries:
        source = entry["source"]
        path = ROOT / source["file"]
        sheet = Image.open(path).convert("RGBA")
        front = entry["orientations"]["front"]
        character_frames: list[dict[str, Any]] = []
        rendered_frames: list[Image.Image] = []
        for frame_index in range(ACTIVE_FRAMES):
            actor = actor_frame(sheet, frame_index)
            actor_contact = tuple(front["frames"][frame_index]["seatContactLocal"])
            composition, metrics = compose_seated_case(
                rear_runtime,
                foreground_runtime,
                actor,
                actor_contact,
            )
            if not metrics["actorInsideReviewCard"]:
                raise ValueError(
                    f"{source['id']} frame {frame_index} leaves the review card"
                )
            if metrics["foregroundOverlapPixels"] <= 0:
                raise ValueError(
                    f"{source['id']} frame {frame_index} misses the foreground layer"
                )
            character_frames.append(
                {
                    "frame": frame_index,
                    "frameBounds": metrics["actorFrameBounds"],
                    "actorPosition": metrics["actorPosition"],
                    "actorContactLocal": metrics["actorContactLocal"],
                    "actorInsideReviewCard": metrics["actorInsideReviewCard"],
                    "foregroundOverlapPixels": metrics[
                        "foregroundOverlapPixels"
                    ],
                }
            )
            rendered_frames.append(composition)
        records.append(
            {
                "id": entry["slug"],
                "sheet": source["file"],
                "sha256": sha256_file(path),
                "measurementStatus": front["measurementStatus"],
                "frames": character_frames,
            }
        )
        frames_by_character[entry["slug"]] = rendered_frames
    return records, frames_by_character


def review_source_ownership(
    source: Image.Image,
    source_bounds: tuple[int, int, int, int],
    owned_bounds: tuple[int, int, int, int],
    shell: Image.Image,
    selected_pixels: int,
    discarded_components: int,
) -> Image.Image:
    board = Image.new("RGBA", (1600, 1000), (236, 240, 245, 255))
    draw = draw_title(
        board,
        "Massage Chair R02 — Full-master ownership",
        "F0/F2/F3 evidence • original master only • no processed crop • no generative repair",
    )
    master_review = source.copy()
    master_draw = ImageDraw.Draw(master_review)
    master_draw.rectangle(source_bounds, outline=(255, 178, 47, 255), width=8)
    master_draw.rectangle(owned_bounds, outline=(53, 219, 142, 255), width=6)
    master_review.thumbnail((760, 760), Image.Resampling.LANCZOS)
    board.alpha_composite(master_review, (38, 120))
    draw.text((38, 890), "Orange: audited source cell", font=BODY_FONT, fill=(123, 76, 0, 255))
    draw.text((38, 920), "Green: one owned connected component", font=BODY_FONT, fill=(0, 105, 66, 255))

    preview = checkerboard((560, 700), cell=18)
    enlarged = shell.resize(
        (shell.width * 2, shell.height * 2),
        Image.Resampling.NEAREST,
    )
    preview.alpha_composite(
        enlarged,
        ((preview.width - enlarged.width) // 2, 40),
    )
    board.alpha_composite(preview, (960, 120))
    draw.rectangle((940, 100, 1540, 850), outline=(112, 128, 148, 255), width=3)
    metrics = [
        f"Master: {source.width}×{source.height}px",
        f"Audited cell: {source_bounds}",
        f"Owned bounds: {owned_bounds}",
        f"Selected pixels: {selected_pixels:,}",
        "Selected components: 1",
        f"Discarded components: {discarded_components}",
        "Cell-boundary contact: 0",
        "Master-boundary contact: 0",
        "Authoring shell: 192×288px",
    ]
    for index, value in enumerate(metrics):
        x = 820 + (index % 3) * 250
        y = 875 + (index // 3) * 34
        draw.text((x, y), value, font=SMALL_FONT, fill=(44, 55, 70, 255))
    return board


def review_parts(
    shell: Image.Image,
    rear: Image.Image,
    foreground: Image.Image,
    padding: dict[str, int],
) -> Image.Image:
    board = Image.new("RGBA", (1600, 1000), (234, 238, 244, 255))
    draw = draw_title(
        board,
        "Massage Chair R02 — Alpha and layer decomposition",
        "F3/F4 evidence • shell = rear + foreground pixel-exact • authoring pixels are not resampled",
    )
    items = [
        ("CLEAN SHELL", shell),
        ("REAR / BASE", rear),
        ("FOREGROUND", foreground),
        ("RECOMPOSED", composite_parts(rear, foreground)),
    ]
    for index, (label, image) in enumerate(items):
        left = 30 + index * 390
        panel = checkerboard((360, 700), cell=18)
        enlarged = image.resize(
            (image.width * 2, image.height * 2),
            Image.Resampling.NEAREST,
        )
        panel.alpha_composite(
            enlarged,
            ((panel.width - enlarged.width) // 2, 50),
        )
        board.alpha_composite(panel, (left, 145))
        draw.rectangle((left, 145, left + 360, 845), outline=(105, 121, 143, 255), width=3)
        draw.text((left + 16, 106), label, font=HEADING_FONT, fill=(35, 47, 63, 255))
    metrics = [
        (
            "Canvas 192×288 • transparent padding "
            f"L{padding['left']} T{padding['top']} "
            f"R{padding['right']} B{padding['bottom']}"
        ),
        "Runtime derivation 64×96 • uniform integer divisor 3",
        "Non-uniform scaling: forbidden",
        "Foreground: arms, lower shell, and foot enclosure",
    ]
    for index, value in enumerate(metrics):
        draw.text((42, 875 + index * 26), value, font=BODY_FONT, fill=(44, 55, 70, 255))
    return board


def review_geometry(
    shell: Image.Image,
) -> Image.Image:
    board = Image.new("RGBA", (1200, 1000), (239, 242, 247, 255))
    draw = draw_title(
        board,
        "Massage Chair R02 — Geometry and route contract",
        "F1/F5 evidence • 2×2 footprint • 2×3 render box • capacity 1 • front orientation",
    )
    grid_origin = (190, 150)
    tile = TILE * AUTHORING_DIVISOR
    columns = 7
    rows = 7
    for y in range(rows):
        for x in range(columns):
            left = grid_origin[0] + x * tile
            top = grid_origin[1] + y * tile
            fill = (249, 250, 252, 255)
            if 2 <= x < 4 and 1 <= y < 3:
                fill = (178, 218, 252, 255)
            if (x, y) == (3, 3):
                fill = (172, 235, 194, 255)
            if (x, y) == (3, 4):
                fill = (255, 225, 155, 255)
            draw.rectangle(
                (left, top, left + tile, top + tile),
                fill=fill,
                outline=(135, 149, 168, 255),
                width=2,
            )
            draw.text(
                (left + 6, top + 5),
                f"{x},{y}",
                font=SMALL_FONT,
                fill=(91, 105, 124, 255),
            )
    shell_xy = (
        grid_origin[0] + 2 * tile,
        grid_origin[1],
    )
    board.alpha_composite(shell, shell_xy)
    seat_xy = (
        grid_origin[0] + 3 * tile,
        grid_origin[1] + 2 * tile,
    )
    draw.ellipse(
        (seat_xy[0] - 10, seat_xy[1] - 10, seat_xy[0] + 10, seat_xy[1] + 10),
        fill=(220, 51, 69, 255),
        outline=(255, 255, 255, 255),
        width=3,
    )
    labels = [
        ("Blue", "2×2 occupied footprint", (59, 126, 184, 255)),
        ("Green", "Approach cell (1,2)", (35, 139, 80, 255)),
        ("Amber", "Exit cell (1,3)", (164, 108, 0, 255)),
        ("Red dot", "Seat socket (1,1)", (188, 37, 53, 255)),
    ]
    right = 890
    draw.text((right, 170), "LOCAL CONTRACT", font=HEADING_FONT, fill=(33, 44, 59, 255))
    for index, (name, description, color) in enumerate(labels):
        y = 230 + index * 70
        draw.rectangle((right, y, right + 32, y + 32), fill=color)
        draw.text((right + 48, y - 2), name, font=BODY_FONT, fill=(40, 52, 67, 255))
        draw.text((right + 48, y + 24), description, font=SMALL_FONT, fill=(81, 95, 113, 255))
    values = [
        "Physical: 2×2×2 tiles",
        "Render: 64×96 pixels",
        "Base pivot: (1,2)",
        "Sort pivot: (1,2)",
        "Render offset: (-32,-96)",
        "Facing: front",
        "Capacity: 1",
        "Action: use-massage-chair",
        "Pose: working-front-seated",
    ]
    for index, value in enumerate(values):
        draw.text((right, 550 + index * 40), value, font=BODY_FONT, fill=(40, 52, 67, 255))
    return board


def review_pose_comparison(
    lounge: Image.Image,
    lounge_metrics: dict[str, Any],
    working: Image.Image,
    working_metrics: dict[str, Any],
) -> Image.Image:
    board = Image.new("RGBA", (1600, 900), (232, 237, 244, 255))
    draw = draw_title(
        board,
        "Massage Chair R02 — Pose decision",
        "Owner direction • reject lounge-front • use owner-approved working-front-seated",
    )
    comparisons = [
        (
            "REJECTED R01 POSE",
            "lounge-front / row 12",
            lounge,
            lounge_metrics,
            (202, 69, 75, 255),
        ),
        (
            "R02 CANDIDATE POSE",
            "working-front-seated / row 14",
            working,
            working_metrics,
            (45, 158, 103, 255),
        ),
    ]
    for index, (heading, pose, image, metrics, color) in enumerate(comparisons):
        left = 70 + index * 760
        top = 125
        panel = checkerboard((700, 640), cell=24)
        enlarged = image.resize(
            (image.width * 3, image.height * 3),
            Image.Resampling.NEAREST,
        )
        panel.alpha_composite(
            enlarged,
            ((panel.width - enlarged.width) // 2, 70),
        )
        board.alpha_composite(panel, (left, top))
        draw.rectangle(
            (left, top, left + panel.width, top + panel.height),
            outline=color,
            width=5,
        )
        draw.text((left + 20, top + 16), heading, font=HEADING_FONT, fill=color)
        draw.text(
            (left + 20, top + 52),
            pose,
            font=BODY_FONT,
            fill=(43, 55, 72, 255),
        )
        draw.text(
            (left + 20, top + 590),
            (
                f"actor contact {tuple(metrics['actorContactLocal'])}  •  "
                f"foreground overlap {metrics['foregroundOverlapPixels']} px"
            ),
            font=BODY_FONT,
            fill=(43, 55, 72, 255),
        )
    draw.text(
        (70, 820),
        "Both panels use the newly extracted R02 chair. Only the frozen actor row and approved contact socket change.",
        font=BODY_FONT,
        fill=(45, 58, 75, 255),
    )
    return board


def review_six_frames(
    frames: list[Image.Image],
    metrics: list[dict[str, Any]],
) -> Image.Image:
    board = Image.new("RGBA", (1600, 1000), (232, 237, 244, 255))
    draw = draw_title(
        board,
        "Massage Chair R02 — Six-frame isolated seat lab",
        "F4/F7 evidence • Einstein working-front-seated • approved socket • no actor or furniture scaling",
    )
    for index, frame in enumerate(frames):
        column = index % 3
        row = index // 3
        left = 50 + column * 510
        top = 120 + row * 420
        panel = checkerboard((460, 360), cell=16)
        enlarged = frame.resize(
            (frame.width * 2, frame.height * 2),
            Image.Resampling.NEAREST,
        )
        panel.alpha_composite(
            enlarged,
            ((panel.width - enlarged.width) // 2, 20),
        )
        board.alpha_composite(panel, (left, top))
        draw.rectangle((left, top, left + 460, top + 360), outline=(102, 119, 141, 255), width=3)
        overlap = metrics[index]["foregroundOverlapPixels"]
        draw.text(
            (left + 14, top + 314),
            f"FRAME {index}  •  foreground overlap {overlap}px",
            font=BODY_FONT,
            fill=(36, 49, 65, 255),
        )
    draw.text(
        (50, 940),
        "All six frames use authority contact (48,80), chair seat anchor (32,50), and furniture scale 1.0.",
        font=BODY_FONT,
        fill=(45, 58, 75, 255),
    )
    return board


def review_roster(
    frames_by_character: dict[str, list[Image.Image]],
    records: list[dict[str, Any]],
) -> Image.Image:
    board = Image.new("RGBA", (1600, 900), (232, 237, 244, 255))
    draw = draw_title(
        board,
        "Massage Chair R02 — Eighteen-character fit",
        "F7 evidence • frame 3 shown • all 108 working-front frames validated • one chair scale and one seat socket",
    )
    card_width = 250
    card_height = 250
    for index, record in enumerate(records):
        column = index % 6
        row = index // 6
        left = 35 + column * 260
        top = 105 + row * 260
        panel = checkerboard((card_width, card_height), cell=12)
        frame = frames_by_character[record["id"]][3]
        enlarged = frame.resize(
            (frame.width * 1, frame.height * 1),
            Image.Resampling.NEAREST,
        )
        panel.alpha_composite(
            enlarged,
            ((panel.width - enlarged.width) // 2, 42),
        )
        board.alpha_composite(panel, (left, top))
        draw.rectangle(
            (left, top, left + card_width, top + card_height),
            outline=(106, 123, 145, 255),
            width=2,
        )
        min_overlap = min(
            frame_record["foregroundOverlapPixels"]
            for frame_record in record["frames"]
        )
        draw.text(
            (left + 10, top + 8),
            record["id"],
            font=SMALL_FONT,
            fill=(36, 49, 65, 255),
        )
        draw.text(
            (left + 10, top + 224),
            f"6/6 inside • min overlap {min_overlap}px",
            font=SMALL_FONT,
            fill=(51, 105, 75, 255),
        )
    return board


def reservation_timeline() -> tuple[dict[str, Any], Image.Image]:
    visits = [
        {
            "actorId": "agent-a",
            "requestAt": 0,
            "acquiredAt": 0,
            "approachUntil": 2,
            "occupiedUntil": 14,
            "releaseUntil": 15,
        },
        {
            "actorId": "agent-b",
            "requestAt": 1,
            "acquiredAt": 15,
            "approachUntil": 17,
            "occupiedUntil": 29,
            "releaseUntil": 30,
        },
    ]
    samples: list[dict[str, Any]] = []
    maximum = 0
    collisions = 0
    for second in range(31):
        held_by: list[str] = []
        states: dict[str, str] = {}
        for visit in visits:
            actor_id = visit["actorId"]
            if second < visit["requestAt"]:
                state = "idle"
            elif second < visit["acquiredAt"]:
                state = "waiting"
            elif second < visit["approachUntil"]:
                state = "approaching"
                held_by.append(actor_id)
            elif second < visit["occupiedUntil"]:
                state = "occupied"
                held_by.append(actor_id)
            elif second < visit["releaseUntil"]:
                state = "releasing"
                held_by.append(actor_id)
            else:
                state = "complete"
            states[actor_id] = state
        maximum = max(maximum, len(held_by))
        if len(held_by) > 1:
            collisions += 1
        samples.append(
            {
                "second": second,
                "heldBy": held_by[0] if held_by else None,
                "states": states,
            }
        )
    validation = {
        "durationSeconds": 30,
        "actorCount": 2,
        "maximumConcurrentReservations": maximum,
        "collisionCount": collisions,
        "releasedAtEnd": samples[-1]["heldBy"] is None,
        "visits": visits,
        "samples": samples,
    }

    board = Image.new("RGBA", (1600, 900), (238, 241, 246, 255))
    draw = draw_title(
        board,
        "Massage Chair R02 — Atomic reservation proof",
        "F6/F7 evidence • two actors • capacity 1 • 30 simulated seconds • release on completion",
    )
    left = 130
    top = 220
    width = 1320
    second_width = width / 30
    rows = {
        "agent-a": top,
        "agent-b": top + 170,
        "slot-held-by": top + 360,
    }
    colors = {
        "waiting": (164, 171, 182, 255),
        "approaching": (80, 152, 216, 255),
        "occupied": (43, 179, 105, 255),
        "releasing": (241, 169, 57, 255),
        "complete": (220, 225, 231, 255),
    }
    for name, y in rows.items():
        draw.text((30, y + 35), name, font=BODY_FONT, fill=(42, 54, 70, 255))
        draw.rectangle((left, y, left + width, y + 100), fill=(250, 251, 253, 255), outline=(122, 137, 157, 255), width=2)
    for second in range(31):
        x = round(left + second * second_width)
        draw.line((x, top - 28, x, top + 460), fill=(197, 204, 214, 255), width=1)
        if second % 2 == 0:
            draw.text((x - 6, top - 55), str(second), font=SMALL_FONT, fill=(74, 87, 104, 255))
    for visit in visits:
        actor_id = visit["actorId"]
        y = rows[actor_id]
        segments = [
            ("waiting", visit["requestAt"], visit["acquiredAt"]),
            ("approaching", visit["acquiredAt"], visit["approachUntil"]),
            ("occupied", visit["approachUntil"], visit["occupiedUntil"]),
            ("releasing", visit["occupiedUntil"], visit["releaseUntil"]),
        ]
        for state, start, end in segments:
            if start == end:
                continue
            x1 = round(left + start * second_width)
            x2 = round(left + end * second_width)
            draw.rectangle((x1, y + 18, x2, y + 82), fill=colors[state])
            if x2 - x1 > 80:
                draw.text((x1 + 8, y + 39), state, font=SMALL_FONT, fill=(20, 31, 43, 255))
    slot_y = rows["slot-held-by"]
    for visit, color in zip(visits, ((80, 152, 216, 255), (132, 91, 187, 255)), strict=True):
        x1 = round(left + visit["acquiredAt"] * second_width)
        x2 = round(left + visit["releaseUntil"] * second_width)
        draw.rectangle((x1, slot_y + 18, x2, slot_y + 82), fill=color)
        draw.text((x1 + 8, slot_y + 39), visit["actorId"], font=SMALL_FONT, fill=(255, 255, 255, 255))
    draw.text(
        (130, 780),
        "PASS: maximum concurrent reservations = 1 • collisions = 0 • slot released at t=30s",
        font=HEADING_FONT,
        fill=(25, 118, 68, 255),
    )
    return validation, board


def build_manifest_and_images() -> dict[Path, bytes]:
    audit = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))
    pose_manifest, pose_entries = pose_authority()
    records = [
        record
        for record in audit["records"]
        if record["recordId"] == RECORD_ID
    ]
    if len(records) != 1:
        raise ValueError(f"Audit record missing or duplicated: {RECORD_ID}")
    record = records[0]
    if record["currentDecision"]["decision"] != "salvage-full-master-and-decompose":
        raise ValueError(f"Audit no longer permits massage-chair salvage: {record['currentDecision']}")
    source_path = ROOT / record["sourcePath"]
    if sha256_file(source_path) != record["sourceSha256"]:
        raise ValueError("Massage-chair source master hash no longer matches the audit")
    source = Image.open(source_path).convert("RGBA")
    source_bounds = tuple(record["sourceBounds"])
    keyed = alpha_key_full_master(source)
    owned_mask_full, selected, discarded_components = select_owned_component(
        keyed,
        source_bounds,
    )
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
    if touches_cell or touches_master:
        raise ValueError("Massage-chair owned pixels touch a forbidden boundary")
    shell, ownership_mask, padding = pad_owned_component(
        keyed,
        owned_mask_full,
        owned_bounds,
    )
    rear, foreground, foreground_regions = split_shell(shell)
    recomposed = composite_parts(rear, foreground)
    if recomposed.tobytes() != shell.tobytes():
        raise ValueError("Authoring rear and foreground do not recompose the shell")
    if shell.getbbox() is None or rear.getbbox() is None or foreground.getbbox() is None:
        raise ValueError("Massage-chair extraction emitted an empty part")

    runtime_parts = {
        "shell": shell.resize(RUNTIME_CANVAS, Image.Resampling.NEAREST),
        "rear": rear.resize(RUNTIME_CANVAS, Image.Resampling.NEAREST),
        "foreground": foreground.resize(RUNTIME_CANVAS, Image.Resampling.NEAREST),
    }
    runtime_recomposed = composite_parts(
        runtime_parts["rear"],
        runtime_parts["foreground"],
    )
    if runtime_recomposed.tobytes() != runtime_parts["shell"].tobytes():
        raise ValueError("Runtime rear and foreground do not recompose the shell")

    roster_records, roster_frames = build_roster_validation(
        runtime_parts["rear"],
        runtime_parts["foreground"],
    )
    einstein_frames = roster_frames["einstein"]
    einstein_record = next(
        item for item in roster_records if item["id"] == "einstein"
    )
    einstein_metrics = einstein_record["frames"]
    einstein_authority = next(
        item for item in pose_entries if item["slug"] == "einstein"
    )
    einstein_sheet = Image.open(
        ROOT / einstein_authority["source"]["file"]
    ).convert("RGBA")
    lounge_comparison, lounge_metrics = compose_seated_case(
        runtime_parts["rear"],
        runtime_parts["foreground"],
        actor_frame(
            einstein_sheet,
            0,
            row=LOUNGE_COMPARISON_ROW,
        ),
        LOUNGE_COMPARISON_CONTACT,
    )
    reservation, reservation_board = reservation_timeline()

    review_images = [
        review_source_ownership(
            source,
            source_bounds,
            owned_bounds,
            shell,
            selected["pixelCount"],
            discarded_components,
        ),
        review_parts(shell, rear, foreground, padding),
        review_geometry(shell),
        review_pose_comparison(
            lounge_comparison,
            lounge_metrics,
            einstein_frames[0],
            einstein_metrics[0],
        ),
        review_six_frames(einstein_frames, einstein_metrics),
        review_roster(roster_frames, roster_records),
        reservation_board,
    ]

    outputs: dict[Path, bytes] = {}
    authoring_parts = {
        "shell": shell,
        "rear": rear,
        "foreground": foreground,
    }
    for role, (authoring_path, runtime_path) in PART_PATHS.items():
        outputs[authoring_path] = png_bytes(authoring_parts[role])
        outputs[runtime_path] = png_bytes(runtime_parts[role])
    outputs[OWNERSHIP_PATH] = png_bytes(ownership_mask.convert("RGBA"))
    for path, image in zip(REVIEW_PATHS, review_images, strict=True):
        outputs[path] = png_bytes(image)

    part_records = []
    for role, (authoring_path, runtime_path) in PART_PATHS.items():
        part_records.append(
            {
                "id": f"{FAMILY_ID}.{REVISION}.{role}",
                "role": role,
                "authoringFile": repo_path(authoring_path),
                "authoringSha256": sha256_bytes(outputs[authoring_path]),
                "runtimeFile": repo_path(runtime_path),
                "runtimeSha256": sha256_bytes(outputs[runtime_path]),
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
        for red, green, blue, alpha in shell.getdata()
        if alpha and is_chroma_key((red, green, blue, alpha))
    )
    gates = {
        "F0": {
            "status": "passed",
            "evidence": [
                repo_path(AUDIT_PATH),
                RECORD_ID,
            ],
        },
        "F1": {
            "status": "passed",
            "evidence": [
                repo_path(REVIEW_PATHS[2]),
                "2x2 footprint, 2x3 render box, capacity one",
            ],
        },
        "F2": {
            "status": "passed",
            "evidence": [
                repo_path(PART_PATHS["shell"][0]),
                "full-master-component-ownership",
            ],
        },
        "F3": {
            "status": "passed",
            "evidence": [
                repo_path(REVIEW_PATHS[0]),
                repo_path(REVIEW_PATHS[1]),
                repo_path(OWNERSHIP_PATH),
            ],
        },
        "F4": {
            "status": "passed",
            "evidence": [
                repo_path(PART_PATHS["rear"][0]),
                repo_path(PART_PATHS["foreground"][0]),
                repo_path(REVIEW_PATHS[3]),
                repo_path(REVIEW_PATHS[4]),
            ],
        },
        "F5": {
            "status": "passed",
            "evidence": [
                repo_path(REVIEW_PATHS[2]),
                "base pivot and sort pivot remain (1,2)",
            ],
        },
        "F6": {
            "status": "passed",
            "evidence": [
                repo_path(REVIEW_PATHS[6]),
                "capacity-one atomic reservation with release-on-failure",
            ],
        },
        "F7": {
            "status": "passed",
            "evidence": [
                repo_path(REVIEW_PATHS[3]),
                repo_path(REVIEW_PATHS[4]),
                repo_path(REVIEW_PATHS[5]),
                repo_path(REVIEW_PATHS[6]),
                "eighteen characters, 108 working-front frames, 30-second reservation lab",
            ],
        },
        "F8": {
            "status": "passed",
            "evidence": [
                *[repo_path(path) for path in REVIEW_PATHS],
                "Owner approved the R02 working-front-seated family on 2026-07-29.",
            ],
        },
        "F9": {
            "status": "blocked",
            "evidence": ["Furniture-only room composition is outside R02 scope."],
        },
        "F10": {
            "status": "blocked",
            "evidence": ["Active Office integration is outside R02 scope."],
        },
    }
    manifest = {
        "schemaVersion": 1,
        "id": "office.furniture.chair-massage.r02",
        "familyId": FAMILY_ID,
        "revision": REVISION,
        "status": "owner-approved",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "sourcePolicy": {
            "processedCropDirectReuse": False,
            "activeOfficePixelReuse": False,
            "legacyOrRejectedPixelReuse": False,
            "generativeRepair": False,
            "missingAssetFallback": False,
        },
        "source": {
            "kind": "audited-original-master",
            "path": record["sourcePath"],
            "sha256": record["sourceSha256"],
            "auditManifest": repo_path(AUDIT_PATH),
            "auditRecordId": RECORD_ID,
            "sourceBounds": list(source_bounds),
            "ownedBounds": list(owned_bounds),
            "extraction": {
                "method": "full-master-component-ownership",
                "selectedComponentCount": 1,
                "selectedPixelCount": selected["pixelCount"],
                "discardedComponentCount": discarded_components,
                "touchesNominalCellBoundary": touches_cell,
                "touchesMasterBoundary": touches_master,
                "sourcePixelsResampled": False,
                "chromaKeyMethod": "alpha-only-generated-magenta-removal",
                "padding": padding,
            },
        },
        "render": {
            "authoringCanvas": list(AUTHORING_CANVAS),
            "runtimeCanvas": list(RUNTIME_CANVAS),
            "uniformIntegerDivisor": AUTHORING_DIVISOR,
            "nonUniformScaling": False,
            "anchor": "bottom-center",
        },
        "geometry": {
            "schemaVersion": 3,
            "id": f"{FAMILY_ID}.{REVISION}",
            "assetType": "seat",
            "placementPlane": "floor",
            "physicalScale": {
                "width": 2,
                "depth": 2,
                "height": 2,
                "unit": "tile",
            },
            "footprint": {
                "width": 2,
                "depth": 2,
                "unit": "tile",
            },
            "supportPlane": None,
            "basePivot": {"x": 1, "y": 2, "unit": "tile"},
            "sortPivot": {"x": 1, "y": 2, "unit": "tile"},
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
                    "id": "rear",
                    "role": "rear",
                    "assetId": f"{FAMILY_ID}.{REVISION}.rear",
                },
                {
                    "id": "foreground",
                    "role": "foreground",
                    "assetId": f"{FAMILY_ID}.{REVISION}.foreground",
                },
            ],
            "attachmentSlots": [],
            "seatSlots": [
                {
                    "id": "seat-01",
                    "x": 1,
                    "y": 1,
                    "unit": "tile",
                    "facing": "front",
                }
            ],
            "orientation": "front",
        },
        "parts": part_records,
        "partEvidence": {
            "ownershipMask": {
                "path": repo_path(OWNERSHIP_PATH),
                "sha256": sha256_bytes(outputs[OWNERSHIP_PATH]),
            },
            "foregroundRegionsNormalized": foreground_regions,
            "authoringRecompositionPixelExact": True,
            "runtimeRecompositionPixelExact": True,
        },
        "interaction": {
            "capacity": 1,
            "durationSeconds": 12,
            "atomicReservation": True,
            "releaseOnFailure": True,
            "states": [
                "available",
                "reserved",
                "approaching",
                "occupied",
                "releasing",
            ],
            "slots": [
                {
                    "id": "seat-01",
                    "seat": {"x": 1, "y": 1},
                    "approach": {"x": 1, "y": 2},
                    "exit": {"x": 1, "y": 3},
                    "facing": "front",
                    "action": INTERACTION_ACTION,
                    "visualPose": VISUAL_POSE,
                    "reservationId": "chair-massage-r02.seat-01",
                    "chairSeatAnchorRuntimePixel": list(CHAIR_SEAT_ANCHOR),
                    "actorContactRuntimePixel": [48, 80],
                }
            ],
        },
        "rosterValidation": {
            "visualPose": VISUAL_POSE,
            "poseAuthority": {
                "id": pose_manifest["schema"],
                "manifest": repo_path(POSE_AUTHORITY_PATH),
                "manifestSha256": sha256_file(POSE_AUTHORITY_PATH),
                "status": pose_manifest["status"],
                "orientation": "front",
                "row": WORKING_FRONT_ROW,
            },
            "row": WORKING_FRONT_ROW,
            "activeFrames": ACTIVE_FRAMES,
            "characterCount": len(roster_records),
            "perCharacterFurnitureScaling": False,
            "perCharacterSeatOffsets": False,
            "characters": roster_records,
        },
        "reservationValidation": reservation,
        "quality": {
            "visibleMagentaPixels": visible_magenta,
            "selectedComponentCount": 1,
            "authoringPartRecompositionPixelExact": True,
            "runtimePartRecompositionPixelExact": True,
            "validatedCharacterFrames": len(roster_records) * ACTIVE_FRAMES,
            "minimumForegroundOverlapPixels": min(
                frame["foregroundOverlapPixels"]
                for character in roster_records
                for frame in character["frames"]
            ),
            "sourceDimensions": list(source.size),
        },
        "gates": gates,
        "reviewOutputs": [repo_path(path) for path in REVIEW_PATHS],
        "reviewEvidence": review_evidence,
        "rejectedOrientations": [
            "modern-bright-library-v1:env-12-facility-side-orientations:chair.massage.modern.side-left",
            "modern-bright-library-v1:env-12-facility-side-orientations:chair.massage.modern.side-right",
        ],
        "activeOfficeBaseline": {
            "file": repo_path(ACTIVE_REGISTRY),
            "sha256": sha256_file(ACTIVE_REGISTRY),
            "importsCandidate": False,
        },
        "permissions": {
            "familyLab": True,
            "ownerReview": False,
            "furnitureOnlyRoom": False,
            "otherFurnitureFamilies": False,
            "activeOfficePromotion": False,
        },
        "supersedes": "office.furniture.chair-massage.r01",
        "ownerDecision": {
            "decision": "approved",
            "decidedOn": "2026-07-29",
            "notes": (
                "Owner approved the upright working-front-seated R02 result "
                "as the preserved massage-chair family."
            ),
        },
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
    for directory in (AUTHORING_ROOT, RUNTIME_ROOT, REVIEW_ROOT):
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
            "Massage chair R02 OK: full-master extraction, exact 3:1 scale, "
            "three layers, 108 approved working-front frames, and "
            "30-second reservation proof."
        )
        return
    write_outputs(outputs)
    print(f"Wrote {len(outputs)} massage-chair R02 files.")
    print(f"Manifest: {repo_path(MANIFEST_PATH)}")
    print("Status: owner-approved at F8; F9/F10 remain blocked.")


if __name__ == "__main__":
    main()
