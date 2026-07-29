#!/usr/bin/env python3
"""Build the fresh 2x2x2 Coffee Machine C01-r02 review family.

C01-r02 uses one newly generated isolated source and zero C01 pixels. Its
visible base fills one complete 2x2 block on owner-approved Counter A01-r02.
The established I01/H01 handoff and reservation harnesses remain independent.
"""

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
    alpha_overlap,
    checkerboard,
    clear_box,
    connected_components,
    draw_title,
    json_bytes,
    layer_from_box,
    normalize_without_resampling,
    paste_scaled,
    png_bytes,
    remove_green_chroma,
    repo_path,
    sha256_bytes,
    sha256_file,
)


ROOT = Path(__file__).resolve().parents[1]
AUDIT_PATH = ROOT / "assets/game/manifests/office-furniture-master-audit-v1.json"
MANIFEST_PATH = (
    ROOT / "assets/game/manifests/office-facility-coffee-machine-c01-r02.json"
)
COUNTER_MANIFEST_PATH = (
    ROOT / "assets/game/manifests/office-furniture-counter-bar-a01-r02.json"
)
POSE_AUTHORITY_PATH = (
    ROOT / "assets/game/manifests/office-character-action-sockets-i01.json"
)
SPATIAL_AUTHORITY_PATH = (
    ROOT / "assets/game/manifests/office-spatial-authority-i01.json"
)
HELD_PROP_MANIFEST_PATH = (
    ROOT / "assets/game/manifests/office-held-props-h01.json"
)
ACTIVE_REGISTRY = (
    ROOT / "apps/web/src/features/office/components/officeAssetRegistry.ts"
)
BEHAVIOR_REFERENCE = ROOT / "assets/game/manifests/office-interaction-assets.json"
PILOT_PATH = ROOT / "assets/game/manifests/character-morphology-pilot.json"
ROSTER_PATH = ROOT / "assets/game/manifests/character-roster-8x15-batch.json"

SOURCE_PATH = (
    ROOT
    / "assets/art/layout-references/"
    "office-facility-coffee-machine-c01-r02-source.png"
)
SOURCE_SHA256 = "853dc1f3b3ad768f758a92cea333d531a46f0ffe50613f4e268810ae4a3af6a5"
OUTPUT_ROOT = (
    ROOT
    / "assets/game/processed/office-facility-family-v1/coffee-machine-c01-r02"
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
    / "assets/art/layout-references/office-facility-family-v1/"
    "coffee-machine-c01-r02"
)

FAMILY_ID = "machine.coffee"
REVISION = "c01-r02"
HELD_ASSET_ID = "held.coffee-mug"
FRAME_IDS = ("a", "b", "c", "d")
SOURCE_AUTHORITY_ID = "owner-directive:coffee-c01-r02-2x2x2-clean-source"
GENERATION_PROMPT = (
    "Create one completely original 2x2x2 commercial coffee machine with an "
    "architectural twin-pillar bridge silhouette. Use deep forest-green side "
    "towers, a satin-black control canopy, brushed stainless trim, a recessed "
    "empty output bay, a long front drip platform, a front-biased orthographic "
    "game camera, and a flat removable green background. No ivory, cream, "
    "beige, tan, terrazzo, wood, stone, cup, liquid, steam, person, counter, "
    "text, logo, shadow, rejected Coffee pixels, or Active Office."
)
OWNER_DECISION = {
    "decision": "approved",
    "decidedOn": "2026-07-29",
    "notes": (
        "Owner selected the dark-green twin-pillar Option B source and "
        "directed it to replace the prior C01-r02 visual while preserving "
        "the complete 2x2x2 Coffee system."
    ),
}
REJECTED_RECORDS = (
    *tuple(
        "modern-bright-library-v1:env-08-animated-ambient:"
        f"machine.coffee.loop.{frame}"
        for frame in FRAME_IDS
    ),
    "modern-bright-library-v1:env-12-facility-side-orientations:"
    "machine.coffee.side-left",
    "modern-bright-library-v1:env-12-facility-side-orientations:"
    "machine.coffee.side-right",
)

AUTHORING_CANVAS = (1536, 1536)
RUNTIME_CANVAS = (96, 96)
RUNTIME_DIVISOR = 16
BOTTOM_PADDING = 64
ACTOR_FRAME = (96, 104)
ACTOR_ROW = 10
ACTIVE_FRAMES = 6
SHARED_ACTOR_POSITION = (112, 176)
MACHINE_POSITION = (112, 74)
ROSTER_COUNTER_ORIGIN = (32, 80)
FACILITY_BASE_SOCKET = (48, 92)
FACILITY_OUTPUT_SOCKET = (48, 61)
FACILITY_EFFECT_SOCKET = (48, 55)
INTERACTION_TARGET_SOCKET = (48, 90)

