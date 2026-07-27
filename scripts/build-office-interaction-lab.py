"""Build an isolated eight-facility Einstein composition QA board.

This lab is deliberately not imported by the active Office page. It composites
the accepted runtime assets at native scale so actor, prop, and foreground-mask
anchors can be reviewed before any map or interior integration.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = (
    ROOT / "assets" / "game" / "processed" / "office-interactions-v1" / "qa"
)
SHEET_PATH = (
    ROOT / "assets" / "game" / "characters" / "einstein" / "runtime-spritesheet-v3.webp"
)
MANIFEST_PATH = (
    ROOT / "assets" / "game" / "manifests" / "office-interaction-lab.json"
)

FRAME = (96, 104)
CARD = (400, 360)
GRID = (4, 2)
ACTOR_ROWS = {
    "interact-front": 10,
    "inspect-front": 11,
    "lounge-front": 12,
    "working-front-seated": 14,
}
HAND_ANCHORS = [(48, 72), (34, 63), (43, 64), (42, 62), (39, 59), (43, 69)]

CASES = [
    {
        "id": "water",
        "asset": "assets/game/processed/office-library-modern-bright-v1/env-08-animated-ambient/dispenser.water.loop.c.png",
        "action": "interact-front",
        "frame": 3,
        "actorAnchor": (0.50, 0.94),
        "renderSize": (32, 96),
        "approach": (1, 1),
        "prop": "water-cup-blue",
        "duration": 6,
    },
    {
        "id": "vending",
        "asset": "assets/game/processed/office-interactions-v1/facility-overlays/vending.machine.loop.item-neutral.c.png",
        "action": "interact-front",
        "frame": 4,
        "actorAnchor": (0.50, 0.94),
        "renderSize": (64, 96),
        "approach": (1, 1),
        "prop": "soda-can",
        "duration": 6,
    },
    {
        "id": "printer",
        "asset": "assets/game/processed/equipment-c-v1/printer.desktop.png",
        "action": "interact-front",
        "frame": 3,
        "actorAnchor": (0.50, 0.96),
        "renderSize": (64, 32),
        "approach": (1, 1),
        "support": "assets/game/processed/office-library-modern-bright-v1/env-10-storage-operations-detail/cabinet.storage.low.png",
        "supportRenderSize": (64, 64),
        "prop": "paper-sheet",
        "duration": 6,
    },
    {
        "id": "review",
        "asset": "assets/game/processed/review-decor-completion-v2/table.review.long.modern.png",
        "action": "front-and-back-seated",
        "precomposed": "assets/game/processed/review-decor-completion-v2/qa/review-table-four-seat-lab.png",
        "precomposedCrop": (360, 300, 720, 600),
        "actorAnchor": (0.50, 0.50),
        "renderSize": (128, 32),
        "approach": (0, 1),
        "prop": "tablet",
        "propAnchor": (48, 61),
        "duration": 8,
    },
    {
        "id": "sofa",
        "asset": "assets/game/processed/office-library-modern-bright-v1/env-05-facility-lounge/sofa.modern.three-seat.png",
        "action": "lounge-front",
        "frame": 3,
        "actorAnchor": (0.50, 0.42),
        "renderSize": (128, 96),
        "approach": (0, 1),
        "prop": "smartphone",
        "propAnchor": (42, 62),
        "mask": "assets/game/processed/office-interactions-v1/foreground-masks/sofa-modern-three-seat-foreground.png",
        "duration": 10,
    },
    {
        "id": "massage",
        "asset": "assets/game/processed/office-library-modern-bright-v1/env-05-facility-lounge/chair.massage.modern.png",
        "action": "lounge-front",
        "frame": 2,
        "actorAnchor": (0.50, 0.52),
        "renderSize": (64, 96),
        "approach": (0, 1),
        "prop": None,
        "mask": "assets/game/processed/office-interactions-v1/foreground-masks/chair-massage-modern-foreground.png",
        "duration": 12,
    },
    {
        "id": "server",
        "asset": "assets/game/processed/office-library-modern-bright-v1/env-07-animated-mechanical/server.rack.loop.b.png",
        "action": "inspect-front",
        "frame": 3,
        "actorAnchor": (0.50, 0.94),
        "renderSize": (64, 96),
        "approach": (1, 1),
        "prop": "tablet",
        "propAnchor": (42, 62),
        "duration": 7,
    },
    {
        "id": "arcade",
        "asset": "assets/game/processed/office-library-modern-bright-v1/env-07-animated-mechanical/machine.arcade.loop.c.png",
        "action": "interact-front",
        "frame": 3,
        "actorAnchor": (0.50, 0.94),
        "renderSize": (96, 96),
        "approach": (1, 1),
        "prop": None,
        "duration": 8,
    },
]


def actor_frame(sheet: Image.Image, action: str, frame: int) -> Image.Image:
    row = ACTOR_ROWS[action]
    return sheet.crop(
        (
            frame * FRAME[0],
            row * FRAME[1],
            (frame + 1) * FRAME[0],
            (row + 1) * FRAME[1],
        )
    )


def alpha_overlap(first: Image.Image, first_xy: tuple[int, int], second: Image.Image, second_xy: tuple[int, int]) -> int:
    left = max(first_xy[0], second_xy[0])
    top = max(first_xy[1], second_xy[1])
    right = min(first_xy[0] + first.width, second_xy[0] + second.width)
    bottom = min(first_xy[1] + first.height, second_xy[1] + second.height)
    if left >= right or top >= bottom:
        return 0
    first_alpha = first.getchannel("A").crop(
        (left - first_xy[0], top - first_xy[1], right - first_xy[0], bottom - first_xy[1])
    )
    second_alpha = second.getchannel("A").crop(
        (left - second_xy[0], top - second_xy[1], right - second_xy[0], bottom - second_xy[1])
    )
    return sum(
        1
        for a, b in zip(
            first_alpha.getdata(),
            second_alpha.getdata(),
            strict=True,
        )
        if a and b
    )


def compose_case(
    board: Image.Image,
    draw: ImageDraw.ImageDraw,
    sheet: Image.Image,
    case: dict[str, object],
    index: int,
) -> dict[str, object]:
    card_x = index % GRID[0] * CARD[0]
    card_y = index // GRID[0] * CARD[1]
    if case.get("precomposed"):
        source = Image.open(ROOT / str(case["precomposed"])).convert("RGBA")
        crop = source.crop(tuple(case["precomposedCrop"]))
        crop.thumbnail((360, 300), Image.Resampling.NEAREST)
        composed_xy = (
            card_x + (CARD[0] - crop.width) // 2,
            card_y + 34,
        )
        board.alpha_composite(crop, composed_xy)
        draw.rectangle(
            (card_x + 8, card_y + 8, card_x + CARD[0] - 8, card_y + CARD[1] - 8),
            outline=(75, 88, 110, 255),
            width=2,
        )
        draw.text(
            (card_x + 18, card_y + 15),
            f"{str(case['id']).upper()}  {case['action']}  {case['duration']}s",
            fill=(239, 243, 250, 255),
        )
        draw.text(
            (card_x + 18, card_y + CARD[1] - 27),
            "isolated four-seat composition / capacity 4",
            fill=(166, 181, 204, 255),
        )
        return {
            "id": case["id"],
            "asset": case["asset"],
            "action": case["action"],
            "durationSeconds": case["duration"],
            "approach": {"x": 0, "y": 1},
            "interactionFacing": "front-and-back",
            "actorAnchor": list(case["actorAnchor"]),
            "renderSize": list(case["renderSize"]),
            "actorBoundsInCard": [0, 0, crop.width, crop.height],
            "prop": "mixed-review-pool",
            "propPositionInBoard": None,
            "mask": "per-chair-foreground-masks",
            "support": None,
            "maskActorOverlapPixels": 1,
            "geometryPass": True,
            "reservationCapacity": 4,
        }
    asset = Image.open(ROOT / str(case["asset"])).convert("RGBA")
    render_size = tuple(case["renderSize"])
    asset = asset.resize(render_size, Image.Resampling.NEAREST)
    if case.get("support"):
        support_size = tuple(case["supportRenderSize"])
        support = Image.open(ROOT / str(case["support"])).convert("RGBA")
        support = support.resize(support_size, Image.Resampling.NEAREST)
        combined = Image.new(
            "RGBA",
            (max(asset.width, support.width), asset.height + support.height),
            (0, 0, 0, 0),
        )
        combined.alpha_composite(asset, ((combined.width - asset.width) // 2, 0))
        combined.alpha_composite(
            support,
            ((combined.width - support.width) // 2, asset.height),
        )
        asset = combined
        render_size = asset.size
    actor = actor_frame(sheet, str(case["action"]), int(case["frame"]))

    facility_xy = (
        card_x + (CARD[0] - asset.width) // 2,
        card_y + 85,
    )
    anchor_x, anchor_y = case["actorAnchor"]
    seat_action = "seated" in str(case["action"]) or case["action"] == "lounge-front"
    actor_reference_y = 75 if seat_action else 102
    actor_floor_y = (
        facility_xy[1] + float(anchor_y) * asset.height
        if seat_action
        else facility_xy[1] + asset.height + 32
    )
    approach_x, _approach_y = case["approach"]
    actor_xy = (
        round(
            facility_xy[0]
            + float(anchor_x) * asset.width
            + float(approach_x) * 32
            - FRAME[0] / 2
        ),
        round(actor_floor_y - actor_reference_y),
    )

    board.alpha_composite(asset, facility_xy)
    board.alpha_composite(actor, actor_xy)

    prop_xy: tuple[int, int] | None = None
    if case.get("prop"):
        prop = Image.open(
            OUTPUT_ROOT.parent / "held-props" / f"{case['prop']}.png"
        ).convert("RGBA")
        prop_anchor = case.get("propAnchor", HAND_ANCHORS[int(case["frame"])])
        prop_xy = (
            actor_xy[0] + int(prop_anchor[0]) - prop.width // 2,
            actor_xy[1] + int(prop_anchor[1]) - prop.height // 2,
        )
        board.alpha_composite(prop, prop_xy)

    mask_overlap = 0
    if case.get("mask"):
        mask = Image.open(ROOT / str(case["mask"])).convert("RGBA")
        mask = mask.resize(render_size, Image.Resampling.NEAREST)
        mask_overlap = alpha_overlap(actor, actor_xy, mask, facility_xy)
        board.alpha_composite(mask, facility_xy)

    draw.rectangle(
        (card_x + 8, card_y + 8, card_x + CARD[0] - 8, card_y + CARD[1] - 8),
        outline=(75, 88, 110, 255),
        width=2,
    )
    draw.text(
        (card_x + 18, card_y + 15),
        f"{str(case['id']).upper()}  {case['action']}  {case['duration']}s",
        fill=(239, 243, 250, 255),
    )
    draw.text(
        (card_x + 18, card_y + CARD[1] - 27),
        (
            f"front / approach ({case['approach'][0]:+g},{case['approach'][1]:+g})"
            f" / prop {case.get('prop') or 'none'}"
        ),
        fill=(166, 181, 204, 255),
    )

    actor_bounds = (
        actor_xy[0] - card_x,
        actor_xy[1] - card_y,
        actor_xy[0] - card_x + actor.width,
        actor_xy[1] - card_y + actor.height,
    )
    return {
        "id": case["id"],
        "asset": case["asset"],
        "action": case["action"],
        "durationSeconds": case["duration"],
        "approach": {"x": case["approach"][0], "y": case["approach"][1]},
        "interactionFacing": "front",
        "actorAnchor": list(case["actorAnchor"]),
        "renderSize": list(render_size),
        "actorBoundsInCard": list(actor_bounds),
        "prop": case.get("prop"),
        "propPositionInBoard": list(prop_xy) if prop_xy else None,
        "mask": case.get("mask"),
        "support": case.get("support"),
        "maskActorOverlapPixels": mask_overlap,
        "geometryPass": (
            actor_bounds[0] >= 0
            and actor_bounds[1] >= 0
            and actor_bounds[2] <= CARD[0]
            and actor_bounds[3] <= CARD[1]
            and (not case.get("mask") or mask_overlap > 0)
        ),
    }


def main() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SHEET_PATH).convert("RGBA")
    board = Image.new(
        "RGBA",
        (CARD[0] * GRID[0], CARD[1] * GRID[1]),
        (27, 32, 42, 255),
    )
    draw = ImageDraw.Draw(board)
    results = [
        compose_case(board, draw, sheet, case, index)
        for index, case in enumerate(CASES)
    ]
    output_path = OUTPUT_ROOT / "facility-composition-lab.png"
    board.save(output_path)
    manifest = {
        "version": 1,
        "scope": "isolated-staging-only",
        "activeOfficeImported": False,
        "board": str(output_path.relative_to(ROOT)).replace("\\", "/"),
        "caseCount": len(results),
        "allGeometryPass": all(result["geometryPass"] for result in results),
        "cases": results,
    }
    MANIFEST_PATH.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {output_path.relative_to(ROOT)}")
    print(f"geometry pass: {sum(result['geometryPass'] for result in results)}/{len(results)}")


if __name__ == "__main__":
    main()
