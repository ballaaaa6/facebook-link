#!/usr/bin/env python3
"""Normalize the generated V7 Office scene to the semantic grid."""

from __future__ import annotations

import argparse
import importlib.util
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
V4_BUILDER_PATH = ROOT / "scripts/build-office-semantic-grid-v4.py"
REVIEW_DIR = ROOT / "assets/art/layout-references/office-semantic-grid-v5"
SOURCE_PATH = REVIEW_DIR / "00-imagegen-source.png"
PREVIOUS_PATH = ROOT / "assets/art/backgrounds/office-c-background-modern-v6-current.png"
CURRENT_PATH = ROOT / "assets/art/backgrounds/office-c-background-modern-v7-current.png"
V4_MAP_PATH = ROOT / "assets/game/maps/office-semantic-grid-v4.json"
MAP_PATH = ROOT / "assets/game/maps/office-semantic-grid-v5.json"
MANIFEST_PATH = ROOT / "assets/game/manifests/office-semantic-grid-v5.json"
ACTIVE_MAP_PATH = ROOT / "assets/game/maps/office-c-v2.json"
RUNTIME_PATH = ROOT / "apps/web/src/features/office/components/officeSceneRuntime.ts"
GRID_PATH = REVIEW_DIR / "01-current-scene-grid.png"
COMPARISON_PATH = REVIEW_DIR / "02-v6-v7-before-after.png"
WHITEBOARD_PATH = REVIEW_DIR / "03-whiteboard-viewport-grid.png"

WIDTH = 1672
HEIGHT = 941
X_CONTROLS = [
    {"source": 0, "target": 0, "landmark": "canvas-left"},
    {"source": 84, "target": 78, "landmark": "left-pillar-right"},
    {"source": 498, "target": 510, "landmark": "window-left"},
    {"source": 998, "target": 1011, "landmark": "window-right"},
    {"source": 1038, "target": 1050, "landmark": "center-pillar-and-floor-left"},
    {"source": 1146, "target": 1167, "landmark": "center-pillar-right"},
    {"source": 1175, "target": 1205, "landmark": "whiteboard-left"},
    {"source": 1548, "target": 1555, "landmark": "whiteboard-right"},
    {"source": 1584, "target": 1594, "landmark": "right-pillar-left"},
    {"source": 1672, "target": 1672, "landmark": "canvas-right"},
]
Y_CONTROLS = [
    {"source": 0, "target": 0, "landmark": "canvas-top"},
    {"source": 123, "target": 118, "landmark": "window-top"},
    {"source": 366, "target": 353, "landmark": "window-bottom"},
    {"source": 445, "target": 431, "landmark": "wall-floor-and-pillar-bottom"},
    {"source": 941, "target": 941, "landmark": "canvas-bottom"},
]
PILLARS = [
    {"id": "pillar-left", "range": "A1-B11", "sourcePixels": [0, 0, 84, 445], "targetPixels": [0, 0, 78, 431]},
    {"id": "pillar-center", "range": "AB1-AD11", "sourcePixels": [1038, 0, 1146, 445], "targetPixels": [1050, 0, 1167, 431]},
    {"id": "pillar-right", "range": "AP1-AQ11", "sourcePixels": [1584, 0, 1672, 445], "targetPixels": [1594, 0, 1672, 431]},
]
WHITEBOARD = {
    "id": "work-status-whiteboard",
    "supportRange": "AF4-AN9",
    "contentRange": "AG5-AM8",
    "supportPixels": [1205, 118, 1555, 353],
    "renderedFramePixels": [1205, 136, 1555, 331],
    "contentPixels": [1244, 157, 1516, 314],
}


