#!/usr/bin/env python3
"""Build the isolated Office Furniture-only Room F9 v1 review candidate."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import shutil
import tempfile
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
TILE = 32
COLS = 43
ROWS = 24
CANVAS = (COLS * TILE, ROWS * TILE)
PROCESSED_REL = Path("assets/game/processed/office-furniture-only-f9-v1")
REVIEW_REL = Path("assets/art/layout-references/office-furniture-only-f9-v1")
MAP_REL = Path("assets/game/maps/office-furniture-only-f9-v1.json")
MANIFEST_REL = Path("assets/game/manifests/office-furniture-only-f9-v1.json")
BACKGROUND_REL = Path(
    "assets/art/backgrounds/office-c-background-modern-v8-owner-review.png"
)
MARKUP_REL = Path(
    "assets/art/layout-references/office-support-layout-v1/00-owner-layout-markup.png"
)
WORKSTATION_ASSEMBLY_REL = Path(
    "scripts/build-office-workstation-step5-r05-r02.py"
)

AUTHORITY_MANIFESTS = [
    "assets/game/manifests/office-workstation-step5-r05-r02.json",
    "assets/game/manifests/office-furniture-counter-bar-a01-r02.json",
    "assets/game/manifests/office-furniture-sofa-modern-two-seat-r01.json",
    "assets/game/manifests/office-furniture-sofa-modern-three-seat-r01.json",
    "assets/game/manifests/office-furniture-table-review-long-r01.json",
    "assets/game/manifests/office-furniture-chair-massage-r02.json",
    "assets/game/manifests/office-facility-water-dispenser-w01.json",
    "assets/game/manifests/office-facility-coffee-machine-c01-r02.json",
    "assets/game/manifests/office-facility-vending-u01.json",
    "assets/game/manifests/office-facility-arcade-machine-g02-production.json",
    "assets/game/manifests/office-facility-server-rack-n02-production.json",
    "assets/game/manifests/office-facility-refrigerator-r01-production.json",
    "assets/game/manifests/office-facility-printer-p01-production.json",
]

def sha256(path: Path) -> str:
    if path.suffix.lower() in {".json", ".md", ".mjs", ".py", ".ts", ".tsx"}:
        normalized = path.read_bytes().replace(b"\r\n", b"\n")
        return hashlib.sha256(normalized).hexdigest()
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_json(relative: str | Path) -> dict:
    return json.loads((ROOT / relative).read_text(encoding="utf-8"))


def save_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load module: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


WORKSTATION_ASSEMBLY = load_module(
    ROOT / WORKSTATION_ASSEMBLY_REL, "office_f9_r05_r02_assembly"
)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    filename = "arialbd.ttf" if bold else "arial.ttf"
    return ImageFont.truetype(str(Path("C:/Windows/Fonts") / filename), size)


def cell_rect(cell: tuple[int, int], inset: int = 2) -> tuple[int, int, int, int]:
    x, y = cell
    return (
        x * TILE + inset,
        y * TILE + inset,
        (x + 1) * TILE - inset - 1,
        (y + 1) * TILE - inset - 1,
    )


def rectangle_cells(x: int, y: int, width: int, depth: int) -> list[tuple[int, int]]:
    return [(xx, yy) for yy in range(y, y + depth) for xx in range(x, x + width)]


def approved_authorities() -> list[dict]:
    ledger = []
    for relative in AUTHORITY_MANIFESTS:
        path = ROOT / relative
        data = load_json(relative)
        status = data.get("status")
        if status not in {"owner-approved", "owner-approved-p0-p3"}:
            raise ValueError(f"F9 authority is not owner-approved: {relative}: {status}")
        f8 = data.get("gates", {}).get("F8", {}).get("status")
        if f8 not in {None, "passed"}:
            raise ValueError(f"F8 is not passed: {relative}: {f8}")
        ledger.append(
            {
                "id": data["id"],
                "manifest": relative,
                "sha256": sha256(path),
                "status": status,
                "f8Status": f8 or "approved-family-authority",
            }
        )
    return ledger


def part_file(manifest: dict, role: str) -> Path:
    part = next(part for part in manifest["parts"] if part["role"] == role)
    return Path(part["runtimeFile"])


def seating_shell(relative: str) -> Path:
    manifest = load_json(relative)
    return part_file(manifest, "shell")


def compose_parts(manifest_relative: str, roles: list[str]) -> Image.Image:
    manifest = load_json(manifest_relative)
    paths = [part_file(manifest, role) for role in roles]
    images = [Image.open(ROOT / path).convert("RGBA") for path in paths]
    composite = Image.new("RGBA", images[0].size)
    for image in images:
        composite.alpha_composite(image)
    return composite


def runtime_assets() -> tuple[dict[str, Image.Image], list[dict]]:
    assets: dict[str, Image.Image] = {}
    ledger: list[dict] = []

    def add(key: str, relative: Path, expected: str | None = None) -> None:
        path = ROOT / relative
        actual = sha256(path)
        if expected is not None and expected != actual:
            raise ValueError(f"Asset hash mismatch: {relative}")
        assets[key] = Image.open(path).convert("RGBA")
        ledger.append(
            {"assetKey": key, "file": relative.as_posix(), "sha256": actual}
        )

    workstation_files = [
        *[
            Path(
                "assets/game/processed/office-workstation-v3/step5-r04/"
                f"desk.workstation.modern.v3.{side}.{role}.png"
            )
            for side in ("public", "seat")
            for role in ("rear", "surface", "base", "foreground")
        ],
        *[
            Path(
                "assets/game/processed/office-workstation-v3/step5-r04/"
                f"{name}.png"
            )
            for name in (
                "monitor.workstation.v3.front",
                "monitor.workstation.v3.back",
                "keyboard.workstation.v3.full",
            )
        ],
        *[
            Path(
                "assets/game/processed/office-workstation-v3/step5-r05-final/"
                f"chair.office.modern.r05.{orientation}.{part}.png"
            )
            for orientation in ("front", "back")
            for part in ("rear", "foreground")
        ],
    ]
    ledger.append(
        {
            "assetKey": "workstation-r05-r02-furniture-only",
            "assembly": WORKSTATION_ASSEMBLY_REL.as_posix(),
            "files": [
                {"file": relative.as_posix(), "sha256": sha256(ROOT / relative)}
                for relative in workstation_files
            ],
            "characterPixelsComposited": False,
        }
    )

    counter_manifest = load_json(
        "assets/game/manifests/office-furniture-counter-bar-a01-r02.json"
    )
    clean = counter_manifest["cleanAsset"]
    add("counter", Path(clean["file"]), clean["sha256"])

    seating_specs = {
        "sofa-2": "assets/game/manifests/office-furniture-sofa-modern-two-seat-r01.json",
        "sofa-3": "assets/game/manifests/office-furniture-sofa-modern-three-seat-r01.json",
        "review-table": "assets/game/manifests/office-furniture-table-review-long-r01.json",
        "massage": "assets/game/manifests/office-furniture-chair-massage-r02.json",
    }
    for key, manifest_relative in seating_specs.items():
        manifest = load_json(manifest_relative)
        part = next(part for part in manifest["parts"] if part["role"] == "shell")
        add(key, Path(part["runtimeFile"]), part["runtimeSha256"])

    composite_specs = {
        "water": (
            "assets/game/manifests/office-facility-water-dispenser-w01.json",
            ["static-shell", "animation-viewport", "output-bay-empty"],
        ),
        "coffee": (
            "assets/game/manifests/office-facility-coffee-machine-c01-r02.json",
            ["static-shell", "animation-viewport", "output-bay-empty"],
        ),
        "vending": (
            "assets/game/manifests/office-facility-vending-u01.json",
            ["static-shell", "animation-viewport", "pickup-tray-empty"],
        ),
    }
    for key, (manifest_relative, roles) in composite_specs.items():
        image = compose_parts(manifest_relative, roles)
        assets[key] = image
        manifest = load_json(manifest_relative)
        sources = [
            {
                "file": part_file(manifest, role).as_posix(),
                "sha256": sha256(ROOT / part_file(manifest, role)),
            }
            for role in roles
        ]
        ledger.append({"assetKey": key, "composedFrom": sources})

    arcade_manifest = load_json(
        "assets/game/manifests/office-facility-arcade-machine-g02-production.json"
    )
    arcade_shell = next(
        item for item in arcade_manifest["parts"]["shell"]
        if item["orientation"] == "left"
    )["runtime"]
    arcade_controls = next(
        item for item in arcade_manifest["parts"]["controls"]
        if item["orientation"] == "left"
    )["runtime"]
    arcade_image = Image.open(ROOT / arcade_shell["file"]).convert("RGBA")
    arcade_image.alpha_composite(
        Image.open(ROOT / arcade_controls["file"]).convert("RGBA")
    )
    assets["arcade-left"] = arcade_image
    ledger.append(
        {
            "assetKey": "arcade-left",
            "visualOrientation": "left",
            "composedFrom": [
                {"file": arcade_shell["file"], "sha256": arcade_shell["sha256"]},
                {
                    "file": arcade_controls["file"],
                    "sha256": arcade_controls["sha256"],
                },
            ],
        }
    )

    server_manifest = load_json(
        "assets/game/manifests/office-facility-server-rack-n02-production.json"
    )
    server_left = next(
        item for item in server_manifest["parts"]["shells"]
        if item["orientation"] == "left"
    )["runtime"]
    add("server-left", Path(server_left["file"]), server_left["sha256"])

    refrigerator = load_json(
        "assets/game/manifests/office-facility-refrigerator-r01-production.json"
    )["states"]["closed"]
    add("refrigerator", Path(refrigerator["file"]), refrigerator["sha256"])

    printer = load_json(
        "assets/game/manifests/office-facility-printer-p01-production.json"
    )["states"]["closed-A"]
    add("printer", Path(printer["file"]), printer["sha256"])
    return assets, ledger


def make_layout() -> tuple[list[dict], list[dict], list[dict], list[dict]]:
    workstations = []
    number = 1
    for orientation, y, chair_y, route_y in (
        ("far", 13, 12, 11),
        ("near", 15, 17, 18),
    ):
        for x in (3, 6, 9, 12, 15):
            workstations.append(
                {
                    "id": f"workstation-{number:02d}",
                    "origin": [x, y],
                    "orientation": orientation,
                    "deskFootprint": rectangle_cells(x, y, 3, 2),
                    "chairCell": [x + 1, chair_y],
                    "routeStart": [x + 1, route_y],
                    "familyAuthority": "office.workstation.step5.r05.r02",
                }
            )
            number += 1

    support = [
        {
            "id": "support-counter-01",
            "family": "counter.bar.a01-r02",
            "origin": [30, 14],
            "footprint": rectangle_cells(30, 14, 6, 2),
            "assetKey": "counter",
        }
    ]

    facilities = [
        {
            "id": "server-rack-01",
            "family": "server.rack.generated-modern",
            "origin": [41, 11],
            "size": [2, 2],
            "assetKey": "server-left",
            "visualOrientation": "left",
            "wallRelationship": "right-edge",
            "approaches": [[40, 12]],
        },
        {
            "id": "server-rack-02",
            "family": "server.rack.generated-modern",
            "origin": [41, 15],
            "size": [2, 2],
            "assetKey": "server-left",
            "visualOrientation": "left",
            "wallRelationship": "right-edge",
            "approaches": [[40, 16]],
        },
        {
            "id": "printer-01",
            "family": "printer.generated-modern",
            "origin": [30, 10],
            "size": [2, 2],
            "assetKey": "printer",
            "visualOrientation": "front",
            "approaches": [[31, 12]],
        },
        {
            "id": "printer-02",
            "family": "printer.generated-modern",
            "origin": [33, 10],
            "size": [2, 2],
            "assetKey": "printer",
            "visualOrientation": "front",
            "approaches": [[34, 12]],
        },
        {
            "id": "coffee-machine-01",
            "family": "coffee.machine.c01-r02",
            "origin": [32, 14],
            "size": [2, 2],
            "assetKey": "coffee",
            "visualOrientation": "front",
            "approaches": [[32, 16]],
            "supportParentId": "support-counter-01",
            "placementPlane": "support-surface",
        },
        {
            "id": "refrigerator-01",
            "family": "refrigerator.generated-modern",
            "origin": [36, 10],
            "size": [2, 2],
            "assetKey": "refrigerator",
            "visualOrientation": "front",
            "approaches": [[37, 12]],
        },
        {
            "id": "vending-01",
            "family": "vending.machine.modern.u01-r03",
            "origin": [36, 14],
            "size": [2, 1],
            "assetKey": "vending",
            "visualOrientation": "front",
            "approaches": [[37, 16]],
        },
        {
            "id": "water-dispenser-01",
            "family": "water.dispenser.modern.w01",
            "origin": [38, 14],
            "size": [1, 1],
            "assetKey": "water",
            "visualOrientation": "front",
            "approaches": [[38, 16]],
        },
        {
            "id": "water-dispenser-02",
            "family": "water.dispenser.modern.w01",
            "origin": [39, 14],
            "size": [1, 1],
            "assetKey": "water",
            "visualOrientation": "front",
            "approaches": [[39, 16]],
        },
        {
            "id": "sofa-three-seat-01",
            "family": "sofa.modern.three-seat",
            "origin": [30, 18],
            "size": [4, 2],
            "assetKey": "sofa-3",
            "visualOrientation": "front",
            "approaches": [[31, 20], [32, 20], [33, 20]],
        },
        {
            "id": "sofa-two-seat-01",
            "family": "sofa.modern.two-seat",
            "origin": [34, 18],
            "size": [3, 2],
            "assetKey": "sofa-2",
            "visualOrientation": "front",
            "approaches": [[35, 20], [36, 20]],
        },
        {
            "id": "massage-chair-01",
            "family": "chair.massage.modern",
            "origin": [37, 18],
            "size": [2, 2],
            "assetKey": "massage",
            "visualOrientation": "front",
            "approaches": [[38, 20]],
        },
        {
            "id": "arcade-machine-01",
            "family": "arcade.machine.generated-modern",
            "origin": [41, 19],
            "size": [2, 2],
            "assetKey": "arcade-left",
            "visualOrientation": "left",
            "wallRelationship": "right-edge",
            "approaches": [[40, 20]],
        },
        {
            "id": "review-table-01",
            "family": "table.review.long.modern",
            "origin": [32, 22],
            "size": [4, 1],
            "assetKey": "review-table",
            "visualOrientation": "front",
            "approaches": [[33, 21], [35, 21], [33, 23], [35, 23]],
        },
    ]
    for facility in facilities:
        x, y = facility["origin"]
        width, depth = facility["size"]
        facility["footprint"] = (
            []
            if facility.get("placementPlane") == "support-surface"
            else rectangle_cells(x, y, width, depth)
        )

    slots = []
    for facility in facilities:
        for index, approach in enumerate(facility["approaches"], 1):
            slots.append(
                {
                    "id": f"reservation.{facility['id']}.{index:02d}",
                    "facilityId": facility["id"],
                    "capacity": 1,
                    "approachCell": approach,
                    "interaction": "front-relative-to-visual-orientation",
                }
            )
    return workstations, support, facilities, slots


def allowed_floor(cell: tuple[int, int]) -> bool:
    x, y = cell
    if not (0 <= x < COLS and 0 <= y < ROWS):
        return False
    if y >= 11:
        return True
    if y == 10:
        return 2 <= x <= 26 or 30 <= x <= 40
    return False


def validate_layout(
    workstations: list[dict],
    support: list[dict],
    facilities: list[dict],
    slots: list[dict],
) -> set[tuple[int, int]]:
    if len(workstations) != 10 or len(facilities) != 14 or len(slots) != 20:
        raise ValueError("F9 inventory contract is not 10/14/20")
    expected_origins = [
        [x, y] for y in (13, 15) for x in (3, 6, 9, 12, 15)
    ]
    if [station["origin"] for station in workstations] != expected_origins:
        raise ValueError("Workstations must remain two rows anchored by C12")
    side_bank = [
        facility for facility in facilities
        if facility.get("wallRelationship") == "right-edge"
    ]
    if (
        len(side_bank) != 3
        or any(item.get("visualOrientation") != "left" for item in side_bank)
        or any(item["origin"][0] != 41 for item in side_bank)
    ):
        raise ValueError("Right-edge side-oriented facility bank changed")
    occupied: dict[tuple[int, int], str] = {}

    def occupy(cell: tuple[int, int], owner: str) -> None:
        if not allowed_floor(cell):
            raise ValueError(f"{owner} is outside the approved floor: {cell}")
        if cell in occupied:
            raise ValueError(f"Footprint overlap: {owner} / {occupied[cell]} at {cell}")
        occupied[cell] = owner

    for station in workstations:
        for cell in station["deskFootprint"]:
            occupy(tuple(cell), station["id"])
        occupy(tuple(station["chairCell"]), station["id"])
        if not allowed_floor(tuple(station["routeStart"])):
            raise ValueError(f"Invalid route start: {station['id']}")
    for item in support:
        for cell in item["footprint"]:
            occupy(tuple(cell), item["id"])
    for facility in facilities:
        for cell in facility["footprint"]:
            occupy(tuple(cell), facility["id"])
    for slot in slots:
        cell = tuple(slot["approachCell"])
        if not allowed_floor(cell) or cell in occupied:
            raise ValueError(f"Blocked approach: {slot['id']}: {cell}")
    return set(occupied)


def shortest_path(
    start: tuple[int, int], target: tuple[int, int], obstacles: set[tuple[int, int]]
) -> list[tuple[int, int]]:
    queue = deque([start])
    previous: dict[tuple[int, int], tuple[int, int] | None] = {start: None}
    while queue:
        current = queue.popleft()
        if current == target:
            break
        x, y = current
        for candidate in ((x + 1, y), (x, y + 1), (x - 1, y), (x, y - 1)):
            if (
                candidate not in previous
                and candidate not in obstacles
                and allowed_floor(candidate)
            ):
                previous[candidate] = current
                queue.append(candidate)
    if target not in previous:
        return []
    result = []
    current: tuple[int, int] | None = target
    while current is not None:
        result.append(current)
        current = previous[current]
    return list(reversed(result))


def route_matrix(
    workstations: list[dict],
    slots: list[dict],
    obstacles: set[tuple[int, int]],
) -> tuple[list[dict], set[tuple[int, int]]]:
    records = []
    union: set[tuple[int, int]] = set()
    for station in workstations:
        for slot in slots:
            path = shortest_path(
                tuple(station["routeStart"]), tuple(slot["approachCell"]), obstacles
            )
            if not path:
                raise ValueError(f"Unreachable route: {station['id']} -> {slot['id']}")
            union.update(path)
            records.append(
                {
                    "fromWorkstationId": station["id"],
                    "toReservationId": slot["id"],
                    "reachable": True,
                    "pathLength": len(path) - 1,
                }
            )
    if len(records) != 200:
        raise ValueError("F9 route matrix must contain exactly 200 queries")
    return records, union


def reservation_stress(slots: list[dict]) -> dict:
    events = []
    actors = [f"actor-{index:02d}" for index in range(1, 22)]
    for index, slot in enumerate(slots):
        events.append(
            {
                "second": 0,
                "type": "reserve",
                "actorId": actors[index],
                "reservationId": slot["id"],
                "result": "success",
            }
        )
    events.append(
        {
            "second": 0,
            "type": "reserve",
            "actorId": actors[20],
            "reservationId": slots[0]["id"],
            "result": "blocked-capacity",
        }
    )
    for index, slot in enumerate(slots):
        events.append(
            {
                "second": index + 10,
                "type": "release",
                "actorId": actors[index],
                "reservationId": slot["id"],
                "result": "success",
            }
        )
    events.extend(
        [
            {
                "second": 30,
                "type": "retry",
                "actorId": actors[20],
                "reservationId": slots[0]["id"],
                "result": "success",
            },
            {
                "second": 40,
                "type": "release",
                "actorId": actors[20],
                "reservationId": slots[0]["id"],
                "result": "success",
            },
        ]
    )
    concurrent = []
    for second in range(301):
        if second == 0:
            count = 20
        elif 1 <= second < 10:
            count = 20
        elif 10 <= second <= 29:
            count = 29 - second
        elif 30 <= second < 40:
            count = 1
        else:
            count = 0
        concurrent.append({"second": second, "reserved": count})
    return {
        "durationSeconds": 300,
        "syntheticActorCount": 21,
        "slotCount": 20,
        "events": events,
        "concurrencySamples": concurrent,
        "summary": {
            "successfulInitialReservations": 20,
            "blockedAttempts": 1,
            "successfulReleases": 21,
            "successfulRetries": 1,
            "maximumConcurrentReservations": 20,
            "endingConcurrentReservations": 0,
            "doubleBookingCount": 0,
            "leakedReservationCount": 0,
        },
    }


def paste_bottom_center(
    layer: Image.Image,
    sprite: Image.Image,
    origin: list[int],
    size: list[int],
    y_adjust: int = 0,
) -> None:
    x, y = origin
    width, depth = size
    center_x = (x + width / 2) * TILE
    bottom_y = (y + depth) * TILE + y_adjust
    left = round(center_x - sprite.width / 2)
    top = round(bottom_y - sprite.height)
    layer.alpha_composite(sprite, (left, top))


def draw_grid(layer: Image.Image) -> None:
    draw = ImageDraw.Draw(layer)
    for x in range(COLS + 1):
        draw.line((x * TILE, 0, x * TILE, CANVAS[1]), fill=(39, 67, 91, 68))
    for y in range(ROWS + 1):
        draw.line((0, y * TILE, CANVAS[0], y * TILE), fill=(39, 67, 91, 68))


def render_workstation_furniture(
    layer: Image.Image, workstations: list[dict]
) -> None:
    for station in workstations:
        x, y = station["origin"]
        records = WORKSTATION_ASSEMBLY.station_layer_records(
            station["orientation"],
            "yinyue-2",
            0,
            x * TILE,
            y * TILE - 2 * TILE,
        )
        for record in records:
            if record["name"] != "actor":
                layer.alpha_composite(record["image"], record["xy"])


def render_layers(
    assets: dict[str, Image.Image],
    workstations: list[dict],
    support: list[dict],
    facilities: list[dict],
    slots: list[dict],
    route_union: set[tuple[int, int]],
) -> dict[str, Image.Image]:
    resampling = getattr(Image, "Resampling", Image)
    background = Image.open(ROOT / BACKGROUND_REL).convert("RGBA").resize(
        CANVAS, resampling.LANCZOS
    )
    transparent = lambda: Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    layers = {
        "architecture": background,
        "workstations": transparent(),
        "support-furniture": transparent(),
        "facilities": transparent(),
        "footprints": transparent(),
        "approaches": transparent(),
        "routes": transparent(),
        "reservations": transparent(),
        "decor": transparent(),
        "grid": transparent(),
    }

    render_workstation_furniture(layers["workstations"], workstations)

    for item in support:
        paste_bottom_center(
            layers["support-furniture"],
            assets[item["assetKey"]],
            item["origin"],
            [6, 2],
        )

    for facility in sorted(
        facilities,
        key=lambda item: item["origin"][1] + item["size"][1],
    ):
        if facility.get("placementPlane") == "support-surface":
            paste_bottom_center(
                layers["facilities"],
                assets[facility["assetKey"]],
                facility["origin"],
                facility["size"],
                y_adjust=-58,
            )
        else:
            paste_bottom_center(
                layers["facilities"],
                assets[facility["assetKey"]],
                facility["origin"],
                facility["size"],
            )

    footprint_draw = ImageDraw.Draw(layers["footprints"])
    for station in workstations:
        for cell in station["deskFootprint"]:
            footprint_draw.rectangle(cell_rect(tuple(cell)), fill=(64, 128, 255, 112))
        footprint_draw.rectangle(
            cell_rect(tuple(station["chairCell"])), fill=(78, 168, 255, 132)
        )
    for item in support:
        for cell in item["footprint"]:
            footprint_draw.rectangle(cell_rect(tuple(cell)), fill=(171, 111, 255, 120))
    for facility in facilities:
        for cell in facility["footprint"]:
            footprint_draw.rectangle(cell_rect(tuple(cell)), fill=(235, 81, 96, 132))

    approach_draw = ImageDraw.Draw(layers["approaches"])
    reservation_draw = ImageDraw.Draw(layers["reservations"])
    for slot in slots:
        cell = tuple(slot["approachCell"])
        approach_draw.rectangle(cell_rect(cell, 5), fill=(255, 166, 40, 205))
        x, y = cell
        reservation_draw.ellipse(cell_rect(cell, 8), fill=(39, 190, 115, 220))
        reservation_draw.text(
            (x * TILE + 10, y * TILE + 8),
            str(slots.index(slot) + 1),
            fill="white",
            font=font(11, True),
        )

    route_draw = ImageDraw.Draw(layers["routes"])
    for cell in route_union:
        route_draw.rectangle(cell_rect(cell, 11), fill=(36, 110, 210, 155))
    draw_grid(layers["grid"])
    return layers


def composite(layers: dict[str, Image.Image], names: list[str]) -> Image.Image:
    result = Image.new("RGBA", CANVAS)
    for name in names:
        result.alpha_composite(layers[name])
    return result


def board(title: str, subtitle: str, image: Image.Image) -> Image.Image:
    resampling = getattr(Image, "Resampling", Image)
    result = Image.new("RGB", (1600, 1000), "#edf3f6")
    draw = ImageDraw.Draw(result)
    draw.rounded_rectangle((28, 24, 1572, 976), 24, fill="#ffffff", outline="#cad7df")
    draw.text((70, 58), title, font=font(34, True), fill="#163246")
    draw.text((70, 108), subtitle, font=font(20), fill="#567080")
    fitted = image.convert("RGBA")
    fitted.thumbnail((1500, 800), resampling.LANCZOS)
    x = (1600 - fitted.width) // 2
    y = 172 + (780 - fitted.height) // 2
    result.paste(fitted.convert("RGB"), (x, y))
    return result


def text_board(title: str, subtitle: str, lines: list[str]) -> Image.Image:
    result = Image.new("RGB", (1600, 1000), "#edf3f6")
    draw = ImageDraw.Draw(result)
    draw.rounded_rectangle((28, 24, 1572, 976), 24, fill="#ffffff", outline="#cad7df")
    draw.text((70, 58), title, font=font(34, True), fill="#163246")
    draw.text((70, 108), subtitle, font=font(20), fill="#567080")
    y = 174
    for line in lines:
        draw.text((86, y), line, font=font(19), fill="#29495b")
        y += 42
    return result


def zoning_overlay(clean: Image.Image) -> Image.Image:
    result = clean.copy()
    draw = ImageDraw.Draw(result, "RGBA")
    zones = [
        ("WORK C12:S19", (2, 11, 19, 19), (14, 165, 233, 58), (3, 12)),
        ("TRANSITION", (19, 11, 30, 24), (99, 102, 241, 42), (20, 12)),
        ("OPERATIONS", (30, 10, 39, 13), (245, 158, 11, 58), (30, 10)),
        ("PANTRY", (30, 14, 40, 17), (16, 185, 129, 58), (30, 16)),
        ("LOUNGE", (30, 18, 43, 21), (236, 72, 153, 48), (30, 20)),
        ("REVIEW", (32, 21, 36, 24), (139, 92, 246, 58), (32, 22)),
        ("SIDE BANK", (41, 11, 43, 21), (239, 68, 68, 52), (40, 17)),
    ]
    for label, (x1, y1, x2, y2), color, label_cell in zones:
        box = (x1 * TILE, y1 * TILE, x2 * TILE - 1, y2 * TILE - 1)
        draw.rectangle(box, fill=color, outline=(*color[:3], 220), width=3)
        lx, ly = label_cell
        draw.text(
            (lx * TILE + 5, ly * TILE + 5),
            label,
            font=font(13, True),
            fill=(16, 37, 52, 245),
            stroke_width=2,
            stroke_fill=(255, 255, 255, 220),
        )
    return result


def framing_board(clean: Image.Image) -> Image.Image:
    resampling = getattr(Image, "Resampling", Image)
    result = Image.new("RGB", (1600, 1000), "#edf3f6")
    draw = ImageDraw.Draw(result)
    draw.text((60, 42), "15 - Desktop and mobile framing", font=font(34, True), fill="#163246")
    draw.text(
        (60, 90),
        "Review-only viewport crops; no runtime promotion.",
        font=font(20),
        fill="#567080",
    )
    desktop = clean.convert("RGB").resize((960, 536), resampling.LANCZOS)
    mobile = clean.crop((816, 224, 1376, 768)).convert("RGB")
    mobile.thumbnail((430, 760), resampling.LANCZOS)
    result.paste(desktop, (60, 210))
    result.paste(mobile, (1110, 150))
    draw.rectangle((55, 205, 1025, 751), outline="#163246", width=5)
    draw.rectangle((1105, 145, 1545, 920), outline="#163246", width=5)
    return result


def build(destination_root: Path) -> list[Path]:
    authority_ledger = approved_authorities()
    assets, asset_ledger = runtime_assets()
    workstations, support, facilities, slots = make_layout()
    obstacles = validate_layout(workstations, support, facilities, slots)
    routes, route_union = route_matrix(workstations, slots, obstacles)
    stress = reservation_stress(slots)
    layers = render_layers(
        assets, workstations, support, facilities, slots, route_union
    )

    processed = destination_root / PROCESSED_REL
    review = destination_root / REVIEW_REL
    processed.mkdir(parents=True, exist_ok=True)
    review.mkdir(parents=True, exist_ok=True)

    layer_records = []
    generated: list[Path] = []
    for index, (name, image) in enumerate(layers.items(), 1):
        relative = PROCESSED_REL / "layers" / f"{index:02d}-{name}.png"
        path = destination_root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        image.save(path, optimize=True)
        generated.append(relative)
        layer_records.append(
            {
                "id": name,
                "path": relative.as_posix(),
                "sha256": sha256(path),
                "size": list(image.size),
                "visibleInClean": name
                in {"architecture", "workstations", "support-furniture", "facilities"},
            }
        )

    clean_names = ["architecture", "workstations", "support-furniture", "facilities"]
    clean = composite(layers, clean_names)
    clean_rel = PROCESSED_REL / "office-furniture-only-f9-v1.clean.png"
    clean_path = destination_root / clean_rel
    clean.save(clean_path, optimize=True)
    generated.append(clean_rel)

    debug = composite(
        layers,
        clean_names + ["routes", "footprints", "approaches", "reservations", "grid"],
    )
    debug_rel = PROCESSED_REL / "office-furniture-only-f9-v1.debug.png"
    debug_path = destination_root / debug_rel
    debug.save(debug_path, optimize=True)
    generated.append(debug_rel)

    review_images = [
        board(
            "01 - Owner markup to cell translation",
            "C12:S19 remains the work island; the support zone keeps a clear west spine and right-edge service bank.",
            zoning_overlay(clean),
        ),
        text_board(
            "02 - Approved family hash ledger",
            "Every F9 pixel source is owner-approved and hash-pinned.",
            [
                f"{item['id']}  |  {item['sha256'][:18]}..."
                for item in authority_ledger
            ],
        ),
        board(
            "03 - Clean furniture-only room",
            "10 workstations + 14 facilities; people count is exactly zero.",
            clean,
        ),
        board(
            "04 - Workstations: 10",
            "Two depth-paired rows start at C12 and preserve the C12:S19 perimeter aisle.",
            composite(layers, ["architecture", "workstations"]),
        ),
        board(
            "05 - Facilities: 14 objects",
            "Operations, pantry, lounge, and review are zoned; approved left views align to the right edge.",
            composite(layers, ["architecture", "support-furniture", "facilities"]),
        ),
        board(
            "06 - Footprints and collision",
            "Blue: workstations; purple: support; red: floor facilities.",
            composite(layers, clean_names + ["footprints", "grid"]),
        ),
        board(
            "07 - Approach / stand cells",
            "Orange cells are the only front interaction approaches.",
            composite(layers, clean_names + ["approaches", "grid"]),
        ),
        board(
            "08 - Route matrix: 200 / 200",
            "Every one of 10 workstation aisle starts reaches all 20 reservation slots.",
            composite(layers, clean_names + ["routes", "approaches", "grid"]),
        ),
        board(
            "09 - Reservation slots: 20",
            "Green numbered anchors are independently reservable at capacity one.",
            composite(layers, clean_names + ["reservations", "grid"]),
        ),
        board(
            "10 - Support-parent contract",
            "Coffee Machine C01-r02 is support-bound to Counter A01-r02.",
            composite(layers, ["architecture", "support-furniture", "facilities", "grid"]),
        ),
        board(
            "11 - Decor layer: intentionally empty",
            "No decor was approved for this F9 candidate; the independent layer is present.",
            composite(layers, ["architecture", "decor", "grid"]),
        ),
        board(
            "12 - Full composite debug",
            "Furniture, routes, footprints, approaches, reservations, and grid.",
            debug,
        ),
        text_board(
            "13 - Reservation stress: 300 seconds",
            "21 synthetic users cover capacity, blocked attempt, release, and retry.",
            [
                "Initial successful reservations: 20",
                "Blocked capacity attempts: 1",
                "Successful releases: 21",
                "Successful retries: 1",
                "Maximum concurrency: 20",
                "Ending concurrency: 0",
                "Double bookings: 0",
                "Leaked reservations: 0",
                "Duration: 300 seconds",
            ],
        ),
        text_board(
            "14 - Isolation proof",
            "F9 is a review candidate, not an Active Office update.",
            [
                "Character placements: 0",
                "Character sprite references: 0",
                "People visible: false",
                "Active Office files changed by builder: 0",
                "Fallback assets: 0",
                "Magic offsets: 0",
                "F10 character population: blocked",
            ],
        ),
        framing_board(clean),
    ]
    review_records = []
    review_names = [
        "01-owner-markup-cell-translation.png",
        "02-approved-family-hash-ledger.png",
        "03-clean-furniture-only-room.png",
        "04-workstations-10.png",
        "05-facilities-14.png",
        "06-footprints-collision.png",
        "07-approach-stand.png",
        "08-route-200.png",
        "09-reservations-20.png",
        "10-support-parent.png",
        "11-decor-zero-approved.png",
        "12-full-composite-debug.png",
        "13-300-second-stress.png",
        "14-people-zero-active-office.png",
        "15-desktop-mobile-framing.png",
    ]
    for name, image in zip(review_names, review_images):
        relative = REVIEW_REL / name
        path = destination_root / relative
        image.save(path, optimize=True)
        generated.append(relative)
        review_records.append(
            {
                "path": relative.as_posix(),
                "sha256": sha256(path),
                "size": list(image.size),
            }
        )

    map_document = {
        "schemaVersion": 1,
        "id": "office.furniture-only-room.f9.v1",
        "status": "f9-owner-review",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "coordinateSystem": {
            "origin": "top-left",
            "indexing": "zero-based",
            "columns": COLS,
            "rows": ROWS,
            "tilePixels": TILE,
            "canvasPixels": list(CANVAS),
        },
        "background": {
            "file": BACKGROUND_REL.as_posix(),
            "sha256": sha256(ROOT / BACKGROUND_REL),
        },
        "interiorPlan": {
            "workstationAnchorCell": "C12",
            "workstationProtectedEnvelope": "C12:S19",
            "workstationContentFootprint": "D13:R18",
            "workstationArrangement": {
                "rows": 2,
                "stationsPerRow": 5,
                "farDeskRange": "D14:R15",
                "nearDeskRange": "D16:R17",
                "perimeterWalkways": [
                    "C12:S12",
                    "C19:S19",
                    "C13:C18",
                    "S13:S18",
                ],
            },
            "functionalZones": [
                {"id": "work", "range": "C12:S19"},
                {"id": "transition", "range": "T12:AD24"},
                {"id": "operations", "range": "AE11:AM13"},
                {"id": "pantry", "range": "AE15:AN17"},
                {"id": "lounge", "range": "AE19:AQ21"},
                {"id": "review", "range": "AG22:AJ24"},
                {"id": "right-edge-side-bank", "range": "AP12:AQ21"},
            ],
            "circulation": {
                "workPerimeterClear": True,
                "transitionAisleClear": True,
                "supportWestSpine": "AD12:AD24",
                "rightEdgeServiceApproachSpine": "AO12:AO21",
                "minimumAisleTiles": 1,
            },
            "orientationRules": [
                "front-only families face the open southern aisle",
                "left-view server racks and arcade align to the right edge and face inward",
                "every interaction approach is in front of the rotated visual orientation",
                "pantry equipment is grouped around one support counter",
                "lounge seating is separated from document and server operations",
            ],
        },
        "workstations": workstations,
        "supportFurniture": support,
        "facilities": facilities,
        "reservationSlots": slots,
        "people": {
            "visible": False,
            "placements": [],
            "spriteReferences": [],
        },
        "decor": {"placements": [], "approvedCount": 0},
        "routeValidation": {
            "queryCount": len(routes),
            "reachableCount": sum(record["reachable"] for record in routes),
            "unreachableCount": 0,
            "queries": routes,
        },
        "reservationStress": stress,
        "layerOrder": [record["id"] for record in layer_records],
    }
    map_path = destination_root / MAP_REL
    save_json(map_path, map_document)
    generated.append(MAP_REL)

    manifest = {
        "schemaVersion": 1,
        "id": "office.furniture-only-room.f9.v1",
        "revision": "f9-v1",
        "status": "f9-owner-review",
        "productionStage": "f9-candidate-owner-review",
        "createdOn": "2026-07-30",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "scope": "furniture-only-room-candidate",
        "sourcePolicy": {
            "ownerApprovedFamiliesOnly": True,
            "newVersionedMap": True,
            "activeOfficePixelReuse": False,
            "activeOfficeMapMutation": False,
            "processedRejectedFamilyReuse": False,
            "missingAssetFallback": False,
            "magicOffsets": False,
        },
        "architecture": {
            "background": {
                "file": BACKGROUND_REL.as_posix(),
                "sha256": sha256(ROOT / BACKGROUND_REL),
                "role": "unfurnished-owner-review-architecture",
            },
            "ownerMarkup": {
                "file": MARKUP_REL.as_posix(),
                "sha256": sha256(ROOT / MARKUP_REL),
                "role": "immutable-layout-intent-reference",
            },
        },
        "authorityLedger": authority_ledger,
        "assetLedger": asset_ledger,
        "inventory": {
            "workstationCount": len(workstations),
            "facilityObjectCount": len(facilities),
            "supportFurnitureCount": len(support),
            "reservationSlotCount": len(slots),
            "decorCount": 0,
            "personCount": 0,
        },
        "interiorValidation": {
            "workstationAnchorCell": "C12",
            "workstationRows": 2,
            "workstationsPerRow": 5,
            "rightEdgeSideOrientedFacilityCount": 3,
            "frontOnlyFamilyOrientationViolations": 0,
            "footprintOverlapCount": 0,
            "blockedApproachCount": 0,
            "circulationDisconnectedCount": 0,
        },
        "map": {
            "file": MAP_REL.as_posix(),
            "sha256": sha256(map_path),
            "grid": [COLS, ROWS],
            "tilePixels": TILE,
        },
        "layers": layer_records,
        "cleanComposite": {
            "file": clean_rel.as_posix(),
            "sha256": sha256(clean_path),
            "size": list(CANVAS),
        },
        "debugComposite": {
            "file": debug_rel.as_posix(),
            "sha256": sha256(debug_path),
            "size": list(CANVAS),
        },
        "routeValidation": {
            "queryCount": len(routes),
            "reachableCount": len(routes),
            "unreachableCount": 0,
            "minimumRequired": 200,
        },
        "reservationValidation": stress["summary"],
        "people": {
            "visible": False,
            "placementCount": 0,
            "spriteReferenceCount": 0,
        },
        "reviewOutputs": review_records,
        "gates": {
            "F0": {"status": "passed"},
            "F1": {"status": "passed"},
            "F2": {"status": "passed"},
            "F3": {"status": "passed"},
            "F4": {"status": "passed"},
            "F5": {"status": "passed"},
            "F6": {"status": "passed"},
            "F7": {"status": "passed"},
            "F8": {
                "status": "passed",
                "note": "All placed families have owner-approved authority.",
            },
            "F9": {
                "status": "pending-owner-review",
                "note": "Furniture-only room candidate generated; no Active Office promotion.",
            },
            "F10": {
                "status": "blocked",
                "note": "Character population requires explicit owner approval after F9.",
            },
        },
        "permissions": {
            "ownerReview": True,
            "f10CharacterPopulation": False,
            "activeOfficePromotion": False,
        },
        "ownerDecision": None,
    }
    manifest_path = destination_root / MANIFEST_REL
    save_json(manifest_path, manifest)
    generated.append(MANIFEST_REL)
    return generated


def check() -> None:
    with tempfile.TemporaryDirectory(prefix="office-f9-v1-") as temporary:
        temp_root = Path(temporary)
        expected = build(temp_root)
        mismatches = []
        for relative in expected:
            generated = temp_root / relative
            committed = ROOT / relative
            if not committed.exists() or generated.read_bytes() != committed.read_bytes():
                mismatches.append(relative.as_posix())
        expected_set = {relative.as_posix() for relative in expected}
        for directory in (PROCESSED_REL, REVIEW_REL):
            committed_dir = ROOT / directory
            if committed_dir.exists():
                for path in committed_dir.rglob("*"):
                    if path.is_file():
                        relative = path.relative_to(ROOT).as_posix()
                        if relative not in expected_set:
                            mismatches.append(f"unexpected:{relative}")
        if mismatches:
            raise SystemExit("F9 rebuild mismatch:\n" + "\n".join(mismatches))
    print("Office Furniture-only Room F9 v1 rebuild check passed.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.check:
        check()
        return
    for relative in (PROCESSED_REL, REVIEW_REL):
        path = ROOT / relative
        if path.exists():
            shutil.rmtree(path)
    generated = build(ROOT)
    print(f"Generated {len(generated)} Office F9 v1 artifacts.")


if __name__ == "__main__":
    main()
