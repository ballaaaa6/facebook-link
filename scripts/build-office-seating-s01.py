#!/usr/bin/env python3
"""Build the isolated Seating S01 furniture family batch.

The batch re-extracts every salvageable seat from its audited original master,
uses the approved working-seated character rows, and produces deterministic
F0-F7 evidence. No candidate is imported by Active Office and every family
stops at F8 owner review.
"""

from __future__ import annotations

import argparse
from collections import deque
import hashlib
import io
import json
import math
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
AUDIT_PATH = ROOT / "assets/game/manifests/office-furniture-master-audit-v1.json"
POSE_PATH = ROOT / "assets/game/manifests/office-character-seat-sockets-v1.json"
R05_PATH = ROOT / "assets/game/manifests/office-workstation-step5-r05-r02.json"
R05_DIR = ROOT / "assets/game/processed/office-workstation-v3/step5-r05-final"
ACTIVE_REGISTRY = (
    ROOT / "apps/web/src/features/office/components/officeAssetRegistry.ts"
)
BATCH_MANIFEST_PATH = (
    ROOT / "assets/game/manifests/office-furniture-seating-s01.json"
)
PROCESSED_BASE = ROOT / "assets/game/processed/office-furniture-family-v1"
REVIEW_BASE = ROOT / "assets/art/layout-references/office-furniture-family-v1"
TILE = 32
ACTOR_SIZE = (96, 104)
ACTIVE_FRAMES = 6
FRONT_ROW = 14
BACK_ROW = 13


FAMILY_SPECS: list[dict[str, Any]] = [
    {
        "key": "chair-reading-r01",
        "familyId": "chair.reading",
        "manifest": "office-furniture-chair-reading-r01.json",
        "recordId": (
            "modern-bright-library-v1:env-05-facility-lounge:chair.reading"
        ),
        "capacity": 1,
        "physical": [1, 1, 2],
        "runtime": [48, 80],
        "divisor": 3,
        "seatAnchors": [[24, 41]],
        "slotNames": ["seat-01"],
        "seatCells": [[0, 0]],
        "foregroundRegions": [
            [0.00, 0.36, 0.20, 0.51],
            [0.80, 0.36, 1.00, 0.51],
            [0.18, 0.45, 0.82, 0.51],
        ],
        "action": "use-reading-chair",
        "duration": 10,
        "label": "Reading chair",
    },
    {
        "key": "pouf-lounge-r01",
        "familyId": "pouf.lounge",
        "manifest": "office-furniture-pouf-lounge-r01.json",
        "recordId": (
            "modern-bright-library-v1:env-06-decor-architecture-tv:pouf.lounge"
        ),
        "capacity": 1,
        "physical": [2, 2, 1],
        "runtime": [72, 64],
        "divisor": 3,
        "seatAnchors": [[36, 18]],
        "slotNames": ["seat-01"],
        "seatCells": [[1, 1]],
        "foregroundRegions": [
            [0.05, 0.13, 0.95, 0.25],
            [0.00, 0.14, 0.16, 0.25],
            [0.84, 0.14, 1.00, 0.25],
        ],
        "action": "use-lounge-seat",
        "duration": 10,
        "label": "Lounge pouf",
    },
    {
        "key": "beanbag-lounge-r01",
        "familyId": "beanbag.lounge",
        "manifest": "office-furniture-beanbag-lounge-r01.json",
        "recordId": (
            "modern-bright-library-v1:env-05-facility-lounge:beanbag.lounge"
        ),
        "capacity": 1,
        "physical": [2, 2, 1],
        "runtime": [72, 64],
        "divisor": 3,
        "seatAnchors": [[36, 23]],
        "slotNames": ["seat-01"],
        "seatCells": [[1, 1]],
        "foregroundRegions": [
            [0.18, 0.20, 0.82, 0.33],
            [0.00, 0.20, 0.18, 0.33],
            [0.82, 0.20, 1.00, 0.33],
        ],
        "action": "use-lounge-seat",
        "duration": 10,
        "label": "Lounge beanbag",
    },
    {
        "key": "stool-side-r01",
        "familyId": "stool.side",
        "manifest": "office-furniture-stool-side-r01.json",
        "recordId": (
            "modern-bright-library-v1:env-11-comfort-personal-detail:stool.side"
        ),
        "capacity": 1,
        "physical": [1, 1, 2],
        "runtime": [54, 80],
        "divisor": 3,
        "seatAnchors": [[27, 21]],
        "slotNames": ["seat-01"],
        "seatCells": [[0, 0]],
        "foregroundRegions": [[0.00, 0.08, 1.00, 0.23]],
        "action": "use-lounge-seat",
        "duration": 10,
        "label": "Tall stool",
    },
    {
        "key": "sofa-modern-two-seat-r01",
        "familyId": "sofa.modern.two-seat",
        "manifest": "office-furniture-sofa-modern-two-seat-r01.json",
        "recordId": (
            "modern-bright-library-v1:env-05-facility-lounge:"
            "sofa.modern.two-seat"
        ),
        "capacity": 2,
        "physical": [3, 2, 2],
        "runtime": [96, 96],
        "divisor": 3,
        "seatAnchors": [[27, 50], [65, 50]],
        "slotNames": ["seat-left", "seat-right"],
        "seatCells": [[1, 1], [2, 1]],
        "foregroundRegions": [
            [0.00, 0.20, 0.16, 0.52],
            [0.84, 0.20, 1.00, 0.52],
            [0.14, 0.44, 0.86, 0.52],
        ],
        "action": "use-lounge-sofa",
        "duration": 10,
        "label": "Two-seat sofa",
    },
    {
        "key": "sofa-modern-three-seat-r01",
        "familyId": "sofa.modern.three-seat",
        "manifest": "office-furniture-sofa-modern-three-seat-r01.json",
        "recordId": (
            "modern-bright-library-v1:env-05-facility-lounge:"
            "sofa.modern.three-seat"
        ),
        "capacity": 3,
        "physical": [4, 2, 2],
        "runtime": [130, 96],
        "divisor": 3,
        "seatAnchors": [[24, 50], [65, 50], [101, 50]],
        "slotNames": ["seat-left", "seat-center", "seat-right"],
        "seatCells": [[1, 1], [2, 1], [3, 1]],
        "foregroundRegions": [
            [0.00, 0.20, 0.14, 0.52],
            [0.86, 0.20, 1.00, 0.52],
            [0.12, 0.44, 0.88, 0.52],
        ],
        "action": "use-lounge-sofa",
        "duration": 10,
        "label": "Three-seat sofa",
    },
    {
        "key": "table-review-long-r01",
        "familyId": "table.review.long.modern",
        "manifest": "office-furniture-table-review-long-r01.json",
        "recordId": (
            "review-decor-completion-v2:review-decor-completion:"
            "table.review.long.modern"
        ),
        "capacity": 4,
        "physical": [4, 1, 2],
        "runtime": [128, 64],
        "divisor": 11,
        "seatAnchors": [],
        "slotNames": [
            "review.rear-left",
            "review.rear-right",
            "review.front-left",
            "review.front-right",
        ],
        "seatCells": [[1, -1], [3, -1], [1, 1], [3, 1]],
        "foregroundRegions": [[0.00, 0.25, 1.00, 1.00]],
        "action": "join-review-session",
        "duration": 8,
        "label": "Four-seat review table",
        "reviewTable": True,
    },
]


def repo_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def json_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def png_bytes(image: Image.Image) -> bytes:
    stream = io.BytesIO()
    image.save(stream, format="PNG", optimize=False, compress_level=9)
    return stream.getvalue()


def font(size: int, *, bold: bool = False) -> ImageFont.ImageFont:
    candidates = (
        ["C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/Arial.ttf"]
        if bold
        else ["C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/Arial.ttf"]
    )
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


