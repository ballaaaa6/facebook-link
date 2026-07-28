#!/usr/bin/env python3
"""Build the isolated V8 Office review candidate from owner-marked geometry."""

from __future__ import annotations

import argparse
import importlib.util
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
V5_BUILDER_PATH = ROOT / "scripts/build-office-semantic-grid-v5.py"
REVIEW_DIR = ROOT / "assets/art/layout-references/office-semantic-grid-v6"
OWNER_MARKUP_PATH = REVIEW_DIR / "00-owner-markup.png"
SOURCE_PATH = REVIEW_DIR / "01-imagegen-source.png"
PROMPT_PATH = REVIEW_DIR / "IMAGEGEN_PROMPT.md"
BASE_PATH = ROOT / "assets/art/backgrounds/office-c-background-modern-v6-current.png"
ACTIVE_BACKGROUND_PATH = ROOT / "assets/art/backgrounds/office-c-background-modern-v7-current.png"
CANDIDATE_PATH = ROOT / "assets/art/backgrounds/office-c-background-modern-v8-owner-review.png"
V4_MAP_PATH = ROOT / "assets/game/maps/office-semantic-grid-v4.json"
V5_MAP_PATH = ROOT / "assets/game/maps/office-semantic-grid-v5.json"
MAP_PATH = ROOT / "assets/game/maps/office-semantic-grid-v6.json"
MANIFEST_PATH = ROOT / "assets/game/manifests/office-semantic-grid-v6.json"
ACTIVE_MAP_PATH = ROOT / "assets/game/maps/office-c-v2.json"
RUNTIME_PATH = ROOT / "apps/web/src/features/office/components/officeSceneRuntime.ts"
GRID_PATH = REVIEW_DIR / "02-candidate-grid.png"
COMPARISON_PATH = REVIEW_DIR / "03-v4-v8-before-after.png"
CHANGES_PATH = REVIEW_DIR / "04-change-zones-grid.png"

WIDTH = 1672
HEIGHT = 941
X_CONTROLS = [
    {"source": 0, "target": 0, "landmark": "canvas-left"},
    {"source": 84, "target": 78, "landmark": "left-pillar-right"},
    {"source": 134, "target": 117, "landmark": "whiteboard-left"},
    {"source": 477, "target": 467, "landmark": "whiteboard-right"},
    {"source": 531, "target": 510, "landmark": "window-left"},
    {"source": 1018, "target": 1011, "landmark": "window-right"},
    {"source": 1052, "target": 1050, "landmark": "center-pillar-and-floor-left"},
    {"source": 1169, "target": 1167, "landmark": "center-pillar-right"},
    {"source": 1590, "target": 1594, "landmark": "right-pillar-left"},
    {"source": 1672, "target": 1672, "landmark": "canvas-right"},
]
Y_CONTROLS = [
    {"source": 0, "target": 0, "landmark": "canvas-top"},
    {"source": 123, "target": 118, "landmark": "window-top"},
    {"source": 360, "target": 353, "landmark": "window-bottom"},
    {"source": 430, "target": 431, "landmark": "pillar-bottom"},
    {"source": 941, "target": 941, "landmark": "canvas-bottom"},
]
PILLARS = [
    {"id": "pillar-left", "range": "A1-B11", "targetPixels": [0, 0, 78, 431]},
    {"id": "pillar-center", "range": "AB1-AD11", "targetPixels": [1050, 0, 1167, 431]},
    {"id": "pillar-right", "range": "AP1-AQ11", "targetPixels": [1594, 0, 1672, 431]},
]
WHITEBOARD = {
    "id": "work-status-whiteboard",
    "supportRange": "D4-L9",
    "contentRange": "E5-K8",
    "supportPixels": [117, 118, 467, 353],
    "contentPixels": [156, 157, 428, 314],
}
OFFICE_FLOOR_RANGES = ["C11-AA11", "A12-AA24"]
BOARD_INTERMEDIATE_CROP = [117, 129, 467, 343]


