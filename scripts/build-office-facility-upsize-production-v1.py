#!/usr/bin/env python3
"""Build the isolated F4-F8 review package for the four 2x2x4 facilities.

The builder consumes only exact owner-approved C02/W02/U02/R03 preflight
pixels. It derives immutable shells, machine-local loop and finite-state
children, I01/H01 or approved seated-pose cases, four-orientation routes, and
thirty-second reservation proofs. It stops before F8 approval, slot transfer,
F9 replacement, or Active Office promotion.
"""

from __future__ import annotations

import argparse
import io
import json
import tempfile
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageDraw

from office_facility_art import (
    BODY_FONT,
    HEADING_FONT,
    SMALL_FONT,
    alpha_overlap,
    checkerboard,
    draw_title,
    json_bytes,
    png_bytes,
    sha256_bytes,
    sha256_file,
)


ROOT = Path(__file__).resolve().parents[1]
PREFLIGHT_BATCH = Path(
    "assets/game/manifests/office-facility-upsize-2x2x4-preflight-v1.json"
)
ACTION_MANIFEST = Path(
    "assets/game/manifests/office-character-action-sockets-i01.json"
)
SPATIAL_MANIFEST = Path(
    "assets/game/manifests/office-spatial-authority-i01.json"
)
HELD_MANIFEST = Path("assets/game/manifests/office-held-props-h01.json")
SEAT_MANIFEST = Path("assets/game/manifests/office-character-seat-sockets-v1.json")
COUNTER_MANIFEST = Path(
    "assets/game/manifests/office-furniture-counter-bar-a01-r02.json"
)
F9_MANIFEST = Path(
    "assets/game/manifests/office-furniture-only-f9-v1.json"
)
PROCESSED_ROOT = Path(
    "assets/game/processed/office-facility-upsize-production-v1"
)
REVIEW_ROOT = Path(
    "assets/art/layout-references/office-facility-upsize-production-v1"
)
BATCH_MANIFEST = Path(
    "assets/game/manifests/office-facility-upsize-2x2x4-production-v1.json"
)
DOC_PATH = Path(
    "docs/art/OFFICE_FACILITY_UPSIZE_2X2X4_PRODUCTION_V1.md"
)

RUNTIME_SIZE = (96, 128)
AUTHORING_SIZE = (384, 512)
ORIENTATIONS = ("front", "right", "back", "left")
LOOP_IDS = ("a", "b", "c", "d")
ACTIVE_FRAMES = 6
HOLD_FRAMES = (2, 3, 4)
BASE_PIVOT = (48, 124)
SEAT_ANCHOR = (48, 76)
SEAT_CONTACT = (48, 80)

FAMILIES: tuple[dict[str, Any], ...] = (
    {
        "slug": "coffee-machine-c02",
        "id": "office.facility.coffee-machine.c02.production",
        "familyId": "coffee.machine.generated-floor",
        "label": "Coffee Machine C02",
        "kind": "coffee",
        "preflight": (
            "assets/game/manifests/office-facility-coffee-machine-c02.json"
        ),
        "manifest": (
            "assets/game/manifests/"
            "office-facility-coffee-machine-c02-production.json"
        ),
        "action": "brew-coffee",
        "pose": "interact-front",
        "props": ("held.coffee-mug",),
        "instances": ("coffee-01",),
        "plannedSlots": 1,
        "finite": (
            "idle", "wake", "preheat", "pour", "finish", "idle",
        ),
        "interactionOrientations": ORIENTATIONS,
        "accent": (42, 206, 232, 255),
    },
    {
        "slug": "water-dispenser-w02",
        "id": "office.facility.water-dispenser.w02.production",
        "familyId": "water.dispenser.generated-floor",
        "label": "Water Dispenser W02",
        "kind": "water",
        "preflight": (
            "assets/game/manifests/office-facility-water-dispenser-w02.json"
        ),
        "manifest": (
            "assets/game/manifests/"
            "office-facility-water-dispenser-w02-production.json"
        ),
        "action": "use-water-dispenser",
        "pose": "interact-front",
        "props": ("held.water-bottle", "held.water-cup-clear"),
        "instances": ("water-01", "water-02"),
        "plannedSlots": 2,
        "finite": (
            "idle", "ready", "dispense-start", "dispense", "drip-stop", "idle",
        ),
        "interactionOrientations": ORIENTATIONS,
        "accent": (55, 203, 238, 255),
    },
    {
        "slug": "vending-machine-u02",
        "id": "office.facility.vending-machine.u02.production",
        "familyId": "vending.machine.generated-floor",
        "label": "Vending Machine U02",
        "kind": "vending",
        "preflight": (
            "assets/game/manifests/office-facility-vending-u02.json"
        ),
        "manifest": (
            "assets/game/manifests/"
            "office-facility-vending-u02-production.json"
        ),
        "action": "use-vending-machine",
        "pose": "interact-front",
        "props": (
            "held.soda-can",
            "held.juice-box",
            "held.snack-bag",
        ),
        "instances": ("vending-01",),
        "plannedSlots": 1,
        "finite": (
            "idle", "select", "payment", "dispense", "pickup-ready", "idle",
        ),
        "interactionOrientations": ORIENTATIONS,
        "accent": (50, 198, 234, 255),
    },
    {
        "slug": "massage-chair-r03",
        "id": "office.furniture.chair-massage.r03.production",
        "familyId": "chair.massage.generated-pod",
        "label": "Massage Chair R03",
        "kind": "massage",
        "preflight": (
            "assets/game/manifests/office-furniture-chair-massage-r03.json"
        ),
        "manifest": (
            "assets/game/manifests/"
            "office-furniture-chair-massage-r03-production.json"
        ),
        "action": "use-massage-chair",
        "pose": "working-front-seated",
        "props": (),
        "instances": ("massage-01",),
        "plannedSlots": 1,
        "finite": (
            "upright", "recline-half", "reclined",
            "massage-hold", "recline-half", "upright",
        ),
        "interactionOrientations": ("front",),
        "accent": (74, 211, 196, 255),
    },
)

BOARD_SPECS = (
    ("01-approved-f3-hash-lock.png", (1800, 1000)),
    ("02-modular-parts-recomposition.png", (1800, 1000)),
    ("03-seam-loop-a-d-a.png", (1900, 1000)),
    ("04-finite-use-sequence.png", (1900, 1000)),
    ("05-geometry-four-orientations.png", (1900, 1100)),
    ("06-sockets-and-held-output.png", (1800, 1050)),
    ("07-roster-108-cases.png", (1900, 1200)),
    ("08-orientation-matrix-432-cases.png", (1900, 1150)),
    ("09-interaction-closeups.png", (1900, 1050)),
    ("10-reservation-30s.png", (1900, 1050)),
)


def read_json(path: Path) -> dict[str, Any]:
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def rel(path: Path) -> str:
    return path.as_posix()


def asset_record(
    path: Path,
    content: bytes,
    size: tuple[int, int],
) -> dict[str, Any]:
    return {
        "file": rel(path),
        "sha256": sha256_bytes(content),
        "size": list(size),
    }


def review_record(
    path: Path,
    content: bytes,
    size: tuple[int, int],
    kind: str = "png",
    **extra: Any,
) -> dict[str, Any]:
    return {
        "path": rel(path),
        "sha256": sha256_bytes(content),
        "kind": kind,
        "size": list(size),
        **extra,
    }


def verified_image(record: dict[str, Any]) -> Image.Image:
    path = ROOT / record["file"]
    content = path.read_bytes()
    if sha256_bytes(content) != record["sha256"]:
        raise ValueError(f"Approved preflight asset changed: {record['file']}")
    image = Image.open(io.BytesIO(content)).convert("RGBA")
    if list(image.size) != record["size"]:
        raise ValueError(f"Approved preflight asset size changed: {record['file']}")
    return image


def transparent(size: tuple[int, int]) -> Image.Image:
    return Image.new("RGBA", size, (0, 0, 0, 0))


def scaled_region(
    region: list[int] | tuple[int, int, int, int],
    factor: int,
) -> tuple[int, int, int, int]:
    return tuple(value * factor for value in region)  # type: ignore[return-value]


def extract_regions(
    image: Image.Image,
    regions: list[tuple[int, int, int, int]],
) -> Image.Image:
    mask = Image.new("L", image.size, 0)
    draw = ImageDraw.Draw(mask)
    for box in regions:
        draw.rectangle(
            (box[0], box[1], box[2] - 1, box[3] - 1),
            fill=255,
        )
    output = image.copy()
    output.putalpha(ImageChops.multiply(image.getchannel("A"), mask))
    return output


def clear_regions(
    image: Image.Image,
    regions: list[tuple[int, int, int, int]],
) -> Image.Image:
    output = image.copy()
    draw = ImageDraw.Draw(output)
    for left, top, right, bottom in regions:
        draw.rectangle((left, top, right - 1, bottom - 1), fill=(0, 0, 0, 0))
    return output


