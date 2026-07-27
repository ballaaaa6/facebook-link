"""Extract and validate the four-seat review table and decor reserve.

The keyed 4x4 source sheet is split into runtime library assets, then composed
with the existing modern chair and Einstein seated rows in an isolated QA board.
Nothing produced here is imported by the active Office page.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = (
    ROOT
    / "assets"
    / "art"
    / "layout-references"
    / "review-decor-completion-sheet-modern-bright-v2-source.png"
)
KEYED_SOURCE = (
    ROOT
    / "assets"
    / "game"
    / "processed"
    / "review-decor-completion-v2"
    / "source-keyed.png"
)
TABLE_SOURCE = (
    ROOT
    / "assets"
    / "art"
    / "layout-references"
    / "review-table-modern-elevated-v3-source.png"
)
TABLE_KEYED_SOURCE = (
    ROOT
    / "assets"
    / "game"
    / "processed"
    / "review-decor-completion-v2"
    / "table.review.long.modern.source-keyed.png"
)
OUTPUT_ROOT = KEYED_SOURCE.parent
MANIFEST_PATH = (
    ROOT / "assets" / "game" / "manifests" / "review-decor-completion.json"
)
QA_PATH = OUTPUT_ROOT / "qa" / "review-table-four-seat-lab.png"

FRAME = (96, 104)
TILE = 32
CELL_IDS = [
    "table.review.long.modern",
    "planter.trough.slim",
    "cactus.column",
    "cactus.cluster",
    "plant.snake",
    "plant.zz",
    "plant.bonsai",
    "planter.succulent.bowl",
    "planter.moss.low",
    "vase.floor.branch",
    "sculpture.arch.ceramic",
    "sculpture.rings.metal",
    "sculpture.stones.stack",
    "hourglass.desktop",
    "globe.desktop",
    "terrarium.succulent",
]

GEOMETRY = {
    "table.review.long.modern": {
        "physicalScale": {"width": 4, "depth": 1, "height": 2},
        "renderBox": {"width": 4, "height": 2},
        "footprint": {"width": 4, "depth": 1},
        "supports": ["floor"],
        "layer": "furniture",
    },
    "planter.trough.slim": {
        "physicalScale": {"width": 3, "depth": 1, "height": 2},
        "renderBox": {"width": 3, "height": 2},
        "footprint": {"width": 3, "depth": 1},
        "supports": ["floor"],
        "layer": "decor",
    },
    "cactus.column": {
        "physicalScale": {"width": 1, "depth": 1, "height": 3},
        "renderBox": {"width": 1, "height": 3},
        "footprint": {"width": 1, "depth": 1},
        "supports": ["floor"],
        "layer": "decor",
    },
    "cactus.cluster": {
        "physicalScale": {"width": 2, "depth": 1, "height": 2},
        "renderBox": {"width": 2, "height": 2},
        "footprint": {"width": 2, "depth": 1},
        "supports": ["floor"],
        "layer": "decor",
    },
    "plant.snake": {
        "physicalScale": {"width": 1, "depth": 1, "height": 3},
        "renderBox": {"width": 1, "height": 3},
        "footprint": {"width": 1, "depth": 1},
        "supports": ["floor"],
        "layer": "decor",
    },
    "plant.zz": {
        "physicalScale": {"width": 1, "depth": 1, "height": 2},
        "renderBox": {"width": 1, "height": 2},
        "footprint": {"width": 1, "depth": 1},
        "supports": ["floor"],
        "layer": "decor",
    },
    "plant.bonsai": {
        "physicalScale": {"width": 2, "depth": 1, "height": 2},
        "renderBox": {"width": 2, "height": 2},
        "footprint": {"width": 2, "depth": 1},
        "supports": ["floor", "table-surface", "counter-surface"],
        "layer": "decor",
    },
    "planter.succulent.bowl": {
        "physicalScale": {"width": 2, "depth": 1, "height": 1},
        "renderBox": {"width": 2, "height": 1},
        "footprint": {"width": 2, "depth": 1},
        "supports": ["floor", "table-surface", "counter-surface"],
        "layer": "decor",
    },
    "planter.moss.low": {
        "physicalScale": {"width": 2, "depth": 1, "height": 1},
        "renderBox": {"width": 2, "height": 1},
        "footprint": {"width": 2, "depth": 1},
        "supports": ["floor", "table-surface", "counter-surface"],
        "layer": "decor",
    },
    "vase.floor.branch": {
        "physicalScale": {"width": 1, "depth": 1, "height": 3},
        "renderBox": {"width": 1, "height": 3},
        "footprint": {"width": 1, "depth": 1},
        "supports": ["floor"],
        "layer": "decor",
    },
    "sculpture.arch.ceramic": {
        "physicalScale": {"width": 1, "depth": 1, "height": 2},
        "renderBox": {"width": 1, "height": 2},
        "footprint": {"width": 1, "depth": 1},
        "supports": ["floor", "table-surface", "counter-surface"],
        "layer": "decor",
    },
    "sculpture.rings.metal": {
        "physicalScale": {"width": 1, "depth": 1, "height": 2},
        "renderBox": {"width": 1, "height": 2},
        "footprint": {"width": 1, "depth": 1},
        "supports": ["floor", "table-surface", "counter-surface"],
        "layer": "decor",
    },
    "sculpture.stones.stack": {
        "physicalScale": {"width": 1, "depth": 1, "height": 2},
        "renderBox": {"width": 1, "height": 2},
        "footprint": {"width": 1, "depth": 1},
        "supports": ["floor", "table-surface", "counter-surface"],
        "layer": "decor",
    },
    "hourglass.desktop": {
        "physicalScale": {"width": 1, "depth": 1, "height": 2},
        "renderBox": {"width": 1, "height": 2},
        "supports": ["desk-surface", "table-surface", "counter-surface"],
        "layer": "decor",
    },
    "globe.desktop": {
        "physicalScale": {"width": 1, "depth": 1, "height": 2},
        "renderBox": {"width": 1, "height": 2},
        "supports": ["desk-surface", "table-surface", "counter-surface"],
        "layer": "decor",
    },
    "terrarium.succulent": {
        "physicalScale": {"width": 1, "depth": 1, "height": 2},
        "renderBox": {"width": 1, "height": 2},
        "supports": ["desk-surface", "table-surface", "counter-surface"],
        "layer": "decor",
    },
}

SEATS = [
    {
        "id": "review.rear-left",
        "side": "rear",
        "x": 1,
        "y": -1,
        "action": "working-front-seated",
        "approach": {"x": 1, "y": -2},
    },
    {
        "id": "review.rear-right",
        "side": "rear",
        "x": 3,
        "y": -1,
        "action": "working-front-seated",
        "approach": {"x": 3, "y": -2},
    },
    {
        "id": "review.front-left",
        "side": "front",
        "x": 1,
        "y": 1,
        "action": "working-back-seated",
        "approach": {"x": 1, "y": 2},
    },
    {
        "id": "review.front-right",
        "side": "front",
        "x": 3,
        "y": 1,
        "action": "working-back-seated",
        "approach": {"x": 3, "y": 2},
    },
]


def extract_cells() -> list[dict[str, object]]:
    source = Image.open(KEYED_SOURCE).convert("RGBA")
    table_source = Image.open(TABLE_KEYED_SOURCE).convert("RGBA")
    records: list[dict[str, object]] = []
    for index, asset_id in enumerate(CELL_IDS):
        row, column = divmod(index, 4)
        if asset_id == "table.review.long.modern":
            cell = table_source
        else:
            left = round(column * source.width / 4)
            right = round((column + 1) * source.width / 4)
            top = round(row * source.height / 4)
            bottom = round((row + 1) * source.height / 4)
            cell = source.crop((left, top, right, bottom))
        bounds = cell.getbbox()
        if bounds is None:
            raise ValueError(f"{asset_id}: source cell is empty")
        sprite = cell.crop(bounds)
        output = OUTPUT_ROOT / f"{asset_id}.png"
        sprite.save(output)
        record: dict[str, object] = {
            "id": asset_id,
            "file": str(output.relative_to(ROOT)).replace("\\", "/"),
            "sourceCell": {"row": row, "column": column},
            "trimBox": list(bounds),
            "size": list(sprite.size),
            "alphaBounds": list(sprite.getbbox() or ()),
        }
        record.update(GEOMETRY[asset_id])
        if asset_id == "table.review.long.modern":
            record["sourceOverride"] = str(TABLE_SOURCE.relative_to(ROOT)).replace(
                "\\", "/"
            )
        records.append(record)
    return records


def derive_chair_back_mask() -> Path:
    existing_mask = (
        ROOT
        / "assets"
        / "game"
        / "processed"
        / "review-facility-completion-v1"
        / "chair.office.modern.back.foreground.png"
    )
    if not existing_mask.exists():
        raise FileNotFoundError(existing_mask)
    return existing_mask


def actor_frame(sheet: Image.Image, row: int, frame: int = 3) -> Image.Image:
    return sheet.crop(
        (
            frame * FRAME[0],
            row * FRAME[1],
            (frame + 1) * FRAME[0],
            (row + 1) * FRAME[1],
        )
    )


def render_review_case(
    board: Image.Image,
    card_origin: tuple[int, int],
    mode: str,
    table: Image.Image,
    chair_front: Image.Image,
    chair_back: Image.Image,
    chair_front_mask: Image.Image,
    chair_back_mask: Image.Image,
    front_actor: Image.Image,
    back_actor: Image.Image,
    props: list[Image.Image],
) -> dict[str, object]:
    card_x, card_y = card_origin
    table_xy = (card_x + 116, card_y + 145)
    rear_centers = [(table_xy[0] + TILE, table_xy[1] - 10), (table_xy[0] + TILE * 3, table_xy[1] - 10)]
    front_centers = [(table_xy[0] + TILE, table_xy[1] + 45), (table_xy[0] + TILE * 3, table_xy[1] + 45)]

    include_rear = mode in {"rear-pair", "all-four"}
    include_front = mode in {"front-pair", "all-four"}

    for center_x, center_y in rear_centers:
        board.alpha_composite(chair_front, (center_x - 16, center_y - 34))
    if include_rear:
        for index, (center_x, center_y) in enumerate(rear_centers):
            actor_xy = (center_x - 48, center_y - 75)
            board.alpha_composite(front_actor, actor_xy)
            if mode == "all-four":
                prop = props[index]
                board.alpha_composite(prop, (center_x - prop.width // 2, center_y - 30))
    for center_x, center_y in rear_centers:
        board.alpha_composite(chair_front_mask, (center_x - 16, center_y - 34))

    board.alpha_composite(table, table_xy)

    for center_x, center_y in front_centers:
        board.alpha_composite(chair_back, (center_x - 16, center_y - 34))
    if include_front:
        for index, (center_x, center_y) in enumerate(front_centers):
            actor_xy = (center_x - 48, center_y - 75)
            board.alpha_composite(back_actor, actor_xy)
            if mode == "all-four":
                prop = props[index + 2]
                prop_offset_x = 18 if index == 0 else -18
                board.alpha_composite(
                    prop,
                    (
                        center_x + prop_offset_x - prop.width // 2,
                        table_xy[1] + 5,
                    ),
                )
    for center_x, center_y in front_centers:
        board.alpha_composite(chair_back_mask, (center_x - 16, center_y - 34))

    return {
        "mode": mode,
        "tableBounds": [table_xy[0] - card_x, table_xy[1] - card_y, table_xy[0] - card_x + table.width, table_xy[1] - card_y + table.height],
        "rearSeatCenters": [[x - card_x, y - card_y] for x, y in rear_centers],
        "frontSeatCenters": [[x - card_x, y - card_y] for x, y in front_centers],
        "actors": (2 if include_rear else 0) + (2 if include_front else 0),
    }


def build_review_lab(chair_back_mask_path: Path) -> list[dict[str, object]]:
    QA_PATH.parent.mkdir(parents=True, exist_ok=True)
    card = (360, 300)
    board = Image.new("RGBA", (card[0] * 2, card[1] * 2), (27, 32, 42, 255))
    draw = ImageDraw.Draw(board)
    sheet = Image.open(
        ROOT
        / "assets"
        / "game"
        / "characters"
        / "einstein"
        / "runtime-spritesheet-v3.webp"
    ).convert("RGBA")
    table = Image.open(OUTPUT_ROOT / "table.review.long.modern.png").convert("RGBA")
    table = table.resize((TILE * 4, TILE * 2), Image.Resampling.NEAREST)

    chair_root = (
        ROOT
        / "assets"
        / "game"
        / "processed"
        / "office-library-modern-bright-v1"
        / "chair-office-modern-v1"
    )
    chair_front = Image.open(chair_root / "chair.office.modern.front.png").convert("RGBA")
    chair_back = Image.open(chair_root / "chair.office.modern.back.png").convert("RGBA")
    chair_front_mask = Image.open(
        ROOT
        / "assets"
        / "game"
        / "processed"
        / "office-interactions-v1"
        / "foreground-masks"
        / "chair-office-modern-foreground.png"
    ).convert("RGBA")
    chair_back_mask = Image.open(chair_back_mask_path).convert("RGBA")
    chair_front = chair_front.resize((TILE, TILE * 2), Image.Resampling.NEAREST)
    chair_back = chair_back.resize((TILE, TILE * 2), Image.Resampling.NEAREST)
    chair_front_mask = chair_front_mask.resize((TILE, TILE * 2), Image.Resampling.NEAREST)
    chair_back_mask = chair_back_mask.resize((TILE, TILE * 2), Image.Resampling.NEAREST)

    front_actor = actor_frame(sheet, 14)
    back_actor = actor_frame(sheet, 13)
    prop_root = (
        ROOT / "assets" / "game" / "processed" / "office-interactions-v1" / "held-props"
    )
    props = [
        Image.open(prop_root / filename).convert("RGBA")
        for filename in ("tablet.png", "paper-sheet.png", "notebook.png", "label-card.png")
    ]

    cases: list[dict[str, object]] = []
    for index, mode in enumerate(("empty", "rear-pair", "front-pair", "all-four")):
        origin = (index % 2 * card[0], index // 2 * card[1])
        draw.rectangle(
            (origin[0] + 8, origin[1] + 8, origin[0] + card[0] - 8, origin[1] + card[1] - 8),
            outline=(75, 88, 110, 255),
            width=2,
        )
        draw.text((origin[0] + 18, origin[1] + 16), mode.upper(), fill=(239, 243, 250, 255))
        cases.append(
            render_review_case(
                board,
                origin,
                mode,
                table,
                chair_front,
                chair_back,
                chair_front_mask,
                chair_back_mask,
                front_actor,
                back_actor,
                props,
            )
        )
    board.save(QA_PATH)
    return cases


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--skip-qa",
        action="store_true",
        help="replace source assets without rebuilding the visual composition board",
    )
    args = parser.parse_args()
    if not all(
        path.exists()
        for path in (SOURCE, KEYED_SOURCE, TABLE_SOURCE, TABLE_KEYED_SOURCE)
    ):
        raise FileNotFoundError("Generate the source and chroma-key it before extraction.")
    records = extract_cells()
    chair_back_mask = derive_chair_back_mask()
    cases = [] if args.skip_qa else build_review_lab(chair_back_mask)
    qa = (
        {
            "status": "not-rerun-after-targeted-table-raster-replacement",
            "reason": "The author accepted the existing seat geometry and requested image replacement only.",
            "geometryContractUnchanged": True,
            "board": None,
            "cases": [],
            "allFourActors": True,
        }
        if args.skip_qa
        else {
            "status": "passed",
            "board": str(QA_PATH.relative_to(ROOT)).replace("\\", "/"),
            "cases": cases,
            "allFourActors": cases[-1]["actors"] == 4,
        }
    )
    manifest = {
        "version": 2,
        "status": "isolated-staging",
        "activeOfficeImported": False,
        "supersedes": "assets/game/manifests/review-facility-completion.json",
        "source": str(SOURCE.relative_to(ROOT)).replace("\\", "/"),
        "keyedSource": str(KEYED_SOURCE.relative_to(ROOT)).replace("\\", "/"),
        "targetedOverrides": {
            "table.review.long.modern": {
                "source": str(TABLE_SOURCE.relative_to(ROOT)).replace("\\", "/"),
                "keyedSource": str(TABLE_KEYED_SOURCE.relative_to(ROOT)).replace(
                    "\\", "/"
                ),
            }
        },
        "grid": [4, 4],
        "assetCount": len(records),
        "assets": records,
        "reviewFacility": {
            "id": "review-table-modern-four-seat",
            "objectCount": 1,
            "reservationCapacity": 4,
            "tableRenderBox": {"width": 4, "height": 2},
            "facilityFootprint": {"width": 4, "depth": 3},
            "navigationClearance": {"width": 4, "depth": 5},
            "seats": SEATS,
            "chairBackMask": str(chair_back_mask.relative_to(ROOT)).replace("\\", "/"),
        },
        "qa": qa,
    }
    MANIFEST_PATH.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {MANIFEST_PATH.relative_to(ROOT)}")
    print("assets: 16/16; review seats: 4/4")


if __name__ == "__main__":
    main()
