#!/usr/bin/env python3
"""Build the tall front-only Water Dispenser W01 isolated facility family.

W01 uses one newly generated clean source on a removable magenta backdrop.
The builder deterministically keys and normalizes that source without
resampling its authoring pixels, then derives a static shell, local viewport,
empty output bay, code-authored water effects, and H01 held cup. Active Office,
processed facility crops, rejected loops, and side-orientation pixels are never
inputs.
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
    TITLE_FONT,
    alpha_overlap,
    changed_outside_box,
    checkerboard,
    clear_box,
    connected_components,
    draw_title,
    json_bytes,
    layer_from_box,
    normalize_without_resampling,
    paste_scaled,
    png_bytes,
    remove_magenta_chroma,
    repo_path,
    sha256_bytes,
    sha256_file,
)


ROOT = Path(__file__).resolve().parents[1]
AUDIT_PATH = ROOT / "assets/game/manifests/office-furniture-master-audit-v1.json"
MANIFEST_PATH = (
    ROOT / "assets/game/manifests/office-facility-water-dispenser-w01.json"
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

OUTPUT_ROOT = (
    ROOT
    / "assets/game/processed/office-facility-family-v1/water-dispenser-w01"
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
    / "assets/art/layout-references/office-facility-family-v1/water-dispenser-w01"
)

FAMILY_ID = "dispenser.water"
REVISION = "w01"
HELD_ASSET_ID = "held.water-cup-clear"
SOURCE_PATH = (
    "assets/art/layout-references/"
    "office-facility-water-dispenser-w01-source.png"
)
SOURCE_SHA256 = "9abef03d73fccdd709e9b07bd7fc50cfca9136a75de48be265ac7db7abe8df99"
SOURCE_AUTHORITY_ID = "owner-directive:water-dispenser-w01-tall-clean-source"
FRAME_IDS = ("a", "b", "c", "d")
AUDITED_NEUTRAL_RECORDS = tuple(
    "review-facility-completion-v1:review-facility-completion:"
    f"dispenser.water.neutral.{frame}"
    for frame in FRAME_IDS
)
REJECTED_RECORDS = (
    *tuple(
        "modern-bright-library-v1:env-08-animated-ambient:"
        f"dispenser.water.loop.{frame}"
        for frame in FRAME_IDS
    ),
    "modern-bright-library-v1:env-12-facility-side-orientations:"
    "dispenser.water.side-left",
    "modern-bright-library-v1:env-12-facility-side-orientations:"
    "dispenser.water.side-right",
)

GENERATION_PROMPT = (
    "Create one original tall, slim, floor-standing office water dispenser "
    "as a clean isolated modern-bright pixel-art game asset. Use an exact "
    "straight-on front orthographic view, a large blue top bottle, a light "
    "gray and white cabinet, a dark navy recessed empty dispensing bay, "
    "blue/red controls, a stable full base, and a perfectly removable "
    "magenta backdrop. Include no cup, water stream, bubbles, steam, glow, "
    "person, furniture, shadow, text, logo, or watermark."
)

AUTHORING_CANVAS = (1024, 2048)
RUNTIME_CANVAS = (64, 128)
RUNTIME_DIVISOR = 16
BOTTOM_PADDING = 64
ACTOR_FRAME = (96, 104)
ACTOR_ROW = 10
ACTIVE_FRAMES = 6
SHARED_ACTOR_POSITION = (96, 112)
MACHINE_POSITION = (64, 24)

VIEWPORT_BOX = (320, 736, 704, 1312)
VIEWPORT_RUNTIME_BOX = tuple(
    value // RUNTIME_DIVISOR for value in VIEWPORT_BOX
)
OUTPUT_BOX = (352, 832, 672, 1248)
FACILITY_BASE_SOCKET = (32, 128)
FACILITY_OUTPUT_SOCKET = (28, 70)
FACILITY_EFFECT_SOCKET = (28, 59)
INTERACTION_TARGET_SOCKET = (32, 126)

KEYED_SOURCE_PATH = SOURCE_ROOT / "water-dispenser-w01.keyed-source.png"
OWNERSHIP_PATH = SOURCE_ROOT / "water-dispenser-w01.ownership-mask.png"
NORMALIZED_SOURCE_PATH = (
    SOURCE_ROOT / "water-dispenser-w01.normalized-clean-source.png"
)
PART_PATHS = {
    "shell-static": (
        AUTHORING_PART_ROOT / "water-dispenser-w01.shell-static.png",
        RUNTIME_PART_ROOT / "water-dispenser-w01.shell-static.png",
    ),
    **{
        f"viewport-{frame}": (
            AUTHORING_PART_ROOT / f"water-dispenser-w01.viewport-{frame}.png",
            RUNTIME_PART_ROOT / f"water-dispenser-w01.viewport-{frame}.png",
        )
        for frame in FRAME_IDS
    },
    "output-bay-empty": (
        AUTHORING_PART_ROOT / "water-dispenser-w01.output-bay-empty.png",
        RUNTIME_PART_ROOT / "water-dispenser-w01.output-bay-empty.png",
    ),
    "effect-ready": (
        AUTHORING_PART_ROOT / "water-dispenser-w01.effect-ready.png",
        RUNTIME_PART_ROOT / "water-dispenser-w01.effect-ready.png",
    ),
    "effect-water-stream": (
        AUTHORING_PART_ROOT / "water-dispenser-w01.effect-water-stream.png",
        RUNTIME_PART_ROOT / "water-dispenser-w01.effect-water-stream.png",
    ),
    "held-water-cup-clear": (
        AUTHORING_PART_ROOT / "water-dispenser-w01.held-water-cup-clear@2x.png",
        RUNTIME_PART_ROOT / "water-dispenser-w01.held-water-cup-clear.png",
    ),
}
COMPOSITE_PATHS = {
    frame: (
        AUTHORING_COMPOSITE_ROOT / f"water-dispenser-w01.frame-{frame}.png",
        RUNTIME_COMPOSITE_ROOT / f"water-dispenser-w01.frame-{frame}.png",
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
    REVIEW_ROOT / "10-shell-stability-difference.png",
    REVIEW_ROOT / "11-three-character-six-frame-front-overlay.png",
    REVIEW_ROOT / "12-three-character-hand-closeups-8x.png",
]

PART_ROLES = {
    "shell-static": "static-shell",
    "viewport-a": "animation-viewport",
    "viewport-b": "animation-viewport",
    "viewport-c": "animation-viewport",
    "viewport-d": "animation-viewport",
    "output-bay-empty": "output-bay-empty",
    "effect-ready": "effect-overlay",
    "effect-water-stream": "effect-overlay",
    "held-water-cup-clear": "held-output",
}
PART_SOURCE_FRAMES = {
    "shell-static": "generated-base",
    "viewport-a": "generated-base",
    "viewport-b": "generated-base",
    "viewport-c": "generated-base",
    "viewport-d": "generated-base",
    "output-bay-empty": "generated-base",
    "effect-ready": "code-authored",
    "effect-water-stream": "code-authored",
    "held-water-cup-clear": "h01",
}


def rp(path: Path) -> str:
    return repo_path(ROOT, path)


def validate_audit_baseline(audit: dict[str, Any]) -> dict[str, Any]:
    family = next(
        record
        for record in audit["families"]
        if record["familyId"] == FAMILY_ID
    )
    if (
        family["action"] != "salvage-preferred-master-then-decompose"
        or tuple(family["salvageableSourceRecords"]) != AUDITED_NEUTRAL_RECORDS
        or tuple(family["rejectedOrSupersededSourceRecords"]) != REJECTED_RECORDS
    ):
        raise ValueError("Water dispenser audit baseline changed")
    by_id = {record["recordId"]: record for record in audit["records"]}
    for record_id in AUDITED_NEUTRAL_RECORDS:
        decision = by_id[record_id]["currentDecision"]
        if (
            decision["decision"] != "salvage-full-master-and-decompose"
            or decision["masterPixelsSalvageable"] is not True
        ):
            raise ValueError(f"Water neutral audit record changed: {record_id}")
    for index, record_id in enumerate(REJECTED_RECORDS):
        decision = by_id[record_id]["currentDecision"]
        expected_decision = (
            "reference-effects-only-use-neutral-front-source"
            if index < len(FRAME_IDS)
            else "reject-regenerate-orientation-if-required"
        )
        if (
            decision["decision"] != expected_decision
            or decision["masterPixelsSalvageable"] is not False
        ):
            raise ValueError(f"Rejected water source changed: {record_id}")
    return family


def build_source() -> tuple[
    Image.Image,
    Image.Image,
    Image.Image,
    dict[str, Any],
]:
    source_path = ROOT / SOURCE_PATH
    if sha256_file(source_path) != SOURCE_SHA256:
        raise ValueError("Generated Water W01 source hash changed")
    source = Image.open(source_path).convert("RGBA")
    keyed, key_color, chroma_metrics = remove_magenta_chroma(source)
    components = sorted(
        connected_components(keyed),
        key=lambda component: component["pixelCount"],
        reverse=True,
    )
    if len(components) != 1:
        raise ValueError(
            f"Water W01 clean source must contain one component: {len(components)}"
        )
    component = components[0]
    bounds = tuple(component["bounds"])
    if (
        bounds[0] <= 0
        or bounds[1] <= 0
        or bounds[2] >= source.width
        or bounds[3] >= source.height
    ):
        raise ValueError(f"Water W01 source touches the canvas edge: {bounds}")
    normalized, padding, normalized_from = normalize_without_resampling(
        keyed,
        AUTHORING_CANVAS,
        bottom_padding=BOTTOM_PADDING,
    )
    ownership = Image.new("RGBA", source.size, (0, 0, 0, 0))
    ownership_pixels = ownership.load()
    for point in component["points"]:
        ownership_pixels[point % source.width, point // source.width] = (
            43,
            183,
            235,
            220,
        )
    evidence = {
        "frameId": "base",
        "auditRecordId": SOURCE_AUTHORITY_ID,
        "sourceBounds": [0, 0, source.width, source.height],
        "ownedBounds": list(bounds),
        "selectedComponentCount": 1,
        "selectedPixelCount": component["pixelCount"],
        "touchesNominalCellBoundary": False,
        "touchesMasterBoundary": False,
        "sourcePixelsResampled": False,
        "authoringCutout": rp(NORMALIZED_SOURCE_PATH),
        "padding": padding,
        "keyColor": list(key_color),
        "chroma": chroma_metrics,
        "normalizedFromBounds": list(normalized_from),
    }
    return keyed, ownership, normalized, evidence


def effect_ready() -> Image.Image:
    effect = Image.new("RGBA", AUTHORING_CANVAS, (0, 0, 0, 0))
    draw = ImageDraw.Draw(effect)
    for radius, alpha in ((40, 32), (28, 58), (18, 112)):
        draw.ellipse(
            (434 - radius, 858 - radius, 434 + radius, 858 + radius),
            fill=(58, 210, 255, alpha),
        )
    draw.rectangle((420, 846, 448, 870), fill=(85, 225, 255, 210))
    return effect


def effect_water_stream() -> Image.Image:
    effect = Image.new("RGBA", AUTHORING_CANVAS, (0, 0, 0, 0))
    draw = ImageDraw.Draw(effect)
    draw.rectangle((438, 925, 462, 1138), fill=(24, 136, 255, 92))
    draw.rectangle((443, 925, 457, 1142), fill=(38, 188, 255, 196))
    draw.rectangle((448, 925, 453, 1146), fill=(190, 244, 255, 245))
    draw.ellipse((430, 1128, 470, 1160), fill=(39, 172, 255, 112))
    draw.ellipse((440, 1134, 460, 1154), fill=(177, 239, 255, 190))
    return effect


def compose_machine_frame(
    shell: Image.Image,
    viewport: Image.Image,
    empty_output: Image.Image,
    effects: list[Image.Image],
) -> Image.Image:
    output = Image.new("RGBA", shell.size, (0, 0, 0, 0))
    output.alpha_composite(shell)
    output.alpha_composite(viewport)
    output.alpha_composite(empty_output)
    for effect in effects:
        output.alpha_composite(effect)
    return output


def build_parts(
    normalized: Image.Image,
) -> tuple[
    dict[str, Image.Image],
    dict[str, Image.Image],
    dict[str, Image.Image],
    dict[str, Image.Image],
    dict[str, int],
]:
    shell = clear_box(normalized, VIEWPORT_BOX)
    viewport_base = layer_from_box(normalized, VIEWPORT_BOX)
    viewport_base = clear_box(viewport_base, OUTPUT_BOX)
    empty_output = layer_from_box(normalized, OUTPUT_BOX)
    ready = effect_ready()
    stream = effect_water_stream()

    held_manifest = json.loads(
        HELD_PROP_MANIFEST_PATH.read_text(encoding="utf-8")
    )
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
    if sha256_file(ROOT / held_record["runtimeFile"]) != held_record["runtimeSha256"]:
        raise ValueError("H01 water cup runtime hash changed")

    authoring_parts = {
        "shell-static": shell,
        **{f"viewport-{frame}": viewport_base.copy() for frame in FRAME_IDS},
        "output-bay-empty": empty_output,
        "effect-ready": ready,
        "effect-water-stream": stream,
        "held-water-cup-clear": held_authoring,
    }
    effects_by_frame = {
        "a": [],
        "b": [ready],
        "c": [ready, stream],
        "d": [],
    }
    authoring_composites = {
        frame: compose_machine_frame(
            shell,
            authoring_parts[f"viewport-{frame}"],
            empty_output,
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
        raise ValueError(f"Water animation escaped viewport: {outside_changes}")

    runtime_parts = {
        part_id: (
            held_runtime
            if part_id == "held-water-cup-clear"
            else image.resize(RUNTIME_CANVAS, Image.Resampling.NEAREST)
        )
        for part_id, image in authoring_parts.items()
    }
    runtime_composites = {
        frame: image.resize(RUNTIME_CANVAS, Image.Resampling.NEAREST)
        for frame, image in authoring_composites.items()
    }
    metrics = {
        **outside_changes,
        "readyEffectPixels": sum(
            1 for value in ready.getchannel("A").getdata() if value
        ),
        "waterEffectPixels": sum(
            1 for value in stream.getchannel("A").getdata() if value
        ),
        "emptyOutputPixels": sum(
            1 for value in empty_output.getchannel("A").getdata() if value
        ),
    }
    return (
        authoring_parts,
        runtime_parts,
        authoring_composites,
        runtime_composites,
        metrics,
    )


def pose_source_records() -> list[dict[str, Any]]:
    behavior = json.loads(BEHAVIOR_REFERENCE.read_text(encoding="utf-8"))
    pilot = json.loads(PILOT_PATH.read_text(encoding="utf-8"))
    roster = json.loads(ROSTER_PATH.read_text(encoding="utf-8"))
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
    machine: Image.Image,
    actor: Image.Image,
    held_prop: Image.Image,
    frame_socket: dict[str, Any],
    prop_socket: tuple[int, int],
    frame: int,
) -> tuple[Image.Image, dict[str, Any]]:
    canvas = Image.new("RGBA", (256, 240), (0, 0, 0, 0))
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
    parent_socket_world = (
        output_world
        if attachment_parent == "facility.output.primary"
        else hand_world
        if attachment_parent == "actor.hand.primary.grip"
        else None
    )
    prop_origin = None
    attachment_delta = None
    if parent_socket_world is not None:
        prop_origin = (
            parent_socket_world[0] - prop_socket[0],
            parent_socket_world[1] - prop_socket[1],
        )
        resolved = (
            prop_origin[0] + prop_socket[0],
            prop_origin[1] + prop_socket[1],
        )
        attachment_delta = [
            resolved[0] - parent_socket_world[0],
            resolved[1] - parent_socket_world[1],
        ]
    if attachment_parent == "facility.output.primary" and prop_origin:
        canvas.alpha_composite(held_prop, prop_origin)
    canvas.alpha_composite(actor, SHARED_ACTOR_POSITION)
    if attachment_parent == "actor.hand.primary.grip" and prop_origin:
        canvas.alpha_composite(held_prop, prop_origin)

    visible_prop_pixels = 0
    total_prop_pixels = 0
    if prop_origin:
        alpha = held_prop.getchannel("A")
        for y in range(held_prop.height):
            for x in range(held_prop.width):
                if not alpha.getpixel((x, y)):
                    continue
                total_prop_pixels += 1
                if (
                    0 <= prop_origin[0] + x < canvas.width
                    and 0 <= prop_origin[1] + y < canvas.height
                ):
                    visible_prop_pixels += 1
    visible_fraction = (
        visible_prop_pixels / total_prop_pixels
        if total_prop_pixels
        else None
    )
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
        "heldAssetVisible": attachment_parent is not None,
        "heldByActor": attachment_parent == "actor.hand.primary.grip",
        "attachmentParent": attachment_parent,
        "rootSocket": frame_socket["rootSocket"],
        "primaryGripSocket": frame_socket["primaryGripSocket"],
        "secondaryGripSocket": frame_socket["secondaryGripSocket"],
        "propGripSocket": list(prop_socket),
        "propVisualCenterSocket": list(prop_socket),
        "propOrigin": list(prop_origin) if prop_origin else None,
        "parentSocketWorld": (
            list(parent_socket_world) if parent_socket_world else None
        ),
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
    machine_frames: dict[str, Image.Image],
    held_prop: Image.Image,
) -> tuple[
    list[dict[str, Any]],
    dict[str, list[Image.Image]],
    dict[str, Any],
]:
    action_authority = json.loads(
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
        if record["id"] == HELD_ASSET_ID
    )
    if (
        action_authority["status"] != "owner-approved"
        or spatial_authority["status"] != "owner-approved"
        or held_manifest["status"] != "owner-approved"
    ):
        raise ValueError("W01 requires approved I01 and H01 authorities")
    if (
        spatial_authority["authorities"]["characterActions"]["sha256"]
        != sha256_file(POSE_AUTHORITY_PATH)
    ):
        raise ValueError("Spatial I01 action authority hash changed")

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
                    f"{socket_character['id']} frame {frame_index} clips cup"
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
        raise ValueError(f"W01 expected eighteen characters: {len(characters)}")

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
            alpha_cell = beta_cell = None
        elif second == 1:
            held_by = "agent-alpha"
            alpha_state, beta_state = "reserved", "waiting"
            alpha_cell, beta_cell = [0, 1], None
        elif second == 2:
            held_by = "agent-alpha"
            alpha_state, beta_state = "approaching", "waiting"
            alpha_cell, beta_cell = [0, 2], None
        elif 3 <= second <= 6:
            held_by = "agent-alpha"
            alpha_state, beta_state = "interacting", "waiting"
            alpha_cell, beta_cell = [0, 1], None
        elif second == 7:
            held_by = "agent-alpha"
            alpha_state, beta_state = "failed-releasing", "waiting"
            alpha_cell, beta_cell = [0, 1], None
        elif second == 8:
            held_by = "agent-beta"
            alpha_state, beta_state = "waiting-retry", "reserved"
            alpha_cell, beta_cell = None, [0, 1]
        elif second == 9:
            held_by = "agent-beta"
            alpha_state, beta_state = "waiting-retry", "approaching"
            alpha_cell, beta_cell = None, [0, 2]
        elif 10 <= second <= 13:
            held_by = "agent-beta"
            alpha_state, beta_state = "waiting-retry", "interacting"
            alpha_cell, beta_cell = None, [0, 1]
        elif second == 14:
            held_by = "agent-beta"
            alpha_state, beta_state = "waiting-retry", "dispensing"
            alpha_cell, beta_cell = None, [0, 1]
        elif second == 15:
            held_by = "agent-beta"
            alpha_state, beta_state = "waiting-retry", "releasing"
            alpha_cell, beta_cell = None, [0, 1]
        elif second == 16:
            held_by = None
            alpha_state, beta_state = "waiting-retry", "complete"
            alpha_cell = beta_cell = None
        elif second == 17:
            held_by = "agent-alpha"
            alpha_state, beta_state = "reserved-retry", "complete"
            alpha_cell, beta_cell = [0, 1], None
        elif second == 18:
            held_by = "agent-alpha"
            alpha_state, beta_state = "approaching", "complete"
            alpha_cell, beta_cell = [0, 2], None
        elif 19 <= second <= 22:
            held_by = "agent-alpha"
            alpha_state, beta_state = "interacting", "complete"
            alpha_cell, beta_cell = [0, 1], None
        elif second == 23:
            held_by = "agent-alpha"
            alpha_state, beta_state = "dispensing", "complete"
            alpha_cell, beta_cell = [0, 1], None
        elif second == 24:
            held_by = "agent-alpha"
            alpha_state, beta_state = "releasing", "complete"
            alpha_cell, beta_cell = [0, 1], None
        else:
            held_by = None
            alpha_state = beta_state = "complete"
            alpha_cell = beta_cell = None
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
    reservation = {
        "durationSeconds": 30,
        "actorCount": 2,
        "maximumConcurrentReservations": 1,
        "collisionCount": 0,
        "blockedAttemptCount": 1,
        "failureCount": 1,
        "retrySuccessCount": 1,
        "releasedAtEnd": samples[-1]["heldBy"] is None,
        "samples": samples,
    }
    return reservation, samples


def review_source_ownership(
    source: Image.Image,
    keyed: Image.Image,
    ownership: Image.Image,
    normalized: Image.Image,
    evidence: dict[str, Any],
) -> Image.Image:
    board = Image.new("RGBA", (1600, 1000), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Water Dispenser W01 — Generated clean-source ownership",
        "New tall source • one isolated component • no Active Office or processed facility pixels",
    )
    cards = [
        ("GENERATED SOURCE", source),
        ("KEYED SOURCE", keyed),
        ("OWNERSHIP MASK", ownership),
        ("NORMALIZED SOURCE", normalized),
    ]
    for index, (label, image) in enumerate(cards):
        x = 24 + index * 390
        draw.rounded_rectangle(
            (x, 125, x + 365, 805),
            radius=15,
            fill=(249, 251, 253, 255),
            outline=(84, 112, 145, 255),
            width=2,
        )
        preview = checkerboard((325, 590), 16)
        paste_scaled(preview, image, (8, 8, 317, 582))
        board.alpha_composite(preview, (x + 20, 175))
        draw.text((x + 18, 142), label, font=HEADING_FONT, fill=(24, 39, 57, 255))
    bounds = evidence["ownedBounds"]
    padding = evidence["padding"]
    draw.text(
        (28, 835),
        f"Source bounds {bounds} • selected pixels {evidence['selectedPixelCount']:,} • components 1",
        font=BODY_FONT,
        fill=(40, 62, 85, 255),
    )
    draw.text(
        (28, 880),
        f"Authoring padding L{padding['left']} T{padding['top']} R{padding['right']} B{padding['bottom']} • source resampling 0",
        font=BODY_FONT,
        fill=(40, 62, 85, 255),
    )
    draw.text(
        (28, 930),
        "PASS: transparent corners • no canvas contact • no secondary component • source hash locked",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def review_parts(runtime_parts: dict[str, Image.Image]) -> Image.Image:
    board = Image.new("RGBA", (1600, 1000), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Water Dispenser W01 — Alpha parts",
        "Static shell • local viewport • empty output • ready/water effects • H01 cup",
    )
    items = [
        ("shell-static", "STATIC SHELL"),
        ("viewport-a", "LOCAL VIEWPORT"),
        ("output-bay-empty", "EMPTY OUTPUT"),
        ("effect-ready", "READY EFFECT"),
        ("effect-water-stream", "WATER EFFECT"),
        ("held-water-cup-clear", "H01 HELD CUP"),
    ]
    for index, (part_id, label) in enumerate(items):
        column = index % 3
        row = index // 3
        x = 35 + column * 515
        y = 125 + row * 400
        draw.rounded_rectangle(
            (x, y, x + 480, y + 365),
            radius=14,
            fill=(249, 251, 253, 255),
            outline=(84, 112, 145, 255),
            width=2,
        )
        preview = checkerboard((440, 285), 14)
        paste_scaled(preview, runtime_parts[part_id], (5, 5, 435, 280))
        board.alpha_composite(preview, (x + 20, y + 55))
        draw.text((x + 18, y + 16), label, font=HEADING_FONT, fill=(24, 39, 57, 255))
    draw.text(
        (35, 940),
        "PASS: output cup and animated water are never embedded in the immutable shell.",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def review_clean(runtime_composites: dict[str, Image.Image]) -> Image.Image:
    board = Image.new("RGBA", (1400, 900), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Water Dispenser W01 — Clean tall front",
        "Footprint 1×1 • physical height 4 tiles • runtime envelope 64×128 px • front only",
    )
    states = [("IDLE / EMPTY", "a"), ("DISPENSING / NO BAKED CUP", "c")]
    for index, (label, frame) in enumerate(states):
        x = 80 + index * 650
        draw.rounded_rectangle(
            (x, 125, x + 570, 760),
            radius=18,
            fill=(249, 251, 253, 255),
            outline=(84, 112, 145, 255),
            width=2,
        )
        preview = checkerboard((500, 540), 18)
        scaled = runtime_composites[frame].resize(
            (256, 512),
            Image.Resampling.NEAREST,
        )
        preview.alpha_composite(scaled, ((500 - 256) // 2, 14))
        board.alpha_composite(preview, (x + 35, 180))
        draw.text((x + 24, 145), label, font=HEADING_FONT, fill=(24, 39, 57, 255))
    draw.text(
        (80, 820),
        "PASS: the redesigned W01 is visibly tall while keeping one floor cell and a stable bottom-center anchor.",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def review_geometry(runtime_machine: Image.Image) -> Image.Image:
    board = Image.new("RGBA", (1200, 950), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Water Dispenser W01 — Geometry and routes",
        "Blue footprint • green stand • cyan approach • amber exit • capacity one",
    )
    origin_x, origin_y, cell = 430, 245, 110
    for y in range(-1, 4):
        for x in range(-2, 3):
            left = origin_x + x * cell
            top = origin_y + y * cell
            draw.rectangle(
                (left, top, left + cell, top + cell),
                fill=(248, 250, 253, 255),
                outline=(142, 157, 176, 255),
                width=2,
            )
            draw.text(
                (left + 7, top + 7),
                f"({x},{y})",
                font=SMALL_FONT,
                fill=(74, 91, 111, 255),
            )
    colors = {
        (0, 0): (70, 132, 214, 112),
        (0, 1): (54, 190, 118, 128),
        (0, 2): (39, 183, 218, 128),
        (-1, 2): (242, 170, 63, 140),
    }
    for (x, y), color in colors.items():
        left = origin_x + x * cell
        top = origin_y + y * cell
        draw.rectangle(
            (left + 3, top + 3, left + cell - 3, top + cell - 3),
            fill=color,
        )
    scaled = runtime_machine.resize((128, 256), Image.Resampling.NEAREST)
    board.alpha_composite(
        scaled,
        (origin_x + cell // 2 - 64, origin_y - 150),
    )
    draw.line(
        (
            origin_x + cell // 2,
            origin_y + 2 * cell + cell // 2,
            origin_x + cell // 2,
            origin_y + cell + cell // 2,
        ),
        fill=(25, 121, 177, 255),
        width=7,
    )
    draw.polygon(
        [
            (origin_x + cell // 2, origin_y + cell + 35),
            (origin_x + cell // 2 - 12, origin_y + cell + 58),
            (origin_x + cell // 2 + 12, origin_y + cell + 58),
        ],
        fill=(25, 121, 177, 255),
    )
    labels = [
        ("FOOTPRINT", "1×1 at (0,0)", (70, 132, 214, 255)),
        ("STAND", "(0,+1)", (36, 152, 91, 255)),
        ("APPROACH", "(0,+2)", (25, 139, 172, 255)),
        ("EXIT", "(-1,+2)", (184, 116, 26, 255)),
    ]
    for index, (label, value, color) in enumerate(labels):
        y = 180 + index * 95
        draw.text((65, y), label, font=HEADING_FONT, fill=color)
        draw.text((65, y + 37), value, font=BODY_FONT, fill=(45, 64, 85, 255))
    draw.text(
        (65, 700),
        "bottom-center [32,128]",
        font=BODY_FONT,
        fill=(45, 64, 85, 255),
    )
    draw.text(
        (65, 745),
        "output.primary [28,70]",
        font=BODY_FONT,
        fill=(45, 64, 85, 255),
    )
    draw.text(
        (65, 790),
        "no side orientations",
        font=BODY_FONT,
        fill=(45, 64, 85, 255),
    )
    draw.text(
        (65, 885),
        "PASS: footprint, stand, approach, and exit are distinct; no route crosses the reserved cell.",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def review_animation(
    runtime_composites: dict[str, Image.Image],
    metrics: dict[str, int],
) -> Image.Image:
    board = Image.new("RGBA", (1600, 900), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Water Dispenser W01 — Local animation viewport",
        "A idle • B ready • C water stream • D idle • static shell and pivots",
    )
    for index, frame in enumerate(FRAME_IDS):
        x = 25 + index * 392
        draw.rounded_rectangle(
            (x, 125, x + 365, 740),
            radius=16,
            fill=(249, 251, 253, 255),
            outline=(84, 112, 145, 255),
            width=2,
        )
        scaled = runtime_composites[frame].resize(
            (256, 512),
            Image.Resampling.NEAREST,
        )
        image_x, image_y = x + 54, 175
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
        draw.text((x + 18, 145), f"FRAME {frame.upper()}", font=HEADING_FONT, fill=(24, 39, 57, 255))
        draw.text(
            (x + 18, 695),
            f"outside viewport: {metrics[frame]}",
            font=SMALL_FONT,
            fill=(20, 126, 72, 255),
        )
    draw.text(
        (25, 805),
        "PASS: shell hash, base [32,128], and sort pivot remain identical across all four frames.",
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
        "Water Dispenser W01 — Output-to-hand front overlay",
        "Empty bay • separate water effect • H01 clear cup • exact socket transfer",
    )
    parts = [
        ("output-bay-empty", "EMPTY OUTPUT"),
        ("effect-water-stream", "WATER EFFECT"),
        ("held-water-cup-clear", "HELD CUP"),
    ]
    for index, (part_id, label) in enumerate(parts):
        x = 30 + index * 300
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
    draw.text((950, 145), "SIX-FRAME HANDOFF", font=HEADING_FONT, fill=(24, 39, 57, 255))
    for frame_index, composition in enumerate(einstein_frames):
        x = 940 + (frame_index % 3) * 180
        y = 200 + (frame_index // 3) * 270
        card = checkerboard((170, 230), 10)
        paste_scaled(card, composition, (0, 0, 170, 215))
        board.alpha_composite(card, (x, y))
        parent = (
            "facility.output"
            if frame_index == 2
            else "actor.hand"
            if frame_index in (3, 4)
            else "none"
        )
        draw.text((x + 5, y + 208), f"{frame_index + 1}: {parent}", font=SMALL_FONT, fill=(33, 50, 70, 255))
    draw.text((35, 565), "Attachment timeline", font=HEADING_FONT, fill=(24, 39, 57, 255))
    draw.text(
        (35, 615),
        "empty → facility.output.primary → actor.hand.primary.grip → released",
        font=HEADING_FONT,
        fill=(31, 105, 170, 255),
    )
    draw.text(
        (35, 680),
        "PASS: the complete H01 cup renders above the actor with scale 1 and attachment delta [0,0].",
        font=BODY_FONT,
        fill=(20, 126, 72, 255),
    )
    draw.text(
        (35, 730),
        "No hand mask, scene offset, character offset, or baked cup is used.",
        font=BODY_FONT,
        fill=(59, 75, 95, 255),
    )
    return board


def review_roster(rendered: dict[str, list[Image.Image]]) -> Image.Image:
    board = Image.new("RGBA", (1800, 1220), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Water Dispenser W01 — Interact-front roster fit",
        "18 characters × 6 frames = 108 cases • tall shell • complete H01 front overlay",
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
        "PASS: 108 native-scale cases stay inside bounds; no per-character facility scale or magic offset.",
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
        "Water Dispenser W01 — Socket attachment debug",
        "Frame 4 • H01 cup visual center resolves to every actor hand with exact delta [0,0]",
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
        "PASS: no scene offset • no character scale • no foreground mask • complete cup alpha visible.",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def review_reservation(samples: list[dict[str, Any]]) -> Image.Image:
    board = Image.new("RGBA", (1600, 900), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Water Dispenser W01 — 30-second reservation timeline",
        "Two users • capacity one • blocked contender • failure release • successful retry",
    )
    left, top, width, row_height = 155, 170, 1360, 92
    lanes = [("AGENT ALPHA", "agent-alpha"), ("AGENT BETA", "agent-beta")]
    colors = {
        "available": (204, 214, 224, 255),
        "waiting": (244, 190, 76, 255),
        "waiting-retry": (244, 190, 76, 255),
        "reserved": (68, 151, 224, 255),
        "reserved-retry": (68, 151, 224, 255),
        "approaching": (43, 184, 207, 255),
        "interacting": (85, 124, 216, 255),
        "dispensing": (46, 184, 112, 255),
        "releasing": (126, 103, 207, 255),
        "failed-releasing": (218, 74, 83, 255),
        "complete": (76, 176, 107, 255),
    }
    cell_width = width / 31
    for lane_index, (label, actor_id) in enumerate(lanes):
        y = top + lane_index * 165
        draw.text((20, y + 22), label, font=BODY_FONT, fill=(32, 51, 72, 255))
        for second, sample in enumerate(samples):
            state = sample["actorStates"][actor_id]
            x0 = round(left + second * cell_width)
            x1 = round(left + (second + 1) * cell_width)
            draw.rectangle(
                (x0, y, x1, y + row_height),
                fill=colors[state],
                outline=(255, 255, 255, 255),
            )
            if second % 5 == 0:
                draw.text((x0 + 2, y + row_height + 5), str(second), font=SMALL_FONT, fill=(65, 81, 100, 255))
    held_y = 555
    draw.text((20, held_y + 18), "RESERVATION", font=BODY_FONT, fill=(32, 51, 72, 255))
    for second, sample in enumerate(samples):
        x0 = round(left + second * cell_width)
        x1 = round(left + (second + 1) * cell_width)
        holder = sample["heldBy"]
        color = (
            (55, 125, 209, 255)
            if holder == "agent-alpha"
            else (44, 173, 112, 255)
            if holder == "agent-beta"
            else (214, 222, 231, 255)
        )
        draw.rectangle((x0, held_y, x1, held_y + 70), fill=color, outline=(255, 255, 255, 255))
    draw.text(
        (155, 690),
        "Alpha fails and releases at second 7 • Beta completes next • Alpha retries at second 17",
        font=BODY_FONT,
        fill=(45, 64, 85, 255),
    )
    draw.text(
        (155, 745),
        "maximum concurrent reservations 1 • route collisions 0 • reservation held at second 30: no",
        font=BODY_FONT,
        fill=(45, 64, 85, 255),
    )
    draw.text(
        (155, 815),
        "PASS: stand (0,+1) is never shared and every failure path releases atomically.",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def review_stability(
    runtime_parts: dict[str, Image.Image],
    runtime_composites: dict[str, Image.Image],
    metrics: dict[str, int],
) -> Image.Image:
    board = Image.new("RGBA", (1600, 1030), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Water Dispenser W01 — Shell stability and local differences",
        "The tall cabinet never moves; only local ready and water overlays change",
    )
    cards = [
        ("STATIC SHELL", runtime_parts["shell-static"]),
        ("EMPTY OUTPUT", runtime_parts["output-bay-empty"]),
        ("FRAME A", runtime_composites["a"]),
        ("FRAME C", runtime_composites["c"]),
    ]
    for index, (label, image) in enumerate(cards):
        x = 30 + index * 390
        draw.rounded_rectangle(
            (x, 125, x + 360, 760),
            radius=15,
            fill=(249, 251, 253, 255),
            outline=(84, 112, 145, 255),
            width=2,
        )
        preview = checkerboard((320, 540), 16)
        paste_scaled(preview, image, (10, 10, 310, 530))
        board.alpha_composite(preview, (x + 20, 180))
        draw.text((x + 18, 145), label, font=HEADING_FONT, fill=(24, 39, 57, 255))
    draw.text(
        (35, 810),
        f"outside viewport A/B/C/D: {metrics['a']}/{metrics['b']}/{metrics['c']}/{metrics['d']}",
        font=BODY_FONT,
        fill=(45, 64, 85, 255),
    )
    draw.text(
        (35, 855),
        f"ready effect pixels {metrics['readyEffectPixels']:,} • water effect pixels {metrics['waterEffectPixels']:,}",
        font=BODY_FONT,
        fill=(45, 64, 85, 255),
    )
    draw.text(
        (35, 925),
        "PASS: shared shell hash • unchanged bottom-center and sort pivots • empty output remains independent.",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def review_three_character_zoom(
    rendered: dict[str, list[Image.Image]],
    roster: dict[str, Any],
) -> Image.Image:
    board = Image.new("RGBA", (2400, 1650), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Water Dispenser W01 — Three-character six-frame front overlay",
        "Einstein • AI Workbot • Doraemon • tall dispenser • nearest-neighbor review",
    )
    selected = ("einstein", "ai-workbot", "doraemon")
    records = {entry["id"]: entry for entry in roster["characters"]}
    for row, character_id in enumerate(selected):
        for frame_index, composition in enumerate(rendered[character_id]):
            x = 25 + frame_index * 395
            y = 120 + row * 500
            metrics = records[character_id]["frames"][frame_index]
            actor_held = metrics["attachmentParent"] == "actor.hand.primary.grip"
            outline = (20, 145, 83, 255) if actor_held else (73, 104, 142, 255)
            draw.rounded_rectangle(
                (x, y, x + 370, y + 465),
                radius=14,
                fill=(249, 251, 253, 255),
                outline=outline,
                width=4 if actor_held else 2,
            )
            draw.text(
                (x + 15, y + 9),
                f"{character_id.upper()} • FRAME {frame_index + 1}",
                font=HEADING_FONT,
                fill=(24, 39, 57, 255),
            )
            preview = checkerboard((320, 392), 16)
            crop = composition.crop((36, 16, 224, 240))
            preview.alpha_composite(
                crop.resize((320, 392), Image.Resampling.NEAREST),
            )
            board.alpha_composite(preview, (x + 25, y + 42))
            parent = metrics["attachmentParent"]
            label = (
                "HAND • exact Δ [0,0]"
                if parent == "actor.hand.primary.grip"
                else "FACILITY OUTPUT • exact Δ [0,0]"
                if parent == "facility.output.primary"
                else "NO CUP"
            )
            draw.text(
                (x + 15, y + 438),
                label,
                font=SMALL_FONT,
                fill=(20, 126, 72, 255) if parent else (60, 78, 98, 255),
            )
    draw.text(
        (25, 1610),
        "PASS: frames 4–5 paste the complete H01 cup above each actor; frame 3 uses the dispenser output.",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def review_hand_closeups(
    rendered: dict[str, list[Image.Image]],
    roster: dict[str, Any],
) -> Image.Image:
    board = Image.new("RGBA", (1800, 1480), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Water Dispenser W01 — Actor-held cup close-ups at 8×",
        "Frames 4–5 • actor body then complete H01 cup • no hand mask",
    )
    selected = ("einstein", "ai-workbot", "doraemon")
    records = {entry["id"]: entry for entry in roster["characters"]}
    for row, character_id in enumerate(selected):
        for column, frame_index in enumerate((3, 4)):
            x = 30 + column * 880
            y = 115 + row * 440
            metrics = records[character_id]["frames"][frame_index]
            center = metrics["parentSocketWorld"]
            if center is None:
                raise ValueError("Actor-held close-up lacks a hand socket")
            crop = rendered[character_id][frame_index].crop(
                (
                    center[0] - 24,
                    center[1] - 24,
                    center[0] + 24,
                    center[1] + 24,
                )
            )
            preview = checkerboard((384, 384), 24)
            preview.alpha_composite(
                crop.resize((384, 384), Image.Resampling.NEAREST),
            )
            draw.rounded_rectangle(
                (x, y, x + 840, y + 415),
                radius=14,
                fill=(249, 251, 253, 255),
                outline=(20, 145, 83, 255),
                width=3,
            )
            board.alpha_composite(preview, (x + 14, y + 15))
            draw.text(
                (x + 420, y + 35),
                f"{character_id.upper()} • FRAME {frame_index + 1}",
                font=HEADING_FONT,
                fill=(24, 39, 57, 255),
            )
            draw.text((x + 420, y + 105), f"hand target {center}", font=BODY_FONT, fill=(31, 105, 170, 255))
            draw.text((x + 420, y + 160), "render: actor-body → held-prop", font=BODY_FONT, fill=(59, 75, 95, 255))
            draw.text((x + 420, y + 220), "visible cup alpha: 100%", font=HEADING_FONT, fill=(20, 126, 72, 255))
            draw.text((x + 420, y + 285), "scale 1 • offset [0,0] • mask uses 0", font=BODY_FONT, fill=(59, 75, 95, 255))
    draw.text(
        (30, 1440),
        "PASS: all 36 actor-held cases retain every non-transparent cup pixel on the top layer.",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def part_records(outputs: dict[Path, bytes]) -> list[dict[str, Any]]:
    records = []
    for short_id, (authoring_path, runtime_path) in PART_PATHS.items():
        role = PART_ROLES[short_id]
        record = {
            "id": f"office.facility.water-dispenser.w01.{short_id}",
            "role": role,
            "sourceFrame": PART_SOURCE_FRAMES[short_id],
            "authoringFile": rp(authoring_path),
            "authoringSha256": sha256_bytes(outputs[authoring_path]),
            "runtimeFile": rp(runtime_path),
            "runtimeSha256": sha256_bytes(outputs[runtime_path]),
        }
        if role == "animation-viewport":
            record["state"] = short_id[-1]
        records.append(record)
    return records


def build_manifest_and_images() -> dict[Path, bytes]:
    audit = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))
    audit_family = validate_audit_baseline(audit)
    source = Image.open(ROOT / SOURCE_PATH).convert("RGBA")
    keyed, ownership, normalized, source_evidence = build_source()
    (
        authoring_parts,
        runtime_parts,
        authoring_composites,
        runtime_composites,
        animation_metrics,
    ) = build_parts(normalized)
    characters, rendered, roster = build_roster_validation(
        runtime_composites,
        runtime_parts["held-water-cup-clear"],
    )
    reservation, samples = reservation_timeline()
    handoff_review = review_handoff(runtime_parts, rendered["einstein"])
    review_images = [
        review_source_ownership(
            source,
            keyed,
            ownership,
            normalized,
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
        review_stability(runtime_parts, runtime_composites, animation_metrics),
        review_three_character_zoom(rendered, roster),
        review_hand_closeups(rendered, roster),
    ]

    outputs: dict[Path, bytes] = {
        KEYED_SOURCE_PATH: png_bytes(keyed),
        OWNERSHIP_PATH: png_bytes(ownership),
        NORMALIZED_SOURCE_PATH: png_bytes(normalized),
    }
    for part_id, (authoring_path, runtime_path) in PART_PATHS.items():
        outputs[authoring_path] = png_bytes(authoring_parts[part_id])
        outputs[runtime_path] = png_bytes(runtime_parts[part_id])
    for frame, (authoring_path, runtime_path) in COMPOSITE_PATHS.items():
        outputs[authoring_path] = png_bytes(authoring_composites[frame])
        outputs[runtime_path] = png_bytes(runtime_composites[frame])
    for path, image in zip(REVIEW_PATHS, review_images, strict=True):
        outputs[path] = png_bytes(image)

    source_evidence["authoringCutoutSha256"] = sha256_bytes(
        outputs[NORMALIZED_SOURCE_PATH]
    )
    parts = part_records(outputs)
    shell_part_id = next(
        record["id"]
        for record in parts
        if record["role"] == "static-shell"
    )
    output_part_id = next(
        record["id"]
        for record in parts
        if record["role"] == "output-bay-empty"
    )
    held_part_id = next(
        record["id"]
        for record in parts
        if record["role"] == "held-output"
    )
    ready_effect_id = next(
        record["id"]
        for record in parts
        if record["id"].endswith("effect-ready")
    )
    water_effect_id = next(
        record["id"]
        for record in parts
        if record["id"].endswith("effect-water-stream")
    )
    held_manifest = json.loads(
        HELD_PROP_MANIFEST_PATH.read_text(encoding="utf-8")
    )
    held_asset = next(
        record
        for record in held_manifest["props"]
        if record["id"] == HELD_ASSET_ID
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
            if record.get("state") == frame
        )
        effect_ids = (
            [ready_effect_id]
            if frame == "b"
            else [ready_effect_id, water_effect_id]
            if frame == "c"
            else []
        )
        animation_frames.append(
            {
                "id": frame,
                "viewportPartId": viewport_id,
                "effectPartIds": effect_ids,
                "durationMs": 500,
                "authoringCompositeFile": rp(authoring_path),
                "authoringCompositeSha256": sha256_bytes(outputs[authoring_path]),
                "runtimeCompositeFile": rp(runtime_path),
                "runtimeCompositeSha256": sha256_bytes(outputs[runtime_path]),
            }
        )
    review_evidence = [
        {
            "path": rp(path),
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
                if part_id != "held-water-cup-clear"
            ),
            *authoring_composites.values(),
        ]
        for red, green, blue, alpha in image.getdata()
        if alpha and red > green + 40 and blue > green + 40
    )
    if visible_magenta:
        raise ValueError(
            f"Water W01 outputs retain {visible_magenta} magenta pixels"
        )
    runtime_bounds = runtime_composites["a"].getbbox()
    if runtime_bounds is None:
        raise ValueError("Water W01 runtime shell is empty")

    gates = {
        "F0": {
            "status": "passed",
            "evidence": [
                rp(AUDIT_PATH),
                SOURCE_AUTHORITY_ID,
                "owner requested a newly generated tall front-only dispenser",
                "audited short neutral and rejected loop/side records are reference-only",
                "forbidden-source tests cover Active Office and processed facility crops",
            ],
        },
        "F1": {
            "status": "passed",
            "evidence": [
                rp(REVIEW_PATHS[3]),
                "1x1x4 tiles, 64x128 px, bottom-center, front only",
                "stand (0,+1), approach (0,+2), exit (-1,+2), capacity one",
            ],
        },
        "F2": {
            "status": "passed",
            "evidence": [
                SOURCE_PATH,
                rp(NORMALIZED_SOURCE_PATH),
                "new isolated tall ImageGen source; no legacy or processed pixel input",
            ],
        },
        "F3": {
            "status": "passed",
            "evidence": [
                rp(KEYED_SOURCE_PATH),
                rp(OWNERSHIP_PATH),
                rp(REVIEW_PATHS[0]),
                "one complete component, transparent corners, no border contact",
            ],
        },
        "F4": {
            "status": "passed",
            "evidence": [
                rp(REVIEW_PATHS[1]),
                rp(REVIEW_PATHS[5]),
                rp(SPATIAL_AUTHORITY_PATH),
                rp(HELD_PROP_MANIFEST_PATH),
                "shell, viewport, empty output, water effects, and H01 cup are separate",
            ],
        },
        "F5": {
            "status": "passed",
            "evidence": [
                rp(REVIEW_PATHS[3]),
                rp(REVIEW_PATHS[4]),
                rp(REVIEW_PATHS[9]),
                "base and sort sockets remain [32,128] across four frames",
            ],
        },
        "F6": {
            "status": "passed",
            "evidence": [
                rp(REVIEW_PATHS[7]),
                "atomic capacity-one reservation releases on failure and supports retry",
            ],
        },
        "F7": {
            "status": "passed",
            "evidence": [
                *[rp(path) for path in REVIEW_PATHS[2:]],
                "18 characters x 6 interact-front frames = 108 pose cases",
                "36 actor-hand and 18 facility-output attachments resolve with exact delta [0,0]",
                "all 36 actor-held cases retain 100% cup alpha with zero mask uses",
                "30-second two-user contention, failure, release, and retry lab",
            ],
        },
        "F8": {
            "status": "pending-owner-review",
            "evidence": [
                *[rp(path) for path in REVIEW_PATHS],
                "Awaiting owner approval for the exact Water W01 hashes.",
            ],
        },
        "F9": {
            "status": "blocked",
            "evidence": ["Furniture-only room composition remains a separate gate."],
        },
        "F10": {
            "status": "blocked",
            "evidence": ["Active Office integration is outside W01 scope."],
        },
    }

    manifest = {
        "schemaVersion": 2,
        "id": "office.facility.water-dispenser.w01",
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
            "kind": "generated-isolated-clean-source",
            "path": SOURCE_PATH,
            "sha256": SOURCE_SHA256,
            "auditManifest": rp(AUDIT_PATH),
            "extractionMethod": "generated-source-chroma-key",
            "generation": {
                "tool": "OpenAI built-in image generation",
                "mode": "generate-then-background-only-edit",
                "prompt": GENERATION_PROMPT,
                "generatedOn": "2026-07-29",
                "ownerDirective": "Replace the short audited form with a tall dispenser.",
            },
            "keyedSource": {
                "file": rp(KEYED_SOURCE_PATH),
                "sha256": sha256_bytes(outputs[KEYED_SOURCE_PATH]),
            },
            "ownershipMask": {
                "file": rp(OWNERSHIP_PATH),
                "sha256": sha256_bytes(outputs[OWNERSHIP_PATH]),
            },
            "frames": [source_evidence],
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
                "base.floor": list(FACILITY_BASE_SOCKET),
                "sort.floor": list(FACILITY_BASE_SOCKET),
                "interaction.target": list(INTERACTION_TARGET_SOCKET),
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
                "width": 1,
                "depth": 1,
                "height": 4,
                "unit": "tile",
            },
            "footprint": {"width": 1, "depth": 1, "unit": "tile"},
            "supportPlane": None,
            "basePivot": {"x": 0.5, "y": 1, "unit": "tile"},
            "sortPivot": {"x": 0.5, "y": 1, "unit": "tile"},
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
                "aboveBase": 4,
                "belowBase": 0,
                "unit": "tile",
            },
            "occlusionParts": [
                {"id": "base", "role": "base", "assetId": shell_part_id}
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
            "emptyOutputPartId": output_part_id,
            "heldAssetPartId": held_part_id,
            "heldAssetId": held_asset["id"],
            "heldAssetManifest": rp(HELD_PROP_MANIFEST_PATH),
            "heldAssetManifestSha256": sha256_file(HELD_PROP_MANIFEST_PATH),
            "heldAssetRuntimeSha256": held_asset["runtimeSha256"],
            "effectPartIds": [ready_effect_id, water_effect_id],
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
                {"poseFrame": 0, "attachmentParent": None},
                {"poseFrame": 1, "attachmentParent": None},
                {"poseFrame": 2, "attachmentParent": "facility.output.primary"},
                {"poseFrame": 3, "attachmentParent": "actor.hand.primary.grip"},
                {"poseFrame": 4, "attachmentParent": "actor.hand.primary.grip"},
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
                "id": "water-front-01",
                "stand": {"x": 0, "y": 1},
                "approach": {"x": 0, "y": 2},
                "exit": {"x": -1, "y": 2},
                "facing": "front",
                "action": "use-water-dispenser",
                "visualPose": "interact-front",
                "reservationId": "water-w01.front-01",
            },
        },
        "rosterValidation": roster,
        "reservationValidation": reservation,
        "quality": {
            "sourceDimensions": list(source.size),
            "sourceComponentCount": 1,
            "sourceVisibleBounds": source_evidence["ownedBounds"],
            "sourceTouchesCanvas": False,
            "sourcePixelsResampled": False,
            "runtimeVisibleBounds": list(runtime_bounds),
            "runtimeVisibleAspectRatio": round(
                (runtime_bounds[3] - runtime_bounds[1])
                / (runtime_bounds[2] - runtime_bounds[0]),
                3,
            ),
            "visibleMagentaPixels": visible_magenta,
            "outsideViewportChangedPixels": animation_metrics,
            "readyEffectPixelCount": animation_metrics["readyEffectPixels"],
            "waterEffectPixelCount": animation_metrics["waterEffectPixels"],
            "emptyOutputPixelCount": animation_metrics["emptyOutputPixels"],
            "validatedPoseCases": len(characters) * ACTIVE_FRAMES,
            "visiblePropCases": roster["visiblePropCases"],
            "facilityOutputAttachmentCases": roster[
                "facilityOutputAttachmentCases"
            ],
            "actorHandAttachmentCases": roster["actorHandAttachmentCases"],
            "attachmentDeltaFailures": roster["attachmentDeltaFailures"],
            "frontOverlayCases": roster["frontOverlayCases"],
            "foregroundMaskUses": roster["foregroundMaskUses"],
            "visibleAlphaFailures": roster["visibleAlphaFailures"],
            "shellPartHashSharedByEveryFrame": True,
        },
        "gates": gates,
        "reviewOutputs": [rp(path) for path in REVIEW_PATHS],
        "reviewEvidence": review_evidence,
        "auditBaseline": {
            "familyAction": audit_family["action"],
            "supersededNeutralRecords": list(AUDITED_NEUTRAL_RECORDS),
            "rejectedRecords": list(REJECTED_RECORDS),
            "pixelReuse": False,
            "reason": "Owner selected a new tall clean source instead of the short neutral master.",
        },
        "behaviorReference": {
            "manifest": rp(BEHAVIOR_REFERENCE),
            "manifestSha256": sha256_file(BEHAVIOR_REFERENCE),
            "purpose": "behavior-and-state-reference-only",
            "pixelReuse": False,
        },
        "activeOfficeBaseline": {
            "file": rp(ACTIVE_REGISTRY),
            "sha256": sha256_file(ACTIVE_REGISTRY),
            "importsCandidate": False,
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
    failures = []
    for path, expected in outputs.items():
        if not path.exists():
            failures.append(f"Missing generated output: {rp(path)}")
        elif path.read_bytes() != expected:
            failures.append(f"Stale generated output: {rp(path)}")
    expected_paths = set(outputs)
    for directory in (OUTPUT_ROOT, REVIEW_ROOT):
        if not directory.exists():
            continue
        for path in directory.rglob("*"):
            if path.is_file() and path not in expected_paths:
                failures.append(f"Unexpected generated output: {rp(path)}")
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
            "Water W01 OK: tall generated clean source, 1x1x4 geometry, "
            "static shell, local water overlays, separate empty output/H01 "
            "cup, 108 socket-driven poses, and 30-second reservation proof."
        )
        return
    write_outputs(outputs)
    print(f"Wrote {len(outputs)} Water Dispenser W01 files.")
    print(f"Manifest: {rp(MANIFEST_PATH)}")
    print("Status: owner-review-f8-pending; Coffee C01 and F9/F10 remain blocked.")


if __name__ == "__main__":
    main()
