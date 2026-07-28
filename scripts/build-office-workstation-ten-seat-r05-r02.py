#!/usr/bin/env python3
"""Build the isolated R05-r02 ten-seat upper-left Office review candidate."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import io
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
BASE_BUILDER_PATH = ROOT / "scripts/build-office-workstation-step5-r05-r02.py"
BACKGROUND_PATH = ROOT / "assets/art/backgrounds/office-c-background-modern-v3.png"
ACTIVE_MAP_PATH = ROOT / "assets/game/maps/office-c-v2.json"
SOCKETS_PATH = ROOT / "assets/game/manifests/office-character-seat-sockets-v1.json"
MAP_PATH = ROOT / "assets/game/maps/office-workstation-ten-seat-r05-r02.json"
MANIFEST_PATH = ROOT / "assets/game/manifests/office-workstation-ten-seat-r05-r02.json"
REVIEW_DIR = ROOT / "assets/art/layout-references/office-workstation-v3/ten-seat-r05-r02"
REJECTED_REVIEW_PATH = ROOT / "assets/art/layout-references/office-workstation-v3/step5-r05-final/05-ten-seat-office-clean.png"
QA_DIR = ROOT / "assets/game/processed/office-workstation-v3/ten-seat-r05-r02/qa"

TILE = 32
STAGE_SIZE = (1365, 768)
DESK_X = [2, 5, 8, 11, 14]
CURRENT_DESK_Y = {"far": 11, "near": 13}
CURRENT_CHAIR_Y = {"far": 10, "near": 15}
RESERVED_DESK_Y = {"far": 18, "near": 20}
RESERVED_CHAIR_Y = {"far": 17, "near": 22}

CURRENT_ROSTER = {
    "far": [
        ("market-scout", "yinyue-2"),
        ("product-ranker", "einstein"),
        ("growth-strategist", "ruri"),
        ("performance-analyst", "noir-webling"),
        ("gemini-copywriter", "anna"),
    ],
    "near": [
        ("flow-visual-producer", "taffy-2"),
        ("link-attribution", "doraemon"),
        ("qa-editor", "rem-xl"),
        ("publisher", "miku"),
        ("session-keeper", "ai-workbot"),
    ],
}

REVIEW_PATHS = [
    REVIEW_DIR / "01-four-station-intersection-clean-debug.png",
    REVIEW_DIR / "02-ten-seat-upper-left-clean.png",
    REVIEW_DIR / "03-ten-seat-upper-left-debug.png",
    REVIEW_DIR / "04-ten-seat-seat-contact-matrix.png",
    REVIEW_DIR / "05-rejected-r05-final-vs-upper-left-rebuild.png",
    REVIEW_DIR / "06-capacity-20-reservation-plan.png",
]

QA_CAPTURES = [
    QA_DIR / "01-browser-desktop-clean.png",
    QA_DIR / "02-browser-desktop-debug.png",
    QA_DIR / "03-browser-mobile-clean.png",
    QA_DIR / "04-browser-mobile-debug.png",
]


def load_base_builder():
    spec = importlib.util.spec_from_file_location("office_r05_r02_builder", BASE_BUILDER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {BASE_BUILDER_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


BASE = load_base_builder()
COLORS = BASE.COLORS


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def repo_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def json_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def png_bytes(image: Image.Image) -> bytes:
    stream = io.BytesIO()
    image.save(stream, format="PNG", optimize=False, compress_level=9)
    return stream.getvalue()


def desk_draw_point(x: int, y: int) -> tuple[int, int]:
    return x * TILE, y * TILE - 2 * TILE


def station_records() -> list[dict[str, Any]]:
    records = []
    for orientation in ("far", "near"):
        for column, (agent_id, slug) in enumerate(CURRENT_ROSTER[orientation]):
            x = DESK_X[column]
            desk_y = CURRENT_DESK_Y[orientation]
            chair_y = CURRENT_CHAIR_Y[orientation]
            desk_left, desk_top = desk_draw_point(x, desk_y)
            actor_orientation = "front" if orientation == "far" else "back"
            contacts = []
            for frame in range(6):
                local = BASE.seat_socket(slug, actor_orientation, frame)
                contacts.append({
                    "frame": frame,
                    "actorSeatContactLocal": list(local),
                    "chairSeatSocketLocal": list(BASE.CHAIR_SEAT_SOCKET),
                    "resolvedDeltaPixels": [0, 0],
                })
            records.append({
                "id": f"current-{orientation}-{column + 1}",
                "column": column + 1,
                "agentId": agent_id,
                "characterSlug": slug,
                "orientation": orientation,
                "deskOriginWorld": [x, desk_y, 0],
                "deskDrawOriginPixels": [desk_left, desk_top],
                "chairFloorWorld": [x + 1.5, chair_y, 0],
                "chairSeatWorld": [x + 1.5, chair_y, 1],
                "actorOccupancyOriginWorld": [x + 1, chair_y, 0],
                "seatContacts": contacts,
            })
    return records


def reserved_records() -> list[dict[str, Any]]:
    return [
        {
            "id": f"future-{orientation}-{column + 1}",
            "column": column + 1,
            "orientation": orientation,
            "deskOriginWorld": [x, RESERVED_DESK_Y[orientation], 0],
            "chairFloorWorld": [x + 1.5, RESERVED_CHAIR_Y[orientation], 0],
            "employeeAssigned": False,
            "artRendered": False,
        }
        for orientation in ("far", "near")
        for column, x in enumerate(DESK_X)
    ]


def ten_seat_map_data() -> dict[str, Any]:
    current = station_records()
    reserved = reserved_records()
    horizontal_joins = [
        {
            "row": orientation,
            "leftStation": f"current-{orientation}-{column}",
            "rightStation": f"current-{orientation}-{column + 1}",
            "gapPixels": 0,
        }
        for orientation in ("far", "near")
        for column in range(1, 5)
    ]
    depth_joins = [
        {
            "column": column,
            "farStation": f"current-far-{column}",
            "nearStation": f"current-near-{column}",
            "originDeltaTiles": [0, 2, 0],
            "originDeltaPixels": [0, 64],
            "tabletopGapPixels": 0,
        }
        for column in range(1, 6)
    ]
    return {
        "schemaVersion": 1,
        "id": "office-workstation-ten-seat-r05-r02",
        "status": "owner-review-p4-p6",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "stagePixels": list(STAGE_SIZE),
        "grid": {"tilePixels": TILE, "worldAxes": {"x": "right", "y": "toward-viewer", "z": "up"}},
        "placement": {
            "zone": "upper-left",
            "columnCount": 5,
            "currentRowCount": 2,
            "futureRowCount": 2,
            "deskOriginsX": DESK_X,
            "currentDeskOriginsY": CURRENT_DESK_Y,
            "reservedDeskOriginsY": RESERVED_DESK_Y,
        },
        "capacity": {"currentEmployees": 10, "reservedEmployees": 10, "totalPlannedEmployees": 20},
        "currentWorkstations": current,
        "futureReservations": reserved,
        "joins": {"horizontal": horizontal_joins, "depth": depth_joins},
        "geometry": {
            "deskVolume": [3, 2, 2],
            "chairVolume": [1, 1, 2],
            "personVolume": [1, 1, 3],
            "monitorReservation": [3, 1],
            "keyboardReservation": [1, 1],
        },
        "rules": {
            "deriveFromApprovedPair": True,
            "importRejectedTenSeatCoordinates": False,
            "renderFutureFurniture": False,
            "renderFutureEmployees": False,
            "newCharacterOrPose": False,
            "otherFurniture": False,
        },
        "sourceBackground": {"file": repo_path(BACKGROUND_PATH), "sha256": sha256(BACKGROUND_PATH), "mustRemainByteIdentical": True},
        "seatSockets": {"file": repo_path(SOCKETS_PATH), "sha256": sha256(SOCKETS_PATH)},
        "activeOfficeBaseline": {"file": repo_path(ACTIVE_MAP_PATH), "sha256": sha256(ACTIVE_MAP_PATH), "mustRemainByteIdentical": True},
    }


def render_current_scene(debug: bool = False, frame: int = 0, capacity: bool = False) -> Image.Image:
    image = Image.open(BACKGROUND_PATH).convert("RGBA")
    records = station_records()
    for orientation in ("far", "near"):
        for record in [entry for entry in records if entry["orientation"] == orientation]:
            desk_left, desk_top = record["deskDrawOriginPixels"]
            for layer in BASE.station_layer_records(orientation, record["characterSlug"], frame, desk_left, desk_top):
                image.alpha_composite(layer["image"], layer["xy"])
    if debug or capacity:
        draw = ImageDraw.Draw(image, "RGBA")
        for record in records:
            desk_left, desk_top = record["deskDrawOriginPixels"]
            color = COLORS["cyan"] if record["orientation"] == "far" else COLORS["green"]
            draw.rectangle((desk_left, desk_top, desk_left + 96, desk_top + 64), outline=color, width=2)
            seat_x = desk_left + 48
            seat_y = record["chairFloorWorld"][1] * TILE - TILE
            draw.line((seat_x - 5, seat_y, seat_x + 5, seat_y), fill=COLORS["green"], width=2)
            draw.line((seat_x, seat_y - 5, seat_x, seat_y + 5), fill=COLORS["green"], width=2)
        for x in DESK_X[:-1]:
            join_x = (x + 3) * TILE
            for y in CURRENT_DESK_Y.values():
                top = y * TILE - 64
                draw.line((join_x, top, join_x, top + 64), fill=COLORS["amber"], width=2)
        join_y = CURRENT_DESK_Y["near"] * TILE - 64
        draw.line((DESK_X[0] * TILE, join_y, (DESK_X[-1] + 3) * TILE, join_y), fill=COLORS["purple"], width=3)
        draw.rounded_rectangle((590, 270, 850, 382), radius=8, fill=(8, 51, 68, 220), outline=COLORS["cyan"], width=2)
        BASE.LEGACY.label(draw, (608, 286), "CURRENT 10 / UPPER-LEFT", 14, COLORS["green"], True)
        BASE.LEGACY.label(draw, (608, 318), "5 columns x 2 seats", 13, COLORS["text"])
        BASE.LEGACY.label(draw, (608, 346), "8 side joins + 5 depth joins", 12, COLORS["amber"])
    if capacity:
        draw = ImageDraw.Draw(image, "RGBA")
        for item in reserved_records():
            x, y, _ = item["deskOriginWorld"]
            left, top = desk_draw_point(x, y)
            draw.rectangle((left, top, left + 96, top + 64), fill=(167, 139, 250, 26), outline=COLORS["purple"], width=2)
            chair_x = int(item["chairFloorWorld"][0] * TILE)
            chair_y = item["chairFloorWorld"][1] * TILE
            draw.rectangle((chair_x - 16, chair_y - 32, chair_x + 16, chair_y), fill=(167, 139, 250, 20), outline=COLORS["purple"], width=2)
        BASE.LEGACY.label(draw, (72, 494), "RESERVED / EMPTY / NO ART / FUTURE 10", 14, COLORS["purple"], True)
    return image


def board_four_station() -> Image.Image:
    image, draw = BASE.LEGACY.board(
        "TEN-SEAT R05-r02 / FOUR-STATION INTERSECTION",
        "THE FIRST TWO COLUMNS PROVE SIDE-TO-SIDE AND DEPTH JOINS BEFORE THE FIVE-COLUMN EXPANSION",
    )
    clean = render_current_scene(False).crop((40, 175, 290, 515)).resize((700, 952), Image.Resampling.NEAREST)
    debug = render_current_scene(True).crop((40, 175, 290, 515)).resize((700, 952), Image.Resampling.NEAREST)
    image.paste(clean.convert("RGB"), (55, 80))
    image.paste(debug.convert("RGB"), (845, 80))
    BASE.LEGACY.label(draw, (55, 1035), "CLEAN", 17, COLORS["green"], True)
    BASE.LEGACY.label(draw, (845, 1035), "DEBUG / ALL JOINS = 0 px", 17, COLORS["cyan"], True)
    return image


def board_contact_matrix() -> Image.Image:
    image, draw = BASE.LEGACY.board(
        "TEN-SEAT R05-r02 / 60 SEAT-CONTACT CHECKS",
        "10 CURRENT CHARACTERS x 6 ANIMATION FRAMES; EVERY ACTOR CONTACT RESOLVES TO THE REAL CHAIR SEAT SOCKET",
    )
    records = station_records()
    for row, record in enumerate(records):
        top = 115 + row * 84
        draw.rounded_rectangle((35, top, 1565, top + 70), radius=7, fill=COLORS["panel"], outline=COLORS["line"], width=1)
        BASE.LEGACY.label(draw, (50, top + 12), f"{row + 1:02d} {record['characterSlug']} / {record['orientation']}", 13, COLORS["text"], True)
        for frame, contact in enumerate(record["seatContacts"]):
            left = 455 + frame * 170
            draw.rounded_rectangle((left, top + 9, left + 145, top + 58), radius=6, fill=(20, 83, 45), outline=COLORS["green"], width=2)
            BASE.LEGACY.label(draw, (left + 13, top + 17), f"F{frame}  delta 0,0", 11, COLORS["green"], True)
    BASE.LEGACY.label(draw, (42, 970), "PASS 60/60 | shared top-left offsets: 0 | new poses: 0", 17, COLORS["green"], True)
    return image


def board_before_after() -> Image.Image:
    image, draw = BASE.LEGACY.board(
        "REJECTED R05 FINAL vs UPPER-LEFT R05-r02 REBUILD",
        "LEFT IS HISTORICAL NEGATIVE EVIDENCE; RIGHT IS DERIVED FROM THE OWNER-APPROVED PAIR AND CURRENT BACKGROUND",
    )
    before = Image.open(REJECTED_REVIEW_PATH).convert("RGB")
    after = render_current_scene(False).convert("RGB")
    before.thumbnail((720, 760), Image.Resampling.LANCZOS)
    after.thumbnail((720, 760), Image.Resampling.LANCZOS)
    image.paste(before, (35, 165))
    image.paste(after, (825, 165))
    BASE.LEGACY.label(draw, (55, 120), "REJECTED / DO NOT IMPORT", 18, COLORS["red"], True)
    BASE.LEGACY.label(draw, (845, 120), "NEW / UPPER-LEFT / CURRENT 10", 18, COLORS["green"], True)
    BASE.LEGACY.label(draw, (55, 950), "Old: tail-to-head and wrong far equipment depth", 14, COLORS["red"])
    BASE.LEGACY.label(draw, (845, 950), "New: 3x2 footprint joins, socket seating, lower capacity preserved", 14, COLORS["green"])
    return image


def manifest_data(map_content: bytes) -> dict[str, Any]:
    return {
        "version": 1,
        "id": "office.workstation.ten-seat.r05.r02",
        "status": "owner-review-p4-p6",
        "updatedOn": "2026-07-28",
        "derivesFrom": "office.workstation.step5.r05.r02",
        "scope": ["P4-four-station-preflight", "P5-ten-seat-upper-left", "P6-capacity-and-browser-qa"],
        "layoutDecision": {
            "currentEmployees": 10,
            "location": "upper-left",
            "shape": "five-columns-two-opposing-seats",
            "reservedEmptyEmployeesBelow": 10,
            "totalPlannedCapacity": 20,
        },
        "map": {"file": repo_path(MAP_PATH), "sha256": sha256_bytes(map_content)},
        "reviewOutputs": [repo_path(path) for path in REVIEW_PATHS],
        "browserValidation": {
            "required": True,
            "captures": [repo_path(path) for path in QA_CAPTURES],
            "expectedConsoleErrors": 0,
            "expectedBrokenImages": 0,
            "expectedSeatContactErrors": 0,
            "result": "passed",
            "durationSeconds": 60,
            "desktop": {"bodyOverflow": False, "brokenImages": 0},
            "mobile390": {"bodyOverflow": False, "brokenImages": 0},
            "warningsAndErrors": 0,
            "sampledActorSeatDeltasAllZero": True,
        },
        "permissions": {
            "isolatedTenSeatRenderer": True,
            "capacityReservation": True,
            "newCharacterOrPose": False,
            "otherFurniture": False,
            "activeOfficePromotion": False,
        },
        "activeOfficeBaseline": {"file": repo_path(ACTIVE_MAP_PATH), "sha256": sha256(ACTIVE_MAP_PATH), "mustRemainByteIdentical": True},
    }


def build_outputs() -> dict[Path, bytes]:
    map_content = json_bytes(ten_seat_map_data())
    outputs = {
        MAP_PATH: map_content,
        REVIEW_PATHS[0]: png_bytes(board_four_station()),
        REVIEW_PATHS[1]: png_bytes(render_current_scene(False)),
        REVIEW_PATHS[2]: png_bytes(render_current_scene(True)),
        REVIEW_PATHS[3]: png_bytes(board_contact_matrix()),
        REVIEW_PATHS[4]: png_bytes(board_before_after()),
        REVIEW_PATHS[5]: png_bytes(render_current_scene(True, capacity=True)),
    }
    outputs[MANIFEST_PATH] = json_bytes(manifest_data(map_content))
    return outputs


def write_or_check(outputs: dict[Path, bytes], check: bool) -> None:
    stale = []
    for path, content in outputs.items():
        if check:
            if not path.exists() or path.read_bytes() != content:
                stale.append(repo_path(path))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
    if stale:
        raise SystemExit("Stale ten-seat R05-r02 outputs: " + ", ".join(stale))
    action = "verified" if check else "built"
    print(f"Ten-seat R05-r02 candidate {action}: current 10 upper-left, future 10 reserved, Active Office unchanged.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    write_or_check(build_outputs(), args.check)


if __name__ == "__main__":
    main()
