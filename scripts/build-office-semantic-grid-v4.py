#!/usr/bin/env python3
"""Build the completed Office background with all pillar art on the semantic grid."""

from __future__ import annotations

import argparse
import importlib.util
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
V3_BUILDER_PATH = ROOT / "scripts/build-office-semantic-grid-v3.py"
SOURCE_PATH = ROOT / "assets/art/backgrounds/office-c-background-modern-v4-candidate.png"
REJECTED_PATH = ROOT / "assets/art/backgrounds/office-c-background-modern-v5-pillar-aligned-candidate.png"
CURRENT_PATH = ROOT / "assets/art/backgrounds/office-c-background-modern-v6-current.png"
V3_MAP_PATH = ROOT / "assets/game/maps/office-semantic-grid-v3.json"
MAP_PATH = ROOT / "assets/game/maps/office-semantic-grid-v4.json"
MANIFEST_PATH = ROOT / "assets/game/manifests/office-semantic-grid-v4.json"
ACTIVE_MAP_PATH = ROOT / "assets/game/maps/office-c-v2.json"
RUNTIME_PATH = ROOT / "apps/web/src/features/office/components/officeSceneRuntime.ts"
REVIEW_DIR = ROOT / "assets/art/layout-references/office-semantic-grid-v4"
GRID_PATH = REVIEW_DIR / "01-current-scene-grid.png"
DETAIL_PATH = REVIEW_DIR / "02-left-pillar-base-before-after.png"

PILLARS = [
    {
        "id": "pillar-left",
        "range": "A1-B11",
        "sourcePixels": [0, 0, 84, 416],
        "targetPixels": [0, 0, 78, 431],
        "correction": "stretch-wood-through-row-11-without-floor-pixels",
    },
    {
        "id": "pillar-center",
        "range": "AB1-AD11",
        "sourcePixels": [1065, 0, 1146, 442],
        "targetPixels": [1050, 0, 1167, 431],
        "correction": "retain-v3-grid-alignment",
    },
    {
        "id": "pillar-right",
        "range": "AP1-AQ11",
        "sourcePixels": [1585, 0, 1672, 442],
        "targetPixels": [1594, 0, 1672, 431],
        "correction": "retain-v3-grid-alignment",
    },
]


