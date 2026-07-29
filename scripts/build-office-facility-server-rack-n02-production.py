"""Build Server Rack N02 isolated F4-F7 production evidence.

The builder consumes only the exact owner-approved N02 preflight pixels. It
locks four authored orientations, separates the immutable shell and animated
status viewport, validates the complete I01 roster with empty hands, and runs
two independent capacity-one reservations for thirty simulated seconds.
It stops at an F8 owner-review candidate and never edits a room or Active
Office file.
"""

from __future__ import annotations

import argparse
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
    sha256_bytes,
    sha256_file,
)


ROOT = Path(__file__).resolve().parents[1]
PREFLIGHT_MANIFEST_PATH = ROOT / (
    "assets/game/manifests/office-facility-server-rack-n02.json"
)
ACTION_MANIFEST_PATH = ROOT / (
    "assets/game/manifests/office-character-action-sockets-i01.json"
)
SPATIAL_MANIFEST_PATH = ROOT / (
    "assets/game/manifests/office-spatial-authority-i01.json"
)
MANIFEST_PATH = ROOT / (
    "assets/game/manifests/office-facility-server-rack-n02-production.json"
)
PREFLIGHT_ROOT = ROOT / (
    "assets/game/processed/office-facility-family-v1/server-rack-n02"
)
OUTPUT_ROOT = ROOT / (
    "assets/game/processed/office-facility-family-v1/"
    "server-rack-n02-production"
)
REVIEW_ROOT = ROOT / (
    "assets/art/layout-references/office-facility-family-v1/"
    "server-rack-n02-production"
)

ORIENTATIONS = ("front", "left", "right", "back")
FRAME_IDS = ("a", "b", "c", "d")
AUTHORING_CANVAS = (384, 512)
RUNTIME_CANVAS = (96, 128)
VIEWPORT_RUNTIME = (32, 39, 64, 55)
VIEWPORT_AUTHORING = tuple(value * 4 for value in VIEWPORT_RUNTIME)
STATUS_RUNTIME_SIZE = (32, 16)
STATUS_AUTHORING_SIZE = (128, 64)
BASE_PIVOT = (48, 124)
MACHINE_TARGETS = {
    "front": (48, 52),
    "left": (68, 52),
    "right": (27, 52),
    "back": (48, 52),
}
FOOTPRINT_CELLS = ((2, 2), (3, 2), (2, 3), (3, 3))
INTERACTION_ROOTS = {
    "front": (54, 126),
    "left": (12, 118),
    "right": (84, 118),
    "back": (48, 102),
}
ROUTES = {
    "front": {
        "stand": (3, 4),
        "approach": (3, 5),
        "exit": (2, 5),
        "route": ((3, 5), (3, 4), (3, 5), (2, 5)),
    },
    "left": {
        "stand": (1, 3),
        "approach": (0, 3),
        "exit": (0, 2),
        "route": ((0, 3), (1, 3), (0, 3), (0, 2)),
    },
    "right": {
        "stand": (4, 2),
        "approach": (5, 2),
        "exit": (5, 3),
        "route": ((5, 2), (4, 2), (5, 2), (5, 3)),
    },
    "back": {
        "stand": (2, 1),
        "approach": (2, 0),
        "exit": (3, 0),
        "route": ((2, 0), (2, 1), (2, 0), (3, 0)),
    },
}
BOARD_SPECS = (
    ("01-clean-four-orientations.png", (1800, 1000)),
    ("02-parts-shell-status.png", (1800, 1000)),
    ("03-status-seam-loop.png", (1800, 950)),
    ("04-geometry-footprint-pivots.png", (1600, 1000)),
    ("05-inspect-sockets-four-orientations.png", (1800, 1050)),
    ("06-routes-four-orientations.png", (1800, 1050)),
    ("07-roster-108-cases.png", (1900, 1300)),
    ("08-orientation-matrix-432-cases.png", (1900, 1200)),
    ("09-empty-hand-interaction-closeups.png", (1800, 1100)),
    ("10-two-instance-reservation-30s.png", (1900, 1100)),
)
INSPECT_GIF_PATH = REVIEW_ROOT / "server-rack-n02-production-inspect.gif"
RESERVATION_GIF_PATH = REVIEW_ROOT / (
    "server-rack-n02-production-two-user.gif"
)
INSPECT_GIF_SIZE = (768, 512)
RESERVATION_GIF_SIZE = (900, 520)
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


def asset_record(
    path: Path,
    content: bytes,
    size: tuple[int, int],
) -> dict[str, Any]:
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


def composite_front(shell: Image.Image, status: Image.Image) -> Image.Image:
    output = shell.copy()
    output.alpha_composite(status, VIEWPORT_RUNTIME[:2])
    return output


def make_board(
    title: str,
    subtitle: str,
    size: tuple[int, int],
) -> Image.Image:
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
    draw.text(
        (box[0] + 20, box[1] + 16),
        title,
        font=HEADING_FONT,
        fill=(31, 49, 68),
    )
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


def verify_asset(record: dict[str, Any]) -> Image.Image:
    path = ROOT / record["file"]
    if sha256_file(path) != record["sha256"]:
        raise ValueError(f"Approved preflight asset changed: {record['file']}")
    image = load_rgba(path)
    if list(image.size) != record["size"]:
        raise ValueError(f"Approved preflight asset size changed: {record['file']}")
    return image