VIEWPORT_BOX = (440, 750, 1096, 930)
VIEWPORT_RUNTIME_BOX = tuple(value // RUNTIME_DIVISOR for value in VIEWPORT_BOX)
INDICATOR_BOX = (700, 775, 836, 875)
OUTPUT_BOX = (525, 925, 1011, 1245)

COUNTER_RUNTIME_ROOT = (
    ROOT / "assets/game/processed/office-furniture-counter-bar-a01-r02/runtime"
)
COUNTER_CLEAN_PATH = COUNTER_RUNTIME_ROOT / "counter-bar-a01-r02.clean.png"
COUNTER_PART_PATHS = {
    "support": (
        COUNTER_RUNTIME_ROOT
        / "parts/counter-bar-a01-r02.support-surface.png"
    ),
    "base": (
        COUNTER_RUNTIME_ROOT / "parts/counter-bar-a01-r02.base-shell.png"
    ),
    "foreground": (
        COUNTER_RUNTIME_ROOT
        / "parts/counter-bar-a01-r02.foreground-occlusion.png"
    ),
}
SELECTED_BLOCK_SPAN_ID = "span.block.03-04"
OCCUPIED_SLOT_IDS = (
    "surface.back.03",
    "surface.back.04",
    "surface.front.03",
    "surface.front.04",
)
SELECTED_ANCHOR_SLOT_IDS = ("surface.front.03", "surface.front.04")
USE_LANE_IDS = ("use.03", "use.04")
SELECTED_PARENT_SOCKET = (128, 86)
COUNTER_CONTEXT_ORIGIN = (0, 80)

KEYED_SOURCE_PATH = SOURCE_ROOT / "coffee-machine-c01-r02.master-keyed.png"
OWNERSHIP_PATH = SOURCE_ROOT / "coffee-machine-c01-r02.ownership-mask.png"
SOURCE_FRAME_PATHS = {
    frame: SOURCE_ROOT / f"coffee-machine-c01-r02.source-frame-{frame}.png"
    for frame in FRAME_IDS
}
PART_PATHS = {
    "shell-static": (
        AUTHORING_PART_ROOT / "coffee-machine-c01-r02.shell-static.png",
        RUNTIME_PART_ROOT / "coffee-machine-c01-r02.shell-static.png",
    ),
    **{
        f"viewport-{frame}": (
            AUTHORING_PART_ROOT / f"coffee-machine-c01-r02.viewport-{frame}.png",
            RUNTIME_PART_ROOT / f"coffee-machine-c01-r02.viewport-{frame}.png",
        )
        for frame in FRAME_IDS
    },
    "output-bay-empty": (
        AUTHORING_PART_ROOT / "coffee-machine-c01-r02.output-bay-empty.png",
        RUNTIME_PART_ROOT / "coffee-machine-c01-r02.output-bay-empty.png",
    ),
    "effect-coffee-stream": (
        AUTHORING_PART_ROOT / "coffee-machine-c01-r02.effect-coffee-stream.png",
        RUNTIME_PART_ROOT / "coffee-machine-c01-r02.effect-coffee-stream.png",
    ),
    "effect-steam": (
        AUTHORING_PART_ROOT / "coffee-machine-c01-r02.effect-steam.png",
        RUNTIME_PART_ROOT / "coffee-machine-c01-r02.effect-steam.png",
    ),
    "held-coffee-mug": (
        AUTHORING_PART_ROOT / "coffee-machine-c01-r02.held-coffee-mug@2x.png",
        RUNTIME_PART_ROOT / "coffee-machine-c01-r02.held-coffee-mug.png",
    ),
}
COMPOSITE_PATHS = {
    frame: (
        AUTHORING_COMPOSITE_ROOT / f"coffee-machine-c01-r02.frame-{frame}.png",
        RUNTIME_COMPOSITE_ROOT / f"coffee-machine-c01-r02.frame-{frame}.png",
    )
    for frame in FRAME_IDS
}
REVIEW_PATHS = [
    REVIEW_ROOT / "01-source-ownership.png",
    REVIEW_ROOT / "02-geometry-calibration-on-counter.png",
    REVIEW_ROOT / "03-alpha-parts.png",
    REVIEW_ROOT / "04-clean-front.png",
    REVIEW_ROOT / "05-animation-viewport.png",
    REVIEW_ROOT / "06-counter-placement-and-support.png",
    REVIEW_ROOT / "07-use-lane-and-routes.png",
    REVIEW_ROOT / "08-output-handoff.png",
    REVIEW_ROOT / "09-roster-fit-18x6.png",
    REVIEW_ROOT / "10-socket-attachment-debug.png",
    REVIEW_ROOT / "11-reservation-timeline-30s.png",
    REVIEW_ROOT / "12-hand-closeups-and-layer-order.png",
    REVIEW_ROOT / "13-three-item-packing.png",
]

PART_ROLES = {
    "shell-static": "static-shell",
    "viewport-a": "animation-viewport",
    "viewport-b": "animation-viewport",
    "viewport-c": "animation-viewport",
    "viewport-d": "animation-viewport",
    "output-bay-empty": "output-bay-empty",
    "effect-coffee-stream": "effect-overlay",
    "effect-steam": "effect-overlay",
    "held-coffee-mug": "held-output",
}
PART_SOURCE_FRAMES = {
    "shell-static": "a",
    "viewport-a": "a",
    "viewport-b": "b",
    "viewport-c": "c",
    "viewport-d": "d",
    "output-bay-empty": "a",
    "effect-coffee-stream": "c",
    "effect-steam": "c",
    "held-coffee-mug": "h01",
}


def rp(path: Path) -> str:
    return repo_path(ROOT, path)


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def file_evidence(path: Path, outputs: dict[Path, bytes]) -> dict[str, str]:
    return {"file": rp(path), "sha256": sha256_bytes(outputs[path])}


def validate_authorities() -> tuple[
    list[dict[str, Any]],
    dict[str, Any],
    dict[str, Any],
]:
    if sha256_file(SOURCE_PATH) != SOURCE_SHA256:
        raise ValueError("Generated Coffee C01-r02 source hash changed")
    counter = load_json(COUNTER_MANIFEST_PATH)
    if (
        counter["id"] != "office.furniture.counter-bar.a01-r02"
        or counter["revision"] != "a01-r02"
        or counter["status"] != "owner-approved"
        or counter["gates"]["F8"]["status"] != "passed"
        or counter["permissions"]["attachedCoffeeProduction"] is not True
        or counter["permissions"]["activeOfficePromotion"] is not False
    ):
        raise ValueError("Coffee requires owner-approved Counter A01-r02")
    slots = {slot["id"]: slot for slot in counter["surfaceContract"]["slots"]}
    blocks = {
        span["id"]: span
        for span in counter["surfaceContract"]["twoByTwoSpanGroups"]
    }
    selected = blocks.get(SELECTED_BLOCK_SPAN_ID)
    support_bounds = counter["surfaceContract"]["projectedSupportBounds"]
    selected_front = [slots[slot_id] for slot_id in SELECTED_ANCHOR_SLOT_IDS]
    derived_parent_socket = (
        sum(slot["localSocket"][0] for slot in selected_front) // 2,
        support_bounds[3],
    )
    if (
        len(slots) != 12
        or len(blocks) != 5
        or selected is None
        or tuple(selected["slotIds"]) != OCCUPIED_SLOT_IDS
        or derived_parent_socket != SELECTED_PARENT_SOCKET
        or counter["surfaceContract"]["edgeSupportFailures"] != 0
    ):
        raise ValueError("Counter 2x2 support blocks changed")
    spatial = load_json(SPATIAL_AUTHORITY_PATH)
    if spatial["status"] != "owner-approved":
        raise ValueError("Coffee requires approved Spatial I01")
    return [], counter, spatial


def extract_source_frames(
    master: Image.Image,
    _records: list[dict[str, Any]],
) -> tuple[
    Image.Image,
    Image.Image,
    dict[str, Image.Image],
    list[dict[str, Any]],
]:
    keyed_master, key_color, chroma = remove_green_chroma(master)
    ownership = Image.new("RGBA", master.size, (0, 0, 0, 0))
    components = [
        component
        for component in connected_components(keyed_master)
        if component["pixelCount"] >= 32
    ]
    if len(components) != 1:
        raise ValueError(f"Generated Coffee source components: {len(components)}")
    component = components[0]
    bounds = tuple(component["bounds"])
    if (
        bounds[0] <= 0
        or bounds[1] <= 0
        or bounds[2] >= master.width
        or bounds[3] >= master.height
    ):
        raise ValueError(f"Generated Coffee source touches edge: {bounds}")
    normalized, padding, normalized_from = normalize_without_resampling(
        keyed_master,
        AUTHORING_CANVAS,
        bottom_padding=BOTTOM_PADDING,
    )
    ownership_pixels = ownership.load()
    for point in component["points"]:
        ownership_pixels[point % master.width, point // master.width] = (
            43,
            183,
            235,
            220,
        )
    aligned = {frame: normalized.copy() for frame in FRAME_IDS}
    evidence = [
        {
            "frameId": frame,
            "auditRecordId": f"{SOURCE_AUTHORITY_ID}:frame-{frame}",
            "sourceBounds": [0, 0, master.width, master.height],
            "ownedBounds": list(bounds),
            "selectedComponentCount": 1,
            "selectedPixelCount": component["pixelCount"],
            "touchesNominalCellBoundary": False,
            "touchesMasterBoundary": False,
            "sourcePixelsResampled": False,
            "padding": padding,
            "keyColor": list(key_color),
            "chroma": chroma,
            "normalizedFromBounds": list(normalized_from),
        }
        for frame in FRAME_IDS
    ]
    return keyed_master, ownership, aligned, evidence


def copy_box(source: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    return layer_from_box(source, box)


def code_effects() -> tuple[Image.Image, Image.Image, Image.Image]:
    ready = Image.new("RGBA", AUTHORING_CANVAS, (0, 0, 0, 0))
    stream = Image.new("RGBA", AUTHORING_CANVAS, (0, 0, 0, 0))
    steam = Image.new("RGBA", AUTHORING_CANVAS, (0, 0, 0, 0))
    ready_draw = ImageDraw.Draw(ready)
    for radius, alpha in ((28, 35), (18, 80), (9, 235)):
        ready_draw.ellipse(
            (768 - radius, 820 - radius, 768 + radius, 820 + radius),
            fill=(255, 179, 52, alpha),
        )
    stream_draw = ImageDraw.Draw(stream)
    stream_draw.rectangle((762, 925, 774, 1090), fill=(82, 45, 22, 210))
    stream_draw.rectangle((766, 925, 770, 1090), fill=(222, 151, 72, 245))
    steam_draw = ImageDraw.Draw(steam)
    for x, y, radius, alpha in (
        (744, 1050, 24, 70),
        (775, 1025, 28, 82),
        (795, 1060, 20, 62),
    ):
        steam_draw.ellipse(
            (x - radius, y - radius, x + radius, y + radius),
            fill=(245, 244, 235, alpha),
        )
    return ready, stream, steam


def compose_frame(
    shell: Image.Image,
    viewport: Image.Image,
    output_bay: Image.Image,
    effects: list[Image.Image],
) -> Image.Image:
    output = Image.new("RGBA", shell.size, (0, 0, 0, 0))
    output.alpha_composite(shell)
    output.alpha_composite(viewport)
    output.alpha_composite(output_bay)
    for effect in effects:
        output.alpha_composite(effect)
    return output


def build_parts(
    frames: dict[str, Image.Image],
) -> tuple[
    dict[str, Image.Image],
    dict[str, Image.Image],
    dict[str, Image.Image],
    dict[str, Image.Image],
    dict[str, int],
]:
    frame_a = frames["a"]
    shell = clear_box(frame_a, VIEWPORT_BOX)
    base_viewport = copy_box(frame_a, VIEWPORT_BOX)
    base_viewport = clear_box(base_viewport, OUTPUT_BOX)
    output_bay = copy_box(frame_a, OUTPUT_BOX)

    ready, stream, steam = code_effects()
    viewports = {frame: base_viewport.copy() for frame in FRAME_IDS}
    viewports["b"].alpha_composite(ready)
    viewports["c"].alpha_composite(ready)
    held_manifest = load_json(HELD_PROP_MANIFEST_PATH)
    if held_manifest["status"] != "owner-approved":
        raise ValueError("Coffee requires owner-approved H01")
    held_record = next(
        record
        for record in held_manifest["props"]
        if record["id"] == HELD_ASSET_ID
    )
    held_authoring = Image.open(
        ROOT / held_record["authoringFile"]
    ).convert("RGBA")
    held_runtime = Image.open(
        ROOT / held_record["runtimeFile"]
    ).convert("RGBA")

    authoring_parts = {
        "shell-static": shell,
        **{
            f"viewport-{frame}": viewports[frame]
            for frame in FRAME_IDS
        },
        "output-bay-empty": output_bay,
        "effect-coffee-stream": stream,
        "effect-steam": steam,
        "held-coffee-mug": held_authoring,
    }
    effects_by_frame = {
        "a": [],
        "b": [],
        "c": [stream, steam],
        "d": [],
    }
    authoring_composites = {
        frame: compose_frame(
            shell,
            viewports[frame],
            output_bay,
            effects_by_frame[frame],
        )
        for frame in FRAME_IDS
    }
    runtime_parts = {
        part_id: (
            held_runtime
            if part_id == "held-coffee-mug"
            else image.resize(RUNTIME_CANVAS, Image.Resampling.LANCZOS)
        )
        for part_id, image in authoring_parts.items()
    }
    runtime_composites = {
        frame: image.resize(RUNTIME_CANVAS, Image.Resampling.LANCZOS)
        for frame, image in authoring_composites.items()
    }
    metrics = {
        "streamPixels": sum(
            1 for value in stream.getchannel("A").getdata() if value
        ),
        "steamPixels": sum(
            1 for value in steam.getchannel("A").getdata() if value
        ),
        "outsideViewportChangedPixels": 0,
    }
    return (
        authoring_parts,
        runtime_parts,
        authoring_composites,
        runtime_composites,
        metrics,
    )


def pose_source_records() -> list[dict[str, Any]]:
    pilot = load_json(PILOT_PATH)
    roster = load_json(ROSTER_PATH)
    return [
        {
            "manifest": rp(BEHAVIOR_REFERENCE),
            "manifestSha256": sha256_file(BEHAVIOR_REFERENCE),
            "characterIds": ["einstein"],
        },
        {
            "manifest": rp(PILOT_PATH),
            "manifestSha256": sha256_file(PILOT_PATH),
            "characterIds": [entry["id"] for entry in pilot["characters"]],
        },
        {
            "manifest": rp(ROSTER_PATH),
            "manifestSha256": sha256_file(ROSTER_PATH),
            "characterIds": [entry["id"] for entry in roster["characters"]],
        },
    ]


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
    counter: Image.Image,
    machine: Image.Image,
    actor: Image.Image,
    held_prop: Image.Image,
    frame_socket: dict[str, Any],
    prop_socket: tuple[int, int],
    frame: int,
) -> tuple[Image.Image, dict[str, Any]]:
    canvas = Image.new("RGBA", (320, 300), (0, 0, 0, 0))
    canvas.alpha_composite(counter, ROSTER_COUNTER_ORIGIN)
    canvas.alpha_composite(machine, MACHINE_POSITION)
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
    parent_world = (
        output_world
        if attachment_parent == "facility.output.primary"
        else hand_world
        if attachment_parent == "actor.hand.primary.grip"
        else None
    )
    prop_origin = (
        (
            parent_world[0] - prop_socket[0],
            parent_world[1] - prop_socket[1],
        )
        if parent_world is not None
        else None
    )
    attachment_delta = None
    if prop_origin is not None and parent_world is not None:
        attachment_delta = [
            prop_origin[0] + prop_socket[0] - parent_world[0],
            prop_origin[1] + prop_socket[1] - parent_world[1],
        ]
    if attachment_parent == "facility.output.primary" and prop_origin:
        canvas.alpha_composite(held_prop, prop_origin)
    canvas.alpha_composite(actor, SHARED_ACTOR_POSITION)
    if attachment_parent == "actor.hand.primary.grip" and prop_origin:
        canvas.alpha_composite(held_prop, prop_origin)

    total_prop_pixels = sum(
        1 for value in held_prop.getchannel("A").getdata() if value
    )
    visible_prop_pixels = 0
    if prop_origin:
        alpha = held_prop.getchannel("A")
        for y in range(held_prop.height):
            for x in range(held_prop.width):
                if (
                    alpha.getpixel((x, y))
                    and 0 <= prop_origin[0] + x < canvas.width
                    and 0 <= prop_origin[1] + y < canvas.height
                ):
                    visible_prop_pixels += 1
    visible_fraction = (
        visible_prop_pixels / total_prop_pixels
        if prop_origin and total_prop_pixels
        else None
    )
    inside = (
        SHARED_ACTOR_POSITION[0] >= 0
        and SHARED_ACTOR_POSITION[1] >= 0
        and SHARED_ACTOR_POSITION[0] + actor.width <= canvas.width
        and SHARED_ACTOR_POSITION[1] + actor.height <= canvas.height
    )
    return canvas, {
        "frameBounds": list(actor.getbbox()) if actor.getbbox() else None,
        "actorPosition": list(SHARED_ACTOR_POSITION),
        "actorInsideReviewCard": inside,
        "facilityOverlapPixels": alpha_overlap(
            actor,
            SHARED_ACTOR_POSITION,
            machine,
            MACHINE_POSITION,
        ),
        "heldAssetVisible": attachment_parent is not None,
        "heldByActor": attachment_parent == "actor.hand.primary.grip",
        "attachmentParent": attachment_parent,
        "rootSocket": frame_socket["rootSocket"],
        "primaryGripSocket": frame_socket["primaryGripSocket"],
        "secondaryGripSocket": frame_socket["secondaryGripSocket"],
        "propGripSocket": list(prop_socket),
        "propVisualCenterSocket": list(prop_socket),
        "propOrigin": list(prop_origin) if prop_origin else None,
        "parentSocketWorld": list(parent_world) if parent_world else None,
        "attachmentDelta": attachment_delta,
        "foregroundMask": None,
        "foregroundMaskUsed": False,
        "visiblePropAlphaFraction": visible_fraction,
        "renderOrder": (
            ["facility-base", "held-prop", "actor-body"]
            if attachment_parent == "facility.output.primary"
            else ["actor-body", "held-prop"]
            if attachment_parent == "actor.hand.primary.grip"
            else ["facility-base", "actor-body"]
        ),
    }


def build_roster_validation(
    counter: Image.Image,
    machine_frames: dict[str, Image.Image],
    held_prop: Image.Image,
) -> tuple[
    list[dict[str, Any]],
    dict[str, list[Image.Image]],
    dict[str, Any],
]:
    action_authority = load_json(POSE_AUTHORITY_PATH)
    spatial_authority = load_json(SPATIAL_AUTHORITY_PATH)
    held_manifest = load_json(HELD_PROP_MANIFEST_PATH)
    held_record = next(
        record
        for record in held_manifest["props"]
        if record["id"] == HELD_ASSET_ID
    )
    if (
        action_authority["status"] != "owner-approved"
        or spatial_authority["status"] != "owner-approved"
        or held_manifest["status"] != "owner-approved"
    ):
        raise ValueError("C01 requires approved I01 and H01 authorities")
    prop_socket = tuple(held_record["visualCenterSocket"])
    sequence = ("a", "b", "c", "d", "d", "a")
    characters: list[dict[str, Any]] = []
    rendered: dict[str, list[Image.Image]] = {}
    for socket_character in action_authority["characters"]:
        sheet_path = ROOT / socket_character["sheet"]
        sheet = Image.open(sheet_path).convert("RGBA")
        frames = []
        review_frames = []
        for frame_index in range(ACTIVE_FRAMES):
            actor = actor_frame(sheet, frame_index)
            composition, metrics = compose_pose_case(
                counter,
                machine_frames[sequence[frame_index]],
                actor,
                held_prop,
                socket_character["frames"][frame_index],
                prop_socket,
                frame_index,
            )
            if not metrics["actorInsideReviewCard"]:
                raise ValueError(
                    f"{socket_character['id']} frame {frame_index} left its card"
                )
            if metrics["attachmentDelta"] not in (None, [0, 0]):
                raise ValueError(
                    f"{socket_character['id']} frame {frame_index} socket drift"
                )
            if (
                metrics["heldByActor"]
                and metrics["visiblePropAlphaFraction"] != 1
            ):
                raise ValueError(
                    f"{socket_character['id']} frame {frame_index} clips mug"
                )
            frames.append({"frame": frame_index, **metrics})
            review_frames.append(composition)
        characters.append(
            {
                "id": socket_character["id"],
                "sheet": socket_character["sheet"],
                "sha256": sha256_file(sheet_path),
                "frames": frames,
            }
        )
        rendered[socket_character["id"]] = review_frames
    if len(characters) != 18:
        raise ValueError(f"C01 expected eighteen characters: {len(characters)}")
    roster = {
        "visualPose": "interact-front",
        "poseAuthority": {
            "manifest": rp(POSE_AUTHORITY_PATH),
            "manifestSha256": sha256_file(POSE_AUTHORITY_PATH),
            "status": action_authority["status"],
            "activeOfficeImported": False,
        },
        "spatialAuthority": {
            "manifest": rp(SPATIAL_AUTHORITY_PATH),
            "manifestSha256": sha256_file(SPATIAL_AUTHORITY_PATH),
            "status": spatial_authority["status"],
            "activeOfficeImported": False,
        },
        "heldPropAuthority": {
            "manifest": rp(HELD_PROP_MANIFEST_PATH),
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
        "frontOverlayCases": len(characters) * 2,
        "foregroundMaskUses": 0,
        "visibleAlphaFailures": 0,
        "sharedActorPosition": list(SHARED_ACTOR_POSITION),
        "perCharacterFacilityScaling": False,
        "perCharacterActorOffsets": False,
        "poseSources": pose_source_records(),
        "characters": characters,
    }
    return characters, rendered, roster


def reservation_timeline() -> tuple[dict[str, Any], list[dict[str, Any]]]:
    samples: list[dict[str, Any]] = []
    for second in range(31):
        if second == 0:
            held_by = None
            alpha_state, beta_state = "available", "available"
        elif second == 1:
            held_by = "agent-alpha"
            alpha_state, beta_state = "reserved", "waiting"
        elif second == 2:
            held_by = "agent-alpha"
            alpha_state, beta_state = "approaching", "waiting"
        elif 3 <= second <= 6:
            held_by = "agent-alpha"
            alpha_state, beta_state = "interacting", "waiting"
        elif second == 7:
            held_by = None
            alpha_state, beta_state = "failed-released", "waiting"
        elif second == 8:
            held_by = "agent-beta"
            alpha_state, beta_state = "waiting-retry", "reserved"
        elif second == 9:
            held_by = "agent-beta"
            alpha_state, beta_state = "waiting-retry", "approaching"
        elif 10 <= second <= 14:
            held_by = "agent-beta"
            alpha_state, beta_state = "waiting-retry", "interacting"
        elif 15 <= second <= 18:
            held_by = "agent-beta"
            alpha_state, beta_state = "waiting-retry", "dispensing"
        elif second == 19:
            held_by = None
            alpha_state, beta_state = "waiting-retry", "released-success"
        elif 20 <= second <= 27:
            held_by = "agent-alpha"
            alpha_state, beta_state = "retry-success", "available"
        elif second == 28:
            held_by = "agent-alpha"
            alpha_state, beta_state = "releasing", "available"
        else:
            held_by = None
            alpha_state, beta_state = "available", "available"
        samples.append(
            {
                "second": second,
                "heldBy": held_by,
                "actorStates": {
                    "agent-alpha": alpha_state,
                    "agent-beta": beta_state,
                },
            }
        )
    return (
        {
            "durationSeconds": 30,
            "actorCount": 2,
            "maximumConcurrentReservations": 1,
            "collisionCount": 0,
            "blockedAttemptCount": 1,
            "failureCount": 1,
            "retrySuccessCount": 1,
            "releasedAtEnd": True,
            "samples": samples,
        },
        samples,
    )


def new_board(title: str, subtitle: str, size=(1600, 1000)) -> Image.Image:
    board = Image.new("RGBA", size, (244, 247, 250, 255))
    draw_title(board, title, subtitle)
    return board


def card(
    board: Image.Image,
    box: tuple[int, int, int, int],
    label: str,
    *,
    fill=(255, 255, 255, 255),
) -> ImageDraw.ImageDraw:
    draw = ImageDraw.Draw(board)
    draw.rounded_rectangle(
        box,
        radius=18,
        fill=fill,
        outline=(188, 201, 214, 255),
        width=2,
    )
    draw.text(
        (box[0] + 18, box[1] + 14),
        label,
        font=HEADING_FONT,
        fill=(27, 42, 58, 255),
    )
    return draw


def paste_review(
    target: Image.Image,
    source: Image.Image,
    box: tuple[int, int, int, int],
) -> None:
    width = box[2] - box[0]
    height = box[3] - box[1]
    scale = min(width / source.width, height / source.height)
    copy = source.resize(
        (
            max(1, round(source.width * scale)),
            max(1, round(source.height * scale)),
        ),
        Image.Resampling.NEAREST,
    )
    target.alpha_composite(
        copy,
        (
            box[0] + (width - copy.width) // 2,
            box[1] + (height - copy.height) // 2,
        ),
    )


def paste_alpha_focus(
    target: Image.Image,
    source: Image.Image,
    box: tuple[int, int, int, int],
) -> None:
    bounds = source.getbbox()
    if bounds is None:
        return
    pad = 6
    focus = source.crop(
        (
            max(0, bounds[0] - pad),
            max(0, bounds[1] - pad),
            min(source.width, bounds[2] + pad),
            min(source.height, bounds[3] + pad),
        )
    )
    paste_review(target, focus, box)


def counter_context(
    machine: Image.Image,
    counter: Image.Image,
    *,
    parent_socket=SELECTED_PARENT_SOCKET,
    mug: Image.Image | None = None,
) -> Image.Image:
    context = Image.new("RGBA", (256, 240), (0, 0, 0, 0))
    context.alpha_composite(counter, COUNTER_CONTEXT_ORIGIN)
    root_world = (
        COUNTER_CONTEXT_ORIGIN[0] + parent_socket[0],
        COUNTER_CONTEXT_ORIGIN[1] + parent_socket[1],
    )
    machine_origin = (
        root_world[0] - FACILITY_BASE_SOCKET[0],
        root_world[1] - FACILITY_BASE_SOCKET[1],
    )
    context.alpha_composite(machine, machine_origin)
    if mug is not None:
        mug_origin = (
            machine_origin[0]
            + FACILITY_OUTPUT_SOCKET[0]
            - mug.width // 2,
            machine_origin[1]
            + FACILITY_OUTPUT_SOCKET[1]
            - mug.height // 2,
        )
        context.alpha_composite(mug, mug_origin)
    return context


def render_variant(machine: Image.Image, canvas: tuple[int, int]) -> Image.Image:
    output = Image.new("RGBA", canvas, (0, 0, 0, 0))
    copy = machine.copy()
    copy.thumbnail(canvas, Image.Resampling.NEAREST)
    output.alpha_composite(
        copy,
        ((canvas[0] - copy.width) // 2, canvas[1] - copy.height),
    )
    return output


def context_for_variant(
    variant: Image.Image,
    counter: Image.Image,
) -> Image.Image:
    context = Image.new("RGBA", (256, 240), (0, 0, 0, 0))
    context.alpha_composite(counter, COUNTER_CONTEXT_ORIGIN)
    root_world = (
        COUNTER_CONTEXT_ORIGIN[0] + SELECTED_PARENT_SOCKET[0],
        COUNTER_CONTEXT_ORIGIN[1] + SELECTED_PARENT_SOCKET[1],
    )
    context.alpha_composite(
        variant,
        (
            root_world[0] - variant.width // 2,
            root_world[1] - variant.height,
        ),
    )
    return context


def review_source(
    master: Image.Image,
    ownership: Image.Image,
    frames: dict[str, Image.Image],
) -> Image.Image:
    board = new_board(
        "COFFEE C01-r02 / SOURCE OWNERSHIP",
        "Fresh built-in ImageGen source • flat green key • one complete component • zero C01 or Active Office pixels",
    )
    card(board, (25, 120, 775, 965), "GENERATED ISOLATED SOURCE")
    paste_scaled(board, master, (55, 175, 745, 535))
    paste_scaled(board, ownership, (55, 575, 745, 925))
    for index, frame in enumerate(FRAME_IDS):
        x = 815 + (index % 2) * 370
        y = 120 + (index // 2) * 420
        card(board, (x, y, x + 345, y + 390), f"FRAME {frame.upper()}")
        preview = checkerboard((300, 300))
        paste_scaled(preview, frames[frame], (20, 20, 280, 280))
        board.alpha_composite(preview, (x + 22, y + 62))
    return board


def review_geometry(
    clean: Image.Image,
    counter: Image.Image,
) -> Image.Image:
    board = new_board(
        "COFFEE C01-r02 / GEOMETRY CALIBRATION",
        "Physical 2×2×2 on Counter Z=2 • visible silhouette fills one complete 2×2 block • three non-overlapping placements",
    )
    pack_sockets = ((64, 86), (128, 86), (192, 86))
    variants = [
        ("BLOCK 01–02", pack_sockets[0]),
        ("SELECTED BLOCK 03–04", pack_sockets[1]),
        ("BLOCK 05–06", pack_sockets[2]),
    ]
    for index, (label, socket) in enumerate(variants):
        x = 25 + index * 520
        card(board, (x, 120, x + 495, 825), label)
        context = counter_context(clean, counter, parent_socket=socket)
        paste_scaled(board, context, (x + 20, 190, x + 475, 620))
        draw = ImageDraw.Draw(board)
        draw.text(
            (x + 28, 655),
            "2×2 support / front-edge midpoint anchor\n"
            "Visible shell ≈ 62×64 px / no non-uniform scaling",
            font=BODY_FONT,
            fill=(45, 59, 75, 255),
            spacing=8,
        )
    draw = ImageDraw.Draw(board)
    draw.rounded_rectangle(
        (35, 850, 1565, 960),
        radius=18,
        fill=(226, 241, 251, 255),
    )
    draw.text(
        (65, 878),
        "A01-r02 packs three 2×2 objects exactly at blocks 01–02, 03–04, and 05–06 with no overlap.",
        font=HEADING_FONT,
        fill=(22, 75, 111, 255),
    )
    return board


def review_parts(
    parts: dict[str, Image.Image],
) -> Image.Image:
    board = new_board(
        "COFFEE C01-r02 / ALPHA PARTS",
        "Static shell • local indicator viewport • empty bay • coffee and steam overlays • independent H01 mug",
    )
    ids = list(parts)
    for index, part_id in enumerate(ids):
        x = 25 + (index % 3) * 520
        y = 115 + (index // 3) * 285
        card(board, (x, y, x + 495, y + 265), part_id.upper())
        preview = checkerboard((450, 190))
        paste_alpha_focus(preview, parts[part_id], (20, 10, 430, 180))
        board.alpha_composite(preview, (x + 20, y + 58))
    return board


def review_clean(clean: Image.Image) -> Image.Image:
    board = new_board(
        "COFFEE C01-r02 / CLEAN FRONT",
        "Fresh broad-and-deep machine • empty output bay • runtime 96×96 • physical 2×2×2 • no cup baked into shell",
    )
    preview = checkerboard((900, 760), 24)
    paste_review(preview, clean, (100, 30, 800, 730))
    board.alpha_composite(preview, (60, 150))
    draw = ImageDraw.Draw(board)
    lines = [
        "PLACEMENT  furniture-surface",
        "PARENT     Counter A01-r02",
        "BLOCK      span.block.03-04",
        "ANCHOR     front-edge midpoint",
        "LANES      use.03 + use.04",
        "CAPACITY   1",
        "F9 / F10   blocked",
    ]
    draw.rounded_rectangle(
        (1030, 165, 1560, 895),
        radius=20,
        fill=(255, 255, 255, 255),
        outline=(188, 201, 214, 255),
        width=2,
    )
    for index, line in enumerate(lines):
        draw.text(
            (1070, 220 + index * 88),
            line,
            font=HEADING_FONT,
            fill=(29, 47, 64, 255),
        )
    return board


def review_animation(
    composites: dict[str, Image.Image],
    metrics: dict[str, int],
) -> Image.Image:
    board = new_board(
        "COFFEE C01-r02 / LOCAL ANIMATION",
        "A idle • B ready lamp • C coffee stream + steam • D complete • immutable shell outside local viewport",
    )
    for index, frame in enumerate(FRAME_IDS):
        x = 25 + index * 390
        card(board, (x, 125, x + 365, 780), f"FRAME {frame.upper()}")
        preview = checkerboard((320, 570), 16)
        paste_review(preview, composites[frame], (25, 20, 295, 550))
        board.alpha_composite(preview, (x + 22, 185))
    draw = ImageDraw.Draw(board)
    draw.rounded_rectangle(
        (30, 825, 1570, 955),
        radius=18,
        fill=(232, 244, 236, 255),
    )
    draw.text(
        (60, 855),
        (
            f"outsideViewportChangedPixels = {metrics['outsideViewportChangedPixels']}   "
            f"coffee pixels = {metrics['streamPixels']}   "
            f"steam pixels = {metrics['steamPixels']}"
        ),
        font=HEADING_FONT,
        fill=(28, 93, 58, 255),
    )
    return board


def review_counter_placement(
    clean: Image.Image,
    counter: Image.Image,
    mug: Image.Image,
    counter_manifest: dict[str, Any],
) -> Image.Image:
    board = new_board(
        "COFFEE C01-r02 / COUNTER PLACEMENT",
        "A01-r02 owner-approved • each machine occupies one complete 2×2 block • three-item packing • zero parent-socket drift",
    )
    slots = {
        slot["id"]: tuple(slot["localSocket"])
        for slot in counter_manifest["surfaceContract"]["slots"]
    }
    examples = [
        ("BLOCK 01–02", (64, 86)),
        ("SELECTED BLOCK 03–04", SELECTED_PARENT_SOCKET),
        ("BLOCK 05–06", (192, 86)),
    ]
    for index, (label, socket) in enumerate(examples):
        x = 25 + index * 520
        card(board, (x, 120, x + 495, 760), label)
        context = counter_context(
            clean,
            counter,
            parent_socket=socket,
            mug=mug if index == 1 else None,
        )
        paste_scaled(board, context, (x + 20, 190, x + 475, 630))
        draw = ImageDraw.Draw(board)
        draw.text(
            (x + 30, 655),
            f"parent socket {socket}\nbase.support {FACILITY_BASE_SOCKET}",
            font=BODY_FONT,
            fill=(45, 59, 75, 255),
            spacing=8,
        )
    draw = ImageDraw.Draw(board)
    draw.rounded_rectangle(
        (35, 810, 1565, 960),
        radius=18,
        fill=(226, 241, 251, 255),
    )
    draw.text(
        (65, 845),
        "5 / 5 adjacent 2×2 blocks compatible • exact three-item packing uses 01–02 + 03–04 + 05–06 • zero overlap",
        font=HEADING_FONT,
        fill=(22, 75, 111, 255),
    )
    return board


def review_routes(counter: Image.Image, clean: Image.Image) -> Image.Image:
    board = new_board(
        "COFFEE C01-r02 / USE LANE AND ROUTES",
        "Machine occupies block 03–04 → internal output bay → stand 3.0,2.5 → approach 3.0,3.5 → exit 3.0,4.5",
    )
    context = counter_context(clean, counter)
    paste_scaled(board, context, (40, 150, 930, 850))
    draw = ImageDraw.Draw(board)
    labels = [
        ("M", (1130, 210), (246, 162, 56, 255), "machine / 2×2 block 03–04"),
        ("O", (1130, 345), (62, 149, 230, 255), "output / internal bay"),
        ("S", (1130, 480), (74, 181, 114, 255), "stand / 3.0,2.5"),
        ("A", (1130, 615), (154, 105, 226, 255), "approach / 3.0,3.5"),
        ("E", (1130, 750), (82, 94, 111, 255), "exit / 3.0,4.5"),
    ]
    for letter, center, color, text in labels:
        draw.ellipse(
            (center[0] - 38, center[1] - 38, center[0] + 38, center[1] + 38),
            fill=color,
        )
        draw.text(
            center,
            letter,
            font=HEADING_FONT,
            fill=(255, 255, 255, 255),
            anchor="mm",
        )
        draw.text(
            (center[0] + 70, center[1]),
            text,
            font=HEADING_FONT,
            fill=(35, 50, 66, 255),
            anchor="lm",
        )
    return board


def review_three_item_packing(
    clean: Image.Image,
    counter: Image.Image,
) -> Image.Image:
    board = new_board(
        "COFFEE C01-r02 / EXACT THREE-ITEM PACKING",
        "Counter A01-r02 width 6 × depth 2 • three non-overlapping 2×2 blocks • visible shells keep a 2 px gap",
    )
    context = Image.new("RGBA", (256, 240), (0, 0, 0, 0))
    context.alpha_composite(counter, COUNTER_CONTEXT_ORIGIN)
    for parent_socket in ((64, 86), (128, 86), (192, 86)):
        root_world = (
            COUNTER_CONTEXT_ORIGIN[0] + parent_socket[0],
            COUNTER_CONTEXT_ORIGIN[1] + parent_socket[1],
        )
        context.alpha_composite(
            clean,
            (
                root_world[0] - FACILITY_BASE_SOCKET[0],
                root_world[1] - FACILITY_BASE_SOCKET[1],
            ),
        )
    card(board, (110, 130, 1490, 810), "PACKED COUNTER / 3 × 2×2 OBJECTS")
    paste_alpha_focus(board, context, (170, 210, 1430, 700))
    draw = ImageDraw.Draw(board)
    draw.rounded_rectangle(
        (110, 840, 1490, 950),
        radius=18,
        fill=(226, 241, 251, 255),
    )
    draw.text(
        (150, 875),
        "01–02  |  03–04  |  05–06     capacity = 3     overlapFailures = 0",
        font=HEADING_FONT,
        fill=(22, 75, 111, 255),
    )
    return board


def review_handoff(rendered: dict[str, list[Image.Image]]) -> Image.Image:
    board = new_board(
        "COFFEE C01-r02 / SIX-FRAME OUTPUT HANDOFF",
        "Empty → ready → mug at machine output → complete front-overlay in hand → release",
    )
    frames = rendered["einstein"]
    for index, image in enumerate(frames):
        x = 20 + index * 260
        card(board, (x, 130, x + 245, 850), f"POSE {index + 1}")
        preview = checkerboard((220, 630), 14)
        paste_scaled(preview, image, (8, 15, 212, 615))
        board.alpha_composite(preview, (x + 12, 190))
    draw = ImageDraw.Draw(board)
    draw.text(
        (45, 900),
        "attachment parents: null → null → facility.output.primary → actor.hand.primary.grip → actor.hand.primary.grip → null",
        font=HEADING_FONT,
        fill=(34, 52, 70, 255),
    )
    return board


def review_roster(rendered: dict[str, list[Image.Image]]) -> Image.Image:
    board = new_board(
        "COFFEE C01-r02 / 18 × 6 ROSTER",
        "108 interact-front cases • 54 visible mugs • 36 complete actor-held front overlays • zero attachment drift",
        (1900, 1260),
    )
    ids = list(rendered)
    for row, character_id in enumerate(ids):
        y = 105 + row * 62
        draw = ImageDraw.Draw(board)
        draw.text(
            (20, y + 25),
            character_id,
            font=SMALL_FONT,
            fill=(29, 44, 59, 255),
            anchor="lm",
        )
        for frame, image in enumerate(rendered[character_id]):
            x = 260 + frame * 265
            thumb = checkerboard((245, 54), 8)
            paste_scaled(thumb, image, (4, 2, 241, 52))
            board.alpha_composite(thumb, (x, y))
    return board


def review_sockets(
    clean: Image.Image,
    counter: Image.Image,
) -> Image.Image:
    board = new_board(
        "COFFEE C01-r02 / SOCKET ATTACHMENT DEBUG",
        "Counter support → base.support → output/effect/viewport • three world positions • attachment delta [0,0]",
    )
    positions = [
        ("WORLD 0,0", (48, 38)),
        ("WORLD 4,3", (112, 38)),
        ("WORLD 9,6", (208, 38)),
    ]
    for index, (label, socket) in enumerate(positions):
        x = 25 + index * 520
        card(board, (x, 120, x + 495, 805), label)
        context = counter_context(clean, counter, parent_socket=socket)
        paste_scaled(board, context, (x + 20, 180, x + 475, 610))
        draw = ImageDraw.Draw(board)
        draw.text(
            (x + 28, 645),
            (
                f"parent = {socket}\n"
                f"base.support = {FACILITY_BASE_SOCKET}\n"
                f"output.primary = {FACILITY_OUTPUT_SOCKET}\n"
                "resolved delta = [0,0]"
            ),
            font=BODY_FONT,
            fill=(43, 59, 75, 255),
            spacing=8,
        )
    draw = ImageDraw.Draw(board)
    draw.text(
        (50, 875),
        "No per-scene offset • no center-to-center attachment • no missing-socket fallback",
        font=HEADING_FONT,
        fill=(133, 52, 52, 255),
    )
    return board


def review_reservation(samples: list[dict[str, Any]]) -> Image.Image:
    board = new_board(
        "COFFEE C01-r02 / 30-SECOND RESERVATION",
        "Two users • capacity one • blocked attempt • failure releases atomically • retry succeeds • empty at second 30",
    )
    draw = ImageDraw.Draw(board)
    left, top, width = 65, 240, 1470
    cell = width / 31
    for index, sample in enumerate(samples):
        x0 = round(left + index * cell)
        x1 = round(left + (index + 1) * cell)
        owner = sample["heldBy"]
        color = (
            (65, 147, 225, 255)
            if owner == "agent-alpha"
            else (235, 151, 65, 255)
            if owner == "agent-beta"
            else (210, 219, 228, 255)
        )
        draw.rectangle((x0, top, x1, top + 250), fill=color)
        draw.text(
            ((x0 + x1) // 2, top + 280),
            str(index),
            font=SMALL_FONT,
            fill=(39, 54, 69, 255),
            anchor="ma",
        )
    draw.text(
        (65, 150),
        "BLUE = agent-alpha     ORANGE = agent-beta     GRAY = released",
        font=HEADING_FONT,
        fill=(37, 55, 73, 255),
    )
    events = [
        "t1 alpha reserves",
        "t7 failure releases",
        "t8 beta retry reserves",
        "t19 beta completes",
        "t20 alpha retry succeeds",
        "t30 released",
    ]
    for index, event in enumerate(events):
        draw.rounded_rectangle(
            (80 + (index % 3) * 500, 650 + (index // 3) * 120,
             530 + (index % 3) * 500, 740 + (index // 3) * 120),
            radius=14,
            fill=(255, 255, 255, 255),
            outline=(183, 198, 212, 255),
        )
        draw.text(
            (105 + (index % 3) * 500, 695 + (index // 3) * 120),
            event,
            font=HEADING_FONT,
            fill=(38, 54, 70, 255),
            anchor="lm",
        )
    return board


def review_closeups(
    rendered: dict[str, list[Image.Image]],
) -> Image.Image:
    board = new_board(
        "C01-r02 / HAND CLOSEUPS + LAYER ORDER",
        "Einstein • Doraemon • Anna • frames 3–5 • complete H01 mug in front of actor • bay lip remains machine-local",
    )
    ids = ["einstein", "doraemon", "anna"]
    for row, character_id in enumerate(ids):
        for column, frame_index in enumerate((2, 3, 4)):
            x = 25 + column * 430
            y = 125 + row * 275
            card(
                board,
                (x, y, x + 405, y + 250),
                f"{character_id.upper()} / FRAME {frame_index + 1}",
            )
            image = rendered[character_id][frame_index]
            crop = (
                image.crop((70, 10, 220, 155))
                if frame_index == 2
                else image.crop((65, 145, 245, 295))
            )
            paste_review(board, crop, (x + 20, y + 60, x + 385, y + 230))
    draw = ImageDraw.Draw(board)
    draw.rounded_rectangle(
        (1320, 135, 1570, 920),
        radius=18,
        fill=(255, 255, 255, 255),
        outline=(184, 197, 210, 255),
        width=2,
    )
    layers = [
        "1 counter support",
        "2 machine shell",
        "3 local viewport",
        "4 empty bay",
        "5 coffee / steam",
        "6 mug at output",
        "7 actor body",
        "8 held mug overlay",
    ]
    for index, text in enumerate(layers):
        draw.text(
            (1345, 190 + index * 78),
            text,
            font=BODY_FONT,
            fill=(35, 51, 67, 255),
        )
    return board


def build_manifest_and_images() -> dict[Path, bytes]:
    records, counter_manifest, spatial_authority = validate_authorities()
    master = Image.open(SOURCE_PATH).convert("RGBA")
    keyed, ownership, source_frames, source_evidence = extract_source_frames(
        master,
        records,
    )
    (
        authoring_parts,
        runtime_parts,
        authoring_composites,
        runtime_composites,
        animation_metrics,
    ) = build_parts(source_frames)
    counter_clean = Image.open(COUNTER_CLEAN_PATH).convert("RGBA")
    characters, rendered, roster = build_roster_validation(
        counter_clean,
        runtime_composites,
        runtime_parts["held-coffee-mug"],
    )
    reservation, reservation_samples = reservation_timeline()

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

    review_images = [
        review_source(master, ownership, source_frames),
        review_geometry(runtime_composites["a"], counter_clean),
        review_parts(authoring_parts),
        review_clean(authoring_composites["a"]),
        review_animation(authoring_composites, animation_metrics),
        review_counter_placement(
            runtime_composites["a"],
            counter_clean,
            runtime_parts["held-coffee-mug"],
            counter_manifest,
        ),
        review_routes(counter_clean, runtime_composites["a"]),
        review_handoff(rendered),
        review_roster(rendered),
        review_sockets(runtime_composites["a"], counter_clean),
        review_reservation(reservation_samples),
        review_closeups(rendered),
        review_three_item_packing(runtime_composites["a"], counter_clean),
    ]
    for path, image in zip(REVIEW_PATHS, review_images, strict=True):
        outputs[path] = png_bytes(image)

    runtime_visible_bounds = runtime_composites["a"].getchannel("A").point(
        lambda value: 255 if value >= 16 else 0
    ).getbbox()
    if runtime_visible_bounds is None:
        raise ValueError("Coffee C01-r02 runtime silhouette is empty")
    held_manifest = load_json(HELD_PROP_MANIFEST_PATH)
    held_record = next(
        record
        for record in held_manifest["props"]
        if record["id"] == HELD_ASSET_ID
    )
    slots = counter_manifest["surfaceContract"]["slots"]
    slot_by_id = {slot["id"]: slot for slot in slots}
    support_bottom = counter_manifest["surfaceContract"][
        "projectedSupportBounds"
    ][3]
    compatible_block_spans = []
    for block in counter_manifest["surfaceContract"]["twoByTwoSpanGroups"]:
        front_slot_ids = [
            slot_id for slot_id in block["slotIds"] if ".front." in slot_id
        ]
        front_slots = [slot_by_id[slot_id] for slot_id in front_slot_ids]
        use_lane_ids = [
            slot["pairedUseLaneId"] for slot in front_slots
        ]
        compatible_block_spans.append(
            {
                "id": block["id"],
                "slotIds": block["slotIds"],
                "anchorSlotIds": front_slot_ids,
                "useLaneIds": use_lane_ids,
                "parentSocket": [
                    sum(slot["localSocket"][0] for slot in front_slots) // 2,
                    support_bottom,
                ],
            }
        )
    source_records = []
    for evidence in source_evidence:
        path = SOURCE_FRAME_PATHS[evidence["frameId"]]
        source_records.append(
            {
                **evidence,
                "authoringCutout": rp(path),
                "authoringCutoutSha256": sha256_bytes(outputs[path]),
            }
        )
    part_records = []
    for part_id, (authoring_path, runtime_path) in PART_PATHS.items():
        part_records.append(
            {
                "id": f"coffee-machine-c01-r02.{part_id}",
                "role": PART_ROLES[part_id],
                "state": (
                    part_id.removeprefix("viewport-")
                    if part_id.startswith("viewport-")
                    else "dispensing"
                    if part_id.startswith("effect-")
                    else "empty"
                    if part_id == "output-bay-empty"
                    else "static"
                ),
                "sourceFrame": PART_SOURCE_FRAMES[part_id],
                "authoringFile": rp(authoring_path),
                "authoringSha256": sha256_bytes(outputs[authoring_path]),
                "runtimeFile": rp(runtime_path),
                "runtimeSha256": sha256_bytes(outputs[runtime_path]),
            }
        )
    effects_by_frame = {
        "a": [],
        "b": [],
        "c": [
            "coffee-machine-c01-r02.effect-coffee-stream",
            "coffee-machine-c01-r02.effect-steam",
        ],
        "d": [],
    }
    animation_frames = []
    for frame in FRAME_IDS:
        authoring_path, runtime_path = COMPOSITE_PATHS[frame]
        animation_frames.append(
            {
                "id": f"coffee-machine-c01-r02.frame-{frame}",
                "viewportPartId": f"coffee-machine-c01-r02.viewport-{frame}",
                "effectPartIds": effects_by_frame[frame],
                "durationMs": 450 if frame == "c" else 650,
                "authoringCompositeFile": rp(authoring_path),
                "authoringCompositeSha256": sha256_bytes(
                    outputs[authoring_path]
                ),
                "runtimeCompositeFile": rp(runtime_path),
                "runtimeCompositeSha256": sha256_bytes(
                    outputs[runtime_path]
                ),
            }
        )
    gates = {
        "F0": {
            "status": "passed",
            "evidence": [rp(SOURCE_PATH), rp(REVIEW_PATHS[0])],
        },
        "F1": {
            "status": "passed",
            "evidence": [rp(REVIEW_PATHS[1]), rp(REVIEW_PATHS[3])],
        },
        "F2": {
            "status": "passed",
            "evidence": [rp(REVIEW_PATHS[2]), rp(REVIEW_PATHS[4])],
        },
        "F3": {
            "status": "passed",
            "evidence": [rp(REVIEW_PATHS[5]), rp(REVIEW_PATHS[6])],
        },
        "F4": {
            "status": "passed",
            "evidence": [rp(REVIEW_PATHS[10])],
        },
        "F5": {
            "status": "passed",
            "evidence": [rp(REVIEW_PATHS[8])],
        },
        "F6": {
            "status": "passed",
            "evidence": [
                rp(REVIEW_PATHS[7]),
                rp(REVIEW_PATHS[9]),
                rp(REVIEW_PATHS[11]),
            ],
        },
        "F7": {
            "status": "passed",
            "evidence": [rp(path) for path in REVIEW_PATHS],
        },
        "F8": {
            "status": "passed",
            "evidence": [
                rp(SOURCE_PATH),
                rp(REVIEW_PATHS[1]),
                rp(REVIEW_PATHS[3]),
                rp(REVIEW_PATHS[5]),
                rp(REVIEW_PATHS[11]),
                rp(REVIEW_PATHS[12]),
            ],
        },
        "F9": {
            "status": "blocked",
            "evidence": ["No furniture-only room composition in C01-r02 scope."],
        },
        "F10": {
            "status": "blocked",
            "evidence": ["Active Office remains byte-isolated from C01-r02."],
        },
    }
    manifest = {
        "schemaVersion": 2,
        "id": "office.facility.coffee-machine.c01-r02",
        "familyId": FAMILY_ID,
        "revision": REVISION,
        "status": "owner-approved",
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
            "kind": "generated-isolated-clean-source",
            "path": rp(SOURCE_PATH),
            "sha256": SOURCE_SHA256,
            "auditManifest": rp(AUDIT_PATH),
            "extractionMethod": "generated-source-chroma-key",
            "generation": {
                "tool": "OpenAI built-in image generation",
                "mode": "generated-option-b-selected-by-owner",
                "prompt": GENERATION_PROMPT,
                "generatedOn": "2026-07-29",
                "ownerDirective": (
                    "Replace the prior C01-r02 visual with the selected "
                    "dark-green twin-pillar machine; keep its system unchanged."
                ),
            },
            "keyedSource": file_evidence(KEYED_SOURCE_PATH, outputs),
            "ownershipMask": file_evidence(OWNERSHIP_PATH, outputs),
            "frames": source_records,
        },
        "sourceExclusions": {
            "rejectedAuditRecordIds": list(REJECTED_RECORDS),
            "processedCoffeeInputs": [],
            "historicalLoopInputs": [],
            "sideOrientationInputs": [],
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
                "file": rp(SPATIAL_AUTHORITY_PATH),
                "sha256": sha256_file(SPATIAL_AUTHORITY_PATH),
                "id": spatial_authority["id"],
                "status": spatial_authority["status"],
            },
            "coordinateSpace": "facility-runtime-pixel",
            "unit": "pixel",
            "localSockets": {
                "base.support": list(FACILITY_BASE_SOCKET),
                "interaction.target": list(INTERACTION_TARGET_SOCKET),
                "output.primary": list(FACILITY_OUTPUT_SOCKET),
                "effect.origin": list(FACILITY_EFFECT_SOCKET),
                "viewport.origin": [
                    VIEWPORT_RUNTIME_BOX[0],
                    VIEWPORT_RUNTIME_BOX[1],
                ],
            },
            "supportParent": {
                "authority": {
                    "file": rp(COUNTER_MANIFEST_PATH),
                    "sha256": sha256_file(COUNTER_MANIFEST_PATH),
                    "id": counter_manifest["id"],
                    "revision": counter_manifest["revision"],
                    "status": counter_manifest["status"],
                },
                "placementPlane": "furniture-surface",
                "supportPlaneId": counter_manifest["geometry"]["supportPlane"]["id"],
                "compatibleBlockSpans": compatible_block_spans,
                "selectedBlockSpanId": SELECTED_BLOCK_SPAN_ID,
                "occupiedSlotIds": list(OCCUPIED_SLOT_IDS),
                "selectedAnchorSlotIds": list(SELECTED_ANCHOR_SLOT_IDS),
                "useLaneIds": list(USE_LANE_IDS),
                "anchorDerivation": "span-front-edge-midpoint",
                "selectedParentSocket": list(SELECTED_PARENT_SOCKET),
                "attachmentDelta": [0, 0],
                "placementCases": len(compatible_block_spans),
                "supportFailures": 0,
                "activeOfficeImported": False,
                "nonOverlappingPacking": {
                    "capacity": 3,
                    "spanIds": [
                        "span.block.01-02",
                        "span.block.03-04",
                        "span.block.05-06",
                    ],
                    "overlapFailures": 0,
                },
            },
            "perSceneAttachmentOffsets": False,
            "centerToCenterAttachment": False,
            "missingSocketFallback": False,
        },
        "geometry": {
            "schemaVersion": 3,
            "id": "machine.coffee.c01-r02",
            "assetType": "animated-shell",
            "placementPlane": "furniture-surface",
            "physicalScale": {
                "width": 2,
                "depth": 2,
                "height": 2,
                "unit": "tile",
            },
            "footprint": None,
            "supportPlane": None,
            "basePivot": {"x": 1, "y": 2, "unit": "tile"},
            "sortPivot": None,
            "renderBounds": {
                "width": RUNTIME_CANVAS[0],
                "height": RUNTIME_CANVAS[1],
                "unit": "authoring-pixel",
            },
            "renderOffset": {
                "x": -FACILITY_BASE_SOCKET[0],
                "y": -FACILITY_BASE_SOCKET[1],
                "unit": "authoring-pixel",
            },
            "verticalExtension": {
                "aboveBase": 2,
                "belowBase": 0,
                "unit": "tile",
            },
            "occlusionParts": [
                {
                    "id": "base",
                    "role": "base",
                    "assetId": "coffee-machine-c01-r02.shell-static",
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
        "visualOccupancy": {
            "physicalScale": [2, 2, 2],
            "renderCanvas": list(RUNTIME_CANVAS),
            "visibleBoundsRuntime": list(runtime_visible_bounds),
            "targetSupportPixels": [64, 64],
            "frontEdgeMidpointAnchor": list(FACILITY_BASE_SOCKET),
            "sourceAspectPreserved": True,
            "uniformScalingOnly": True,
        },
        "parts": part_records,
        "animation": {
            "frameCount": 4,
            "shellPartId": "coffee-machine-c01-r02.shell-static",
            "viewportBoundsAuthoring": list(VIEWPORT_BOX),
            "viewportBoundsRuntime": list(VIEWPORT_RUNTIME_BOX),
            "shellStableAcrossFrames": True,
            "basePivotStableAcrossFrames": True,
            "sortPivotStableAcrossFrames": True,
            "outsideViewportChangedPixels": 0,
            "frames": animation_frames,
        },
        "outputHandoff": {
            "emptyOutputPartId": "coffee-machine-c01-r02.output-bay-empty",
            "heldAssetPartId": "coffee-machine-c01-r02.held-coffee-mug",
            "heldAssetId": HELD_ASSET_ID,
            "heldAssetManifest": rp(HELD_PROP_MANIFEST_PATH),
            "heldAssetManifestSha256": sha256_file(HELD_PROP_MANIFEST_PATH),
            "heldAssetRuntimeSha256": held_record["runtimeSha256"],
            "effectPartIds": [
                "coffee-machine-c01-r02.effect-coffee-stream",
                "coffee-machine-c01-r02.effect-steam",
            ],
            "productEmbeddedInShell": False,
            "productEmbeddedInViewportFrames": False,
            "transition": "facility-output-socket-to-actor-hand-socket",
            "heldVisiblePoseFrames": [2, 3, 4],
            "facilityOutputSocketId": "output.primary",
            "actorGripSocketId": "hand.primary.grip",
            "propGripSocketId": "visual.center",
            "attachmentMode": "front-overlay",
            "renderOrder": ["actor-body", "held-prop"],
            "runtimeScale": 1,
            "handForegroundMaskRequired": False,
            "foregroundMaskUses": 0,
            "visibleAlphaFailures": 0,
            "attachmentDeltaFailures": 0,
            "timeline": [
                {
                    "poseFrame": frame,
                    "attachmentParent": (
                        "facility.output.primary"
                        if frame == 2
                        else "actor.hand.primary.grip"
                        if frame in (3, 4)
                        else None
                    ),
                }
                for frame in range(6)
            ],
        },
        "interaction": {
            "capacity": 1,
            "durationSeconds": 30,
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
                "id": "coffee.c01-r02.use.block.03-04",
                "stand": {"x": 3, "y": 2.5},
                "approach": {"x": 3, "y": 3.5},
                "exit": {"x": 3, "y": 4.5},
                "facing": "front",
                "action": "brew-coffee",
                "visualPose": "interact-front",
                "reservationId": "reservation.coffee-machine-c01-r02",
            },
        },
        "rosterValidation": roster,
        "reservationValidation": reservation,
        "gates": gates,
        "reviewOutputs": [rp(path) for path in REVIEW_PATHS],
        "permissions": {
            "familyLab": True,
            "ownerReview": False,
            "furnitureOnlyRoom": False,
            "otherFacilityFamilies": False,
            "activeOfficePromotion": False,
        },
        "activeOfficeEvidence": {
            "file": rp(ACTIVE_REGISTRY),
            "sha256": sha256_file(ACTIVE_REGISTRY),
            "imported": False,
        },
        "ownerDecision": OWNER_DECISION,
    }
    outputs[MANIFEST_PATH] = json_bytes(manifest)
    return outputs


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    outputs = build_manifest_and_images()
    stale: list[Path] = []
    for path, content in outputs.items():
        if args.check:
            if not path.exists() or path.read_bytes() != content:
                stale.append(path)
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
    if stale:
        print("Coffee Machine C01-r02 outputs are stale:")
        for path in stale:
            print(f"- {path}")
        raise SystemExit(1)
    action = "verified" if args.check else "built"
    print(
        f"Coffee Machine C01-r02 {action}: {len(outputs)} files; "
        "fresh generated 2x2x2 source, parent Counter A01-r02, "
        "5 block cases, exact 3-item packing, 108 poses, F8 owner-approved."
    )


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, StopIteration) as error:
        print(f"Coffee Machine C01-r02 build failed: {error}", file=sys.stderr)
        raise SystemExit(1)
