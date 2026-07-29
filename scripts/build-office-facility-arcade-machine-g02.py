"""Build the generated Arcade Machine G02 visual preflight.

G02 is a fresh four-orientation 2x2x4 cabinet with three deterministic
four-frame screen loops. This producer intentionally stops before production
sockets, roster validation, reservation simulation, F8, F9, or Active Office.
"""

from __future__ import annotations

import argparse
import io
import json
import sys
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageDraw, ImageOps

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
MANIFEST_PATH = ROOT / (
    "assets/game/manifests/office-facility-arcade-machine-g02.json"
)
SOURCE_ROOT = ROOT / (
    "assets/art/layout-references/office-facility-family-v1/"
    "arcade-machine-g02/source"
)
REVIEW_ROOT = SOURCE_ROOT.parent
OUTPUT_ROOT = ROOT / (
    "assets/game/processed/office-facility-family-v1/arcade-machine-g02"
)
PROMPT_PATH = SOURCE_ROOT / "IMAGEGEN_PROMPTS.md"
I01_SPATIAL_AUTHORITY_PATH = ROOT / (
    "assets/game/manifests/office-spatial-authority-i01.json"
)
I01_ACTION_SOCKET_PATH = ROOT / (
    "assets/game/manifests/office-character-action-sockets-i01.json"
)
INTERACTION_ACTOR_ID = "anna"

SOURCE_SPECS = {
    "front-anchor": {
        "path": SOURCE_ROOT / "01-cabinet-front-anchor-chroma.png",
        "inputImageCount": 0,
    },
    "turnaround": {
        "path": SOURCE_ROOT / "02-cabinet-turnaround-chroma.png",
        "inputImageCount": 1,
        "identityReference": "front-anchor",
    },
    "cosmic-drift-kit": {
        "path": SOURCE_ROOT / "03-cosmic-drift-kit-chroma.png",
        "inputImageCount": 0,
    },
    "neon-rally-kit": {
        "path": SOURCE_ROOT / "04-neon-rally-kit-chroma.png",
        "inputImageCount": 0,
    },
    "dungeon-pulse-kit": {
        "path": SOURCE_ROOT / "05-dungeon-pulse-kit-chroma.png",
        "inputImageCount": 0,
    },
}

TURNAROUND_CELLS = {
    "front": (0, 0, 443, 887),
    "left": (443, 0, 887, 887),
    "right": (887, 0, 1330, 887),
    "back": (1330, 0, 1774, 887),
}
GAME_SPECS = {
    "cosmic-drift": {
        "title": "Cosmic Drift",
        "sourceRole": "cosmic-drift-kit",
        "cells": {
            "background": (0, 0, 790, 627),
            "player": (790, 0, 1254, 627),
            "obstacle": (0, 627, 700, 1254),
            "effect": (700, 627, 1254, 1254),
        },
        "playerSize": (14, 8),
        "playerPosition": (3, 17),
        "obstacleSize": (9, 9),
        "obstacleY": 11,
        "effectSize": (10, 5),
        "effectPosition": (0, 19),
    },
    "neon-rally": {
        "title": "Neon Rally",
        "sourceRole": "neon-rally-kit",
        "cells": {
            "background": (0, 0, 730, 627),
            "player": (730, 0, 1254, 627),
            "obstacle": (0, 627, 650, 1254),
            "effect": (650, 627, 1254, 1254),
        },
        "playerSize": (14, 11),
        "playerPosition": (11, 23),
        "obstacleSize": (10, 6),
        "obstacleY": 18,
        "effectSize": (12, 7),
        "effectPosition": (9, 27),
    },
    "dungeon-pulse": {
        "title": "Dungeon Pulse",
        "sourceRole": "dungeon-pulse-kit",
        "cells": {
            "background": (0, 0, 850, 627),
            "player": (850, 0, 1254, 627),
            "obstacle": (0, 627, 700, 1254),
            "effect": (700, 627, 1254, 1254),
        },
        "playerSize": (9, 13),
        "playerPosition": (3, 19),
        "obstacleSize": (9, 7),
        "obstacleY": 26,
        "effectSize": (8, 8),
        "effectPosition": (14, 17),
    },
}

ORIENTATIONS = ("front", "left", "right", "back")
FRAME_IDS = ("a", "b", "c", "d")
AUTHORING_CANVAS = (384, 512)
RUNTIME_CANVAS = (96, 128)
SCREEN_VIEWPORT_AUTHORING = (120, 108, 264, 252)
SCREEN_VIEWPORT_RUNTIME = (30, 27, 66, 63)
SCREEN_SIZE = (36, 36)
CONTROL_REGION_RUNTIME = (22, 63, 74, 83)
RENDER_PIVOT_RUNTIME = (48, 124)
FRAME_DURATION_MS = 200

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

REVIEW_SPECS = (
    ("01-cabinet-turnaround-4-sides.png", (1800, 1000)),
    ("02-alpha-and-source-ownership.png", (1800, 1100)),
    ("03-scale-2x2x4-vs-actor.png", (1500, 950)),
    ("04-footprint-and-render-box-3x4.png", (1500, 980)),
    ("05-screen-viewport-and-machine-controls.png", (1600, 980)),
    ("06-cosmic-drift-a-b-c-d-a.png", (1800, 950)),
    ("07-neon-rally-a-b-c-d-a.png", (1800, 950)),
    ("08-dungeon-pulse-a-b-c-d-a.png", (1800, 950)),
    ("09-shell-diff-and-pivot-lock.png", (1600, 980)),
    ("10-four-orientation-floor-preview.png", (1800, 1050)),
)
GIF_NAMES = (
    "cosmic-drift-loop.gif",
    "neon-rally-loop.gif",
    "dungeon-pulse-loop.gif",
)
INTERACTION_GIF_NAME = "anna-approach-play-release.gif"
INTERACTION_GIF_SIZE = (768, 512)
INTERACTION_FRAME_DURATION_MS = 240
INTERACTION_TIMELINE = (
    ("approach", "walk-left", 0, 72, 0),
    ("approach", "walk-left", 1, 48, 1),
    ("approach", "walk-left", 2, 24, 2),
    ("ready", "interact-front", 0, 0, 3),
    ("reach", "interact-front", 1, 0, 0),
    ("play", "interact-front", 2, 0, 1),
    ("play", "interact-front", 3, 0, 2),
    ("play", "interact-front", 4, 0, 3),
    ("play", "interact-front", 3, 0, 0),
    ("release", "interact-front", 5, 0, 1),
    ("depart", "walk-right", 0, 24, 2),
    ("depart", "walk-right", 1, 48, 3),
)


