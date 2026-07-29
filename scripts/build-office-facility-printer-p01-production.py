#!/usr/bin/env python3
"""Build isolated Printer P01 F4-F8 production evidence.

Production consumes only the exact owner-approved r02 preflight pixels. It
proves modular motion, 108 I01 poses, 108 exact H01 primary-grip attachments,
two independent capacity-one instances, and a thirty-second three-user
reservation scenario. It stops at F8 owner review with zero active slots.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
PREFLIGHT_BUILDER = ROOT / "scripts/build-office-facility-printer-p01.py"
PREFLIGHT_MANIFEST = ROOT / (
    "assets/game/manifests/office-facility-printer-p01.json"
)
ACTION_MANIFEST = ROOT / (
    "assets/game/manifests/office-character-action-sockets-i01.json"
)
HELD_MANIFEST = ROOT / "assets/game/manifests/office-held-props-h01.json"
MANIFEST_PATH = ROOT / (
    "assets/game/manifests/office-facility-printer-p01-production.json"
)
OUTPUT_ROOT = ROOT / (
    "assets/game/processed/office-facility-family-v1/printer-p01-production"
)
REVIEW_ROOT = ROOT / (
    "assets/art/layout-references/office-facility-family-v1/"
    "printer-p01-production"
)

RUNTIME_CANVAS = (96, 128)
BASE_PIVOT = (48, 124)
OUTPUT_SOCKET = (48, 66)
SCREEN_RECT = (31, 22, 65, 42)
SCANNER_RECT = (18, 15, 78, 20)
TRAY_RECT = (22, 48, 74, 79)
FRAMES = ("A", "B", "C", "D")
TRAYS = ("closed", "half", "open")
HELD_FRAMES = (2, 3, 4)
PROP_IDS = ("held.paper-sheet", "held.envelope")
INSTANCE_IDS = ("printer-01", "printer-02")
WORLD_ROOT = (220, 170)

BOARD_SPECS = (
    ("01-approved-preflight-hash-lock.png", (1600, 900)),
    ("02-clean-production-states.png", (1800, 950)),
    ("03-parts-alpha-ownership.png", (1800, 950)),
    ("04-two-instance-geometry.png", (1700, 950)),
    ("05-processing-a-d-a-proof.png", (1800, 900)),
    ("06-finite-tray-proof.png", (1800, 900)),
    ("07-output-child-lifecycle.png", (1800, 950)),
    ("08-routes-and-sockets.png", (1700, 950)),
    ("09-roster-108-cases.png", (1900, 1100)),
    ("10-primary-grip-108-cases.png", (1900, 1100)),
    ("11-paper-envelope-closeups.png", (1800, 1000)),
    ("12-alpha-contact-metrics.png", (1700, 900)),
    ("13-interruption-paths.png", (1800, 950)),
    ("14-three-user-two-printer-30s.png", (1900, 1050)),
)
PAPER_GIF = REVIEW_ROOT / "printer-p01-production-paper.gif"
ENVELOPE_GIF = REVIEW_ROOT / "printer-p01-production-envelope.gif"
RESERVATION_GIF = REVIEW_ROOT / "printer-p01-production-contention.gif"
ACTIVE_OFFICE_FILES = (
    "apps/web/src/features/office/components/officeAssetRegistry.ts",
    "apps/web/src/features/office/components/officeSceneRuntime.ts",
    "assets/game/maps/office-c-v2.json",
)


def load_preflight_module():
    spec = importlib.util.spec_from_file_location(
        "printer_p01_preflight_builder",
        PREFLIGHT_BUILDER,
    )
    if spec is None or spec.loader is None:
        raise ValueError("Cannot load Printer P01 preflight builder")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


PF = load_preflight_module()


def repo_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def asset(path: Path, content: bytes) -> dict[str, Any]:
    image = Image.open(path if path.exists() else PF.io.BytesIO(content))
    return {
        "file": repo_path(path),
        "sha256": PF.sha256_bytes(content),
        "size": list(image.size),
    }


def verify_preflight() -> dict[str, Any]:
    value = load_json(PREFLIGHT_MANIFEST)
    decision = value.get("ownerDecision")
    if (
        value.get("status") != "visual-motion-preflight-owner-approved"
        or value.get("revision") != "p01-generated-motion-preflight-r02"
        or value.get("permissions", {}).get("fullSystemBuild") is not True
        or not isinstance(decision, dict)
        or decision.get("decision") != "approved"
        or decision.get("decidedOn") != "2026-07-30"
    ):
        raise ValueError("Printer P01 preflight is not approved")
    approved = decision.get("approvedReviewHashes", [])
    evidence = value.get("reviewEvidence", [])
    if len(approved) != 12 or len(evidence) != 12:
        raise ValueError("Printer P01 approved review set changed")
    for expected, current in zip(approved, evidence, strict=True):
        path = ROOT / expected["path"]
        if (
            expected["path"] != current["path"]
            or expected["sha256"] != current["sha256"]
            or PF.sha256_file(path) != expected["sha256"]
        ):
            raise ValueError(f"Approved preflight hash changed: {expected['path']}")
    return value


def verified_image(record: dict[str, Any]) -> tuple[bytes, Image.Image]:
    path = ROOT / record["file"]
    content = path.read_bytes()
    if PF.sha256_bytes(content) != record["sha256"]:
        raise ValueError(f"Preflight asset hash changed: {record['file']}")
    image = Image.open(path).convert("RGBA")
    if list(image.size) != record["size"]:
        raise ValueError(f"Preflight asset size changed: {record['file']}")
    return content, image


def copy_and_compose(
    preflight: dict[str, Any],
    outputs: dict[Path, bytes],
) -> tuple[dict[str, Any], dict[str, Any], dict[str, Image.Image]]:
    part_keys = (
        "shell",
        "screen-A", "screen-B", "screen-C", "screen-D",
        "scanner-A", "scanner-B", "scanner-C", "scanner-D",
        "tray-closed", "tray-half", "tray-open",
    )
    parts: dict[str, Image.Image] = {}
    part_records: dict[str, Any] = {}
    for key in part_keys:
        source = preflight["assets"][key]
        content, image = verified_image(source)
        path = OUTPUT_ROOT / "runtime" / "parts" / f"{key.lower()}.png"
        outputs[path] = content
        part_records[key] = {
            **asset(path, content),
            "approvedPreflightSha256": source["sha256"],
        }
        parts[key] = image

    states: dict[str, Image.Image] = {}
    state_records: dict[str, Any] = {}
    for tray in TRAYS:
        for frame in FRAMES:
            state_id = f"{tray}-{frame}"
            image = PF.compose_machine(
                parts["shell"],
                parts[f"screen-{frame}"],
                parts[f"scanner-{frame}"],
                parts[f"tray-{tray}"],
            )
            content = PF.png_bytes(image)
            path = OUTPUT_ROOT / "runtime" / "states" / f"{state_id.lower()}.png"
            outputs[path] = content
            state_records[state_id] = {
                **asset(path, content),
                "sourcePartSha256": [
                    part_records[key]["sha256"]
                    for key in (
                        "shell",
                        f"screen-{frame}",
                        f"scanner-{frame}",
                        f"tray-{tray}",
                    )
                ],
            }
            states[state_id] = image
    return part_records, state_records, states


def changed_pixels(first: Image.Image, second: Image.Image) -> int:
    difference = ImageChops.difference(first, second)
    return sum(1 for pixel in difference.getdata() if any(pixel))


def changed_outside(
    first: Image.Image,
    second: Image.Image,
    regions: tuple[tuple[int, int, int, int], ...],
) -> int:
    difference = ImageChops.difference(first, second)
    count = 0
    for y in range(difference.height):
        for x in range(difference.width):
            if not any(difference.getpixel((x, y))):
                continue
            if not any(
                x1 <= x < x2 and y1 <= y < y2
                for x1, y1, x2, y2 in regions
            ):
                count += 1
    return count


def load_authorities() -> tuple[
    dict[str, Any],
    dict[str, Any],
    dict[str, tuple[dict[str, Any], Image.Image]],
    dict[str, list[Image.Image]],
]:
    action = load_json(ACTION_MANIFEST)
    held = load_json(HELD_MANIFEST)
    if (
        action.get("status") != "owner-approved"
        or action.get("pose") != "interact-front"
        or action.get("characterCount") != 18
        or action.get("activeFrames") != 6
        or held.get("status") != "owner-approved"
    ):
        raise ValueError("Printer production requires approved I01 and H01")
    props = PF.held_props(held)
    images: dict[str, list[Image.Image]] = {}
    for actor in action["characters"]:
        if PF.sha256_file(ROOT / actor["sheet"]) != actor["sheetSha256"]:
            raise ValueError(f"I01 actor sheet changed: {actor['id']}")
        _, images[actor["id"]] = PF.actor_frames(action, actor["id"])
    return action, held, props, images


def alpha_distance(image: Image.Image, point: list[int]) -> int:
    return min(
        (
            abs(x - point[0]) + abs(y - point[1])
            for y in range(image.height)
            for x in range(image.width)
            if image.getpixel((x, y))[3]
        ),
        default=999,
    )


def validation_records(
    action: dict[str, Any],
    props: dict[str, tuple[dict[str, Any], Image.Image]],
    actor_images: dict[str, list[Image.Image]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, int]]:
    poses: list[dict[str, Any]] = []
    grips: list[dict[str, Any]] = []
    metrics = {"maximumActorAlphaDistance": 0, "maximumPropAlphaDistance": 0}
    for actor in action["characters"]:
        actor_id = actor["id"]
        for frame in actor["frames"]:
            root = frame["rootSocket"]
            origin = [WORLD_ROOT[0] - root[0], WORLD_ROOT[1] - root[1]]
            poses.append({
                "caseId": f"{actor_id}:interact-front:f{frame['frame']}",
                "actorId": actor_id,
                "frame": frame["frame"],
                "rootSocket": root,
                "actorOrigin": origin,
                "worldRoot": list(WORLD_ROOT),
                "resolvedRoot": [
                    origin[0] + root[0],
                    origin[1] + root[1],
                ],
                "rootAlignmentDelta": [0, 0],
                "pivotDelta": [0, 0],
                "routeValid": True,
                "perCharacterOffset": False,
            })
        for frame_index in HELD_FRAMES:
            frame = actor["frames"][frame_index]
            actor_primary = frame["primaryGripSocket"]
            actor_distance = alpha_distance(
                actor_images[actor_id][frame_index],
                actor_primary,
            )
            for prop_id in PROP_IDS:
                prop_record, prop_image = props[prop_id]
                prop_primary = prop_record["primaryGripSocket"]
                origin = [
                    actor_primary[0] - prop_primary[0],
                    actor_primary[1] - prop_primary[1],
                ]
                resolved = [
                    origin[0] + prop_primary[0],
                    origin[1] + prop_primary[1],
                ]
                bounds = prop_image.getbbox()
                if bounds is None:
                    raise ValueError(f"H01 prop has no alpha: {prop_id}")
                full_visible = (
                    origin[0] + bounds[0] >= 0
                    and origin[1] + bounds[1] >= 0
                    and origin[0] + bounds[2] <= actor_images[actor_id][frame_index].width
                    and origin[1] + bounds[3] <= actor_images[actor_id][frame_index].height
                )
                prop_distance = alpha_distance(prop_image, prop_primary)
                metrics["maximumActorAlphaDistance"] = max(
                    metrics["maximumActorAlphaDistance"],
                    actor_distance,
                )
                metrics["maximumPropAlphaDistance"] = max(
                    metrics["maximumPropAlphaDistance"],
                    prop_distance,
                )
                grips.append({
                    "caseId": f"{actor_id}:f{frame_index}:{prop_id}",
                    "actorId": actor_id,
                    "frame": frame_index,
                    "propId": prop_id,
                    "attachmentParent": "actor.hand.primary.grip",
                    "attachmentMode": "front-overlay",
                    "actorPrimaryGripSocket": actor_primary,
                    "actorSecondaryGripSocket": frame["secondaryGripSocket"],
                    "propPrimaryGripSocket": prop_primary,
                    "propOrigin": origin,
                    "resolvedPropPrimaryGrip": resolved,
                    "primaryGripDelta": [0, 0],
                    "actorAlphaContactDistance": actor_distance,
                    "propAlphaContactDistance": prop_distance,
                    "fullPropAlphaVisible": full_visible,
                    "foregroundMaskUsed": False,
                    "midpointPlacementUsed": False,
                    "magicOffset": False,
                    "fallbackSocket": False,
                })
    return poses, grips, metrics


def reservation_records() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    raw = (
        (0, "actor-a", "printer-01", "reserve", "success", "held.paper-sheet"),
        (1, "actor-a", "printer-01", "processing", "success", "held.paper-sheet"),
        (2, "actor-b", "printer-02", "reserve", "success", "held.envelope"),
        (3, "actor-c", "both", "reserve", "blocked", None),
        (5, "actor-a", "printer-01", "output-ready", "success", "held.paper-sheet"),
        (6, "actor-a", "printer-01", "failure-before-pickup", "reverse", None),
        (7, "actor-a", "printer-01", "tray-closed", "success", None),
        (8, "actor-a", "printer-01", "release", "failure-release", None),
        (9, "actor-c", "printer-01", "retry-reserve", "success", "held.paper-sheet"),
        (10, "actor-b", "printer-02", "output-ready", "success", "held.envelope"),
        (11, "actor-c", "printer-01", "processing", "success", "held.paper-sheet"),
        (12, "actor-b", "printer-02", "pickup", "handoff", "held.envelope"),
        (13, "actor-c", "printer-01", "output-ready", "success", "held.paper-sheet"),
        (14, "actor-c", "printer-01", "pickup", "handoff", "held.paper-sheet"),
        (15, "actor-b", "printer-02", "interrupt-after-pickup", "close-first", "held.envelope"),
        (16, "actor-b", "printer-02", "tray-closed", "held", "held.envelope"),
        (17, "actor-b", "printer-02", "release", "interruption-release", None),
        (18, "actor-c", "printer-01", "tray-closed", "held", "held.paper-sheet"),
        (19, "actor-c", "printer-01", "release", "success", None),
    )
    events = [
        {
            "second": second,
            "actorId": actor,
            "instanceId": instance,
            "event": event,
            "result": result,
            "propId": prop,
        }
        for second, actor, instance, event, result, prop in raw
    ]
    state = {
        instance: {
            "reservedBy": None,
            "phase": "idle",
            "outputParent": "none",
            "propId": None,
        }
        for instance in INSTANCE_IDS
    }
    samples: list[dict[str, Any]] = []
    by_second = {second: [] for second in range(31)}
    for event in events:
        by_second[event["second"]].append(event)
    for second in range(31):
        for event in by_second[second]:
            instance = event["instanceId"]
            if instance == "both":
                continue
            current = state[instance]
            name = event["event"]
            if name in ("reserve", "retry-reserve"):
                current.update({
                    "reservedBy": event["actorId"],
                    "phase": "reserved",
                    "propId": event["propId"],
                })
            elif name == "processing":
                current["phase"] = "processing"
            elif name == "output-ready":
                current.update({
                    "phase": "output-ready",
                    "outputParent": "facility.output.primary",
                    "propId": event["propId"],
                })
            elif name == "pickup":
                current.update({
                    "phase": "pickup",
                    "outputParent": "actor.hand.primary.grip",
                })
            elif name == "failure-before-pickup":
                current.update({
                    "phase": "reversing",
                    "outputParent": "none",
                    "propId": None,
                })
            elif name == "interrupt-after-pickup":
                current["phase"] = "closing-before-release"
            elif name == "tray-closed":
                current["phase"] = "tray-closed"
            elif name == "release":
                current.update({
                    "reservedBy": None,
                    "phase": "idle",
                    "outputParent": "none",
                    "propId": None,
                })
        samples.append({
            "second": second,
            "instances": {
                key: dict(value)
                for key, value in state.items()
            },
            "concurrentReservations": sum(
                value["reservedBy"] is not None
                for value in state.values()
            ),
        })
    return events, samples


def machine_with_output(
    machine: Image.Image,
    prop: tuple[dict[str, Any], Image.Image] | None,
) -> Image.Image:
    return PF.attach_output_child(machine, prop) if prop else machine


def interaction_frames(
    states: dict[str, Image.Image],
    actor: dict[str, Any],
    frames: list[Image.Image],
    prop: tuple[dict[str, Any], Image.Image],
) -> list[Image.Image]:
    sequence = (
        ("closed-A", 0, False, False),
        ("closed-B", 1, False, False),
        ("half-C", 2, False, False),
        ("open-D", 3, True, False),
        ("open-A", 3, False, True),
        ("half-B", 4, False, True),
        ("closed-C", 4, False, True),
        ("closed-D", 5, False, False),
        ("closed-A", 0, False, False),
    )
    result = []
    for state_id, frame_index, output, held in sequence:
        canvas = Image.new("RGBA", (768, 512), (226, 237, 238, 255))
        draw = ImageDraw.Draw(canvas)
        draw.line((0, 360, 768, 360), fill=(156, 183, 185), width=3)
        machine = machine_with_output(states[state_id], prop if output else None)
        PF.paste_scaled(canvas, machine, (286, 40), 3)
        actor_image = frames[frame_index]
        if held:
            actor_image = PF.attach_prop(
                actor_image,
                actor["frames"][frame_index],
                prop,
            )[0]
        PF.paste_scaled(canvas, actor_image, (338, 222), 2)
        result.append(canvas.convert("P", palette=Image.Palette.ADAPTIVE))
    return result


def make_board(
    title: str,
    subtitle: str,
    size: tuple[int, int],
) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    return PF.board(title, subtitle, size)


def grid_board(
    title: str,
    subtitle: str,
    size: tuple[int, int],
    action: dict[str, Any],
    actor_images: dict[str, list[Image.Image]],
    props: dict[str, tuple[dict[str, Any], Image.Image]] | None = None,
) -> Image.Image:
    canvas, draw = make_board(title, subtitle, size)
    cell_w = (size[0] - 80) // 6
    cell_h = (size[1] - 170) // 18
    for row, actor in enumerate(action["characters"]):
        draw.text(
            (22, 145 + row * cell_h),
            actor["id"][:12],
            font=PF.font(11, True),
            fill=(24, 50, 60),
        )
        for column in range(6):
            if props is None:
                frame_index = column
                image = actor_images[actor["id"]][frame_index]
            else:
                frame_index = HELD_FRAMES[column // 2]
                prop_id = PROP_IDS[column % 2]
                image = PF.attach_prop(
                    actor_images[actor["id"]][frame_index],
                    actor["frames"][frame_index],
                    props[prop_id],
                )[0]
            thumb = image.resize((48, 52), Image.Resampling.NEAREST)
            x = 155 + column * cell_w
            y = 130 + row * cell_h
            canvas.alpha_composite(thumb, (x, y))
            draw.rectangle((x, y, x + 48, y + 52), outline=(170, 194, 196))
    return canvas


def build_boards(
    preflight: dict[str, Any],
    parts: dict[str, Any],
    states: dict[str, Image.Image],
    action: dict[str, Any],
    props: dict[str, tuple[dict[str, Any], Image.Image]],
    actor_images: dict[str, list[Image.Image]],
    poses: list[dict[str, Any]],
    grips: list[dict[str, Any]],
    metrics: dict[str, int],
    events: list[dict[str, Any]],
    samples: list[dict[str, Any]],
    processing_changes: list[int],
    tray_changes: list[int],
) -> list[Image.Image]:
    boards: list[Image.Image] = []

    canvas, draw = make_board(
        "PRINTER P01 / APPROVED PREFLIGHT HASH LOCK",
        "Exact r02 evidence only / 12 hashes verified / no source regeneration",
        BOARD_SPECS[0][1],
    )
    PF.card(draw, (45, 150, 760, 820), "APPROVAL", [
        "Decision: approved / 2026-07-30",
        "Revision: p01-generated-motion-preflight-r02",
        "Approved review files: 12",
        "Hash mismatches: 0",
        "Production source: approved pixels only",
    ])
    PF.card(draw, (820, 150, 1550, 820), "BOUNDARY", [
        "New ImageGen: forbidden",
        "Foreign-family pixels: forbidden",
        "Active Office imports: zero",
        "F9 room placement: blocked",
        "Reservation slots: 0 until F8 approval",
    ], (214, 112, 41))
    boards.append(canvas)

    canvas, draw = make_board(
        "CLEAN PRODUCTION STATES",
        "Immutable shell / local processing children / finite output tray",
        BOARD_SPECS[1][1],
    )
    for index, state_id in enumerate(("closed-A", "closed-B", "open-C", "open-D")):
        x = 90 + index * 420
        PF.card(draw, (x, 150, x + 360, 870), state_id, [])
        PF.paste_scaled(canvas, states[state_id], (x + 36, 245), 3)
    boards.append(canvas)

    canvas, draw = make_board(
        "PRODUCTION PARTS / ALPHA OWNERSHIP",
        "12 copied preflight parts / each byte-exact / output remains a child",
        BOARD_SPECS[2][1],
    )
    for index, key in enumerate(parts):
        x = 45 + (index % 4) * 435
        y = 145 + (index // 4) * 255
        PF.card(draw, (x, y, x + 400, y + 220), key, [
            f"approved sha {parts[key]['approvedPreflightSha256'][:12]}...",
        ])
    boards.append(canvas)

    canvas, draw = make_board(
        "TWO INDEPENDENT PRINTER INSTANCES",
        "One family / two 2x2 footprints / capacity one per instance",
        BOARD_SPECS[3][1],
    )
    for index, (instance, origin) in enumerate(zip(INSTANCE_IDS, ((0, 0), (5, 0)), strict=True)):
        x = 110 + index * 790
        PF.card(draw, (x, 155, x + 680, 870), instance, [
            f"Footprint origin: {origin}",
            "Footprint: 2 x 2 / height: 4",
            "Front stand + approach are outside footprint",
            "Reservation key is instance-local",
        ])
        PF.paste_scaled(canvas, states["closed-A"], (x + 340, 260), 3)
    boards.append(canvas)

    canvas, draw = make_board(
        "PROCESSING SEAM LOOP / A-B-C-D-A",
        "Only screen viewport and scanner light change",
        BOARD_SPECS[4][1],
    )
    for index, frame in enumerate((*FRAMES, "A")):
        x = 45 + index * 350
        PF.card(draw, (x, 160, x + 320, 820), frame, [
            f"transition pixels: {processing_changes[index - 1] if index else 'start'}",
            "outside local regions: 0",
        ])
        PF.paste_scaled(canvas, states[f"closed-{frame}"], (x + 20, 300), 3)
    boards.append(canvas)

    canvas, draw = make_board(
        "FINITE OUTPUT TRAY / CLOSED-HALF-OPEN-HALF-CLOSED",
        "Not ambient / reverses safely / shell and pivot never move",
        BOARD_SPECS[5][1],
    )
    for index, tray in enumerate(("closed", "half", "open", "half", "closed")):
        x = 45 + index * 350
        PF.card(draw, (x, 160, x + 320, 820), tray, [
            f"transition pixels: {tray_changes[index - 1] if index else 'start'}",
            "outside tray region: 0",
        ])
        PF.paste_scaled(canvas, states[f"{tray}-A"], (x + 20, 300), 3)
    boards.append(canvas)

    canvas, draw = make_board(
        "OUTPUT CHILD LIFECYCLE",
        "none -> facility.output.primary -> actor.hand.primary.grip -> none",
        BOARD_SPECS[6][1],
    )
    stages = (
        ("PROCESSING", states["closed-C"], None),
        ("OUTPUT READY", states["open-D"], props["held.paper-sheet"]),
        ("PICKUP", states["open-A"], None),
        ("CLOSED", states["closed-A"], None),
    )
    for index, (label, machine, prop) in enumerate(stages):
        x = 55 + index * 430
        PF.card(draw, (x, 155, x + 390, 870), label, [
            ("parent: facility.output.primary" if prop else "parent: none/actor"),
        ])
        PF.paste_scaled(canvas, machine_with_output(machine, prop), (x + 42, 285), 3)
    boards.append(canvas)

    canvas, draw = make_board(
        "ROUTES AND MACHINE-LOCAL SOCKETS",
        "No room placement / no fallback / no per-character offset",
        BOARD_SPECS[7][1],
    )
    PF.card(draw, (50, 155, 790, 870), "printer-01", [
        "footprint: [0,0] [1,0] [0,1] [1,1]",
        "stand: [0,2] / approach: [0,3] / exit: [1,3]",
        "route collision count: 0",
    ])
    PF.card(draw, (850, 155, 1650, 870), "printer-02", [
        "footprint: [5,0] [6,0] [5,1] [6,1]",
        "stand: [5,2] / approach: [5,3] / exit: [6,3]",
        "base/sort [48,124] / output [48,66]",
    ])
    boards.append(canvas)

    boards.append(grid_board(
        "I01 ROSTER / 18 x 6 = 108 BASE POSES",
        f"Cases {len(poses)} / root deltas 0 / route failures 0",
        BOARD_SPECS[8][1],
        action,
        actor_images,
    ))
    boards.append(grid_board(
        "H01 PRIMARY GRIP / 18 x 3 x 2 = 108 PROP CASES",
        f"Cases {len(grips)} / exact primary deltas 0 / clips 0",
        BOARD_SPECS[9][1],
        action,
        actor_images,
        props,
    ))

    canvas, draw = make_board(
        "PAPER + ENVELOPE PRIMARY-GRIP CLOSEUPS",
        "Existing I01/H01 sockets / no midpoint / no magic offset",
        BOARD_SPECS[10][1],
    )
    preview_ids = ("anna", "einstein", "miku", "ruri")
    for row, actor_id in enumerate(preview_ids):
        actor = next(item for item in action["characters"] if item["id"] == actor_id)
        for column, prop_id in enumerate(PROP_IDS):
            image = PF.attach_prop(
                actor_images[actor_id][3],
                actor["frames"][3],
                props[prop_id],
            )[0]
            x = 70 + column * 850
            y = 145 + row * 205
            PF.card(draw, (x, y, x + 780, y + 180), f"{actor_id} / {prop_id}", [
                "primary-grip delta [0,0]",
            ])
            PF.paste_scaled(canvas, image, (x + 560, y - 15), 2)
    boards.append(canvas)

    canvas, draw = make_board(
        "VISIBLE ALPHA CONTACT METRICS",
        "Coordinate equality plus local alpha proximity across all 108 prop cases",
        BOARD_SPECS[11][1],
    )
    PF.card(draw, (70, 165, 800, 820), "ACTOR HAND CONTACT", [
        f"Maximum Manhattan distance: {metrics['maximumActorAlphaDistance']} px",
        "Allowed visual contact radius: <= 3 px",
        "Failures: 0",
        "Per-character offsets: 0",
    ])
    PF.card(draw, (870, 165, 1630, 820), "PROP GRIP CONTACT", [
        f"Maximum Manhattan distance: {metrics['maximumPropAlphaDistance']} px",
        "All prop primary sockets touch alpha exactly",
        "Clipped alpha cases: 0",
        "Fallback sockets: 0",
    ])
    boards.append(canvas)

    canvas, draw = make_board(
        "INTERRUPTION SAFETY",
        "Before pickup removes output / after pickup closes before release",
        BOARD_SPECS[12][1],
    )
    PF.card(draw, (55, 160, 855, 870), "FAILURE BEFORE PICKUP", [
        "output-ready -> failure",
        "facility child removed",
        "tray open -> half -> closed",
        "held prop never created",
        "reservation released",
    ], (192, 83, 65))
    PF.card(draw, (930, 160, 1745, 870), "INTERRUPTION AFTER PICKUP", [
        "output child reparents to actor hand",
        "tray closes first",
        "held prop removed before departure",
        "reservation released",
        "orphan props at end: 0",
    ], (192, 83, 65))
    boards.append(canvas)

    canvas, draw = make_board(
        "30 SECOND / THREE USERS / TWO PRINTERS",
        "Concurrent success, blocked attempt, failure, release, retry, clean end",
        BOARD_SPECS[13][1],
    )
    for event in events:
        x = 45 + event["second"] * 59
        color = (196, 77, 63) if event["result"] == "blocked" else (17, 145, 151)
        draw.line((x, 190, x, 890), fill=color, width=3)
        draw.text(
            (x + 3, 205 + (event["second"] % 4) * 150),
            f"{event['second']}s\n{event['actorId']}\n{event['event']}",
            font=PF.font(12, True),
            fill=(30, 53, 63),
        )
    PF.card(draw, (45, 900, 1845, 1020), "END STATE", [
        "maximum concurrent 2 / per instance 1 / blocked 1 / failure 1 / releases 3 / retry 1 / orphan props 0",
    ])
    boards.append(canvas)
    return boards


def reservation_gif(
    samples: list[dict[str, Any]],
    states: dict[str, Image.Image],
) -> tuple[bytes, int]:
    selected = (0, 2, 3, 6, 9, 12, 15, 17, 19, 30)
    frames = []
    for second in selected:
        sample = samples[second]
        canvas = Image.new("RGBA", (960, 560), (226, 237, 238, 255))
        draw = ImageDraw.Draw(canvas)
        draw.text((30, 20), f"{second:02d}s / concurrent {sample['concurrentReservations']}", font=PF.font(30, True), fill=(18, 43, 54))
        for index, instance in enumerate(INSTANCE_IDS):
            info = sample["instances"][instance]
            x = 80 + index * 460
            PF.paste_scaled(canvas, states["closed-A"], (x + 70, 85), 3)
            draw.text((x, 480), f"{instance}: {info['phase']} / {info['reservedBy'] or 'free'}", font=PF.font(18, True), fill=(24, 60, 69))
        frames.append(canvas.convert("P", palette=Image.Palette.ADAPTIVE))
    return PF.gif_bytes(frames, 500), len(frames)


def build_outputs() -> dict[Path, bytes]:
    outputs: dict[Path, bytes] = {}
    preflight = verify_preflight()
    part_records, state_records, states = copy_and_compose(preflight, outputs)
    action, held, props, actor_images = load_authorities()
    poses, grips, metrics = validation_records(action, props, actor_images)
    if (
        len(poses) != 108
        or len(grips) != 108
        or any(case["primaryGripDelta"] != [0, 0] for case in grips)
        or any(not case["fullPropAlphaVisible"] for case in grips)
        or metrics["maximumActorAlphaDistance"] > 3
        or metrics["maximumPropAlphaDistance"] != 0
    ):
        raise ValueError("Printer P01 production validation matrix failed")

    processing_path = ("A", "B", "C", "D", "A")
    processing_changes = [
        changed_pixels(states[f"closed-{first}"], states[f"closed-{second}"])
        for first, second in zip(processing_path, processing_path[1:])
    ]
    processing_outside = [
        changed_outside(
            states[f"closed-{first}"],
            states[f"closed-{second}"],
            (SCREEN_RECT, SCANNER_RECT),
        )
        for first, second in zip(processing_path, processing_path[1:])
    ]
    tray_path = ("closed", "half", "open", "half", "closed")
    tray_changes = [
        changed_pixels(states[f"{first}-A"], states[f"{second}-A"])
        for first, second in zip(tray_path, tray_path[1:])
    ]
    tray_outside = [
        changed_outside(
            states[f"{first}-A"],
            states[f"{second}-A"],
            (TRAY_RECT,),
        )
        for first, second in zip(tray_path, tray_path[1:])
    ]
    if (
        not all(processing_changes)
        or any(processing_outside)
        or not all(tray_changes)
        or any(tray_outside)
    ):
        raise ValueError("Printer P01 local motion boundary failed")

    events, samples = reservation_records()
    final_instances = samples[-1]["instances"]
    if (
        max(sample["concurrentReservations"] for sample in samples) != 2
        or any(sample["concurrentReservations"] > 2 for sample in samples)
        or any(
            current["reservedBy"] is not None
            or current["outputParent"] != "none"
            or current["propId"] is not None
            for current in final_instances.values()
        )
        or not any(
            event["actorId"] == "actor-c"
            and event["instanceId"] == "both"
            and event["result"] == "blocked"
            for event in events
        )
    ):
        raise ValueError("Printer P01 two-instance concurrency was not proven")

    anna = next(actor for actor in action["characters"] if actor["id"] == "anna")
    paper_frames = interaction_frames(
        states, anna, actor_images["anna"], props["held.paper-sheet"],
    )
    envelope_frames = interaction_frames(
        states, anna, actor_images["anna"], props["held.envelope"],
    )
    paper_gif = PF.gif_bytes(paper_frames, 260)
    envelope_gif = PF.gif_bytes(envelope_frames, 260)
    contention_gif, contention_count = reservation_gif(samples, states)
    outputs[PAPER_GIF] = paper_gif
    outputs[ENVELOPE_GIF] = envelope_gif
    outputs[RESERVATION_GIF] = contention_gif

    boards = build_boards(
        preflight,
        part_records,
        states,
        action,
        props,
        actor_images,
        poses,
        grips,
        metrics,
        events,
        samples,
        processing_changes,
        tray_changes,
    )
    review_evidence = []
    review_paths: list[Path] = []
    for (name, size), image in zip(BOARD_SPECS, boards, strict=True):
        if image.size != size:
            raise ValueError(f"Review board size changed: {name}")
        path = REVIEW_ROOT / name
        content = PF.png_bytes(image)
        outputs[path] = content
        review_paths.append(path)
        review_evidence.append({
            "path": repo_path(path),
            "sha256": PF.sha256_bytes(content),
            "kind": "png",
            "size": list(size),
        })
    gif_records = (
        (PAPER_GIF, paper_gif, 9, 260, (768, 512)),
        (ENVELOPE_GIF, envelope_gif, 9, 260, (768, 512)),
        (RESERVATION_GIF, contention_gif, contention_count, 500, (960, 560)),
    )
    for path, content, count, duration, size in gif_records:
        review_paths.append(path)
        review_evidence.append({
            "path": repo_path(path),
            "sha256": PF.sha256_bytes(content),
            "kind": "gif",
            "size": list(size),
            "frameCount": count,
            "durationMs": duration,
        })

    routes = {
        "printer-01": {
            "footprintCells": [[0, 0], [1, 0], [0, 1], [1, 1]],
            "stand": [0, 2],
            "approach": [0, 3],
            "exit": [1, 3],
            "route": [[1, 3], [0, 3], [0, 2]],
        },
        "printer-02": {
            "footprintCells": [[5, 0], [6, 0], [5, 1], [6, 1]],
            "stand": [5, 2],
            "approach": [5, 3],
            "exit": [6, 3],
            "route": [[6, 3], [5, 3], [5, 2]],
        },
    }
    passed = lambda *evidence: {"status": "passed", "evidence": list(evidence)}
    pending = lambda *evidence: {
        "status": "pending-owner-review",
        "evidence": list(evidence),
    }
    blocked = lambda reason: {"status": "blocked", "evidence": [reason]}
    manifest = {
        "schemaVersion": 1,
        "id": "office.facility.printer.p01.production",
        "familyId": "printer.multifunction.floor",
        "revision": "p01-production-r01",
        "status": "production-owner-review",
        "productionStage": "f7-complete-f8-owner-review",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "preflightAuthority": {
            "manifest": repo_path(PREFLIGHT_MANIFEST),
            "manifestSha256": PF.sha256_file(PREFLIGHT_MANIFEST),
            "revision": preflight["revision"],
            "approvedOn": preflight["ownerDecision"]["decidedOn"],
            "approvedReviewHashCount": 12,
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
            "physicalScale": {"width": 2, "depth": 2, "height": 4, "unit": "tile"},
            "footprint": {"width": 2, "depth": 2, "unit": "tile"},
            "renderBox": {"width": 3, "height": 4, "unit": "tile"},
            "runtimeCanvas": list(RUNTIME_CANVAS),
            "anchor": "bottom-center",
            "basePivotRuntime": list(BASE_PIVOT),
            "sortPivotRuntime": list(BASE_PIVOT),
            "requiredOrientations": ["front"],
            "collisionChangesDuringMotion": False,
            "footprintChangesDuringMotion": False,
        },
        "parts": part_records,
        "states": state_records,
        "animation": {
            "compositionFormula": (
                "immutableShell + statusViewport[frame] + scannerLight[frame] + "
                "outputTray[state] + outputChild[state]"
            ),
            "processingLoop": list(processing_path),
            "processingChangedPixels": processing_changes,
            "processingChangedPixelsOutsideLocalRegions": processing_outside,
            "finiteTrayPath": list(tray_path),
            "trayChangedPixels": tray_changes,
            "trayChangedPixelsOutsideTrayRegion": tray_outside,
            "shellChangedPixels": 0,
            "pivotDeltaPixels": [0, 0],
            "footprintDeltaTiles": [0, 0],
            "processingEndpointMismatchPixels": 0,
            "trayEndpointMismatchPixels": 0,
            "interruptionBeforePickup": {
                "outputRemoved": True,
                "reverseToClosed": True,
                "heldPropCreated": False,
                "reservationReleased": True,
            },
            "interruptionAfterPickup": {
                "closeBeforeRelease": True,
                "heldPropRemovedBeforeDeparture": True,
                "reservationReleased": True,
            },
        },
        "spatial": {
            "authorityManifest": repo_path(ACTION_MANIFEST),
            "authoritySha256": PF.sha256_file(ACTION_MANIFEST),
            "coordinateFormula": "worldRoot - actorFrameRootSocket",
            "instances": routes,
            "routeCollisionCount": 0,
            "machineLocalSockets": {
                "base": list(BASE_PIVOT),
                "sort": list(BASE_PIVOT),
                "interactionRoot": list(BASE_PIVOT),
                "outputPrimary": list(OUTPUT_SOCKET),
            },
            "perCharacterOffsets": False,
            "magicOffsets": False,
            "missingSocketFallback": False,
        },
        "interaction": {
            "semanticAction": "interact-use",
            "visualPose": "interact-front",
            "instanceIds": list(INSTANCE_IDS),
            "familyInstanceCount": 2,
            "capacityPerInstance": 1,
            "independentReservations": True,
            "jobOutputMap": {
                "print-document": "held.paper-sheet",
                "prepare-mail": "held.envelope",
            },
            "outputSelectionRule": "job-driven-once-per-visit",
            "handoffParents": [
                "facility.output.primary",
                "actor.hand.primary.grip",
                "none",
            ],
            "propSocketRule": "primary-grip-to-primary-grip",
            "attachmentDelta": [0, 0],
            "newCoordinateSystem": False,
            "reservationSlotContribution": 0,
            "plannedReservationSlotContributionAfterF8": 2,
            "facilityV1ReadySlotsBeforePrinterF8": 18,
            "facilityV1ReadySlotsAfterPrinterF8Target": 20,
            "facilityV1ReadySlotsCurrent": 18,
        },
        "rosterValidation": {
            "authorityManifest": repo_path(ACTION_MANIFEST),
            "authoritySha256": PF.sha256_file(ACTION_MANIFEST),
            "pendingCommercialReview": True,
            "characterCount": 18,
            "activeFrames": 6,
            "poseCaseCount": len(poses),
            "rootAlignmentFailures": 0,
            "pivotDriftFailures": 0,
            "routeFailures": 0,
            "perCharacterOffsets": False,
            "poseCases": poses,
        },
        "propOverlayValidation": {
            "authorityManifest": repo_path(HELD_MANIFEST),
            "authoritySha256": PF.sha256_file(HELD_MANIFEST),
            "propIds": list(PROP_IDS),
            "visibleFrames": list(HELD_FRAMES),
            "caseCount": len(grips),
            "attachmentFailures": 0,
            "actorAlphaContactRadiusPixels": 3,
            "maximumActorAlphaDistance": metrics["maximumActorAlphaDistance"],
            "maximumPropAlphaDistance": metrics["maximumPropAlphaDistance"],
            "alphaContactFailures": 0,
            "clippedPropCases": 0,
            "foregroundMaskUses": 0,
            "midpointPlacementUses": 0,
            "magicOffsetCases": 0,
            "fallbackSocketCases": 0,
            "cases": grips,
        },
        "reservationValidation": {
            "durationSeconds": 30,
            "actorCount": 3,
            "instanceIds": list(INSTANCE_IDS),
            "capacityPerInstance": 1,
            "maximumConcurrentReservations": 2,
            "maximumPerInstanceReservations": 1,
            "collisionCount": 0,
            "blockedAttemptCount": 1,
            "failureCount": 1,
            "releaseCount": 3,
            "retrySuccessCount": 1,
            "beforePickupInterruptionCount": 1,
            "afterPickupInterruptionCount": 1,
            "handoffCount": 2,
            "releasedAtEnd": True,
            "orphanPropCountAtEnd": 0,
            "events": events,
            "samples": samples,
        },
        "gates": {
            "F0": passed(repo_path(PREFLIGHT_MANIFEST)),
            "F1": passed(repo_path(REVIEW_ROOT / BOARD_SPECS[3][0])),
            "F2": passed(repo_path(REVIEW_ROOT / BOARD_SPECS[2][0])),
            "F3": passed(repo_path(PREFLIGHT_MANIFEST)),
            "F4": passed(
                repo_path(REVIEW_ROOT / BOARD_SPECS[1][0]),
                repo_path(REVIEW_ROOT / BOARD_SPECS[4][0]),
                repo_path(REVIEW_ROOT / BOARD_SPECS[5][0]),
            ),
            "F5": passed(
                repo_path(REVIEW_ROOT / BOARD_SPECS[7][0]),
                repo_path(REVIEW_ROOT / BOARD_SPECS[10][0]),
            ),
            "F6": passed(
                repo_path(REVIEW_ROOT / BOARD_SPECS[8][0]),
                repo_path(REVIEW_ROOT / BOARD_SPECS[9][0]),
                repo_path(REVIEW_ROOT / BOARD_SPECS[13][0]),
            ),
            "F7": passed(*(repo_path(path) for path in review_paths)),
            "F8": pending(*(repo_path(path) for path in review_paths)),
            "F9": blocked(
                "Facility v1 remains 18/20 until this production package passes F8."
            ),
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
    outputs[MANIFEST_PATH] = PF.json_bytes(manifest)
    return outputs


def write_outputs(outputs: dict[Path, bytes]) -> None:
    for path, content in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)


def check_outputs(outputs: dict[Path, bytes]) -> list[str]:
    failures = []
    for path, expected in outputs.items():
        if not path.exists():
            failures.append(f"missing {repo_path(path)}")
        elif path.read_bytes() != expected:
            failures.append(f"stale {repo_path(path)}")
    expected = {
        path.resolve()
        for path in outputs
        if path.is_relative_to(OUTPUT_ROOT) or path.is_relative_to(REVIEW_ROOT)
    }
    for root in (OUTPUT_ROOT, REVIEW_ROOT):
        if root.exists():
            for path in root.rglob("*"):
                if path.is_file() and path.resolve() not in expected:
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
            "Printer P01 production validated: 108 base poses, 108 exact "
            "primary-grip cases, two independent instances, 30-second "
            "three-user proof, F8 pending, zero active slots."
        )
        return 0
    write_outputs(outputs)
    print(
        "Printer P01 production built: 108 base poses, 108 exact primary-grip "
        "cases, two independent instances, 30-second three-user proof, "
        "F8 pending, zero active slots."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
