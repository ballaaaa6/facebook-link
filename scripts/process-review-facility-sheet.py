"""Extract and validate the four-seat modern review facility slice.

The keyed 4x4 source sheet is split into runtime library assets, then composed
with the existing modern chair and Einstein seated rows in an isolated QA board.
Nothing produced here is imported by the active Office page.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = (
    ROOT
    / "assets"
    / "art"
    / "layout-references"
    / "review-facility-completion-sheet-modern-bright-v1-source.png"
)
KEYED_SOURCE = (
    ROOT
    / "assets"
    / "game"
    / "processed"
    / "review-facility-completion-v1"
    / "source-keyed.png"
)
OUTPUT_ROOT = KEYED_SOURCE.parent
MANIFEST_PATH = (
    ROOT / "assets" / "game" / "manifests" / "review-facility-completion.json"
)
QA_PATH = OUTPUT_ROOT / "qa" / "review-table-four-seat-lab.png"

FRAME = (96, 104)
TILE = 32
CELL_IDS = [
    "table.review.long.modern",
    "cabinet.printer.modern",
    "hub.table.power",
    "speaker.conference",
    "printer.neutral.a",
    "printer.neutral.b",
    "printer.neutral.c",
    "printer.neutral.d",
    "dispenser.water.neutral.a",
    "dispenser.water.neutral.b",
    "dispenser.water.neutral.c",
    "dispenser.water.neutral.d",
    "machine.coffee.neutral.a",
    "machine.coffee.neutral.b",
    "machine.coffee.neutral.c",
    "machine.coffee.neutral.d",
]

GEOMETRY = {
    "table.review.long.modern": {
        "physicalScale": {"width": 4, "depth": 1, "height": 1},
        "renderBox": {"width": 4, "height": 1},
        "footprint": {"width": 4, "depth": 1},
        "supports": ["floor"],
        "layer": "furniture",
    },
    "cabinet.printer.modern": {
        "physicalScale": {"width": 2, "depth": 1, "height": 2},
        "renderBox": {"width": 2, "height": 2},
        "footprint": {"width": 2, "depth": 1},
        "supports": ["floor"],
        "layer": "furniture",
    },
    "hub.table.power": {
        "physicalScale": {"width": 1, "depth": 0, "height": 1},
        "renderBox": {"width": 1, "height": 1},
        "footprint": {"width": 0, "depth": 0},
        "supports": ["table-surface"],
        "layer": "equipment",
    },
    "speaker.conference": {
        "physicalScale": {"width": 1, "depth": 0, "height": 1},
        "renderBox": {"width": 1, "height": 1},
        "footprint": {"width": 0, "depth": 0},
        "supports": ["table-surface"],
        "layer": "equipment",
    },
}

SEATS = [
    {
        "id": "review.rear-left",
        "side": "rear",
        "x": 1,
        "y": -2,
        "action": "working-front-seated",
        "approach": {"x": 1, "y": -3},
    },
    {
        "id": "review.rear-right",
        "side": "rear",
        "x": 3,
        "y": -2,
        "action": "working-front-seated",
        "approach": {"x": 3, "y": -3},
    },
    {
        "id": "review.front-left",
        "side": "front",
        "x": 1,
        "y": 2,
        "action": "working-back-seated",
        "approach": {"x": 1, "y": 3},
    },
    {
        "id": "review.front-right",
        "side": "front",
        "x": 3,
        "y": 2,
        "action": "working-back-seated",
        "approach": {"x": 3, "y": 3},
    },
]


def extract_cells() -> list[dict[str, object]]:
    source = Image.open(KEYED_SOURCE).convert("RGBA")
    records: list[dict[str, object]] = []
    for index, asset_id in enumerate(CELL_IDS):
        row, column = divmod(index, 4)
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
        if asset_id in GEOMETRY:
            record.update(GEOMETRY[asset_id])
        else:
            prefix, frame = asset_id.rsplit(".", 1)
            record.update(
                {
                    "animationGroup": prefix,
                    "frame": frame,
                    "itemNeutral": True,
                    "renderBox": (
                        {"width": 2, "height": 1}
                        if prefix == "printer.neutral"
                        else {"width": 1, "height": 3}
                    ),
                }
            )
        records.append(record)
    return records


def derive_chair_back_mask() -> Path:
    source_path = (
        ROOT
        / "assets"
        / "game"
        / "processed"
        / "office-library-modern-bright-v1"
        / "chair-office-modern-v1"
        / "chair.office.modern.back.png"
    )
    source = Image.open(source_path).convert("RGBA")
    region = Image.new("L", source.size, 0)
    draw = ImageDraw.Draw(region)
    width, height = source.size
    for normalized in (
        (0.00, 0.36, 0.20, 0.68),
        (0.80, 0.36, 1.00, 0.68),
        (0.06, 0.50, 0.94, 0.66),
        (0.00, 0.66, 1.00, 1.00),
    ):
        left, top, right, bottom = normalized
        draw.rectangle(
            (
                round(left * width),
                round(top * height),
                round(right * width),
                round(bottom * height),
            ),
            fill=255,
        )
    mask = Image.new("RGBA", source.size, (0, 0, 0, 0))
    mask.paste(source, (0, 0), ImageChops.multiply(source.getchannel("A"), region))
    path = OUTPUT_ROOT / "chair.office.modern.back.foreground.png"
    mask.save(path)
    return path


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
    rear_centers = [(table_xy[0] + TILE, table_xy[1] - 40), (table_xy[0] + TILE * 3, table_xy[1] - 40)]
    front_centers = [(table_xy[0] + TILE, table_xy[1] + 80), (table_xy[0] + TILE * 3, table_xy[1] + 80)]

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
    table = table.resize((TILE * 4, TILE), Image.Resampling.NEAREST)

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
    if not SOURCE.exists() or not KEYED_SOURCE.exists():
        raise FileNotFoundError("Generate the source and chroma-key it before extraction.")
    records = extract_cells()
    chair_back_mask = derive_chair_back_mask()
    cases = build_review_lab(chair_back_mask)
    manifest = {
        "version": 1,
        "status": "isolated-staging",
        "activeOfficeImported": False,
        "source": str(SOURCE.relative_to(ROOT)).replace("\\", "/"),
        "keyedSource": str(KEYED_SOURCE.relative_to(ROOT)).replace("\\", "/"),
        "grid": [4, 4],
        "assetCount": len(records),
        "assets": records,
        "reviewFacility": {
            "id": "review-table-modern-four-seat",
            "objectCount": 1,
            "reservationCapacity": 4,
            "tableRenderBox": {"width": 4, "height": 1},
            "facilityFootprint": {"width": 4, "depth": 5},
            "navigationClearance": {"width": 4, "depth": 7},
            "seats": SEATS,
            "chairBackMask": str(chair_back_mask.relative_to(ROOT)).replace("\\", "/"),
        },
        "qa": {
            "board": str(QA_PATH.relative_to(ROOT)).replace("\\", "/"),
            "cases": cases,
            "allFourActors": cases[-1]["actors"] == 4,
        },
    }
    MANIFEST_PATH.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {MANIFEST_PATH.relative_to(ROOT)}")
    print("assets: 16/16; review seats: 4/4")


if __name__ == "__main__":
    main()
