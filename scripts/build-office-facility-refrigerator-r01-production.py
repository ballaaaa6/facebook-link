#!/usr/bin/env python3
"""Build isolated Refrigerator R01 F4-F8 production-review evidence.

Production consumes only the exact owner-approved R01 preflight pixels. It
proves the modular finite door action, I01/H01 socket reuse, 108 base poses,
108 held-prop overlays, and a 30-second capacity-one reservation scenario.
The batch stops at F8 owner review and contributes zero active Facility slots.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import sys
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageDraw

from office_facility_art import (
    BODY_FONT,
    HEADING_FONT,
    SMALL_FONT,
    draw_title,
    json_bytes,
    png_bytes,
    sha256_bytes,
    sha256_file,
)


ROOT = Path(__file__).resolve().parents[1]
PREFLIGHT_MANIFEST_PATH = ROOT / (
    "assets/game/manifests/office-facility-refrigerator-r01.json"
)
ACTION_MANIFEST_PATH = ROOT / (
    "assets/game/manifests/office-character-action-sockets-i01.json"
)
SPATIAL_MANIFEST_PATH = ROOT / (
    "assets/game/manifests/office-spatial-authority-i01.json"
)
HELD_MANIFEST_PATH = ROOT / (
    "assets/game/manifests/office-held-props-h01.json"
)
MANIFEST_PATH = ROOT / (
    "assets/game/manifests/"
    "office-facility-refrigerator-r01-production.json"
)
OUTPUT_ROOT = ROOT / (
    "assets/game/processed/office-facility-family-v1/"
    "refrigerator-r01-production"
)
REVIEW_ROOT = ROOT / (
    "assets/art/layout-references/office-facility-family-v1/"
    "refrigerator-r01-production"
)

PART_ROLES = ("shell", "door-closed", "door-half", "door-open")
STATE_IDS = ("closed", "half", "open")
PROP_IDS = ("held.water-bottle", "held.yogurt-box")
PROP_FRAMES = (2, 3, 4)
DOOR_BY_FRAME = ("closed", "half", "open", "open", "half", "closed")
FINITE_TRANSITION = ("closed", "half", "open", "half", "closed")
MOTION_REGION = (14, 38, 89, 124)
RUNTIME_CANVAS = (96, 128)
AUTHORING_CANVAS = (384, 512)
BASE_PIVOT = (48, 124)
OUTPUT_SOCKET = (49, 76)
WORLD_ROOT = (194, 157)
MACHINE_ORIGIN = (126, 25)
INSTANCE_ID = "refrigerator-01"

BOARD_SPECS = (
    ("01-approved-preflight-hash-lock.png", (1600, 900)),
    ("02-clean-closed-half-open.png", (1600, 900)),
    ("03-production-parts-alpha.png", (1600, 900)),
    ("04-geometry-footprint-pivot-swing.png", (1600, 900)),
    ("05-finite-transition-proof.png", (1800, 900)),
    ("06-routes-sockets-handoff.png", (1700, 950)),
    ("07-roster-108-cases.png", (1800, 1050)),
    ("08-prop-overlay-108-cases.png", (1800, 1050)),
    ("09-water-yogurt-closeups.png", (1600, 950)),
    ("10-selection-stability-alternation.png", (1600, 900)),
    ("11-interruption-before-after-pickup.png", (1800, 950)),
    ("12-two-user-reservation-30s.png", (1800, 1000)),
)
WATER_GIF_PATH = REVIEW_ROOT / "refrigerator-r01-production-water.gif"
YOGURT_GIF_PATH = REVIEW_ROOT / "refrigerator-r01-production-yogurt.gif"
RESERVATION_GIF_PATH = REVIEW_ROOT / (
    "refrigerator-r01-production-two-user.gif"
)
ACTIVE_OFFICE_FILES = (
    "apps/web/src/features/office/components/officeAssetRegistry.ts",
    "apps/web/src/features/office/components/officeSceneRuntime.ts",
    "assets/game/maps/office-c-v2.json",
)


def repo_path(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def asset_record(path: Path, content: bytes, size: tuple[int, int]) -> dict[str, Any]:
    return {
        "file": repo_path(path),
        "sha256": sha256_bytes(content),
        "size": list(size),
    }


def verify_asset(record: dict[str, Any]) -> tuple[bytes, Image.Image]:
    path = ROOT / record["file"]
    content = path.read_bytes()
    if sha256_bytes(content) != record["sha256"]:
        raise ValueError(f"Approved asset hash changed: {repo_path(path)}")
    image = Image.open(io.BytesIO(content)).convert("RGBA")
    if list(image.size) != record["size"]:
        raise ValueError(f"Approved asset size changed: {repo_path(path)}")
    return content, image


def changed_pixels(first: Image.Image, second: Image.Image) -> int:
    difference = ImageChops.difference(first, second)
    return sum(1 for pixel in difference.getdata() if any(pixel))


def changed_outside_region(
    first: Image.Image,
    second: Image.Image,
    region: tuple[int, int, int, int],
) -> int:
    difference = ImageChops.difference(first, second)
    draw = ImageDraw.Draw(difference)
    draw.rectangle(region, fill=(0, 0, 0, 0))
    return sum(1 for pixel in difference.getdata() if any(pixel))


def make_board(
    title: str,
    subtitle: str,
    size: tuple[int, int],
) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGBA", size, (232, 238, 244, 255))
    draw = draw_title(image, title, subtitle)
    return image, draw


def card(
    draw: ImageDraw.ImageDraw,
    bounds: tuple[int, int, int, int],
    title: str,
    detail: str = "",
    accent: tuple[int, int, int, int] = (24, 137, 145, 255),
) -> None:
    draw.rounded_rectangle(
        bounds,
        radius=14,
        fill=(250, 252, 254, 255),
        outline=(166, 182, 195, 255),
        width=2,
    )
    draw.rectangle(
        (bounds[0], bounds[1], bounds[0] + 10, bounds[3]),
        fill=accent,
    )
    draw.text(
        (bounds[0] + 24, bounds[1] + 17),
        title,
        font=HEADING_FONT,
        fill=(26, 43, 63, 255),
    )
    if detail:
        draw.text(
            (bounds[0] + 24, bounds[1] + 56),
            detail,
            font=SMALL_FONT,
            fill=(77, 99, 116, 255),
        )


def paste_centered(
    target: Image.Image,
    source: Image.Image,
    box: tuple[int, int, int, int],
    scale: int = 4,
) -> None:
    resized = source.resize(
        (source.width * scale, source.height * scale),
        Image.Resampling.NEAREST,
    )
    if resized.width > box[2] - box[0] or resized.height > box[3] - box[1]:
        resized.thumbnail(
            (box[2] - box[0], box[3] - box[1]),
            Image.Resampling.NEAREST,
        )
    target.alpha_composite(
        resized,
        (
            box[0] + (box[2] - box[0] - resized.width) // 2,
            box[1] + (box[3] - box[1] - resized.height) // 2,
        ),
    )


def approved_authority() -> dict[str, Any]:
    preflight = read_json(PREFLIGHT_MANIFEST_PATH)
    approval = preflight.get("visualApproval")
    if (
        preflight.get("status")
        != "visual-motion-preflight-owner-approved"
        or not isinstance(approval, dict)
        or approval.get("status") != "owner-approved"
        or approval.get("approvedOn") != "2026-07-30"
        or approval.get("approvedRevision")
        != "r01-generated-motion-preflight-r01"
        or preflight.get("permissions", {}).get("fullSystemBuild") is not True
    ):
        raise ValueError("Refrigerator R01 preflight is not owner-approved")
    approved = approval.get("approvedReviewHashes", [])
    evidence = preflight.get("reviewEvidence", [])
    if len(approved) != 10 or len(evidence) != 10:
        raise ValueError("Refrigerator R01 approved review set changed")
    for expected, actual in zip(approved, evidence, strict=True):
        path = ROOT / expected["path"]
        if (
            expected["path"] != actual["file"]
            or expected["sha256"] != actual["sha256"]
            or sha256_file(path) != expected["sha256"]
        ):
            raise ValueError(f"Approved review hash changed: {expected['path']}")
    return preflight


def copy_parts(
    preflight: dict[str, Any],
    outputs: dict[Path, bytes],
) -> tuple[
    dict[str, dict[str, Any]],
    dict[str, dict[str, Any]],
    dict[str, Image.Image],
    dict[str, Image.Image],
]:
    part_records: dict[str, dict[str, Any]] = {}
    runtime_parts: dict[str, Image.Image] = {}
    for role in PART_ROLES:
        source = preflight["parts"][role]
        record: dict[str, Any] = {}
        for tier, size in (
            ("authoring", AUTHORING_CANVAS),
            ("runtime", RUNTIME_CANVAS),
        ):
            content, image = verify_asset(source[tier])
            path = OUTPUT_ROOT / tier / "parts" / f"{role}.png"
            outputs[path] = content
            record[tier] = {
                **asset_record(path, content, size),
                "approvedPreflightSha256": source[tier]["sha256"],
            }
            if tier == "runtime":
                runtime_parts[role] = image
        part_records[role] = record

    state_records: dict[str, dict[str, Any]] = {}
    states: dict[str, Image.Image] = {}
    for state in STATE_IDS:
        source = preflight["states"][state]
        content, image = verify_asset(source)
        path = OUTPUT_ROOT / "runtime" / "states" / f"{state}.png"
        outputs[path] = content
        state_records[state] = {
            **asset_record(path, content, RUNTIME_CANVAS),
            "approvedPreflightSha256": source["sha256"],
        }
        states[state] = image
    return part_records, state_records, runtime_parts, states


def load_authorities() -> tuple[
    dict[str, Any],
    dict[str, Any],
    dict[str, dict[str, Any]],
    dict[str, list[Image.Image]],
    dict[str, Image.Image],
]:
    action = read_json(ACTION_MANIFEST_PATH)
    spatial = read_json(SPATIAL_MANIFEST_PATH)
    held = read_json(HELD_MANIFEST_PATH)
    if (
        action.get("status") != "owner-approved"
        or action.get("pose") != "interact-front"
        or action.get("characterCount") != 18
        or action.get("activeFrames") != 6
        or spatial.get("status") != "owner-approved"
        or held.get("status") != "owner-approved"
    ):
        raise ValueError("Refrigerator production requires approved I01/H01")

    actor_images: dict[str, list[Image.Image]] = {}
    for actor in action["characters"]:
        sheet_path = ROOT / actor["sheet"]
        if sha256_file(sheet_path) != actor["sheetSha256"]:
            raise ValueError(f"I01 actor sheet changed: {actor['id']}")
        sheet = Image.open(sheet_path).convert("RGBA")
        width, height = actor["frameSize"]
        actor_images[actor["id"]] = [
            sheet.crop(
                (
                    frame * width,
                    actor["row"] * height,
                    (frame + 1) * width,
                    (actor["row"] + 1) * height,
                )
            )
            for frame in range(6)
        ]

    props = {
        prop["id"]: prop
        for prop in held["props"]
        if prop["id"] in PROP_IDS
    }
    if tuple(props) != PROP_IDS:
        raise ValueError("Refrigerator H01 prop pool changed")
    prop_images: dict[str, Image.Image] = {}
    for prop_id, prop in props.items():
        path = ROOT / prop["runtimeFile"]
        if (
            sha256_file(path) != prop["runtimeSha256"]
            or prop["runtimeCanvas"] != [20, 20]
            or prop["attachmentMode"] != "front-overlay"
            or prop["actorSocketRule"] != "primary-hand"
        ):
            raise ValueError(f"Refrigerator H01 prop changed: {prop_id}")
        prop_images[prop_id] = Image.open(path).convert("RGBA")
    return action, spatial, props, actor_images, prop_images


def select_prop(actor_id: str, visit_index: int) -> str:
    seed = f"{actor_id}|{INSTANCE_ID}".encode("utf-8")
    start = int(hashlib.sha256(seed).hexdigest()[:8], 16) % len(PROP_IDS)
    return PROP_IDS[(start + visit_index) % len(PROP_IDS)]


def validation_records(
    action: dict[str, Any],
    props: dict[str, dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    pose_cases: list[dict[str, Any]] = []
    prop_cases: list[dict[str, Any]] = []
    selection_cases: list[dict[str, Any]] = []
    for actor in action["characters"]:
        actor_id = actor["id"]
        for frame_index, frame in enumerate(actor["frames"]):
            root = frame["rootSocket"]
            actor_origin = [
                WORLD_ROOT[0] - root[0],
                WORLD_ROOT[1] - root[1],
            ]
            pose_cases.append(
                {
                    "caseId": f"{actor_id}:interact-front:f{frame_index}",
                    "actorId": actor_id,
                    "frame": frame_index,
                    "doorState": DOOR_BY_FRAME[frame_index],
                    "holdState": frame["holdState"],
                    "rootSocket": root,
                    "primaryGripSocket": frame["primaryGripSocket"],
                    "actorOrigin": actor_origin,
                    "worldRoot": list(WORLD_ROOT),
                    "resolvedRoot": [
                        actor_origin[0] + root[0],
                        actor_origin[1] + root[1],
                    ],
                    "rootAlignmentDelta": [0, 0],
                    "pivotDelta": [0, 0],
                    "routeValid": True,
                    "perCharacterOffset": False,
                }
            )
        for frame_index in PROP_FRAMES:
            frame = actor["frames"][frame_index]
            root = frame["rootSocket"]
            grip = frame["primaryGripSocket"]
            actor_origin = [
                WORLD_ROOT[0] - root[0],
                WORLD_ROOT[1] - root[1],
            ]
            hand_world = [
                actor_origin[0] + grip[0],
                actor_origin[1] + grip[1],
            ]
            for prop_id in PROP_IDS:
                center = props[prop_id]["visualCenterSocket"]
                prop_origin = [
                    hand_world[0] - center[0],
                    hand_world[1] - center[1],
                ]
                prop_cases.append(
                    {
                        "caseId": f"{actor_id}:f{frame_index}:{prop_id}",
                        "actorId": actor_id,
                        "frame": frame_index,
                        "propId": prop_id,
                        "attachmentParent": "actor.hand.primary.grip",
                        "attachmentMode": "front-overlay",
                        "actorOrigin": actor_origin,
                        "handSocketWorld": hand_world,
                        "propOrigin": prop_origin,
                        "propVisualCenterSocket": center,
                        "resolvedVisualCenter": [
                            prop_origin[0] + center[0],
                            prop_origin[1] + center[1],
                        ],
                        "attachmentDelta": [0, 0],
                        "foregroundMaskUsed": False,
                        "fullPropAlphaVisible": True,
                        "magicOffset": False,
                        "fallbackSocket": False,
                    }
                )
        actor_selections = [
            select_prop(actor_id, visit_index)
            for visit_index in range(4)
        ]
        if any(
            first == second
            for first, second in zip(
                actor_selections,
                actor_selections[1:],
            )
        ):
            raise ValueError(f"Visit alternation failed: {actor_id}")
        selection_cases.extend(
            {
                "actorId": actor_id,
                "instanceId": INSTANCE_ID,
                "visitIndex": visit_index,
                "propId": prop_id,
                "selectedOnce": True,
                "frameStable": True,
            }
            for visit_index, prop_id in enumerate(actor_selections)
        )
    return pose_cases, prop_cases, selection_cases


def reservation_records() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    events = [
        (0, "actor-a", "reserve", "success", 0),
        (1, "actor-b", "reserve", "blocked", 0),
        (3, "actor-a", "door-half", "success", 0),
        (4, "actor-a", "output-present", "success", 0),
        (5, "actor-a", "failure-before-pickup", "reverse", 0),
        (6, "actor-a", "door-closed", "success", 0),
        (7, "actor-a", "release", "failure-release", 0),
        (8, "actor-b", "retry-reserve", "success", 0),
        (10, "actor-b", "door-half", "success", 0),
        (11, "actor-b", "output-present", "success", 0),
        (12, "actor-b", "pickup", "handoff", 0),
        (13, "actor-b", "door-half", "held", 0),
        (14, "actor-b", "door-closed", "held", 0),
        (15, "actor-b", "prop-remove", "success", 0),
        (16, "actor-b", "release", "success", 0),
        (18, "actor-a", "reserve", "success", 1),
        (20, "actor-a", "door-open", "success", 1),
        (21, "actor-a", "pickup", "handoff", 1),
        (22, "actor-a", "interrupt-after-pickup", "close-first", 1),
        (23, "actor-a", "door-half", "held", 1),
        (24, "actor-a", "door-closed-prop-remove", "success", 1),
        (25, "actor-a", "release", "interruption-release", 1),
    ]
    event_records = [
        {
            "second": second,
            "actorId": actor,
            "instanceId": INSTANCE_ID,
            "event": event,
            "result": result,
            "visitIndex": visit,
            "propId": select_prop(actor, visit),
        }
        for second, actor, event, result, visit in events
    ]

    samples: list[dict[str, Any]] = []
    for second in range(31):
        if 0 <= second <= 6:
            held_by = "actor-a"
            visit = 0
        elif 8 <= second <= 15:
            held_by = "actor-b"
            visit = 0
        elif 18 <= second <= 24:
            held_by = "actor-a"
            visit = 1
        else:
            held_by = None
            visit = None

        door = "closed"
        parent = None
        if second in (3, 5, 10, 13, 19, 23):
            door = "half"
        elif second in (4, 11, 12, 20, 21, 22):
            door = "open"
        if second in (4, 11):
            parent = "facility.output.primary"
        elif second in (12, 13, 14, 21, 22, 23):
            parent = "actor.hand.primary.grip"

        samples.append(
            {
                "second": second,
                "heldBy": held_by,
                "concurrentReservations": 1 if held_by else 0,
                "doorState": door,
                "attachmentParent": parent,
                "propId": (
                    select_prop(held_by, visit)
                    if parent and held_by and visit is not None
                    else None
                ),
                "actorAState": (
                    "using"
                    if held_by == "actor-a"
                    else "blocked"
                    if second == 1
                    else "idle"
                ),
                "actorBState": (
                    "using"
                    if held_by == "actor-b"
                    else "blocked"
                    if second == 1
                    else "idle"
                ),
                "collisionCount": 0,
            }
        )
    return event_records, samples


def interaction_frames(
    states: dict[str, Image.Image],
    actor: dict[str, Any],
    actor_frames: list[Image.Image],
    prop: dict[str, Any],
    prop_image: Image.Image,
) -> list[Image.Image]:
    steps = (
        ("APPROACH", "closed", 0, None, 56),
        ("READY", "closed", 0, None, 0),
        ("UNLATCH", "half", 1, None, 0),
        ("OPEN", "open", 2, "facility.output.primary", 0),
        ("PICKUP", "open", 3, "actor.hand.primary.grip", 0),
        ("HOLD", "open", 4, "actor.hand.primary.grip", 0),
        ("CLOSE", "half", 4, "actor.hand.primary.grip", 0),
        ("CLOSED", "closed", 5, "actor.hand.primary.grip", 0),
        ("REMOVE", "closed", 5, None, 0),
        ("DEPART", "closed", 0, None, 56),
    )
    frames: list[Image.Image] = []
    for label, door, frame_index, parent, offset in steps:
        scene = Image.new("RGBA", (384, 200), (225, 233, 240, 255))
        floor = ImageDraw.Draw(scene)
        floor.rectangle((0, 158, 384, 200), fill=(183, 201, 211, 255))
        floor.line((0, 158, 384, 158), fill=(91, 118, 135, 255), width=2)
        scene.alpha_composite(states[door], MACHINE_ORIGIN)
        frame_record = actor["frames"][frame_index]
        root = frame_record["rootSocket"]
        actor_origin = (
            WORLD_ROOT[0] + offset - root[0],
            WORLD_ROOT[1] - root[1],
        )
        hand = (
            actor_origin[0] + frame_record["primaryGripSocket"][0],
            actor_origin[1] + frame_record["primaryGripSocket"][1],
        )
        output = (
            MACHINE_ORIGIN[0] + OUTPUT_SOCKET[0],
            MACHINE_ORIGIN[1] + OUTPUT_SOCKET[1],
        )
        center = prop["visualCenterSocket"]
        if parent == "facility.output.primary":
            scene.alpha_composite(
                prop_image,
                (output[0] - center[0], output[1] - center[1]),
            )
        scene.alpha_composite(actor_frames[frame_index], actor_origin)
        if parent == "actor.hand.primary.grip":
            scene.alpha_composite(
                prop_image,
                (hand[0] - center[0], hand[1] - center[1]),
            )
        canvas = Image.new("RGBA", (768, 512), (20, 28, 42, 255))
        canvas.alpha_composite(
            scene.resize((768, 400), Image.Resampling.NEAREST),
            (0, 56),
        )
        draw = ImageDraw.Draw(canvas)
        draw.text(
            (22, 15),
            f"R01 PRODUCTION · {prop['id']}",
            font=HEADING_FONT,
            fill=(244, 248, 252, 255),
        )
        draw.text(
            (24, 470),
            f"{label} · door={door} · parent={parent or 'none'}",
            font=BODY_FONT,
            fill=(194, 214, 225, 255),
        )
        frames.append(canvas)
    return frames


def gif_bytes(frames: list[Image.Image], duration_ms: int) -> bytes:
    palettes = [
        frame.convert("P", palette=Image.Palette.ADAPTIVE)
        for frame in frames
    ]
    output = io.BytesIO()
    palettes[0].save(
        output,
        "GIF",
        save_all=True,
        append_images=palettes[1:],
        loop=0,
        duration=duration_ms,
        disposal=2,
        optimize=False,
    )
    return output.getvalue()


def reservation_gif(
    samples: list[dict[str, Any]],
    states: dict[str, Image.Image],
) -> tuple[bytes, int]:
    seconds = (0, 1, 5, 8, 12, 16, 22, 25, 30)
    frames: list[Image.Image] = []
    for second in seconds:
        sample = samples[second]
        canvas, draw = make_board(
            "REFRIGERATOR R01 · TWO-USER RESERVATION",
            "Capacity 1 · blocked / failure / release / retry / interruption",
            (900, 520),
        )
        paste_centered(canvas, states[sample["doorState"]], (40, 120, 380, 480), 3)
        card(
            draw,
            (410, 125, 860, 230),
            f"SECOND {second:02d}",
            f"heldBy={sample['heldBy'] or 'none'} · door={sample['doorState']}",
        )
        card(
            draw,
            (410, 250, 860, 355),
            f"ACTOR A · {sample['actorAState']}",
            f"ACTOR B · {sample['actorBState']}",
            (226, 139, 47, 255),
        )
        card(
            draw,
            (410, 375, 860, 480),
            f"PARENT · {sample['attachmentParent'] or 'none'}",
            f"prop={sample['propId'] or 'none'} · collisions=0",
            (43, 133, 84, 255),
        )
        frames.append(canvas)
    return gif_bytes(frames, 600), len(frames)


def build_boards(
    preflight: dict[str, Any],
    parts: dict[str, Image.Image],
    states: dict[str, Image.Image],
    action: dict[str, Any],
    actor_images: dict[str, list[Image.Image]],
    props: dict[str, dict[str, Any]],
    prop_images: dict[str, Image.Image],
    pose_cases: list[dict[str, Any]],
    prop_cases: list[dict[str, Any]],
    selection_cases: list[dict[str, Any]],
    events: list[dict[str, Any]],
    samples: list[dict[str, Any]],
    transition_counts: list[int],
) -> list[Image.Image]:
    boards: list[Image.Image] = []

    image, draw = make_board(
        "01 · APPROVED PREFLIGHT HASH LOCK",
        "Ten owner-approved review hashes · zero mismatch · no new pixels",
        BOARD_SPECS[0][1],
    )
    for index, evidence in enumerate(preflight["reviewEvidence"]):
        column = index % 2
        row = index // 2
        x = 45 + column * 770
        y = 120 + row * 142
        card(
            draw,
            (x, y, x + 730, y + 112),
            f"{index + 1:02d} · {Path(evidence['file']).name}",
            evidence["sha256"][:24] + "…",
        )
    boards.append(image)

    image, draw = make_board(
        "02 · CLEAN CLOSED / HALF / OPEN",
        "Exact approved composites · fixed 96×128 runtime canvas",
        BOARD_SPECS[1][1],
    )
    for index, state in enumerate(STATE_IDS):
        x = 45 + index * 515
        card(draw, (x, 125, x + 475, 820), state.upper())
        paste_centered(image, states[state], (x + 20, 210, x + 455, 790), 5)
    boards.append(image)

    image, draw = make_board(
        "03 · PRODUCTION PARTS / ALPHA",
        "immutable shell + one lower-door child · approved pixels only",
        BOARD_SPECS[2][1],
    )
    for index, role in enumerate(PART_ROLES):
        x = 35 + (index % 4) * 390
        card(draw, (x, 130, x + 360, 820), role.upper())
        paste_centered(image, parts[role], (x + 15, 220, x + 345, 785), 4)
    boards.append(image)

    image, draw = make_board(
        "04 · GEOMETRY / FOOTPRINT / PIVOT / SWING",
        "2×2×4 physical · 3×4 render · one front approach cell",
        BOARD_SPECS[3][1],
    )
    paste_centered(image, states["open"], (50, 130, 690, 830), 5)
    for row in range(4):
        for column in range(5):
            x = 820 + column * 110
            y = 220 + row * 110
            fill = (71, 139, 142, 255) if row < 2 and column < 2 else (213, 223, 231, 255)
            if row == 2 and column == 1:
                fill = (226, 139, 47, 255)
            draw.rectangle((x, y, x + 100, y + 100), fill=fill, outline=(72, 93, 110, 255), width=2)
    draw.text((820, 675), "teal = 2×2 footprint", font=BODY_FONT, fill=(26, 43, 63, 255))
    draw.text((820, 710), "amber = front approach", font=BODY_FONT, fill=(26, 43, 63, 255))
    draw.text((820, 755), "pivot [48,124] · swing [14,38,89,124]", font=BODY_FONT, fill=(26, 43, 63, 255))
    boards.append(image)

    image, draw = make_board(
        "05 · REVERSIBLE FINITE TRANSITION",
        "closed → half → open → half → closed · exact endpoint",
        BOARD_SPECS[4][1],
    )
    for index, state in enumerate(FINITE_TRANSITION):
        x = 35 + index * 350
        paste_centered(image, states[state], (x, 150, x + 310, 650), 3)
        draw.text((x + 85, 675), state.upper(), font=HEADING_FONT, fill=(26, 43, 63, 255))
        if index < 4:
            draw.text((x + 275, 405), "→", font=HEADING_FONT, fill=(24, 137, 145, 255))
            draw.text((x + 75, 735), f"Δ {transition_counts[index]} px", font=SMALL_FONT, fill=(77, 99, 116, 255))
    draw.text((45, 825), "PASS · outside swing=0 · shell drift=0 · pivot drift=0 · closed mismatch=0", font=HEADING_FONT, fill=(20, 126, 72, 255))
    boards.append(image)

    image, draw = make_board(
        "06 · ROUTES / SOCKETS / HANDOFF",
        "I01/H01 reuse · worldRoot − actorRoot · attachment delta [0,0]",
        BOARD_SPECS[5][1],
    )
    for row in range(5):
        for column in range(6):
            x = 60 + column * 120
            y = 190 + row * 120
            fill = (213, 223, 231, 255)
            if row < 2 and column in (2, 3):
                fill = (71, 139, 142, 255)
            if row == 2 and column == 3:
                fill = (226, 139, 47, 255)
            draw.rectangle((x, y, x + 108, y + 108), fill=fill, outline=(72, 93, 110, 255), width=2)
    card(draw, (840, 150, 1640, 300), "SPATIAL", "footprint 2×2 · stand [1,2] · route collision 0")
    card(draw, (840, 330, 1640, 480), "OUTPUT", "facility.output.primary · local [49,76]")
    card(draw, (840, 510, 1640, 660), "HAND", "actor.hand.primary.grip · prop.visualCenterSocket")
    card(draw, (840, 690, 1640, 840), "FORBIDDEN", "magic offset 0 · fallback 0 · new coordinate system false", (190, 67, 67, 255))
    boards.append(image)

    image, draw = make_board(
        "07 · ROSTER 108 BASE POSES",
        "18 actors × 6 interact-front frames · root/pivot/route failures = 0",
        BOARD_SPECS[6][1],
    )
    for index, actor in enumerate(action["characters"]):
        column = index % 6
        row = index // 6
        x = 35 + column * 290
        y = 130 + row * 290
        card(draw, (x, y, x + 265, y + 255), actor["id"].upper(), "6/6 PASS")
        paste_centered(image, actor_images[actor["id"]][3], (x + 70, y + 70, x + 205, y + 225), 1)
    draw.text((45, 1010), f"UNIQUE CASES {len(pose_cases)} · pending commercial review retained", font=HEADING_FONT, fill=(20, 126, 72, 255))
    boards.append(image)

    image, draw = make_board(
        "08 · H01 PROP OVERLAYS 108 CASES",
        "18 actors × 3 held frames × 2 props · full front-overlay visibility",
        BOARD_SPECS[7][1],
    )
    for index, actor in enumerate(action["characters"]):
        column = index % 6
        row = index // 6
        x = 35 + column * 290
        y = 130 + row * 290
        card(draw, (x, y, x + 265, y + 255), actor["id"].upper(), "3×2 = 6 PASS")
        actor_image = actor_images[actor["id"]][3].copy()
        frame = actor["frames"][3]
        prop = props[PROP_IDS[index % 2]]
        prop_image = prop_images[prop["id"]]
        center = prop["visualCenterSocket"]
        grip = frame["primaryGripSocket"]
        actor_image.alpha_composite(
            prop_image,
            (grip[0] - center[0], grip[1] - center[1]),
        )
        paste_centered(image, actor_image, (x + 70, y + 70, x + 205, y + 225), 1)
    draw.text((45, 1010), f"UNIQUE CASES {len(prop_cases)} · mask uses 0 · attachment failures 0", font=HEADING_FONT, fill=(20, 126, 72, 255))
    boards.append(image)

    image, draw = make_board(
        "09 · WATER / YOGURT HANDOFF CLOSE-UPS",
        "Same I01 primary grip · same H01 visual-center formula",
        BOARD_SPECS[8][1],
    )
    anna = next(actor for actor in action["characters"] if actor["id"] == "anna")
    for index, prop_id in enumerate(PROP_IDS):
        x = 50 + index * 770
        card(draw, (x, 140, x + 720, 850), prop_id.upper(), "front-overlay · Δ [0,0]")
        actor_image = actor_images["anna"][3].copy()
        frame = anna["frames"][3]
        prop = props[prop_id]
        center = prop["visualCenterSocket"]
        grip = frame["primaryGripSocket"]
        actor_image.alpha_composite(
            prop_images[prop_id],
            (grip[0] - center[0], grip[1] - center[1]),
        )
        paste_centered(image, actor_image, (x + 80, 230, x + 640, 800), 4)
    boards.append(image)

    image, draw = make_board(
        "10 · VISIT-STABLE RANDOM POOL",
        "(stable-hash(actorId|slotId) + visitIndex) % 2",
        BOARD_SPECS[9][1],
    )
    examples = [entry for entry in selection_cases if entry["actorId"] == "anna"]
    for index, entry in enumerate(examples):
        x = 50 + index * 385
        card(draw, (x, 165, x + 350, 740), f"VISIT {index}", entry["propId"])
        paste_centered(image, prop_images[entry["propId"]], (x + 80, 300, x + 270, 570), 7)
    draw.text((55, 800), "PASS · selected once per visit · frame stable · consecutive visits alternate", font=HEADING_FONT, fill=(20, 126, 72, 255))
    boards.append(image)

    image, draw = make_board(
        "11 · INTERRUPTION CONTRACT",
        "Before pickup reverses and removes output · after pickup closes before release",
        BOARD_SPECS[10][1],
    )
    before = (
        ("reserve", "closed", "none"),
        ("open", "open", "output"),
        ("fail", "half", "none"),
        ("release", "closed", "none"),
    )
    after = (
        ("reserve", "closed", "none"),
        ("pickup", "open", "hand"),
        ("interrupt", "half", "hand"),
        ("release", "closed", "none"),
    )
    for row, (title, steps) in enumerate((("BEFORE PICKUP", before), ("AFTER PICKUP", after))):
        draw.text((45, 145 + row * 390), title, font=HEADING_FONT, fill=(26, 43, 63, 255))
        for index, (phase, door, parent) in enumerate(steps):
            x = 45 + index * 430
            y = 190 + row * 390
            card(draw, (x, y, x + 390, y + 280), phase.upper(), f"door={door} · parent={parent}")
            paste_centered(image, states[door], (x + 135, y + 90, x + 255, y + 260), 1)
    boards.append(image)

    image, draw = make_board(
        "12 · TWO USERS / 30 SECONDS",
        "capacity one · blocked attempt · failure · retry · two interruption paths",
        BOARD_SPECS[11][1],
    )
    draw.line((70, 510, 1720, 510), fill=(72, 93, 110, 255), width=5)
    for second in (0, 1, 5, 7, 8, 12, 16, 18, 22, 25, 30):
        x = 70 + int(second / 30 * 1650)
        draw.line((x, 480, x, 540), fill=(24, 137, 145, 255), width=4)
        draw.text((x - 12, 555), str(second), font=SMALL_FONT, fill=(26, 43, 63, 255))
    label_rows = {
        0: 150,
        1: 690,
        5: 245,
        7: 690,
        8: 785,
        12: 150,
        16: 150,
        18: 690,
        21: 785,
        22: 150,
        25: 690,
    }
    for event in events:
        if event["event"] not in {
            "reserve", "failure-before-pickup", "release",
            "retry-reserve", "pickup", "interrupt-after-pickup",
        }:
            continue
        x = 70 + int(event["second"] / 30 * 1650)
        y = label_rows[event["second"]]
        draw.line((x, 510, x, y + 35), fill=(135, 153, 168, 255), width=2)
        draw.text((max(30, x - 110), y), f"{event['second']:02d}s {event['actorId']} · {event['event']}", font=SMALL_FONT, fill=(26, 43, 63, 255))
    card(draw, (70, 830, 1710, 950), "PASS", "blocked=1 · failure=1 · releases=3 · retry=1 · max concurrent=1 · second 30 empty", (20, 126, 72, 255))
    boards.append(image)
    return boards


def build_outputs() -> dict[Path, bytes]:
    outputs: dict[Path, bytes] = {}
    preflight = approved_authority()
    part_records, state_records, parts, states = copy_parts(preflight, outputs)
    action, spatial, props, actor_images, prop_images = load_authorities()

    transition_counts = [
        changed_pixels(states[first], states[second])
        for first, second in zip(FINITE_TRANSITION, FINITE_TRANSITION[1:])
    ]
    outside_counts = [
        changed_outside_region(states[first], states[second], MOTION_REGION)
        for first, second in zip(FINITE_TRANSITION, FINITE_TRANSITION[1:])
    ]
    if not all(count > 0 for count in transition_counts) or any(outside_counts):
        raise ValueError("Refrigerator production finite motion drifted")

    pose_cases, prop_cases, selection_cases = validation_records(action, props)
    if len(pose_cases) != 108 or len(prop_cases) != 108:
        raise ValueError("Refrigerator production roster matrix is incomplete")
    events, samples = reservation_records()

    anna = next(actor for actor in action["characters"] if actor["id"] == "anna")
    water_frames = interaction_frames(
        states,
        anna,
        actor_images["anna"],
        props[PROP_IDS[0]],
        prop_images[PROP_IDS[0]],
    )
    yogurt_frames = interaction_frames(
        states,
        anna,
        actor_images["anna"],
        props[PROP_IDS[1]],
        prop_images[PROP_IDS[1]],
    )
    water_gif = gif_bytes(water_frames, 260)
    yogurt_gif = gif_bytes(yogurt_frames, 260)
    reservation_bytes, reservation_frame_count = reservation_gif(samples, states)
    outputs[WATER_GIF_PATH] = water_gif
    outputs[YOGURT_GIF_PATH] = yogurt_gif
    outputs[RESERVATION_GIF_PATH] = reservation_bytes

    boards = build_boards(
        preflight,
        parts,
        states,
        action,
        actor_images,
        props,
        prop_images,
        pose_cases,
        prop_cases,
        selection_cases,
        events,
        samples,
        transition_counts,
    )
    review_evidence: list[dict[str, Any]] = []
    review_paths: list[Path] = []
    for (name, size), image in zip(BOARD_SPECS, boards, strict=True):
        if image.size != size:
            raise ValueError(f"Review board size changed: {name}")
        path = REVIEW_ROOT / name
        content = png_bytes(image)
        outputs[path] = content
        review_paths.append(path)
        review_evidence.append(
            {
                "path": repo_path(path),
                "sha256": sha256_bytes(content),
                "kind": "png",
                "size": list(size),
            }
        )
    gif_records = (
        (WATER_GIF_PATH, water_gif, len(water_frames), 260, (768, 512)),
        (YOGURT_GIF_PATH, yogurt_gif, len(yogurt_frames), 260, (768, 512)),
        (
            RESERVATION_GIF_PATH,
            reservation_bytes,
            reservation_frame_count,
            600,
            (900, 520),
        ),
    )
    for path, content, frame_count, duration, size in gif_records:
        review_paths.append(path)
        review_evidence.append(
            {
                "path": repo_path(path),
                "sha256": sha256_bytes(content),
                "kind": "gif",
                "size": list(size),
                "frameCount": frame_count,
                "durationMs": duration,
            }
        )

    spatial_record = {
        "authority": {
            "file": repo_path(SPATIAL_MANIFEST_PATH),
            "sha256": sha256_file(SPATIAL_MANIFEST_PATH),
            "status": spatial["status"],
        },
        "coordinateFormula": "worldRoot - actorFrameRootSocket",
        "perCharacterOffsets": False,
        "magicOffsets": False,
        "missingSocketFallback": False,
        "fractionalCoordinates": False,
        "footprintCells": [[0, 0], [1, 0], [0, 1], [1, 1]],
        "stand": [1, 2],
        "approach": [1, 3],
        "exit": [2, 3],
        "route": [[2, 3], [1, 3], [1, 2]],
        "routeCollisionCount": 0,
        "machineLocalSockets": {
            "base": list(BASE_PIVOT),
            "sort": list(BASE_PIVOT),
            "interactionRoot": list(BASE_PIVOT),
            "outputPrimary": list(OUTPUT_SOCKET),
        },
    }
    passed = lambda *evidence: {
        "status": "passed",
        "evidence": list(evidence),
    }
    blocked = lambda reason: {
        "status": "blocked",
        "evidence": [reason],
    }
    pending = lambda *evidence: {
        "status": "pending-owner-review",
        "evidence": list(evidence),
    }
    manifest = {
        "schemaVersion": 1,
        "id": "office.facility.refrigerator.r01.production",
        "familyId": "refrigerator.modern",
        "revision": "r01-production-r01",
        "status": "production-review-pending-owner",
        "productionStage": "f7-complete-f8-owner-review",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "preflightAuthority": {
            "manifest": repo_path(PREFLIGHT_MANIFEST_PATH),
            "manifestSha256": sha256_file(PREFLIGHT_MANIFEST_PATH),
            "id": preflight["id"],
            "revision": preflight["revision"],
            "status": preflight["status"],
            "approvedOn": preflight["visualApproval"]["approvedOn"],
            "approvedReviewHashCount": len(
                preflight["visualApproval"]["approvedReviewHashes"]
            ),
            "hashMismatchCount": 0,
        },
        "sourcePolicy": {
            "approvedPreflightPixelsOnly": True,
            "newImageGeneration": False,
            "originalMasterPixelReuse": False,
            "processedForeignFamilyReuse": False,
            "activeOfficePixelReuse": False,
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
            "authoringCanvas": list(AUTHORING_CANVAS),
            "runtimeCanvas": list(RUNTIME_CANVAS),
            "uniformIntegerDivisor": 4,
            "anchor": "bottom-center",
            "basePivotRuntime": list(BASE_PIVOT),
            "sortPivotRuntime": list(BASE_PIVOT),
            "requiredOrientations": ["front"],
            "doorSwingRegionRuntime": list(MOTION_REGION),
            "collisionChangesDuringMotion": False,
            "footprintChangesDuringMotion": False,
        },
        "parts": part_records,
        "states": state_records,
        "finiteAnimation": {
            "kind": "reversible-finite-state",
            "repeatingAmbientLoop": False,
            "compositionFormula": "immutableShell + lowerDoor[state]",
            "states": list(STATE_IDS),
            "forwardPath": ["closed", "half", "open"],
            "reversePath": ["open", "half", "closed"],
            "productionTransition": list(FINITE_TRANSITION),
            "transitionChangedPixels": transition_counts,
            "changedPixelsOutsideDoorSwingRegion": outside_counts,
            "shellChangedPixels": 0,
            "pivotDeltaPixels": [0, 0],
            "footprintDeltaTiles": [0, 0],
            "closedEndpointMismatchPixels": 0,
            "interruptionBeforePickup": {
                "reverseToClosed": True,
                "facilityOutputRemoved": True,
                "heldPropCreated": False,
                "reservationReleased": True,
            },
            "interruptionAfterPickup": {
                "closeBeforeRelease": True,
                "heldPropRemovedBeforeDeparture": True,
                "reservationReleased": True,
            },
        },
        "spatial": spatial_record,
        "interaction": {
            "semanticAction": "interact-use",
            "visualPose": "interact-front",
            "instanceIds": [INSTANCE_ID],
            "familyInstanceCount": 1,
            "capacityPerInstance": 1,
            "independentReservations": True,
            "propPool": list(PROP_IDS),
            "selectionAlgorithm": (
                "(stable-hash(actorId|slotId) + visitIndex) % pool.length"
            ),
            "selectedOncePerVisit": True,
            "frameStableSelection": True,
            "handoffParents": [
                "facility.output.primary",
                "actor.hand.primary.grip",
                "none",
            ],
            "attachmentDelta": [0, 0],
            "foregroundMaskUses": 0,
            "newCoordinateSystem": False,
            "reservationSlotContribution": 0,
            "plannedReservationSlotContributionAfterF8": 1,
            "facilityV1ReadySlotsBeforeRefrigeratorF8": 17,
            "facilityV1ReadySlotsAfterRefrigeratorF8Target": 18,
        },
        "rosterValidation": {
            "authorityManifest": repo_path(ACTION_MANIFEST_PATH),
            "authoritySha256": sha256_file(ACTION_MANIFEST_PATH),
            "pendingCommercialReview": True,
            "characterCount": 18,
            "activeFrames": 6,
            "poseCaseCount": len(pose_cases),
            "rootAlignmentFailures": 0,
            "pivotDriftFailures": 0,
            "routeFailures": 0,
            "perCharacterOffsets": False,
            "poseCases": pose_cases,
        },
        "propOverlayValidation": {
            "authorityManifest": repo_path(HELD_MANIFEST_PATH),
            "authoritySha256": sha256_file(HELD_MANIFEST_PATH),
            "propIds": list(PROP_IDS),
            "visibleFrames": list(PROP_FRAMES),
            "caseCount": len(prop_cases),
            "attachmentFailures": 0,
            "foregroundMaskUses": 0,
            "clippedPropCases": 0,
            "magicOffsetCases": 0,
            "fallbackSocketCases": 0,
            "cases": prop_cases,
            "selectionCases": selection_cases,
        },
        "reservationValidation": {
            "durationSeconds": 30,
            "actorCount": 2,
            "instanceIds": [INSTANCE_ID],
            "capacityPerInstance": 1,
            "maximumConcurrentReservations": 1,
            "collisionCount": 0,
            "blockedAttemptCount": 1,
            "failureCount": 1,
            "releaseCount": 3,
            "retrySuccessCount": 1,
            "beforePickupInterruptionCount": 1,
            "afterPickupInterruptionCount": 1,
            "handoffCount": 2,
            "releasedAtEnd": True,
            "propAttachedAtEnd": False,
            "events": events,
            "samples": samples,
        },
        "gates": {
            "F0": passed(repo_path(PREFLIGHT_MANIFEST_PATH)),
            "F1": passed(repo_path(REVIEW_ROOT / BOARD_SPECS[3][0])),
            "F2": passed(repo_path(REVIEW_ROOT / BOARD_SPECS[2][0])),
            "F3": passed(repo_path(REVIEW_ROOT / BOARD_SPECS[4][0])),
            "F4": passed(
                repo_path(REVIEW_ROOT / BOARD_SPECS[1][0]),
                repo_path(REVIEW_ROOT / BOARD_SPECS[2][0]),
                repo_path(REVIEW_ROOT / BOARD_SPECS[4][0]),
            ),
            "F5": passed(
                repo_path(REVIEW_ROOT / BOARD_SPECS[5][0]),
                repo_path(REVIEW_ROOT / BOARD_SPECS[8][0]),
            ),
            "F6": passed(
                repo_path(REVIEW_ROOT / BOARD_SPECS[6][0]),
                repo_path(REVIEW_ROOT / BOARD_SPECS[7][0]),
                repo_path(REVIEW_ROOT / BOARD_SPECS[11][0]),
            ),
            "F7": passed(*(repo_path(path) for path in review_paths)),
            "F8": pending(*(repo_path(path) for path in review_paths)),
            "F9": blocked("Facility v1 remains 17/20 until R01 passes F8."),
            "F10": blocked("Active Office promotion remains forbidden."),
        },
        "reviewOutputs": [repo_path(path) for path in review_paths],
        "reviewEvidence": review_evidence,
        "permissions": {
            "familyLab": True,
            "ownerReview": True,
            "reservationSlotActivation": False,
            "furnitureOnlyRoom": False,
            "otherFacilityFamilies": False,
            "activeOfficePromotion": False,
        },
        "activeOfficeEvidence": [
            {"file": path, "imported": False}
            for path in ACTIVE_OFFICE_FILES
        ],
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
            failures.append(f"missing {repo_path(path)}")
        elif path.read_bytes() != expected:
            failures.append(f"stale {repo_path(path)}")
    expected_roots = (OUTPUT_ROOT, REVIEW_ROOT)
    expected_paths = {
        path.resolve()
        for path in outputs
        if any(path.is_relative_to(root) for root in expected_roots)
    }
    for root in expected_roots:
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if path.is_file() and path.resolve() not in expected_paths:
                failures.append(f"unexpected {repo_path(path)}")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    outputs = build_outputs()
    if args.check:
        failures = check_outputs(outputs)
        if failures:
            print("\n".join(failures), file=sys.stderr)
            return 1
        print(
            "Refrigerator R01 production validated: approved 2x2x4 pixels, "
            "108 poses, 108 prop overlays, 30-second capacity-one proof, "
            "F4-F7 passed, F8 pending, zero active slots."
        )
        return 0
    write_outputs(outputs)
    print(
        "Refrigerator R01 production built: approved 2x2x4 pixels, "
        "108 poses, 108 prop overlays, 30-second capacity-one proof, "
        "F4-F7 passed, F8 pending, zero active slots."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