def load_v5_builder():
    spec = importlib.util.spec_from_file_location("office_semantic_grid_v5_builder", V5_BUILDER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {V5_BUILDER_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


V5 = load_v5_builder()
V4 = V5.V4
V3 = V5.V3
V2 = V5.V2


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


def build_candidate() -> Image.Image:
    source = Image.open(SOURCE_PATH).convert("RGB")
    if source.size != (WIDTH, HEIGHT):
        raise RuntimeError(f"Unexpected generated source size: {source.size}")
    candidate = resize_axis(resize_axis(source, X_CONTROLS, True), Y_CONTROLS, False)
    board = candidate.crop(tuple(BOARD_INTERMEDIATE_CROP)).resize(
        (
            WHITEBOARD["supportPixels"][2] - WHITEBOARD["supportPixels"][0],
            WHITEBOARD["supportPixels"][3] - WHITEBOARD["supportPixels"][1],
        ),
        Image.Resampling.LANCZOS,
    )
    candidate.paste(board, tuple(WHITEBOARD["supportPixels"][:2]))
    return candidate


def validate_geometry() -> None:
    for controls, expected_end in ((X_CONTROLS, WIDTH), (Y_CONTROLS, HEIGHT)):
        sources = [record["source"] for record in controls]
        targets = [record["target"] for record in controls]
        if sources != sorted(sources) or targets != sorted(targets):
            raise RuntimeError("Geometry controls must remain monotonic")
        if sources[0] != 0 or targets[0] != 0 or sources[-1] != expected_end or targets[-1] != expected_end:
            raise RuntimeError("Geometry controls must cover the complete image")
    for pillar in PILLARS:
        box = V2.cell_box(pillar["range"])
        expected = [box[0], box[1], box[2] + 1, box[3] + 1]
        if pillar["targetPixels"] != expected:
            raise RuntimeError(f"{pillar['id']} does not match {pillar['range']}")
    for range_id, pixels in (
        (WHITEBOARD["supportRange"], WHITEBOARD["supportPixels"]),
        (WHITEBOARD["contentRange"], WHITEBOARD["contentPixels"]),
    ):
        box = V2.cell_box(range_id)
        expected = [box[0], box[1], box[2] + 1, box[3] + 1]
        if pixels != expected:
            raise RuntimeError(f"Whiteboard pixels do not match {range_id}")


def draw_change_overlay(image: Image.Image, show_floor: bool) -> Image.Image:
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    for pillar in PILLARS:
        color = V2.COLORS[pillar["id"]]
        draw.rectangle(V2.cell_box(pillar["range"]), fill=(*color, 38), outline=(*color, 255), width=6)
    draw.rectangle(
        V2.cell_box(WHITEBOARD["supportRange"]),
        fill=(236, 72, 153, 34),
        outline=(236, 72, 153, 255),
        width=6,
    )
    draw.rectangle(
        V2.cell_box(WHITEBOARD["contentRange"]),
        fill=(34, 211, 238, 30),
        outline=(34, 211, 238, 255),
        width=5,
    )
    if show_floor:
        for floor_range in OFFICE_FLOOR_RANGES:
            draw.rectangle(
                V2.cell_box(floor_range),
                fill=(245, 158, 11, 24),
                outline=(245, 158, 11, 255),
                width=5,
            )
    return Image.alpha_composite(image.convert("RGBA"), overlay)


def render_grid(candidate: Image.Image) -> Image.Image:
    gridded = V2.draw_grid(draw_change_overlay(candidate, False))
    return V2.add_legend(
        gridded,
        "OFFICE SEMANTIC GRID V6 CANDIDATE - D4:L9 WHITEBOARD + NEW SLAT PILLARS",
    )


def render_change_zones(candidate: Image.Image) -> Image.Image:
    gridded = V2.draw_grid(draw_change_overlay(candidate, True))
    return V2.add_legend(
        gridded,
        "V8 EDIT ZONES - WHITEBOARD, THREE PILLARS, AND OFFICE HERRINGBONE SPC",
    )


def render_comparison(base: Image.Image, candidate: Image.Image) -> Image.Image:
    preview_size = (836, 471)
    board = Image.new("RGB", (WIDTH, 521), (9, 15, 27))
    board.paste(base.resize(preview_size, Image.Resampling.LANCZOS), (0, 50))
    board.paste(candidate.resize(preview_size, Image.Resampling.LANCZOS), (836, 50))
    draw = ImageDraw.Draw(board)
    draw.text((20, 13), "BEFORE - V4 OWNER BASE", font=V2.font(18), fill=(255, 255, 255))
    draw.text((856, 13), "AFTER - V8 OWNER-REVIEW CANDIDATE", font=V2.font(18), fill=(52, 211, 153))
    draw.line((836, 0, 836, 521), fill=(34, 211, 238), width=3)
    return board


def map_data(candidate_content: bytes) -> dict[str, Any]:
    v4_map = json.loads(V4_MAP_PATH.read_text(encoding="utf-8"))
    return {
        "schemaVersion": 1,
        "id": "office-semantic-grid-v6",
        "status": "owner-review",
        "basedOn": "office-semantic-grid-v4",
        "proposesToSupersede": "office-semantic-grid-v5",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "createdOn": "2026-07-29",
        "ownerMarkup": {"file": V3.repo_path(OWNER_MARKUP_PATH), "sha256": V3.sha256(OWNER_MARKUP_PATH)},
        "generationPrompt": {"file": V3.repo_path(PROMPT_PATH), "sha256": V3.sha256(PROMPT_PATH)},
        "generatedSource": {
            "file": V3.repo_path(SOURCE_PATH),
            "sha256": V3.sha256(SOURCE_PATH),
            "method": "built-in-image-generation",
        },
        "baseBackground": {"file": V3.repo_path(BASE_PATH), "sha256": V3.sha256(BASE_PATH)},
        "candidateBackground": {
            "file": V3.repo_path(CANDIDATE_PATH),
            "sha256": V3.sha256_bytes(candidate_content),
            "pixels": [WIDTH, HEIGHT],
        },
        "activeOfficeBaseline": {
            "semanticMap": {"file": V3.repo_path(V5_MAP_PATH), "sha256": V3.sha256(V5_MAP_PATH)},
            "runtimeMap": {"file": V3.repo_path(ACTIVE_MAP_PATH), "sha256": V3.sha256(ACTIVE_MAP_PATH)},
            "background": {
                "file": V3.repo_path(ACTIVE_BACKGROUND_PATH),
                "sha256": V3.sha256(ACTIVE_BACKGROUND_PATH),
            },
            "runtimeConsumer": V3.repo_path(RUNTIME_PATH),
            "mustRemainUnchangedUntilOwnerApproval": True,
        },
        "grid": v4_map["grid"],
        "zones": v4_map["zones"],
        "cellAssignments": v4_map["cellAssignments"],
        "pillarAlignments": PILLARS,
        "wallDisplays": [
            {
                **WHITEBOARD,
                "kind": "dynamic-work-status-display",
                "baseZone": "office-wall",
                "initialState": "blank",
                "futureContent": ["workflow", "stage", "progress", "review-state", "updated-at"],
            }
        ],
        "floorReplacement": {
            "zone": "office-floor",
            "ranges": OFFICE_FLOOR_RANGES,
            "material": "light-warm-oak-spc",
            "pattern": "herringbone",
            "relaxationFloorUnchanged": True,
        },
        "geometryNormalization": {
            "method": "whole-scene-piecewise-resampling-at-architectural-boundaries",
            "xControls": X_CONTROLS,
            "yControls": Y_CONTROLS,
            "whiteboardFinalFit": {
                "sourcePixelsAfterNormalization": BOARD_INTERMEDIATE_CROP,
                "targetPixels": WHITEBOARD["supportPixels"],
            },
        },
        "rules": {
            "onlyOwnerRequestedChanges": True,
            "allCellsClassified": True,
            "pillarArtMatchesSemanticRanges": True,
            "pillarPixelsEndBeforeRow12": True,
            "whiteboardIsLeftOnly": True,
            "rightRelaxWallRemainsBlank": True,
            "activeOfficePromotion": False,
            "newCharacterOrFurniture": False,
        },
    }


def manifest_data(
    map_content: bytes,
    candidate_content: bytes,
    review_contents: dict[Path, bytes],
) -> dict[str, Any]:
    return {
        "version": 1,
        "id": "office.semantic-grid.v6",
        "status": "owner-review",
        "updatedOn": "2026-07-29",
        "basedOn": "office.semantic-grid.v4",
        "proposesToSupersede": "office.semantic-grid.v5",
        "map": {"file": V3.repo_path(MAP_PATH), "sha256": V3.sha256_bytes(map_content)},
        "ownerMarkup": {"file": V3.repo_path(OWNER_MARKUP_PATH), "sha256": V3.sha256(OWNER_MARKUP_PATH)},
        "generatedSource": {"file": V3.repo_path(SOURCE_PATH), "sha256": V3.sha256(SOURCE_PATH)},
        "candidateBackground": {
            "file": V3.repo_path(CANDIDATE_PATH),
            "sha256": V3.sha256_bytes(candidate_content),
        },
        "reviewOutputs": [
            {"file": V3.repo_path(path), "sha256": V3.sha256_bytes(content)}
            for path, content in review_contents.items()
        ],
        "permissions": {
            "isolatedOwnerReview": True,
            "activeOfficePromotion": False,
            "runtimeChange": False,
            "newCharacterOrFurniture": False,
        },
    }


def build_outputs() -> dict[Path, bytes]:
    validate_geometry()
    candidate = build_candidate()
    base = Image.open(BASE_PATH).convert("RGB")
    candidate_content = V3.png_bytes(candidate)
    review_contents = {
        GRID_PATH: V3.png_bytes(render_grid(candidate)),
        COMPARISON_PATH: V3.png_bytes(render_comparison(base, candidate)),
        CHANGES_PATH: V3.png_bytes(render_change_zones(candidate)),
    }
    map_content = V3.json_bytes(map_data(candidate_content))
    return {
        CANDIDATE_PATH: candidate_content,
        MAP_PATH: map_content,
        **review_contents,
        MANIFEST_PATH: V3.json_bytes(manifest_data(map_content, candidate_content, review_contents)),
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
        raise SystemExit("Stale Office semantic-grid v6 outputs: " + ", ".join(stale))
    action = "verified" if check else "built"
    print(
        f"Office semantic-grid v6 {action}: isolated V8 owner-review candidate; "
        "D4:L9 left whiteboard, native slat pillars, and Office herringbone SPC."
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    write_or_check(build_outputs(), args.check)


if __name__ == "__main__":
    main()
