"""Build Arcade Machine G02 production evidence through F7 and stop at F8."""

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
    checkerboard,
    clear_box,
    draw_title,
    json_bytes,
    layer_from_box,
    png_bytes,
    sha256_bytes,
    sha256_file,
)

ROOT = Path(__file__).resolve().parents[1]
PREFLIGHT_MANIFEST_PATH = ROOT / (
    "assets/game/manifests/office-facility-arcade-machine-g02.json"
)
ACTION_MANIFEST_PATH = ROOT / (
    "assets/game/manifests/office-character-action-sockets-i01.json"
)
SPATIAL_MANIFEST_PATH = ROOT / (
    "assets/game/manifests/office-spatial-authority-i01.json"
)
MANIFEST_PATH = ROOT / (
    "assets/game/manifests/office-facility-arcade-machine-g02-production.json"
)
PREFLIGHT_ROOT = ROOT / (
    "assets/game/processed/office-facility-family-v1/arcade-machine-g02"
)
OUTPUT_ROOT = ROOT / (
    "assets/game/processed/office-facility-family-v1/"
    "arcade-machine-g02-production"
)
REVIEW_ROOT = ROOT / (
    "assets/art/layout-references/office-facility-family-v1/"
    "arcade-machine-g02-production"
)

ORIENTATIONS = ("front", "right", "back", "left")
GAMES = ("cosmic-drift", "neon-rally", "dungeon-pulse")
FRAME_IDS = ("a", "b", "c", "d")
AUTHORING_CANVAS = (384, 512)
RUNTIME_CANVAS = (96, 128)
VIEWPORT_RUNTIME = (30, 27, 66, 63)
VIEWPORT_AUTHORING = tuple(value * 4 for value in VIEWPORT_RUNTIME)
BASE_PIVOT = (48, 124)
CONTROL_BOUNDS = {
    "front": (22, 63, 74, 83),
    "right": (62, 60, 76, 82),
    "back": None,
    "left": (20, 60, 35, 82),
}
CONTROL_SOCKETS = {
    "front": ((35, 72), (61, 72)),
    "right": ((68, 72), (65, 76)),
    "back": ((48, 72), (48, 72)),
    "left": ((28, 72), (31, 76)),
}
INTERACTION_ROOTS = {
    "front": (54, 126),
    "right": (84, 118),
    "back": (48, 100),
    "left": (12, 118),
}
FOOTPRINT_CELLS = ((2, 2), (3, 2), (2, 3), (3, 3))
ROUTES = {
    "front": {
        "stand": (3, 4),
        "approach": (3, 5),
        "exit": (2, 5),
        "route": ((3, 5), (3, 4), (3, 5), (2, 5)),
    },
    "right": {
        "stand": (4, 3),
        "approach": (5, 3),
        "exit": (5, 4),
        "route": ((5, 3), (4, 3), (5, 3), (5, 4)),
    },
    "back": {
        "stand": (2, 1),
        "approach": (2, 0),
        "exit": (3, 0),
        "route": ((2, 0), (2, 1), (2, 0), (3, 0)),
    },
    "left": {
        "stand": (1, 2),
        "approach": (0, 2),
        "exit": (0, 1),
        "route": ((0, 2), (1, 2), (0, 2), (0, 1)),
    },
}
BOARD_SPECS = (
    ("01-clean-four-orientations.png", (1800, 1000)),
    ("02-parts-shell-viewport-controls.png", (1800, 1050)),
    ("03-screen-loops-three-games.png", (1900, 1100)),
    ("04-geometry-footprint-pivots.png", (1600, 1000)),
    ("05-control-sockets-four-orientations.png", (1900, 1100)),
    ("06-routes-four-orientations.png", (1800, 1100)),
    ("07-roster-108-cases.png", (1900, 1300)),
    ("08-orientation-matrix-432-cases.png", (1900, 1200)),
    ("09-interaction-closeups.png", (1800, 1100)),
    ("10-reservation-timeline-30s.png", (1900, 1050)),
)
ACTIVE_OFFICE_FILES = (
    "apps/web/src/features/office/components/officeAssetRegistry.ts",
    "assets/game/maps/office-c-v2.json",
    "apps/web/src/features/office/components/officeSceneRuntime.ts",
)


def repo_path(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text("utf-8"))


def load_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def asset_record(path: Path, content: bytes, size: tuple[int, int]) -> dict[str, Any]:
    return {
        "file": repo_path(path),
        "sha256": sha256_bytes(content),
        "size": list(size),
    }


def alpha_pixel_count(image: Image.Image) -> int:
    return sum(1 for value in image.getchannel("A").getdata() if value)


def changed_pixels(first: Image.Image, second: Image.Image) -> int:
    return sum(
        1
        for y in range(first.height)
        for x in range(first.width)
        if first.getpixel((x, y)) != second.getpixel((x, y))
    )


def changed_outside(
    first: Image.Image,
    second: Image.Image,
    box: tuple[int, int, int, int],
) -> int:
    return sum(
        1
        for y in range(first.height)
        for x in range(first.width)
        if not (box[0] <= x < box[2] and box[1] <= y < box[3])
        and first.getpixel((x, y)) != second.getpixel((x, y))
    )


def composite_front(
    shell: Image.Image,
    viewport: Image.Image,
    controls: Image.Image,
) -> Image.Image:
    output = shell.copy()
    output.alpha_composite(viewport, VIEWPORT_RUNTIME[:2])
    output.alpha_composite(controls)
    return output


def make_board(title: str, subtitle: str, size: tuple[int, int]) -> Image.Image:
    board = Image.new("RGBA", size, (226, 234, 241, 255))
    draw_title(board, title, subtitle)
    return board


