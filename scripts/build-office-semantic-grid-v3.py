#!/usr/bin/env python3
"""Align the three Office pillar rasters to their semantic-grid cells."""

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
V2_BUILDER_PATH = ROOT / "scripts/build-office-semantic-grid-v2.py"
SOURCE_PATH = ROOT / "assets/art/backgrounds/office-c-background-modern-v4-candidate.png"
CANDIDATE_PATH = ROOT / "assets/art/backgrounds/office-c-background-modern-v5-pillar-aligned-candidate.png"
V2_MAP_PATH = ROOT / "assets/game/maps/office-semantic-grid-v2.json"
MAP_PATH = ROOT / "assets/game/maps/office-semantic-grid-v3.json"
MANIFEST_PATH = ROOT / "assets/game/manifests/office-semantic-grid-v3.json"
ACTIVE_MAP_PATH = ROOT / "assets/game/maps/office-c-v2.json"
REVIEW_DIR = ROOT / "assets/art/layout-references/office-semantic-grid-v3"
GRID_PATH = REVIEW_DIR / "01-pillar-aligned-grid.png"
COMPARISON_PATH = REVIEW_DIR / "02-before-after.png"

PILLARS = [
    {
        "id": "pillar-left",
        "range": "A1-B11",
        "sourcePixels": [0, 0, 84, 442],
        "targetPixels": [0, 0, 78, 431],
        "releasedHorizontalPixels": [78, 0, 84, 431],
    },
    {
        "id": "pillar-center",
        "range": "AB1-AD11",
        "sourcePixels": [1065, 0, 1146, 442],
        "targetPixels": [1050, 0, 1167, 431],
        "releasedHorizontalPixels": None,
    },
    {
        "id": "pillar-right",
        "range": "AP1-AQ11",
        "sourcePixels": [1585, 0, 1672, 442],
        "targetPixels": [1594, 0, 1672, 431],
        "releasedHorizontalPixels": [1585, 0, 1594, 431],
    },
]


