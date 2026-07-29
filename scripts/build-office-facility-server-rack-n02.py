"""Build the owner-approved Server Rack N02 four-side visual evidence.

The builder consumes only the three fresh built-in ImageGen sources recorded
for N02. It creates deterministic alpha extractions, four orientation sprites,
a viewport-local A-D-A status loop, two-instance previews, and a development-
only empty-hand I01 interaction GIF. Owner approval unlocks an isolated
production revision, while this preflight continues to stop before production
roster, route, reservation, F8, room, or Active Office authority.
"""

from __future__ import annotations

import argparse
import io
import json
import sys
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageOps

from office_facility_art import (
    BODY_FONT,
    HEADING_FONT,
    SMALL_FONT,
    checkerboard,
)
from office_facility_art import (
    changed_outside_box,
    clear_box,
    connected_components,
    draw_title,
    json_bytes,
    paste_scaled,
    png_bytes,
    remove_magenta_chroma,
    repo_path as shared_repo_path,
    sha256_bytes,
    sha256_file,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = (
    ROOT
    / "assets"
    / "art"
    / "layout-references"
    / "office-facility-family-v1"
    / "server-rack-n02"
    / "source"
)
REVIEW_ROOT = SOURCE_ROOT.parent
PROCESSED_ROOT = (
    ROOT
    / "assets"
    / "game"
    / "processed"
    / "office-facility-family-v1"
    / "server-rack-n02"
)
MANIFEST_PATH = (
    ROOT
    / "assets"
    / "game"
    / "manifests"
    / "office-facility-server-rack-n02.json"
)
N01_MANIFEST_PATH = (
    ROOT
    / "assets"
    / "game"
    / "manifests"
    / "office-facility-server-rack-n01.json"
)
PROMPT_PATH = SOURCE_ROOT / "IMAGEGEN_PROMPTS.md"
SOURCE_PATHS = {
    "front-anchor": SOURCE_ROOT / "01-server-rack-front-anchor-chroma.png",
    "turnaround": SOURCE_ROOT / "02-server-rack-turnaround-chroma.png",
    "status-kit": SOURCE_ROOT / "03-server-status-kit-chroma.png",
}
ACTION_MANIFEST_PATH = (
    ROOT
    / "assets"
    / "game"
    / "manifests"
    / "office-character-action-sockets-i01.json"
)
SPATIAL_MANIFEST_PATH = (
    ROOT
    / "assets"
    / "game"
    / "manifests"
    / "office-spatial-authority-i01.json"
)
ACTIVE_OFFICE_FILES = (
    "apps/web/src/features/office/components/officeAssetRegistry.ts",
    "assets/game/maps/office-c-v2.json",
    "apps/web/src/features/office/components/officeSceneRuntime.ts",
)

AUTHORING_CANVAS = (384, 512)
RUNTIME_CANVAS = (96, 128)
ORIENTATIONS = ("front", "left", "right", "back")
FRAME_IDS = ("a", "b", "c", "d")
FRAME_DURATION_MS = 220
VIEWPORT_AUTHORING = (128, 156, 256, 220)
VIEWPORT_RUNTIME = (32, 39, 64, 55)
VIEWPORT_RUNTIME_SIZE = (32, 16)
BASE_PIVOT_RUNTIME = (48, 124)
INTERACTION_ACTOR_ID = "anna"
INTERACTION_GIF_SIZE = (768, 512)
INTERACTION_FRAME_DURATION_MS = 240
STATUS_GIF_SIZE = (512, 512)

TURNAROUND_CELLS = {
    "front": (0, 0, 500, 887),
    "left": (500, 0, 900, 887),
    "right": (900, 0, 1280, 887),
    "back": (1280, 0, 1774, 887),
}
STATUS_PART_CELLS = {
    "screen-base": (50, 80, 780, 760),
    "cyan-telemetry": (790, 180, 1240, 720),
    "green-nodes": (50, 850, 720, 1120),
    "amber-alert": (720, 820, 1240, 1140),
}
REVIEW_SPECS = (
    ("01-four-side-turnaround.png", (1800, 1000)),
    ("02-alpha-source-ownership.png", (1800, 1100)),
    ("03-clean-four-orientations.png", (1800, 1000)),
    ("04-scale-2x2x4-vs-actor.png", (1600, 1000)),
    ("05-footprint-renderbox-approach.png", (1600, 1000)),
    ("06-parts-shell-status-composite.png", (1700, 1000)),
    ("07-status-loop-a-d-a.png", (1800, 950)),
    ("08-orientations-two-instances.png", (1800, 1000)),
    ("09-empty-hand-inspect-preview.png", (1800, 1000)),
)
REVIEW_PATHS = tuple(REVIEW_ROOT / name for name, _ in REVIEW_SPECS)
STATUS_GIF_PATH = REVIEW_ROOT / "server-rack-n02-status-loop.gif"
INTERACTION_GIF_PATH = REVIEW_ROOT / "anna-empty-hand-inspect.gif"


def repo_path(path: Path) -> str:
    return shared_repo_path(ROOT, path)


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def asset(
    path: Path,
    content: bytes,
    size: tuple[int, int],
) -> dict[str, Any]:
    return {
        "file": repo_path(path),
        "sha256": sha256_bytes(content),
        "size": list(size),
    }


def alpha_pixels(image: Image.Image) -> int:
    return sum(1 for value in image.getchannel("A").getdata() if value)


def extract_cell(
    keyed: Image.Image,
    cell: tuple[int, int, int, int],
) -> tuple[Image.Image, dict[str, Any]]:
    crop = keyed.crop(cell)
    bounds = crop.getbbox()
    if bounds is None:
        raise ValueError(f"Generated source cell is empty: {cell}")
    contact = (
        bounds[0] == 0
        or bounds[1] == 0
        or bounds[2] == crop.width
        or bounds[3] == crop.height
    )
    if contact:
        raise ValueError(f"Generated ownership touches source cell: {cell}")
    cutout = crop.crop(bounds)
    components = [
        component
        for component in connected_components(cutout)
        if component["pixelCount"] >= 16
    ]
    absolute = (
        cell[0] + bounds[0],
        cell[1] + bounds[1],
        cell[0] + bounds[2],
        cell[1] + bounds[3],
    )
    return cutout, {
        "sourceCell": list(cell),
        "ownedBounds": list(absolute),
        "visiblePixels": alpha_pixels(cutout),
        "ownedComponentCount": len(components),
        "cellBoundaryContact": False,
    }


def normalize_orientation(source: Image.Image) -> Image.Image:
    target_height = 480
    target_width = round(source.width * target_height / source.height)
    if target_width > 320:
        raise ValueError("N02 orientation exceeds the 3-tile render box")
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


def apply_opacity(source: Image.Image, opacity: int) -> Image.Image:
    output = source.copy()
    output.putalpha(
        output.getchannel("A").point(
            lambda value: round(value * opacity / 255)
        )
    )
    return output


def build_status_frame(
    parts: dict[str, Image.Image],
    phase: int,
) -> Image.Image:
    frame = parts["screen-base"].resize(
        VIEWPORT_RUNTIME_SIZE,
        Image.Resampling.LANCZOS,
    )
    cyan = parts["cyan-telemetry"].resize(
        (12, 14),
        Image.Resampling.LANCZOS,
    )
    green = parts["green-nodes"].resize(
        (14, 3),
        Image.Resampling.LANCZOS,
    )
    amber = parts["amber-alert"].resize(
        (10, 5),
        Image.Resampling.LANCZOS,
    )
    cyan_x = (2, 4, 1, 3)[phase]
    green_x = (15, 13, 16, 14)[phase]
    green_y = (12, 12, 11, 12)[phase]
    amber_x = (20, 19, 18, 21)[phase]
    amber_alpha = (88, 160, 255, 128)[phase]
    frame.alpha_composite(cyan, (cyan_x, 1))
    frame.alpha_composite(green, (green_x, green_y))
    frame.alpha_composite(
        apply_opacity(amber, amber_alpha),
        (amber_x, 5),
    )
    return frame


def changed_pixels(first: Image.Image, second: Image.Image) -> int:
    return sum(
        1
        for first_pixel, second_pixel in zip(
            first.convert("RGBA").getdata(),
            second.convert("RGBA").getdata(),
            strict=True,
        )
        if first_pixel != second_pixel
    )


def load_actor() -> dict[str, Any]:
    action = read_json(ACTION_MANIFEST_PATH)
    spatial = read_json(SPATIAL_MANIFEST_PATH)
    if (
        action.get("status") != "owner-approved"
        or action.get("pose") != "interact-front"
        or action.get("row") != 10
        or action.get("pendingCommercialReview") is not True
        or spatial.get("status") != "owner-approved"
    ):
        raise ValueError("N02 requires owner-approved I01 interact-front")
    actor = next(
        (
            candidate
            for candidate in action.get("characters", [])
            if candidate.get("id") == INTERACTION_ACTOR_ID
        ),
        None,
    )
    if (
        actor is None
        or actor.get("frameSize") != [96, 104]
        or len(actor.get("frames", [])) != 6
    ):
        raise ValueError("N02 Anna I01 authority changed")
    sheet_path = ROOT / actor["sheet"]
    if sha256_file(sheet_path) != actor["sheetSha256"]:
        raise ValueError("N02 Anna sheet hash changed")
    sheet = Image.open(sheet_path).convert("RGBA")
    width, height = actor["frameSize"]
    row = actor["row"]
    interaction = [
        sheet.crop(
            (
                index * width,
                row * height,
                (index + 1) * width,
                (row + 1) * height,
            )
        )
        for index in range(6)
    ]
    walk_right = [
        sheet.crop((index * width, height, (index + 1) * width, 2 * height))
        for index in range(8)
    ]
    walk_left = [
        sheet.crop(
            (index * width, 2 * height, (index + 1) * width, 3 * height)
        )
        for index in range(8)
    ]
    if any(
        frame.getbbox() is None
        for frame in [*interaction, *walk_left, *walk_right]
    ):
        raise ValueError("N02 Anna source contains an empty frame")
    return {
        "action": action,
        "spatial": spatial,
        "actor": actor,
        "sheetPath": sheet_path,
        "interaction": interaction,
        "walkLeft": walk_left,
        "walkRight": walk_right,
    }


def status_gif_bytes(frames: dict[str, Image.Image]) -> bytes:
    previews: list[Image.Image] = []
    for frame_id in FRAME_IDS:
        canvas = Image.new("RGBA", STATUS_GIF_SIZE, (25, 36, 51, 255))
        draw = ImageDraw.Draw(canvas)
        draw.text(
            (28, 18),
            f"SERVER RACK N02 · STATUS {frame_id.upper()}",
            font=HEADING_FONT,
            fill=(244, 248, 252, 255),
        )
        canvas.alpha_composite(
            frames[frame_id].resize((288, 384), Image.Resampling.NEAREST),
            (112, 78),
        )
        draw.text(
            (28, 475),
            "immutable shell + statusViewport[n] · 220 ms",
            font=SMALL_FONT,
            fill=(182, 202, 220, 255),
        )
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


def interaction_gif_bytes(
    machine_frames: dict[str, Image.Image],
    actor_data: dict[str, Any],
) -> tuple[bytes, list[dict[str, Any]]]:
    logical_size = (384, 190)
    machine_origin = (112, 22)
    stand_root = (166, 151)
    timeline = (
        ("approach", "walk-left", 0, 72, 0),
        ("approach", "walk-left", 1, 48, 1),
        ("approach", "walk-left", 2, 24, 2),
        ("inspect", "interact-front", 0, 0, 3),
        ("inspect", "interact-front", 1, 0, 0),
        ("inspect", "interact-front", 2, 0, 1),
        ("inspect", "interact-front", 3, 0, 2),
        ("inspect", "interact-front", 4, 0, 3),
        ("inspect", "interact-front", 5, 0, 0),
        ("depart", "walk-right", 0, 24, 1),
        ("depart", "walk-right", 1, 48, 2),
        ("depart", "walk-right", 2, 72, 3),
    )
    previews: list[Image.Image] = []
    records: list[dict[str, Any]] = []
    for phase, animation, frame_index, offset, status_index in timeline:
        scene = Image.new("RGBA", logical_size, (221, 230, 237, 255))
        scene_draw = ImageDraw.Draw(scene)
        scene_draw.rectangle((0, 150, 383, 189), fill=(181, 199, 210))
        for x in range(-64, 449, 32):
            scene_draw.line(
                (x, 150, x + 40, 189),
                fill=(149, 172, 187),
                width=1,
            )
        scene_draw.line((0, 150, 383, 150), fill=(91, 118, 135), width=2)
        scene.alpha_composite(
            machine_frames[FRAME_IDS[status_index]],
            machine_origin,
        )
        authority_index = frame_index if animation == "interact-front" else 0
        authority = actor_data["actor"]["frames"][authority_index]
        actor_image = (
            actor_data["interaction"][frame_index]
            if animation == "interact-front"
            else actor_data["walkLeft"][frame_index]
            if animation == "walk-left"
            else actor_data["walkRight"][frame_index]
        )
        root_x, root_y = authority["rootSocket"]
        actor_origin = (
            stand_root[0] + offset - root_x,
            stand_root[1] - root_y,
        )
        scene.alpha_composite(actor_image, actor_origin)

        canvas = Image.new("RGBA", INTERACTION_GIF_SIZE, (20, 28, 42, 255))
        canvas.alpha_composite(
            scene.resize((768, 380), Image.Resampling.NEAREST),
            (0, 62),
        )
        draw = ImageDraw.Draw(canvas)
        draw.text(
            (24, 15),
            "SERVER N02 · ANNA · EMPTY-HAND INSPECT-FRONT",
            font=HEADING_FONT,
            fill=(244, 248, 251, 255),
        )
        draw.rounded_rectangle(
            (24, 458, 170, 498),
            radius=12,
            fill=(25, 137, 145, 255),
        )
        draw.text(
            (40, 465),
            phase.upper(),
            font=BODY_FONT,
            fill=(255, 255, 255, 255),
        )
        draw.text(
            (192, 467),
            "no held prop · root-aligned · development-only preview",
            font=SMALL_FONT,
            fill=(190, 207, 219, 255),
        )
        previews.append(canvas.convert("P", palette=Image.Palette.ADAPTIVE))
        records.append(
            {
                "phase": phase,
                "animation": animation,
                "actorFrame": frame_index,
                "approachOffsetX": offset,
                "statusFrame": FRAME_IDS[status_index],
                "heldPropVisible": False,
            }
        )
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
    return buffer.getvalue(), records


def panel(
    image: Image.Image,
    box: tuple[int, int, int, int],
    title: str,
) -> tuple[ImageDraw.ImageDraw, tuple[int, int, int, int]]:
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle(
        box,
        radius=16,
        fill=(247, 249, 252),
        outline=(164, 183, 197),
        width=2,
    )
    draw.text(
        (box[0] + 22, box[1] + 18),
        title,
        font=HEADING_FONT,
        fill=(33, 53, 71),
    )
    return draw, (box[0] + 20, box[1] + 64, box[2] - 20, box[3] - 20)


def board_turnaround(parts: dict[str, Any]) -> Image.Image:
    image = Image.new("RGBA", REVIEW_SPECS[0][1], (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Server Rack N02 — Fresh Four-Side Identity",
        "front · left · right · back · one generated family · no N01 pixels",
    )
    for index, name in enumerate(ORIENTATIONS):
        left = 35 + index * 440
        _, area = panel(image, (left, 125, left + 410, 900), name.upper())
        checker = checkerboard((330, 650), 18)
        paste_scaled(
            checker,
            parts["orientationCutouts"][name],
            (18, 18, 312, 632),
        )
        image.alpha_composite(checker, (area[0] + 20, area[1] + 15))
    draw.text(
        (50, 930),
        "Identity lock: warm off-white shell · charcoal body · cyan access light · matched feet and baseline",
        font=BODY_FONT,
        fill=(24, 128, 82),
    )
    return image


def board_source(parts: dict[str, Any]) -> Image.Image:
    image = Image.new("RGBA", REVIEW_SPECS[1][1], (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Server Rack N02 — Alpha and Generated Source Ownership",
        "built-in ImageGen · flat magenta removed locally · exact source hashes retained",
    )
    cards = (
        (35, 125, 575, 820, "FRONT ANCHOR", "front-anchor"),
        (630, 125, 1170, 820, "TURNAROUND", "turnaround"),
        (1225, 125, 1765, 820, "STATUS KIT", "status-kit"),
    )
    for left, top, right, bottom, title, role in cards:
        _, area = panel(image, (left, top, right, bottom), title)
        checker = checkerboard((470, 560), 18)
        paste_scaled(
            checker,
            parts["keyedSources"][role],
            (18, 18, 452, 542),
            resample=Image.Resampling.BILINEAR,
        )
        image.alpha_composite(checker, (area[0] + 5, area[1] + 10))
    facts = (
        ("fresh generated sources", "3"),
        ("turnaround-owned cabinets", "4"),
        ("status source groups", "4"),
        ("N01 / Active Office pixel reuse", "0"),
        ("cell-boundary ownership failures", "0"),
    )
    for index, (label, value) in enumerate(facts):
        x = 60 + index * 345
        draw.rounded_rectangle(
            (x, 875, x + 310, 1035),
            radius=14,
            fill=(247, 249, 252),
            outline=(164, 183, 197),
            width=2,
        )
        draw.text((x + 20, 900), label, font=SMALL_FONT, fill=(52, 72, 90))
        draw.text((x + 20, 944), value, font=HEADING_FONT, fill=(24, 128, 82))
    return image


def board_clean(parts: dict[str, Any]) -> Image.Image:
    image = Image.new("RGBA", REVIEW_SPECS[2][1], (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Server Rack N02 — Clean Four-Orientation Runtime Family",
        "384×512 authoring · 96×128 runtime · integer divisor 4 · bottom-center pivot",
    )
    for index, name in enumerate(ORIENTATIONS):
        left = 35 + index * 440
        _, area = panel(image, (left, 125, left + 410, 890), name.upper())
        checker = checkerboard((330, 640), 18)
        enlarged = parts["runtimeOrientations"][name].resize(
            (288, 384),
            Image.Resampling.NEAREST,
        )
        checker.alpha_composite(enlarged, (21, 125))
        image.alpha_composite(checker, (area[0] + 20, area[1] + 12))
    draw.text(
        (55, 930),
        "Required orientations: 4 · generated turns: false · base/sort pivot: [48,124]",
        font=BODY_FONT,
        fill=(24, 128, 82),
    )
    return image


def board_scale(parts: dict[str, Any], actor_data: dict[str, Any]) -> Image.Image:
    image = Image.new("RGBA", REVIEW_SPECS[3][1], (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Server Rack N02 — 2×2×4 Scale with Standard Actor",
        "canonical actor 1×1×3 · empty-hand I01 interact-front · no tablet or H01 dependency",
    )
    _, area = panel(image, (45, 125, 1050, 930), "Runtime scale comparison")
    floor_y = 830
    draw.line((area[0] + 25, floor_y, area[2] - 25, floor_y), fill=(89, 111, 128), width=3)
    machine = parts["runtimeComposites"]["a"].resize(
        (288, 384),
        Image.Resampling.NEAREST,
    )
    image.alpha_composite(machine, (area[0] + 105, floor_y - 384))
    actor = actor_data["interaction"][3].resize(
        (288, 312),
        Image.Resampling.NEAREST,
    )
    image.alpha_composite(actor, (area[0] + 520, floor_y - 312))
    draw.rectangle(
        (area[0] + 100, floor_y - 384, area[0] + 388, floor_y),
        outline=(48, 142, 199),
        width=3,
    )
    draw.rectangle(
        (area[0] + 515, floor_y - 312, area[0] + 803, floor_y),
        outline=(24, 157, 128),
        width=3,
    )
    _, facts = panel(image, (1100, 125, 1555, 930), "Locked scale")
    rows = (
        ("rack physical", "2 × 2 × 4"),
        ("actor physical", "1 × 1 × 3"),
        ("rack footprint", "2 × 2"),
        ("render box", "3 × 4"),
        ("held prop", "none"),
        ("visual approval", "pending"),
    )
    for index, (label, value) in enumerate(rows):
        y = facts[1] + 20 + index * 102
        draw.rectangle(
            (facts[0] + 8, y, facts[2] - 8, y + 76),
            fill=(237, 242, 247),
        )
        draw.text((facts[0] + 22, y + 12), label, font=SMALL_FONT, fill=(52, 72, 90))
        draw.text((facts[0] + 22, y + 38), value, font=BODY_FONT, fill=(25, 111, 154))
    return image


def board_geometry(parts: dict[str, Any]) -> Image.Image:
    image = Image.new("RGBA", REVIEW_SPECS[4][1], (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Server Rack N02 — Footprint, Render Box, and Front Approach",
        "2×2 footprint · 3×4 render envelope · one local front stand cell · no room placement",
    )
    _, top_area = panel(image, (45, 125, 900, 930), "Top-down local geometry")
    tile = 120
    grid_left = top_area[0] + 160
    grid_top = top_area[1] + 70
    colors = {
        "rack": (52, 73, 91, 255),
        "stand": (31, 168, 154, 180),
        "approach": (49, 143, 201, 175),
        "exit": (235, 171, 63, 175),
    }
    for y in range(4):
        for x in range(2):
            box = (
                grid_left + x * tile,
                grid_top + y * tile,
                grid_left + (x + 1) * tile,
                grid_top + (y + 1) * tile,
            )
            fill = (244, 247, 250, 255)
            if y < 2:
                fill = colors["rack"]
            elif (x, y) == (1, 2):
                fill = colors["stand"]
            elif (x, y) == (1, 3):
                fill = colors["approach"]
            elif (x, y) == (0, 3):
                fill = colors["exit"]
            draw.rectangle(box, fill=fill, outline=(116, 138, 154), width=3)
            if y < 2:
                draw.text((box[0] + 26, box[1] + 45), "RACK", font=BODY_FONT, fill=(245, 248, 251))
    labels = (
        ((1, 2), "STAND"),
        ((1, 3), "APPROACH"),
        ((0, 3), "EXIT"),
    )
    for (x, y), label in labels:
        draw.text(
            (grid_left + x * tile + 15, grid_top + y * tile + 45),
            label,
            font=SMALL_FONT,
            fill=(19, 48, 62),
        )
    draw.polygon(
        (
            (grid_left + 180, grid_top + 235),
            (grid_left + 165, grid_top + 260),
            (grid_left + 195, grid_top + 260),
        ),
        fill=(244, 248, 252),
    )
    _, render_area = panel(image, (950, 125, 1555, 930), "3×4 render envelope")
    sprite = parts["runtimeComposites"]["a"].resize(
        (288, 384),
        Image.Resampling.NEAREST,
    )
    origin = (render_area[0] + 145, render_area[1] + 115)
    draw.rectangle(
        (origin[0], origin[1], origin[0] + 288, origin[1] + 384),
        outline=(48, 142, 199),
        width=3,
    )
    image.alpha_composite(sprite, origin)
    pivot = (origin[0] + BASE_PIVOT_RUNTIME[0] * 3, origin[1] + BASE_PIVOT_RUNTIME[1] * 3)
    draw.ellipse(
        (pivot[0] - 8, pivot[1] - 8, pivot[0] + 8, pivot[1] + 8),
        fill=(234, 81, 94),
    )
    draw.text(
        (render_area[0] + 70, render_area[3] - 85),
        "pivot [48,124] · bottom-center",
        font=BODY_FONT,
        fill=(42, 61, 78),
    )
    return image


def board_parts(parts: dict[str, Any]) -> Image.Image:
    image = Image.new("RGBA", REVIEW_SPECS[5][1], (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Server Rack N02 — Modular Part Decomposition",
        "immutableShell[front] + statusViewport[n] · actor motion is a separate timeline",
    )
    cards = (
        (45, 145, 535, 900, "IMMUTABLE SHELL"),
        (605, 145, 1095, 900, "STATUS VIEWPORT A"),
        (1165, 145, 1655, 900, "COMPOSITE A"),
    )
    sources = (
        parts["runtimeShell"].resize((288, 384), Image.Resampling.NEAREST),
        parts["runtimeStatusFrames"]["a"].resize((352, 176), Image.Resampling.NEAREST),
        parts["runtimeComposites"]["a"].resize((288, 384), Image.Resampling.NEAREST),
    )
    for card, source in zip(cards, sources, strict=True):
        draw.rounded_rectangle(
            card[:4],
            radius=16,
            fill=(247, 249, 252),
            outline=(164, 183, 197),
            width=2,
        )
        draw.text((card[0] + 25, card[1] + 20), card[4], font=HEADING_FONT, fill=(33, 53, 71))
        checker = checkerboard((400, 560), 20)
        paste_scaled(checker, source, (24, 35, 376, 525))
        image.alpha_composite(checker, (card[0] + 45, card[1] + 85))
    draw.text(
        (65, 935),
        "shell changes: 0 · outside-viewport changes: 0 · pivot delta: [0,0] · D→A closure mismatch: 0",
        font=BODY_FONT,
        fill=(24, 128, 82),
    )
    return image


def board_loop(parts: dict[str, Any]) -> Image.Image:
    image = Image.new("RGBA", REVIEW_SPECS[6][1], (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Server Rack N02 — Status Seam Loop A–D–A",
        "four stored phases · logical E equals A · only the declared front viewport changes",
    )
    sequence = ("a", "b", "c", "d", "a")
    for index, frame_id in enumerate(sequence):
        left = 35 + index * 350
        _, area = panel(image, (left, 125, left + 330, 835), frame_id.upper())
        checker = checkerboard((260, 560), 16)
        sprite = parts["runtimeComposites"][frame_id].resize(
            (240, 320),
            Image.Resampling.NEAREST,
        )
        checker.alpha_composite(sprite, (10, 100))
        image.alpha_composite(checker, (area[0] + 15, area[1] + 15))
    draw.text(
        (55, 875),
        f"changed pixels A→B→C→D→A: {parts['transitionChangedPixels']}",
        font=BODY_FONT,
        fill=(42, 61, 78),
    )
    draw.text(
        (55, 910),
        "closure mismatch: 0 · shell/outside changes: 0 · frame duration: 220 ms",
        font=BODY_FONT,
        fill=(24, 128, 82),
    )
    return image


def board_instances(parts: dict[str, Any]) -> Image.Image:
    image = Image.new("RGBA", REVIEW_SPECS[7][1], (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Server Rack N02 — Orientations and Two-Instance Preview",
        "one raster family · two planned instance IDs · reservations are not built in this preflight",
    )
    for index, name in enumerate(ORIENTATIONS):
        left = 35 + index * 330
        _, area = panel(image, (left, 120, left + 305, 600), name.upper())
        sprite = parts["runtimeOrientations"][name].resize(
            (216, 288),
            Image.Resampling.NEAREST,
        )
        image.alpha_composite(sprite, (area[0] + 25, area[1] + 55))
    _, instance_area = panel(image, (1385, 120, 1765, 920), "TWO INSTANCES")
    floor_y = instance_area[1] + 570
    draw.line(
        (instance_area[0] + 15, floor_y, instance_area[2] - 15, floor_y),
        fill=(91, 118, 135),
        width=3,
    )
    sprite = parts["runtimeComposites"]["a"].resize(
        (144, 192),
        Image.Resampling.NEAREST,
    )
    image.alpha_composite(sprite, (instance_area[0] + 5, floor_y - 192))
    image.alpha_composite(sprite, (instance_area[0] + 175, floor_y - 192))
    draw.text((instance_area[0] + 5, floor_y + 15), "server-rack-01", font=SMALL_FONT, fill=(42, 61, 78))
    draw.text((instance_area[0] + 175, floor_y + 15), "server-rack-02", font=SMALL_FONT, fill=(42, 61, 78))
    draw.text(
        (70, 670),
        "Preflight slot contribution",
        font=HEADING_FONT,
        fill=(33, 53, 71),
    )
    rows = (
        ("current Facility v1", "15/20"),
        ("N02 preflight contribution", "0"),
        ("target after later F8", "+2 → 17/20"),
        ("Active Office", "untouched"),
    )
    for index, (label, value) in enumerate(rows):
        y = 720 + index * 55
        draw.text((80, y), label, font=BODY_FONT, fill=(52, 72, 90))
        draw.text((560, y), value, font=BODY_FONT, fill=(25, 111, 154))
    return image


def board_interaction(
    parts: dict[str, Any],
    actor_data: dict[str, Any],
) -> Image.Image:
    image = Image.new("RGBA", REVIEW_SPECS[8][1], (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Server Rack N02 — Empty-Hand Inspect-Front Preview",
        "semantic inspect-front · visual I01 interact-front · no tablet · no held prop · no handoff",
    )
    specs = (
        ("APPROACH", actor_data["walkLeft"][1], "b", 58),
        ("INSPECT", actor_data["interaction"][3], "c", 0),
        ("DEPART", actor_data["walkRight"][1], "d", 58),
    )
    for index, (label, actor, frame_id, offset) in enumerate(specs):
        left = 45 + index * 575
        _, area = panel(image, (left, 135, left + 520, 890), label)
        floor_y = area[1] + 575
        draw.line(
            (area[0] + 15, floor_y, area[2] - 15, floor_y),
            fill=(91, 118, 135),
            width=3,
        )
        machine = parts["runtimeComposites"][frame_id].resize(
            (192, 256),
            Image.Resampling.NEAREST,
        )
        image.alpha_composite(machine, (area[0] + 40, floor_y - 256))
        actor_large = actor.resize((288, 312), Image.Resampling.NEAREST)
        image.alpha_composite(
            actor_large,
            (area[0] + 180 + offset, floor_y - 312),
        )
        draw.text(
            (area[0] + 20, area[3] - 50),
            "held prop: none",
            font=BODY_FONT,
            fill=(24, 128, 82),
        )
    return image


def add_output(
    outputs: dict[Path, bytes],
    path: Path,
    image: Image.Image,
) -> dict[str, Any]:
    content = png_bytes(image)
    outputs[path] = content
    return asset(path, content, image.size)


def build_outputs() -> dict[Path, bytes]:
    for path in [
        *SOURCE_PATHS.values(),
        PROMPT_PATH,
        N01_MANIFEST_PATH,
        ACTION_MANIFEST_PATH,
        SPATIAL_MANIFEST_PATH,
    ]:
        if not path.exists():
            raise ValueError(f"Missing required N02 input: {repo_path(path)}")
    n01 = read_json(N01_MANIFEST_PATH)
    if (
        n01.get("status") != "superseded-owner-redesign-requested"
        or n01.get("ownerDecision", {}).get("supersededBy")
        != "office.facility.server-rack.n02"
    ):
        raise ValueError("N01 redesign authority is missing")

    outputs: dict[Path, bytes] = {}
    keyed_sources: dict[str, Image.Image] = {}
    source_records: dict[str, dict[str, Any]] = {}
    for role, path in SOURCE_PATHS.items():
        source = Image.open(path).convert("RGBA")
        keyed, key, stats = remove_magenta_chroma(source)
        keyed_path = PROCESSED_ROOT / "authoring" / "source" / f"{role}.keyed.png"
        keyed_asset = add_output(outputs, keyed_path, keyed)
        keyed_sources[role] = keyed
        source_records[role] = {
            "role": role,
            "file": repo_path(path),
            "sha256": sha256_file(path),
            "size": list(source.size),
            "inputImageCount": 0 if role == "front-anchor" else 1,
            "identityReference": None if role == "front-anchor" else "front-anchor",
            "extractionMethod": "generated-source-chroma-key",
            "sampledKeyRgb": list(key),
            "chromaStats": stats,
            "keyedAsset": keyed_asset,
            "ownership": [],
        }

    front_cell = (0, 0, *keyed_sources["front-anchor"].size)
    front_cutout, front_ownership = extract_cell(
        keyed_sources["front-anchor"],
        front_cell,
    )
    source_records["front-anchor"]["ownership"].append(
        {"partId": "front-anchor", **front_ownership}
    )
    front_source_path = (
        PROCESSED_ROOT
        / "authoring"
        / "source"
        / "front-anchor.source.png"
    )
    front_source_asset = add_output(outputs, front_source_path, front_cutout)

    turnaround_cutouts: dict[str, Image.Image] = {}
    turnaround_source_assets: dict[str, dict[str, Any]] = {}
    for name in ORIENTATIONS:
        cutout, ownership = extract_cell(
            keyed_sources["turnaround"],
            TURNAROUND_CELLS[name],
        )
        turnaround_cutouts[name] = cutout
        source_records["turnaround"]["ownership"].append(
            {"partId": name, **ownership}
        )
        path = (
            PROCESSED_ROOT
            / "authoring"
            / "source"
            / f"turnaround-{name}.source.png"
        )
        turnaround_source_assets[name] = add_output(outputs, path, cutout)

    status_parts: dict[str, Image.Image] = {}
    status_source_assets: dict[str, dict[str, Any]] = {}
    for part_id, cell in STATUS_PART_CELLS.items():
        cutout, ownership = extract_cell(keyed_sources["status-kit"], cell)
        status_parts[part_id] = cutout
        source_records["status-kit"]["ownership"].append(
            {"partId": part_id, **ownership}
        )
        path = (
            PROCESSED_ROOT
            / "authoring"
            / "source"
            / f"status-{part_id}.source.png"
        )
        status_source_assets[part_id] = add_output(outputs, path, cutout)

    orientation_cutouts = {
        "front": front_cutout,
        "left": turnaround_cutouts["left"],
        "right": turnaround_cutouts["right"],
        "back": turnaround_cutouts["back"],
    }
    authoring_orientations: dict[str, Image.Image] = {}
    runtime_orientations: dict[str, Image.Image] = {}
    orientation_assets: list[dict[str, Any]] = []
    for name in ORIENTATIONS:
        authoring = normalize_orientation(orientation_cutouts[name])
        runtime = authoring.resize(RUNTIME_CANVAS, Image.Resampling.NEAREST)
        authoring_orientations[name] = authoring
        runtime_orientations[name] = runtime
        authoring_path = (
            PROCESSED_ROOT
            / "authoring"
            / "orientations"
            / f"{name}.png"
        )
        runtime_path = (
            PROCESSED_ROOT
            / "runtime"
            / "orientations"
            / f"{name}.png"
        )
        authoring_asset = add_output(outputs, authoring_path, authoring)
        runtime_asset = add_output(outputs, runtime_path, runtime)
        orientation_assets.append(
            {
                "orientation": name,
                "authoring": authoring_asset,
                "runtime": runtime_asset,
                "runtimeAlphaBounds": list(runtime.getbbox() or (0, 0, 0, 0)),
            }
        )

    authoring_shell = clear_box(
        authoring_orientations["front"],
        VIEWPORT_AUTHORING,
    )
    runtime_shell = clear_box(
        runtime_orientations["front"],
        VIEWPORT_RUNTIME,
    )
    authoring_shell_path = (
        PROCESSED_ROOT / "authoring" / "parts" / "front-shell.png"
    )
    runtime_shell_path = (
        PROCESSED_ROOT / "runtime" / "parts" / "front-shell.png"
    )
    shell_assets = {
        "authoring": add_output(
            outputs,
            authoring_shell_path,
            authoring_shell,
        ),
        "runtime": add_output(outputs, runtime_shell_path, runtime_shell),
    }

    runtime_status_parts: dict[str, Image.Image] = {}
    runtime_status_part_assets: dict[str, dict[str, Any]] = {}
    sizes = {
        "screen-base": VIEWPORT_RUNTIME_SIZE,
        "cyan-telemetry": (12, 14),
        "green-nodes": (14, 3),
        "amber-alert": (10, 5),
    }
    for part_id, source in status_parts.items():
        resized = source.resize(sizes[part_id], Image.Resampling.LANCZOS)
        runtime_status_parts[part_id] = resized
        path = (
            PROCESSED_ROOT
            / "runtime"
            / "status-parts"
            / f"{part_id}.png"
        )
        runtime_status_part_assets[part_id] = add_output(outputs, path, resized)

    runtime_status_frames: dict[str, Image.Image] = {}
    runtime_composites: dict[str, Image.Image] = {}
    frame_assets: list[dict[str, Any]] = []
    for index, frame_id in enumerate(FRAME_IDS):
        status_frame = build_status_frame(status_parts, index)
        composite = runtime_shell.copy()
        composite.alpha_composite(
            status_frame,
            (VIEWPORT_RUNTIME[0], VIEWPORT_RUNTIME[1]),
        )
        runtime_status_frames[frame_id] = status_frame
        runtime_composites[frame_id] = composite
        status_path = (
            PROCESSED_ROOT
            / "runtime"
            / "status-frames"
            / f"status-{frame_id}.png"
        )
        composite_path = (
            PROCESSED_ROOT
            / "runtime"
            / "composites"
            / f"front-{frame_id}.png"
        )
        frame_assets.append(
            {
                "frameId": frame_id,
                "status": add_output(outputs, status_path, status_frame),
                "composite": add_output(outputs, composite_path, composite),
            }
        )
    transitions = [
        changed_pixels(
            runtime_status_frames[FRAME_IDS[index]],
            runtime_status_frames[FRAME_IDS[(index + 1) % len(FRAME_IDS)]],
        )
        for index in range(len(FRAME_IDS))
    ]
    outside_changes = sum(
        changed_outside_box(
            runtime_composites["a"],
            runtime_composites[frame_id],
            VIEWPORT_RUNTIME,
        )
        for frame_id in FRAME_IDS[1:]
    )
    if not all(value > 0 for value in transitions) or outside_changes:
        raise ValueError("N02 status animation escaped its viewport")

    actor_data = load_actor()
    status_gif = status_gif_bytes(runtime_composites)
    interaction_gif, interaction_timeline = interaction_gif_bytes(
        runtime_composites,
        actor_data,
    )
    outputs[STATUS_GIF_PATH] = status_gif
    outputs[INTERACTION_GIF_PATH] = interaction_gif

    parts = {
        "keyedSources": keyed_sources,
        "orientationCutouts": orientation_cutouts,
        "runtimeOrientations": runtime_orientations,
        "runtimeShell": runtime_shell,
        "runtimeStatusFrames": runtime_status_frames,
        "runtimeComposites": runtime_composites,
        "transitionChangedPixels": transitions,
    }
    boards = (
        board_turnaround(parts),
        board_source(parts),
        board_clean(parts),
        board_scale(parts, actor_data),
        board_geometry(parts),
        board_parts(parts),
        board_loop(parts),
        board_instances(parts),
        board_interaction(parts, actor_data),
    )
    for path, board in zip(REVIEW_PATHS, boards, strict=True):
        outputs[path] = png_bytes(board)

    review_paths = [*REVIEW_PATHS, STATUS_GIF_PATH, INTERACTION_GIF_PATH]
    review_evidence: list[dict[str, Any]] = []
    for path in review_paths:
        if path.suffix == ".png":
            size = next(
                size
                for candidate, size in REVIEW_SPECS
                if candidate == path.name
            )
            kind = "png"
            frame_count = None
            duration = None
        elif path == STATUS_GIF_PATH:
            size = STATUS_GIF_SIZE
            kind = "gif"
            frame_count = 4
            duration = FRAME_DURATION_MS
        else:
            size = INTERACTION_GIF_SIZE
            kind = "gif"
            frame_count = 12
            duration = INTERACTION_FRAME_DURATION_MS
        record = {
            "path": repo_path(path),
            "sha256": sha256_bytes(outputs[path]),
            "kind": kind,
            "size": list(size),
        }
        if frame_count is not None:
            record["frameCount"] = frame_count
            record["durationMs"] = duration
        review_evidence.append(record)

    passed = lambda *evidence: {"status": "passed", "evidence": list(evidence)}
    blocked = lambda reason: {"status": "blocked", "evidence": [reason]}
    manifest = {
        "schemaVersion": 1,
        "id": "office.facility.server-rack.n02",
        "familyId": "server.rack.generated-modern",
        "revision": "n02-preflight-r01",
        "status": "visual-preflight-owner-approved",
        "productionStage": "visual-preflight-approved",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "supersedes": {
            "id": "office.facility.server-rack.n01",
            "manifest": repo_path(N01_MANIFEST_PATH),
            "manifestSha256": sha256_file(N01_MANIFEST_PATH),
            "reason": (
                "Owner requested no held prop, 2x2x4 geometry, "
                "and a fresh four-side family."
            ),
        },
        "sourcePolicy": {
            "freshImageGeneration": True,
            "originalMasterPixelReuse": False,
            "processedCropDirectReuse": False,
            "activeOfficePixelReuse": False,
            "legacyOrRejectedPixelReuse": False,
            "serverRackN01PixelReuse": False,
            "generativeRepair": False,
            "missingAssetFallback": False,
        },
        "generation": {
            "workflow": "built-in-imagegen",
            "promptRecord": {
                "file": repo_path(PROMPT_PATH),
                "sha256": sha256_file(PROMPT_PATH),
            },
            "sources": [source_records[role] for role in SOURCE_PATHS],
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
            "nonUniformRuntimeScaling": False,
            "anchor": "bottom-center",
            "basePivotRuntime": list(BASE_PIVOT_RUNTIME),
            "sortPivotRuntime": list(BASE_PIVOT_RUNTIME),
            "requiredOrientations": list(ORIENTATIONS),
            "generatedTurns": False,
            "orientations": orientation_assets,
        },
        "parts": {
            "frontAnchorSource": front_source_asset,
            "turnaroundSources": turnaround_source_assets,
            "statusKitSources": status_source_assets,
            "shell": shell_assets,
            "statusRuntimeParts": runtime_status_part_assets,
            "statusFrames": frame_assets,
        },
        "statusLoop": {
            "compositionFormula": (
                "immutableShell[orientation] + statusViewport[n]"
            ),
            "animatedOrientation": "front",
            "staticOrientations": ["left", "right", "back"],
            "frameIds": list(FRAME_IDS),
            "transition": [*FRAME_IDS, "a"],
            "frameDurationMs": FRAME_DURATION_MS,
            "cycleDurationMs": FRAME_DURATION_MS * len(FRAME_IDS),
            "viewportAuthoring": list(VIEWPORT_AUTHORING),
            "viewportRuntime": list(VIEWPORT_RUNTIME),
            "transitionChangedPixels": transitions,
            "shellChangedPixels": 0,
            "outsideViewportChangedPixels": outside_changes,
            "pivotDeltaPixels": [0, 0],
            "closureMismatchPixels": 0,
            "gif": {
                "file": repo_path(STATUS_GIF_PATH),
                "sha256": sha256_bytes(status_gif),
                "size": list(STATUS_GIF_SIZE),
                "frameCount": 4,
                "durationMs": FRAME_DURATION_MS,
            },
        },
        "interactionPreview": {
            "semanticAction": "inspect-front",
            "visualPoseAuthority": "interact-front",
            "heldProp": False,
            "h01Dependency": False,
            "handoff": False,
            "machineLocalTargetRuntime": [48, 52],
            "actorId": INTERACTION_ACTOR_ID,
            "actorAuthority": {
                "file": repo_path(ACTION_MANIFEST_PATH),
                "sha256": sha256_file(ACTION_MANIFEST_PATH),
                "sheetFile": repo_path(actor_data["sheetPath"]),
                "sheetSha256": sha256_file(actor_data["sheetPath"]),
                "pendingCommercialReview": True,
            },
            "spatialAuthority": {
                "file": repo_path(SPATIAL_MANIFEST_PATH),
                "sha256": sha256_file(SPATIAL_MANIFEST_PATH),
            },
            "placement": {
                "formula": "sceneRoot - actorRootSocket",
                "perCharacterOffsets": False,
                "magicOffset": False,
                "missingSocketFallback": False,
            },
            "timeline": interaction_timeline,
            "countsTowardRosterValidation": False,
            "countsTowardOrientationValidation": False,
            "countsTowardReservationValidation": False,
            "gif": {
                "file": repo_path(INTERACTION_GIF_PATH),
                "sha256": sha256_bytes(interaction_gif),
                "size": list(INTERACTION_GIF_SIZE),
                "frameCount": 12,
                "durationMs": INTERACTION_FRAME_DURATION_MS,
            },
        },
        "instancePreview": {
            "familyInstanceCount": 2,
            "instanceIds": ["server-rack-01", "server-rack-02"],
            "sharedFamilyPixels": True,
            "capacityTargetPerInstance": 1,
            "independentReservationTargets": True,
            "reservationProductionBuilt": False,
            "reservationSlotContribution": 0,
            "plannedReservationSlotContributionAfterF8": 2,
            "facilityV1ReadySlotsBeforeServer": 15,
            "facilityV1ReadySlotsAfterServerF8Target": 17,
        },
        "productionTargets": {
            "characterCount": 18,
            "activeFrames": 6,
            "basePoseCases": 108,
            "orientationCompositeCases": 432,
            "builtPoseCases": 0,
            "builtOrientationCompositeCases": 0,
            "twoInstanceReservationSimulationBuilt": False,
        },
        "gates": {
            "F0": passed(
                repo_path(PROMPT_PATH),
                repo_path(SOURCE_PATHS["front-anchor"]),
                repo_path(SOURCE_PATHS["turnaround"]),
                repo_path(SOURCE_PATHS["status-kit"]),
            ),
            "F1": passed(
                repo_path(REVIEW_PATHS[3]),
                repo_path(REVIEW_PATHS[4]),
            ),
            "F2": passed(
                repo_path(REVIEW_PATHS[0]),
                repo_path(REVIEW_PATHS[1]),
                repo_path(REVIEW_PATHS[2]),
            ),
            "F3": passed(
                repo_path(REVIEW_PATHS[5]),
                repo_path(REVIEW_PATHS[6]),
                repo_path(REVIEW_PATHS[7]),
                repo_path(REVIEW_PATHS[8]),
                repo_path(STATUS_GIF_PATH),
                repo_path(INTERACTION_GIF_PATH),
            ),
            "F4": blocked(
                "Visual approval passed; production parts are not built."
            ),
            "F5": blocked(
                "Visual approval passed; production machine targets, routes, "
                "and orientation sockets are not built."
            ),
            "F6": blocked(
                "Two-instance reservation simulation is not built."
            ),
            "F7": blocked(
                "The 108-pose and 432-orientation isolated lab is not built."
            ),
            "F8": blocked(
                "F8 waits for completed F4-F7 production evidence."
            ),
            "F9": blocked("Facility v1 has only 15/20 approved slots."),
            "F10": blocked("Active Office promotion is forbidden."),
        },
        "reviewOutputs": [repo_path(path) for path in review_paths],
        "reviewEvidence": review_evidence,
        "permissions": {
            "ownerReview": True,
            "fullSystemBuild": True,
            "furnitureOnlyRoom": False,
            "otherFacilityFamilies": False,
            "activeOfficePromotion": False,
        },
        "activeOfficeEvidence": [
            {"file": path, "imported": False}
            for path in ACTIVE_OFFICE_FILES
        ],
        "visualApproval": {
            "status": "owner-approved",
            "approvedOn": "2026-07-30",
            "approvedRevision": "n02-preflight-r01",
            "scope": "exact-review-output-hashes",
            "decision": (
                "Approve the fresh 2x2x4 cabinet, all four authored sides, "
                "the modular status loop, and the empty-hand inspect preview."
            ),
            "approvedReviewHashes": [
                {
                    "path": evidence["path"],
                    "sha256": evidence["sha256"],
                }
                for evidence in review_evidence
            ],
            "unlocks": ["F4", "F5", "F6", "F7", "F8"],
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
            failures.append(f"missing: {repo_path(path)}")
        elif path.read_bytes() != expected:
            failures.append(f"stale: {repo_path(path)}")
    return failures


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    outputs = build_outputs()
    if args.check:
        failures = check_outputs(outputs)
        if failures:
            raise SystemExit("\n".join(failures))
        print(
            "Server Rack N02 approved preflight rebuild OK: fresh 2x2x4 "
            "four-side family, modular A-D-A status, empty-hand I01 demo, "
            "and isolated F4-F8 production unlocked."
        )
        return 0
    write_outputs(outputs)
    print(
        "Built owner-approved Server Rack N02 visual preflight: fresh 2x2x4 "
        "four-side family, modular status loop, two-instance preview, "
        "empty-hand inspect demo, and isolated production unlocked."
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError) as error:
        print(error, file=sys.stderr)
        raise SystemExit(1) from error
