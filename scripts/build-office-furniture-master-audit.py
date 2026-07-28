#!/usr/bin/env python3
"""Build the non-promotable Office furniture master-source audit.

The audit reads original project-created source sheets and existing processed
crops without changing either. It records pixel isolation evidence, source
hashes, salvage decisions, missing geometry/parts/interaction work, and the
separate R05-r02 authority. A salvage decision permits a new extraction only;
it never permits direct crop reuse or room placement.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections import Counter, deque
from pathlib import Path
from typing import Any

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MANIFESTS = ROOT / "assets" / "game" / "manifests"
OUTPUT = MANIFESTS / "office-furniture-master-audit-v1.json"
AUDIT_DATE = "2026-07-29"

LIBRARY_MANIFEST = MANIFESTS / "office-library-sheets.json"
HISTORICAL_AUDIT = MANIFESTS / "office-asset-geometry-audit.json"
REVIEW_FACILITY_MANIFEST = MANIFESTS / "review-facility-completion.json"
REVIEW_DECOR_MANIFEST = MANIFESTS / "review-decor-completion.json"
INTERACTION_MANIFEST = MANIFESTS / "office-interaction-assets.json"
R05_MANIFEST = MANIFESTS / "office-workstation-step5-r05-r02.json"

R04_DIR = ROOT / "assets" / "game" / "processed" / "office-workstation-v3" / "step5-r04"
R05_DIR = ROOT / "assets" / "game" / "processed" / "office-workstation-v3" / "step5-r05-final"

FRAME_SUFFIXES = (".a", ".b", ".c", ".d")
SIDE_SHEETS = {
    "env-12-facility-side-orientations",
    "env-13-lounge-storage-side-orientations",
}
R05_SUPERSEDED_FAMILIES = {"desk.workstation", "monitor", "keyboard.mouse"}
SEAT_FAMILIES = {
    "beanbag.lounge",
    "chair.massage.modern",
    "chair.office.modern",
    "chair.reading",
    "pouf.lounge",
    "sofa.modern.three-seat",
    "sofa.modern.two-seat",
    "stool.side",
}
SEAT_CAPACITY = {
    "beanbag.lounge": 1,
    "chair.massage.modern": 1,
    "chair.office.modern": 1,
    "chair.reading": 1,
    "pouf.lounge": 1,
    "sofa.modern.three-seat": 3,
    "sofa.modern.two-seat": 2,
    "stool.side": 1,
}
TABLE_FAMILIES = {
    "table.board-game",
    "table.review.long.modern",
    "table.side",
}
REGENERATE_SHELL_FAMILIES = {
    "table.board-game",
    "table.side",
}
FACILITY_FAMILIES = {
    "chair.massage.modern",
    "dispenser.water",
    "locker.bank.personal-15",
    "machine.coffee",
    "machine.game.arcade.modern",
    "printer.desktop",
    "refrigerator.modern",
    "server.rack.noc",
    "vending.machine.modern",
}
ANIMATED_FAMILIES = {
    "dispenser.water",
    "lamp.desk",
    "machine.coffee",
    "machine.game.arcade.modern",
    "plant.small",
    "printer.desktop",
    "server.rack.noc",
    "tv.wall",
    "vending.machine.modern",
}
OVERLAY_FAMILIES = {
    "facility.status",
    "screen.theme.content",
    "screen.theme.dashboard",
    "screen.theme.progress",
    "screen.theme.support",
    "screen.theme.system",
}
STORAGE_FAMILIES = {
    "bookshelf.reading",
    "cabinet.printer.modern",
    "cabinet.storage.low",
    "cabinet.storage.tall",
    "cart.utility",
    "case.figure-display",
    "drawer.archive",
    "rack.coat",
    "shelf.storage.tall",
    "shelf.wall",
    "stand.umbrella",
}
WALL_FAMILIES = {
    "art.abstract.frame",
    "bag.hook.wall",
    "board.comparison",
    "cctv.camera.wall",
    "clock.digital",
    "clock.wall",
    "coat.hooks.wall",
    "emergency.light.wall",
    "extinguisher.wall.modern",
    "first.aid.wall",
    "headphone.hook",
    "light.wall.decorative",
    "noc.monitoring.panel",
    "panel.acoustic",
    "pinboard.team",
    "qa.status.board",
    "sign.exit.modern",
    "smoke.detector.wall",
}
FLOOR_DECOR_FAMILIES = {
    "cactus.cluster",
    "cactus.column",
    "divider.planter",
    "plant.bonsai",
    "plant.corner.large",
    "plant.hanging",
    "plant.small",
    "plant.snake",
    "plant.tall",
    "plant.zz",
    "planter.moss.low",
    "planter.round",
    "planter.succulent.bowl",
    "planter.trough.slim",
    "rug.office",
    "sculpture.arch.ceramic",
    "sculpture.rings.metal",
    "sculpture.stones.stack",
    "terrarium.succulent",
    "vase.floor.branch",
}
FAMILY_ALIASES = {
    "dispenser.water.loop": "dispenser.water",
    "dispenser.water.neutral": "dispenser.water",
    "lamp.desk.loop": "lamp.desk",
    "machine.arcade.loop": "machine.game.arcade.modern",
    "machine.coffee.loop": "machine.coffee",
    "machine.coffee.neutral": "machine.coffee",
    "plant.small.loop": "plant.small",
    "printer.label.loop": "printer.desktop",
    "printer.neutral": "printer.desktop",
    "server.rack.loop": "server.rack.noc",
    "vending.machine.loop": "vending.machine.modern",
}
MASK_CACHE: dict[Path, Image.Image] = {}
SHA_CACHE: dict[Path, str] = {}


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def repo_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def sha256(path: Path) -> str:
    if path not in SHA_CACHE:
        SHA_CACHE[path] = hashlib.sha256(path.read_bytes()).hexdigest()
    return SHA_CACHE[path]


def json_bytes(value: Any) -> bytes:
    return (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode("utf-8")


def frame_name(asset_id: str) -> str | None:
    return asset_id[-1] if asset_id.endswith(FRAME_SUFFIXES) else None


def family_id(asset_id: str) -> str:
    if asset_id.startswith("held."):
        return "held-props"
    value = asset_id[:-2] if asset_id.endswith(FRAME_SUFFIXES) else asset_id
    for suffix in (".side-left", ".side-right"):
        if value.endswith(suffix):
            value = value[: -len(suffix)]
    if value.startswith(("desk.workstation.", "monitor.", "chair.office.modern.")):
        for suffix in (".front", ".back", ".left", ".right"):
            if value.endswith(suffix):
                value = value[: -len(suffix)]
                break
    return FAMILY_ALIASES.get(value, value)


def orientation(asset_id: str, geometry: dict[str, Any] | None) -> str:
    suffixes = {
        ".side-left": "left",
        ".side-right": "right",
        ".front": "front",
        ".back": "back",
        ".left": "left",
        ".right": "right",
    }
    for suffix, value in suffixes.items():
        if asset_id.endswith(suffix):
            return value
    required = (geometry or {}).get("requiredOrientations", [])
    return required[0] if len(required) == 1 else "front"


def visible_mask(path: Path) -> Image.Image:
    if path in MASK_CACHE:
        return MASK_CACHE[path]
    image = Image.open(path).convert("RGBA")
    values = []
    for red, green, blue, alpha in image.getdata():
        is_key = red >= 210 and blue >= 210 and green <= 120
        values.append(255 if alpha > 0 and not is_key else 0)
    mask = Image.new("L", image.size)
    mask.putdata(values)
    MASK_CACHE[path] = mask
    return mask


def component_areas(mask: Image.Image) -> list[int]:
    width, height = mask.size
    visible = bytearray(1 if value else 0 for value in mask.getdata())
    seen = bytearray(width * height)
    areas: list[int] = []
    for start, value in enumerate(visible):
        if not value or seen[start]:
            continue
        queue = deque([start])
        seen[start] = 1
        area = 0
        while queue:
            current = queue.popleft()
            area += 1
            y, x = divmod(current, width)
            for near_y in range(max(0, y - 1), min(height, y + 2)):
                row = near_y * width
                for near_x in range(max(0, x - 1), min(width, x + 2)):
                    near = row + near_x
                    if visible[near] and not seen[near]:
                        seen[near] = 1
                        queue.append(near)
        areas.append(area)
    return sorted(areas, reverse=True)


def region_metrics(mask: Image.Image, bounds: list[int]) -> dict[str, Any]:
    left, top, right, bottom = bounds
    region = mask.crop((left, top, right, bottom))
    width, height = region.size
    bbox = region.getbbox()
    areas = component_areas(region)
    pixels = region.load()
    edge_contacts = {
        "left": sum(1 for y in range(height) if pixels[0, y]),
        "right": sum(1 for y in range(height) if pixels[width - 1, y]),
        "top": sum(1 for x in range(width) if pixels[x, 0]),
        "bottom": sum(1 for x in range(width) if pixels[x, height - 1]),
    }
    return {
        "regionPixels": [width, height],
        "visibleBounds": list(bbox) if bbox else None,
        "visiblePixelCount": sum(areas),
        "componentCount": len(areas),
        "componentsAtLeast16Pixels": sum(1 for area in areas if area >= 16),
        "largestComponentPixels": areas[0] if areas else 0,
        "secondComponentPixels": areas[1] if len(areas) > 1 else 0,
        "nominalCellBoundaryContact": any(edge_contacts.values()),
        "boundaryContactPixels": edge_contacts,
    }


def processed_metrics(path: Path) -> dict[str, Any]:
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    areas = component_areas(alpha)
    if bbox:
        left, top, right, bottom = bbox
        padding = [left, top, image.width - right, image.height - bottom]
    else:
        padding = [0, 0, 0, 0]
    return {
        "path": repo_path(path),
        "sha256": sha256(path),
        "size": [image.width, image.height],
        "alphaBounds": list(bbox) if bbox else None,
        "transparentPadding": padding,
        "componentCount": len(areas),
        "componentsAtLeast16Pixels": sum(1 for area in areas if area >= 16),
        "directReuseAllowed": False,
    }


def grid_bounds(size: tuple[int, int], grid: list[int], row: int, column: int) -> list[int]:
    columns, rows = grid
    width, height = size
    x_edges = [round(index * width / columns) for index in range(columns + 1)]
    y_edges = [round(index * height / rows) for index in range(rows + 1)]
    return [x_edges[column], y_edges[row], x_edges[column + 1], y_edges[row + 1]]


def geometry_from(asset: dict[str, Any]) -> dict[str, Any] | None:
    fields = ("physicalScale", "renderBox", "footprint", "supports", "anchor", "layer")
    result = {field: asset[field] for field in fields if field in asset}
    return result or None


def historical_reviews() -> dict[tuple[str, str], dict[str, Any]]:
    payload = load_json(HISTORICAL_AUDIT)
    return {
        (record["sourceSheet"], record["assetId"]): record["review"]
        for record in payload["records"]
        if record["catalog"] == "library"
    }


def source_record(
    *,
    source_set: str,
    source_sheet: str,
    asset: dict[str, Any],
    source_path: Path,
    source_cell: dict[str, Any] | None,
    bounds: list[int],
    old_review: dict[str, Any] | None = None,
) -> dict[str, Any]:
    geometry = geometry_from(asset)
    record = {
        "recordId": f"{source_set}:{source_sheet}:{asset['id']}",
        "assetId": asset["id"],
        "familyId": family_id(asset["id"]),
        "sourceSet": source_set,
        "sourceSheet": source_sheet,
        "sourcePath": repo_path(source_path),
        "sourceSha256": sha256(source_path),
        "sourceCell": source_cell,
        "sourceBounds": bounds,
        "orientation": orientation(asset["id"], asset),
        "animationFrame": frame_name(asset["id"]),
        "declaredGeometry": geometry,
        "sourcePixelEvidence": region_metrics(visible_mask(source_path), bounds),
        "processedEvidence": processed_metrics(ROOT / asset["file"]),
        "historicalReview": old_review,
    }
    return record


def library_records() -> list[dict[str, Any]]:
    payload = load_json(LIBRARY_MANIFEST)
    reviews = historical_reviews()
    records = []
    for sheet in payload["sheets"]:
        source_path = ROOT / sheet["source"]
        for asset in sheet["assets"]:
            cell = asset["sourceCell"]
            records.append(
                source_record(
                    source_set="modern-bright-library-v1",
                    source_sheet=sheet["id"],
                    asset=asset,
                    source_path=source_path,
                    source_cell={"row": cell["row"], "column": cell["column"]},
                    bounds=cell["bounds"],
                    old_review=reviews.get((sheet["id"], asset["id"])),
                )
            )
    return records


def review_records(path: Path, source_set: str) -> list[dict[str, Any]]:
    payload = load_json(path)
    default_source = ROOT / payload["source"]
    default_size = Image.open(default_source).size
    records = []
    for asset in payload["assets"]:
        override = asset.get("sourceOverride")
        source_path = ROOT / override if override else default_source
        cell = asset["sourceCell"]
        if override:
            bounds = [0, 0, *Image.open(source_path).size]
            source_cell = None
        else:
            bounds = grid_bounds(default_size, payload["grid"], cell["row"], cell["column"])
            source_cell = {"row": cell["row"], "column": cell["column"]}
        records.append(
            source_record(
                source_set=source_set,
                source_sheet=path.stem,
                asset=asset,
                source_path=source_path,
                source_cell=source_cell,
                bounds=bounds,
            )
        )
    return records


def held_prop_records() -> list[dict[str, Any]]:
    held = load_json(INTERACTION_MANIFEST)["heldProps"]
    source_path = ROOT / held["sheet"]
    source_size = Image.open(source_path).size
    records = []
    for asset in held["assets"]:
        row, column = asset["cell"]
        adapted = {
            "id": asset["id"],
            "file": asset["file"],
            "supports": ["character-hand"],
            "anchor": "grip-anchor",
            "layer": "held-prop",
        }
        records.append(
            source_record(
                source_set="held-props-modern-bright-v1",
                source_sheet="held-props-modern-bright-v1",
                asset=adapted,
                source_path=source_path,
                source_cell={"row": row, "column": column},
                bounds=grid_bounds(source_size, [4, 4], row, column),
            )
        )
    return records


def record_decision(record: dict[str, Any]) -> dict[str, Any]:
    family = record["familyId"]
    sheet = record["sourceSheet"]
    asset_id = record["assetId"]
    source_set = record["sourceSet"]
    boundary = record["sourcePixelEvidence"]["nominalCellBoundaryContact"]
    prior = (record.get("historicalReview") or {}).get("disposition")

    if sheet in SIDE_SHEETS:
        return {
            "decision": "reject-regenerate-orientation-if-required",
            "masterPixelsSalvageable": False,
            "reason": "The side source does not preserve the front-family identity, palette, or camera-locked silhouette.",
        }
    if family == "monitor.shell":
        return {
            "decision": "reject-regenerate-orientation-if-required",
            "masterPixelsSalvageable": False,
            "reason": "The side monitor is not an approved camera-locked turn of the R05-r02 monitor.",
        }
    if family in R05_SUPERSEDED_FAMILIES:
        return {
            "decision": "reject-use-r05-r02-authority",
            "masterPixelsSalvageable": False,
            "reason": "The R05-r02 normalized component replaces this earlier source for workstation use.",
        }
    if family == "chair.office.modern":
        return {
            "decision": "authority-provenance-use-r05-r02-output",
            "masterPixelsSalvageable": True,
            "reason": "This master is identity provenance; only the approved R05-r02 normalized layers are placeable.",
        }
    if source_set == "review-facility-completion-v1" and family == "table.review.long.modern":
        return {
            "decision": "reject-superseded-by-review-table-v3",
            "masterPixelsSalvageable": False,
            "reason": "The angled v1 table is superseded by the isolated v3 source.",
        }
    if family in REGENERATE_SHELL_FAMILIES:
        return {
            "decision": "reference-regenerate-clean-modular-shell",
            "masterPixelsSalvageable": False,
            "reason": "A child object or game state is baked into the tabletop, so a complete clean support surface cannot be recovered.",
        }
    if family == "printer.desktop" and source_set == "modern-bright-library-v1":
        return {
            "decision": "reference-effects-only-use-neutral-front-source",
            "masterPixelsSalvageable": False,
            "reason": "The label-loop family bakes output paper into full-shell frames; use the neutral completion source.",
        }
    if family in {"dispenser.water", "machine.coffee"} and source_set == "modern-bright-library-v1":
        return {
            "decision": "reference-effects-only-use-neutral-front-source",
            "masterPixelsSalvageable": False,
            "reason": "The neutral completion source is the preferred complete shell; old full-frame loops are effect references only.",
        }
    if family in ANIMATED_FAMILIES or family in SEAT_FAMILIES or family in TABLE_FAMILIES or family in FACILITY_FAMILIES:
        decision = "salvage-full-master-and-decompose"
    elif family in OVERLAY_FAMILIES or family == "held-props":
        decision = "salvage-full-master-overlay"
    else:
        decision = "salvage-full-master-reextract" if boundary or prior == "derive-composite" else "salvage-master-reextract"
    return {
        "decision": decision,
        "masterPixelsSalvageable": True,
        "reason": (
            "The intended subject is visually complete in the original master; extract from the full source and prove component ownership."
            if boundary
            else "The intended subject is visually complete and isolated enough to enter a new versioned extraction."
        ),
    }


def family_category(family: str, records: list[dict[str, Any]]) -> str:
    if family == "held-props":
        return "interaction-prop-library"
    if family in OVERLAY_FAMILIES:
        return "viewport-overlay"
    if family in SEAT_FAMILIES:
        return "seat"
    if family in TABLE_FAMILIES:
        return "table"
    if family in FACILITY_FAMILIES:
        return "interactive-facility"
    if family in STORAGE_FAMILIES:
        return "storage-or-fixed-composite"
    if family in WALL_FAMILIES:
        return "wall-mounted"
    if family in FLOOR_DECOR_FAMILIES:
        return "floor-decor"
    supports = {
        support
        for record in records
        for support in (record.get("declaredGeometry") or {}).get("supports", [])
    }
    if supports and "floor" not in supports and "wall" not in supports:
        return "surface-prop"
    return "static-equipment-or-decor"


def family_required_parts(family: str, category: str) -> list[str]:
    if family == "held-props":
        return ["normalized-cutout", "grip-anchor", "front-back-hand-layer", "facility-pool"]
    if category == "viewport-overlay":
        return ["normalized-overlay", "parent-viewport", "stable-loop-bounds"]
    if family in R05_SUPERSEDED_FAMILIES:
        return ["use-r05-r02-approved-component"]
    if family == "chair.office.modern":
        return ["use-r05-r02-rear-layer", "use-r05-r02-foreground-layer", "use-r05-r02-seat-socket"]
    if category == "seat":
        return [
            "rear-or-base-layer",
            "foreground-occlusion-layer",
            "seat-sockets",
            "ground-pivot",
            "approach-cells",
            "exit-cells",
            "reservation-contract",
        ]
    if category == "table":
        return [
            "clean-base-shell",
            "support-surface",
            "foreground-occlusion-layer",
            "independent-child-slots",
            "seat-or-use-slots",
            "approach-and-exit-cells",
            "reservation-contract",
        ]
    if category == "interactive-facility":
        parts = [
            "stable-base-shell",
            "interaction-socket",
            "approach-cell",
            "exit-cell",
            "reservation-contract",
        ]
        if family in ANIMATED_FAMILIES:
            parts.extend(["local-animation-overlay", "stable-overlay-viewport"])
        if family in {"dispenser.water", "machine.coffee", "printer.desktop", "vending.machine.modern"}:
            parts.extend(["item-neutral-output", "output-anchor", "held-prop-overlay"])
        return parts
    if category == "wall-mounted":
        return ["wall-anchor", "wall-region", "render-bounds"]
    if category == "surface-prop":
        return ["parent-surface-slot", "support-socket", "sort-pivot"]
    return ["ground-or-support-pivot", "sort-pivot", "collision-or-no-collision-declaration"]


def family_plan(family: str, records: list[dict[str, Any]]) -> dict[str, Any]:
    category = family_category(family, records)
    decisions = [record["currentDecision"]["decision"] for record in records]
    rejected = [record["recordId"] for record in records if not record["currentDecision"]["masterPixelsSalvageable"]]
    salvageable = [record["recordId"] for record in records if record["currentDecision"]["masterPixelsSalvageable"]]

    if family in R05_SUPERSEDED_FAMILIES:
        action = "use-r05-r02-authority-not-master"
        next_gate = "none-for-approved-p0-p3-component"
    elif family == "chair.office.modern":
        action = "use-r05-r02-normalized-layers"
        next_gate = "none-for-approved-p0-p3-component"
    elif family in REGENERATE_SHELL_FAMILIES:
        action = "regenerate-clean-shell"
        next_gate = "F1-geometry-then-F2-generation"
    elif category in {"seat", "table", "interactive-facility"}:
        action = "salvage-preferred-master-then-decompose"
        next_gate = "F1-geometry"
    elif category in {"viewport-overlay", "interaction-prop-library"}:
        action = "salvage-as-child-parts"
        next_gate = "F1-parent-and-anchor-contract"
    else:
        action = "salvage-new-versioned-extraction"
        next_gate = "F1-geometry"

    capacities = {
        **SEAT_CAPACITY,
        "table.board-game": 4,
        "table.review.long.modern": 4,
        "locker.bank.personal-15": 15,
    }
    notes = []
    if any("regenerate-orientation" in decision for decision in decisions):
        notes.append("Existing side-orientation cells are rejected; generate only layout-required turns.")
    if family in {"dispenser.water", "machine.coffee", "printer.desktop"}:
        notes.append("Use the review-facility neutral source as the preferred shell and keep output items separate.")
    if family in {"vending.machine.modern", "machine.game.arcade.modern", "server.rack.noc"}:
        notes.append("Use the static front as the identity shell and derive only local screen, LED, tray, or mechanism overlays.")
    if family == "refrigerator.modern":
        notes.append("The front shell is salvageable; door motion is deferred unless the interaction contract requires it.")
    if family == "table.review.long.modern":
        notes.append("Use only the isolated v3 source; the earlier angled table is rejected.")
    if family == "whiteboard.mobile":
        notes.append("Defer while the V8 room uses the built-in wall whiteboard.")

    preferred_geometry = next(
        (
            record["declaredGeometry"]
            for record in records
            if record["currentDecision"]["masterPixelsSalvageable"] and record["declaredGeometry"]
        ),
        None,
    )
    return {
        "familyId": family,
        "category": category,
        "sourceRecordCount": len(records),
        "action": action,
        "placementReadiness": (
            "approved-component-only-not-room-placement"
            if family in R05_SUPERSEDED_FAMILIES or family == "chair.office.modern"
            else "blocked-until-F8-owner-approval"
        ),
        "nextGate": next_gate,
        "declaredGeometryReference": preferred_geometry,
        "capacityReference": capacities.get(family),
        "requiredPartsAndContracts": family_required_parts(family, category),
        "salvageableSourceRecords": salvageable,
        "rejectedOrSupersededSourceRecords": rejected,
        "notes": notes,
    }


def r05_authority() -> dict[str, Any]:
    manifest = load_json(R05_MANIFEST)
    files = {
        "desk": [
            R04_DIR / f"desk.workstation.modern.v3.{side}.{role}.png"
            for side in ("public", "seat")
            for role in ("rear", "surface", "base", "foreground")
        ],
        "chair": [
            R05_DIR / f"chair.office.modern.r05.{side}.{role}.png"
            for side in ("front", "back")
            for role in ("rear", "foreground")
        ],
        "monitor": [
            R04_DIR / "monitor.workstation.v3.front.png",
            R04_DIR / "monitor.workstation.v3.back.png",
        ],
        "keyboard": [R04_DIR / "keyboard.workstation.v3.full.png"],
    }
    return {
        "manifest": repo_path(R05_MANIFEST),
        "manifestSha256": sha256(R05_MANIFEST),
        "status": manifest["status"],
        "approvedScope": manifest["ownerDecision"]["approvedScope"],
        "placementLimit": "P0-P3 paired-workstation component authority; no rejected P4-P6 coordinates and no Active Office promotion.",
        "components": {
            name: {
                "geometry": manifest["components"][name],
                "files": [{"path": repo_path(path), "sha256": sha256(path)} for path in paths],
            }
            for name, paths in files.items()
        },
    }


def build_audit() -> dict[str, Any]:
    records = [
        *library_records(),
        *review_records(REVIEW_FACILITY_MANIFEST, "review-facility-completion-v1"),
        *review_records(REVIEW_DECOR_MANIFEST, "review-decor-completion-v2"),
        *held_prop_records(),
    ]
    for record in records:
        record["currentDecision"] = record_decision(record)

    grouped: dict[str, list[dict[str, Any]]] = {}
    for record in records:
        grouped.setdefault(record["familyId"], []).append(record)
    families = [family_plan(family, grouped[family]) for family in sorted(grouped)]

    record_decisions = Counter(record["currentDecision"]["decision"] for record in records)
    family_actions = Counter(family["action"] for family in families)
    source_files = {record["sourcePath"] for record in records}
    return {
        "version": 1,
        "status": "planning-audit-not-promotion-authority",
        "updatedOn": AUDIT_DATE,
        "policy": {
            "processedCropDirectReuse": False,
            "activeOfficePixelReuse": False,
            "legacyOrRejectedPixelReuse": False,
            "masterSalvageRequiresNewVersionedExtraction": True,
            "salvageDoesNotWaiveF0ThroughF8": True,
            "missingAssetFallback": False,
        },
        "scope": {
            "sourceRecordCount": len(records),
            "familyCount": len(families),
            "originalSourceFileCount": len(source_files),
            "sourceSets": sorted({record["sourceSet"] for record in records}),
            "excludedAsForbiddenInputs": [
                "office-c-v2 runtime registry assets",
                "core-furniture-c-v1",
                "core-furniture-c-v2",
                "decor-mechanical-c-v1",
                "equipment-c-v1",
                "rejected candidate composites",
                "all existing processed modern-bright crops as direct runtime inputs",
            ],
        },
        "summary": {
            "recordDecisions": dict(sorted(record_decisions.items())),
            "familyActions": dict(sorted(family_actions.items())),
            "recordsWithNominalCellBoundaryContact": sum(
                1 for record in records if record["sourcePixelEvidence"]["nominalCellBoundaryContact"]
            ),
            "directlyReusableProcessedCrops": 0,
            "alreadyApprovedFurnitureFamilies": 1,
            "roomReadyNonWorkstationFamilies": 0,
        },
        "approvedAuthority": r05_authority(),
        "families": families,
        "records": records,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail when the stored audit differs from current inputs.")
    args = parser.parse_args()
    payload = build_audit()
    expected = json_bytes(payload)
    if args.check:
        if not OUTPUT.exists():
            print(f"Missing audit: {repo_path(OUTPUT)}", file=sys.stderr)
            return 1
        if OUTPUT.read_bytes() != expected:
            print(f"Furniture master audit is stale: {repo_path(OUTPUT)}", file=sys.stderr)
            return 1
        print(
            "Office furniture master audit OK: "
            f"{payload['scope']['sourceRecordCount']} records, "
            f"{payload['scope']['familyCount']} families, "
            f"{payload['scope']['originalSourceFileCount']} original source files."
        )
        return 0
    OUTPUT.write_bytes(expected)
    print(f"Wrote {repo_path(OUTPUT)}")
    print(json.dumps(payload["summary"], indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