def load_v2_builder():
    spec = importlib.util.spec_from_file_location("office_semantic_grid_v2_builder", V2_BUILDER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {V2_BUILDER_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


V2 = load_v2_builder()
WIDTH = V2.WIDTH
HEIGHT = V2.HEIGHT


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


def paste_resized(
    image: Image.Image,
    source: Image.Image,
    source_box: tuple[int, int, int, int],
    target_box: tuple[int, int, int, int],
) -> None:
    width = target_box[2] - target_box[0]
    height = target_box[3] - target_box[1]
    patch = source.crop(source_box).resize((width, height), Image.Resampling.LANCZOS)
    image.paste(patch, target_box[:2])


def repair_released_pixels(candidate: Image.Image, source: Image.Image) -> None:
    paste_resized(candidate, source, (84, 0, 90, 431), (78, 0, 84, 431))
    paste_resized(candidate, source, (0, 442, 84, 453), (0, 431, 84, 442))

    paste_resized(candidate, source, (1050, 442, 1167, 453), (1050, 431, 1167, 442))

    paste_resized(candidate, source, (1576, 0, 1585, 431), (1585, 0, 1594, 431))
    paste_resized(candidate, source, (1585, 442, 1672, 453), (1585, 431, 1672, 442))


def build_candidate() -> Image.Image:
    source = Image.open(SOURCE_PATH).convert("RGB")
    if source.size != (WIDTH, HEIGHT):
        raise RuntimeError(f"Unexpected source size: {source.size}")
    candidate = source.copy()
    repair_released_pixels(candidate, source)
    for pillar in PILLARS:
        paste_resized(
            candidate,
            source,
            tuple(pillar["sourcePixels"]),
            tuple(pillar["targetPixels"]),
        )
    return candidate


def validate_target_geometry() -> None:
    for pillar in PILLARS:
        grid_box = V2.cell_box(pillar["range"])
        expected = [grid_box[0], grid_box[1], grid_box[2] + 1, grid_box[3] + 1]
        if pillar["targetPixels"] != expected:
            raise RuntimeError(
                f"{pillar['id']} target {pillar['targetPixels']} does not match "
                f"semantic range {pillar['range']} at {expected}"
            )


def render_grid(candidate: Image.Image) -> Image.Image:
    overlay = Image.new("RGBA", candidate.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    for pillar in PILLARS:
        color = V2.COLORS[pillar["id"]]
        box = V2.cell_box(pillar["range"])
        draw.rectangle(box, fill=(*color, 48), outline=(*color, 255), width=7)
    gridded = V2.draw_grid(Image.alpha_composite(candidate.convert("RGBA"), overlay))
    return V2.add_legend(
        gridded,
        "OFFICE SEMANTIC GRID V3 - ALL THREE PILLAR RASTERS ALIGNED TO THEIR CELL RANGES",
    )


def render_comparison(source: Image.Image, candidate: Image.Image) -> Image.Image:
    preview_size = (836, 471)
    board = Image.new("RGB", (WIDTH, 521), (9, 15, 27))
    board.paste(source.resize(preview_size, Image.Resampling.LANCZOS), (0, 50))
    board.paste(candidate.resize(preview_size, Image.Resampling.LANCZOS), (836, 50))
    draw = ImageDraw.Draw(board)
    draw.text((20, 13), "BEFORE - V4 PILLARS OFF GRID", font=V2.font(20), fill=(255, 255, 255))
    draw.text((856, 13), "AFTER - V5 PILLARS GRID-ALIGNED", font=V2.font(20), fill=(255, 255, 255))
    draw.line((836, 0, 836, 521), fill=(34, 211, 238), width=3)
    return board


def map_data(candidate_content: bytes) -> dict[str, Any]:
    v2_map = json.loads(V2_MAP_PATH.read_text(encoding="utf-8"))
    return {
        "schemaVersion": 1,
        "id": "office-semantic-grid-v3",
        "status": "owner-review",
        "supersedes": "office-semantic-grid-v2",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "sourceBackground": {
            "file": repo_path(SOURCE_PATH),
            "sha256": sha256(SOURCE_PATH),
            "mustRemainByteIdentical": True,
        },
        "candidateBackground": {
            "file": repo_path(CANDIDATE_PATH),
            "sha256": sha256_bytes(candidate_content),
            "pixels": [WIDTH, HEIGHT],
        },
        "activeOfficeBaseline": {
            "file": repo_path(ACTIVE_MAP_PATH),
            "sha256": sha256(ACTIVE_MAP_PATH),
            "mustRemainByteIdentical": True,
        },
        "grid": v2_map["grid"],
        "zones": v2_map["zones"],
        "cellAssignments": v2_map["cellAssignments"],
        "inheritedPhysicalEdits": {
            "source": {"file": repo_path(V2_MAP_PATH), "sha256": sha256(V2_MAP_PATH)},
            "window": v2_map["physicalEdits"]["window"],
            "floor": v2_map["physicalEdits"]["floor"],
        },
        "pillarAlignments": [
            {
                **pillar,
                "targetWidth": pillar["targetPixels"][2] - pillar["targetPixels"][0],
                "targetHeight": pillar["targetPixels"][3] - pillar["targetPixels"][1],
            }
            for pillar in PILLARS
        ],
        "rules": {
            "allCellsClassified": True,
            "pillarArtMatchesSemanticRanges": True,
            "pillarPixelsEndBeforeRow12": True,
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
        "id": "office.semantic-grid.v3",
        "status": "owner-review",
        "updatedOn": "2026-07-29",
        "supersedes": "office.semantic-grid.v2",
        "map": {"file": repo_path(MAP_PATH), "sha256": sha256_bytes(map_content)},
        "candidateBackground": {
            "file": repo_path(CANDIDATE_PATH),
            "sha256": sha256_bytes(candidate_content),
        },
        "reviewOutputs": [
            {"file": repo_path(path), "sha256": sha256_bytes(content)}
            for path, content in review_contents.items()
        ],
        "permissions": {
            "isolatedBackgroundCandidate": True,
            "pillarAlignmentReview": True,
            "activeOfficePromotion": False,
            "newCharacterOrFurniture": False,
        },
        "activeOfficeBaseline": {
            "file": repo_path(ACTIVE_MAP_PATH),
            "sha256": sha256(ACTIVE_MAP_PATH),
            "mustRemainByteIdentical": True,
        },
    }


def build_outputs() -> dict[Path, bytes]:
    validate_target_geometry()
    source = Image.open(SOURCE_PATH).convert("RGB")
    candidate = build_candidate()
    candidate_content = png_bytes(candidate)
    review_contents = {
        GRID_PATH: png_bytes(render_grid(candidate)),
        COMPARISON_PATH: png_bytes(render_comparison(source, candidate)),
    }
    map_content = json_bytes(map_data(candidate_content))
    return {
        CANDIDATE_PATH: candidate_content,
        MAP_PATH: map_content,
        **review_contents,
        MANIFEST_PATH: json_bytes(
            manifest_data(map_content, candidate_content, review_contents)
        ),
    }


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
        raise SystemExit("Stale Office semantic-grid v3 outputs: " + ", ".join(stale))
    action = "verified" if check else "built"
    print(
        f"Office semantic-grid v3 {action}: A1:B11, AB1:AD11, and "
        "AP1:AQ11 pillar rasters aligned; Active Office unchanged."
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    write_or_check(build_outputs(), args.check)


if __name__ == "__main__":
    main()