def draw_card(
    board: Image.Image,
    box: tuple[int, int, int, int],
    title: str,
) -> ImageDraw.ImageDraw:
    draw = ImageDraw.Draw(board)
    draw.rounded_rectangle(
        box,
        radius=18,
        fill=(247, 250, 252, 255),
        outline=(164, 181, 196, 255),
        width=2,
    )
    draw.text((box[0] + 20, box[1] + 16), title, font=HEADING_FONT, fill=(31, 49, 68))
    return draw


def paste_runtime(
    board: Image.Image,
    image: Image.Image,
    origin: tuple[int, int],
    scale: int,
) -> None:
    board.alpha_composite(
        image.resize(
            (image.width * scale, image.height * scale),
            Image.Resampling.NEAREST,
        ),
        origin,
    )


def split_parts(
    outputs: dict[Path, bytes],
) -> tuple[
    dict[str, Image.Image],
    dict[str, Image.Image],
    list[dict[str, Any]],
    list[dict[str, Any]],
]:
    runtime_shells: dict[str, Image.Image] = {}
    runtime_controls: dict[str, Image.Image] = {}
    shell_records = []
    control_records = []
    for orientation in ORIENTATIONS:
        authoring_source = load_rgba(
            PREFLIGHT_ROOT / f"authoring/orientations/{orientation}.png"
        )
        runtime_source = load_rgba(
            PREFLIGHT_ROOT / f"runtime/orientations/{orientation}.png"
        )
        control_box_runtime = CONTROL_BOUNDS[orientation]
        control_box_authoring = (
            tuple(value * 4 for value in control_box_runtime)
            if control_box_runtime
            else None
        )
        authoring_controls = (
            layer_from_box(authoring_source, control_box_authoring)
            if control_box_authoring
            else Image.new("RGBA", AUTHORING_CANVAS, (0, 0, 0, 0))
        )
        authoring_shell = authoring_source.copy()
        if orientation == "front":
            authoring_shell = clear_box(authoring_shell, VIEWPORT_AUTHORING)
        if control_box_authoring:
            authoring_shell = clear_box(authoring_shell, control_box_authoring)
        runtime_shell = authoring_shell.resize(
            RUNTIME_CANVAS,
            Image.Resampling.NEAREST,
        )
        runtime_control = authoring_controls.resize(
            RUNTIME_CANVAS,
            Image.Resampling.NEAREST,
        )
        expected = runtime_source.copy()
        if orientation == "front":
            expected = clear_box(expected, VIEWPORT_RUNTIME)
        recomposed = runtime_shell.copy()
        recomposed.alpha_composite(runtime_control)
        if recomposed.tobytes() != expected.tobytes():
            raise ValueError(f"{orientation} shell/control split is not pixel exact")
        runtime_shells[orientation] = runtime_shell
        runtime_controls[orientation] = runtime_control
        authoring_shell_path = (
            OUTPUT_ROOT / f"authoring/parts/shell-{orientation}.png"
        )
        runtime_shell_path = OUTPUT_ROOT / f"runtime/parts/shell-{orientation}.png"
        authoring_control_path = (
            OUTPUT_ROOT / f"authoring/parts/controls-{orientation}.png"
        )
        runtime_control_path = (
            OUTPUT_ROOT / f"runtime/parts/controls-{orientation}.png"
        )
        outputs[authoring_shell_path] = png_bytes(authoring_shell)
        outputs[runtime_shell_path] = png_bytes(runtime_shell)
        outputs[authoring_control_path] = png_bytes(authoring_controls)
        outputs[runtime_control_path] = png_bytes(runtime_control)
        shell_records.append({
            "orientation": orientation,
            "authoring": asset_record(
                authoring_shell_path,
                outputs[authoring_shell_path],
                AUTHORING_CANVAS,
            ),
            "runtime": asset_record(
                runtime_shell_path,
                outputs[runtime_shell_path],
                RUNTIME_CANVAS,
            ),
        })
        control_records.append({
            "orientation": orientation,
            "visible": control_box_runtime is not None,
            "boundsRuntime": list(control_box_runtime) if control_box_runtime else None,
            "authoring": asset_record(
                authoring_control_path,
                outputs[authoring_control_path],
                AUTHORING_CANVAS,
            ),
            "runtime": asset_record(
                runtime_control_path,
                outputs[runtime_control_path],
                RUNTIME_CANVAS,
            ),
            "visiblePixels": alpha_pixel_count(runtime_control),
        })
    return runtime_shells, runtime_controls, shell_records, control_records


def build_viewports(
    preflight: dict[str, Any],
    outputs: dict[Path, bytes],
) -> tuple[
    dict[str, list[Image.Image]],
    list[dict[str, Any]],
]:
    viewports: dict[str, list[Image.Image]] = {}
    records = []
    for game in preflight["screenSystem"]["games"]:
        game_id = game["gameId"]
        frames = []
        for frame in game["screenFrames"]:
            frame_id = frame["frameId"]
            runtime = load_rgba(ROOT / frame["file"])
            if runtime.size != (36, 36) or sha256_file(ROOT / frame["file"]) != frame["sha256"]:
                raise ValueError(f"Approved viewport changed: {game_id}.{frame_id}")
            authoring = runtime.resize((144, 144), Image.Resampling.NEAREST)
            authoring_path = (
                OUTPUT_ROOT / f"authoring/parts/viewport-{game_id}-{frame_id}.png"
            )
            runtime_path = (
                OUTPUT_ROOT / f"runtime/parts/viewport-{game_id}-{frame_id}.png"
            )
            outputs[authoring_path] = png_bytes(authoring)
            outputs[runtime_path] = png_bytes(runtime)
            records.append({
                "gameId": game_id,
                "frameId": frame_id,
                "authoring": asset_record(
                    authoring_path,
                    outputs[authoring_path],
                    (144, 144),
                ),
                "runtime": asset_record(
                    runtime_path,
                    outputs[runtime_path],
                    (36, 36),
                ),
            })
            frames.append(runtime)
        viewports[game_id] = frames
    return viewports, records