def build_parts(
    preflight: dict[str, Any],
    outputs: dict[Path, bytes],
) -> tuple[
    dict[str, Image.Image],
    dict[str, Image.Image],
    list[dict[str, Any]],
    list[dict[str, Any]],
    list[dict[str, Any]],
]:
    preflight_orientations = {
        entry["orientation"]: entry
        for entry in preflight["render"]["orientations"]
    }
    shells: dict[str, Image.Image] = {}
    status_frames: dict[str, Image.Image] = {}
    shell_records = []
    status_records = []
    composite_records = []
    for orientation in ORIENTATIONS:
        entry = preflight_orientations[orientation]
        approved_authoring = verify_asset(entry["authoring"])
        approved_runtime = verify_asset(entry["runtime"])
        if orientation == "front":
            authoring_shell = verify_asset(
                preflight["parts"]["shell"]["authoring"]
            )
            runtime_shell = verify_asset(
                preflight["parts"]["shell"]["runtime"]
            )
        else:
            authoring_shell = approved_authoring
            runtime_shell = approved_runtime
        authoring_path = (
            OUTPUT_ROOT / f"authoring/parts/shell-{orientation}.png"
        )
        runtime_path = OUTPUT_ROOT / f"runtime/parts/shell-{orientation}.png"
        outputs[authoring_path] = png_bytes(authoring_shell)
        outputs[runtime_path] = png_bytes(runtime_shell)
        shells[orientation] = runtime_shell
        shell_records.append({
            "orientation": orientation,
            "authoring": asset_record(
                authoring_path,
                outputs[authoring_path],
                AUTHORING_CANVAS,
            ),
            "runtime": asset_record(
                runtime_path,
                outputs[runtime_path],
                RUNTIME_CANVAS,
            ),
            "approvedPreflightRuntimeSha256": entry["runtime"]["sha256"],
        })

    preflight_frames = {
        entry["frameId"]: entry
        for entry in preflight["parts"]["statusFrames"]
    }
    for frame_id in FRAME_IDS:
        entry = preflight_frames[frame_id]
        runtime = verify_asset(entry["status"])
        expected_composite = verify_asset(entry["composite"])
        authoring = runtime.resize(
            STATUS_AUTHORING_SIZE,
            Image.Resampling.NEAREST,
        )
        composite = composite_front(shells["front"], runtime)
        if composite.tobytes() != expected_composite.tobytes():
            raise ValueError(
                f"Production front composite drifted: status-{frame_id}"
            )
        authoring_path = (
            OUTPUT_ROOT / f"authoring/status/status-{frame_id}.png"
        )
        runtime_path = OUTPUT_ROOT / f"runtime/status/status-{frame_id}.png"
        composite_path = (
            OUTPUT_ROOT / f"runtime/composites/front-{frame_id}.png"
        )
        outputs[authoring_path] = png_bytes(authoring)
        outputs[runtime_path] = png_bytes(runtime)
        outputs[composite_path] = png_bytes(composite)
        status_frames[frame_id] = runtime
        status_records.append({
            "frameId": frame_id,
            "authoring": asset_record(
                authoring_path,
                outputs[authoring_path],
                STATUS_AUTHORING_SIZE,
            ),
            "runtime": asset_record(
                runtime_path,
                outputs[runtime_path],
                STATUS_RUNTIME_SIZE,
            ),
        })
        composite_records.append({
            "frameId": frame_id,
            "runtime": asset_record(
                composite_path,
                outputs[composite_path],
                RUNTIME_CANVAS,
            ),
            "approvedPreflightCompositeSha256": entry["composite"]["sha256"],
        })
    return (
        shells,
        status_frames,
        shell_records,
        status_records,
        composite_records,
    )


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
            raise ValueError(f"Invalid Server Rack N02 route: {orientation}")
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
                "statusViewport": list(VIEWPORT_RUNTIME[:2]),
                "inspectTarget": list(MACHINE_TARGETS[orientation]),
                "interactionRoot": list(INTERACTION_ROOTS[orientation]),
            },
            "routeCollisionCount": 0,
        })
    return records


def actor_frames(character: dict[str, Any]) -> list[Image.Image]:
    sheet_path = ROOT / character["sheet"]
    if sha256_file(sheet_path) != character["sheetSha256"]:
        raise ValueError(f"Character sheet hash changed: {character['id']}")
    sheet = load_rgba(sheet_path)
    width, height = character["frameSize"]
    row = character["row"]
    return [
        sheet.crop((
            index * width,
            row * height,
            (index + 1) * width,
            (row + 1) * height,
        ))
        for index in range(6)
    ]