def load_v3_builder():
    spec = importlib.util.spec_from_file_location("office_semantic_grid_v3_builder", V3_BUILDER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {V3_BUILDER_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


V3 = load_v3_builder()
V2 = V3.V2
WIDTH = V3.WIDTH
HEIGHT = V3.HEIGHT


def build_current() -> Image.Image:
    source = Image.open(SOURCE_PATH).convert("RGB")
    if source.size != (WIDTH, HEIGHT):
        raise RuntimeError(f"Unexpected source size: {source.size}")
    current = source.copy()
    V3.repair_released_pixels(current, source)
    for pillar in PILLARS:
        V3.paste_resized(
            current,
            source,
            tuple(pillar["sourcePixels"]),
            tuple(pillar["targetPixels"]),
        )
    return current


def validate_target_geometry() -> None:
    for pillar in PILLARS:
        grid_box = V2.cell_box(pillar["range"])
        expected = [grid_box[0], grid_box[1], grid_box[2] + 1, grid_box[3] + 1]
        if pillar["targetPixels"] != expected:
            raise RuntimeError(
                f"{pillar['id']} target {pillar['targetPixels']} does not match "
                f"semantic range {pillar['range']} at {expected}"
            )
    if PILLARS[0]["sourcePixels"][3] != 416:
        raise RuntimeError("Left pillar source must end immediately after its wood base")


def render_grid(current: Image.Image) -> Image.Image:
    overlay = Image.new("RGBA", current.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    for pillar in PILLARS:
        color = V2.COLORS[pillar["id"]]
        box = V2.cell_box(pillar["range"])
        draw.rectangle(box, fill=(*color, 48), outline=(*color, 255), width=7)
    gridded = V2.draw_grid(Image.alpha_composite(current.convert("RGBA"), overlay))
    return V2.add_legend(
        gridded,
        "OFFICE SEMANTIC GRID V4 - COMPLETE CURRENT SCENE; LEFT BASE FILLS A1:B11",
    )


def render_left_base_detail(rejected: Image.Image, current: Image.Image) -> Image.Image:
    crop_box = (0, 280, 170, 470)
    preview_size = (612, 684)
    board = Image.new("RGB", (1280, 770), (9, 15, 27))
    before = rejected.crop(crop_box).resize(preview_size, Image.Resampling.NEAREST)
    after = current.crop(crop_box).resize(preview_size, Image.Resampling.NEAREST)
    board.paste(before, (20, 62))
    board.paste(after, (648, 62))
    draw = ImageDraw.Draw(board)
    draw.text((20, 18), "REJECTED V5 - FLOOR PIXELS SHRANK INTO THE PILLAR RANGE", font=V2.font(16), fill=(248, 113, 113))
    draw.text((648, 18), "CURRENT V6 - WOOD BASE STRETCHED THROUGH ROW 11", font=V2.font(16), fill=(52, 211, 153))
    row12_y = 62 + round((431 - crop_box[1]) * preview_size[1] / (crop_box[3] - crop_box[1]))
    draw.line((20, row12_y, 632, row12_y), fill=(34, 211, 238), width=4)
    draw.line((648, row12_y, 1260, row12_y), fill=(34, 211, 238), width=4)
    draw.text((24, row12_y + 8), "ROW 12 START", font=V2.font(14), fill=(34, 211, 238))
    draw.text((652, row12_y + 8), "ROW 12 START", font=V2.font(14), fill=(34, 211, 238))
    return board


def map_data(current_content: bytes) -> dict[str, Any]:
    v3_map = json.loads(V3_MAP_PATH.read_text(encoding="utf-8"))
    return {
        "schemaVersion": 1,
        "id": "office-semantic-grid-v4",
        "status": "superseded-by-v5",
        "supersedes": "office-semantic-grid-v3",
        "supersededBy": "office-semantic-grid-v5",
        "developmentOnly": False,
        "activeOfficePromotion": False,
        "completedOn": "2026-07-29",
        "supersededOn": "2026-07-29",
        "sourceBackground": {
            "file": V3.repo_path(SOURCE_PATH),
            "sha256": V3.sha256(SOURCE_PATH),
            "mustRemainByteIdentical": True,
        },
        "rejectedBackground": {
            "file": V3.repo_path(REJECTED_PATH),
            "sha256": V3.sha256(REJECTED_PATH),
            "reason": "left-pillar-base-underfill",
        },
        "currentBackground": {
            "file": V3.repo_path(CURRENT_PATH),
            "sha256": V3.sha256_bytes(current_content),
            "pixels": [WIDTH, HEIGHT],
        },
        "activeOfficeMap": {
            "file": V3.repo_path(ACTIVE_MAP_PATH),
            "sha256": V3.sha256(ACTIVE_MAP_PATH),
            "mustRemainByteIdentical": True,
        },
        "runtimeConsumer": V3.repo_path(RUNTIME_PATH),
        "grid": v3_map["grid"],
        "zones": v3_map["zones"],
        "cellAssignments": v3_map["cellAssignments"],
        "inheritedPhysicalEdits": v3_map["inheritedPhysicalEdits"],
        "pillarAlignments": [
            {
                **pillar,
                "targetWidth": pillar["targetPixels"][2] - pillar["targetPixels"][0],
                "targetHeight": pillar["targetPixels"][3] - pillar["targetPixels"][1],
            }
            for pillar in PILLARS
        ],
        "correction": {
            "issue": "left-pillar-base-underfill",
            "rejectedSourcePixels": [0, 0, 84, 442],
            "correctedSourcePixels": [0, 0, 84, 416],
            "method": "stretch-only-the-original-left-pillar-wood-and-base-to-A1:B11",
        },
        "rules": {
            "allCellsClassified": True,
            "pillarArtMatchesSemanticRanges": True,
            "leftPillarBaseFillsRow11": True,
            "pillarPixelsEndBeforeRow12": True,
            "activeOfficePromotion": False,
            "newCharacterOrFurniture": False,
        },
    }


def manifest_data(
    map_content: bytes,
    current_content: bytes,
    review_contents: dict[Path, bytes],
) -> dict[str, Any]:
    return {
        "version": 1,
        "id": "office.semantic-grid.v4",
        "status": "superseded-by-v5",
        "updatedOn": "2026-07-29",
        "supersedes": "office.semantic-grid.v3",
        "supersededBy": "office.semantic-grid.v5",
        "map": {"file": V3.repo_path(MAP_PATH), "sha256": V3.sha256_bytes(map_content)},
        "currentBackground": {
            "file": V3.repo_path(CURRENT_PATH),
            "sha256": V3.sha256_bytes(current_content),
        },
        "reviewOutputs": [
            {"file": V3.repo_path(path), "sha256": V3.sha256_bytes(content)}
            for path, content in review_contents.items()
        ],
        "permissions": {
            "completedBackground": True,
            "activeOfficePromotion": False,
            "previouslyPromoted": True,
            "backgroundOnly": True,
            "newCharacterOrFurniture": False,
        },
        "historicalRuntime": {
            "file": V3.repo_path(RUNTIME_PATH),
            "backgroundImport": V3.repo_path(CURRENT_PATH),
        },
    }


def build_outputs() -> dict[Path, bytes]:
    validate_target_geometry()
    current = build_current()
    rejected = Image.open(REJECTED_PATH).convert("RGB")
    current_content = V3.png_bytes(current)
    review_contents = {
        GRID_PATH: V3.png_bytes(render_grid(current)),
        DETAIL_PATH: V3.png_bytes(render_left_base_detail(rejected, current)),
    }
    map_content = V3.json_bytes(map_data(current_content))
    return {
        CURRENT_PATH: current_content,
        MAP_PATH: map_content,
        **review_contents,
        MANIFEST_PATH: V3.json_bytes(
            manifest_data(map_content, current_content, review_contents)
        ),
    }


def write_or_check(outputs: dict[Path, bytes], check: bool) -> None:
    stale = []
    for path, content in outputs.items():
        if check:
            if not path.exists() or path.read_bytes() != content:
                stale.append(V3.repo_path(path))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
    if stale:
        raise SystemExit("Stale Office semantic-grid v4 outputs: " + ", ".join(stale))
    action = "verified" if check else "built"
    print(
        f"Office semantic-grid v4 superseded evidence {action}: "
        "left pillar geometry retained; V5 is current."
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    write_or_check(build_outputs(), args.check)


if __name__ == "__main__":
    main()