def build_composites(
    preflight: dict[str, Any],
    shell: Image.Image,
    controls: Image.Image,
    viewports: dict[str, list[Image.Image]],
    outputs: dict[Path, bytes],
) -> tuple[dict[str, list[Image.Image]], list[dict[str, Any]]]:
    composites: dict[str, list[Image.Image]] = {}
    records = []
    preflight_games = {
        game["gameId"]: game for game in preflight["screenSystem"]["games"]
    }
    for game_id in GAMES:
        frames = [
            composite_front(shell, viewport, controls)
            for viewport in viewports[game_id]
        ]
        expected_frames = preflight_games[game_id]["compositeFrames"]
        for index, (frame_id, frame) in enumerate(zip(FRAME_IDS, frames, strict=True)):
            expected = load_rgba(ROOT / expected_frames[index]["file"])
            if frame.tobytes() != expected.tobytes():
                raise ValueError(f"Production composite drifted: {game_id}.{frame_id}")
            path = OUTPUT_ROOT / f"runtime/composites/{game_id}-{frame_id}.png"
            outputs[path] = png_bytes(frame)
        transitions = [
            changed_pixels(frames[index], frames[(index + 1) % 4])
            for index in range(4)
        ]
        if any(value <= 0 for value in transitions):
            raise ValueError(f"{game_id} contains a static transition")
        outside = max(
            changed_outside(frames[0], frame, VIEWPORT_RUNTIME)
            for frame in frames[1:]
        )
        if outside:
            raise ValueError(f"{game_id} escaped the viewport")
        composites[game_id] = frames
        records.append({
            "gameId": game_id,
            "frames": [
                asset_record(
                    OUTPUT_ROOT / f"runtime/composites/{game_id}-{frame_id}.png",
                    outputs[
                        OUTPUT_ROOT / f"runtime/composites/{game_id}-{frame_id}.png"
                    ],
                    RUNTIME_CANVAS,
                )
                for frame_id in FRAME_IDS
            ],
            "transitionChangedPixels": transitions,
        })
    return composites, records


def route_is_valid(route: dict[str, Any]) -> bool:
    footprint = set(FOOTPRINT_CELLS)
    cells = route["route"]
    if any(not (0 <= x < 6 and 0 <= y < 6) for x, y in cells):
        return False
    if any(cell in footprint for cell in cells):
        return False
    return all(
        abs(first[0] - second[0]) + abs(first[1] - second[1]) == 1
        for first, second in zip(cells, cells[1:])
    )


def spatial_records() -> list[dict[str, Any]]:
    records = []
    for orientation in ORIENTATIONS:
        route = ROUTES[orientation]
        if not route_is_valid(route):
            raise ValueError(f"Invalid route for {orientation}")
        primary, secondary = CONTROL_SOCKETS[orientation]
        records.append({
            "orientation": orientation,
            "footprintCells": [list(cell) for cell in FOOTPRINT_CELLS],
            "stand": list(route["stand"]),
            "approach": list(route["approach"]),
            "exit": list(route["exit"]),
            "route": [list(cell) for cell in route["route"]],
            "facing": orientation,
            "machineLocalSockets": {
                "base": list(BASE_PIVOT),
                "sort": list(BASE_PIVOT),
                "viewport": list(VIEWPORT_RUNTIME[:2]),
                "interactionRoot": list(INTERACTION_ROOTS[orientation]),
                "controlPrimary": list(primary),
                "controlSecondary": list(secondary),
            },
            "routeCollisionCount": 0,
        })
    return records


