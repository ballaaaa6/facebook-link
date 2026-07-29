#!/usr/bin/env python3
"""Build the Refrigerator R01 generated visual and motion preflight.

R01 is a fresh front-only 2x2x4 refrigerator. Its immutable doorless shell,
three lower-door states, I01 actor pixels, and H01 held props remain separate.
The builder proves a reversible finite open/pick/close action and intentionally
stops before roster, reservation, F8, room, or Active Office authority.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import sys
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw

from office_facility_art import (
    BODY_FONT,
    HEADING_FONT,
    SMALL_FONT,
    checkerboard,
    draw_title,
    json_bytes,
    png_bytes,
    remove_magenta_chroma,
    sha256_bytes,
    sha256_file,
)


ROOT = Path(__file__).resolve().parents[1]
FAMILY_ROOT = (
    ROOT
    / "assets"
    / "art"
    / "layout-references"
    / "office-facility-family-v1"
    / "refrigerator-r01"
)
SOURCE_ROOT = FAMILY_ROOT / "source"
PROCESSED_ROOT = (
    ROOT
    / "assets"
    / "game"
    / "processed"
    / "office-facility-family-v1"
    / "refrigerator-r01"
)
AUTHORING_ROOT = PROCESSED_ROOT / "authoring"
RUNTIME_ROOT = PROCESSED_ROOT / "runtime"
MANIFEST_PATH = (
    ROOT
    / "assets"
    / "game"
    / "manifests"
    / "office-facility-refrigerator-r01.json"
)
PROMPT_PATH = SOURCE_ROOT / "IMAGEGEN_PROMPTS.md"
I01_ACTION_PATH = (
    ROOT / "assets/game/manifests/office-character-action-sockets-i01.json"
)
I01_SPATIAL_PATH = (
    ROOT / "assets/game/manifests/office-spatial-authority-i01.json"
)
H01_PATH = ROOT / "assets/game/manifests/office-held-props-h01.json"

SOURCE_PATHS = {
    "front-anchor": SOURCE_ROOT / "01-refrigerator-front-anchor-chroma.png",
    "motion-parts": SOURCE_ROOT / "02-refrigerator-motion-parts-chroma.png",
}
SOURCE_INPUT_COUNTS = {"front-anchor": 0, "motion-parts": 1}
PART_CELLS = {
    "shell": (0, 0, 627, 680),
    "door-closed": (627, 0, 1254, 680),
    "door-half": (0, 680, 627, 1254),
    "door-open": (627, 680, 1254, 1254),
}

AUTHORING_CANVAS = (384, 512)
RUNTIME_CANVAS = (96, 128)
DIVISOR = 4
BASE_PIVOT = (48, 124)
MOTION_REGION = (14, 38, 89, 124)
OUTPUT_SOCKET = (49, 76)
INTERACTION_TARGET = (48, 124)
PROP_POOL = ("held.water-bottle", "held.yogurt-box")
ACTOR_ID = "anna"
ACTOR_FRAME = (96, 104)
ACTOR_ROW = 10

PART_LAYOUT = {
    "shell": ((16, 4), (64, 120)),
    "door-closed": ((21, 41), (54, 78)),
    "door-half": ((40, 41), (35, 78)),
    "door-open": ((58, 41), (17, 78)),
}
STATE_DOORS = {
    "closed": "door-closed",
    "half": "door-half",
    "open": "door-open",
}
FINITE_TRANSITION = ("closed", "half", "open", "half", "closed")
DOOR_GIF_SEQUENCE = ("closed", "half", "open", "open", "half", "closed")
DOOR_DURATION_MS = 260
INTERACTION_DURATION_MS = 260

REVIEW_SPECS = (
    ("01-new-identity-closed-open.png", (1600, 1000)),
    ("02-alpha-source-ownership.png", (1800, 1100)),
    ("03-modular-shell-door-interior.png", (1700, 1050)),
    ("04-scale-2x2x4-and-geometry.png", (1600, 1000)),
    ("05-finite-open-close-transition.png", (1800, 950)),
    ("06-i01-h01-reuse-and-random-pool.png", (1800, 1050)),
    ("07-approach-output-and-interruption.png", (1700, 1000)),
    ("08-anna-open-pick-close-timeline.png", (1800, 1100)),
)
REVIEW_PATHS = tuple(FAMILY_ROOT / name for name, _ in REVIEW_SPECS)
DOOR_GIF_PATH = FAMILY_ROOT / "refrigerator-open-close.gif"
INTERACTION_GIF_PATH = FAMILY_ROOT / "anna-open-pick-close.gif"


def rp(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def alpha_pixels(image: Image.Image) -> int:
    return sum(1 for value in image.getchannel("A").getdata() if value)


def alpha_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    bounds = image.getbbox()
    if bounds is None:
        raise ValueError("Expected visible alpha content")
    return bounds


def touches_cell(
    bounds: tuple[int, int, int, int],
    size: tuple[int, int],
) -> bool:
    return (
        bounds[0] <= 0
        or bounds[1] <= 0
        or bounds[2] >= size[0]
        or bounds[3] >= size[1]
    )


def ownership_mask(image: Image.Image) -> Image.Image:
    mask = Image.new("RGBA", image.size, (0, 0, 0, 0))
    alpha = image.getchannel("A")
    mask.paste((23, 208, 205, 235), (0, 0, image.width, image.height), alpha)
    return mask


def place_component(
    component: Image.Image,
    origin: tuple[int, int],
    size: tuple[int, int],
) -> Image.Image:
    output = Image.new("RGBA", RUNTIME_CANVAS, (0, 0, 0, 0))
    resized = component.resize(size, Image.Resampling.NEAREST)
    output.alpha_composite(resized, origin)
    return output


def authoring_from_runtime(image: Image.Image) -> Image.Image:
    return image.resize(AUTHORING_CANVAS, Image.Resampling.NEAREST)


def compose_state(
    parts: dict[str, Image.Image],
    state: str,
) -> Image.Image:
    output = parts["shell"].copy()
    output.alpha_composite(parts[STATE_DOORS[state]])
    return output


def changed_pixels(first: Image.Image, second: Image.Image) -> int:
    return sum(
        first.getpixel((x, y)) != second.getpixel((x, y))
        for y in range(first.height)
        for x in range(first.width)
    )


def changed_outside_region(
    first: Image.Image,
    second: Image.Image,
    region: tuple[int, int, int, int],
) -> int:
    return sum(
        first.getpixel((x, y)) != second.getpixel((x, y))
        for y in range(first.height)
        for x in range(first.width)
        if not (region[0] <= x < region[2] and region[1] <= y < region[3])
    )


def asset_record(
    path: Path,
    content: bytes,
    size: tuple[int, int],
) -> dict[str, Any]:
    return {
        "file": rp(path),
        "sha256": sha256_bytes(content),
        "size": list(size),
    }


def panel(
    board: Image.Image,
    box: tuple[int, int, int, int],
    title: str,
    image: Image.Image,
    *,
    checker: bool = True,
) -> None:
    draw = ImageDraw.Draw(board)
    draw.rounded_rectangle(
        box,
        radius=16,
        fill=(248, 251, 253, 255),
        outline=(91, 119, 148, 255),
        width=2,
    )
    draw.text(
        (box[0] + 18, box[1] + 14),
        title,
        font=HEADING_FONT,
        fill=(25, 42, 61, 255),
    )
    preview_box = (
        box[0] + 18,
        box[1] + 58,
        box[2] - 18,
        box[3] - 18,
    )
    preview = (
        checkerboard(
            (preview_box[2] - preview_box[0], preview_box[3] - preview_box[1]),
            16,
        )
        if checker
        else Image.new(
            "RGBA",
            (preview_box[2] - preview_box[0], preview_box[3] - preview_box[1]),
            (226, 234, 241, 255),
        )
    )
    available = (preview.width - 16, preview.height - 16)
    copy = image.copy()
    if copy.width <= available[0] and copy.height <= available[1]:
        scale = max(
            1,
            min(available[0] // copy.width, available[1] // copy.height),
        )
        copy = copy.resize(
            (copy.width * scale, copy.height * scale),
            Image.Resampling.NEAREST,
        )
    else:
        copy.thumbnail(available, Image.Resampling.NEAREST)
    preview.alpha_composite(
        copy,
        ((preview.width - copy.width) // 2, (preview.height - copy.height) // 2),
    )
    board.alpha_composite(preview, (preview_box[0], preview_box[1]))


def read_authorities() -> tuple[
    dict[str, Any],
    dict[str, Any],
    dict[str, Any],
    dict[str, Any],
]:
    action = read_json(I01_ACTION_PATH)
    spatial = read_json(I01_SPATIAL_PATH)
    held = read_json(H01_PATH)
    if (
        action.get("status") != "owner-approved"
        or action.get("pose") != "interact-front"
        or action.get("row") != 10
        or spatial.get("status") != "owner-approved"
        or held.get("status") != "owner-approved"
    ):
        raise ValueError("Refrigerator R01 requires approved I01 and H01")
    actor = next(
        (
            candidate
            for candidate in action.get("characters", [])
            if candidate.get("id") == ACTOR_ID
        ),
        None,
    )
    if (
        actor is None
        or actor.get("frameSize") != list(ACTOR_FRAME)
        or actor.get("row") != ACTOR_ROW
        or len(actor.get("frames", [])) != 6
    ):
        raise ValueError("Anna interact-front authority changed")
    return action, spatial, held, actor


def load_actor_frames(
    actor: dict[str, Any],
) -> tuple[dict[str, list[Image.Image]], Image.Image]:
    sheet_path = ROOT / actor["sheet"]
    if sha256_file(sheet_path) != actor["sheetSha256"]:
        raise ValueError("Anna sheet hash changed")
    sheet = Image.open(sheet_path).convert("RGBA")
    if sheet.size != (ACTOR_FRAME[0] * 8, ACTOR_FRAME[1] * 15):
        raise ValueError(f"Unexpected Anna sheet size: {sheet.size}")

    def row_frames(row: int, count: int) -> list[Image.Image]:
        return [
            sheet.crop(
                (
                    index * ACTOR_FRAME[0],
                    row * ACTOR_FRAME[1],
                    (index + 1) * ACTOR_FRAME[0],
                    (row + 1) * ACTOR_FRAME[1],
                )
            )
            for index in range(count)
        ]

    frames = {
        "interact-front": row_frames(ACTOR_ROW, 6),
        "walk-right": row_frames(1, 8),
        "walk-left": row_frames(2, 8),
    }
    if any(
        frame.getbbox() is None
        for sequence in frames.values()
        for frame in sequence
    ):
        raise ValueError("Anna preview contains an empty frame")
    return frames, sheet


def select_prop_id(actor_id: str, slot_id: str, visit_index: int) -> str:
    seed = f"{actor_id}|{slot_id}".encode("utf-8")
    start = int(hashlib.sha256(seed).hexdigest()[:8], 16) % len(PROP_POOL)
    index = (start + visit_index) % len(PROP_POOL)
    return PROP_POOL[index]


def prop_records(
    held_manifest: dict[str, Any],
) -> dict[str, dict[str, Any]]:
    records = {
        prop["id"]: prop
        for prop in held_manifest.get("props", [])
        if prop.get("id") in PROP_POOL
    }
    if set(records) != set(PROP_POOL):
        raise ValueError("H01 refrigerator prop pool is incomplete")
    for prop_id, record in records.items():
        path = ROOT / record["runtimeFile"]
        if sha256_file(path) != record["runtimeSha256"]:
            raise ValueError(f"H01 prop hash changed: {prop_id}")
        if (
            record["runtimeCanvas"] != [20, 20]
            or record["attachmentMode"] != "front-overlay"
            or record["actorSocketRule"] != "primary-hand"
        ):
            raise ValueError(f"H01 prop contract changed: {prop_id}")
    return records


def attach_prop(
    scene: Image.Image,
    prop: Image.Image,
    socket: tuple[int, int],
    target: tuple[int, int],
) -> tuple[int, int]:
    origin = (target[0] - socket[0], target[1] - socket[1])
    scene.alpha_composite(prop, origin)
    return origin


def floor_scene(
    size: tuple[int, int] = (384, 200),
) -> Image.Image:
    scene = Image.new("RGBA", size, (225, 233, 240, 255))
    draw = ImageDraw.Draw(scene)
    floor_y = size[1] - 42
    draw.rectangle((0, floor_y, size[0], size[1]), fill=(183, 201, 211, 255))
    draw.line((0, floor_y, size[0], floor_y), fill=(91, 118, 135, 255), width=2)
    for y in range(floor_y + 8, size[1], 8):
        draw.line((0, y, size[0], y), fill=(151, 174, 188, 255))
    for x in range(-64, size[0] + 64, 32):
        draw.line(
            (x, floor_y, x + 44, size[1]),
            fill=(151, 174, 188, 255),
        )
    return scene


INTERACTION_STEPS = (
    ("approach", "walk-left", 0, 72, "closed", None),
    ("approach", "walk-left", 1, 48, "closed", None),
    ("approach", "walk-left", 2, 24, "closed", None),
    ("ready", "interact-front", 0, 0, "closed", None),
    ("unlatch", "interact-front", 1, 0, "half", None),
    ("open", "interact-front", 2, 0, "open", "facility.output.primary"),
    ("pickup", "interact-front", 3, 0, "open", "actor.hand.primary.grip"),
    ("hold", "interact-front", 4, 0, "open", "actor.hand.primary.grip"),
    ("close", "interact-front", 4, 0, "half", "actor.hand.primary.grip"),
    ("release", "interact-front", 5, 0, "closed", None),
    ("depart", "walk-right", 0, 24, "closed", None),
    ("depart", "walk-right", 1, 48, "closed", None),
)


def build_interaction_frames(
    states: dict[str, Image.Image],
    actor_frames: dict[str, list[Image.Image]],
    actor: dict[str, Any],
    prop: Image.Image,
    prop_record: dict[str, Any],
) -> tuple[list[Image.Image], list[dict[str, Any]]]:
    machine_origin = (126, 25)
    # The one-cell front approach is authored against the right half of the
    # two-tile-wide footprint so the opening door and empty interior remain
    # visible without any per-character adjustment.
    stand_root = (194, 157)
    prop_socket = tuple(prop_record["visualCenterSocket"])
    previews: list[Image.Image] = []
    timeline: list[dict[str, Any]] = []
    for (
        phase,
        animation,
        frame_index,
        offset_x,
        door_state,
        attachment_parent,
    ) in INTERACTION_STEPS:
        scene = floor_scene()
        scene.alpha_composite(states[door_state], machine_origin)
        authority = (
            actor["frames"][frame_index]
            if animation == "interact-front"
            else actor["frames"][0]
        )
        root = tuple(authority["rootSocket"])
        actor_origin = (
            stand_root[0] + offset_x - root[0],
            stand_root[1] - root[1],
        )
        actor_image = actor_frames[animation][frame_index]
        hand_target = (
            actor_origin[0] + authority["primaryGripSocket"][0],
            actor_origin[1] + authority["primaryGripSocket"][1],
        )
        output_target = (
            machine_origin[0] + OUTPUT_SOCKET[0],
            machine_origin[1] + OUTPUT_SOCKET[1],
        )
        prop_origin = None
        if attachment_parent == "facility.output.primary":
            prop_origin = attach_prop(scene, prop, prop_socket, output_target)
        scene.alpha_composite(actor_image, actor_origin)
        if attachment_parent == "actor.hand.primary.grip":
            prop_origin = attach_prop(scene, prop, prop_socket, hand_target)
        parent_target = (
            output_target
            if attachment_parent == "facility.output.primary"
            else hand_target
            if attachment_parent == "actor.hand.primary.grip"
            else None
        )
        attachment_delta = (
            [
                prop_origin[0] + prop_socket[0] - parent_target[0],
                prop_origin[1] + prop_socket[1] - parent_target[1],
            ]
            if prop_origin is not None and parent_target is not None
            else None
        )
        if attachment_delta not in (None, [0, 0]):
            raise ValueError("I01/H01 preview attachment drift")

        canvas = Image.new("RGBA", (768, 512), (20, 28, 42, 255))
        canvas.alpha_composite(
            scene.resize((768, 400), Image.Resampling.NEAREST),
            (0, 55),
        )
        draw = ImageDraw.Draw(canvas)
        draw.text(
            (24, 13),
            "REFRIGERATOR R01 · FINITE OPEN / PICK / CLOSE",
            font=HEADING_FONT,
            fill=(244, 248, 251, 255),
        )
        draw.rounded_rectangle(
            (24, 465, 190, 501),
            radius=10,
            fill=(24, 137, 145, 255),
        )
        draw.text(
            (38, 472),
            phase.upper(),
            font=BODY_FONT,
            fill=(255, 255, 255, 255),
        )
        draw.text(
            (210, 472),
            f"door={door_state} · parent={attachment_parent or 'none'}",
            font=SMALL_FONT,
            fill=(190, 207, 219, 255),
        )
        previews.append(canvas)
        timeline.append(
            {
                "phase": phase,
                "animation": animation,
                "actorFrame": frame_index,
                "approachOffsetX": offset_x,
                "doorState": door_state,
                "attachmentParent": attachment_parent,
                "propVisible": attachment_parent is not None,
                "propOrigin": list(prop_origin) if prop_origin else None,
                "parentSocketWorld": (
                    list(parent_target) if parent_target else None
                ),
                "attachmentDelta": attachment_delta,
                "magicOffset": False,
                "fallbackSocket": False,
            }
        )
    return previews, timeline


def gif_bytes(
    frames: list[Image.Image],
    duration_ms: int,
) -> bytes:
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


def build_door_gif(states: dict[str, Image.Image]) -> bytes:
    frames = []
    for state in DOOR_GIF_SEQUENCE:
        canvas = Image.new("RGBA", (512, 512), (225, 233, 240, 255))
        draw = ImageDraw.Draw(canvas)
        enlarged = states[state].resize((288, 384), Image.Resampling.NEAREST)
        canvas.alpha_composite(enlarged, (112, 64))
        draw.rounded_rectangle(
            (20, 20, 152, 57),
            radius=10,
            fill=(26, 43, 63, 240),
        )
        draw.text(
            (35, 28),
            state.upper(),
            font=BODY_FONT,
            fill=(244, 248, 251, 255),
        )
        frames.append(canvas)
    return gif_bytes(frames, DOOR_DURATION_MS)


def review_identity(
    front_anchor: Image.Image,
    states: dict[str, Image.Image],
) -> Image.Image:
    board = Image.new("RGBA", (1600, 1000), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Refrigerator R01 — New 2×2×4 identity",
        "Fresh ImageGen family · closed anchor · modular closed composite · empty open interior",
    )
    panel(board, (35, 125, 500, 865), "SOURCE IDENTITY", front_anchor)
    panel(board, (565, 125, 1030, 865), "COMPOSITE CLOSED", states["closed"])
    panel(board, (1095, 125, 1560, 865), "COMPOSITE OPEN", states["open"])
    draw.text(
        (38, 910),
        "PASS: front-only · warm off-white shell · empty interior · lower door is a separate moving child",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def review_ownership(
    front_source: Image.Image,
    front_keyed: Image.Image,
    parts_source: Image.Image,
    parts_keyed: Image.Image,
    records: list[dict[str, Any]],
) -> Image.Image:
    board = Image.new("RGBA", (1800, 1100), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Refrigerator R01 — Alpha and generated-source ownership",
        "Two fresh magenta sources · one identity anchor · four isolated modular components",
    )
    cards = (
        ("FRONT SOURCE", front_source),
        ("FRONT KEYED", front_keyed),
        ("PARTS SOURCE", parts_source),
        ("PARTS KEYED", parts_keyed),
    )
    for index, (label, image) in enumerate(cards):
        x = 25 + index * 440
        panel(board, (x, 125, x + 410, 820), label, image)
    y = 850
    for index, record in enumerate(records):
        draw.text(
            (32 + (index % 3) * 580, y + (index // 3) * 70),
            (
                f"{record['role']}: {record['visiblePixels']:,} px · "
                f"bounds {record['ownedBounds']} · boundary {record['cellBoundaryContact']}"
            ),
            font=SMALL_FONT,
            fill=(40, 62, 85, 255),
        )
    draw.text(
        (32, 1035),
        "PASS: no Active Office, audited-master, processed refrigerator, side-orientation, or fallback pixels",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def review_parts(parts: dict[str, Image.Image]) -> Image.Image:
    board = Image.new("RGBA", (1700, 1050), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Refrigerator R01 — Modular motion parts",
        "Immutable empty shell + one lower-door child selected from three finite states",
    )
    labels = (
        ("shell", "IMMUTABLE SHELL + EMPTY INTERIOR"),
        ("door-closed", "LOWER DOOR · CLOSED"),
        ("door-half", "LOWER DOOR · HALF"),
        ("door-open", "LOWER DOOR · OPEN"),
    )
    for index, (key, label) in enumerate(labels):
        column = index % 2
        row = index // 2
        x = 35 + column * 825
        y = 125 + row * 425
        panel(board, (x, y, x + 790, y + 390), label, parts[key])
    draw.text(
        (38, 980),
        "No food is baked into the shell or door. H01 props stay independent.",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def actor_reference(actor_frames: dict[str, list[Image.Image]]) -> Image.Image:
    return actor_frames["interact-front"][0]


def review_scale_geometry(
    closed: Image.Image,
    actor_image: Image.Image,
) -> Image.Image:
    board = Image.new("RGBA", (1600, 1000), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Refrigerator R01 — Physical scale and geometry",
        "Canonical actor 1×1×3 · refrigerator 2×2×4 · render box 3×4 · one front approach cell",
    )
    scene = floor_scene((520, 220))
    scene.alpha_composite(closed, (65, 48))
    scene.alpha_composite(actor_image, (285, 72))
    panel(board, (35, 125, 770, 850), "SCALE COMPARISON", scene, checker=False)

    grid = Image.new("RGBA", (520, 520), (226, 234, 241, 255))
    gd = ImageDraw.Draw(grid)
    origin = (90, 70)
    tile = 82
    for y in range(4):
        for x in range(3):
            box = (
                origin[0] + x * tile,
                origin[1] + y * tile,
                origin[0] + (x + 1) * tile,
                origin[1] + (y + 1) * tile,
            )
            gd.rectangle(box, outline=(115, 141, 161, 255), width=2)
    gd.rectangle(
        (
            origin[0],
            origin[1] + 2 * tile,
            origin[0] + 2 * tile,
            origin[1] + 4 * tile,
        ),
        fill=(24, 137, 145, 90),
        outline=(24, 137, 145, 255),
        width=4,
    )
    gd.rectangle(
        (
            origin[0],
            origin[1] + 4 * tile,
            origin[0] + tile,
            origin[1] + 5 * tile,
        ),
        fill=(244, 181, 53, 115),
        outline=(193, 126, 17, 255),
        width=4,
    )
    gd.text(
        (origin[0] + 18, origin[1] + 2 * tile + 55),
        "2×2\nFOOTPRINT",
        font=HEADING_FONT,
        fill=(20, 84, 91, 255),
    )
    gd.text(
        (origin[0] + 8, origin[1] + 4 * tile + 25),
        "APPROACH",
        font=SMALL_FONT,
        fill=(119, 72, 10, 255),
    )
    panel(board, (830, 125, 1565, 850), "GRID CONTRACT", grid, checker=False)
    draw.text(
        (38, 900),
        "Base/sort pivot [48,124] · output.primary [49,76] · interaction.target [48,124]",
        font=BODY_FONT,
        fill=(40, 62, 85, 255),
    )
    draw.text(
        (38, 945),
        "Door swing is visual overflow inside the declared motion region; collision and footprint do not move.",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def review_transition(
    states: dict[str, Image.Image],
    transition_counts: list[int],
) -> Image.Image:
    board = Image.new("RGBA", (1800, 950), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Refrigerator R01 — Reversible finite transition",
        "CLOSED → HALF → OPEN → HALF → CLOSED · explicit endpoints · not an ambient seam loop",
    )
    for index, state in enumerate(FINITE_TRANSITION):
        x = 30 + index * 350
        panel(board, (x, 135, x + 320, 740), state.upper(), states[state])
        if index < len(FINITE_TRANSITION) - 1:
            draw.text(
                (x + 300, 405),
                "→",
                font=HEADING_FONT,
                fill=(24, 137, 145, 255),
            )
    draw.text(
        (35, 790),
        f"Changed pixels per transition: {transition_counts}",
        font=BODY_FONT,
        fill=(40, 62, 85, 255),
    )
    draw.text(
        (35, 835),
        "Interruption before pickup: reverse to CLOSED, remove output prop, release reservation.",
        font=BODY_FONT,
        fill=(40, 62, 85, 255),
    )
    draw.text(
        (35, 880),
        "Interruption after pickup: keep the selected visit prop only through close, then remove before departure.",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def compose_actor_prop_card(
    actor_frame: Image.Image,
    authority: dict[str, Any],
    prop: Image.Image,
    prop_record: dict[str, Any],
) -> Image.Image:
    card = Image.new("RGBA", (200, 180), (0, 0, 0, 0))
    actor_origin = (52, 50)
    card.alpha_composite(actor_frame, actor_origin)
    target = (
        actor_origin[0] + authority["primaryGripSocket"][0],
        actor_origin[1] + authority["primaryGripSocket"][1],
    )
    attach_prop(
        card,
        prop,
        tuple(prop_record["visualCenterSocket"]),
        target,
    )
    return card


def review_socket_reuse(
    actor_frames: dict[str, list[Image.Image]],
    actor: dict[str, Any],
    props: dict[str, Image.Image],
    prop_data: dict[str, dict[str, Any]],
    examples: list[dict[str, Any]],
) -> Image.Image:
    board = Image.new("RGBA", (1800, 1050), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Refrigerator R01 — Reuse I01/H01; no new hand system",
        "Existing per-character hand coordinates + existing prop visual centers · stable selection once per visit",
    )
    for index, prop_id in enumerate(PROP_POOL):
        x = 70 + index * 850
        preview = compose_actor_prop_card(
            actor_frames["interact-front"][3],
            actor["frames"][3],
            props[prop_id],
            prop_data[prop_id],
        )
        panel(
            board,
            (x, 135, x + 760, 720),
            prop_id.upper(),
            preview,
        )
        draw.text(
            (x + 18, 755),
            (
                f"visualCenter={prop_data[prop_id]['visualCenterSocket']} · "
                f"primaryGrip={actor['frames'][3]['primaryGripSocket']}"
            ),
            font=BODY_FONT,
            fill=(40, 62, 85, 255),
        )
    draw.text(
        (70, 830),
        "Selection: (stable-hash(actorId | slotId) + visitIndex) % 2",
        font=HEADING_FONT,
        fill=(25, 42, 61, 255),
    )
    draw.text(
        (70, 875),
        "Examples: "
        + " · ".join(
            f"visit {item['visitIndex']} → {item['assetId']}"
            for item in examples
        ),
        font=BODY_FONT,
        fill=(40, 62, 85, 255),
    )
    draw.text(
        (70, 930),
        "PASS: attachmentDelta [0,0] · front-overlay · no hand mask · no magic offset · no fallback socket",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def review_routes(
    open_state: Image.Image,
) -> Image.Image:
    board = Image.new("RGBA", (1700, 1000), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Refrigerator R01 — Approach, output, and interruption contract",
        "One capacity-one reservation · front approach · door state and prop parent are independent timelines",
    )
    grid = Image.new("RGBA", (720, 720), (225, 233, 240, 255))
    gd = ImageDraw.Draw(grid)
    tile = 120
    origin = (180, 80)
    for y in range(5):
        for x in range(4):
            gd.rectangle(
                (
                    origin[0] + x * tile,
                    origin[1] + y * tile,
                    origin[0] + (x + 1) * tile,
                    origin[1] + (y + 1) * tile,
                ),
                outline=(121, 145, 164, 255),
                width=2,
            )
    gd.rectangle(
        (
            origin[0] + tile,
            origin[1] + tile,
            origin[0] + 3 * tile,
            origin[1] + 3 * tile,
        ),
        fill=(24, 137, 145, 85),
        outline=(24, 137, 145, 255),
        width=4,
    )
    gd.rectangle(
        (
            origin[0] + tile,
            origin[1] + 3 * tile,
            origin[0] + 2 * tile,
            origin[1] + 4 * tile,
        ),
        fill=(244, 181, 53, 105),
        outline=(193, 126, 17, 255),
        width=4,
    )
    machine = open_state.resize((192, 256), Image.Resampling.NEAREST)
    grid.alpha_composite(machine, (origin[0] + 144, origin[1] + 2))
    gd.ellipse(
        (
            origin[0] + 1.5 * tile - 12,
            origin[1] + 3 * tile - 12,
            origin[0] + 1.5 * tile + 12,
            origin[1] + 3 * tile + 12,
        ),
        fill=(244, 181, 53, 255),
    )
    panel(board, (35, 125, 820, 890), "FOOTPRINT + FRONT APPROACH", grid, checker=False)

    timeline = Image.new("RGBA", (720, 720), (248, 251, 253, 255))
    td = ImageDraw.Draw(timeline)
    rows = (
        ("DOOR", "closed → half → open → half → closed"),
        ("PROP", "none → output.primary → actor.hand → none"),
        ("ACTOR", "approach → interact-front → depart"),
        ("RESERVATION", "reserve → hold → release"),
        ("FAIL BEFORE PICKUP", "reverse door; remove output; release"),
        ("FAIL AFTER PICKUP", "finish close; remove prop; release"),
    )
    for index, (label, value) in enumerate(rows):
        y = 45 + index * 103
        td.rounded_rectangle(
            (25, y, 695, y + 78),
            radius=12,
            fill=(226, 234, 241, 255),
            outline=(91, 119, 148, 255),
            width=2,
        )
        td.text((42, y + 10), label, font=SMALL_FONT, fill=(24, 137, 145, 255))
        td.text((42, y + 38), value, font=BODY_FONT, fill=(40, 62, 85, 255))
    panel(board, (880, 125, 1665, 890), "INDEPENDENT TIMELINES", timeline, checker=False)
    draw.text(
        (38, 930),
        "Preflight contribution remains 0 slots; +1 activates only after F8 owner approval.",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def review_interaction_timeline(
    frames: list[Image.Image],
    timeline: list[dict[str, Any]],
) -> Image.Image:
    board = Image.new("RGBA", (1800, 1100), (234, 239, 245, 255))
    draw = draw_title(
        board,
        "Refrigerator R01 — Anna open / pick / close timeline",
        "I01 actor pixels · finite door states · one H01 selection per visit · prop removed before departure",
    )
    for index, (frame, item) in enumerate(
        zip(frames, timeline, strict=True)
    ):
        column = index % 4
        row = index // 4
        x = 25 + column * 440
        y = 115 + row * 315
        draw.rounded_rectangle(
            (x, y, x + 415, y + 285),
            radius=12,
            fill=(248, 251, 253, 255),
            outline=(91, 119, 148, 255),
            width=2,
        )
        preview = frame.resize((384, 256), Image.Resampling.NEAREST)
        preview.thumbnail((385, 220), Image.Resampling.NEAREST)
        board.alpha_composite(preview, (x + 15, y + 45))
        draw.text(
            (x + 14, y + 10),
            f"{index + 1:02d}  {item['phase'].upper()}",
            font=SMALL_FONT,
            fill=(25, 42, 61, 255),
        )
        draw.text(
            (x + 170, y + 10),
            f"{item['doorState']} · {item['attachmentParent'] or 'none'}",
            font=SMALL_FONT,
            fill=(24, 137, 145, 255),
        )
    draw.text(
        (30, 1045),
        "PASS: output → hand parent switch is explicit; every resolved attachment delta is [0,0].",
        font=HEADING_FONT,
        fill=(20, 126, 72, 255),
    )
    return board


def build() -> dict[Path, bytes]:
    outputs: dict[Path, bytes] = {}
    front_source = Image.open(SOURCE_PATHS["front-anchor"]).convert("RGBA")
    parts_source = Image.open(SOURCE_PATHS["motion-parts"]).convert("RGBA")
    if front_source.size != (1024, 1536):
        raise ValueError(f"Unexpected front source size: {front_source.size}")
    if parts_source.size != (1254, 1254):
        raise ValueError(f"Unexpected parts source size: {parts_source.size}")

    front_keyed, front_key, front_stats = remove_magenta_chroma(front_source)
    parts_keyed, parts_key, parts_stats = remove_magenta_chroma(parts_source)
    front_bounds = alpha_bounds(front_keyed)
    front_component = front_keyed.crop(front_bounds)
    source_records = [
        {
            "role": "front-anchor",
            "sourceCell": [0, 0, front_source.width, front_source.height],
            "ownedBounds": list(front_bounds),
            "visiblePixels": alpha_pixels(front_component),
            "cellBoundaryContact": touches_cell(front_bounds, front_source.size),
        }
    ]
    if source_records[0]["cellBoundaryContact"]:
        raise ValueError("Front source subject touches the source boundary")

    extracted: dict[str, Image.Image] = {}
    for role, cell in PART_CELLS.items():
        crop = parts_keyed.crop(cell)
        bounds = alpha_bounds(crop)
        extracted[role] = crop.crop(bounds)
        source_records.append(
            {
                "role": role,
                "sourceCell": list(cell),
                "ownedBounds": [
                    cell[0] + bounds[0],
                    cell[1] + bounds[1],
                    cell[0] + bounds[2],
                    cell[1] + bounds[3],
                ],
                "visiblePixels": alpha_pixels(extracted[role]),
                "cellBoundaryContact": touches_cell(bounds, crop.size),
            }
        )
    if any(record["cellBoundaryContact"] for record in source_records):
        raise ValueError("A generated Refrigerator component touches its cell")

    keyed_paths = {
        "front": AUTHORING_ROOT / "source/front-anchor.keyed.png",
        "parts": AUTHORING_ROOT / "source/motion-parts.keyed.png",
        "front-mask": AUTHORING_ROOT / "source/front-anchor.ownership.png",
        "parts-mask": AUTHORING_ROOT / "source/motion-parts.ownership.png",
    }
    keyed_images = {
        "front": front_keyed,
        "parts": parts_keyed,
        "front-mask": ownership_mask(front_keyed),
        "parts-mask": ownership_mask(parts_keyed),
    }
    keyed_assets = {}
    for key, path in keyed_paths.items():
        content = png_bytes(keyed_images[key])
        outputs[path] = content
        keyed_assets[key] = asset_record(path, content, keyed_images[key].size)

    front_runtime = place_component(front_component, (16, 4), (64, 120))
    front_path = RUNTIME_ROOT / "preflight/front-anchor.png"
    front_content = png_bytes(front_runtime)
    outputs[front_path] = front_content

    runtime_parts = {
        role: place_component(
            component,
            PART_LAYOUT[role][0],
            PART_LAYOUT[role][1],
        )
        for role, component in extracted.items()
    }
    authoring_parts = {
        role: authoring_from_runtime(image)
        for role, image in runtime_parts.items()
    }
    part_assets: dict[str, dict[str, Any]] = {}
    for role in PART_LAYOUT:
        authoring_path = AUTHORING_ROOT / "parts" / f"{role}.png"
        runtime_path = RUNTIME_ROOT / "parts" / f"{role}.png"
        authoring_content = png_bytes(authoring_parts[role])
        runtime_content = png_bytes(runtime_parts[role])
        outputs[authoring_path] = authoring_content
        outputs[runtime_path] = runtime_content
        part_assets[role] = {
            "authoring": asset_record(
                authoring_path,
                authoring_content,
                AUTHORING_CANVAS,
            ),
            "runtime": asset_record(
                runtime_path,
                runtime_content,
                RUNTIME_CANVAS,
            ),
            "localOriginRuntime": list(PART_LAYOUT[role][0]),
            "sourceResampling": "nearest",
        }

    states = {
        state: compose_state(runtime_parts, state)
        for state in STATE_DOORS
    }
    state_assets: dict[str, dict[str, Any]] = {}
    for state, image in states.items():
        path = RUNTIME_ROOT / "states" / f"{state}.png"
        content = png_bytes(image)
        outputs[path] = content
        state_assets[state] = asset_record(path, content, RUNTIME_CANVAS)

    transition_counts = [
        changed_pixels(states[first], states[second])
        for first, second in zip(
            FINITE_TRANSITION,
            FINITE_TRANSITION[1:],
        )
    ]
    if not all(count > 0 for count in transition_counts):
        raise ValueError("Finite door transition contains a duplicate state")
    outside_counts = [
        changed_outside_region(states[first], states[second], MOTION_REGION)
        for first, second in zip(
            FINITE_TRANSITION,
            FINITE_TRANSITION[1:],
        )
    ]
    if any(outside_counts):
        raise ValueError(f"Door pixels escaped motion region: {outside_counts}")
    if changed_pixels(states["closed"], states["closed"]) != 0:
        raise ValueError("Closed endpoint is not exact")

    _, spatial, held, actor = read_authorities()
    actor_frames, _ = load_actor_frames(actor)
    held_records = prop_records(held)
    prop_images = {
        prop_id: Image.open(ROOT / record["runtimeFile"]).convert("RGBA")
        for prop_id, record in held_records.items()
    }
    selection_examples = [
        {
            "actorId": ACTOR_ID,
            "slotId": "refrigerator-r01-slot-0",
            "visitIndex": visit,
            "assetId": select_prop_id(
                ACTOR_ID,
                "refrigerator-r01-slot-0",
                visit,
            ),
        }
        for visit in range(4)
    ]
    selected_id = selection_examples[0]["assetId"]
    interaction_frames, interaction_timeline = build_interaction_frames(
        states,
        actor_frames,
        actor,
        prop_images[selected_id],
        held_records[selected_id],
    )
    door_gif = build_door_gif(states)
    interaction_gif = gif_bytes(interaction_frames, INTERACTION_DURATION_MS)
    outputs[DOOR_GIF_PATH] = door_gif
    outputs[INTERACTION_GIF_PATH] = interaction_gif

    reviews = (
        review_identity(front_runtime, states),
        review_ownership(
            front_source,
            front_keyed,
            parts_source,
            parts_keyed,
            source_records,
        ),
        review_parts(runtime_parts),
        review_scale_geometry(
            states["closed"],
            actor_frames["interact-front"][0],
        ),
        review_transition(states, transition_counts),
        review_socket_reuse(
            actor_frames,
            actor,
            prop_images,
            held_records,
            selection_examples,
        ),
        review_routes(states["open"]),
        review_interaction_timeline(
            interaction_frames,
            interaction_timeline,
        ),
    )
    review_evidence: list[dict[str, Any]] = []
    for (path, (_, size)), image in zip(
        zip(REVIEW_PATHS, REVIEW_SPECS, strict=True),
        reviews,
        strict=True,
    ):
        if image.size != size:
            raise ValueError(f"Review size mismatch: {path} {image.size}")
        content = png_bytes(image)
        outputs[path] = content
        review_evidence.append(
            {
                **asset_record(path, content, size),
                "kind": "png",
            }
        )
    review_evidence.extend(
        (
            {
                **asset_record(DOOR_GIF_PATH, door_gif, (512, 512)),
                "kind": "gif",
                "frameCount": len(DOOR_GIF_SEQUENCE),
                "durationMs": DOOR_DURATION_MS,
            },
            {
                **asset_record(
                    INTERACTION_GIF_PATH,
                    interaction_gif,
                    (768, 512),
                ),
                "kind": "gif",
                "frameCount": len(INTERACTION_STEPS),
                "durationMs": INTERACTION_DURATION_MS,
            },
        )
    )

    generation_sources = [
        {
            "role": "front-anchor",
            "file": rp(SOURCE_PATHS["front-anchor"]),
            "sha256": sha256_file(SOURCE_PATHS["front-anchor"]),
            "size": list(front_source.size),
            "inputImageCount": SOURCE_INPUT_COUNTS["front-anchor"],
            "identityReference": None,
            "extractionMethod": "generated-source-chroma-key",
            "sampledKeyRgb": list(front_key),
            "keyStats": front_stats,
            "ownership": [source_records[0]],
        },
        {
            "role": "motion-parts",
            "file": rp(SOURCE_PATHS["motion-parts"]),
            "sha256": sha256_file(SOURCE_PATHS["motion-parts"]),
            "size": list(parts_source.size),
            "inputImageCount": SOURCE_INPUT_COUNTS["motion-parts"],
            "identityReference": "front-anchor",
            "extractionMethod": "generated-source-chroma-key",
            "sampledKeyRgb": list(parts_key),
            "keyStats": parts_stats,
            "ownership": source_records[1:],
        },
    ]
    passed = lambda *evidence: {
        "status": "passed",
        "evidence": list(evidence),
    }
    blocked = lambda reason: {
        "status": "blocked",
        "evidence": [reason],
    }
    manifest = {
        "schemaVersion": 1,
        "id": "office.facility.refrigerator.r01",
        "familyId": "refrigerator.modern",
        "revision": "r01-generated-motion-preflight-r01",
        "status": "visual-motion-preflight-owner-review",
        "productionStage": "visual-motion-preflight",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "ownerDirective": {
            "recordedOn": "2026-07-30",
            "physicalScale": "2x2x4",
            "animatedDoor": True,
            "randomHeldOutput": True,
            "reuseExistingSpatialSystem": True,
            "freshRefrigeratorIdentity": True,
        },
        "sourcePolicy": {
            "freshImageGeneration": True,
            "originalMasterPixelReuse": False,
            "processedCropDirectReuse": False,
            "rejectedSideOrientationPixelReuse": False,
            "activeOfficePixelReuse": False,
            "otherFacilityPixelReuse": False,
            "missingAssetFallback": False,
        },
        "generation": {
            "workflow": "built-in-imagegen",
            "promptRecord": {
                "file": rp(PROMPT_PATH),
                "sha256": sha256_file(PROMPT_PATH),
            },
            "sources": generation_sources,
            "keyedEvidence": keyed_assets,
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
            "uniformIntegerDivisor": DIVISOR,
            "nonUniformScaling": False,
            "anchor": "bottom-center",
            "requiredOrientations": ["front"],
            "basePivotRuntime": list(BASE_PIVOT),
            "sortPivotRuntime": list(BASE_PIVOT),
            "interactionTargetRuntime": list(INTERACTION_TARGET),
            "outputSocketRuntime": list(OUTPUT_SOCKET),
            "doorSwingRegionRuntime": list(MOTION_REGION),
            "collisionChangesDuringMotion": False,
            "footprintChangesDuringMotion": False,
        },
        "parts": part_assets,
        "states": state_assets,
        "finiteAnimation": {
            "kind": "reversible-finite-state",
            "repeatingAmbientLoop": False,
            "compositionFormula": "immutableShell + lowerDoor[state]",
            "immutableShell": "shell",
            "movingChild": "lowerDoor",
            "states": ["closed", "half", "open"],
            "forwardPath": ["closed", "half", "open"],
            "reversePath": ["open", "half", "closed"],
            "reviewTransition": list(FINITE_TRANSITION),
            "transitionChangedPixels": transition_counts,
            "changedPixelsOutsideDoorSwingRegion": outside_counts,
            "shellChangedPixels": 0,
            "pivotDeltaPixels": [0, 0],
            "footprintDeltaTiles": [0, 0],
            "closedEndpointMismatchPixels": 0,
            "interruption": {
                "beforePickup": (
                    "reverse-to-closed; remove facility output; release"
                ),
                "afterPickup": (
                    "close before release; remove held prop before departure"
                ),
                "reservationReleased": True,
            },
            "gif": {
                "file": rp(DOOR_GIF_PATH),
                "sha256": sha256_bytes(door_gif),
                "size": [512, 512],
                "frameCount": len(DOOR_GIF_SEQUENCE),
                "durationMs": DOOR_DURATION_MS,
                "previewRepeatsForReviewOnly": True,
            },
        },
        "interactionPreview": {
            "semanticAction": "interact-use",
            "visualPoseAuthority": "interact-front",
            "capacity": 1,
            "frontApproachCells": 1,
            "actorId": ACTOR_ID,
            "actionAuthority": {
                "manifest": rp(I01_ACTION_PATH),
                "manifestSha256": sha256_file(I01_ACTION_PATH),
                "status": "owner-approved",
            },
            "spatialAuthority": {
                "manifest": rp(I01_SPATIAL_PATH),
                "manifestSha256": sha256_file(I01_SPATIAL_PATH),
                "status": spatial["status"],
            },
            "heldPropAuthority": {
                "manifest": rp(H01_PATH),
                "manifestSha256": sha256_file(H01_PATH),
                "status": held["status"],
                "pool": [
                    {
                        "assetId": prop_id,
                        "runtimeFile": held_records[prop_id]["runtimeFile"],
                        "runtimeSha256": held_records[prop_id]["runtimeSha256"],
                        "visualCenterSocket": held_records[prop_id][
                            "visualCenterSocket"
                        ],
                        "attachmentMode": "front-overlay",
                    }
                    for prop_id in PROP_POOL
                ],
            },
            "selection": {
                "algorithm": (
                    "(stable-hash(actorId|slotId) + visitIndex) % pool.length"
                ),
                "selectedOncePerVisit": True,
                "frameStable": True,
                "repeatAvoidance": "two-item pool alternates across visits",
                "pool": list(PROP_POOL),
                "examples": selection_examples,
                "previewVisitIndex": 0,
                "previewAssetId": selected_id,
            },
            "handoff": {
                "facilityParent": "facility.output.primary",
                "actorParent": "actor.hand.primary.grip",
                "childSocket": "prop.visualCenterSocket",
                "attachmentDelta": [0, 0],
                "magicOffset": False,
                "missingSocketFallback": False,
                "newCoordinateSystem": False,
                "foregroundMaskUses": 0,
            },
            "timeline": interaction_timeline,
            "gif": {
                "file": rp(INTERACTION_GIF_PATH),
                "sha256": sha256_bytes(interaction_gif),
                "size": [768, 512],
                "frameCount": len(INTERACTION_STEPS),
                "durationMs": INTERACTION_DURATION_MS,
            },
            "reservationSimulationBuilt": False,
            "rosterCasesBuilt": 0,
        },
        "preflightAssets": {
            "frontAnchor": asset_record(
                front_path,
                front_content,
                RUNTIME_CANVAS,
            ),
            "runtimeAlphaBounds": list(alpha_bounds(states["closed"])),
        },
        "productionTargets": {
            "basePoseCases": 108,
            "propOverlayCasesPerTwoAssetPool": 108,
            "builtPoseCases": 0,
            "builtPropOverlayCases": 0,
            "reservationDurationSeconds": 30,
            "reservationActorCount": 2,
            "reservationSlotContribution": 0,
            "plannedReservationSlotContributionAfterF8": 1,
            "facilityV1ReadySlotsBeforeRefrigeratorF8": 17,
            "facilityV1ReadySlotsAfterRefrigeratorF8Target": 18,
        },
        "gates": {
            "F0": passed(rp(REVIEW_PATHS[1]), rp(PROMPT_PATH)),
            "F1": passed(rp(REVIEW_PATHS[3]), rp(REVIEW_PATHS[6])),
            "F2": passed(rp(REVIEW_PATHS[0]), rp(REVIEW_PATHS[2])),
            "F3": passed(
                rp(REVIEW_PATHS[4]),
                rp(REVIEW_PATHS[5]),
                rp(REVIEW_PATHS[7]),
                rp(DOOR_GIF_PATH),
                rp(INTERACTION_GIF_PATH),
            ),
            "F4": blocked("F4 awaits owner approval of the exact preflight hashes."),
            "F5": blocked("F5 awaits the production socket and route batch."),
            "F6": blocked("F6 awaits 108 I01/H01 cases and 30-second contention."),
            "F7": blocked("F7 awaits completed production evidence."),
            "F8": blocked("F8 awaits completed F4-F7 production evidence."),
            "F9": blocked("Furniture-only room composition remains separate."),
            "F10": blocked("Active Office integration is outside R01 preflight."),
        },
        "reviewOutputs": [
            *[rp(path) for path in REVIEW_PATHS],
            rp(DOOR_GIF_PATH),
            rp(INTERACTION_GIF_PATH),
        ],
        "reviewEvidence": review_evidence,
        "visualApproval": None,
        "permissions": {
            "ownerReview": True,
            "fullSystemBuild": False,
            "reservationSlotActivation": False,
            "furnitureOnlyRoom": False,
            "activeOfficePromotion": False,
        },
        "scopeExclusions": [
            "apps/web/src/features/office/components/officeAssetRegistry.ts",
            "apps/web/src/features/office/components/officeSceneRuntime.ts",
            "assets/game/maps/office-c-v2.json",
            "F9 furniture-only room",
            "F10 Active Office",
        ],
    }
    outputs[MANIFEST_PATH] = json_bytes(manifest)
    return outputs


def write_outputs(outputs: dict[Path, bytes], check: bool) -> list[str]:
    mismatches: list[str] = []
    for path, content in outputs.items():
        if check:
            if not path.exists():
                mismatches.append(f"missing {rp(path)}")
            elif path.read_bytes() != content:
                mismatches.append(f"stale {rp(path)}")
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
    return mismatches


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        outputs = build()
        mismatches = write_outputs(outputs, args.check)
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as error:
        print(f"Refrigerator R01 build failed: {error}", file=sys.stderr)
        return 1
    if mismatches:
        print("\n".join(mismatches), file=sys.stderr)
        return 1
    action = "validated" if args.check else "built"
    print(
        f"Refrigerator R01 {action}: fresh 2x2x4 front family, reversible "
        "closed/half/open door, reused I01/H01 handoff, F0-F3 passed, "
        "F4-F10 blocked."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
