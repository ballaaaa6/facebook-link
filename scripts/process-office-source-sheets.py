"""Extract the approved modern-bright office source sheets into library assets.

This deliberately stops at the asset-library boundary. It does not edit the
runtime registry or place anything on a map. Source sheets remain immutable;
the generated PNGs are trimmed, alpha-keyed library candidates and the JSON
manifest records the source cell and locked geometry contract.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "assets" / "art" / "layout-references"
OUTPUT_ROOT = ROOT / "assets" / "game" / "processed" / "office-library-modern-bright-v1"
MANIFEST_PATH = ROOT / "assets" / "game" / "manifests" / "office-library-sheets.json"


def load_geometry_catalog() -> dict[str, dict[str, Any]]:
    catalog: dict[str, dict[str, Any]] = {}
    for name in ("office-assets.json", "office-planned-assets.json"):
        path = ROOT / "assets" / "game" / "manifests" / name
        payload = json.loads(path.read_text(encoding="utf-8"))
        catalog.update(payload["assets"])
    return catalog


GEOMETRY_CATALOG = load_geometry_catalog()


def cells(*rows: list[str]) -> list[str]:
    result: list[str] = []
    for row in rows:
        if len(row) != 4:
            raise ValueError("Every source-sheet row must contain four cells.")
        result.extend(row)
    if len(result) != 16:
        raise ValueError("Every source sheet must contain exactly sixteen cells.")
    return result


def loop(prefix: str) -> list[str]:
    return [f"{prefix}.{frame}" for frame in "abcd"]


SHEETS: list[dict[str, Any]] = [
    {
        "id": "env-01-workstation-static",
        "source": "workstation-static-sheet-modern-bright-v1-source.png",
        "cells": cells(
            ["desk.workstation.front", "desk.workstation.back", "monitor.front", "monitor.back"],
            ["keyboard.mouse", "pc.case", "cable.tray", "lamp.desk"],
            ["papers.stack", "cup.coffee", "phone.desk", "tablet.drawing"],
            ["laptop.open", "speaker.desktop", "plant.small", "power.strip"],
        ),
    },
    {
        "id": "env-02-screen-themes",
        "source": "screen-themes-sheet-modern-bright-v1-source.png",
        "cells": cells(
            loop("screen.theme.progress"),
            loop("screen.theme.dashboard"),
            loop("screen.theme.content"),
            loop("screen.theme.support"),
        ),
        "animation": "seam-loop",
    },
    {
        "id": "env-05-facility-lounge",
        "source": "facility-lounge-sheet-modern-bright-v1-source.png",
        "cells": cells(
            loop("facility.status"),
            ["vending.machine.modern", "refrigerator.modern", "sofa.modern.three-seat", "sofa.modern.two-seat"],
            ["chair.massage.modern", "machine.game.arcade.modern", "locker.bank.personal-15", "case.figure-display"],
            ["beanbag.lounge", "table.board-game", "bookshelf.reading", "chair.reading"],
        ),
        "animation": "seam-loop",
    },
    {
        "id": "env-03-research-creative",
        "source": "research-creative-sheet-modern-bright-v1-source.png",
        "cells": cells(
            ["sample.tray.product", "scanner.barcode", "scale.digital", "board.comparison"],
            ["microphone.desktop", "headphones.office", "camera.tripod", "lightbox.product"],
            ["light.studio", "stand.phone", "dock.stylus", "swatches.color"],
            ["parcel.sample", "package.mockup", "turntable.display", "backdrop.stand"],
        ),
    },
    {
        "id": "env-04-release-noc",
        "source": "release-qa-noc-sheet-modern-bright-v1-source.png",
        "cells": cells(
            ["qa.checklist", "qa.triage.terminal", "qa.test.device", "qa.status.board"],
            ["release.laptop", "qa.handheld.controller", "printer.barcode", "release.package.crate"],
            ["server.rack.noc", "network.switch", "network.router.firewall", "noc.monitoring.panel"],
            ["backup.drive.dock", "alert.beacon", "cable.management.tray", "incident.response.bag"],
        ),
    },
    {
        "id": "env-06-decor-architecture-tv",
        "source": "decor-architecture-tv-sheet-modern-bright-v1-source.png",
        "cells": cells(
            ["clock.wall", "art.abstract.frame", "panel.acoustic", "shelf.wall"],
            ["plant.tall", "divider.planter", "rack.coat", "stand.umbrella"],
            ["rug.office", "table.side", "pouf.lounge", "lamp.floor"],
            loop("tv.wall"),
        ),
        "animation": "seam-loop",
    },
    {
        "id": "env-07-animated-mechanical",
        "source": "mechanical-loops-sheet-modern-bright-v1-source.png",
        "cells": cells(
            loop("vending.machine.loop"),
            loop("machine.arcade.loop"),
            loop("printer.label.loop"),
            loop("server.rack.loop"),
        ),
        "animation": "seam-loop",
    },
    {
        "id": "env-08-animated-ambient",
        "source": "ambient-loops-sheet-modern-bright-v1-source.png",
        "cells": cells(
            loop("dispenser.water.loop"),
            loop("machine.coffee.loop"),
            loop("plant.small.loop"),
            loop("lamp.desk.loop"),
        ),
        "animation": "seam-loop",
    },
    {
        "id": "chair-office-modern-v1",
        "source": "office-chair-modern-turnaround-v1.png",
        "rows": 1,
        "columns": 4,
        "cells": [
            "chair.office.modern.back",
            "chair.office.modern.front",
            "chair.office.modern.side-left",
            "chair.office.modern.side-right",
        ],
    },
    {
        "id": "env-09-phase2-completion-architecture",
        "source": "phase2-completion-architecture-sheet-modern-bright-v1-source.png",
        "cells": cells(
            ["desk.workstation.left", "desk.workstation.right", "monitor.shell.left", "monitor.shell.right"],
            ["screen.theme.system.a", "screen.theme.system.b", "screen.theme.system.c", "screen.theme.system.d"],
            ["light.wall.decorative", "ornament.small", "partition.glass", "whiteboard.mobile"],
            ["pinboard.team", "sign.exit.modern", "emergency.light.wall", "cable.cover.floor"],
        ),
    },
    {
        "id": "env-10-storage-operations-detail",
        "source": "storage-operations-detail-sheet-modern-bright-v1-source.png",
        "cells": cells(
            ["cabinet.storage.low", "cabinet.storage.tall", "cart.utility", "shelf.storage.tall"],
            ["drawer.archive", "bin.waste.modern", "bin.recycling.modern", "bin.paper.modern"],
            ["mail.sorter", "document.tray", "label.box", "first.aid.wall"],
            ["extinguisher.wall.modern", "cctv.camera.wall", "smoke.detector.wall", "clock.digital"],
        ),
    },
    {
        "id": "env-11-comfort-personal-detail",
        "source": "comfort-personal-detail-sheet-modern-bright-v1-source.png",
        "cells": cells(
            ["plant.hanging", "plant.corner.large", "planter.round", "cushion.lounge"],
            ["footrest.office", "stool.side", "coat.hooks.wall", "bag.hook.wall"],
            ["mug.stack", "water.cup.stack", "stationery.cup", "pen.stand"],
            ["headphone.hook", "desk.nameplate.blank", "monitor.arm", "cable.grommet"],
        ),
    },
]


def geometry(
    width: int,
    depth: int,
    height: int,
    *,
    render_width: int | None = None,
    render_height: int | None = None,
    footprint_width: int | None = None,
    footprint_depth: int | None = None,
    supports: list[str],
    anchor: str = "bottom-center",
    layer: str = "equipment",
    orientations: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "physicalScale": {"width": width, "depth": depth, "height": height},
        "renderBox": {"width": render_width or width, "height": render_height or height},
        "footprint": {
            "width": footprint_width if footprint_width is not None else max(1, width),
            "depth": footprint_depth if footprint_depth is not None else depth,
        },
        "supports": supports,
        "anchor": anchor,
        "layer": layer,
        "requiredOrientations": orientations or ["front"],
    }


DESK_SURFACES = ["desk-surface", "table-surface", "counter-surface", "credenza-surface", "rack-surface"]
DISPLAY_GEOMETRY = geometry(
    2,
    0,
    1,
    footprint_width=1,
    footprint_depth=0,
    supports=["wall"],
    anchor="wall-top",
    layer="equipment",
)

GEOMETRY_ALIASES = {
    "monitor.front": "monitor.front.active",
    "monitor.back": "monitor.front.active",
    "phone.desk": "phone.preview",
    "release.laptop": "laptop.open",
    "camera.tripod": "camera.tripod",
    "light.studio": "light.studio",
    "clock.wall": "clock.wall",
    "divider.planter": "divider.planter",
    "lamp.floor": "lamp.floor",
    "vending.machine.loop": "vending.machine.modern",
    "machine.arcade.loop": "machine.game.arcade.modern",
    "printer.label.loop": "printer.desktop",
    "server.rack.loop": "server.rack",
    "dispenser.water.loop": "dispenser.water",
    "machine.coffee.loop": "machine.coffee",
    "plant.small.loop": "plant.small",
    "lamp.desk.loop": "lamp.desk",
    "tv.wall": "tv.wall",
}

GEOMETRY_OVERRIDES = {
    "desk.workstation.front": geometry(3, 2, 2, render_width=3, render_height=2, supports=["floor"], anchor="center", layer="furniture", orientations=["front", "back"]),
    "desk.workstation.back": geometry(3, 2, 2, render_width=3, render_height=2, supports=["floor"], anchor="center", layer="furniture", orientations=["front", "back"]),
    "pc.case": geometry(1, 1, 2, supports=["floor"], layer="equipment"),
    "cable.tray": geometry(2, 1, 1, supports=["desk-surface"], layer="equipment"),
    "power.strip": geometry(2, 1, 1, supports=["floor", "desk-surface"], layer="equipment"),
    "screen": DISPLAY_GEOMETRY,
    "facility.status": geometry(3, 0, 1, render_width=3, footprint_width=1, footprint_depth=0, supports=["wall"], anchor="wall-top", layer="equipment"),
    "sample.tray.product": geometry(2, 1, 1, supports=DESK_SURFACES),
    "scanner.barcode": geometry(1, 1, 1, supports=DESK_SURFACES),
    "scale.digital": geometry(1, 1, 1, supports=DESK_SURFACES),
    "board.comparison": geometry(2, 0, 1, footprint_width=1, footprint_depth=0, supports=["wall"], anchor="wall-top"),
    "microphone.desktop": geometry(1, 1, 2, supports=DESK_SURFACES),
    "headphones.office": geometry(1, 1, 1, supports=DESK_SURFACES),
    "lightbox.product": geometry(2, 1, 2, supports=["desk-surface", "credenza-surface"]),
    "stand.phone": geometry(1, 1, 1, supports=DESK_SURFACES),
    "dock.stylus": geometry(1, 1, 1, supports=DESK_SURFACES),
    "swatches.color": geometry(1, 1, 1, supports=DESK_SURFACES),
    "parcel.sample": geometry(1, 1, 1, supports=["floor", *DESK_SURFACES]),
    "package.mockup": geometry(1, 1, 1, supports=DESK_SURFACES),
    "turntable.display": geometry(1, 1, 1, supports=["desk-surface", "credenza-surface"]),
    "backdrop.stand": geometry(2, 1, 3, render_width=2, render_height=3, footprint_width=2, supports=["floor"]),
    "qa.checklist": geometry(1, 1, 1, supports=DESK_SURFACES),
    "qa.triage.terminal": geometry(2, 1, 2, supports=["desk-surface", "credenza-surface"]),
    "qa.test.device": geometry(1, 1, 1, supports=DESK_SURFACES),
    "qa.status.board": geometry(2, 0, 2, footprint_width=1, footprint_depth=0, supports=["wall"], anchor="wall-top"),
    "qa.handheld.controller": geometry(1, 1, 1, supports=DESK_SURFACES),
    "printer.barcode": geometry(2, 1, 1, supports=["desk-surface", "credenza-surface"]),
    "release.package.crate": geometry(2, 1, 2, supports=["floor"]),
    "server.rack.noc": geometry(2, 1, 3, render_height=3, footprint_width=2, supports=["floor"]),
    "network.switch": geometry(2, 1, 1, supports=["rack-surface", "credenza-surface"]),
    "network.router.firewall": geometry(2, 1, 1, supports=["rack-surface", "credenza-surface"]),
    "noc.monitoring.panel": geometry(2, 0, 2, footprint_width=1, footprint_depth=0, supports=["wall"], anchor="wall-top"),
    "backup.drive.dock": geometry(1, 1, 1, supports=DESK_SURFACES),
    "alert.beacon": geometry(1, 1, 1, supports=["desk-surface", "credenza-surface"]),
    "cable.management.tray": geometry(2, 1, 1, supports=["desk-surface", "rack-surface"]),
    "incident.response.bag": geometry(2, 1, 2, supports=["floor", "credenza-surface"]),
    "art.abstract.frame": geometry(2, 0, 2, footprint_width=1, footprint_depth=0, supports=["wall"], anchor="wall-top", layer="wall"),
    "panel.acoustic": geometry(2, 0, 2, footprint_width=1, footprint_depth=0, supports=["wall"], anchor="wall-top", layer="wall"),
    "shelf.wall": geometry(2, 0, 1, footprint_width=1, footprint_depth=0, supports=["wall"], anchor="wall-top", layer="wall"),
    "rack.coat": geometry(1, 1, 3, render_height=3, supports=["floor"], layer="furniture"),
    "stand.umbrella": geometry(1, 1, 2, supports=["floor"], layer="furniture"),
    "rug.office": geometry(3, 2, 1, render_width=3, render_height=2, footprint_width=3, footprint_depth=2, supports=["floor"], anchor="center", layer="decor"),
    "table.side": geometry(2, 2, 1, footprint_width=2, footprint_depth=2, supports=["floor"], anchor="center", layer="furniture"),
    "pouf.lounge": geometry(2, 2, 1, footprint_width=2, footprint_depth=2, supports=["floor"], anchor="center", layer="furniture"),
    "chair.office.modern.back": geometry(1, 1, 2, render_height=2, supports=["floor"], layer="furniture", orientations=["front", "back", "side-left", "side-right"]),
    "chair.office.modern.front": geometry(1, 1, 2, render_height=2, supports=["floor"], layer="furniture", orientations=["front", "back", "side-left", "side-right"]),
    "chair.office.modern.side-left": geometry(1, 1, 2, render_height=2, supports=["floor"], layer="furniture", orientations=["front", "back", "side-left", "side-right"]),
    "chair.office.modern.side-right": geometry(1, 1, 2, render_height=2, supports=["floor"], layer="furniture", orientations=["front", "back", "side-left", "side-right"]),
    "desk.workstation.left": geometry(3, 2, 2, render_width=3, render_height=2, supports=["floor"], anchor="center", layer="furniture", orientations=["left"]),
    "desk.workstation.right": geometry(3, 2, 2, render_width=3, render_height=2, supports=["floor"], anchor="center", layer="furniture", orientations=["right"]),
    "monitor.shell.left": geometry(2, 1, 2, supports=["desk-surface"], orientations=["left"]),
    "monitor.shell.right": geometry(2, 1, 2, supports=["desk-surface"], orientations=["right"]),
    "light.wall.decorative": geometry(1, 0, 1, render_width=1, render_height=1, footprint_width=1, footprint_depth=0, supports=["wall"], anchor="wall-top", layer="wall"),
    "ornament.small": geometry(1, 1, 1, supports=DESK_SURFACES, layer="decor"),
    "partition.glass": geometry(4, 1, 3, render_width=4, render_height=3, footprint_width=4, footprint_depth=1, supports=["floor"], anchor="center", layer="furniture"),
    "whiteboard.mobile": geometry(3, 1, 3, render_width=3, render_height=3, footprint_width=3, footprint_depth=1, supports=["floor"], layer="furniture"),
    "pinboard.team": geometry(3, 0, 2, render_width=3, render_height=2, footprint_width=1, footprint_depth=0, supports=["wall"], anchor="wall-top", layer="wall"),
    "sign.exit.modern": geometry(1, 0, 1, render_width=1, render_height=1, footprint_width=1, footprint_depth=0, supports=["wall"], anchor="wall-top", layer="wall"),
    "emergency.light.wall": geometry(1, 0, 1, render_width=1, render_height=1, footprint_width=1, footprint_depth=0, supports=["wall"], anchor="wall-top", layer="wall"),
    "cable.cover.floor": geometry(2, 1, 1, supports=["floor"], layer="equipment"),
    "cabinet.storage.low": geometry(2, 1, 2, supports=["floor"], layer="furniture"),
    "cabinet.storage.tall": geometry(2, 1, 3, render_height=3, supports=["floor"], layer="furniture"),
    "cart.utility": geometry(2, 1, 2, supports=["floor"], layer="furniture"),
    "shelf.storage.tall": geometry(2, 1, 3, render_height=3, supports=["floor"], layer="furniture"),
    "drawer.archive": geometry(2, 1, 2, supports=["floor"], layer="furniture"),
    "bin.waste.modern": geometry(1, 1, 1, supports=["floor"], layer="decor"),
    "bin.recycling.modern": geometry(1, 1, 1, supports=["floor"], layer="decor"),
    "bin.paper.modern": geometry(1, 1, 1, supports=["floor"], layer="decor"),
    "mail.sorter": geometry(2, 1, 2, supports=["desk-surface", "counter-surface"], layer="equipment"),
    "document.tray": geometry(1, 1, 1, supports=DESK_SURFACES, layer="decor"),
    "label.box": geometry(1, 1, 1, supports=DESK_SURFACES, layer="decor"),
    "first.aid.wall": geometry(2, 0, 1, render_width=2, render_height=1, footprint_width=1, footprint_depth=0, supports=["wall"], anchor="wall-top", layer="wall"),
    "extinguisher.wall.modern": geometry(1, 0, 2, render_width=1, render_height=2, footprint_width=1, footprint_depth=0, supports=["wall"], anchor="wall-top", layer="wall"),
    "cctv.camera.wall": geometry(1, 0, 1, render_width=1, render_height=1, footprint_width=1, footprint_depth=0, supports=["wall"], anchor="wall-top", layer="wall"),
    "smoke.detector.wall": geometry(1, 0, 1, render_width=1, render_height=1, footprint_width=1, footprint_depth=0, supports=["wall"], anchor="wall-top", layer="wall"),
    "clock.digital": geometry(2, 0, 1, render_width=2, render_height=1, footprint_width=1, footprint_depth=0, supports=["wall"], anchor="wall-top", layer="wall"),
    "plant.hanging": geometry(2, 0, 2, render_width=2, render_height=2, footprint_width=1, footprint_depth=0, supports=["wall"], anchor="wall-top", layer="decor"),
    "plant.corner.large": geometry(2, 1, 3, render_width=2, render_height=3, footprint_width=2, footprint_depth=1, supports=["floor"], layer="decor"),
    "planter.round": geometry(1, 1, 1, supports=["floor", "table-surface"], layer="decor"),
    "cushion.lounge": geometry(1, 1, 1, supports=["table-surface", "floor"], layer="decor"),
    "footrest.office": geometry(1, 1, 1, supports=["floor"], layer="furniture"),
    "stool.side": geometry(1, 1, 2, render_height=2, supports=["floor"], layer="furniture"),
    "coat.hooks.wall": geometry(2, 0, 1, render_width=2, render_height=1, footprint_width=1, footprint_depth=0, supports=["wall"], anchor="wall-top", layer="wall"),
    "bag.hook.wall": geometry(1, 0, 1, render_width=1, render_height=1, footprint_width=1, footprint_depth=0, supports=["wall"], anchor="wall-top", layer="wall"),
    "mug.stack": geometry(1, 1, 1, supports=["desk-surface", "counter-surface"], layer="decor"),
    "water.cup.stack": geometry(1, 1, 1, supports=["counter-surface"], layer="decor"),
    "stationery.cup": geometry(1, 1, 1, supports=["desk-surface"], layer="decor"),
    "pen.stand": geometry(1, 1, 1, supports=["desk-surface"], layer="decor"),
    "headphone.hook": geometry(1, 0, 1, render_width=1, render_height=1, footprint_width=1, footprint_depth=0, supports=["wall", "desk-surface"], anchor="wall-top", layer="decor"),
    "desk.nameplate.blank": geometry(2, 0, 1, render_width=2, render_height=1, footprint_width=1, footprint_depth=0, supports=["desk-surface"], layer="decor"),
    "monitor.arm": geometry(1, 1, 2, render_height=2, supports=["desk-surface"], layer="equipment"),
    "cable.grommet": geometry(1, 1, 1, supports=["desk-surface"], layer="equipment"),
}


def base_asset_id(asset_id: str) -> str:
    for suffix in (".a", ".b", ".c", ".d"):
        if asset_id.endswith(suffix):
            return asset_id[: -len(suffix)]
    return asset_id


def geometry_for(asset_id: str) -> dict[str, Any]:
    base_id = base_asset_id(asset_id)
    if base_id.startswith("screen.theme."):
        base_id = "screen"
    if base_id in GEOMETRY_OVERRIDES:
        result = dict(GEOMETRY_OVERRIDES[base_id])
    else:
        catalog_id = GEOMETRY_ALIASES.get(base_id, base_id)
        if catalog_id in GEOMETRY_CATALOG:
            result = dict(GEOMETRY_CATALOG[catalog_id])
            result.setdefault(
                "footprint",
                {
                    "width": max(1, result["physicalScale"]["width"]),
                    "depth": result["physicalScale"]["depth"],
                },
            )
            result.setdefault("requiredOrientations", ["front"])
        else:
            result = geometry(1, 1, 1, supports=DESK_SURFACES)
    if asset_id.endswith((".a", ".b", ".c", ".d")):
        result["animation"] = {"type": "seam-loop", "frames": ["a", "b", "c", "d"]}
    return result


def alpha_key(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    key_mask = bytearray(rgba.width * rgba.height)
    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, _ = pixels[x, y]
            is_key = red >= 210 and blue >= 210 and green <= 120
            if is_key:
                key_mask[y * rgba.width + x] = 1
                pixels[x, y] = (0, 0, 0, 0)
    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, opacity = pixels[x, y]
            if opacity == 0 or not (red > green + 28 and blue > green + 28):
                continue
            touches_key = any(
                key_mask[near_y * rgba.width + near_x]
                for near_y in range(max(0, y - 1), min(rgba.height, y + 2))
                for near_x in range(max(0, x - 1), min(rgba.width, x + 2))
            )
            if touches_key:
                pixels[x, y] = (min(red, green + 20), green, min(blue, green + 20), opacity)
    return rgba


def process_sheet(sheet: dict[str, Any]) -> dict[str, Any]:
    source_path = SOURCE_ROOT / sheet["source"]
    if not source_path.exists():
        raise FileNotFoundError(source_path)
    source = Image.open(source_path).convert("RGBA")
    rows = sheet.get("rows", 4)
    columns = sheet.get("columns", 4)
    if source.width < columns or source.height < rows:
        raise ValueError(f"Source sheet is too small: {source_path}")
    keyed = alpha_key(source)
    x_edges = [round(index * source.width / columns) for index in range(columns + 1)]
    y_edges = [round(index * source.height / rows) for index in range(rows + 1)]
    cell_width = round(source.width / columns)
    cell_height = round(source.height / rows)
    output_dir = OUTPUT_ROOT / sheet["id"]
    output_dir.mkdir(parents=True, exist_ok=True)
    entries: list[dict[str, Any]] = []
    for index, asset_id in enumerate(sheet["cells"]):
        row, column = divmod(index, columns)
        cell = keyed.crop((x_edges[column], y_edges[row], x_edges[column + 1], y_edges[row + 1]))
        bbox = cell.getchannel("A").getbbox()
        if bbox is None:
            raise ValueError(f"Cell has no visible pixels: {sheet['id']} {row},{column}")
        trimmed = cell.crop(bbox)
        padded = Image.new("RGBA", (trimmed.width + 16, trimmed.height + 16), (0, 0, 0, 0))
        padded.paste(trimmed, (8, 8), trimmed)
        out_name = f"{asset_id}.png"
        out_path = output_dir / out_name
        padded.save(out_path, "PNG", optimize=True)
        alpha = padded.getchannel("A")
        coverage = sum(1 for value in alpha.getdata() if value > 0) / (padded.width * padded.height)
        entries.append(
            {
                "id": asset_id,
                "file": str(out_path.relative_to(ROOT)).replace("\\", "/"),
                "sourceCell": {"row": row, "column": column, "bounds": [x_edges[column], y_edges[row], x_edges[column + 1], y_edges[row + 1]]},
                "trimBox": [bbox[0], bbox[1], bbox[2], bbox[3]],
                "size": [padded.width, padded.height],
                "alphaCoverage": round(coverage, 4),
                **geometry_for(asset_id),
            }
        )
    return {
        "id": sheet["id"],
        "source": f"assets/art/layout-references/{sheet['source']}",
        "sourceSize": [source.width, source.height],
        "grid": [columns, rows],
        "cellSize": [cell_width, cell_height],
        "status": "library-ready",
        "animation": sheet.get("animation"),
        "assets": entries,
    }


def validate_library() -> list[str]:
    failures: list[str] = []
    if not MANIFEST_PATH.exists():
        return [f"Missing library manifest: {MANIFEST_PATH.relative_to(ROOT)}"]
    payload = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    manifests = payload.get("sheets", [])
    if len(manifests) != len(SHEETS):
        failures.append(f"Expected {len(SHEETS)} sheets, found {len(manifests)}.")
    expected_ids = {asset_id for sheet in SHEETS for asset_id in sheet["cells"]}
    expected_count = len(expected_ids)
    manifest_assets = [asset for sheet in manifests for asset in sheet.get("assets", [])]
    actual_ids = {asset.get("id") for asset in manifest_assets}
    if len(manifest_assets) != expected_count:
        failures.append(f"Expected {expected_count} manifest assets, found {len(manifest_assets)}.")
    if actual_ids != expected_ids:
        failures.append("Manifest asset IDs differ from the controlled source-sheet inventory.")
    for asset in manifest_assets:
        relative_path = asset.get("file")
        if not relative_path:
            failures.append(f"Missing file path for asset {asset.get('id')}.")
            continue
        path = ROOT / relative_path
        if not path.exists():
            failures.append(f"Missing processed asset: {relative_path}")
            continue
        image = Image.open(path).convert("RGBA")
        alpha = image.getchannel("A")
        if alpha.getbbox() is None:
            failures.append(f"Processed asset is fully transparent: {relative_path}")
        if alpha.getextrema()[0] != 0:
            failures.append(f"Processed asset has no transparent padding: {relative_path}")
        if any(
            red >= 210 and blue >= 210 and green <= 120 and opacity > 0
            for red, green, blue, opacity in image.getdata()
        ):
            failures.append(f"Processed asset retains visible magenta key pixels: {relative_path}")
        for field in ("physicalScale", "renderBox", "footprint", "supports", "anchor", "requiredOrientations"):
            if field not in asset:
                failures.append(f"Missing {field} metadata for asset {asset.get('id')}.")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Validate existing library outputs without rewriting them.")
    args = parser.parse_args()
    if args.check:
        failures = validate_library()
        if failures:
            print("\n".join(f"- {failure}" for failure in failures), file=sys.stderr)
            return 1
        expected_count = sum(len(sheet["cells"]) for sheet in SHEETS)
        print(f"Office asset library OK: {len(SHEETS)} sources, {expected_count} processed assets.")
        return 0
    manifests = [process_sheet(sheet) for sheet in SHEETS]
    payload = {
        "id": "office-library-modern-bright-v1",
        "status": "library-only",
        "backgroundKey": "#ff00ff",
        "sourceContract": "controlled-source-sheet",
        "runtimeIntegration": "deferred",
        "sheets": manifests,
    }
    MANIFEST_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    failures = validate_library()
    if failures:
        print("\n".join(f"- {failure}" for failure in failures), file=sys.stderr)
        return 1
    total = sum(len(sheet["assets"]) for sheet in manifests)
    print(f"Processed {len(manifests)} sheets and {total} library assets.")
    print(f"Manifest: {MANIFEST_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