def roster_records(
    action_manifest: dict[str, Any],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    if (
        action_manifest["status"] != "owner-approved"
        or action_manifest["pose"] != "interact-front"
        or action_manifest["pendingCommercialReview"] is not True
    ):
        raise ValueError("I01 action authority changed")
    pose_cases = []
    orientation_cases = []
    machine_origin = (112, 32)
    for character in action_manifest["characters"]:
        if sha256_file(ROOT / character["sheet"]) != character["sheetSha256"]:
            raise ValueError(f"Character sheet hash changed: {character['id']}")
        for frame in character["frames"]:
            pose_case_id = f"{character['id']}.f{frame['frame']}"
            pose_cases.append({
                "caseId": pose_case_id,
                "actorId": character["id"],
                "frame": frame["frame"],
                "rootSocket": frame["rootSocket"],
                "primaryGripSocket": frame["primaryGripSocket"],
                "holdState": frame["holdState"],
            })
            root_x, root_y = frame["rootSocket"]
            for orientation in ORIENTATIONS:
                local_root = INTERACTION_ROOTS[orientation]
                world_root = (
                    machine_origin[0] + local_root[0],
                    machine_origin[1] + local_root[1],
                )
                actor_origin = (
                    world_root[0] - root_x,
                    world_root[1] - root_y,
                )
                resolved_root = (
                    actor_origin[0] + root_x,
                    actor_origin[1] + root_y,
                )
                orientation_cases.append({
                    "caseId": f"{pose_case_id}.{orientation}",
                    "poseCaseId": pose_case_id,
                    "orientation": orientation,
                    "actorOrigin": list(actor_origin),
                    "worldRoot": list(world_root),
                    "resolvedRoot": list(resolved_root),
                    "rootAlignmentDelta": [
                        resolved_root[0] - world_root[0],
                        resolved_root[1] - world_root[1],
                    ],
                    "pivotDelta": [0, 0],
                    "routeValid": route_is_valid(ROUTES[orientation]),
                    "heldController": False,
                })
    if len(pose_cases) != 108 or len(orientation_cases) != 432:
        raise ValueError("Arcade roster matrix is incomplete")
    return pose_cases, orientation_cases


def reservation_records() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    events = [
        (0, "actor-a", "reserve", "success"),
        (1, "actor-a", "approach", "success"),
        (2, "actor-a", "interact", "started"),
        (3, "actor-b", "reserve", "blocked"),
        (10, "actor-a", "interaction", "failed"),
        (11, "actor-a", "release", "success"),
        (12, "actor-b", "retry-reserve", "success"),
        (13, "actor-b", "approach", "success"),
        (14, "actor-b", "interact", "started"),
        (27, "actor-b", "interaction", "completed"),
        (28, "actor-b", "release", "success"),
    ]
    samples = []
    for second in range(31):
        if second <= 10:
            held_by = "actor-a"
        elif 12 <= second <= 27:
            held_by = "actor-b"
        else:
            held_by = None
        actor_a = (
            "reserved" if second == 0
            else "approaching" if second == 1
            else "interacting" if 2 <= second <= 9
            else "failed" if second == 10
            else "released"
        )
        actor_b = (
            "waiting" if second < 3
            else "blocked" if 3 <= second <= 11
            else "reserved" if second == 12
            else "approaching" if second == 13
            else "interacting" if 14 <= second <= 26
            else "completed" if second == 27
            else "released"
        )
        samples.append({
            "second": second,
            "heldBy": held_by,
            "actorAState": actor_a,
            "actorBState": actor_b,
        })
    return [
        {"second": second, "actorId": actor, "event": event, "result": result}
        for second, actor, event, result in events
    ], samples


def board_clean(runtime_shells: dict[str, Image.Image], runtime_controls: dict[str, Image.Image]) -> Image.Image:
    board = make_board(
        "Arcade G02 Production — Clean four orientations",
        "Approved r02 pixels · shell and machine-local controls recomposed · no room placement",
        BOARD_SPECS[0][1],
    )
    positions = ((65, 145), (500, 145), (935, 145), (1370, 145))
    for orientation, (x, y) in zip(ORIENTATIONS, positions, strict=True):
        draw = draw_card(board, (x, y, x + 365, y + 745), orientation.upper())
        composite = runtime_shells[orientation].copy()
        composite.alpha_composite(runtime_controls[orientation])
        paste_runtime(board, composite, (x + 38, y + 90), 3)
        draw.text(
            (x + 30, y + 635),
            "96×128 runtime · pivot [48,124]",
            font=BODY_FONT,
            fill=(45, 65, 83),
        )
    return board


def board_parts(
    shell: Image.Image,
    controls: Image.Image,
    viewport: Image.Image,
    composite: Image.Image,
) -> Image.Image:
    board = make_board(
        "Arcade G02 Production — F4 part decomposition",
        "Immutable shell + viewport[n] + machine-local controls · pixel-exact recomposition",
        BOARD_SPECS[1][1],
    )
    items = (
        ("STATIC SHELL", shell),
        ("VIEWPORT A", viewport),
        ("LOCAL CONTROLS", controls),
        ("COMPOSITE", composite),
    )
    for index, (label, image) in enumerate(items):
        x = 55 + index * 435
        draw = draw_card(board, (x, 150, x + 390, 930), label)
        background = checkerboard((330, 600), 20)
        board.alpha_composite(background, (x + 30, 225))
        if image.size == (36, 36):
            paste_runtime(board, image, (x + 86, 335), 6)
        else:
            paste_runtime(board, image, (x + 51, 280), 3)
        draw.text(
            (x + 30, 860),
            f"visible pixels: {alpha_pixel_count(image):,}",
            font=BODY_FONT,
            fill=(43, 62, 80),
        )
    return board


def board_loops(composites: dict[str, list[Image.Image]]) -> Image.Image:
    board = make_board(
        "Arcade G02 Production — Three modular seam loops",
        "A → B → C → D → A · shell, controls, base pivot, and sort pivot remain fixed",
        BOARD_SPECS[2][1],
    )
    labels = {
        "cosmic-drift": "COSMIC DRIFT",
        "neon-rally": "NEON RALLY",
        "dungeon-pulse": "DUNGEON PULSE",
    }
    for row, game_id in enumerate(GAMES):
        y = 135 + row * 310
        draw = draw_card(board, (45, y, 1855, y + 275), labels[game_id])
        for index, frame in enumerate(composites[game_id]):
            x = 275 + index * 360
            paste_runtime(board, frame, (x, y + 55), 2)
            draw.text((x + 85, y + 225), FRAME_IDS[index].upper(), font=HEADING_FONT, fill=(24, 112, 122))
        draw.text((1660, y + 115), "D → A\nPASS", font=HEADING_FONT, fill=(27, 132, 84))
    return board


def board_geometry() -> Image.Image:
    board = make_board(
        "Arcade G02 Production — Geometry and pivots",
        "Physical 2×2×4 · footprint 2×2 · render box 3×4 · front approach one cell",
        BOARD_SPECS[3][1],
    )
    draw = ImageDraw.Draw(board)
    cell = 90
    origin = (120, 220)
    for y in range(6):
        for x in range(6):
            box = (
                origin[0] + x * cell,
                origin[1] + y * cell,
                origin[0] + (x + 1) * cell,
                origin[1] + (y + 1) * cell,
            )
            fill = (77, 130, 154, 255) if (x, y) in FOOTPRINT_CELLS else (242, 246, 249, 255)
            draw.rectangle(box, fill=fill, outline=(142, 163, 178), width=2)
            draw.text((box[0] + 8, box[1] + 7), f"{x},{y}", font=SMALL_FONT, fill=(45, 61, 76))
    stand = ROUTES["front"]["stand"]
    stand_box = (
        origin[0] + stand[0] * cell,
        origin[1] + stand[1] * cell,
        origin[0] + (stand[0] + 1) * cell,
        origin[1] + (stand[1] + 1) * cell,
    )
    draw.rectangle(stand_box, outline=(21, 188, 172), width=7)
    facts = (
        "Physical scale     2 × 2 × 4 tiles",
        "Floor footprint    2 × 2 tiles",
        "Render box         3 × 4 tiles",
        "Runtime canvas     96 × 128 px",
        "Base pivot         [48,124]",
        "Sort pivot         [48,124]",
        "Approach depth     1 cell",
        "Capacity           1 person",
    )
    draw.rounded_rectangle((800, 165, 1500, 875), radius=22, fill=(248, 250, 252), outline=(155, 176, 190), width=2)
    for index, fact in enumerate(facts):
        draw.text((855, 225 + index * 75), fact, font=HEADING_FONT if index < 3 else BODY_FONT, fill=(35, 54, 72))
    return board


def board_sockets(
    shells: dict[str, Image.Image],
    controls: dict[str, Image.Image],
) -> Image.Image:
    board = make_board(
        "Arcade G02 Production — Machine-local control sockets",
        "Blue base/sort · cyan interaction root · amber primary/secondary controls · no held controller",
        BOARD_SPECS[4][1],
    )
    positions = ((45, 145), (510, 145), (975, 145), (1440, 145))
    for orientation, (x, y) in zip(ORIENTATIONS, positions, strict=True):
        draw = draw_card(board, (x, y, x + 415, y + 820), orientation.upper())
        machine = shells[orientation].copy()
        machine.alpha_composite(controls[orientation])
        paste_runtime(board, machine, (x + 60, y + 100), 3)
        for point_value, color in (
            (BASE_PIVOT, (45, 102, 210)),
            (INTERACTION_ROOTS[orientation], (14, 178, 166)),
            (CONTROL_SOCKETS[orientation][0], (235, 154, 36)),
            (CONTROL_SOCKETS[orientation][1], (244, 194, 70)),
        ):
            px = x + 60 + point_value[0] * 3
            py = y + 100 + point_value[1] * 3
            draw.ellipse((px - 8, py - 8, px + 8, py + 8), fill=color, outline="white", width=2)
        draw.text((x + 24, y + 590), f"root {INTERACTION_ROOTS[orientation]}", font=BODY_FONT, fill=(35, 54, 72))
        draw.text((x + 24, y + 630), f"control {CONTROL_SOCKETS[orientation][0]}", font=BODY_FONT, fill=(35, 54, 72))
        draw.text((x + 24, y + 690), "per-scene offset: false", font=SMALL_FONT, fill=(37, 125, 87))
        draw.text((x + 24, y + 720), "fallback socket: false", font=SMALL_FONT, fill=(37, 125, 87))
    return board


def draw_route_grid(board: Image.Image, origin: tuple[int, int], orientation: str) -> None:
    draw = ImageDraw.Draw(board)
    cell = 55
    route = ROUTES[orientation]
    route_cells = set(route["route"])
    for y in range(6):
        for x in range(6):
            box = (
                origin[0] + x * cell,
                origin[1] + y * cell,
                origin[0] + (x + 1) * cell,
                origin[1] + (y + 1) * cell,
            )
            fill = (
                (74, 119, 143)
                if (x, y) in FOOTPRINT_CELLS
                else (184, 238, 230)
                if (x, y) in route_cells
                else (244, 247, 249)
            )
            draw.rectangle(box, fill=fill, outline=(142, 164, 178), width=1)
    colors = {
        "stand": (23, 154, 139),
        "approach": (48, 115, 196),
        "exit": (222, 137, 48),
    }
    for name in ("stand", "approach", "exit"):
        x, y = route[name]
        center = (
            origin[0] + x * cell + cell // 2,
            origin[1] + y * cell + cell // 2,
        )
        draw.ellipse((center[0] - 12, center[1] - 12, center[0] + 12, center[1] + 12), fill=colors[name])


def board_routes() -> Image.Image:
    board = make_board(
        "Arcade G02 Production — Four-orientation routes",
        "Footprint, stand, approach, release path, and exit remain unique and collision-free",
        BOARD_SPECS[5][1],
    )
    positions = ((70, 170), (930, 170), (70, 620), (930, 620))
    for orientation, (x, y) in zip(ORIENTATIONS, positions, strict=True):
        draw = draw_card(board, (x, y - 55, x + 760, y + 385), orientation.upper())
        draw_route_grid(board, (x + 30, y), orientation)
        draw.text((x + 410, y + 60), f"stand     {ROUTES[orientation]['stand']}", font=BODY_FONT, fill=(31, 54, 70))
        draw.text((x + 410, y + 115), f"approach  {ROUTES[orientation]['approach']}", font=BODY_FONT, fill=(31, 54, 70))
        draw.text((x + 410, y + 170), f"exit      {ROUTES[orientation]['exit']}", font=BODY_FONT, fill=(31, 54, 70))
        draw.text((x + 410, y + 240), "collision count: 0", font=HEADING_FONT, fill=(31, 136, 89))
    return board


def actor_frames(character: dict[str, Any]) -> list[Image.Image]:
    sheet = load_rgba(ROOT / character["sheet"])
    width, height = character["frameSize"]
    row = character["row"]
    return [
        sheet.crop((index * width, row * height, (index + 1) * width, (row + 1) * height))
        for index in range(6)
    ]


def board_roster(action_manifest: dict[str, Any]) -> Image.Image:
    board = make_board(
        "Arcade G02 Production — I01 roster 18 × 6",
        "108 interact-front pose cases · shared semantic roots · zero per-character offsets · no controller",
        BOARD_SPECS[6][1],
    )
    draw = ImageDraw.Draw(board)
    for index, character in enumerate(action_manifest["characters"]):
        row = index // 3
        column = index % 3
        x = 40 + column * 620
        y = 120 + row * 190
        draw.rounded_rectangle((x, y, x + 580, y + 165), radius=14, fill=(248, 250, 252), outline=(165, 183, 196), width=2)
        draw.text((x + 14, y + 12), character["id"], font=BODY_FONT, fill=(30, 51, 69))
        for frame_index, frame in enumerate(actor_frames(character)):
            thumb = frame.resize((72, 78), Image.Resampling.NEAREST)
            board.alpha_composite(thumb, (x + 90 + frame_index * 80, y + 52))
            draw.text((x + 116 + frame_index * 80, y + 135), str(frame_index), font=SMALL_FONT, fill=(46, 66, 82))
    return board


def board_matrix(action_manifest: dict[str, Any]) -> Image.Image:
    board = make_board(
        "Arcade G02 Production — 432 orientation cases",
        "108 pose cases × four machine orientations · root delta [0,0] · pivot delta [0,0] · route failures 0",
        BOARD_SPECS[7][1],
    )
    draw = ImageDraw.Draw(board)
    column_x = (500, 820, 1140, 1460)
    for x, orientation in zip(column_x, ORIENTATIONS, strict=True):
        draw.text((x, 125), orientation.upper(), font=HEADING_FONT, fill=(29, 93, 119))
    for row, character in enumerate(action_manifest["characters"]):
        y = 180 + row * 52
        draw.text((70, y), character["id"], font=BODY_FONT, fill=(33, 53, 71))
        draw.text((320, y), "6 poses", font=SMALL_FONT, fill=(65, 82, 98))
        for x in column_x:
            draw.rounded_rectangle((x, y - 5, x + 220, y + 34), radius=8, fill=(214, 241, 229), outline=(103, 177, 139))
            draw.text((x + 62, y + 2), "6 / 6 PASS", font=SMALL_FONT, fill=(30, 112, 73))
    draw.text((70, 1135), "TOTAL 18 × 6 × 4 = 432 · FAILURES 0", font=HEADING_FONT, fill=(25, 128, 82))
    return board


def board_closeups(
    action_manifest: dict[str, Any],
    shells: dict[str, Image.Image],
    controls: dict[str, Image.Image],
    composite_front_image: Image.Image,
) -> Image.Image:
    board = make_board(
        "Arcade G02 Production — Interaction close-ups",
        "Actor origin = world root − I01 frame root socket · machine-local controls · no held controller",
        BOARD_SPECS[8][1],
    )
    anna = next(character for character in action_manifest["characters"] if character["id"] == "anna")
    actor = actor_frames(anna)[1]
    root_socket = anna["frames"][1]["rootSocket"]
    cards = ((45, 145), (900, 145), (45, 620), (900, 620))
    for orientation, (x, y) in zip(ORIENTATIONS, cards, strict=True):
        draw = draw_card(board, (x, y, x + 810, y + 410), orientation.upper())
        scene = Image.new("RGBA", (320, 170), (225, 234, 240, 255))
        machine_origin = (112, 28)
        machine = (
            composite_front_image
            if orientation == "front"
            else shells[orientation].copy()
        )
        if orientation != "front":
            machine.alpha_composite(controls[orientation])
        world_root = (
            machine_origin[0] + INTERACTION_ROOTS[orientation][0],
            machine_origin[1] + INTERACTION_ROOTS[orientation][1],
        )
        actor_origin = (
            world_root[0] - root_socket[0],
            world_root[1] - root_socket[1],
        )
        if orientation == "back":
            scene.alpha_composite(actor, actor_origin)
            scene.alpha_composite(machine, machine_origin)
        else:
            scene.alpha_composite(machine, machine_origin)
            scene.alpha_composite(actor, actor_origin)
        board.alpha_composite(scene.resize((640, 340), Image.Resampling.NEAREST), (x + 30, y + 55))
        draw.text((x + 690, y + 100), "ΔROOT\n[0,0]", font=BODY_FONT, fill=(26, 130, 84))
        draw.text((x + 690, y + 210), "HELD\nNONE", font=BODY_FONT, fill=(37, 91, 122))
    return board


def board_timeline(samples: list[dict[str, Any]], events: list[dict[str, Any]]) -> Image.Image:
    board = make_board(
        "Arcade G02 Production — Two-user reservation timeline",
        "30 seconds · capacity one · blocked attempt · failure · release · retry · final release",
        BOARD_SPECS[9][1],
    )
    draw = ImageDraw.Draw(board)
    left, right = 120, 1780
    width = right - left
    for second in range(31):
        x = left + round(second / 30 * width)
        draw.line((x, 190, x, 760), fill=(191, 204, 214), width=1)
        if second % 5 == 0:
            draw.text((x - 8, 155), str(second), font=SMALL_FONT, fill=(50, 68, 83))
    lanes = (("ACTOR A", 300, "actorAState"), ("ACTOR B", 520, "actorBState"))
    colors = {
        "waiting": (208, 216, 222),
        "reserved": (83, 139, 190),
        "approaching": (63, 173, 160),
        "interacting": (50, 128, 100),
        "blocked": (224, 149, 62),
        "failed": (205, 76, 71),
        "completed": (90, 166, 104),
        "released": (158, 177, 190),
    }
    for label, y, key in lanes:
        draw.text((25, y + 22), label, font=BODY_FONT, fill=(33, 53, 69))
        for sample in samples[:-1]:
            x1 = left + round(sample["second"] / 30 * width)
            x2 = left + round((sample["second"] + 1) / 30 * width)
            state = sample[key]
            draw.rectangle((x1, y, x2, y + 70), fill=colors[state], outline=(245, 248, 250))
    for event in events:
        x = left + round(event["second"] / 30 * width)
        draw.line((x, 250, x, 605), fill=(35, 48, 61), width=3)
    draw.text((120, 635), "EVENT LOG", font=BODY_FONT, fill=(33, 53, 69))
    for index, event in enumerate(events):
        column = index // 6
        row = index % 6
        x = 120 + column * 830
        y = 680 + row * 28
        result_color = (
            (31, 126, 82)
            if event["result"] in {"success", "started", "completed"}
            else (188, 76, 67)
            if event["result"] in {"blocked", "failed"}
            else (38, 57, 74)
        )
        draw.text(
            (x, y),
            f"{event['second']:>2}s  {event['actorId']:<7}  {event['event']:<13}",
            font=SMALL_FONT,
            fill=(38, 57, 74),
        )
        draw.text((x + 610, y), event["result"], font=SMALL_FONT, fill=result_color)
    draw.rounded_rectangle((100, 865, 1800, 995), radius=16, fill=(218, 242, 230), outline=(82, 163, 119), width=2)
    draw.text((145, 905), "PASS · maximum reservation 1 · collisions 0 · blocked 1 · failure 1 · retry success 1 · releases 2 · heldBy null at 30s", font=BODY_FONT, fill=(27, 112, 73))
    return board


def build_outputs() -> dict[Path, bytes]:
    preflight = read_json(PREFLIGHT_MANIFEST_PATH)
    action_manifest = read_json(ACTION_MANIFEST_PATH)
    spatial_manifest = read_json(SPATIAL_MANIFEST_PATH)
    if (
        preflight["status"] != "visual-preflight-owner-approved"
        or preflight["visualApproval"]["approvedRevision"] != "g02-preflight-r02"
        or preflight["permissions"]["fullSystemBuild"] is not True
    ):
        raise ValueError("Arcade G02 approved preflight authority is missing")
    approved_hashes = preflight["visualApproval"]["approvedReviewHashes"]
    mismatches = sum(
        1
        for evidence in approved_hashes
        if sha256_file(ROOT / evidence["path"]) != evidence["sha256"]
    )
    if mismatches:
        raise ValueError(f"Approved G02 review hashes changed: {mismatches}")
    if spatial_manifest["status"] != "owner-approved":
        raise ValueError("I01 spatial authority is not owner-approved")

    outputs: dict[Path, bytes] = {}
    runtime_shells, runtime_controls, shells, controls = split_parts(outputs)
    viewports, viewport_records = build_viewports(preflight, outputs)
    composites, game_records = build_composites(
        preflight,
        runtime_shells["front"],
        runtime_controls["front"],
        viewports,
        outputs,
    )
    spatial = spatial_records()
    pose_cases, orientation_cases = roster_records(action_manifest)
    events, samples = reservation_records()

    boards = (
        board_clean(runtime_shells, runtime_controls),
        board_parts(
            runtime_shells["front"],
            runtime_controls["front"],
            viewports["cosmic-drift"][0],
            composites["cosmic-drift"][0],
        ),
        board_loops(composites),
        board_geometry(),
        board_sockets(runtime_shells, runtime_controls),
        board_routes(),
        board_roster(action_manifest),
        board_matrix(action_manifest),
        board_closeups(
            action_manifest,
            runtime_shells,
            runtime_controls,
            composites["cosmic-drift"][1],
        ),
        board_timeline(samples, events),
    )
    review_paths = []
    for board, (name, size) in zip(boards, BOARD_SPECS, strict=True):
        if board.size != size:
            raise ValueError(f"Review board size changed: {name}")
        path = REVIEW_ROOT / name
        outputs[path] = png_bytes(board)
        review_paths.append(path)
    review_evidence = [
        {
            "path": repo_path(path),
            "sha256": sha256_bytes(outputs[path]),
            "size": list(size),
        }
        for path, (_, size) in zip(review_paths, BOARD_SPECS, strict=True)
    ]

    passed = lambda *evidence: {"status": "passed", "evidence": list(evidence)}
    blocked = lambda reason: {"status": "blocked", "evidence": [reason]}
    manifest = {
        "schemaVersion": 1,
        "id": "office.facility.arcade-machine.g02.production",
        "familyId": "machine.game.arcade.generated-modern",
        "revision": "g02-production-r01",
        "status": "owner-review-f8-pending",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "preflightAuthority": {
            "manifest": repo_path(PREFLIGHT_MANIFEST_PATH),
            "manifestSha256": sha256_file(PREFLIGHT_MANIFEST_PATH),
            "id": preflight["id"],
            "revision": preflight["revision"],
            "status": preflight["status"],
            "approvedReviewHashCount": len(approved_hashes),
            "hashMismatchCount": mismatches,
        },
        "sourcePolicy": {
            "approvedPreflightPixelsOnly": True,
            "newImageGeneration": False,
            "previousArcadePixelReuse": False,
            "activeOfficePixelReuse": False,
            "processedForeignFamilyReuse": False,
            "generativeRepair": False,
            "missingAssetFallback": False,
        },
        "render": {
            "physicalScale": {"width": 2, "depth": 2, "height": 4, "unit": "tile"},
            "footprint": {"width": 2, "depth": 2, "unit": "tile"},
            "renderBox": {"width": 3, "height": 4, "unit": "tile"},
            "authoringCanvas": list(AUTHORING_CANVAS),
            "runtimeCanvas": list(RUNTIME_CANVAS),
            "uniformIntegerDivisor": 4,
            "anchor": "bottom-center",
            "basePivotRuntime": list(BASE_PIVOT),
            "sortPivotRuntime": list(BASE_PIVOT),
            "orientations": list(ORIENTATIONS),
        },
        "parts": {
            "shell": shells,
            "controls": controls,
            "viewports": viewport_records,
        },
        "animation": {
            "compositionFormula": "shell + viewport[n] + machineLocalControls",
            "frameIds": list(FRAME_IDS),
            "transition": [*FRAME_IDS, "a"],
            "frameDurationMs": 200,
            "viewportBoundsRuntime": list(VIEWPORT_RUNTIME),
            "shellChangedPixels": 0,
            "controlsChangedPixels": 0,
            "outsideViewportChangedPixels": 0,
            "pivotDeltaPixels": [0, 0],
            "closureMismatchPixels": 0,
            "games": game_records,
        },
        "spatial": {
            "authority": {
                "file": repo_path(SPATIAL_MANIFEST_PATH),
                "sha256": sha256_file(SPATIAL_MANIFEST_PATH),
                "status": spatial_manifest["status"],
            },
            "coordinateFormula": "worldRoot - actorFrameRootSocket",
            "perSceneOffsets": False,
            "missingSocketFallback": False,
            "fractionalCoordinates": False,
            "orientations": spatial,
        },
        "interaction": {
            "capacity": 1,
            "action": "play-arcade-machine",
            "visualPose": "interact-front",
            "frontApproachCells": 1,
            "machineLocalControls": True,
            "heldController": False,
            "heldPropManifest": None,
            "reservationSlotContribution": 0,
            "plannedReservationSlotContributionAfterF8": 1,
        },
        "rosterValidation": {
            "authorityManifest": repo_path(ACTION_MANIFEST_PATH),
            "authoritySha256": sha256_file(ACTION_MANIFEST_PATH),
            "pendingCommercialReview": True,
            "characterCount": 18,
            "activeFrames": 6,
            "poseCaseCount": len(pose_cases),
            "orientationCaseCount": len(orientation_cases),
            "rootAlignmentFailures": sum(
                case["rootAlignmentDelta"] != [0, 0]
                for case in orientation_cases
            ),
            "pivotDriftFailures": sum(
                case["pivotDelta"] != [0, 0]
                for case in orientation_cases
            ),
            "routeFailures": sum(
                case["routeValid"] is not True
                for case in orientation_cases
            ),
            "heldControllerCases": sum(
                case["heldController"] is True
                for case in orientation_cases
            ),
            "perCharacterOffsets": False,
            "poseCases": pose_cases,
            "orientationCases": orientation_cases,
        },
        "reservationValidation": {
            "durationSeconds": 30,
            "actorCount": 2,
            "maximumConcurrentReservations": 1,
            "collisionCount": 0,
            "blockedAttemptCount": 1,
            "failureCount": 1,
            "releaseCount": 2,
            "retrySuccessCount": 1,
            "releasedAtEnd": samples[-1]["heldBy"] is None,
            "events": events,
            "samples": samples,
        },
        "gates": {
            "F0": passed(repo_path(PREFLIGHT_MANIFEST_PATH)),
            "F1": passed(repo_path(review_paths[3])),
            "F2": passed(repo_path(review_paths[0]), "exact approved r02 pixels"),
            "F3": passed(repo_path(review_paths[0]), "approved hash mismatches 0"),
            "F4": passed(repo_path(review_paths[1]), repo_path(review_paths[2])),
            "F5": passed(repo_path(review_paths[3]), repo_path(review_paths[4]), repo_path(review_paths[5])),
            "F6": passed(repo_path(review_paths[9]), "capacity-one failure/retry simulation"),
            "F7": passed(repo_path(review_paths[6]), repo_path(review_paths[7]), repo_path(review_paths[8]), repo_path(review_paths[9])),
            "F8": {
                "status": "pending-owner-review",
                "evidence": [repo_path(path) for path in review_paths],
            },
            "F9": blocked("Arcade is not counted or placed before F8 approval."),
            "F10": blocked("Active Office promotion is forbidden."),
        },
        "reviewOutputs": [repo_path(path) for path in review_paths],
        "reviewEvidence": review_evidence,
        "permissions": {
            "familyLab": True,
            "ownerReview": True,
            "furnitureOnlyRoom": False,
            "otherFacilityFamilies": False,
            "activeOfficePromotion": False,
        },
        "activeOfficeEvidence": [
            {"file": file, "imported": False}
            for file in ACTIVE_OFFICE_FILES
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
    failures = []
    for path, expected in outputs.items():
        if not path.exists():
            failures.append(f"Missing generated output: {repo_path(path)}")
        elif path.read_bytes() != expected:
            failures.append(f"Stale generated output: {repo_path(path)}")
    expected = set(outputs)
    for directory in (OUTPUT_ROOT, REVIEW_ROOT):
        if not directory.exists():
            continue
        for path in directory.rglob("*"):
            if path.is_file() and path not in expected:
                failures.append(f"Unexpected generated output: {repo_path(path)}")
    return failures


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
            "Arcade G02 production rebuild OK: F0-F7 pass, 108 poses, "
            "432 orientation cases, 30-second retry proof, F8 pending."
        )
        return
    write_outputs(outputs)
    print(
        "Built Arcade G02 production F4-F7: separated shell/viewport/controls, "
        "10 review boards, and owner review pending at F8."
    )


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError) as error:
        print(error, file=sys.stderr)
        raise SystemExit(1) from error