def repo_path(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def alpha_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    bounds = image.getbbox()
    if bounds is None:
        raise ValueError("Expected visible alpha content")
    return bounds


def extraction_record(
    keyed: Image.Image,
    cell: tuple[int, int, int, int],
) -> tuple[Image.Image, dict[str, Any]]:
    crop = keyed.crop(cell)
    bounds = alpha_bounds(crop)
    canvas_contact = (
        bounds[0] == 0
        or bounds[1] == 0
        or bounds[2] == crop.width
        or bounds[3] == crop.height
    )
    if canvas_contact:
        raise ValueError(f"Generated source ownership touches cell edge: {cell}")
    cutout = crop.crop(bounds)
    visible = sum(1 for value in cutout.getchannel("A").getdata() if value > 0)
    absolute_bounds = (
        cell[0] + bounds[0],
        cell[1] + bounds[1],
        cell[0] + bounds[2],
        cell[1] + bounds[3],
    )
    return cutout, {
        "sourceCell": list(cell),
        "ownedBounds": list(absolute_bounds),
        "visiblePixels": visible,
        "cellBoundaryContact": False,
    }


def normalize_orientation(source: Image.Image) -> Image.Image:
    target_height = 480
    target_width = round(source.width * target_height / source.height)
    if target_width > 320:
        raise ValueError("Arcade orientation exceeds the 3-tile render box")
    resized = source.resize(
        (target_width, target_height),
        Image.Resampling.LANCZOS,
    )
    output = Image.new("RGBA", AUTHORING_CANVAS, (0, 0, 0, 0))
    output.alpha_composite(
        resized,
        ((AUTHORING_CANVAS[0] - target_width) // 2, 16),
    )
    return output


def resize_sprite(source: Image.Image, size: tuple[int, int]) -> Image.Image:
    return source.resize(size, Image.Resampling.LANCZOS)


def opaque_background(source: Image.Image) -> Image.Image:
    base = Image.new("RGBA", source.size, (5, 14, 31, 255))
    base.alpha_composite(source)
    half = base.resize((18, 36), Image.Resampling.LANCZOS)
    output = Image.new("RGBA", SCREEN_SIZE, (5, 14, 31, 255))
    output.alpha_composite(half, (0, 0))
    output.alpha_composite(ImageOps.mirror(half), (18, 0))
    return output


def apply_alpha(source: Image.Image, opacity: int) -> Image.Image:
    output = source.copy()
    alpha = output.getchannel("A").point(
        lambda value: round(value * opacity / 255),
    )
    output.putalpha(alpha)
    return output


def paste_wrapped(
    target: Image.Image,
    sprite: Image.Image,
    position: tuple[int, int],
) -> None:
    for offset in (-SCREEN_SIZE[0], 0, SCREEN_SIZE[0]):
        target.alpha_composite(sprite, (position[0] + offset, position[1]))


def build_screen_frame(
    parts: dict[str, Image.Image],
    spec: dict[str, Any],
    phase: int,
) -> Image.Image:
    background = opaque_background(parts["background"])
    scroll = (phase % 4) * 9
    frame = ImageChops.offset(background, -scroll, 0)
    effect = apply_alpha(
        resize_sprite(parts["effect"], spec["effectSize"]),
        (96, 176, 255, 176)[phase % 4],
    )
    effect_x, effect_y = spec["effectPosition"]
    frame.alpha_composite(effect, (effect_x, effect_y))
    obstacle = resize_sprite(parts["obstacle"], spec["obstacleSize"])
    obstacle_x = (28 - scroll) % SCREEN_SIZE[0]
    paste_wrapped(frame, obstacle, (obstacle_x, spec["obstacleY"]))
    player = resize_sprite(parts["player"], spec["playerSize"])
    player_x, player_y = spec["playerPosition"]
    player_y += (0, -1, 0, 1)[phase % 4]
    frame.alpha_composite(player, (player_x, player_y))
    return frame


def composite_screen(shell: Image.Image, screen: Image.Image) -> Image.Image:
    output = shell.copy()
    output.alpha_composite(
        screen,
        (SCREEN_VIEWPORT_RUNTIME[0], SCREEN_VIEWPORT_RUNTIME[1]),
    )
    return output


def changed_pixels(
    first: Image.Image,
    second: Image.Image,
    *,
    exclude: tuple[int, int, int, int] | None = None,
    include: tuple[int, int, int, int] | None = None,
) -> int:
    first_rgba = first.convert("RGBA")
    second_rgba = second.convert("RGBA")
    count = 0
    for y in range(first.height):
        for x in range(first.width):
            if exclude and exclude[0] <= x < exclude[2] and exclude[1] <= y < exclude[3]:
                continue
            if include and not (
                include[0] <= x < include[2] and include[1] <= y < include[3]
            ):
                continue
            if first_rgba.getpixel((x, y)) != second_rgba.getpixel((x, y)):
                count += 1
    return count


def gif_bytes(frames: list[Image.Image]) -> bytes:
    previews = []
    for frame in frames:
        canvas = Image.new("RGBA", (384, 512), (225, 232, 240, 255))
        enlarged = frame.resize((288, 384), Image.Resampling.NEAREST)
        canvas.alpha_composite(enlarged, (48, 64))
        previews.append(canvas.convert("P", palette=Image.Palette.ADAPTIVE))
    buffer = io.BytesIO()
    previews[0].save(
        buffer,
        "GIF",
        save_all=True,
        append_images=previews[1:],
        loop=0,
        duration=FRAME_DURATION_MS,
        disposal=2,
        optimize=False,
    )
    return buffer.getvalue()


def load_interaction_actor() -> tuple[dict[str, Any], dict[str, list[Image.Image]]]:
    spatial_authority = json.loads(I01_SPATIAL_AUTHORITY_PATH.read_text("utf-8"))
    action_authority = json.loads(I01_ACTION_SOCKET_PATH.read_text("utf-8"))
    if spatial_authority.get("status") != "owner-approved":
        raise ValueError("I01 spatial authority is not owner-approved")
    if (
        action_authority.get("status") != "owner-approved"
        or action_authority.get("pose") != "interact-front"
        or action_authority.get("row") != 10
        or action_authority.get("pendingCommercialReview") is not True
    ):
        raise ValueError("I01 interact-front development authority changed")
    actor = next(
        (
            candidate
            for candidate in action_authority.get("characters", [])
            if candidate.get("id") == INTERACTION_ACTOR_ID
        ),
        None,
    )
    if actor is None:
        raise ValueError(f"Missing I01 actor: {INTERACTION_ACTOR_ID}")
    if (
        actor.get("pose") != "interact-front"
        or actor.get("row") != 10
        or actor.get("frameSize") != [96, 104]
        or len(actor.get("frames", [])) != 6
    ):
        raise ValueError("Anna I01 interact-front frame authority changed")
    sheet_path = ROOT / actor["sheet"]
    if sha256_file(sheet_path) != actor["sheetSha256"]:
        raise ValueError("Anna I01 sheet hash changed")
    sheet = Image.open(sheet_path).convert("RGBA")
    frame_width, frame_height = actor["frameSize"]
    row = actor["row"]
    interaction_frames = [
        sheet.crop((
            frame["frame"] * frame_width,
            row * frame_height,
            (frame["frame"] + 1) * frame_width,
            (row + 1) * frame_height,
        ))
        for frame in actor["frames"]
    ]
    for index, (frame, authority) in enumerate(
        zip(interaction_frames, actor["frames"], strict=True)
    ):
        if frame.getbbox() is None:
            raise ValueError(f"Anna I01 interact-front frame {index} is empty")
        root_socket = authority.get("rootSocket")
        if (
            not isinstance(root_socket, list)
            or len(root_socket) != 2
            or not all(isinstance(value, int) for value in root_socket)
        ):
            raise ValueError(f"Anna I01 root socket {index} is invalid")
    movement_frames = {
        "walk-right": [
            sheet.crop((index * frame_width, frame_height, (index + 1) * frame_width, 2 * frame_height))
            for index in range(8)
        ],
        "walk-left": [
            sheet.crop((index * frame_width, 2 * frame_height, (index + 1) * frame_width, 3 * frame_height))
            for index in range(8)
        ],
    }
    if any(
        frame.getbbox() is None
        for frames in movement_frames.values()
        for frame in frames
    ):
        raise ValueError("Anna runtime movement row contains an empty frame")
    return {
        "spatialAuthority": spatial_authority,
        "actionAuthority": action_authority,
        "actor": actor,
        "sheetPath": sheet_path,
    }, {
        "interact-front": interaction_frames,
        **movement_frames,
    }


def interaction_gif_bytes(
    machine_frames: list[Image.Image],
    actor_frames: dict[str, list[Image.Image]],
    actor_record: dict[str, Any],
) -> bytes:
    logical_size = (384, 190)
    machine_origin = (112, 25)
    stand_root = (166, 151)
    previews = []
    for (
        phase,
        animation,
        actor_frame_index,
        approach_offset_x,
        screen_frame_index,
    ) in (
        INTERACTION_TIMELINE
    ):
        scene = Image.new("RGBA", logical_size, (218, 229, 237, 255))
        scene_draw = ImageDraw.Draw(scene)
        scene_draw.rectangle((0, 0, 383, 149), fill=(224, 233, 240, 255))
        scene_draw.rectangle((0, 150, 383, 189), fill=(183, 201, 211, 255))
        for y in range(158, 190, 8):
            scene_draw.line((0, y, 383, y), fill=(151, 174, 188, 255), width=1)
        for x in range(-64, 449, 32):
            scene_draw.line(
                (x, 150, x + 40, 189),
                fill=(151, 174, 188, 255),
                width=1,
            )
        scene_draw.line((0, 150, 383, 150), fill=(91, 118, 135, 255), width=2)
        scene_draw.ellipse(
            (stand_root[0] - 17, 145, stand_root[0] + 17, 157),
            fill=(46, 208, 205, 90),
            outline=(24, 124, 132, 220),
            width=1,
        )
        scene.alpha_composite(
            machine_frames[screen_frame_index],
            machine_origin,
        )
        actor_authority = (
            actor_record["frames"][actor_frame_index]
            if animation == "interact-front"
            else actor_record["frames"][0]
        )
        root_x, root_y = actor_authority["rootSocket"]
        actor_origin = (
            stand_root[0] + approach_offset_x - root_x,
            stand_root[1] - root_y,
        )
        scene.alpha_composite(actor_frames[animation][actor_frame_index], actor_origin)

        canvas = Image.new("RGBA", INTERACTION_GIF_SIZE, (20, 28, 42, 255))
        canvas.alpha_composite(
            scene.resize((768, 380), Image.Resampling.NEAREST),
            (0, 62),
        )
        draw = ImageDraw.Draw(canvas)
        draw.text(
            (24, 15),
            "ARCADE G02 · ANNA · I01 INTERACT-FRONT",
            font=HEADING_FONT,
            fill=(244, 248, 251, 255),
        )
        badge_width = draw.textbbox(
            (0, 0),
            phase.upper(),
            font=BODY_FONT,
        )[2] + 30
        draw.rounded_rectangle(
            (24, 458, 24 + badge_width, 498),
            radius=12,
            fill=(24, 137, 145, 255),
        )
        draw.text(
            (39, 465),
            phase.upper(),
            font=BODY_FONT,
            fill=(255, 255, 255, 255),
        )
        draw.text(
            (24 + badge_width + 20, 467),
            "root-aligned · no held controller · development-only demo",
            font=SMALL_FONT,
            fill=(190, 207, 219, 255),
        )
        previews.append(canvas.convert("P", palette=Image.Palette.ADAPTIVE))
    buffer = io.BytesIO()
    previews[0].save(
        buffer,
        "GIF",
        save_all=True,
        append_images=previews[1:],
        loop=0,
        duration=INTERACTION_FRAME_DURATION_MS,
        disposal=2,
        optimize=False,
    )
    return buffer.getvalue()


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


def panel(
    image: Image.Image,
    box: tuple[int, int, int, int],
    heading: str,
) -> tuple[ImageDraw.ImageDraw, tuple[int, int, int, int]]:
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle(
        box,
        radius=18,
        fill=(247, 249, 252, 255),
        outline=(174, 188, 203, 255),
        width=2,
    )
    draw.text(
        (box[0] + 20, box[1] + 16),
        heading,
        font=HEADING_FONT,
        fill=(28, 52, 76, 255),
    )
    return draw, (box[0] + 20, box[1] + 62, box[2] - 20, box[3] - 20)


def draw_mannequin(
    image: Image.Image,
    origin: tuple[int, int],
    scale: int,
) -> None:
    draw = ImageDraw.Draw(image)
    x, baseline = origin
    radius = 5 * scale
    draw.ellipse(
        (x - radius, baseline - 92 * scale, x + radius, baseline - 82 * scale),
        fill=(67, 99, 128, 220),
    )
    draw.rounded_rectangle(
        (x - 8 * scale, baseline - 80 * scale, x + 8 * scale, baseline - 34 * scale),
        radius=3 * scale,
        fill=(84, 120, 151, 220),
    )
    draw.rectangle(
        (x - 8 * scale, baseline - 34 * scale, x - 2 * scale, baseline),
        fill=(67, 99, 128, 220),
    )
    draw.rectangle(
        (x + 2 * scale, baseline - 34 * scale, x + 8 * scale, baseline),
        fill=(67, 99, 128, 220),
    )


def board_turnaround(orientations: dict[str, Image.Image]) -> Image.Image:
    image = Image.new("RGBA", (1800, 1000), (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Arcade Machine G02 — Four-Side Turnaround",
        "Fresh generated cabinet identity · physical 2×2×4 · front / left / right / back",
    )
    for index, name in enumerate(ORIENTATIONS):
        x = 42 + index * 438
        _, content = panel(image, (x, 125, x + 400, 900), name.upper())
        check = checkerboard((330, 570), 20)
        sprite = orientations[name].resize((288, 384), Image.Resampling.NEAREST)
        check.alpha_composite(sprite, (21, 88))
        image.alpha_composite(check, (content[0] + 15, content[1] + 20))
        draw.text(
            (content[0] + 42, content[1] + 610),
            "Same baseline · same material family",
            font=SMALL_FONT,
            fill=(52, 70, 88, 255),
        )
    draw.text(
        (45, 930),
        "The front is the identity anchor. Side controls appear only where physically visible; the back has no screen or controls.",
        font=BODY_FONT,
        fill=(41, 55, 72, 255),
    )
    return image


def board_source_ownership(
    raw_sources: dict[str, Image.Image],
    ownership: dict[str, Any],
) -> Image.Image:
    image = Image.new("RGBA", (1800, 1100), (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Arcade Machine G02 — Alpha and Generated-Source Ownership",
        "Five fresh built-in ImageGen inputs · flat magenta removal · no reused Office pixels",
    )
    boxes = (
        ("front-anchor", (35, 120, 580, 540)),
        ("turnaround", (610, 120, 1765, 540)),
        ("cosmic-drift-kit", (35, 575, 580, 1020)),
        ("neon-rally-kit", (610, 575, 1155, 1020)),
        ("dungeon-pulse-kit", (1185, 575, 1730, 1020)),
    )
    for role, box in boxes:
        _, content = panel(image, box, role.replace("-", " ").title())
        source = raw_sources[role].convert("RGBA")
        available = (content[2] - content[0], content[3] - content[1] - 60)
        scale = min(available[0] / source.width, available[1] / source.height)
        size = (round(source.width * scale), round(source.height * scale))
        thumb = source.resize(size, Image.Resampling.BILINEAR)
        image.alpha_composite(
            thumb,
            (
                content[0] + (available[0] - size[0]) // 2,
                content[1] + (available[1] - size[1]) // 2,
            ),
        )
        records = ownership.get(role, [])
        contact = any(record["cellBoundaryContact"] for record in records)
        draw.text(
            (content[0], content[3] - 42),
            f"owned regions {len(records) or 1} · boundary contact {str(contact).lower()}",
            font=SMALL_FONT,
            fill=(52, 70, 88, 255),
        )
    draw.text(
        (40, 1050),
        "Magenta is authoring-only. Every selected region has padding on all four sides; no adjacent source cell contributes pixels.",
        font=BODY_FONT,
        fill=(41, 55, 72, 255),
    )
    return image


def board_scale(front: Image.Image) -> Image.Image:
    image = Image.new("RGBA", (1500, 950), (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Arcade Machine G02 — 1× Scale Preflight",
        "Canonical adult 1×1×3 · machine 2×2×4 · render envelope 3×4",
    )
    draw.rectangle(
        (80, 140, 1420, 830),
        fill=(247, 249, 252, 255),
        outline=(174, 188, 203, 255),
        width=2,
    )
    baseline = 760
    scale = 5
    for tile in range(5):
        y = baseline - tile * 32 * scale
        draw.line((120, y, 1380, y), fill=(203, 212, 222, 255), width=2)
        draw.text((90, y - 10), str(tile), font=SMALL_FONT, fill=(88, 105, 123, 255))
    machine = front.resize((96 * scale, 128 * scale), Image.Resampling.NEAREST)
    image.alpha_composite(machine, (690, baseline - 128 * scale))
    draw_mannequin(image, (390, baseline), scale)
    draw.rectangle(
        (390 - 16 * scale, baseline - 96 * scale, 390 + 16 * scale, baseline),
        outline=(67, 99, 128, 255),
        width=3,
    )
    draw.rectangle(
        (690, baseline - 128 * scale, 690 + 96 * scale, baseline),
        outline=(54, 138, 198, 255),
        width=3,
    )
    draw.text((245, 790), "Adult 1×1×3", font=HEADING_FONT, fill=(28, 52, 76, 255))
    draw.text((825, 790), "Arcade render box 3×4", font=HEADING_FONT, fill=(28, 52, 76, 255))
    draw_wrapped(
        draw,
        "The taller G02 cabinet reaches the four-tile ruler while preserving a 2×2 floor reservation and one front user.",
        (170, 855, 1360, 930),
    )
    return image


def board_geometry(front: Image.Image) -> Image.Image:
    image = Image.new("RGBA", (1500, 980), (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Arcade Machine G02 — Footprint and 3×4 Render Box",
        "Collision, approach, alpha, and render overflow remain separate contracts",
    )
    _, top = panel(image, (45, 120, 720, 920), "Top-down footprint and approach")
    tile = 112
    origin = (top[0] + 90, top[1] + 70)
    roles = {(0, 0): "footprint", (1, 0): "footprint", (0, 1): "footprint",
             (1, 1): "footprint", (1, 2): "stand", (1, 3): "approach",
             (0, 3): "exit"}
    colors = {
        "footprint": (105, 186, 222, 175),
        "stand": (80, 196, 137, 180),
        "approach": (247, 190, 72, 180),
        "exit": (171, 132, 220, 180),
    }
    for y in range(5):
        for x in range(4):
            role = roles.get((x, y))
            box = (
                origin[0] + x * tile,
                origin[1] + y * tile,
                origin[0] + (x + 1) * tile,
                origin[1] + (y + 1) * tile,
            )
            draw.rectangle(
                box,
                fill=colors.get(role, (239, 243, 247, 255)),
                outline=(135, 151, 167, 255),
                width=2,
            )
            if role:
                draw.text((box[0] + 8, box[1] + 8), role, font=SMALL_FONT,
                          fill=(39, 55, 70, 255))
    pivot = (origin[0] + tile, origin[1] + 2 * tile)
    draw.ellipse((pivot[0] - 9, pivot[1] - 9, pivot[0] + 9, pivot[1] + 9),
                 fill=(236, 100, 75, 255))
    _, elevation = panel(image, (760, 120, 1455, 920), "Front elevation")
    scale = 5
    grid_left = elevation[0] + 95
    grid_top = elevation[1] + 40
    for y in range(5):
        draw.line(
            (grid_left, grid_top + y * 32 * scale,
             grid_left + 96 * scale, grid_top + y * 32 * scale),
            fill=(180, 192, 204, 255),
            width=2,
        )
    for x in range(4):
        draw.line(
            (grid_left + x * 32 * scale, grid_top,
             grid_left + x * 32 * scale, grid_top + 128 * scale),
            fill=(180, 192, 204, 255),
            width=2,
        )
    sprite = front.resize((96 * scale, 128 * scale), Image.Resampling.NEAREST)
    image.alpha_composite(sprite, (grid_left, grid_top))
    draw.rectangle(
        (grid_left, grid_top, grid_left + 96 * scale, grid_top + 128 * scale),
        outline=(54, 138, 198, 255),
        width=5,
    )
    draw.text(
        (65, 940),
        "Base/sort pivot: (1,2) tiles · stand (1,2) · approach (1,3) · exit (0,3)",
        font=BODY_FONT,
        fill=(41, 55, 72, 255),
    )
    return image


def board_viewport(front: Image.Image, first_screen: Image.Image) -> Image.Image:
    image = Image.new("RGBA", (1600, 980), (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Arcade Machine G02 — Screen Viewport and Machine-Local Controls",
        "Only the 36×36 runtime viewport animates · shell, joystick, buttons, and pivot stay fixed",
    )
    _, clean = panel(image, (45, 120, 780, 920), "Static shell contract")
    scale = 5
    machine = front.resize((96 * scale, 128 * scale), Image.Resampling.NEAREST)
    origin = (clean[0] + 105, clean[1] + 25)
    image.alpha_composite(machine, origin)
    viewport = tuple(value * scale for value in SCREEN_VIEWPORT_RUNTIME)
    viewport_box = (
        origin[0] + viewport[0],
        origin[1] + viewport[1],
        origin[0] + viewport[2],
        origin[1] + viewport[3],
    )
    draw.rectangle(viewport_box, outline=(54, 211, 153, 255), width=5)
    controls = tuple(value * scale for value in CONTROL_REGION_RUNTIME)
    draw.rectangle(
        (
            origin[0] + controls[0],
            origin[1] + controls[1],
            origin[0] + controls[2],
            origin[1] + controls[3],
        ),
        outline=(247, 190, 72, 255),
        width=5,
    )
    _, details = panel(image, (825, 120, 1555, 920), "Viewport-only animation")
    enlarged = first_screen.resize((432, 432), Image.Resampling.NEAREST)
    image.alpha_composite(enlarged, (details[0] + 120, details[1] + 35))
    bullets = (
        "Green: screen viewport [30,27,66,63]",
        "Amber: joystick and buttons remain cabinet-local",
        "No held controller exists in H01",
        "No marquee, shell, foot, or pivot animation",
        "Frame order A → B → C → D → A",
        "200 ms per frame · 800 ms loop",
    )
    for index, text in enumerate(bullets):
        draw.text(
            (details[0] + 35, details[1] + 505 + index * 38),
            text,
            font=BODY_FONT,
            fill=(41, 55, 72, 255),
        )
    return image


def board_loop(
    title: str,
    screens: list[Image.Image],
    composites: list[Image.Image],
) -> Image.Image:
    image = Image.new("RGBA", (1800, 950), (228, 234, 241, 255))
    draw = draw_title(
        image,
        f"Arcade Machine G02 — {title} Seam Loop",
        "Temporal frames A / B / C / D / A · final A is the exact wrap target",
    )
    display_frames = [*composites, composites[0]]
    labels = ("A", "B", "C", "D", "A")
    for index, (frame, label) in enumerate(zip(display_frames, labels, strict=True)):
        x = 48 + index * 347
        draw.rounded_rectangle(
            (x, 130, x + 310, 610),
            radius=16,
            fill=(247, 249, 252, 255),
            outline=(174, 188, 203, 255),
            width=2,
        )
        enlarged = frame.resize((288, 384), Image.Resampling.NEAREST)
        image.alpha_composite(enlarged, (x + 11, 175))
        draw.text((x + 140, 135), label, font=HEADING_FONT, fill=(28, 52, 76, 255))
    display_screens = [*screens, screens[0]]
    for index, screen in enumerate(display_screens):
        x = 115 + index * 330
        enlarged = screen.resize((216, 216), Image.Resampling.NEAREST)
        image.alpha_composite(enlarged, (x, 665))
    draw.text(
        (50, 915),
        "Background scroll phases 0 / 9 / 18 / 27 / 36 pixels. Phase 36 is byte-equivalent to phase 0.",
        font=BODY_FONT,
        fill=(41, 55, 72, 255),
    )
    return image


def board_diff(
    games: dict[str, dict[str, Any]],
    front: Image.Image,
) -> Image.Image:
    image = Image.new("RGBA", (1600, 980), (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Arcade Machine G02 — Shell Diff and Pivot Lock",
        "All changed pixels are inside the screen viewport; controls and render pivot are invariant",
    )
    _, visual = panel(image, (45, 120, 790, 920), "Maximum A–D visual difference")
    difference = Image.new("RGBA", RUNTIME_CANVAS, (0, 0, 0, 0))
    for game in games.values():
        base = game["composites"][0]
        for frame in game["composites"][1:]:
            difference = ImageChops.lighter(
                difference,
                ImageChops.difference(base, frame),
            )
    heat = Image.new("RGBA", RUNTIME_CANVAS, (0, 0, 0, 0))
    for y in range(difference.height):
        for x in range(difference.width):
            value = max(difference.getpixel((x, y)))
            if value:
                heat.putpixel((x, y), (38, 196, 219, max(96, value)))
    scale = 5
    origin = (visual[0] + 105, visual[1] + 25)
    shell_hint = front.copy()
    shell_hint.putalpha(shell_hint.getchannel("A").point(lambda value: value // 3))
    image.alpha_composite(
        shell_hint.resize((480, 640), Image.Resampling.NEAREST),
        origin,
    )
    image.alpha_composite(
        heat.resize((480, 640), Image.Resampling.NEAREST),
        origin,
    )
    viewport = tuple(value * scale for value in SCREEN_VIEWPORT_RUNTIME)
    draw.rectangle(
        (
            origin[0] + viewport[0],
            origin[1] + viewport[1],
            origin[0] + viewport[2],
            origin[1] + viewport[3],
        ),
        outline=(54, 211, 153, 255),
        width=4,
    )
    _, metrics = panel(image, (835, 120, 1555, 920), "Invariant metrics")
    rows = [
        ("outside viewport changed pixels", "0"),
        ("controls changed pixels", "0"),
        ("shell changed pixels", "0"),
        ("render pivot delta", "(0,0)"),
        ("base/sort pivot", "(1,2) tiles"),
        ("runtime render pivot", "(48,124) px"),
        ("D→A wrap mismatch", "0"),
    ]
    for index, (label, value) in enumerate(rows):
        y = metrics[1] + 35 + index * 82
        draw.rectangle(
            (metrics[0] + 20, y, metrics[2] - 20, y + 60),
            fill=(236, 241, 246, 255),
        )
        draw.text((metrics[0] + 35, y + 18), label, font=BODY_FONT,
                  fill=(41, 55, 72, 255))
        draw.text((metrics[2] - 160, y + 18), value, font=HEADING_FONT,
                  fill=(28, 116, 171, 255))
    pivot = (
        origin[0] + RENDER_PIVOT_RUNTIME[0] * scale,
        origin[1] + RENDER_PIVOT_RUNTIME[1] * scale,
    )
    draw.ellipse((pivot[0] - 10, pivot[1] - 10, pivot[0] + 10, pivot[1] + 10),
                 fill=(236, 100, 75, 255))
    draw.text((55, 940), "Red point marks the fixed runtime render pivot.",
              font=BODY_FONT, fill=(41, 55, 72, 255))
    return image


def board_orientations(orientations: dict[str, Image.Image]) -> Image.Image:
    image = Image.new("RGBA", (1800, 1050), (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Arcade Machine G02 — Four-Orientation Floor Preview",
        "Placement preview only · route transforms and reservations remain blocked until visual approval",
    )
    for index, name in enumerate(ORIENTATIONS):
        x = 55 + index * 435
        draw.rounded_rectangle(
            (x, 130, x + 390, 950),
            radius=18,
            fill=(247, 249, 252, 255),
            outline=(174, 188, 203, 255),
            width=2,
        )
        tile = 72
        grid_x = x + 50
        grid_y = 175
        for gy in range(4):
            for gx in range(4):
                box = (
                    grid_x + gx * tile,
                    grid_y + gy * tile,
                    grid_x + (gx + 1) * tile,
                    grid_y + (gy + 1) * tile,
                )
                fill = (
                    (105, 186, 222, 150)
                    if gx in (1, 2) and gy in (1, 2)
                    else (239, 243, 247, 255)
                )
                draw.rectangle(box, fill=fill, outline=(135, 151, 167, 255), width=2)
        sprite = orientations[name].resize((240, 320), Image.Resampling.NEAREST)
        image.alpha_composite(sprite, (x + 75, 500))
        draw.text((x + 145, 845), name.upper(), font=HEADING_FONT,
                  fill=(28, 52, 76, 255))
        draw.text((x + 52, 890), "2×2 footprint · one approach side",
                  font=SMALL_FONT, fill=(52, 70, 88, 255))
    draw.text(
        (60, 990),
        "G02 proves four visual elevations. Production route rotation (432 placement cases) starts only after this shape is approved.",
        font=BODY_FONT,
        fill=(41, 55, 72, 255),
    )
    return image


def build_outputs() -> dict[Path, bytes]:
    raw_sources: dict[str, Image.Image] = {}
    keyed_sources: dict[str, Image.Image] = {}
    chroma_records: dict[str, Any] = {}
    ownership: dict[str, list[dict[str, Any]]] = {}
    outputs: dict[Path, bytes] = {}

    for role, spec in SOURCE_SPECS.items():
        path = spec["path"]
        raw = Image.open(path).convert("RGBA")
        keyed, key_rgb, stats = remove_magenta_chroma(raw)
        raw_sources[role] = raw
        keyed_sources[role] = keyed
        keyed_path = OUTPUT_ROOT / "authoring/source" / f"{role}.keyed.png"
        outputs[keyed_path] = png_bytes(keyed)
        chroma_records[role] = {
            "sampledKeyRgb": list(key_rgb),
            "chromaStats": stats,
            "keyedFile": repo_path(keyed_path),
            "keyedSha256": sha256_bytes(outputs[keyed_path]),
        }

    anchor_bounds = alpha_bounds(keyed_sources["front-anchor"])
    if (
        anchor_bounds[0] == 0
        or anchor_bounds[1] == 0
        or anchor_bounds[2] == keyed_sources["front-anchor"].width
        or anchor_bounds[3] == keyed_sources["front-anchor"].height
    ):
        raise ValueError("Front anchor touches generated canvas boundary")
    ownership["front-anchor"] = [{
        "sourceCell": [0, 0, *keyed_sources["front-anchor"].size],
        "ownedBounds": list(anchor_bounds),
        "visiblePixels": sum(
            1 for value in keyed_sources["front-anchor"].getchannel("A").getdata()
            if value > 0
        ),
        "cellBoundaryContact": False,
    }]

    authoring_orientations: dict[str, Image.Image] = {}
    runtime_orientations: dict[str, Image.Image] = {}
    ownership["turnaround"] = []
    for name, cell in TURNAROUND_CELLS.items():
        cutout, record = extraction_record(keyed_sources["turnaround"], cell)
        ownership["turnaround"].append({"partId": name, **record})
        authoring = normalize_orientation(cutout)
        runtime = authoring.resize(RUNTIME_CANVAS, Image.Resampling.NEAREST)
        authoring_orientations[name] = authoring
        runtime_orientations[name] = runtime
        authoring_path = OUTPUT_ROOT / "authoring/orientations" / f"{name}.png"
        runtime_path = OUTPUT_ROOT / "runtime/orientations" / f"{name}.png"
        outputs[authoring_path] = png_bytes(authoring)
        outputs[runtime_path] = png_bytes(runtime)

    games: dict[str, dict[str, Any]] = {}
    for game_id, spec in GAME_SPECS.items():
        source_role = spec["sourceRole"]
        parts: dict[str, Image.Image] = {}
        ownership[source_role] = []
        for part_id, cell in spec["cells"].items():
            part, record = extraction_record(keyed_sources[source_role], cell)
            parts[part_id] = part
            ownership[source_role].append({"partId": part_id, **record})
            part_path = OUTPUT_ROOT / "authoring/game-kits" / f"{game_id}.{part_id}.png"
            outputs[part_path] = png_bytes(part)
        screens = [build_screen_frame(parts, spec, phase) for phase in range(4)]
        closure = build_screen_frame(parts, spec, 4)
        closure_mismatch = changed_pixels(screens[0], closure)
        if closure_mismatch != 0:
            raise ValueError(f"{game_id} phase-4 closure changed {closure_mismatch} pixels")
        composites = [
            composite_screen(runtime_orientations["front"], frame)
            for frame in screens
        ]
        outside_changes = max(
            changed_pixels(composites[0], frame, exclude=SCREEN_VIEWPORT_RUNTIME)
            for frame in composites[1:]
        )
        control_changes = max(
            changed_pixels(composites[0], frame, include=CONTROL_REGION_RUNTIME)
            for frame in composites[1:]
        )
        if outside_changes or control_changes:
            raise ValueError(f"{game_id} changed shell or controls")
        screen_assets = []
        composite_assets = []
        for frame_id, screen, composite in zip(
            FRAME_IDS,
            screens,
            composites,
            strict=True,
        ):
            screen_path = (
                OUTPUT_ROOT / "runtime/screen-loops" / f"{game_id}.{frame_id}.png"
            )
            composite_path = (
                OUTPUT_ROOT / "runtime/composites" / f"{game_id}.{frame_id}.png"
            )
            outputs[screen_path] = png_bytes(screen)
            outputs[composite_path] = png_bytes(composite)
            screen_assets.append({
                "frameId": frame_id,
                "file": repo_path(screen_path),
                "sha256": sha256_bytes(outputs[screen_path]),
                "size": list(SCREEN_SIZE),
            })
            composite_assets.append({
                "frameId": frame_id,
                "file": repo_path(composite_path),
                "sha256": sha256_bytes(outputs[composite_path]),
                "size": list(RUNTIME_CANVAS),
            })
        transitions = [
            changed_pixels(screens[index], screens[(index + 1) % 4])
            for index in range(4)
        ]
        if any(delta == 0 for delta in transitions):
            raise ValueError(f"{game_id} contains a static loop transition")
        games[game_id] = {
            "title": spec["title"],
            "screens": screens,
            "composites": composites,
            "screenAssets": screen_assets,
            "compositeAssets": composite_assets,
            "transitionChangedPixels": transitions,
            "closureMismatchPixels": closure_mismatch,
            "outsideViewportChangedPixels": outside_changes,
            "controlRegionChangedPixels": control_changes,
        }

    interaction_authority, interaction_actor_frames = load_interaction_actor()
    interaction_actor = interaction_authority["actor"]

    boards = (
        board_turnaround(runtime_orientations),
        board_source_ownership(raw_sources, ownership),
        board_scale(runtime_orientations["front"]),
        board_geometry(runtime_orientations["front"]),
        board_viewport(
            runtime_orientations["front"],
            games["cosmic-drift"]["screens"][0],
        ),
        board_loop(
            games["cosmic-drift"]["title"],
            games["cosmic-drift"]["screens"],
            games["cosmic-drift"]["composites"],
        ),
        board_loop(
            games["neon-rally"]["title"],
            games["neon-rally"]["screens"],
            games["neon-rally"]["composites"],
        ),
        board_loop(
            games["dungeon-pulse"]["title"],
            games["dungeon-pulse"]["screens"],
            games["dungeon-pulse"]["composites"],
        ),
        board_diff(games, runtime_orientations["front"]),
        board_orientations(runtime_orientations),
    )
    review_paths = []
    for board, (name, size) in zip(boards, REVIEW_SPECS, strict=True):
        if board.size != size:
            raise ValueError(f"Review board size changed: {name}")
        path = REVIEW_ROOT / name
        outputs[path] = png_bytes(board)
        review_paths.append(path)

    gif_paths = []
    for game_id, name in zip(GAME_SPECS, GIF_NAMES, strict=True):
        path = REVIEW_ROOT / name
        outputs[path] = gif_bytes(games[game_id]["composites"])
        gif_paths.append(path)
    interaction_gif_path = REVIEW_ROOT / INTERACTION_GIF_NAME
    outputs[interaction_gif_path] = interaction_gif_bytes(
        games["cosmic-drift"]["composites"],
        interaction_actor_frames,
        interaction_actor,
    )

    source_records = []
    for role, spec in SOURCE_SPECS.items():
        raw = raw_sources[role]
        record = {
            "role": role,
            "file": repo_path(spec["path"]),
            "sha256": sha256_file(spec["path"]),
            "size": list(raw.size),
            "inputImageCount": spec["inputImageCount"],
            "extractionMethod": "generated-source-chroma-key",
            **chroma_records[role],
            "ownership": ownership[role],
        }
        if "identityReference" in spec:
            record["identityReference"] = spec["identityReference"]
        source_records.append(record)

    orientation_assets = []
    for name in ORIENTATIONS:
        authoring_path = OUTPUT_ROOT / "authoring/orientations" / f"{name}.png"
        runtime_path = OUTPUT_ROOT / "runtime/orientations" / f"{name}.png"
        orientation_assets.append({
            "orientation": name,
            "authoringFile": repo_path(authoring_path),
            "authoringSha256": sha256_bytes(outputs[authoring_path]),
            "authoringSize": list(AUTHORING_CANVAS),
            "runtimeFile": repo_path(runtime_path),
            "runtimeSha256": sha256_bytes(outputs[runtime_path]),
            "runtimeSize": list(RUNTIME_CANVAS),
            "runtimeAlphaBounds": list(alpha_bounds(runtime_orientations[name])),
        })

    review_evidence = [
        {
            "path": repo_path(path),
            "sha256": sha256_bytes(outputs[path]),
            "kind": "png",
            "size": list(size),
        }
        for path, (_, size) in zip(review_paths, REVIEW_SPECS, strict=True)
    ]
    review_evidence.extend({
        "path": repo_path(path),
        "sha256": sha256_bytes(outputs[path]),
        "kind": "gif",
        "size": [384, 512],
        "frameCount": 4,
        "durationMs": FRAME_DURATION_MS,
    } for path in gif_paths)
    review_evidence.append({
        "path": repo_path(interaction_gif_path),
        "sha256": sha256_bytes(outputs[interaction_gif_path]),
        "kind": "gif",
        "size": list(INTERACTION_GIF_SIZE),
        "frameCount": len(INTERACTION_TIMELINE),
        "durationMs": INTERACTION_FRAME_DURATION_MS,
    })

    blocked = lambda reason: {"status": "blocked", "evidence": [reason]}
    manifest = {
        "schemaVersion": 1,
        "id": "office.facility.arcade-machine.g02",
        "familyId": "machine.game.arcade.generated-modern",
        "revision": "g02-preflight-r02",
        "status": "visual-preflight-owner-review",
        "productionStage": "visual-preflight",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "plannedInteractionMode": "machine-local-controls",
        "plannedHeldProp": False,
        "sourcePolicy": {
            "freshImageGeneration": True,
            "originalMasterPixelReuse": False,
            "processedCropDirectReuse": False,
            "activeOfficePixelReuse": False,
            "legacyOrRejectedPixelReuse": False,
            "previousArcadePixelReuse": False,
            "generativeRepair": False,
            "missingAssetFallback": False,
        },
        "generation": {
            "workflow": "built-in-imagegen",
            "promptRecord": {
                "file": repo_path(PROMPT_PATH),
                "sha256": sha256_file(PROMPT_PATH),
            },
            "sources": source_records,
        },
        "render": {
            "physicalScale": {"width": 2, "depth": 2, "height": 4, "unit": "tile"},
            "footprint": {"width": 2, "depth": 2, "unit": "tile"},
            "renderBox": {"width": 3, "height": 4, "unit": "tile"},
            "authoringCanvas": list(AUTHORING_CANVAS),
            "runtimeCanvas": list(RUNTIME_CANVAS),
            "uniformIntegerDivisor": 4,
            "nonUniformRuntimeScaling": False,
            "anchor": "bottom-center",
            "requiredOrientations": list(ORIENTATIONS),
            "basePivot": {"x": 1, "y": 2, "unit": "tile"},
            "sortPivot": {"x": 1, "y": 2, "unit": "tile"},
            "renderPivotRuntime": list(RENDER_PIVOT_RUNTIME),
            "orientations": orientation_assets,
        },
        "screenSystem": {
            "viewportAuthoring": list(SCREEN_VIEWPORT_AUTHORING),
            "viewportRuntime": list(SCREEN_VIEWPORT_RUNTIME),
            "runtimeSize": list(SCREEN_SIZE),
            "frameIds": list(FRAME_IDS),
            "transition": ["a", "b", "c", "d", "a"],
            "frameDurationMs": FRAME_DURATION_MS,
            "cycleDurationMs": FRAME_DURATION_MS * 4,
            "backgroundScrollPhases": [0, 9, 18, 27, 36],
            "shellChangedPixelsOutsideViewport": 0,
            "controlsChangedPixels": 0,
            "pivotDeltaPixels": [0, 0],
            "games": [
                {
                    "gameId": game_id,
                    "title": game["title"],
                    "sourceRole": GAME_SPECS[game_id]["sourceRole"],
                    "screenFrames": game["screenAssets"],
                    "compositeFrames": game["compositeAssets"],
                    "transitionChangedPixels": game["transitionChangedPixels"],
                    "closureMismatchPixels": game["closureMismatchPixels"],
                    "outsideViewportChangedPixels": (
                        game["outsideViewportChangedPixels"]
                    ),
                    "controlRegionChangedPixels": (
                        game["controlRegionChangedPixels"]
                    ),
                    "gif": {
                        "file": repo_path(gif_paths[index]),
                        "sha256": sha256_bytes(outputs[gif_paths[index]]),
                        "size": [384, 512],
                    },
                }
                for index, (game_id, game) in enumerate(games.items())
            ],
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
            "orientationRouteCasesBuilt": 0,
            "singleActorDemo": {
                "developmentOnly": True,
                "countsTowardRosterValidation": False,
                "countsTowardReservationValidation": False,
                "characterAssetsPendingCommercialReview": True,
                "actorId": INTERACTION_ACTOR_ID,
                "pose": "interact-front",
                "sourceAuthority": {
                    "spatialFile": repo_path(I01_SPATIAL_AUTHORITY_PATH),
                    "spatialSha256": sha256_file(I01_SPATIAL_AUTHORITY_PATH),
                    "actionFile": repo_path(I01_ACTION_SOCKET_PATH),
                    "actionSha256": sha256_file(I01_ACTION_SOCKET_PATH),
                    "sheetFile": repo_path(interaction_authority["sheetPath"]),
                    "sheetSha256": interaction_actor["sheetSha256"],
                    "frameSize": interaction_actor["frameSize"],
                    "row": interaction_actor["row"],
                    "movementRows": {"walk-right": 1, "walk-left": 2},
                    "movementRootSocket": (
                        interaction_actor["frames"][0]["rootSocket"]
                    ),
                    "movementRootSource": "interact-front.f0-bottom-contact",
                },
                "placement": {
                    "formula": "sceneRoot - frameRootSocket",
                    "sceneRootRuntime": [166, 151],
                    "integerCoordinatesOnly": True,
                    "magicOffset": False,
                    "fallbackSocket": False,
                    "productionSocketClaim": False,
                },
                "timeline": [
                    {
                        "phase": phase,
                        "animation": animation,
                        "actorFrame": actor_frame,
                        "approachOffsetX": approach_offset,
                        "screenFrame": FRAME_IDS[screen_frame],
                    }
                    for (
                        phase,
                        animation,
                        actor_frame,
                        approach_offset,
                        screen_frame,
                    ) in INTERACTION_TIMELINE
                ],
                "heldController": False,
                "gif": {
                    "file": repo_path(interaction_gif_path),
                    "sha256": sha256_bytes(outputs[interaction_gif_path]),
                    "size": list(INTERACTION_GIF_SIZE),
                    "frameCount": len(INTERACTION_TIMELINE),
                    "durationMs": INTERACTION_FRAME_DURATION_MS,
                },
            },
        },
        "gates": {
            "F0": {"status": "passed", "evidence": [repo_path(review_paths[1])]},
            "F1": {"status": "passed", "evidence": [
                repo_path(review_paths[2]), repo_path(review_paths[3]),
                repo_path(review_paths[9]),
            ]},
            "F2": {"status": "passed", "evidence": [
                repo_path(review_paths[0]), repo_path(review_paths[1]),
            ]},
            "F3": {"status": "passed", "evidence": [
                repo_path(review_paths[4]), repo_path(review_paths[5]),
                repo_path(review_paths[6]), repo_path(review_paths[7]),
                repo_path(review_paths[8]),
            ]},
            "F4": blocked("Production part decomposition waits for visual approval."),
            "F5": blocked("Production I01 sockets wait for visual approval."),
            "F6": blocked("Reservation and two-user timeline wait for visual approval."),
            "F7": blocked("The 108 actor-frame and 432 orientation cases are not built."),
            "F8": blocked("F8 has not started; visual approval comes first."),
            "F9": blocked("No furniture-only room composition is in G02 preflight."),
            "F10": blocked("Active Office promotion is forbidden in G02 preflight."),
        },
        "reviewOutputs": [
            repo_path(path)
            for path in [*review_paths, *gif_paths, interaction_gif_path]
        ],
        "reviewEvidence": review_evidence,
        "visualApproval": None,
        "permissions": {
            "ownerReview": True,
            "fullSystemBuild": False,
            "furnitureOnlyRoom": False,
            "activeOfficePromotion": False,
        },
        "activeOfficeEvidence": [
            {"file": file, "sha256": sha256, "importsCandidate": False}
            for file, sha256 in ACTIVE_OFFICE_BASELINE_SHA256.items()
        ],
    }
    outputs[MANIFEST_PATH] = json_bytes(manifest)
    return outputs


def expected_input_paths() -> set[Path]:
    return {
        PROMPT_PATH,
        I01_SPATIAL_AUTHORITY_PATH,
        I01_ACTION_SOCKET_PATH,
        *(spec["path"] for spec in SOURCE_SPECS.values()),
    }


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
    expected_paths = set(outputs) | expected_input_paths()
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
        raise SystemExit(
            "Arcade G02 full production is locked until visualApproval is recorded."
        )
    outputs = build_outputs()
    if args.check:
        failures = check_outputs(outputs)
        if failures:
            raise SystemExit("\n".join(failures))
        print(
            "Arcade G02 rebuild OK: fresh 2x2x4 four-side cabinet, three "
            "deterministic A-D screen loops, one I01 actor demo, and F4-F10 "
            "blocked."
        )
        return
    write_outputs(outputs)
    print(
        "Built Arcade G02 visual preflight: four cabinet sides, 12 screen "
        "frames, three seam-loop GIFs, one I01 actor GIF, 10 review boards, "
        "and no full system."
    )


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError) as error:
        print(error, file=sys.stderr)
        raise SystemExit(1) from error