def load_v4_builder():
    spec = importlib.util.spec_from_file_location("office_semantic_grid_v4_builder", V4_BUILDER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {V4_BUILDER_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


V4 = load_v4_builder()
V3 = V4.V3
V2 = V4.V2


def resize_axis(image: Image.Image, controls: list[dict[str, Any]], horizontal: bool) -> Image.Image:
    output = Image.new("RGB", (WIDTH, HEIGHT))
    for start, end in zip(controls, controls[1:]):
        source_start = start["source"]
        source_end = end["source"]
        target_start = start["target"]
        target_end = end["target"]
        if horizontal:
            box = (source_start, 0, source_end, HEIGHT)
            size = (target_end - target_start, HEIGHT)
            position = (target_start, 0)
        else:
            box = (0, source_start, WIDTH, source_end)
            size = (WIDTH, target_end - target_start)
            position = (0, target_start)
        output.paste(image.crop(box).resize(size, Image.Resampling.LANCZOS), position)
    return output


def build_current() -> Image.Image:
    source = Image.open(SOURCE_PATH).convert("RGB")
    if source.size != (WIDTH, HEIGHT):
        raise RuntimeError(f"Unexpected generated source size: {source.size}")
    return resize_axis(resize_axis(source, X_CONTROLS, True), Y_CONTROLS, False)


def validate_geometry() -> None:
    for controls, expected_end in ((X_CONTROLS, WIDTH), (Y_CONTROLS, HEIGHT)):
        sources = [record["source"] for record in controls]
        targets = [record["target"] for record in controls]
        if sources != sorted(sources) or targets != sorted(targets):
            raise RuntimeError("Geometry controls must remain monotonic")
        if sources[0] != 0 or targets[0] != 0 or sources[-1] != expected_end or targets[-1] != expected_end:
            raise RuntimeError("Geometry controls must cover the complete image")
    for pillar in PILLARS:
        grid_box = V2.cell_box(pillar["range"])
        expected = [grid_box[0], grid_box[1], grid_box[2] + 1, grid_box[3] + 1]
        if pillar["targetPixels"] != expected:
            raise RuntimeError(f"{pillar['id']} does not match {pillar['range']}")
    for range_id, pixels in (
        (WHITEBOARD["supportRange"], WHITEBOARD["supportPixels"]),
        (WHITEBOARD["contentRange"], WHITEBOARD["contentPixels"]),
    ):
        grid_box = V2.cell_box(range_id)
        expected = [grid_box[0], grid_box[1], grid_box[2] + 1, grid_box[3] + 1]
        if pixels != expected:
            raise RuntimeError(f"Whiteboard pixels do not match {range_id}")


def render_grid(current: Image.Image) -> Image.Image:
    overlay = Image.new("RGBA", current.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    for pillar in PILLARS:
        color = V2.COLORS[pillar["id"]]
        draw.rectangle(V2.cell_box(pillar["range"]), fill=(*color, 40), outline=(*color, 255), width=6)
    draw.rectangle(
        V2.cell_box(WHITEBOARD["supportRange"]),
        fill=(20, 184, 166, 28),
        outline=(20, 184, 166, 255),
        width=6,
    )
    gridded = V2.draw_grid(Image.alpha_composite(current.convert("RGBA"), overlay))
    return V2.add_legend(
        gridded,
        "OFFICE SEMANTIC GRID V5 - CLEAN NATIVE PILLARS + STATUS WHITEBOARD",
    )


def render_comparison(previous: Image.Image, current: Image.Image) -> Image.Image:
    preview_size = (836, 471)
    board = Image.new("RGB", (WIDTH, 521), (9, 15, 27))
    board.paste(previous.resize(preview_size, Image.Resampling.LANCZOS), (0, 50))
    board.paste(current.resize(preview_size, Image.Resampling.LANCZOS), (836, 50))
    draw = ImageDraw.Draw(board)
    draw.text((20, 13), "BEFORE - V6 LOCAL PILLAR PATCHES", font=V2.font(18), fill=(248, 113, 113))
    draw.text((856, 13), "AFTER - V7 CLEAN RERENDER + WHITEBOARD", font=V2.font(18), fill=(52, 211, 153))
    draw.line((836, 0, 836, 521), fill=(34, 211, 238), width=3)
    return board


def render_whiteboard_reference(current: Image.Image) -> Image.Image:
    overlay = Image.new("RGBA", current.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    draw.rectangle(
        V2.cell_box(WHITEBOARD["supportRange"]),
        fill=(168, 85, 247, 36),
        outline=(168, 85, 247, 255),
        width=7,
    )
    draw.rectangle(
        V2.cell_box(WHITEBOARD["contentRange"]),
        fill=(34, 211, 238, 44),
        outline=(34, 211, 238, 255),
        width=6,
    )
    gridded = V2.draw_grid(Image.alpha_composite(current.convert("RGBA"), overlay))
    return V2.add_legend(
        gridded,
        "WHITEBOARD: AF4:AN9 SUPPORT; AG5:AM8 DYNAMIC STATUS VIEWPORT",
    )


def map_data(current_content: bytes) -> dict[str, Any]:
    v4_map = json.loads(V4_MAP_PATH.read_text(encoding="utf-8"))
    return {
        "schemaVersion": 1,
        "id": "office-semantic-grid-v5",
        "status": "complete-current",
        "supersedes": "office-semantic-grid-v4",
        "developmentOnly": False,
        "activeOfficePromotion": True,
        "completedOn": "2026-07-29",
        "generatedSource": {
            "file": V3.repo_path(SOURCE_PATH),
            "sha256": V3.sha256(SOURCE_PATH),
            "method": "built-in-image-generation",
        },
        "previousBackground": {
            "file": V3.repo_path(PREVIOUS_PATH),
            "sha256": V3.sha256(PREVIOUS_PATH),
            "reasonSuperseded": "localized-pillar-repairs-were-visually-inconsistent",
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
        "grid": v4_map["grid"],
        "zones": v4_map["zones"],
        "cellAssignments": v4_map["cellAssignments"],
        "pillarAlignments": PILLARS,
        "wallDisplays": [
            {
                **WHITEBOARD,
                "kind": "dynamic-work-status-display",
                "baseZone": "relax-wall",
                "initialState": "blank",
                "futureContent": ["workflow", "stage", "progress", "review-state", "updated-at"],
            }
        ],
        "geometryNormalization": {
            "method": "whole-scene-piecewise-resampling-at-architectural-boundaries",
            "xControls": X_CONTROLS,
            "yControls": Y_CONTROLS,
            "localizedPatchCompositing": False,
        },
        "rules": {
            "allCellsClassified": True,
            "pillarArtMatchesSemanticRanges": True,
            "pillarPixelsEndBeforeRow12": True,
            "whiteboardContentRemainsBlankInBackground": True,
            "activeOfficePromotion": True,
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
        "id": "office.semantic-grid.v5",
        "status": "complete-current",
        "updatedOn": "2026-07-29",
        "supersedes": "office.semantic-grid.v4",
        "map": {"file": V3.repo_path(MAP_PATH), "sha256": V3.sha256_bytes(map_content)},
        "generatedSource": {"file": V3.repo_path(SOURCE_PATH), "sha256": V3.sha256(SOURCE_PATH)},
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
            "activeOfficePromotion": True,
            "dynamicWhiteboardViewport": True,
            "newCharacterOrFurniture": False,
        },
        "runtime": {
            "file": V3.repo_path(RUNTIME_PATH),
            "backgroundImport": V3.repo_path(CURRENT_PATH),
        },
    }


def build_outputs() -> dict[Path, bytes]:
    validate_geometry()
    current = build_current()
    previous = Image.open(PREVIOUS_PATH).convert("RGB")
    current_content = V3.png_bytes(current)
    review_contents = {
        GRID_PATH: V3.png_bytes(render_grid(current)),
        COMPARISON_PATH: V3.png_bytes(render_comparison(previous, current)),
        WHITEBOARD_PATH: V3.png_bytes(render_whiteboard_reference(current)),
    }
    map_content = V3.json_bytes(map_data(current_content))
    return {
        CURRENT_PATH: current_content,
        MAP_PATH: map_content,
        **review_contents,
        MANIFEST_PATH: V3.json_bytes(manifest_data(map_content, current_content, review_contents)),
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
        raise SystemExit("Stale Office semantic-grid v5 outputs: " + ", ".join(stale))
    action = "verified" if check else "built"
    print(
        f"Office semantic-grid v5 {action}: clean pillars, blank AF4:AN9 "
        "whiteboard, AG5:AM8 status viewport, and current V7 background."
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    write_or_check(build_outputs(), args.check)


if __name__ == "__main__":
    main()