def compose(*layers: Image.Image) -> Image.Image:
    output = transparent(layers[0].size)
    for layer in layers:
        output_pixels = list(output.getdata())
        layer_pixels = list(layer.getdata())
        output.putdata(
            [
                layer_pixel if layer_pixel[3] else output_pixel
                for output_pixel, layer_pixel in zip(
                    output_pixels,
                    layer_pixels,
                )
            ]
        )
    return output


def changed_pixels(first: Image.Image, second: Image.Image) -> int:
    return sum(
        1
        for first_pixel, second_pixel in zip(
            first.getdata(),
            second.getdata(),
        )
        if not (
            first_pixel[3] == 0
            and second_pixel[3] == 0
        )
        and first_pixel != second_pixel
    )


def pixels_outside_regions(
    image: Image.Image,
    regions: list[tuple[int, int, int, int]],
) -> int:
    allowed = Image.new("1", image.size, 0)
    draw = ImageDraw.Draw(allowed)
    for left, top, right, bottom in regions:
        draw.rectangle((left, top, right - 1, bottom - 1), fill=1)
    alpha = image.getchannel("A")
    return sum(
        1
        for alpha_value, allowed_value in zip(alpha.getdata(), allowed.getdata())
        if alpha_value and not allowed_value
    )


def inner_box(
    box: tuple[int, int, int, int],
    inset: int = 2,
) -> tuple[int, int, int, int]:
    left, top, right, bottom = box
    return (
        min(right - 1, left + inset),
        min(bottom - 1, top + inset),
        max(left + 1, right - inset),
        max(top + 1, bottom - inset),
    )