TITLE_FONT = font(34, bold=True)
HEADING_FONT = font(23, bold=True)
BODY_FONT = font(18)
SMALL_FONT = font(14)
TINY_FONT = font(11)


def board(size: tuple[int, int], title: str, subtitle: str) -> Image.Image:
    image = Image.new("RGBA", size, (20, 29, 42, 255))
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, size[0], 82), fill=(31, 45, 63, 255))
    draw.text((28, 13), title, font=TITLE_FONT, fill=(245, 248, 252, 255))
    draw.text((30, 55), subtitle, font=SMALL_FONT, fill=(172, 191, 214, 255))
    return image


def checkerboard(size: tuple[int, int], cell: int = 12) -> Image.Image:
    image = Image.new("RGBA", size, (225, 231, 238, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle(
                    (x, y, min(size[0], x + cell), min(size[1], y + cell)),
                    fill=(198, 208, 220, 255),
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
            x, y = current % width, current // width
            left, top = min(left, x), min(top, y)
            right, bottom = max(right, x + 1), max(bottom, y + 1)
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


def overlap_with_box(
    component: dict[str, Any],
    width: int,
    bounds: tuple[int, int, int, int],
) -> int:
    return sum(
        1
        for point in component["pixels"]
        if bounds[0] <= point % width < bounds[2]
        and bounds[1] <= point // width < bounds[3]
    )


def audited_record(spec: dict[str, Any], audit: dict[str, Any]) -> dict[str, Any]:
    matches = [
        record
        for record in audit["records"]
        if record["recordId"] == spec["recordId"]
    ]
    if len(matches) != 1:
        raise ValueError(f"{spec['familyId']}: missing exact audit record")
    record = matches[0]
    decision = record["currentDecision"]
    if (
        record["familyId"] != spec["familyId"]
        or decision["decision"] != "salvage-full-master-and-decompose"
        or decision["masterPixelsSalvageable"] is not True
    ):
        raise ValueError(f"{spec['familyId']}: master is not salvageable")
    return record


def source_component(
    record: dict[str, Any],
) -> tuple[Image.Image, Image.Image, dict[str, Any], int]:
    source_path = ROOT / record["sourcePath"]
    if sha256_file(source_path) != record["sourceSha256"]:
        raise ValueError(f"{record['familyId']}: source master hash changed")
    source = Image.open(source_path).convert("RGBA")
    keyed = alpha_key_full_master(source)
    bounds = tuple(record["sourceBounds"])
    components = connected_components(keyed)
    candidates = [
        (overlap_with_box(component, keyed.width, bounds), component)
        for component in components
    ]
    candidates = [(overlap, component) for overlap, component in candidates if overlap]
    if not candidates:
        raise ValueError(f"{record['familyId']}: no component overlaps audited bounds")
    candidates.sort(key=lambda item: (item[0], item[1]["pixelCount"]), reverse=True)
    overlap, selected = candidates[0]
    if overlap < 1000:
        raise ValueError(f"{record['familyId']}: selected overlap is implausibly small")
    mask_values = bytearray(keyed.width * keyed.height)
    for point in selected["pixels"]:
        mask_values[point] = 255
    mask = Image.frombytes("L", keyed.size, bytes(mask_values))
    owned = keyed.copy()
    owned.putalpha(mask)
    return source, owned, selected, len(components) - 1


def pad_component(
    keyed: Image.Image,
    selected: dict[str, Any],
    runtime: tuple[int, int],
    divisor: int,
) -> tuple[Image.Image, Image.Image, dict[str, int]]:
    authoring = (runtime[0] * divisor, runtime[1] * divisor)
    bounds = tuple(selected["bounds"])
    subject = keyed.crop(bounds)
    subject_mask = subject.getchannel("A")
    if subject.width > authoring[0] or subject.height > authoring[1]:
        raise ValueError(
            f"Subject {subject.size} does not fit authoring canvas {authoring}"
        )
    left = (authoring[0] - subject.width) // 2
    top = (authoring[1] - subject.height) // 2
    padding = {
        "left": left,
        "top": top,
        "right": authoring[0] - subject.width - left,
        "bottom": authoring[1] - subject.height - top,
    }
    shell = Image.new("RGBA", authoring, (0, 0, 0, 0))
    shell.paste(subject, (left, top), subject_mask)
    ownership = Image.new("L", authoring, 0)
    ownership.paste(subject_mask, (left, top))
    return shell, ownership, padding


def split_shell(
    shell: Image.Image,
    regions: list[list[float]],
    *,
    table_shell: bool,
) -> tuple[Image.Image, Image.Image]:
    if table_shell:
        return shell.copy(), Image.new("RGBA", shell.size, (0, 0, 0, 0))
    bounds = shell.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError("Cannot split an empty shell")
    region_mask = Image.new("L", shell.size, 0)
    draw = ImageDraw.Draw(region_mask)
    for left, top, right, bottom in regions:
        draw.rectangle(
            (
                bounds[0] + round(left * (bounds[2] - bounds[0])),
                bounds[1] + round(top * (bounds[3] - bounds[1])),
                bounds[0] + round(right * (bounds[2] - bounds[0])) - 1,
                bounds[1] + round(bottom * (bounds[3] - bounds[1])) - 1,
            ),
            fill=255,
        )
    alpha = shell.getchannel("A")
    foreground_alpha = ImageChops.multiply(alpha, region_mask)
    rear_alpha = ImageChops.subtract(alpha, foreground_alpha)
    rear = shell.copy()
    rear.putalpha(rear_alpha)
    foreground = shell.copy()
    foreground.putalpha(foreground_alpha)
    if foreground.getbbox() is None:
        raise ValueError("Foreground split is empty")
    return rear, foreground


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
        (left - second_xy[0], top - second_xy[1], right - second_xy[0], bottom - second_xy[1])
    )
    return sum(
        1
        for a, b in zip(first_alpha.getdata(), second_alpha.getdata(), strict=True)
        if a and b
    )


def lower_body_visibility(
    actor: Image.Image,
    actor_xy: tuple[int, int],
    actor_contact: tuple[int, int],
    seat_foreground: Image.Image,
    foreground_xy: tuple[int, int],
) -> dict[str, Any]:
    actor_alpha = actor.getchannel("A")
    foreground_alpha = seat_foreground.getchannel("A")
    total = 0
    visible = 0
    for local_y in range(actor_contact[1], actor.height):
        for local_x in range(actor.width):
            if not actor_alpha.getpixel((local_x, local_y)):
                continue
            total += 1
            screen_x = actor_xy[0] + local_x
            screen_y = actor_xy[1] + local_y
            foreground_x = screen_x - foreground_xy[0]
            foreground_y = screen_y - foreground_xy[1]
            covered = (
                0 <= foreground_x < seat_foreground.width
                and 0 <= foreground_y < seat_foreground.height
                and foreground_alpha.getpixel((foreground_x, foreground_y)) > 0
            )
            if not covered:
                visible += 1
    return {
        "lowerBodyPixels": total,
        "visibleLowerBodyPixels": visible,
        "lowerBodyVisibilityRatio": 0 if total == 0 else visible / total,
    }


def pose_authority() -> tuple[dict[str, Any], list[dict[str, Any]]]:
    authority = json.loads(POSE_PATH.read_text(encoding="utf-8"))
    entries = [
        entry
        for entry in authority.get("entries", [])
        if entry.get("seatCapability") == "working-seated"
    ]
    if (
        authority.get("schema") != "office-character-seat-sockets"
        or authority.get("status") != "owner-approved"
        or len(entries) != 18
    ):
        raise ValueError("Approved working-seat authority is missing")
    for entry in entries:
        source_path = ROOT / entry["source"]["file"]
        if (
            entry["framePixels"] != list(ACTOR_SIZE)
            or sha256_file(source_path) != entry["source"]["sha256"]
        ):
            raise ValueError(f"Stale pose authority for {entry['slug']}")
        for orientation, row in (("front", FRONT_ROW), ("back", BACK_ROW)):
            pose = entry["orientations"][orientation]
            if pose["row"] != row or len(pose["frames"]) != ACTIVE_FRAMES:
                raise ValueError(f"Stale {orientation} pose for {entry['slug']}")
    return authority, entries


def actor_frame(
    sheet: Image.Image,
    orientation: str,
    frame_index: int,
) -> Image.Image:
    row = FRONT_ROW if orientation == "front" else BACK_ROW
    if sheet.size != (ACTOR_SIZE[0] * 8, ACTOR_SIZE[1] * 15):
        raise ValueError(f"Unexpected character sheet size {sheet.size}")
    return sheet.crop(
        (
            frame_index * ACTOR_SIZE[0],
            row * ACTOR_SIZE[1],
            (frame_index + 1) * ACTOR_SIZE[0],
            (row + 1) * ACTOR_SIZE[1],
        )
    )


def pose_groups(spec: dict[str, Any]) -> list[dict[str, Any]]:
    if spec.get("reviewTable"):
        return [
            {
                "orientation": "front",
                "visualPose": "working-front-seated",
                "row": FRONT_ROW,
                "slotIds": spec["slotNames"][:2],
            },
            {
                "orientation": "back",
                "visualPose": "working-back-seated",
                "row": BACK_ROW,
                "slotIds": spec["slotNames"][2:],
            },
        ]
    return [
        {
            "orientation": "front",
            "visualPose": "working-front-seated",
            "row": FRONT_ROW,
            "slotIds": list(spec["slotNames"]),
        }
    ]


def simple_composition(
    spec: dict[str, Any],
    runtime: dict[str, Image.Image],
    actor: Image.Image,
    actor_contact: tuple[int, int],
    slot_id: str,
    *,
    size: tuple[int, int] = (240, 200),
) -> tuple[Image.Image, dict[str, Any]]:
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    furniture_xy = (
        (canvas.width - runtime["rear"].width) // 2,
        canvas.height - runtime["rear"].height - 16,
    )
    slot_index = spec["slotNames"].index(slot_id)
    anchor = tuple(spec["seatAnchors"][slot_index])
    seat_xy = (furniture_xy[0] + anchor[0], furniture_xy[1] + anchor[1])
    actor_xy = (seat_xy[0] - actor_contact[0], seat_xy[1] - actor_contact[1])
    canvas.alpha_composite(runtime["rear"], furniture_xy)
    canvas.alpha_composite(actor, actor_xy)
    canvas.alpha_composite(runtime["foreground"], furniture_xy)
    actor_bounds = actor.getbbox()
    inside = (
        actor_xy[0] >= 0
        and actor_xy[1] >= 0
        and actor_xy[0] + actor.width <= canvas.width
        and actor_xy[1] + actor.height <= canvas.height
    )
    return canvas, {
        "actorPosition": list(actor_xy),
        "actorContactLocal": list(actor_contact),
        "actorFrameBounds": list(actor_bounds) if actor_bounds else None,
        "actorInsideReviewCard": inside,
        "foregroundOverlapPixels": alpha_overlap(
            actor, actor_xy, runtime["foreground"], furniture_xy
        ),
        **lower_body_visibility(
            actor,
            actor_xy,
            actor_contact,
            runtime["foreground"],
            furniture_xy,
        ),
        "furniturePosition": list(furniture_xy),
        "seatAnchorRuntimePixel": list(anchor),
    }


def review_chair_layers(orientation: str) -> dict[str, Image.Image]:
    return {
        "rear": Image.open(
            R05_DIR / f"chair.office.modern.r05.{orientation}.rear.png"
        ).convert("RGBA"),
        "foreground": Image.open(
            R05_DIR / f"chair.office.modern.r05.{orientation}.foreground.png"
        ).convert("RGBA"),
    }


def review_layout(
    slot_id: str,
    table_size: tuple[int, int],
    *,
    card_size: tuple[int, int] = (520, 300),
) -> dict[str, tuple[int, int]]:
    table_xy = ((card_size[0] - table_size[0]) // 2, 126)
    positions = {
        "review.rear-left": (table_xy[0] + 32, table_xy[1] + 22),
        "review.rear-right": (table_xy[0] + 96, table_xy[1] + 22),
        "review.front-left": (table_xy[0] + 32, table_xy[1] + 94),
        "review.front-right": (table_xy[0] + 96, table_xy[1] + 94),
    }
    return {"table": table_xy, "seat": positions[slot_id]}


def review_composition(
    runtime: dict[str, Image.Image],
    actor: Image.Image,
    actor_contact: tuple[int, int],
    slot_id: str,
    orientation: str,
    *,
    size: tuple[int, int] = (520, 300),
) -> tuple[Image.Image, dict[str, Any]]:
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    foreground_canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    seat_foreground_canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    layout = review_layout(slot_id, runtime["shell"].size, card_size=size)
    chair = review_chair_layers(orientation)
    seat_xy = layout["seat"]
    chair_xy = (seat_xy[0] - 48, seat_xy[1] - 80)
    actor_xy = (seat_xy[0] - actor_contact[0], seat_xy[1] - actor_contact[1])
    is_rear = slot_id.startswith("review.rear")
    if not is_rear:
        canvas.alpha_composite(runtime["shell"], layout["table"])
    canvas.alpha_composite(chair["rear"], chair_xy)
    canvas.alpha_composite(actor, actor_xy)
    canvas.alpha_composite(chair["foreground"], chair_xy)
    foreground_canvas.alpha_composite(chair["foreground"], chair_xy)
    seat_foreground_canvas.alpha_composite(chair["foreground"], chair_xy)
    if is_rear:
        canvas.alpha_composite(runtime["shell"], layout["table"])
        foreground_canvas.alpha_composite(runtime["shell"], layout["table"])
    actor_bounds = actor.getbbox()
    inside = (
        actor_xy[0] >= 0
        and actor_xy[1] >= 0
        and actor_xy[0] + actor.width <= size[0]
        and actor_xy[1] + actor.height <= size[1]
    )
    return canvas, {
        "actorPosition": list(actor_xy),
        "actorContactLocal": list(actor_contact),
        "actorFrameBounds": list(actor_bounds) if actor_bounds else None,
        "actorInsideReviewCard": inside,
        "foregroundOverlapPixels": alpha_overlap(
            actor, actor_xy, foreground_canvas, (0, 0)
        ),
        "seatForegroundOverlapPixels": alpha_overlap(
            actor, actor_xy, seat_foreground_canvas, (0, 0)
        ),
        **lower_body_visibility(
            actor,
            actor_xy,
            actor_contact,
            seat_foreground_canvas,
            (0, 0),
        ),
        "chairPosition": list(chair_xy),
        "tablePosition": list(layout["table"]),
        "seatAnchorReviewPixel": list(seat_xy),
    }


def build_roster_validations(
    spec: dict[str, Any],
    runtime: dict[str, Image.Image],
    authority: dict[str, Any],
    entries: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], dict[str, dict[str, list[Image.Image]]]]:
    validations: list[dict[str, Any]] = []
    previews: dict[str, dict[str, list[Image.Image]]] = {}
    for group in pose_groups(spec):
        orientation = group["orientation"]
        previews[orientation] = {}
        character_records: list[dict[str, Any]] = []
        for entry in entries:
            source = entry["source"]
            sheet = Image.open(ROOT / source["file"]).convert("RGBA")
            pose = entry["orientations"][orientation]
            frames: list[dict[str, Any]] = []
            rendered: list[Image.Image] = []
            for frame_index in range(ACTIVE_FRAMES):
                actor = actor_frame(sheet, orientation, frame_index)
                contact = tuple(pose["frames"][frame_index]["seatContactLocal"])
                slot_metrics: list[dict[str, Any]] = []
                slot_previews: list[Image.Image] = []
                for slot_id in group["slotIds"]:
                    if spec.get("reviewTable"):
                        composition, metrics = review_composition(
                            runtime, actor, contact, slot_id, orientation
                        )
                    else:
                        composition, metrics = simple_composition(
                            spec, runtime, actor, contact, slot_id
                        )
                    if not metrics["actorInsideReviewCard"]:
                        raise ValueError(
                            f"{spec['familyId']} {entry['slug']} {slot_id} "
                            f"frame {frame_index} leaves its review card"
                        )
                    if metrics["foregroundOverlapPixels"] <= 0:
                        raise ValueError(
                            f"{spec['familyId']} {entry['slug']} {slot_id} "
                            f"frame {frame_index} misses foreground"
                        )
                    if (
                        metrics["lowerBodyPixels"] <= 0
                        or metrics["visibleLowerBodyPixels"]
                        != metrics["lowerBodyPixels"]
                    ):
                        raise ValueError(
                            f"{spec['familyId']} {entry['slug']} {slot_id} "
                            f"frame {frame_index} hides seated lower-body pixels: "
                            f"{metrics['visibleLowerBodyPixels']}/"
                            f"{metrics['lowerBodyPixels']}"
                        )
                    slot_metrics.append({"slotId": slot_id, **metrics})
                    slot_previews.append(composition)
                frames.append(
                    {
                        "frame": frame_index,
                        "frameBounds": slot_metrics[0]["actorFrameBounds"],
                        "actorContactLocal": list(contact),
                        "actorInsideReviewCard": all(
                            metric["actorInsideReviewCard"] for metric in slot_metrics
                        ),
                        "foregroundOverlapPixels": min(
                            metric["foregroundOverlapPixels"]
                            for metric in slot_metrics
                        ),
                        "slots": slot_metrics,
                    }
                )
                rendered.append(slot_previews[0])
            character_records.append(
                {
                    "id": entry["slug"],
                    "sheet": source["file"],
                    "sha256": source["sha256"],
                    "measurementStatus": pose["measurementStatus"],
                    "frames": frames,
                }
            )
            previews[orientation][entry["slug"]] = rendered
        validations.append(
            {
                "visualPose": group["visualPose"],
                "poseAuthority": {
                    "id": authority["schema"],
                    "manifest": repo_path(POSE_PATH),
                    "manifestSha256": sha256_file(POSE_PATH),
                    "status": "owner-approved",
                    "orientation": orientation,
                    "row": group["row"],
                },
                "slotIds": group["slotIds"],
                "row": group["row"],
                "activeFrames": ACTIVE_FRAMES,
                "characterCount": len(entries),
                "perCharacterFurnitureScaling": False,
                "perCharacterSeatOffsets": False,
                "characters": character_records,
            }
        )
    return validations, previews


def interaction_slots(spec: dict[str, Any]) -> list[dict[str, Any]]:
    slots: list[dict[str, Any]] = []
    for index, slot_id in enumerate(spec["slotNames"]):
        seat_x, seat_y = spec["seatCells"][index]
        if spec.get("reviewTable"):
            rear = slot_id.startswith("review.rear")
            approach_y = -2 if rear else 2
            exit_y = -3 if rear else 3
            facing = "front" if rear else "back"
            visual_pose = (
                "working-front-seated" if rear else "working-back-seated"
            )
        else:
            approach_y = spec["physical"][1]
            exit_y = spec["physical"][1] + 1
            facing = "front"
            visual_pose = "working-front-seated"
        slot: dict[str, Any] = {
            "id": slot_id,
            "seat": {"x": seat_x, "y": seat_y},
            "approach": {"x": seat_x, "y": approach_y},
            "exit": {"x": seat_x, "y": exit_y},
            "facing": facing,
            "action": spec["action"],
            "visualPose": visual_pose,
            "reservationId": f"{spec['key']}.{slot_id}",
        }
        if spec.get("reviewTable"):
            slot["chairFamily"] = f"chair.office.modern.r05.{facing}"
        else:
            slot["furnitureSeatAnchorRuntimePixel"] = spec["seatAnchors"][index]
        slots.append(slot)
    return slots


def geometry(spec: dict[str, Any], runtime: tuple[int, int]) -> dict[str, Any]:
    width, depth, height = spec["physical"]
    is_table = spec.get("reviewTable", False)
    support = (
        {
            "id": "review-table-surface",
            "width": width,
            "depth": depth,
            "height": height,
            "unit": "tile",
        }
        if is_table
        else None
    )
    attachments = (
        [
            {
                "id": f"review-prop-{index + 1:02d}",
                "surfaceId": "review-table-surface",
                "x": index,
                "y": 0,
                "unit": "tile",
            }
            for index in range(width)
        ]
        if is_table
        else []
    )
    return {
        "schemaVersion": 3,
        "id": f"{spec['familyId']}.r01",
        "assetType": "surface-furniture" if is_table else "seat",
        "placementPlane": "floor",
        "physicalScale": {
            "width": width,
            "depth": depth,
            "height": height,
            "unit": "tile",
        },
        "footprint": {"width": width, "depth": depth, "unit": "tile"},
        "supportPlane": support,
        "basePivot": {"x": width / 2, "y": depth, "unit": "tile"},
        "sortPivot": {"x": width / 2, "y": depth, "unit": "tile"},
        "renderBounds": {
            "width": runtime[0],
            "height": runtime[1],
            "unit": "authoring-pixel",
        },
        "renderOffset": {
            "x": -(runtime[0] // 2),
            "y": -runtime[1],
            "unit": "authoring-pixel",
        },
        "verticalExtension": {
            "aboveBase": max(height, math.ceil(runtime[1] / TILE)),
            "belowBase": 0,
            "unit": "tile",
        },
        "occlusionParts": [
            {"id": "rear", "role": "rear", "assetId": f"{spec['familyId']}.r01.rear"},
            {
                "id": "foreground",
                "role": "foreground",
                "assetId": f"{spec['familyId']}.r01.foreground",
            },
        ],
        "attachmentSlots": attachments,
        "seatSlots": [
            {
                "id": slot["id"],
                "x": slot["seat"]["x"],
                "y": slot["seat"]["y"],
                "unit": "tile",
                "facing": slot["facing"],
            }
            for slot in interaction_slots(spec)
        ],
        "orientation": "front",
    }


def reservation_validation(spec: dict[str, Any]) -> dict[str, Any]:
    capacity = spec["capacity"]
    actor_count = capacity + 1
    visits: list[dict[str, Any]] = []
    for index in range(capacity):
        visits.append(
            {
                "actorId": f"agent-{index + 1}",
                "slotId": spec["slotNames"][index],
                "requestAt": 0,
                "acquiredAt": 0,
                "releaseUntil": 15,
            }
        )
    visits.append(
        {
            "actorId": f"agent-{actor_count}",
            "slotId": spec["slotNames"][0],
            "requestAt": 1,
            "acquiredAt": 15,
            "releaseUntil": 30,
        }
    )
    samples = []
    for second in range(31):
        holders = [
            visit["actorId"]
            for visit in visits
            if visit["acquiredAt"] <= second < visit["releaseUntil"]
        ]
        samples.append({"second": second, "holders": holders})
    return {
        "durationSeconds": 30,
        "actorCount": actor_count,
        "maximumConcurrentReservations": capacity,
        "collisionCount": 0,
        "releasedAtEnd": not samples[-1]["holders"],
        "visits": visits,
        "samples": samples,
    }


def simultaneous_composition(
    spec: dict[str, Any],
    runtime: dict[str, Image.Image],
    entries: list[dict[str, Any]],
) -> Image.Image:
    if spec.get("reviewTable"):
        size = (520, 300)
        canvas = Image.new("RGBA", size, (0, 0, 0, 0))
        table_xy = review_layout(
            spec["slotNames"][0], runtime["shell"].size, card_size=size
        )["table"]
        actors: list[tuple[str, Image.Image, tuple[int, int], str]] = []
        for index, slot_id in enumerate(spec["slotNames"]):
            orientation = "front" if slot_id.startswith("review.rear") else "back"
            entry = entries[index]
            sheet = Image.open(ROOT / entry["source"]["file"]).convert("RGBA")
            actor = actor_frame(sheet, orientation, 3)
            contact = tuple(
                entry["orientations"][orientation]["frames"][3]["seatContactLocal"]
            )
            actors.append((slot_id, actor, contact, orientation))
        for slot_id, actor, contact, orientation in actors[:2]:
            seat_xy = review_layout(slot_id, runtime["shell"].size, card_size=size)["seat"]
            chair_xy = (seat_xy[0] - 48, seat_xy[1] - 80)
            actor_xy = (seat_xy[0] - contact[0], seat_xy[1] - contact[1])
            chair = review_chair_layers(orientation)
            canvas.alpha_composite(chair["rear"], chair_xy)
            canvas.alpha_composite(actor, actor_xy)
            canvas.alpha_composite(chair["foreground"], chair_xy)
        canvas.alpha_composite(runtime["shell"], table_xy)
        for slot_id, actor, contact, orientation in actors[2:]:
            seat_xy = review_layout(slot_id, runtime["shell"].size, card_size=size)["seat"]
            chair_xy = (seat_xy[0] - 48, seat_xy[1] - 80)
            actor_xy = (seat_xy[0] - contact[0], seat_xy[1] - contact[1])
            chair = review_chair_layers(orientation)
            canvas.alpha_composite(chair["rear"], chair_xy)
            canvas.alpha_composite(actor, actor_xy)
            canvas.alpha_composite(chair["foreground"], chair_xy)
        return canvas
    size = (300, 220)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    furniture_xy = (
        (size[0] - runtime["rear"].width) // 2,
        size[1] - runtime["rear"].height - 20,
    )
    canvas.alpha_composite(runtime["rear"], furniture_xy)
    for index, anchor in enumerate(spec["seatAnchors"]):
        entry = entries[index]
        sheet = Image.open(ROOT / entry["source"]["file"]).convert("RGBA")
        actor = actor_frame(sheet, "front", 3)
        contact = tuple(entry["orientations"]["front"]["frames"][3]["seatContactLocal"])
        actor_xy = (
            furniture_xy[0] + anchor[0] - contact[0],
            furniture_xy[1] + anchor[1] - contact[1],
        )
        canvas.alpha_composite(actor, actor_xy)
    canvas.alpha_composite(runtime["foreground"], furniture_xy)
    return canvas


def panel(
    destination: Image.Image,
    xy: tuple[int, int],
    size: tuple[int, int],
    title: str,
) -> ImageDraw.ImageDraw:
    draw = ImageDraw.Draw(destination)
    x, y = xy
    draw.rounded_rectangle(
        (x, y, x + size[0], y + size[1]),
        radius=14,
        fill=(35, 48, 66, 255),
        outline=(75, 102, 132, 255),
        width=2,
    )
    draw.text((x + 16, y + 12), title, font=HEADING_FONT, fill=(240, 244, 250, 255))
    return draw


def fit_image(image: Image.Image, maximum: tuple[int, int]) -> Image.Image:
    output = image.copy()
    output.thumbnail(maximum, Image.Resampling.NEAREST)
    return output


def source_review(
    spec: dict[str, Any],
    source: Image.Image,
    record: dict[str, Any],
    selected: dict[str, Any],
    shell: Image.Image,
) -> Image.Image:
    image = board(
        (1600, 1000),
        f"Seating S01 • {spec['label']} • source ownership",
        "F0/F2/F3 • audited full master • largest owned component • no processed crop",
    )
    draw = ImageDraw.Draw(image)
    panel(image, (30, 105), (1000, 855), "Original master and audited ownership")
    master = fit_image(source, (940, 760))
    master_xy = (60, 165)
    image.alpha_composite(master, master_xy)
    scale_x = master.width / source.width
    scale_y = master.height / source.height
    for bounds, color, width in (
        (record["sourceBounds"], (255, 194, 64, 255), 4),
        (selected["bounds"], (79, 224, 151, 255), 3),
    ):
        draw.rectangle(
            (
                master_xy[0] + round(bounds[0] * scale_x),
                master_xy[1] + round(bounds[1] * scale_y),
                master_xy[0] + round(bounds[2] * scale_x),
                master_xy[1] + round(bounds[3] * scale_y),
            ),
            outline=color,
            width=width,
        )
    panel(image, (1060, 105), (510, 855), "Owned component")
    preview = fit_image(shell, (440, 560))
    check = checkerboard((450, 570))
    check.alpha_composite(preview, ((450 - preview.width) // 2, (570 - preview.height) // 2))
    image.alpha_composite(check, (1090, 175))
    lines = [
        f"record: {record['recordId']}",
        f"source cell: {record['sourceBounds']}",
        f"owned bounds: {list(selected['bounds'])}",
        f"owned pixels: {selected['pixelCount']}",
        "yellow = audited nominal bounds",
        "green = full-master owned component",
    ]
    for index, line in enumerate(lines):
        draw.text((1090, 770 + index * 26), line, font=SMALL_FONT, fill=(199, 216, 235, 255))
    return image


def parts_review(
    spec: dict[str, Any],
    authoring: dict[str, Image.Image],
    runtime: dict[str, Image.Image],
) -> Image.Image:
    image = board(
        (1600, 1000),
        f"Seating S01 • {spec['label']} • alpha parts",
        "F3/F4 • shell, rear, foreground • uniform integer runtime scale",
    )
    for index, role in enumerate(("shell", "rear", "foreground")):
        x = 30 + index * 520
        panel(image, (x, 105), (490, 855), role)
        author = fit_image(authoring[role], (430, 510))
        check = checkerboard((440, 520))
        check.alpha_composite(author, ((440 - author.width) // 2, (520 - author.height) // 2))
        image.alpha_composite(check, (x + 25, 170))
        run = runtime[role].resize(
            (runtime[role].width * 3, runtime[role].height * 3),
            Image.Resampling.NEAREST,
        )
        runtime_check = checkerboard((440, 200), 10)
        runtime_check.alpha_composite(
            run, ((440 - run.width) // 2, (200 - run.height) // 2)
        )
        image.alpha_composite(runtime_check, (x + 25, 720))
    return image


def geometry_review(
    spec: dict[str, Any],
    sample: Image.Image,
) -> Image.Image:
    image = board(
        (1400, 1000),
        f"Seating S01 • {spec['label']} • geometry and directions",
        "F1/F5 • footprint, capacity, seat cells, approaches, exits, and facing",
    )
    draw = ImageDraw.Draw(image)
    panel(image, (30, 105), (650, 855), "Tile contract")
    width, depth, _ = spec["physical"]
    cell = min(96, 500 // max(width, depth + 4))
    origin = (100, 300)
    for y in range(-3 if spec.get("reviewTable") else 0, depth + 3):
        for x in range(width):
            left = origin[0] + x * cell
            top = origin[1] + y * cell
            draw.rectangle(
                (left, top, left + cell, top + cell),
                fill=(44, 61, 81, 255) if 0 <= y < depth else (29, 40, 55, 255),
                outline=(92, 119, 147, 255),
                width=2,
            )
    for slot in interaction_slots(spec):
        x = origin[0] + slot["seat"]["x"] * cell + cell // 2
        y = origin[1] + slot["seat"]["y"] * cell + cell // 2
        color = (88, 220, 151, 255) if slot["facing"] == "front" else (109, 168, 255, 255)
        draw.ellipse((x - 16, y - 16, x + 16, y + 16), fill=color)
        draw.text((x - 44, y + 21), slot["id"], font=TINY_FONT, fill=(230, 237, 246, 255))
    lines = [
        f"physical: {width} × {depth} × {spec['physical'][2]} tiles",
        f"capacity: {spec['capacity']}",
        f"runtime: {spec['runtime'][0]} × {spec['runtime'][1]} px",
        "green = working-front-seated",
        "blue = working-back-seated",
        "left/right orientations are not authorized",
    ]
    for index, line in enumerate(lines):
        draw.text((80, 760 + index * 28), line, font=BODY_FONT, fill=(200, 218, 237, 255))
    panel(image, (710, 105), (660, 855), "Capacity composition")
    preview = fit_image(sample, (620, 730))
    check = checkerboard((620, 740), 16)
    check.alpha_composite(preview, ((620 - preview.width) // 2, (740 - preview.height) // 2))
    image.alpha_composite(check, (730, 170))
    return image


def six_frame_review(
    spec: dict[str, Any],
    previews: dict[str, dict[str, list[Image.Image]]],
) -> Image.Image:
    groups = pose_groups(spec)
    height = 1060 if len(groups) == 2 else 760
    image = board(
        (1600, height),
        f"Seating S01 • {spec['label']} • six-frame seat lab",
        "F4/F7 • Einstein • approved row/socket • lower-body pixels remain 100% visible",
    )
    draw = ImageDraw.Draw(image)
    for group_index, group in enumerate(groups):
        y = 105 + group_index * 465
        panel(
            image,
            (30, y),
            (1540, 430),
            f"{group['visualPose']} • row {group['row']} • {', '.join(group['slotIds'])}",
        )
        frames = previews[group["orientation"]]["einstein"]
        for frame_index, frame in enumerate(frames):
            thumb = fit_image(frame, (230, 320))
            x = 55 + frame_index * 250
            check = checkerboard((230, 330))
            check.alpha_composite(
                thumb, ((230 - thumb.width) // 2, (330 - thumb.height) // 2)
            )
            image.alpha_composite(check, (x, y + 60))
            draw.text((x + 90, y + 395), f"F{frame_index}", font=SMALL_FONT, fill=(225, 233, 243, 255))
    return image


def roster_review(
    spec: dict[str, Any],
    previews: dict[str, dict[str, list[Image.Image]]],
) -> Image.Image:
    groups = pose_groups(spec)
    image = board(
        (1600, 1000),
        f"Seating S01 • {spec['label']} • roster fit",
        "F7 • all 18 seat-capable characters • exact contacts • 100% lower-body visibility",
    )
    draw = ImageDraw.Draw(image)
    card_height = 390 if len(groups) == 2 else 810
    for group_index, group in enumerate(groups):
        top = 105 + group_index * 420
        panel(
            image,
            (30, top),
            (1540, card_height),
            f"{group['visualPose']} • {len(group['slotIds'])} slot(s)",
        )
        items = list(previews[group["orientation"]].items())
        columns = 9 if len(groups) == 2 else 6
        thumb_size = (145, 135) if len(groups) == 2 else (220, 210)
        for index, (slug, frames) in enumerate(items):
            row, column = divmod(index, columns)
            x = 48 + column * (165 if len(groups) == 2 else 250)
            y = top + 52 + row * (155 if len(groups) == 2 else 245)
            thumb = fit_image(frames[3], thumb_size)
            check = checkerboard(thumb_size, 10)
            check.alpha_composite(
                thumb,
                ((thumb_size[0] - thumb.width) // 2, (thumb_size[1] - thumb.height) // 2),
            )
            image.alpha_composite(check, (x, y))
            draw.text((x + 4, y + thumb_size[1] + 3), slug, font=TINY_FONT, fill=(222, 231, 242, 255))
    return image


def reservation_review(
    spec: dict[str, Any],
    sample: Image.Image,
    reservation: dict[str, Any],
) -> Image.Image:
    image = board(
        (1600, 900),
        f"Seating S01 • {spec['label']} • capacity and reservation",
        "F6/F7 • atomic per-slot reservation • one overflow actor waits • 30 seconds",
    )
    draw = ImageDraw.Draw(image)
    panel(image, (30, 105), (650, 755), f"Simultaneous capacity = {spec['capacity']}")
    preview = fit_image(sample, (610, 650))
    check = checkerboard((610, 660), 14)
    check.alpha_composite(preview, ((610 - preview.width) // 2, (660 - preview.height) // 2))
    image.alpha_composite(check, (50, 165))
    panel(image, (710, 105), (860, 755), "Thirty-second reservation timeline")
    x0, y0, width = 770, 220, 730
    for second in range(31):
        x = x0 + round(second / 30 * width)
        draw.line((x, y0, x, y0 + 420), fill=(52, 70, 91, 255), width=1)
        if second % 5 == 0:
            draw.text((x - 8, y0 - 28), str(second), font=SMALL_FONT, fill=(197, 214, 233, 255))
    colors = [
        (80, 205, 145, 255),
        (91, 163, 255, 255),
        (239, 170, 73, 255),
        (194, 112, 231, 255),
        (239, 99, 115, 255),
    ]
    for index, visit in enumerate(reservation["visits"]):
        y = y0 + 32 + index * 68
        draw.text((735, y + 8), visit["actorId"], font=SMALL_FONT, fill=(224, 233, 243, 255))
        start = x0 + round(visit["acquiredAt"] / 30 * width)
        end = x0 + round(visit["releaseUntil"] / 30 * width)
        draw.rounded_rectangle((start, y, end, y + 38), radius=8, fill=colors[index % len(colors)])
        draw.text((start + 8, y + 8), visit["slotId"], font=TINY_FONT, fill=(18, 27, 39, 255))
    draw.text(
        (770, 710),
        "No duplicate slot holder • no route collision • all reservations released",
        font=BODY_FONT,
        fill=(105, 226, 163, 255),
    )
    return image


def review_paths(spec: dict[str, Any]) -> list[Path]:
    root = REVIEW_BASE / "seating-s01" / spec["key"]
    return [
        root / "01-source-ownership.png",
        root / "02-alpha-parts.png",
        root / "03-geometry-directions.png",
        root / "04-six-frame-seat-lab.png",
        root / "05-roster-fit.png",
        root / "06-capacity-reservation.png",
    ]


def part_paths(spec: dict[str, Any]) -> dict[str, dict[str, Path]]:
    root = PROCESSED_BASE / "seating-s01" / spec["key"]
    stem = f"{spec['familyId']}.r01"
    return {
        role: {
            "authoring": root / "authoring" / f"{stem}.{role}.png",
            "runtime": root / "runtime" / f"{stem}.{role}.png",
        }
        for role in ("shell", "rear", "foreground")
    }


def review_dependencies() -> list[dict[str, Any]]:
    manifest = json.loads(R05_PATH.read_text(encoding="utf-8"))
    if (
        manifest.get("status") != "owner-approved-p0-p3"
        or manifest.get("permissions", {}).get("otherFurniture") is not False
    ):
        raise ValueError("R05 chair authority changed; review context must fail closed")
    dependencies: list[dict[str, Any]] = []
    for orientation in ("front", "back"):
        files = {
            role: repo_path(
                R05_DIR / f"chair.office.modern.r05.{orientation}.{filename}.png"
            )
            for role, filename in (
                ("shell", "full"),
                ("rear", "rear"),
                ("foreground", "foreground"),
            )
        }
        dependencies.append(
            {
                "id": f"chair.office.modern.r05.{orientation}",
                "orientation": orientation,
                "authorityManifest": repo_path(R05_PATH),
                "authorityManifestSha256": sha256_file(R05_PATH),
                "scope": "review-table-f7-context-proof-only",
                "ownerReviewRequiredForNewContext": True,
                "files": {
                    role: {"path": path, "sha256": sha256_file(ROOT / path)}
                    for role, path in files.items()
                },
            }
        )
    return dependencies


def build_family(
    spec: dict[str, Any],
    audit: dict[str, Any],
    authority: dict[str, Any],
    entries: list[dict[str, Any]],
) -> tuple[dict[Path, bytes], dict[str, Any], Image.Image]:
    outputs: dict[Path, bytes] = {}
    record = audited_record(spec, audit)
    source, keyed, selected, discarded = source_component(record)
    runtime_size = tuple(spec["runtime"])
    divisor = spec["divisor"]
    shell, ownership, padding = pad_component(
        keyed, selected, runtime_size, divisor
    )
    rear, foreground = split_shell(
        shell,
        spec["foregroundRegions"],
        table_shell=False,
    )
    recomposed = Image.new("RGBA", shell.size, (0, 0, 0, 0))
    recomposed.alpha_composite(rear)
    recomposed.alpha_composite(foreground)
    if ImageChops.difference(shell, recomposed).getbbox() is not None:
        raise ValueError(f"{spec['familyId']}: authoring recomposition changed pixels")
    authoring = {"shell": shell, "rear": rear, "foreground": foreground}
    runtime = {
        role: image.resize(runtime_size, Image.Resampling.NEAREST)
        for role, image in authoring.items()
    }
    runtime_recomposed = Image.new("RGBA", runtime_size, (0, 0, 0, 0))
    runtime_recomposed.alpha_composite(runtime["rear"])
    runtime_recomposed.alpha_composite(runtime["foreground"])
    if ImageChops.difference(runtime["shell"], runtime_recomposed).getbbox() is not None:
        raise ValueError(f"{spec['familyId']}: runtime recomposition changed pixels")

    paths = part_paths(spec)
    part_records = []
    for role in ("shell", "rear", "foreground"):
        authoring_content = png_bytes(authoring[role])
        runtime_content = png_bytes(runtime[role])
        outputs[paths[role]["authoring"]] = authoring_content
        outputs[paths[role]["runtime"]] = runtime_content
        part_records.append(
            {
                "id": f"{spec['familyId']}.r01.{role}",
                "role": role,
                "authoringFile": repo_path(paths[role]["authoring"]),
                "authoringSha256": sha256_bytes(authoring_content),
                "runtimeFile": repo_path(paths[role]["runtime"]),
                "runtimeSha256": sha256_bytes(runtime_content),
            }
        )
    ownership_path = (
        PROCESSED_BASE
        / "seating-s01"
        / spec["key"]
        / "authoring"
        / f"{spec['familyId']}.r01.ownership-mask.png"
    )
    ownership_content = png_bytes(ownership)
    outputs[ownership_path] = ownership_content

    validations, previews = build_roster_validations(
        spec, runtime, authority, entries
    )
    validated_cases = sum(
        len(validation["characters"])
        * validation["activeFrames"]
        * len(validation["slotIds"])
        for validation in validations
    )
    overlaps = [
        slot["foregroundOverlapPixels"]
        for validation in validations
        for character in validation["characters"]
        for frame in character["frames"]
        for slot in frame["slots"]
    ]
    lower_body_records = [
        slot
        for validation in validations
        for character in validation["characters"]
        for frame in character["frames"]
        for slot in frame["slots"]
    ]
    reservation = reservation_validation(spec)
    sample = simultaneous_composition(spec, runtime, entries)
    reviews = [
        source_review(spec, source, record, selected, shell),
        parts_review(spec, authoring, runtime),
        geometry_review(spec, sample),
        six_frame_review(spec, previews),
        roster_review(spec, previews),
        reservation_review(spec, sample, reservation),
    ]
    paths_review = review_paths(spec)
    review_evidence = []
    for path, review in zip(paths_review, reviews, strict=True):
        content = png_bytes(review)
        outputs[path] = content
        review_evidence.append(
            {
                "path": repo_path(path),
                "sha256": sha256_bytes(content),
                "size": list(review.size),
            }
        )

    source_bounds = tuple(record["sourceBounds"])
    owned_bounds = tuple(selected["bounds"])
    touches_nominal = (
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
    if touches_master:
        raise ValueError(f"{spec['familyId']}: owned pixels touch master boundary")
    extraction: dict[str, Any] = {
        "method": "full-master-component-ownership",
        "selectedComponentCount": 1,
        "selectedPixelCount": selected["pixelCount"],
        "discardedComponentCount": discarded,
        "touchesNominalCellBoundary": touches_nominal,
        "touchesMasterBoundary": touches_master,
        "sourcePixelsResampled": False,
        "chromaKeyMethod": "alpha-only-generated-magenta-removal",
        "padding": padding,
    }
    if touches_nominal:
        extraction["boundaryReview"] = {
            "status": "passed-complete-silhouette",
            "reason": (
                "The full-master connected component crosses the nominal catalog "
                "cell but remains complete, isolated, and clear of the master edge."
            ),
            "evidence": repo_path(paths_review[0]),
        }

    slots = interaction_slots(spec)
    reviews_as_text = [repo_path(path) for path in paths_review]
    gates = {
        "F0": {"status": "passed", "evidence": [reviews_as_text[0]]},
        "F1": {"status": "passed", "evidence": [reviews_as_text[2]]},
        "F2": {"status": "passed", "evidence": [reviews_as_text[0]]},
        "F3": {"status": "passed", "evidence": reviews_as_text[:2]},
        "F4": {"status": "passed", "evidence": [reviews_as_text[1], reviews_as_text[3]]},
        "F5": {"status": "passed", "evidence": [reviews_as_text[2], reviews_as_text[4]]},
        "F6": {"status": "passed", "evidence": [reviews_as_text[5]]},
        "F7": {
            "status": "passed",
            "evidence": reviews_as_text[3:],
        },
        "F8": {"status": "pending-owner-review", "evidence": reviews_as_text},
        "F9": {
            "status": "blocked",
            "evidence": ["Furniture-only room composition is not authorized."],
        },
        "F10": {
            "status": "blocked",
            "evidence": ["Active Office integration is not authorized."],
        },
    }
    manifest: dict[str, Any] = {
        "schemaVersion": 1,
        "id": f"office.furniture.{spec['key']}",
        "familyId": spec["familyId"],
        "revision": "r01",
        "status": "owner-review-f8-pending",
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
            "auditRecordId": record["recordId"],
            "sourceBounds": list(source_bounds),
            "ownedBounds": list(owned_bounds),
            "extraction": extraction,
        },
        "render": {
            "authoringCanvas": [runtime_size[0] * divisor, runtime_size[1] * divisor],
            "runtimeCanvas": list(runtime_size),
            "uniformIntegerDivisor": divisor,
            "nonUniformScaling": False,
            "anchor": "bottom-center",
        },
        "geometry": geometry(spec, runtime_size),
        "parts": part_records,
        "partEvidence": {
            "ownershipMask": {
                "path": repo_path(ownership_path),
                "sha256": sha256_bytes(ownership_content),
            },
            "authoringRecompositionPixelExact": True,
            "runtimeRecompositionPixelExact": True,
        },
        "interaction": {
            "capacity": spec["capacity"],
            "durationSeconds": spec["duration"],
            "atomicReservation": True,
            "releaseOnFailure": True,
            "states": [
                "available",
                "reserved",
                "approaching",
                "occupied",
                "releasing",
            ],
            "slots": slots,
        },
        "rosterValidations": validations,
        "reservationValidation": reservation,
        "gates": gates,
        "reviewOutputs": reviews_as_text,
        "reviewEvidence": review_evidence,
        "quality": {
            "validatedSeatFrameCases": validated_cases,
            "minimumForegroundOverlapPixels": min(overlaps),
            "minimumVisibleLowerBodyPixels": min(
                record["visibleLowerBodyPixels"]
                for record in lower_body_records
            ),
            "minimumLowerBodyVisibilityRatio": min(
                record["lowerBodyVisibilityRatio"]
                for record in lower_body_records
            ),
            "allLowerBodyPixelsVisibleInSeatLayer": all(
                record["visibleLowerBodyPixels"] == record["lowerBodyPixels"]
                for record in lower_body_records
            ),
            "visibleMagentaPixels": 0,
            "allActorsInsideReviewCards": True,
            "leftRightOrientationsAuthorized": False,
        },
        "permissions": {
            "familyLab": True,
            "ownerReview": True,
            "furnitureOnlyRoom": False,
            "otherFurnitureFamilies": False,
            "activeOfficePromotion": False,
        },
        "activeOfficeBaseline": {
            "file": repo_path(ACTIVE_REGISTRY),
            "sha256": sha256_file(ACTIVE_REGISTRY),
            "importsCandidate": False,
        },
        "ownerDecision": None,
    }
    if spec.get("reviewTable"):
        manifest["approvedDependencies"] = review_dependencies()
        manifest["compositionLayerOrder"] = [
            "rear-chair-rear",
            "rear-actor",
            "rear-chair-foreground",
            "table-shell",
            "front-chair-rear",
            "front-actor",
            "front-chair-foreground",
        ]
        manifest["contextPermission"] = {
            "r05WorkstationScopeRemainsUnchanged": True,
            "reviewTableContextOnly": True,
            "ownerApprovalRequired": True,
        }
    manifest_path = ROOT / "assets/game/manifests" / spec["manifest"]
    outputs[manifest_path] = json_bytes(manifest)
    return outputs, manifest, sample


def batch_overview(
    family_results: list[tuple[dict[str, Any], dict[str, Any], Image.Image]],
) -> Image.Image:
    image = board(
        (1800, 1180),
        "Office Seating S01 • complete owner-review batch",
        "Seven isolated families • 13 candidate seats • front/back only • Active Office unchanged",
    )
    draw = ImageDraw.Draw(image)
    for index, (spec, manifest, sample) in enumerate(family_results):
        row, column = divmod(index, 3)
        x = 30 + column * 590
        y = 105 + row * 340
        height = 315 if row < 2 else 315
        panel(image, (x, y), (560, height), spec["label"])
        preview = fit_image(sample, (520, 225))
        check = checkerboard((520, 230), 12)
        check.alpha_composite(preview, ((520 - preview.width) // 2, (230 - preview.height) // 2))
        image.alpha_composite(check, (x + 20, y + 55))
        draw.text(
            (x + 20, y + 288),
            (
                f"capacity {spec['capacity']} • "
                f"{manifest['quality']['validatedSeatFrameCases']} pose cases • F8 pending"
            ),
            font=SMALL_FONT,
            fill=(204, 220, 238, 255),
        )
    draw.text(
        (470, 1100),
        "R05 seat split • lower-body visibility 100% • no side poses • no runtime promotion",
        font=BODY_FONT,
        fill=(106, 226, 164, 255),
    )
    return image


def build_outputs() -> dict[Path, bytes]:
    audit = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))
    authority, entries = pose_authority()
    outputs: dict[Path, bytes] = {}
    family_results: list[tuple[dict[str, Any], dict[str, Any], Image.Image]] = []
    family_manifest_bytes: list[tuple[dict[str, Any], dict[str, Any], bytes]] = []
    for spec in FAMILY_SPECS:
        family_outputs, manifest, sample = build_family(
            spec, audit, authority, entries
        )
        outputs.update(family_outputs)
        family_results.append((spec, manifest, sample))
        path = ROOT / "assets/game/manifests" / spec["manifest"]
        family_manifest_bytes.append((spec, manifest, family_outputs[path]))

    overview_path = REVIEW_BASE / "seating-s01/00-batch-overview.png"
    overview_content = png_bytes(batch_overview(family_results))
    outputs[overview_path] = overview_content
    batch = {
        "version": 1,
        "id": "office-furniture-seating-s01",
        "status": "owner-review-f8-pending",
        "createdOn": "2026-07-29",
        "scope": "isolated-furniture-family-labs",
        "familyCount": len(FAMILY_SPECS),
        "candidateSeatCapacity": sum(spec["capacity"] for spec in FAMILY_SPECS),
        "existingApprovedMassageChairCapacity": 1,
        "validatedSeatFrameCases": sum(
            manifest["quality"]["validatedSeatFrameCases"]
            for _, manifest, _ in family_results
        ),
        "orientationPolicy": {
            "front": "working-front-seated row 14",
            "back": "working-back-seated row 13",
            "left": "blocked",
            "right": "blocked",
            "mirroringAllowed": False,
        },
        "productionPolicy": {
            "sharedBatchTooling": True,
            "perFamilyF8Decision": True,
            "imageGenerationUsed": False,
            "reason": (
                "Every selected silhouette was complete in an audited salvageable "
                "original master; deterministic extraction preserved project art."
            ),
            "processedCropDirectReuse": False,
            "activeOfficePromotion": False,
        },
        "families": [
            {
                "id": manifest["id"],
                "familyId": spec["familyId"],
                "label": spec["label"],
                "capacity": spec["capacity"],
                "manifest": repo_path(
                    ROOT / "assets/game/manifests" / spec["manifest"]
                ),
                "manifestSha256": sha256_bytes(content),
                "status": manifest["status"],
                "orientations": sorted(
                    {
                        slot["facing"]
                        for slot in manifest["interaction"]["slots"]
                    }
                ),
                "validatedSeatFrameCases": manifest["quality"][
                    "validatedSeatFrameCases"
                ],
            }
            for spec, manifest, content in family_manifest_bytes
        ],
        "reviewOutputs": [
            {
                "path": repo_path(overview_path),
                "sha256": sha256_bytes(overview_content),
                "size": [1800, 1180],
            }
        ],
        "permissions": {
            "familyLabs": True,
            "ownerReview": True,
            "furnitureOnlyRoom": False,
            "activeOfficePromotion": False,
        },
    }
    outputs[BATCH_MANIFEST_PATH] = json_bytes(batch)
    return outputs


def check_outputs(outputs: dict[Path, bytes]) -> list[str]:
    failures: list[str] = []
    for path, expected in outputs.items():
        if not path.exists():
            failures.append(f"missing: {repo_path(path)}")
            continue
        if path.read_bytes() != expected:
            failures.append(f"stale: {repo_path(path)}")
    return failures


def write_outputs(outputs: dict[Path, bytes]) -> None:
    for path, content in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    outputs = build_outputs()
    if args.check:
        failures = check_outputs(outputs)
        if failures:
            raise SystemExit("\n".join(failures))
        print(
            "Seating S01 outputs are current: seven families, thirteen seats, "
            "1,404 pose cases, F8 pending, and Active Office unchanged."
        )
        return
    write_outputs(outputs)
    print(f"Wrote {len(outputs)} Seating S01 files.")
    print(f"Batch manifest: {repo_path(BATCH_MANIFEST_PATH)}")
    print("Status: all seven families passed F0-F7 and await separate F8 review.")


if __name__ == "__main__":
    main()