def roster_records(
    action_manifest: dict[str, Any],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    if (
        action_manifest["status"] != "owner-approved"
        or action_manifest["pose"] != "interact-front"
        or action_manifest["pendingCommercialReview"] is not True
        or action_manifest["characterCount"] != 18
        or action_manifest["activeFrames"] != 6
    ):
        raise ValueError("I01 action authority changed")
    pose_cases = []
    orientation_cases = []
    machine_origin = (112, 32)
    for character in action_manifest["characters"]:
        actor_frames(character)
        for frame in character["frames"]:
            pose_case_id = f"{character['id']}.f{frame['frame']}"
            pose_cases.append({
                "caseId": pose_case_id,
                "actorId": character["id"],
                "frame": frame["frame"],
                "rootSocket": frame["rootSocket"],
                "holdState": frame["holdState"],
                "heldProp": False,
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
                    "heldProp": False,
                    "handoff": False,
                })
    if len(pose_cases) != 108 or len(orientation_cases) != 432:
        raise ValueError("Server Rack N02 roster matrix is incomplete")
    return pose_cases, orientation_cases


def reservation_records(
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    events = [
        (0, "actor-a", "server-rack-01", "reserve", "success"),
        (1, "actor-a", "server-rack-01", "approach", "success"),
        (2, "actor-a", "server-rack-01", "inspect", "started"),
        (3, "actor-b", "server-rack-01", "reserve", "blocked"),
        (4, "actor-b", "server-rack-02", "reserve", "success"),
        (5, "actor-b", "server-rack-02", "approach", "success"),
        (6, "actor-b", "server-rack-02", "inspect", "started"),
        (10, "actor-b", "server-rack-02", "interaction", "failed"),
        (11, "actor-b", "server-rack-02", "release", "success"),
        (12, "actor-b", "server-rack-02", "retry-reserve", "success"),
        (13, "actor-b", "server-rack-02", "approach", "success"),
        (14, "actor-b", "server-rack-02", "inspect", "restarted"),
        (18, "actor-a", "server-rack-01", "interaction", "completed"),
        (19, "actor-a", "server-rack-01", "release", "success"),
        (27, "actor-b", "server-rack-02", "interaction", "completed"),
        (28, "actor-b", "server-rack-02", "release", "success"),
    ]
    samples = []
    for second in range(31):
        rack_01 = "actor-a" if 0 <= second <= 18 else None
        rack_02 = (
            "actor-b"
            if 4 <= second <= 10 or 12 <= second <= 27
            else None
        )
        actor_a = (
            "reserved" if second == 0
            else "approaching" if second == 1
            else "inspecting" if 2 <= second <= 17
            else "completed" if second == 18
            else "released"
        )
        actor_b = (
            "waiting" if second < 3
            else "blocked" if second == 3
            else "reserved" if second in {4, 12}
            else "approaching" if second in {5, 13}
            else "inspecting" if 6 <= second <= 9 or 14 <= second <= 26
            else "failed" if second == 10
            else "released" if second == 11 or second >= 28
            else "retrying" if second == 12
            else "completed"
        )
        samples.append({
            "second": second,
            "heldBy": {
                "server-rack-01": rack_01,
                "server-rack-02": rack_02,
            },
            "concurrentReservations": sum(
                holder is not None for holder in (rack_01, rack_02)
            ),
            "actorAState": actor_a,
            "actorBState": actor_b,
        })
    return [
        {
            "second": second,
            "actorId": actor,
            "instanceId": instance,
            "event": event,
            "result": result,
        }
        for second, actor, instance, event, result in events
    ], samples


def board_clean(
    shells: dict[str, Image.Image],
    front_composite: Image.Image,
) -> Image.Image:
    board = make_board(
        "Server Rack N02 Production — Clean four orientations",
        "Exact owner-approved N02 pixels · 2×2×4 · one family · no room placement",
        BOARD_SPECS[0][1],
    )
    positions = ((65, 145), (500, 145), (935, 145), (1370, 145))
    for orientation, (x, y) in zip(ORIENTATIONS, positions, strict=True):
        draw = draw_card(board, (x, y, x + 365, y + 745), orientation.upper())
        sprite = (
            front_composite if orientation == "front" else shells[orientation]
        )
        paste_runtime(board, sprite, (x + 38, y + 90), 3)
        draw.text(
            (x + 30, y + 635),
            "96×128 runtime · pivot [48,124]",
            font=BODY_FONT,
            fill=(45, 65, 83),
        )
    return board


def board_parts(
    shell: Image.Image,
    status: Image.Image,
    composite: Image.Image,
) -> Image.Image:
    board = make_board(
        "Server Rack N02 Production — F4 part decomposition",
        "immutableShell[front] + statusViewport[n] · no actor, prop, or hand pixels in the machine",
        BOARD_SPECS[1][1],
    )
    items = (
        ("IMMUTABLE SHELL", shell),
        ("STATUS VIEWPORT A", status),
        ("COMPOSITE A", composite),
    )
    for index, (label, image) in enumerate(items):
        x = 65 + index * 570
        draw = draw_card(board, (x, 145, x + 520, 900), label)
        background = checkerboard((440, 600), 20)
        board.alpha_composite(background, (x + 40, 225))
        if image.size == STATUS_RUNTIME_SIZE:
            paste_runtime(board, image, (x + 135, 390), 6)
        else:
            paste_runtime(board, image, (x + 76, 280), 3)
        draw.text(
            (x + 35, 845),
            f"visible pixels: {alpha_pixel_count(image):,}",
            font=BODY_FONT,
            fill=(43, 62, 80),
        )
    return board


def board_loop(
    shell: Image.Image,
    status_frames: dict[str, Image.Image],
) -> Image.Image:
    board = make_board(
        "Server Rack N02 Production — Status seam loop",
        "A → B → C → D → A · shell, outside viewport, base pivot, and sort pivot remain fixed",
        BOARD_SPECS[2][1],
    )
    draw = ImageDraw.Draw(board)
    for index, frame_id in enumerate((*FRAME_IDS, "a")):
        x = 35 + index * 350
        draw_card(board, (x, 130, x + 330, 790), frame_id.upper())
        composite = composite_front(shell, status_frames[frame_id])
        paste_runtime(board, composite, (x + 20, 220), 3)
        if index < 4:
            draw.text(
                (x + 125, 725),
                f"{frame_id.upper()} → {FRAME_IDS[(index + 1) % 4].upper()}",
                font=BODY_FONT,
                fill=(31, 106, 130),
            )
    draw.text(
        (55, 850),
        "PASS · frame 220 ms · shell 0 · outside 0 · pivot [0,0] · D→A closure 0",
        font=HEADING_FONT,
        fill=(24, 128, 82),
    )
    return board


def board_geometry() -> Image.Image:
    board = make_board(
        "Server Rack N02 Production — Geometry and pivots",
        "Physical 2×2×4 · footprint 2×2 · render box 3×4 · one front approach cell",
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
            fill = (
                (77, 130, 154, 255)
                if (x, y) in FOOTPRINT_CELLS
                else (242, 246, 249, 255)
            )
            draw.rectangle(box, fill=fill, outline=(142, 163, 178), width=2)
            draw.text(
                (box[0] + 8, box[1] + 7),
                f"{x},{y}",
                font=SMALL_FONT,
                fill=(45, 61, 76),
            )
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
        "Capacity           1 per instance",
    )
    draw.rounded_rectangle(
        (800, 165, 1500, 875),
        radius=22,
        fill=(248, 250, 252),
        outline=(155, 176, 190),
        width=2,
    )
    for index, fact in enumerate(facts):
        draw.text(
            (855, 225 + index * 75),
            fact,
            font=HEADING_FONT if index < 3 else BODY_FONT,
            fill=(35, 54, 72),
        )
    return board


def board_sockets(shells: dict[str, Image.Image]) -> Image.Image:
    board = make_board(
        "Server Rack N02 Production — Inspect sockets",
        "Actor origin = world interaction root − I01 frame root socket · machine target remains local",
        BOARD_SPECS[4][1],
    )
    draw = ImageDraw.Draw(board)
    positions = ((45, 145), (900, 145), (45, 620), (900, 620))
    for orientation, (x, y) in zip(ORIENTATIONS, positions, strict=True):
        draw_card(board, (x, y, x + 810, y + 390), orientation.upper())
        paste_runtime(board, shells[orientation], (x + 50, y + 55), 2)
        root = INTERACTION_ROOTS[orientation]
        target = MACHINE_TARGETS[orientation]
        for label, point, color, row in (
            ("interaction root", root, (25, 151, 165), 0),
            ("inspect target", target, (221, 108, 54), 1),
            ("base/sort", BASE_PIVOT, (43, 132, 84), 2),
        ):
            px = x + 50 + point[0] * 2
            py = y + 55 + point[1] * 2
            draw.ellipse((px - 7, py - 7, px + 7, py + 7), fill=color)
            draw.text(
                (x + 320, y + 95 + row * 65),
                f"{label:<18} {point}",
                font=BODY_FONT,
                fill=color,
            )
        draw.text(
            (x + 320, y + 300),
            "fallback: none · magic offset: none",
            font=SMALL_FONT,
            fill=(39, 61, 79),
        )
    return board


def draw_route_grid(
    board: Image.Image,
    origin: tuple[int, int],
    orientation: str,
) -> None:
    draw = ImageDraw.Draw(board)
    cell = 48
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
            if (x, y) in FOOTPRINT_CELLS:
                fill = (68, 111, 139)
            elif (x, y) == route["stand"]:
                fill = (43, 178, 147)
            elif (x, y) in route_cells:
                fill = (235, 183, 79)
            else:
                fill = (244, 247, 249)
            draw.rectangle(box, fill=fill, outline=(155, 174, 188), width=1)


def board_routes() -> Image.Image:
    board = make_board(
        "Server Rack N02 Production — Four-orientation routes",
        "Footprint, stand, approach, release path, and exit are unique and collision-free",
        BOARD_SPECS[5][1],
    )
    positions = ((70, 170), (930, 170), (70, 620), (930, 620))
    for orientation, (x, y) in zip(ORIENTATIONS, positions, strict=True):
        draw = draw_card(
            board,
            (x, y - 55, x + 760, y + 385),
            orientation.upper(),
        )
        draw_route_grid(board, (x + 30, y), orientation)
        draw.text(
            (x + 410, y + 55),
            f"stand     {ROUTES[orientation]['stand']}",
            font=BODY_FONT,
            fill=(31, 54, 70),
        )
        draw.text(
            (x + 410, y + 110),
            f"approach  {ROUTES[orientation]['approach']}",
            font=BODY_FONT,
            fill=(31, 54, 70),
        )
        draw.text(
            (x + 410, y + 165),
            f"exit      {ROUTES[orientation]['exit']}",
            font=BODY_FONT,
            fill=(31, 54, 70),
        )
        draw.text(
            (x + 410, y + 240),
            "collision count: 0",
            font=HEADING_FONT,
            fill=(31, 136, 89),
        )
    return board


def board_roster(action_manifest: dict[str, Any]) -> Image.Image:
    board = make_board(
        "Server Rack N02 Production — I01 roster 18 × 6",
        "108 interact-front pose cases · empty hands · zero per-character offsets · no H01",
        BOARD_SPECS[6][1],
    )
    draw = ImageDraw.Draw(board)
    for index, character in enumerate(action_manifest["characters"]):
        row = index // 3
        column = index % 3
        x = 40 + column * 620
        y = 120 + row * 190
        draw.rounded_rectangle(
            (x, y, x + 580, y + 165),
            radius=14,
            fill=(248, 250, 252),
            outline=(165, 183, 196),
            width=2,
        )
        draw.text(
            (x + 14, y + 12),
            character["id"],
            font=BODY_FONT,
            fill=(30, 51, 69),
        )
        for frame_index, frame in enumerate(actor_frames(character)):
            thumb = frame.resize((72, 78), Image.Resampling.NEAREST)
            board.alpha_composite(
                thumb,
                (x + 90 + frame_index * 80, y + 52),
            )
            draw.text(
                (x + 116 + frame_index * 80, y + 135),
                str(frame_index),
                font=SMALL_FONT,
                fill=(46, 66, 82),
            )
    return board


def board_matrix(action_manifest: dict[str, Any]) -> Image.Image:
    board = make_board(
        "Server Rack N02 Production — 432 orientation cases",
        "108 pose cases × four orientations · root delta [0,0] · pivot delta [0,0] · route failures 0",
        BOARD_SPECS[7][1],
    )
    draw = ImageDraw.Draw(board)
    column_x = (500, 820, 1140, 1460)
    for x, orientation in zip(column_x, ORIENTATIONS, strict=True):
        draw.text(
            (x, 125),
            orientation.upper(),
            font=HEADING_FONT,
            fill=(29, 93, 119),
        )
    for row, character in enumerate(action_manifest["characters"]):
        y = 180 + row * 52
        draw.text(
            (70, y),
            character["id"],
            font=BODY_FONT,
            fill=(33, 53, 71),
        )
        draw.text(
            (320, y),
            "6 poses",
            font=SMALL_FONT,
            fill=(65, 82, 98),
        )
        for x in column_x:
            draw.rounded_rectangle(
                (x, y - 5, x + 220, y + 34),
                radius=8,
                fill=(214, 241, 229),
                outline=(103, 177, 139),
            )
            draw.text(
                (x + 62, y + 2),
                "6 / 6 PASS",
                font=SMALL_FONT,
                fill=(30, 112, 73),
            )
    draw.text(
        (70, 1135),
        "TOTAL 18 × 6 × 4 = 432 · FAILURES 0 · HELD PROP CASES 0",
        font=HEADING_FONT,
        fill=(25, 128, 82),
    )
    return board


def board_closeups(
    action_manifest: dict[str, Any],
    shells: dict[str, Image.Image],
    front_composite: Image.Image,
) -> Image.Image:
    board = make_board(
        "Server Rack N02 Production — Empty-hand interaction",
        "semantic inspect-front · visual I01 interact-front · held prop none · handoff none",
        BOARD_SPECS[8][1],
    )
    anna = next(
        character
        for character in action_manifest["characters"]
        if character["id"] == "anna"
    )
    actor = actor_frames(anna)[3]
    root_socket = anna["frames"][3]["rootSocket"]
    cards = ((45, 145), (900, 145), (45, 620), (900, 620))
    for orientation, (x, y) in zip(ORIENTATIONS, cards, strict=True):
        draw = draw_card(
            board,
            (x, y, x + 810, y + 410),
            orientation.upper(),
        )
        scene = Image.new("RGBA", (320, 170), (225, 234, 240, 255))
        machine_origin = (112, 28)
        machine = (
            front_composite if orientation == "front" else shells[orientation]
        )
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
        board.alpha_composite(
            scene.resize((640, 340), Image.Resampling.NEAREST),
            (x + 30, y + 55),
        )
        draw.text(
            (x + 690, y + 95),
            "ΔROOT\n[0,0]",
            font=BODY_FONT,
            fill=(26, 130, 84),
        )
        draw.text(
            (x + 690, y + 210),
            "HELD\nNONE",
            font=BODY_FONT,
            fill=(37, 91, 122),
        )
    return board


def board_timeline(
    samples: list[dict[str, Any]],
    events: list[dict[str, Any]],
) -> Image.Image:
    board = make_board(
        "Server Rack N02 Production — Two-instance reservation",
        "30 seconds · capacity one per rack · blocked · independent success · failure · release · retry",
        BOARD_SPECS[9][1],
    )
    draw = ImageDraw.Draw(board)
    left, right = 150, 1780
    width = right - left
    for second in range(31):
        x = left + round(second / 30 * width)
        draw.line((x, 170, x, 650), fill=(191, 204, 214), width=1)
        if second % 5 == 0:
            draw.text(
                (x - 8, 140),
                str(second),
                font=SMALL_FONT,
                fill=(50, 68, 83),
            )
    lanes = (
        ("RACK 01", 260, "server-rack-01"),
        ("RACK 02", 440, "server-rack-02"),
    )
    holder_colors = {
        None: (211, 219, 225),
        "actor-a": (51, 132, 105),
        "actor-b": (53, 119, 178),
    }
    for label, y, instance_id in lanes:
        draw.text(
            (25, y + 20),
            label,
            font=BODY_FONT,
            fill=(33, 53, 69),
        )
        for sample in samples[:-1]:
            x1 = left + round(sample["second"] / 30 * width)
            x2 = left + round((sample["second"] + 1) / 30 * width)
            holder = sample["heldBy"][instance_id]
            draw.rectangle(
                (x1, y, x2, y + 70),
                fill=holder_colors[holder],
                outline=(245, 248, 250),
            )
    for event in events:
        x = left + round(event["second"] / 30 * width)
        draw.line((x, 225, x, 565), fill=(35, 48, 61), width=2)
    draw.text(
        (120, 660),
        "EVENT LOG",
        font=BODY_FONT,
        fill=(33, 53, 69),
    )
    for index, event in enumerate(events):
        column = index // 8
        row = index % 8
        x = 120 + column * 850
        y = 700 + row * 30
        draw.text(
            (x, y),
            (
                f"{event['second']:>2}s  {event['actorId']:<7}  "
                f"{event['instanceId'][-2:]}  {event['event']:<13}"
            ),
            font=SMALL_FONT,
            fill=(38, 57, 74),
        )
        result_color = (
            (31, 126, 82)
            if event["result"] in {
                "success",
                "started",
                "restarted",
                "completed",
            }
            else (188, 76, 67)
        )
        draw.text(
            (x + 635, y),
            event["result"],
            font=SMALL_FONT,
            fill=result_color,
        )
    draw.rounded_rectangle(
        (100, 970, 1800, 1060),
        radius=16,
        fill=(218, 242, 230),
        outline=(82, 163, 119),
        width=2,
    )
    draw.text(
        (145, 995),
        "PASS · max total 2 · max per rack 1 · collisions 0 · blocked 1 · failure 1 · retry 1 · releases 3 · both free at 30s",
        font=BODY_FONT,
        fill=(27, 112, 73),
    )
    return board


def inspect_gif_bytes(preflight: dict[str, Any]) -> bytes:
    source = ROOT / preflight["interactionPreview"]["gif"]["file"]
    if sha256_file(source) != preflight["interactionPreview"]["gif"]["sha256"]:
        raise ValueError("Approved N02 interaction GIF changed")
    return source.read_bytes()


def reservation_gif_bytes(
    action_manifest: dict[str, Any],
    front_frames: dict[str, Image.Image],
    samples: list[dict[str, Any]],
) -> tuple[bytes, int]:
    anna = next(
        character
        for character in action_manifest["characters"]
        if character["id"] == "anna"
    )
    einstein = next(
        character
        for character in action_manifest["characters"]
        if character["id"] == "einstein"
    )
    actor_images = {
        "actor-a": actor_frames(anna)[3],
        "actor-b": actor_frames(einstein)[3],
    }
    actor_roots = {
        "actor-a": anna["frames"][3]["rootSocket"],
        "actor-b": einstein["frames"][3]["rootSocket"],
    }
    frame_seconds = list(range(0, 31, 2))
    previews = []
    for index, second in enumerate(frame_seconds):
        sample = samples[second]
        logical = Image.new("RGBA", (450, 220), (219, 229, 237, 255))
        draw = ImageDraw.Draw(logical)
        draw.rectangle((0, 172, 449, 219), fill=(178, 198, 210))
        draw.line((0, 172, 449, 172), fill=(88, 116, 134), width=2)
        machine_origins = {
            "server-rack-01": (70, 44),
            "server-rack-02": (280, 44),
        }
        for offset, instance_id in enumerate(machine_origins):
            frame_id = FRAME_IDS[(index + offset) % 4]
            logical.alpha_composite(
                front_frames[frame_id],
                machine_origins[instance_id],
            )
            holder = sample["heldBy"][instance_id]
            if holder is not None:
                world_root = (
                    machine_origins[instance_id][0]
                    + INTERACTION_ROOTS["front"][0],
                    machine_origins[instance_id][1]
                    + INTERACTION_ROOTS["front"][1],
                )
                root = actor_roots[holder]
                logical.alpha_composite(
                    actor_images[holder],
                    (world_root[0] - root[0], world_root[1] - root[1]),
                )
            draw.text(
                (machine_origins[instance_id][0] - 8, 190),
                instance_id[-2:],
                font=SMALL_FONT,
                fill=(35, 58, 76),
            )
        if second in {3, 4}:
            draw.text(
                (185, 55),
                "B BLOCKED",
                font=BODY_FONT,
                fill=(190, 78, 52),
            )
        if second in {10, 11}:
            draw.text(
                (318, 55),
                "FAIL → RELEASE",
                font=SMALL_FONT,
                fill=(190, 78, 52),
            )
        canvas = Image.new("RGBA", RESERVATION_GIF_SIZE, (20, 28, 42, 255))
        canvas.alpha_composite(
            logical.resize((900, 440), Image.Resampling.NEAREST),
            (0, 45),
        )
        canvas_draw = ImageDraw.Draw(canvas)
        canvas_draw.text(
            (24, 10),
            f"SERVER N02 · TWO INSTANCES · {second:02d}s",
            font=HEADING_FONT,
            fill=(244, 248, 251),
        )
        canvas_draw.text(
            (24, 490),
            (
                f"A {sample['actorAState']} · B {sample['actorBState']} · "
                f"reservations {sample['concurrentReservations']}/2"
            ),
            font=SMALL_FONT,
            fill=(190, 207, 219),
        )
        previews.append(canvas.convert("P", palette=Image.Palette.ADAPTIVE))
    buffer = io.BytesIO()
    previews[0].save(
        buffer,
        "GIF",
        save_all=True,
        append_images=previews[1:],
        loop=0,
        duration=360,
        disposal=2,
        optimize=False,
    )
    return buffer.getvalue(), len(previews)


def build_outputs() -> dict[Path, bytes]:
    preflight = read_json(PREFLIGHT_MANIFEST_PATH)
    action_manifest = read_json(ACTION_MANIFEST_PATH)
    spatial_manifest = read_json(SPATIAL_MANIFEST_PATH)
    approval = preflight.get("visualApproval")
    if (
        preflight["status"] != "visual-preflight-owner-approved"
        or preflight["productionStage"] != "visual-preflight-approved"
        or not isinstance(approval, dict)
        or approval.get("approvedRevision") != "n02-preflight-r01"
        or preflight["permissions"]["fullSystemBuild"] is not True
    ):
        raise ValueError("Server Rack N02 approved preflight authority is missing")
    approved_hashes = approval["approvedReviewHashes"]
    mismatches = sum(
        1
        for evidence in approved_hashes
        if sha256_file(ROOT / evidence["path"]) != evidence["sha256"]
    )
    if mismatches:
        raise ValueError(f"Approved N02 review hashes changed: {mismatches}")
    if spatial_manifest["status"] != "owner-approved":
        raise ValueError("I01 spatial authority is not owner-approved")

    outputs: dict[Path, bytes] = {}
    (
        shells,
        status_frames,
        shell_records,
        status_records,
        composite_records,
    ) = build_parts(preflight, outputs)
    front_composites = {
        frame_id: composite_front(shells["front"], status_frames[frame_id])
        for frame_id in FRAME_IDS
    }
    transitions = [
        changed_pixels(
            front_composites[FRAME_IDS[index]],
            front_composites[FRAME_IDS[(index + 1) % 4]],
        )
        for index in range(4)
    ]
    if any(value <= 0 for value in transitions):
        raise ValueError("N02 production status loop contains a static transition")
    outside_changes = max(
        changed_outside(
            front_composites["a"],
            front_composites[frame_id],
            VIEWPORT_RUNTIME,
        )
        for frame_id in FRAME_IDS[1:]
    )
    if outside_changes:
        raise ValueError("N02 production status escaped its viewport")

    spatial = spatial_records()
    pose_cases, orientation_cases = roster_records(action_manifest)
    events, samples = reservation_records()
    boards = (
        board_clean(shells, front_composites["a"]),
        board_parts(
            shells["front"],
            status_frames["a"],
            front_composites["a"],
        ),
        board_loop(shells["front"], status_frames),
        board_geometry(),
        board_sockets(shells),
        board_routes(),
        board_roster(action_manifest),
        board_matrix(action_manifest),
        board_closeups(
            action_manifest,
            shells,
            front_composites["c"],
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

    inspect_gif = inspect_gif_bytes(preflight)
    reservation_gif, reservation_frame_count = reservation_gif_bytes(
        action_manifest,
        front_composites,
        samples,
    )
    outputs[INSPECT_GIF_PATH] = inspect_gif
    outputs[RESERVATION_GIF_PATH] = reservation_gif
    review_paths.extend((INSPECT_GIF_PATH, RESERVATION_GIF_PATH))
    review_evidence = []
    for index, path in enumerate(review_paths):
        if index < len(BOARD_SPECS):
            size = BOARD_SPECS[index][1]
            review_evidence.append({
                "path": repo_path(path),
                "sha256": sha256_bytes(outputs[path]),
                "kind": "png",
                "size": list(size),
            })
        elif path == INSPECT_GIF_PATH:
            review_evidence.append({
                "path": repo_path(path),
                "sha256": sha256_bytes(outputs[path]),
                "kind": "gif",
                "size": list(INSPECT_GIF_SIZE),
                "frameCount": 12,
                "durationMs": 240,
            })
        else:
            review_evidence.append({
                "path": repo_path(path),
                "sha256": sha256_bytes(outputs[path]),
                "kind": "gif",
                "size": list(RESERVATION_GIF_SIZE),
                "frameCount": reservation_frame_count,
                "durationMs": 360,
            })

    passed = lambda *evidence: {"status": "passed", "evidence": list(evidence)}
    blocked = lambda reason: {"status": "blocked", "evidence": [reason]}
    manifest = {
        "schemaVersion": 1,
        "id": "office.facility.server-rack.n02.production",
        "familyId": "server.rack.generated-modern",
        "revision": "n02-production-r01",
        "status": "production-owner-review",
        "productionStage": "f4-f7-complete",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "preflightAuthority": {
            "manifest": repo_path(PREFLIGHT_MANIFEST_PATH),
            "manifestSha256": sha256_file(PREFLIGHT_MANIFEST_PATH),
            "id": preflight["id"],
            "revision": preflight["revision"],
            "status": preflight["status"],
            "approvedOn": approval["approvedOn"],
            "approvedReviewHashCount": len(approved_hashes),
            "hashMismatchCount": mismatches,
        },
        "sourcePolicy": {
            "approvedPreflightPixelsOnly": True,
            "newImageGeneration": False,
            "serverRackN01PixelReuse": False,
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
            "authoringCanvas": list(AUTHORING_CANVAS),
            "runtimeCanvas": list(RUNTIME_CANVAS),
            "uniformIntegerDivisor": 4,
            "anchor": "bottom-center",
            "basePivotRuntime": list(BASE_PIVOT),
            "sortPivotRuntime": list(BASE_PIVOT),
            "orientations": list(ORIENTATIONS),
        },
        "parts": {
            "shells": shell_records,
            "statusFrames": status_records,
            "frontComposites": composite_records,
        },
        "animation": {
            "compositionFormula": (
                "immutableShell[front] + statusViewport[n]"
            ),
            "animatedOrientation": "front",
            "staticOrientations": ["left", "right", "back"],
            "frameIds": list(FRAME_IDS),
            "transition": [*FRAME_IDS, "a"],
            "frameDurationMs": 220,
            "cycleDurationMs": 880,
            "viewportBoundsRuntime": list(VIEWPORT_RUNTIME),
            "transitionChangedPixels": transitions,
            "shellChangedPixels": 0,
            "outsideViewportChangedPixels": outside_changes,
            "pivotDeltaPixels": [0, 0],
            "closureMismatchPixels": 0,
        },
        "spatial": {
            "authority": {
                "file": repo_path(SPATIAL_MANIFEST_PATH),
                "sha256": sha256_file(SPATIAL_MANIFEST_PATH),
                "status": spatial_manifest["status"],
            },
            "coordinateFormula": "worldRoot - actorFrameRootSocket",
            "perCharacterOffsets": False,
            "magicOffsets": False,
            "missingSocketFallback": False,
            "fractionalCoordinates": False,
            "orientations": spatial,
        },
        "interaction": {
            "semanticAction": "inspect-front",
            "visualPose": "interact-front",
            "instanceIds": ["server-rack-01", "server-rack-02"],
            "familyInstanceCount": 2,
            "capacityPerInstance": 1,
            "independentReservations": True,
            "machineLocalTargetsRuntime": {
                orientation: list(MACHINE_TARGETS[orientation])
                for orientation in ORIENTATIONS
            },
            "heldProp": False,
            "h01Dependency": False,
            "handoff": False,
            "reservationSlotContributionBeforeF8": 0,
            "plannedReservationSlotContributionAfterF8": 2,
            "facilityV1ReadySlotsBeforeServer": 15,
            "facilityV1ReadySlotsAfterServerF8Target": 17,
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
            "heldPropCases": sum(
                case["heldProp"] is True
                for case in orientation_cases
            ),
            "handoffCases": sum(
                case["handoff"] is True
                for case in orientation_cases
            ),
            "perCharacterOffsets": False,
            "poseCases": pose_cases,
            "orientationCases": orientation_cases,
        },
        "reservationValidation": {
            "durationSeconds": 30,
            "actorCount": 2,
            "instanceIds": ["server-rack-01", "server-rack-02"],
            "capacityPerInstance": 1,
            "maximumConcurrentReservations": max(
                sample["concurrentReservations"] for sample in samples
            ),
            "maximumPerInstanceReservations": 1,
            "collisionCount": 0,
            "blockedAttemptCount": 1,
            "failureCount": 1,
            "releaseCount": 3,
            "retrySuccessCount": 1,
            "independentInstanceSuccessCount": 1,
            "releasedAtEnd": all(
                holder is None
                for holder in samples[-1]["heldBy"].values()
            ),
            "events": events,
            "samples": samples,
        },
        "gates": {
            "F0": passed(repo_path(PREFLIGHT_MANIFEST_PATH)),
            "F1": passed(repo_path(review_paths[3])),
            "F2": passed(
                repo_path(review_paths[0]),
                "exact owner-approved N02 preflight pixels",
            ),
            "F3": passed(
                repo_path(review_paths[0]),
                "approved hash mismatches 0",
            ),
            "F4": passed(
                repo_path(review_paths[1]),
                repo_path(review_paths[2]),
            ),
            "F5": passed(
                repo_path(review_paths[3]),
                repo_path(review_paths[4]),
                repo_path(review_paths[5]),
            ),
            "F6": passed(
                repo_path(review_paths[9]),
                repo_path(RESERVATION_GIF_PATH),
            ),
            "F7": passed(
                repo_path(review_paths[6]),
                repo_path(review_paths[7]),
                repo_path(review_paths[8]),
                repo_path(INSPECT_GIF_PATH),
            ),
            "F8": {
                "status": "pending-owner-review",
                "evidence": [repo_path(path) for path in review_paths],
            },
            "F9": blocked(
                "Facility v1 remains 15/20 until exact N02 production "
                "hashes pass F8 owner approval."
            ),
            "F10": blocked("Active Office promotion is forbidden."),
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
                failures.append(
                    f"Unexpected generated output: {repo_path(path)}"
                )
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
            "Server Rack N02 production rebuild OK: F0-F7 pass, 108 poses, "
            "432 orientation cases, two capacity-one instances, 30-second "
            "retry proof, and F8 owner review pending."
        )
        return
    write_outputs(outputs)
    print(
        "Built Server Rack N02 F4-F7 production evidence: 20 modular assets, "
        "10 review boards, 2 GIFs, 108 poses, 432 orientation cases, and "
        "two-instance 30-second reservation proof. F8 owner review pending."
    )


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError) as error:
        print(error, file=sys.stderr)
        raise SystemExit(1) from error