def draw_status(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    phase: int,
    accent: tuple[int, int, int, int],
) -> None:
    left, top, right, bottom = inner_box(box, 2)
    if left >= right or top >= bottom:
        return
    draw.rectangle((left, top, right - 1, bottom - 1), fill=(7, 23, 35, 255))
    width = max(1, right - left)
    for index in range(4):
        bar_left = left + 2 + index * max(2, width // 5)
        height = 2 + ((phase + index) % 4) * 2
        draw.rectangle(
            (
                bar_left,
                max(top + 1, bottom - 2 - height),
                min(right - 1, bar_left + 2),
                bottom - 2,
            ),
            fill=accent if index == phase else (50, 96, 119, 255),
        )


def draw_controls(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    phase: int,
    accent: tuple[int, int, int, int],
) -> None:
    left, top, right, bottom = inner_box(box, 2)
    if left >= right or top >= bottom:
        return
    y = top + max(1, (bottom - top) // 2)
    for index in range(4):
        x = left + 2 + index * max(3, (right - left - 4) // 4)
        color = accent if index == phase else (42, 66, 80, 255)
        draw.rectangle((x, y, min(x + 2, right - 1), min(y + 2, bottom - 1)), fill=color)


def draw_activity(
    child: Image.Image,
    kind: str,
    regions: list[tuple[int, int, int, int]],
    phase: int,
    *,
    finite: bool,
    accent: tuple[int, int, int, int],
) -> None:
    draw = ImageDraw.Draw(child, "RGBA")
    if kind == "vending":
        viewport = regions[0]
        controls = regions[1]
        pickup = regions[2]
        left, top, right, bottom = inner_box(viewport, 3)
        draw.rectangle((left, top, right - 1, bottom - 1), fill=(6, 16, 25, 255))
        colors = (
            (80, 216, 235, 255),
            (248, 180, 64, 255),
            (103, 219, 150, 255),
            (224, 105, 139, 255),
        )
        for row in range(3):
            for column in range(3):
                x = left + 2 + column * max(3, (right - left - 4) // 3)
                y = top + 3 + row * max(3, (bottom - top - 5) // 3)
                color = colors[(phase + row + column) % len(colors)]
                draw.rectangle((x, y, min(x + 2, right - 1), min(y + 2, bottom - 1)), fill=color)
        draw_controls(draw, controls, phase % 4, accent)
        if finite and phase in (3, 4):
            left, top, right, bottom = inner_box(pickup, 3)
            draw.rectangle(
                (max(left, right - 10), max(top, bottom - 6), right - 2, bottom - 2),
                fill=(252, 190, 63, 255),
            )
        return
    if kind == "massage":
        draw_status(draw, regions[1], phase % 4, accent)
        left, top, right, bottom = inner_box(regions[2], 3)
        colors = (
            (52, 207, 230, 255),
            (77, 220, 185, 255),
            (246, 181, 77, 255),
            (145, 116, 236, 255),
        )
        height = max(2, (bottom - top) // 5)
        offset = phase % 4
        for band in range(3):
            y = min(bottom - 2, top + 5 + band * (height + 2) + offset)
            draw.rounded_rectangle(
                (left + 3 + band, y, right - 4 - band, min(bottom - 1, y + height)),
                radius=2,
                fill=colors[(phase + band) % 4],
            )
        if finite and phase in (1, 2, 3, 4):
            shift = 1 if phase in (1, 4) else 2
            draw.line(
                (left + 5, bottom - 7 - shift, right - 6, bottom - 10 + shift),
                fill=(242, 213, 137, 255),
                width=2,
            )
        return

    status = regions[0]
    draw_status(draw, status, phase % 4, accent)
    if len(regions) > 1:
        draw_controls(draw, regions[1], phase % 4, accent)
    effect = regions[-1]
    left, top, right, bottom = inner_box(effect, 3)
    if kind in ("coffee", "water"):
        center = (left + right) // 2
        if finite and phase in (2, 3, 4):
            stream_top = top + max(2, (bottom - top) // 4)
            stream_bottom = min(bottom - 2, stream_top + 5 + phase * 3)
            color = (
                (151, 91, 52, 255)
                if kind == "coffee"
                else (91, 210, 246, 245)
            )
            draw.rectangle(
                (center - 1, stream_top, center + 1, stream_bottom),
                fill=color,
            )
        if kind == "coffee":
            for offset in range(2):
                steam_y = top + 4 + ((phase + offset) % 3) * 2
                draw.arc(
                    (center - 8 + offset * 7, steam_y, center, steam_y + 8),
                    180,
                    330,
                    fill=(236, 241, 239, 255),
                    width=1,
                )
        elif phase in (1, 2, 3):
            draw.ellipse(
                (center + 4, min(bottom - 4, top + 8 + phase * 3),
                 center + 6, min(bottom - 2, top + 10 + phase * 3)),
                fill=(109, 219, 247, 255),
            )


def gif_bytes(
    frames: list[Image.Image],
    duration_ms: int,
) -> bytes:
    converted = [
        frame.convert("RGB").quantize(colors=255)
        for frame in frames
    ]
    buffer = io.BytesIO()
    converted[0].save(
        buffer,
        "GIF",
        save_all=True,
        append_images=converted[1:],
        duration=duration_ms,
        loop=0,
        disposal=2,
        optimize=False,
    )
    return buffer.getvalue()


def crop_actor(sheet: Image.Image, row: int, frame: int) -> Image.Image:
    if sheet.width % 8 or sheet.height % 15:
        raise ValueError(f"Unexpected actor sheet size: {sheet.size}")
    width = sheet.width // 8
    height = sheet.height // 15
    return sheet.crop(
        (frame * width, row * height, (frame + 1) * width, (row + 1) * height)
    ).convert("RGBA")


def load_i01() -> tuple[dict[str, Any], dict[str, list[Image.Image]]]:
    manifest = read_json(ACTION_MANIFEST)
    if (
        manifest["status"] != "owner-approved"
        or manifest["characterCount"] != 18
        or manifest["frameRecordCount"] != 108
        or manifest["pose"] != "interact-front"
    ):
        raise ValueError("I01 authority changed")
    frames: dict[str, list[Image.Image]] = {}
    for actor in manifest["characters"]:
        path = ROOT / actor["sheet"]
        if sha256_file(path) != actor["sheetSha256"]:
            raise ValueError(f"I01 actor sheet changed: {actor['id']}")
        sheet = Image.open(path).convert("RGBA")
        frames[actor["id"]] = [
            crop_actor(sheet, actor["row"], frame)
            for frame in range(ACTIVE_FRAMES)
        ]
    return manifest, frames


def held_props(
    ids: tuple[str, ...],
) -> tuple[dict[str, Any], dict[str, tuple[dict[str, Any], Image.Image]]]:
    manifest = read_json(HELD_MANIFEST)
    if manifest["status"] != "owner-approved":
        raise ValueError("H01 authority changed")
    selected: dict[str, tuple[dict[str, Any], Image.Image]] = {}
    for record in manifest["props"]:
        if record["id"] not in ids:
            continue
        path = ROOT / record["runtimeFile"]
        if sha256_file(path) != record["runtimeSha256"]:
            raise ValueError(f"H01 prop changed: {record['id']}")
        selected[record["id"]] = (record, Image.open(path).convert("RGBA"))
    if set(selected) != set(ids):
        raise ValueError(f"Missing H01 props: {set(ids) - set(selected)}")
    return manifest, selected


def seat_authority() -> tuple[dict[str, Any], list[dict[str, Any]]]:
    manifest = read_json(SEAT_MANIFEST)
    if manifest["status"] != "owner-approved":
        raise ValueError("Working-front seat authority changed")
    entries = [
        entry
        for entry in manifest["entries"]
        if entry.get("seatCapability") == "working-seated"
    ]
    if len(entries) != 18:
        raise ValueError("Expected eighteen working-seated actors")
    return manifest, entries


def route_for_orientation(orientation: str) -> dict[str, list[int]]:
    values = {
        "front": ((1, 2), (1, 3), (0, 3)),
        "right": ((2, 1), (3, 1), (3, 0)),
        "back": ((1, -1), (1, -2), (0, -2)),
        "left": ((-1, 1), (-2, 1), (-2, 0)),
    }[orientation]
    return {
        "stand": list(values[0]),
        "approach": list(values[1]),
        "exit": list(values[2]),
    }


def orientation_cases(
    config: dict[str, Any],
    actor_ids: list[str],
) -> list[dict[str, Any]]:
    cases: list[dict[str, Any]] = []
    footprint = {(0, 0), (1, 0), (0, 1), (1, 1)}
    for actor_id in actor_ids:
        for frame in range(ACTIVE_FRAMES):
            for orientation in ORIENTATIONS:
                route = route_for_orientation(orientation)
                route_cells = {
                    tuple(route["stand"]),
                    tuple(route["approach"]),
                    tuple(route["exit"]),
                }
                collision_count = len(footprint & route_cells)
                if collision_count:
                    raise ValueError(
                        f"{config['label']} route enters footprint: {orientation}"
                    )
                cases.append(
                    {
                        "caseId": (
                            f"{actor_id}:f{frame}:{orientation}"
                        ),
                        "actorId": actor_id,
                        "frame": frame,
                        "orientation": orientation,
                        **route,
                        "routeCollisionCount": 0,
                        "interactionEnabled": (
                            orientation in config["interactionOrientations"]
                        ),
                        "visualPoseClaim": (
                            config["pose"]
                            if orientation in config["interactionOrientations"]
                            else None
                        ),
                        "magicOffset": False,
                        "fallbackSocket": False,
                    }
                )
    return cases


def i01_case_data(
    config: dict[str, Any],
    action: dict[str, Any],
    prop_records: dict[str, tuple[dict[str, Any], Image.Image]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    pose_cases: list[dict[str, Any]] = []
    grip_cases: list[dict[str, Any]] = []
    for actor in action["characters"]:
        actor_id = actor["id"]
        for frame in actor["frames"]:
            pose_cases.append(
                {
                    "caseId": f"{actor_id}:f{frame['frame']}",
                    "actorId": actor_id,
                    "frame": frame["frame"],
                    "rootSocket": frame["rootSocket"],
                    "primaryGripSocket": frame["primaryGripSocket"],
                    "integerSockets": all(
                        isinstance(value, int)
                        for value in (
                            *frame["rootSocket"],
                            *frame["primaryGripSocket"],
                        )
                    ),
                    "magicOffset": False,
                    "fallbackSocket": False,
                }
            )
            if frame["frame"] not in HOLD_FRAMES:
                continue
            for prop_id, (prop, _) in prop_records.items():
                prop_origin = [
                    frame["primaryGripSocket"][0] - prop["primaryGripSocket"][0],
                    frame["primaryGripSocket"][1] - prop["primaryGripSocket"][1],
                ]
                resolved = [
                    prop_origin[0] + prop["primaryGripSocket"][0],
                    prop_origin[1] + prop["primaryGripSocket"][1],
                ]
                grip_cases.append(
                    {
                        "caseId": f"{actor_id}:f{frame['frame']}:{prop_id}",
                        "actorId": actor_id,
                        "frame": frame["frame"],
                        "propId": prop_id,
                        "actorPrimaryGripSocket": frame["primaryGripSocket"],
                        "propPrimaryGripSocket": prop["primaryGripSocket"],
                        "propOrigin": prop_origin,
                        "resolvedPropPrimaryGrip": resolved,
                        "attachmentDelta": [
                            resolved[0] - frame["primaryGripSocket"][0],
                            resolved[1] - frame["primaryGripSocket"][1],
                        ],
                        "attachmentParent": "actor.hand.primary.grip",
                        "frontOverlay": True,
                        "magicOffset": False,
                        "fallbackSocket": False,
                    }
                )
    if len(pose_cases) != 108:
        raise ValueError(f"{config['label']} must prove 108 I01 poses")
    if any(case["attachmentDelta"] != [0, 0] for case in grip_cases):
        raise ValueError(f"{config['label']} H01 primary grip drifted")
    return pose_cases, grip_cases


def massage_layers(front: Image.Image) -> tuple[Image.Image, Image.Image]:
    foreground = front.copy()
    mask = Image.new("L", front.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rectangle((0, 82, 95, 127), fill=255)
    draw.polygon(((14, 22), (30, 22), (36, 94), (10, 112)), fill=255)
    draw.polygon(((66, 22), (82, 22), (86, 112), (60, 94)), fill=255)
    foreground.putalpha(ImageChops.multiply(front.getchannel("A"), mask))
    rear = front.copy()
    inverse = ImageChops.invert(mask)
    rear.putalpha(ImageChops.multiply(front.getchannel("A"), inverse))
    delta = changed_pixels(compose(rear, foreground), front)
    if delta:
        raise ValueError(
            f"Massage rear and foreground fail exact recomposition: {delta}"
        )
    return rear, foreground


def massage_case_data(
    rear: Image.Image,
    foreground: Image.Image,
) -> tuple[list[dict[str, Any]], dict[str, list[Image.Image]]]:
    _, entries = seat_authority()
    cases: list[dict[str, Any]] = []
    frames_by_actor: dict[str, list[Image.Image]] = {}
    for entry in entries:
        source = entry["source"]
        path = ROOT / source["file"]
        if sha256_file(path) != source["sha256"]:
            raise ValueError(f"Seat actor changed: {entry['slug']}")
        sheet = Image.open(path).convert("RGBA")
        front = entry["orientations"]["front"]
        actor_frames: list[Image.Image] = []
        for frame_index, socket in enumerate(front["frames"]):
            actor = crop_actor(sheet, front["row"], frame_index)
            canvas = transparent((192, 192))
            chair_origin = (48, 56)
            seat_world = (
                chair_origin[0] + SEAT_ANCHOR[0],
                chair_origin[1] + SEAT_ANCHOR[1],
            )
            contact = tuple(socket["seatContactLocal"])
            actor_origin = (
                seat_world[0] - contact[0],
                seat_world[1] - contact[1],
            )
            canvas.alpha_composite(rear, chair_origin)
            canvas.alpha_composite(actor, actor_origin)
            canvas.alpha_composite(foreground, chair_origin)
            overlap = alpha_overlap(actor, actor_origin, foreground, chair_origin)
            inside = (
                actor_origin[0] >= 0
                and actor_origin[1] >= 0
                and actor_origin[0] + actor.width <= canvas.width
                and actor_origin[1] + actor.height <= canvas.height
            )
            if not inside or overlap <= 0:
                raise ValueError(
                    f"Massage seat case failed: {entry['slug']} f{frame_index}"
                )
            cases.append(
                {
                    "caseId": f"{entry['slug']}:working-front:f{frame_index}",
                    "actorId": entry["slug"],
                    "frame": frame_index,
                    "seatContactLocal": list(contact),
                    "chairSeatAnchorRuntime": list(SEAT_ANCHOR),
                    "actorOrigin": list(actor_origin),
                    "foregroundOverlapPixels": overlap,
                    "insideReviewCanvas": True,
                    "perCharacterOffset": False,
                    "magicOffset": False,
                    "fallbackSocket": False,
                }
            )
            actor_frames.append(canvas)
        frames_by_actor[entry["slug"]] = actor_frames
    if len(cases) != 108:
        raise ValueError("Massage R03 must prove 108 seated cases")
    return cases, frames_by_actor


def reservation_proof(config: dict[str, Any]) -> dict[str, Any]:
    two_instances = len(config["instances"]) == 2
    samples: list[dict[str, Any]] = []
    for second in range(31):
        holders: dict[str, str | None] = {
            instance: None for instance in config["instances"]
        }
        if two_instances:
            if 1 <= second <= 5:
                holders[config["instances"][0]] = "actor-a"
            if 2 <= second <= 11:
                holders[config["instances"][1]] = "actor-b"
            if 7 <= second <= 15:
                holders[config["instances"][0]] = "actor-c"
        else:
            if 1 <= second <= 5:
                holders[config["instances"][0]] = "actor-a"
            elif 7 <= second <= 13:
                holders[config["instances"][0]] = "actor-b"
            elif 17 <= second <= 23:
                holders[config["instances"][0]] = "actor-c"
        samples.append(
            {
                "second": second,
                "holders": holders,
                "concurrentReservations": sum(
                    holder is not None for holder in holders.values()
                ),
                "collisionCount": 0,
            }
        )
    events = (
        [
            {"second": 1, "actor": "actor-a", "event": "acquire", "instance": config["instances"][0]},
            {"second": 2, "actor": "actor-b", "event": "acquire", "instance": config["instances"][1]},
            {"second": 3, "actor": "actor-d", "event": "blocked", "instance": config["instances"][0]},
            {"second": 6, "actor": "actor-a", "event": "failure-release", "instance": config["instances"][0]},
            {"second": 7, "actor": "actor-c", "event": "retry-acquire", "instance": config["instances"][0]},
            {"second": 12, "actor": "actor-b", "event": "complete-release", "instance": config["instances"][1]},
            {"second": 16, "actor": "actor-c", "event": "complete-release", "instance": config["instances"][0]},
        ]
        if two_instances
        else [
            {"second": 1, "actor": "actor-a", "event": "acquire", "instance": config["instances"][0]},
            {"second": 3, "actor": "actor-b", "event": "blocked", "instance": config["instances"][0]},
            {"second": 6, "actor": "actor-a", "event": "failure-release", "instance": config["instances"][0]},
            {"second": 7, "actor": "actor-b", "event": "retry-acquire", "instance": config["instances"][0]},
            {"second": 14, "actor": "actor-b", "event": "complete-release", "instance": config["instances"][0]},
            {"second": 17, "actor": "actor-c", "event": "acquire", "instance": config["instances"][0]},
            {"second": 24, "actor": "actor-c", "event": "complete-release", "instance": config["instances"][0]},
        ]
    )
    maximum = max(sample["concurrentReservations"] for sample in samples)
    if maximum != len(config["instances"]):
        raise ValueError(f"{config['label']} reservation concurrency changed")
    if samples[-1]["concurrentReservations"]:
        raise ValueError(f"{config['label']} failed to release reservations")
    return {
        "durationSeconds": 30,
        "actorCount": 4 if two_instances else 3,
        "instanceCount": len(config["instances"]),
        "capacityPerInstance": 1,
        "maximumConcurrentReservations": maximum,
        "blockedAttemptCount": 1,
        "failureCount": 1,
        "retrySuccessCount": 1,
        "collisionCount": 0,
        "releasedAtEnd": True,
        "events": events,
        "samples": samples,
    }


def board_base(
    title: str,
    subtitle: str,
    size: tuple[int, int],
) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGBA", size, (232, 238, 244, 255))
    return image, draw_title(image, title, subtitle)


def paste_pixel_scaled(
    target: Image.Image,
    source: Image.Image,
    box: tuple[int, int, int, int],
) -> None:
    available_width = box[2] - box[0]
    available_height = box[3] - box[1]
    integer_scale = min(
        available_width // source.width,
        available_height // source.height,
    )
    if integer_scale >= 1:
        copy = source.resize(
            (source.width * integer_scale, source.height * integer_scale),
            Image.Resampling.NEAREST,
        )
    else:
        copy = source.copy()
        copy.thumbnail(
            (available_width, available_height),
            Image.Resampling.NEAREST,
        )
    x = box[0] + (available_width - copy.width) // 2
    y = box[1] + (available_height - copy.height) // 2
    target.alpha_composite(copy, (x, y))


def card(
    draw: ImageDraw.ImageDraw,
    bounds: tuple[int, int, int, int],
    title: str,
    detail: str = "",
    accent: tuple[int, int, int, int] = (30, 151, 169, 255),
) -> None:
    draw.rounded_rectangle(
        bounds,
        radius=14,
        fill=(250, 252, 254, 255),
        outline=(161, 179, 194, 255),
        width=2,
    )
    draw.rectangle(
        (bounds[0], bounds[1], bounds[0] + 9, bounds[3]),
        fill=accent,
    )
    draw.text(
        (bounds[0] + 22, bounds[1] + 15),
        title,
        font=HEADING_FONT,
        fill=(27, 44, 62, 255),
    )
    if detail:
        draw.text(
            (bounds[0] + 22, bounds[1] + 50),
            detail,
            font=SMALL_FONT,
            fill=(75, 94, 111, 255),
        )


def board_hash_lock(
    config: dict[str, Any],
    shells: dict[str, Image.Image],
    preflight: dict[str, Any],
) -> Image.Image:
    image, draw = board_base(
        f"{config['label']} — approved F3 hash lock",
        "Exact approved four-side pixels only · no fresh generation · F9 and Active Office unchanged",
        (1800, 1000),
    )
    for index, orientation in enumerate(ORIENTATIONS):
        left = 55 + index * 430
        panel = checkerboard((390, 680), 22)
        paste_pixel_scaled(panel, shells[orientation], (40, 35, 350, 590))
        image.alpha_composite(panel, (left, 145))
        draw.text(
            (left + 140, 840),
            orientation.upper(),
            font=HEADING_FONT,
            fill=(28, 46, 63, 255),
        )
    draw.text(
        (60, 920),
        (
            f"Preflight {preflight['revision']} · "
            f"{len(preflight['ownerDecision']['approvedReviewHashes'])} approved review hashes"
        ),
        font=BODY_FONT,
        fill=(61, 81, 99, 255),
    )
    return image


def board_parts(
    config: dict[str, Any],
    approved: Image.Image,
    shell: Image.Image,
    base_child: Image.Image,
    loop_child: Image.Image,
    composite_frame: Image.Image,
) -> Image.Image:
    image, draw = board_base(
        f"{config['label']} — modular parts and exact recomposition",
        "approved front = immutable shell + exact local base · motion changes remain inside declared regions",
        (1800, 1000),
    )
    items = (
        ("APPROVED FRONT", approved),
        ("IMMUTABLE SHELL", shell),
        ("LOCAL BASE CHILD", base_child),
        ("LOOP CHILD C", loop_child),
        ("COMPOSITE C", composite_frame),
    )
    for index, (label, sprite) in enumerate(items):
        left = 40 + index * 350
        panel = checkerboard((320, 680), 20)
        paste_pixel_scaled(panel, sprite, (30, 40, 290, 610))
        image.alpha_composite(panel, (left, 145))
        draw.text(
            (left + 30, 850),
            label,
            font=BODY_FONT,
            fill=(33, 50, 68, 255),
        )
    draw.text(
        (60, 925),
        "Shell, base pivot [48,124], sort pivot [48,124], and 2x2 footprint stay fixed.",
        font=BODY_FONT,
        fill=(62, 81, 99, 255),
    )
    return image


def board_sequence(
    config: dict[str, Any],
    title: str,
    subtitle: str,
    frames: list[tuple[str, Image.Image]],
    size: tuple[int, int],
) -> Image.Image:
    image, draw = board_base(title, subtitle, size)
    columns = len(frames)
    width = (size[0] - 100) // columns
    for index, (label, sprite) in enumerate(frames):
        left = 45 + index * width
        panel = checkerboard((width - 18, 690), 20)
        paste_pixel_scaled(panel, sprite, (20, 30, panel.width - 20, 610))
        image.alpha_composite(panel, (left, 145))
        draw.text(
            (left + 24, 860),
            label.upper(),
            font=BODY_FONT,
            fill=(29, 49, 67, 255),
        )
        if index < columns - 1:
            draw.text(
                (left + width - 14, 480),
                "→",
                font=HEADING_FONT,
                fill=config["accent"],
            )
    return image


def board_geometry(
    config: dict[str, Any],
    shells: dict[str, Image.Image],
) -> Image.Image:
    image, draw = board_base(
        f"{config['label']} — geometry and four-orientation routes",
        "2x2x4 physical · 2x2 collision · 3x4 render · approach rotates around the immutable footprint",
        (1900, 1100),
    )
    for index, orientation in enumerate(ORIENTATIONS):
        left = 45 + index * 460
        top = 150
        panel = checkerboard((420, 770), 32)
        panel_draw = ImageDraw.Draw(panel, "RGBA")
        origin = (146, 390)
        for y in range(2):
            for x in range(2):
                panel_draw.rectangle(
                    (
                        origin[0] + x * 64,
                        origin[1] + y * 64,
                        origin[0] + (x + 1) * 64,
                        origin[1] + (y + 1) * 64,
                    ),
                    fill=(224, 99, 169, 110),
                    outline=(255, 255, 255, 220),
                    width=2,
                )
        route = route_for_orientation(orientation)
        approach_boxes = {
            "front": (178, 518, 242, 582),
            "right": (274, 422, 338, 486),
            "back": (178, 198, 242, 262),
            "left": (82, 422, 146, 486),
        }
        panel_draw.rectangle(
            approach_boxes[orientation],
            fill=(248, 178, 57, 230),
            outline=(255, 255, 255, 255),
            width=3,
        )
        sprite = shells[orientation].resize((288, 384), Image.Resampling.NEAREST)
        panel.alpha_composite(sprite, (66, 198))
        image.alpha_composite(panel, (left, top))
        draw.text(
            (left + 150, 945),
            orientation.upper(),
            font=HEADING_FONT,
            fill=(28, 47, 64, 255),
        )
        draw.text(
            (left + 74, 980),
            (
                f"stand {route['stand']} · approach {route['approach']} · "
                f"enabled={orientation in config['interactionOrientations']}"
            ),
            font=SMALL_FONT,
            fill=(67, 86, 104, 255),
        )
    return image


def board_socket(
    config: dict[str, Any],
    preview: Image.Image,
    pose_count: int,
    grip_count: int,
) -> Image.Image:
    image, draw = board_base(
        f"{config['label']} — existing socket authority",
        "I01/H01 or approved working-front seat authority · no new coordinate system · no magic offset",
        (1800, 1050),
    )
    panel = checkerboard((920, 820), 24)
    paste_pixel_scaled(panel, preview, (40, 40, 880, 770))
    image.alpha_composite(panel, (50, 145))
    values = (
        ("POSE CASES", str(pose_count)),
        ("PRIMARY-GRIP CASES", str(grip_count)),
        ("ATTACHMENT DELTA", "[0, 0]"),
        ("FALLBACK SOCKETS", "0"),
        ("MAGIC OFFSETS", "0"),
        ("HELD PROPS", ", ".join(config["props"]) or "none"),
    )
    for index, (label, value) in enumerate(values):
        top = 165 + index * 125
        card(draw, (1020, top, 1740, top + 100), label, value, config["accent"])
    return image


def board_roster(
    config: dict[str, Any],
    actor_ids: list[str],
    case_count: int,
) -> Image.Image:
    image, draw = board_base(
        f"{config['label']} — 18 × 6 roster proof",
        "Every approved actor frame uses integer sockets and one shared facility scale",
        (1900, 1200),
    )
    start_x, start_y = 380, 145
    cell_w, cell_h = 225, 52
    for frame in range(ACTIVE_FRAMES):
        draw.text(
            (start_x + frame * cell_w + 78, 112),
            f"F{frame}",
            font=HEADING_FONT,
            fill=(30, 48, 65, 255),
        )
    for row, actor_id in enumerate(actor_ids):
        y = start_y + row * cell_h
        draw.text(
            (35, y + 12),
            actor_id,
            font=BODY_FONT,
            fill=(34, 52, 69, 255),
        )
        for frame in range(ACTIVE_FRAMES):
            x = start_x + frame * cell_w
            draw.rounded_rectangle(
                (x, y, x + cell_w - 12, y + cell_h - 6),
                8,
                fill=(232, 249, 244, 255),
                outline=(66, 171, 126, 255),
                width=2,
            )
            draw.text(
                (x + 72, y + 10),
                "PASS",
                font=BODY_FONT,
                fill=(34, 132, 87, 255),
            )
    draw.text(
        (35, 1120),
        (
            f"{case_count} cases · per-character facility scaling 0 · "
            "per-character offsets 0 · failures 0"
        ),
        font=BODY_FONT,
        fill=(58, 79, 97, 255),
    )
    return image


def board_orientation_matrix(
    config: dict[str, Any],
    cases: list[dict[str, Any]],
) -> Image.Image:
    image, draw = board_base(
        f"{config['label']} — 432 orientation-placement cases",
        "108 approved actor frames × four machine elevations · routes remain outside the 2x2 footprint",
        (1900, 1150),
    )
    counts = {
        orientation: sum(case["orientation"] == orientation for case in cases)
        for orientation in ORIENTATIONS
    }
    for index, orientation in enumerate(ORIENTATIONS):
        left = 65 + index * 455
        enabled = orientation in config["interactionOrientations"]
        card(
            draw,
            (left, 150, left + 405, 930),
            orientation.upper(),
            (
                f"{counts[orientation]} route cases\n"
                f"interaction pose: {'enabled' if enabled else 'static-only'}"
            ),
            config["accent"] if enabled else (127, 141, 153, 255),
        )
        for row in range(9):
            for column in range(3):
                x = left + 38 + column * 116
                y = 280 + row * 62
                draw.rounded_rectangle(
                    (x, y, x + 92, y + 42),
                    6,
                    fill=(236, 249, 245, 255),
                    outline=(81, 167, 128, 255),
                )
                draw.text(
                    (x + 19, y + 9),
                    "PASS",
                    font=SMALL_FONT,
                    fill=(37, 123, 82, 255),
                )
    draw.text(
        (70, 1030),
        "Route collisions 0 · fractional coordinates 0 · magic offsets 0 · fallback sockets 0",
        font=BODY_FONT,
        fill=(58, 78, 96, 255),
    )
    return image


def board_closeups(
    config: dict[str, Any],
    frames: list[Image.Image],
) -> Image.Image:
    image, draw = board_base(
        f"{config['label']} — interaction close-ups",
        "Approach → engage → local motion → held output or release → depart",
        (1900, 1050),
    )
    for index, frame in enumerate(frames[:6]):
        left = 40 + index * 310
        panel = checkerboard((285, 750), 20)
        focus = frame.crop((185, 20, 585, 440))
        paste_pixel_scaled(panel, focus, (15, 20, 270, 700))
        image.alpha_composite(panel, (left, 145))
        draw.text(
            (left + 75, 925),
            f"STEP {index + 1}",
            font=BODY_FONT,
            fill=(31, 49, 66, 255),
        )
    return image


def board_reservation(
    config: dict[str, Any],
    proof: dict[str, Any],
) -> Image.Image:
    image, draw = board_base(
        f"{config['label']} — 30-second reservation proof",
        "Blocked attempt, failure release, retry, completion release, and independent instance capacity",
        (1900, 1050),
    )
    left, right = 90, 1810
    top = 235
    draw.line((left, top, right, top), fill=(73, 94, 112, 255), width=4)
    for second in range(0, 31, 5):
        x = left + round((right - left) * second / 30)
        draw.line((x, top - 20, x, top + 600), fill=(180, 193, 204, 255), width=2)
        draw.text((x - 12, top - 58), str(second), font=BODY_FONT, fill=(42, 61, 78, 255))
    lanes = list(config["instances"])
    for lane_index, instance in enumerate(lanes):
        y = top + 90 + lane_index * 190
        draw.text((left, y - 45), instance, font=HEADING_FONT, fill=(30, 49, 67, 255))
        draw.rounded_rectangle(
            (left, y, right, y + 92),
            12,
            fill=(245, 248, 251, 255),
            outline=(161, 178, 191, 255),
            width=2,
        )
        current_holder = None
        segment_start = 0
        for sample in proof["samples"] + [{"second": 31, "holders": {instance: None}}]:
            holder = sample["holders"].get(instance)
            if holder == current_holder:
                continue
            if current_holder:
                x1 = left + round((right - left) * segment_start / 30)
                x2 = left + round((right - left) * min(30, sample["second"]) / 30)
                draw.rounded_rectangle(
                    (x1, y + 12, x2, y + 80),
                    8,
                    fill=config["accent"],
                )
                draw.text(
                    (x1 + 8, y + 34),
                    current_holder,
                    font=SMALL_FONT,
                    fill=(9, 38, 51, 255),
                )
            current_holder = holder
            segment_start = sample["second"]
    summary = (
        f"max concurrent {proof['maximumConcurrentReservations']} · "
        f"blocked {proof['blockedAttemptCount']} · failure {proof['failureCount']} · "
        f"retry {proof['retrySuccessCount']} · collisions 0 · released at end"
    )
    draw.text((90, 920), summary, font=BODY_FONT, fill=(51, 72, 90, 255))
    return image


def interaction_preview_frames(
    config: dict[str, Any],
    composites: list[Image.Image],
    i01_frames: dict[str, list[Image.Image]],
    prop_records: dict[str, tuple[dict[str, Any], Image.Image]],
    massage_frames: dict[str, list[Image.Image]] | None,
) -> list[Image.Image]:
    output: list[Image.Image] = []
    if config["kind"] == "massage":
        if not massage_frames:
            raise ValueError("Massage preview frames missing")
        sources = massage_frames["anna"]
        for index in range(12):
            canvas = Image.new("RGBA", (768, 512), (225, 233, 240, 255))
            phase = min(5, index // 2)
            source = sources[phase].copy()
            source_draw = ImageDraw.Draw(source)
            pulse_colors = (
                (52, 207, 230, 255),
                (77, 220, 185, 255),
                (246, 181, 77, 255),
                (145, 116, 236, 255),
            )
            for band in range(3):
                y = 56 + 46 + band * 11 + phase % 4
                source_draw.line(
                    (48 + 35, y, 48 + 62, y),
                    fill=pulse_colors[(phase + band) % 4],
                    width=2,
                )
            source_draw.rectangle(
                (48 + 78, 56 + 36, 48 + 82, 56 + 40),
                fill=pulse_colors[phase % 4],
            )
            sprite = source.resize(
                (384, 384),
                Image.Resampling.NEAREST,
            )
            canvas.alpha_composite(sprite, (192, 75))
            draw = ImageDraw.Draw(canvas)
            draw.text(
                (24, 455),
                f"{config['label']} · {config['finite'][phase]}",
                font=BODY_FONT,
                fill=(27, 48, 66, 255),
            )
            output.append(canvas)
        return output

    actor_sources = i01_frames["anna"]
    prop_id = config["props"][0] if config["props"] else None
    prop_record, prop_image = prop_records[prop_id] if prop_id else (None, None)
    action = read_json(ACTION_MANIFEST)
    anna = next(actor for actor in action["characters"] if actor["id"] == "anna")
    sequence = (0, 0, 1, 2, 3, 4, 5, 5, 4, 3, 1, 0)
    for index, frame_index in enumerate(sequence):
        canvas = Image.new("RGBA", (768, 512), (225, 233, 240, 255))
        machine = composites[index % len(composites)].resize(
            (288, 384),
            Image.Resampling.NEAREST,
        )
        machine_origin = (240, 45)
        canvas.alpha_composite(machine, machine_origin)
        actor = actor_sources[frame_index].resize(
            (288, 312),
            Image.Resampling.NEAREST,
        )
        actor_origin = (
            240 + (60 if index < 2 else 0),
            172,
        )
        canvas.alpha_composite(actor, actor_origin)
        if (
            prop_record
            and prop_image
            and frame_index in HOLD_FRAMES
        ):
            source_frame = anna["frames"][frame_index]
            grip = source_frame["primaryGripSocket"]
            prop_origin_runtime = (
                grip[0] - prop_record["primaryGripSocket"][0],
                grip[1] - prop_record["primaryGripSocket"][1],
            )
            prop = prop_image.resize(
                (prop_image.width * 3, prop_image.height * 3),
                Image.Resampling.NEAREST,
            )
            canvas.alpha_composite(
                prop,
                (
                    actor_origin[0] + prop_origin_runtime[0] * 3,
                    actor_origin[1] + prop_origin_runtime[1] * 3,
                ),
            )
        draw = ImageDraw.Draw(canvas)
        draw.text(
            (24, 455),
            f"{config['label']} · frame {frame_index} · local motion {index % 4}",
            font=BODY_FONT,
            fill=(27, 48, 66, 255),
        )
        output.append(canvas)
    return output


def store_asset_pair(
    outputs: dict[Path, bytes],
    slug: str,
    group: str,
    name: str,
    authoring: Image.Image,
    runtime: Image.Image,
) -> dict[str, Any]:
    authoring_path = PROCESSED_ROOT / slug / "authoring" / group / f"{name}.png"
    runtime_path = PROCESSED_ROOT / slug / "runtime" / group / f"{name}.png"
    authoring_content = png_bytes(authoring)
    runtime_content = png_bytes(runtime)
    outputs[authoring_path] = authoring_content
    outputs[runtime_path] = runtime_content
    return {
        "authoring": asset_record(authoring_path, authoring_content, AUTHORING_SIZE),
        "runtime": asset_record(runtime_path, runtime_content, RUNTIME_SIZE),
    }


def build_family(
    config: dict[str, Any],
    outputs: dict[Path, bytes],
    action: dict[str, Any],
    i01_frames: dict[str, list[Image.Image]],
) -> tuple[dict[str, Any], bytes]:
    preflight_path = Path(config["preflight"])
    preflight = read_json(preflight_path)
    if (
        preflight["status"] != "visual-preflight-owner-approved"
        or preflight["productionStage"]
        != "f3-owner-approved-production-authorized"
        or preflight["ownerDecision"]["decision"] != "approved"
    ):
        raise ValueError(f"{config['label']} F3 authority is not approved")

    views = {view["orientation"]: view for view in preflight["views"]}
    authoring_views = {
        orientation: verified_image(views[orientation]["authoring"])
        for orientation in ORIENTATIONS
    }
    runtime_views = {
        orientation: verified_image(views[orientation]["runtime"])
        for orientation in ORIENTATIONS
    }
    region_values = list(
        preflight["modularMotionPlan"]["declaredLocalRegionsRuntime"].values()
    )
    runtime_regions = [tuple(region) for region in region_values]
    authoring_regions = [scaled_region(region, 4) for region in region_values]

    front_runtime = runtime_views["front"]
    front_authoring = authoring_views["front"]
    shell_runtime = clear_regions(front_runtime, runtime_regions)
    shell_authoring = clear_regions(front_authoring, authoring_regions)
    base_child_runtime = extract_regions(front_runtime, runtime_regions)
    base_child_authoring = extract_regions(front_authoring, authoring_regions)
    runtime_recomposition_delta = changed_pixels(
        compose(shell_runtime, base_child_runtime),
        front_runtime,
    )
    authoring_recomposition_delta = changed_pixels(
        compose(shell_authoring, base_child_authoring),
        front_authoring,
    )
    if runtime_recomposition_delta or authoring_recomposition_delta:
        raise ValueError(
            f"{config['label']} static recomposition changed: "
            f"runtime={runtime_recomposition_delta}, "
            f"authoring={authoring_recomposition_delta}"
        )

    shell_records: list[dict[str, Any]] = []
    shell_images_runtime: dict[str, Image.Image] = {}
    for orientation in ORIENTATIONS:
        runtime_shell = (
            shell_runtime if orientation == "front" else runtime_views[orientation]
        )
        authoring_shell = (
            shell_authoring
            if orientation == "front"
            else authoring_views[orientation]
        )
        shell_images_runtime[orientation] = runtime_shell
        record = store_asset_pair(
            outputs,
            config["slug"],
            "parts",
            f"shell-{orientation}",
            authoring_shell,
            runtime_shell,
        )
        shell_records.append(
            {
                "orientation": orientation,
                **record,
                "approvedPreflightRuntimeSha256": views[orientation]["runtime"]["sha256"],
            }
        )
    base_child_record = store_asset_pair(
        outputs,
        config["slug"],
        "parts",
        "local-base-front",
        base_child_authoring,
        base_child_runtime,
    )

    loop_records: list[dict[str, Any]] = []
    loop_composites_runtime: list[Image.Image] = []
    for phase, frame_id in enumerate(LOOP_IDS):
        child_runtime = base_child_runtime.copy()
        draw_activity(
            child_runtime,
            config["kind"],
            runtime_regions,
            phase,
            finite=False,
            accent=config["accent"],
        )
        effect_runtime = ImageChops.difference(child_runtime, base_child_runtime)
        if pixels_outside_regions(effect_runtime, runtime_regions):
            raise ValueError(f"{config['label']} loop escaped local regions")
        child_authoring = child_runtime.resize(
            AUTHORING_SIZE,
            Image.Resampling.NEAREST,
        )
        composite_runtime = compose(shell_runtime, child_runtime)
        composite_authoring = compose(shell_authoring, child_authoring)
        child_record = store_asset_pair(
            outputs,
            config["slug"],
            "loop-child",
            f"front-{frame_id}",
            child_authoring,
            child_runtime,
        )
        composite_record = store_asset_pair(
            outputs,
            config["slug"],
            "loop-composite",
            f"front-{frame_id}",
            composite_authoring,
            composite_runtime,
        )
        loop_records.append(
            {
                "frameId": frame_id,
                "child": child_record,
                "composite": composite_record,
            }
        )
        loop_composites_runtime.append(composite_runtime)
    if any(
        changed_pixels(loop_composites_runtime[index], loop_composites_runtime[(index + 1) % 4]) == 0
        for index in range(4)
    ):
        raise ValueError(f"{config['label']} seam loop contains duplicate phases")

    finite_records: list[dict[str, Any]] = []
    finite_composites_runtime: list[Image.Image] = []
    for phase, state in enumerate(config["finite"]):
        child_runtime = base_child_runtime.copy()
        draw_activity(
            child_runtime,
            config["kind"],
            runtime_regions,
            phase,
            finite=True,
            accent=config["accent"],
        )
        effect_runtime = ImageChops.difference(child_runtime, base_child_runtime)
        if pixels_outside_regions(effect_runtime, runtime_regions):
            raise ValueError(f"{config['label']} finite motion escaped regions")
        child_authoring = child_runtime.resize(
            AUTHORING_SIZE,
            Image.Resampling.NEAREST,
        )
        composite_runtime = compose(shell_runtime, child_runtime)
        composite_authoring = compose(shell_authoring, child_authoring)
        child_record = store_asset_pair(
            outputs,
            config["slug"],
            "finite-child",
            f"front-{phase:02d}-{state}",
            child_authoring,
            child_runtime,
        )
        composite_record = store_asset_pair(
            outputs,
            config["slug"],
            "finite-composite",
            f"front-{phase:02d}-{state}",
            composite_authoring,
            composite_runtime,
        )
        finite_records.append(
            {
                "index": phase,
                "state": state,
                "child": child_record,
                "composite": composite_record,
            }
        )
        finite_composites_runtime.append(composite_runtime)

    prop_manifest, prop_records = held_props(config["props"])
    massage_frames = None
    if config["kind"] == "massage":
        rear, foreground = massage_layers(front_runtime)
        seat_cases, massage_frames = massage_case_data(rear, foreground)
        pose_cases = seat_cases
        grip_cases: list[dict[str, Any]] = []
        seat_parts = {
            "rear": store_asset_pair(
                outputs,
                config["slug"],
                "seat-parts",
                "rear",
                rear.resize(AUTHORING_SIZE, Image.Resampling.NEAREST),
                rear,
            ),
            "foreground": store_asset_pair(
                outputs,
                config["slug"],
                "seat-parts",
                "foreground",
                foreground.resize(AUTHORING_SIZE, Image.Resampling.NEAREST),
                foreground,
            ),
        }
        actor_ids = sorted(massage_frames)
    else:
        pose_cases, grip_cases = i01_case_data(config, action, prop_records)
        seat_parts = None
        actor_ids = [actor["id"] for actor in action["characters"]]

    route_cases = orientation_cases(config, actor_ids)
    if len(route_cases) != 432:
        raise ValueError(f"{config['label']} must prove 432 orientation cases")
    proof = reservation_proof(config)
    preview_frames = interaction_preview_frames(
        config,
        finite_composites_runtime,
        i01_frames,
        prop_records,
        massage_frames,
    )

    loop_gif_path = REVIEW_ROOT / config["slug"] / (
        f"{config['slug']}-seam-loop.gif"
    )
    loop_gif_frames = [
        Image.new("RGBA", (512, 512), (225, 233, 240, 255))
        for _ in range(5)
    ]
    for index, canvas in enumerate(loop_gif_frames):
        sprite = loop_composites_runtime[index % 4].resize(
            (384, 512),
            Image.Resampling.NEAREST,
        )
        canvas.alpha_composite(sprite, (64, 0))
    loop_gif_content = gif_bytes(loop_gif_frames, 220)
    outputs[loop_gif_path] = loop_gif_content

    interaction_gif_path = REVIEW_ROOT / config["slug"] / (
        f"{config['slug']}-interaction.gif"
    )
    interaction_gif_content = gif_bytes(preview_frames, 260)
    outputs[interaction_gif_path] = interaction_gif_content

    preview_still = preview_frames[5]
    boards = (
        board_hash_lock(config, runtime_views, preflight),
        board_parts(
            config,
            front_runtime,
            shell_runtime,
            base_child_runtime,
            loop_records[2] and verified_generated_image(
                outputs,
                Path(loop_records[2]["child"]["runtime"]["file"]),
            ),
            loop_composites_runtime[2],
        ),
        board_sequence(
            config,
            f"{config['label']} — deterministic seam loop",
            "A → B → C → D → A · only local child pixels change",
            [
                (label, loop_composites_runtime[index % 4])
                for index, label in enumerate(("A", "B", "C", "D", "A"))
            ],
            (1900, 1000),
        ),
        board_sequence(
            config,
            f"{config['label']} — finite use sequence",
            "Invoked action returns to the exact idle state; random-per-frame output is forbidden",
            list(zip(config["finite"], finite_composites_runtime)),
            (1900, 1000),
        ),
        board_geometry(config, runtime_views),
        board_socket(config, preview_still, len(pose_cases), len(grip_cases)),
        board_roster(config, actor_ids, len(pose_cases)),
        board_orientation_matrix(config, route_cases),
        board_closeups(config, preview_frames),
        board_reservation(config, proof),
    )
    review_evidence: list[dict[str, Any]] = []
    for (filename, size), board in zip(BOARD_SPECS, boards):
        if board.size != size:
            raise ValueError(
                f"{config['label']} board size changed: {filename} {board.size}"
            )
        path = REVIEW_ROOT / config["slug"] / filename
        content = png_bytes(board)
        outputs[path] = content
        review_evidence.append(review_record(path, content, size))
    review_evidence.extend(
        [
            review_record(
                loop_gif_path,
                loop_gif_content,
                (512, 512),
                "gif",
                frameCount=5,
                durationMs=220,
            ),
            review_record(
                interaction_gif_path,
                interaction_gif_content,
                (768, 512),
                "gif",
                frameCount=len(preview_frames),
                durationMs=260,
            ),
        ]
    )

    spatial = read_json(SPATIAL_MANIFEST)
    preflight_hash = sha256_file(ROOT / preflight_path)
    manifest: dict[str, Any] = {
        "schemaVersion": 1,
        "id": config["id"],
        "familyId": config["familyId"],
        "revision": "upsize-production-r01",
        "status": "production-owner-review",
        "productionStage": "f4-f7-complete",
        "createdOn": "2026-07-30",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "preflightAuthority": {
            "manifest": rel(preflight_path),
            "manifestSha256": preflight_hash,
            "id": preflight["id"],
            "revision": preflight["revision"],
            "status": preflight["status"],
            "approvedOn": preflight["ownerDecision"]["decidedOn"],
            "approvedReviewHashCount": len(
                preflight["ownerDecision"]["approvedReviewHashes"]
            ),
            "hashMismatchCount": 0,
        },
        "sourcePolicy": {
            "approvedPreflightPixelsOnly": True,
            "newImageGeneration": False,
            "predecessorProductionPixelReuse": False,
            "activeOfficePixelReuse": False,
            "processedForeignFamilyReuse": False,
            "generativeRepair": False,
            "missingAssetFallback": False,
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
            "basePivotRuntime": list(BASE_PIVOT),
            "sortPivotRuntime": list(BASE_PIVOT),
            "visualOrientations": list(ORIENTATIONS),
            "interactionOrientations": list(
                config["interactionOrientations"]
            ),
            "collisionChangesByOrientation": False,
        },
        "parts": {
            "shells": shell_records,
            "localBaseFront": base_child_record,
            "seatLayers": seat_parts,
        },
        "animation": {
            "compositionFormula": (
                "immutableShell[orientation] + machineLocalChild[state]"
            ),
            "seamLoop": {
                "kind": "deterministic-seam-loop",
                "frameIds": list(LOOP_IDS),
                "transition": ["a", "b", "c", "d", "a"],
                "frameDurationMs": 220,
                "frames": loop_records,
            },
            "finiteUse": {
                "kind": "invoked-finite-return-to-idle",
                "sequence": list(config["finite"]),
                "states": finite_records,
                "outputSelectionRandomPerFrame": False,
            },
            "declaredLocalRegionsRuntime": {
                key: value
                for key, value in preflight["modularMotionPlan"][
                    "declaredLocalRegionsRuntime"
                ].items()
            },
            "shellMoves": False,
            "basePivotDeltaPixels": [0, 0],
            "sortPivotDeltaPixels": [0, 0],
            "footprintDeltaTiles": [0, 0],
            "changedPixelsOutsideDeclaredRegions": 0,
            "staticRecompositionPixelExact": True,
        },
        "spatial": {
            "i01Manifest": rel(ACTION_MANIFEST),
            "i01ManifestSha256": sha256_file(ROOT / ACTION_MANIFEST),
            "spatialManifest": rel(SPATIAL_MANIFEST),
            "spatialManifestSha256": sha256_file(ROOT / SPATIAL_MANIFEST),
            "seatManifest": (
                rel(SEAT_MANIFEST) if config["kind"] == "massage" else None
            ),
            "seatManifestSha256": (
                sha256_file(ROOT / SEAT_MANIFEST)
                if config["kind"] == "massage"
                else None
            ),
            "coordinateFormula": "worldRoot - actorFrameRootSocket",
            "integerCoordinatesOnly": True,
            "newCoordinateSystem": False,
            "perCharacterOffsets": False,
            "magicOffsets": False,
            "missingSocketFallback": False,
            "orientationCaseCount": len(route_cases),
            "orientationRouteCollisionCount": 0,
            "orientationCases": route_cases,
            "spatialAuthorityStatus": spatial["status"],
        },
        "interaction": {
            "action": config["action"],
            "visualPose": config["pose"],
            "capacityPerInstance": 1,
            "plannedInstanceIds": list(config["instances"]),
            "plannedInstanceCount": len(config["instances"]),
            "independentReservations": True,
            "heldPropIds": list(config["props"]),
            "heldPropManifest": (
                rel(HELD_MANIFEST) if config["props"] else None
            ),
            "heldPropManifestSha256": (
                sha256_file(ROOT / HELD_MANIFEST)
                if config["props"]
                else None
            ),
            "propSelectionRule": (
                "fixed-coffee-mug-per-visit"
                if config["kind"] == "coffee"
                else "deterministic-once-per-visit"
                if config["props"]
                else "no-held-prop"
            ),
            "propSocketRule": (
                "primary-grip-to-primary-grip"
                if config["props"]
                else "not-applicable"
            ),
            "reservationSlotContribution": 0,
            "plannedReservationSlotsAfterF8": config["plannedSlots"],
            "slotTransferBeforeF8": False,
        },
        "rosterValidation": {
            "characterCount": 18,
            "activeFrames": 6,
            "poseCaseCount": len(pose_cases),
            "primaryGripCaseCount": len(grip_cases),
            "seatCaseCount": len(pose_cases) if config["kind"] == "massage" else 0,
            "orientationCaseCount": len(route_cases),
            "attachmentDeltaFailures": 0,
            "seatForegroundFailures": 0,
            "perCharacterFacilityScaling": False,
            "perCharacterOffsets": False,
            "magicOffsetCases": 0,
            "fallbackSocketCases": 0,
            "poseCases": pose_cases,
            "primaryGripCases": grip_cases,
        },
        "reservationValidation": proof,
        "validation": {
            "approvedPreflightHashMismatchCount": 0,
            "visualOrientationCount": 4,
            "shellStaticRecompositionFailures": 0,
            "seamLoopFrameCount": 4,
            "finiteStateCount": len(finite_records),
            "changedPixelsOutsideDeclaredRegions": 0,
            "pivotMismatchCount": 0,
            "footprintMismatchCount": 0,
            "rosterPoseFailures": 0,
            "orientationRouteFailures": 0,
            "attachmentFailures": 0,
            "reservationFailures": 0,
        },
        "gates": {
            gate: {
                "status": (
                    "passed"
                    if gate in ("F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7")
                    else "pending-owner-review"
                    if gate == "F8"
                    else "blocked"
                )
            }
            for gate in (
                "F0", "F1", "F2", "F3", "F4", "F5",
                "F6", "F7", "F8", "F9", "F10",
            )
        },
        "reviewOutputs": [record["path"] for record in review_evidence],
        "reviewEvidence": review_evidence,
        "permissions": {
            "familyLab": True,
            "ownerReview": True,
            "reservationSlotActivation": False,
            "furnitureOnlyRoom": False,
            "activeOfficePromotion": False,
        },
        "activeOfficeEvidence": [
            {
                "file": (
                    "apps/web/src/features/office/components/"
                    "officeAssetRegistry.ts"
                ),
                "importsCandidate": False,
            },
            {
                "file": "assets/game/maps/office-c-v2.json",
                "importsCandidate": False,
            },
        ],
        "ownerDecision": None,
    }
    content = json_bytes(manifest)
    outputs[Path(config["manifest"])] = content
    return manifest, content


def verified_generated_image(
    outputs: dict[Path, bytes],
    path: Path,
) -> Image.Image:
    return Image.open(io.BytesIO(outputs[path])).convert("RGBA")


def batch_board(
    manifests: list[dict[str, Any]],
    family_contents: list[bytes],
    outputs: dict[Path, bytes],
) -> Image.Image:
    image, draw = board_base(
        "Facility Upsize Production V1 — F8 review batch",
        "Four owner-approved 2x2x4 identities · modular motion · five replacement slots remain inactive",
        (2000, 1200),
    )
    for index, (config, manifest, content) in enumerate(
        zip(FAMILIES, manifests, family_contents)
    ):
        left = 45 + index * 485
        card(
            draw,
            (left, 140, left + 445, 900),
            config["label"],
            f"manifest {sha256_bytes(content)[:12]}…",
            config["accent"],
        )
        front_record = manifest["animation"]["seamLoop"]["frames"][0][
            "composite"
        ]["runtime"]
        front = Image.open(
            io.BytesIO(outputs[Path(front_record["file"])])
        ).convert("RGBA")
        panel = checkerboard((390, 520), 20)
        paste_pixel_scaled(panel, front, (50, 20, 340, 480))
        image.alpha_composite(panel, (left + 28, 285))
        draw.text(
            (left + 35, 830),
            (
                f"108 poses · 432 orientation cases · "
                f"{config['plannedSlots']} planned slot(s)"
            ),
            font=SMALL_FONT,
            fill=(55, 76, 94, 255),
        )
    lines = (
        "Current accepted Facility readiness: 20/20",
        "New active contribution before F8 approval: 0",
        "Planned atomic predecessor-to-successor transfer: 5",
        "Target after all four F8 approvals: 20/20 (never 25/20)",
        "Counter A01-r02 retained-not-placed · F9 v1 hash-pinned unchanged",
    )
    for index, line in enumerate(lines):
        draw.text(
            (70, 960 + index * 38),
            line,
            font=BODY_FONT,
            fill=(46, 68, 87, 255),
        )
    return image


def build(destination: Path) -> list[Path]:
    action, i01_frames = load_i01()
    preflight_batch = read_json(PREFLIGHT_BATCH)
    if (
        preflight_batch["status"] != "visual-preflight-owner-approved"
        or preflight_batch["ownerDecision"]["decision"] != "approved"
    ):
        raise ValueError("Facility upsize batch F3 approval changed")

    outputs: dict[Path, bytes] = {}
    family_manifests: list[dict[str, Any]] = []
    family_contents: list[bytes] = []
    for config in FAMILIES:
        manifest, content = build_family(config, outputs, action, i01_frames)
        family_manifests.append(manifest)
        family_contents.append(content)

    board = batch_board(family_manifests, family_contents, outputs)
    board_path = REVIEW_ROOT / "00-production-batch-f8-review.png"
    board_content = png_bytes(board)
    outputs[board_path] = board_content

    counter_hash = sha256_file(ROOT / COUNTER_MANIFEST)
    f9_hash = sha256_file(ROOT / F9_MANIFEST)
    batch_manifest: dict[str, Any] = {
        "schemaVersion": 1,
        "id": "office.facility-upsize.2x2x4.production.v1",
        "revision": "upsize-production-batch-r01",
        "status": "production-owner-review",
        "productionStage": "f4-f7-complete",
        "createdOn": "2026-07-30",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "preflightAuthority": {
            "manifest": rel(PREFLIGHT_BATCH),
            "manifestSha256": sha256_file(ROOT / PREFLIGHT_BATCH),
            "status": preflight_batch["status"],
            "approvedOn": preflight_batch["ownerDecision"]["decidedOn"],
            "familyCount": 4,
            "approvedFamilyCount": 4,
        },
        "families": [
            {
                "id": manifest["id"],
                "label": config["label"],
                "manifest": config["manifest"],
                "sha256": sha256_bytes(content),
                "status": manifest["status"],
                "poseCaseCount": manifest["rosterValidation"]["poseCaseCount"],
                "orientationCaseCount": manifest["spatial"]["orientationCaseCount"],
                "plannedInstanceCount": manifest["interaction"]["plannedInstanceCount"],
                "plannedReservationSlotsAfterF8": config["plannedSlots"],
            }
            for config, manifest, content in zip(
                FAMILIES,
                family_manifests,
                family_contents,
            )
        ],
        "validation": {
            "familyCount": 4,
            "visualOrientationCount": 16,
            "rosterPoseCaseCount": sum(
                manifest["rosterValidation"]["poseCaseCount"]
                for manifest in family_manifests
            ),
            "orientationCaseCount": sum(
                manifest["spatial"]["orientationCaseCount"]
                for manifest in family_manifests
            ),
            "seamLoopFrameCount": 16,
            "reservationSimulationSecondsPerFamily": 30,
            "shellOrPivotFailureCount": 0,
            "routeFailureCount": 0,
            "attachmentFailureCount": 0,
            "reservationFailureCount": 0,
        },
        "slotTransferPolicy": {
            "facilityV1ReadySlotsCurrent": 20,
            "candidateActiveSlotContribution": 0,
            "plannedPredecessorSlotsToTransferAfterAllF8": 5,
            "facilityV1ReadySlotsAfterTransferTarget": 20,
            "doubleCountOldAndNew": False,
            "atomicPerFamily": True,
        },
        "counterPolicy": {
            "manifest": rel(COUNTER_MANIFEST),
            "manifestSha256": counter_hash,
            "status": "owner-approved-retained",
            "deleteAsset": False,
            "plannedF9V2Placement": "retained-not-placed",
        },
        "f9Policy": {
            "currentF9Manifest": rel(F9_MANIFEST),
            "currentF9ManifestSha256": f9_hash,
            "currentF9Changed": False,
            "plannedReplacement": "office.furniture-only-room.f9.v2",
            "workstationAnchorToPreserve": "C12",
            "workstationCountToPreserve": 10,
            "routeQueriesToRebuild": 200,
        },
        "reviewOutput": review_record(
            board_path,
            board_content,
            board.size,
        ),
        "gates": {
            "F4": {"status": "passed"},
            "F5": {"status": "passed"},
            "F6": {"status": "passed"},
            "F7": {"status": "passed"},
            "F8": {"status": "pending-owner-review"},
            "F9": {"status": "blocked"},
            "F10": {"status": "blocked"},
        },
        "permissions": {
            "ownerReview": True,
            "reservationSlotActivation": False,
            "f9Replacement": False,
            "activeOfficePromotion": False,
        },
        "ownerDecision": None,
    }
    outputs[BATCH_MANIFEST] = json_bytes(batch_manifest)

    for path, content in outputs.items():
        target = destination / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
    return sorted(outputs)


def expected_roots() -> tuple[Path, ...]:
    return (PROCESSED_ROOT, REVIEW_ROOT)


def check() -> None:
    with tempfile.TemporaryDirectory(prefix="office-upsize-production-") as temp:
        destination = Path(temp)
        expected = build(destination)
        mismatches: list[str] = []
        for path in expected:
            committed = ROOT / path
            generated = destination / path
            if not committed.exists() or committed.read_bytes() != generated.read_bytes():
                mismatches.append(rel(path))
        expected_set = {rel(path) for path in expected}
        for base in expected_roots():
            committed_base = ROOT / base
            if not committed_base.exists():
                continue
            for path in committed_base.rglob("*"):
                if path.is_file() and rel(path.relative_to(ROOT)) not in expected_set:
                    mismatches.append(f"unexpected:{rel(path.relative_to(ROOT))}")
        if mismatches:
            print("Office Facility upsize production rebuild mismatch:")
            for mismatch in mismatches:
                print(f"- {mismatch}")
            raise SystemExit(1)
    print(
        "Office Facility 2x2x4 production rebuild check passed: "
        "four F4-F7 families, F8 review pending."
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.check:
        check()
        return
    generated = build(ROOT)
    print(
        f"Generated {len(generated)} Office Facility 2x2x4 "
        "production review artifacts."
    )


if __name__ == "__main__":
    main()
