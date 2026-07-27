"""Build the Einstein 15-row sheet and transient held-prop runtime assets.

The generated source art is immutable input. This script chroma-keys it,
normalizes frames to the established Einstein 192x208 authoring grid, emits
1x/2x runtime files, and records the measured build in a manifest.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image
from PIL import ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
EINSTEIN_ROOT = ROOT / "assets" / "game" / "characters" / "einstein"
PROP_SOURCE = (
    ROOT
    / "assets"
    / "art"
    / "layout-references"
    / "held-props-modern-bright-v1-source.png"
)
PROP_OUTPUT = (
    ROOT
    / "assets"
    / "game"
    / "processed"
    / "office-interactions-v1"
    / "held-props"
)
MANIFEST_PATH = (
    ROOT / "assets" / "game" / "manifests" / "office-interaction-assets.json"
)
MASK_OUTPUT = (
    ROOT
    / "assets"
    / "game"
    / "processed"
    / "office-interactions-v1"
    / "foreground-masks"
)
FACILITY_OVERLAY_OUTPUT = (
    ROOT
    / "assets"
    / "game"
    / "processed"
    / "office-interactions-v1"
    / "facility-overlays"
)

FRAME_2X = (192, 208)
FRAME_1X = (96, 104)
MAGENTA = (255, 0, 255)

PROP_IDS = [
    "water-cup-clear",
    "water-cup-blue",
    "water-bottle",
    "coffee-mug",
    "takeaway-cup",
    "tea-cup",
    "soda-can",
    "juice-box",
    "snack-bag",
    "yogurt-box",
    "paper-sheet",
    "envelope",
    "label-card",
    "tablet",
    "notebook",
    "smartphone",
]

GENERATED_ROWS = [
    ("working-back", "einstein-working-back-v1-source.png", False),
    ("interact-front", "einstein-interact-front-v1-source.png", False),
    ("inspect-front", "einstein-inspect-front-v1-source.png", False),
    ("lounge-front", "einstein-lounge-front-v1-source.png", True),
]

MASK_SPECS = [
    {
        "id": "chair.office.modern.foreground",
        "source": "assets/game/processed/office-library-modern-bright-v1/chair-office-modern-v1/chair.office.modern.front.png",
        "regions": [(0.00, 0.36, 0.18, 0.66), (0.82, 0.36, 1.00, 0.66), (0.08, 0.50, 0.92, 0.64), (0.00, 0.64, 1.00, 1.00)],
        "seatAnchors": [(0.50, 0.53)],
    },
    {
        "id": "table.review.long.modern.foreground",
        "source": "assets/game/processed/review-decor-completion-v2/table.review.long.modern.png",
        "regions": [(0.00, 0.00, 1.00, 1.00)],
        "seatAnchors": [(0.25, 0.50), (0.75, 0.50)],
    },
    {
        "id": "sofa.modern.three-seat.foreground",
        "source": "assets/game/processed/office-library-modern-bright-v1/env-05-facility-lounge/sofa.modern.three-seat.png",
        "regions": [(0.00, 0.48, 1.00, 1.00), (0.88, 0.18, 1.00, 0.55)],
        "seatAnchors": [(0.18, 0.52), (0.50, 0.52), (0.78, 0.52)],
    },
    {
        "id": "sofa.modern.two-seat.foreground",
        "source": "assets/game/processed/office-library-modern-bright-v1/env-05-facility-lounge/sofa.modern.two-seat.png",
        "regions": [(0.00, 0.48, 1.00, 1.00), (0.86, 0.18, 1.00, 0.55)],
        "seatAnchors": [(0.28, 0.52), (0.68, 0.52)],
    },
    {
        "id": "chair.massage.modern.foreground",
        "source": "assets/game/processed/office-library-modern-bright-v1/env-05-facility-lounge/chair.massage.modern.png",
        "regions": [(0.00, 0.16, 0.28, 1.00), (0.72, 0.16, 1.00, 1.00), (0.18, 0.58, 0.82, 1.00)],
        "seatAnchors": [(0.50, 0.48)],
    },
]


def chroma_key(image: Image.Image, tolerance: int = 46) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = []
    for red, green, blue, alpha in rgba.getdata():
        distance = abs(red - MAGENTA[0]) + abs(green) + abs(blue - MAGENTA[2])
        generated_magenta = (
            red >= 170
            and blue >= 155
            and green <= 105
            and abs(red - blue) <= 85
            and red + blue >= green * 4
        )
        pixels.append(
            (red, green, blue, 0 if distance <= tolerance or generated_magenta else alpha)
        )
    rgba.putdata(pixels)
    return rgba


def non_empty_x_runs(image: Image.Image) -> list[tuple[int, int]]:
    alpha = image.getchannel("A")
    occupied = [
        sum(
            1
            for value in alpha.crop((x, 0, x + 1, image.height)).getdata()
            if value
        )
        >= 4
        for x in range(image.width)
    ]
    runs: list[tuple[int, int]] = []
    start: int | None = None
    for x, is_occupied in enumerate(occupied + [False]):
        if is_occupied and start is None:
            start = x
        elif not is_occupied and start is not None:
            runs.append((start, x))
            start = None
    return runs


def extract_six_strip_frames(path: Path) -> list[Image.Image]:
    keyed = chroma_key(Image.open(path))
    runs = [run for run in non_empty_x_runs(keyed) if run[1] - run[0] > 24]
    if len(runs) != 6:
        raise ValueError(f"{path.name}: expected six sprites, found {len(runs)} x-runs: {runs}")
    frames: list[Image.Image] = []
    for left, right in runs:
        crop = keyed.crop((left, 0, right, keyed.height))
        bounds = crop.getbbox()
        if bounds is None:
            raise ValueError(f"{path.name}: an extracted frame was empty")
        frames.append(crop.crop(bounds))
    return frames


def normalize_character_frame(sprite: Image.Image, seated: bool) -> Image.Image:
    max_width = 160 if not seated else 154
    max_height = 198 if not seated else 180
    scale = min(max_width / sprite.width, max_height / sprite.height)
    size = (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale)))
    resized = sprite.resize(size, Image.Resampling.NEAREST)
    frame = Image.new("RGBA", FRAME_2X, (0, 0, 0, 0))
    x = (FRAME_2X[0] - resized.width) // 2
    baseline = 203
    frame.alpha_composite(resized, (x, baseline - resized.height))
    return frame


def extract_seated_rows() -> list[list[Image.Image]]:
    source_path = EINSTEIN_ROOT / "einstein-seated-working-v1-source.png"
    source = chroma_key(Image.open(source_path))
    cell_height = source.height // 2
    rows: list[list[Image.Image]] = []
    for row in range(2):
        strip = source.crop((0, row * cell_height, source.width, (row + 1) * cell_height))
        runs = [run for run in non_empty_x_runs(strip) if run[1] - run[0] > 24]
        if len(runs) != 6:
            raise ValueError(f"seated source row {row}: expected six sprites, found {runs}")
        frames: list[Image.Image] = []
        for column, (left, right) in enumerate(runs):
            crop = strip.crop((left, 0, right, strip.height))
            bounds = crop.getbbox()
            if bounds is None:
                raise ValueError(f"seated source row {row}, column {column} is empty")
            frames.append(normalize_character_frame(crop.crop(bounds), seated=True))
        rows.append(frames)
    return rows


def pack_row(frames: list[Image.Image]) -> Image.Image:
    if len(frames) != 6:
        raise ValueError("Einstein extension rows must contain six active frames")
    row = Image.new("RGBA", (FRAME_2X[0] * 8, FRAME_2X[1]), (0, 0, 0, 0))
    for column, frame in enumerate(frames):
        row.alpha_composite(frame, (column * FRAME_2X[0], 0))
    return row


def build_einstein() -> dict[str, object]:
    base_path = EINSTEIN_ROOT / "runtime-spritesheet-v2@2x.webp"
    base = Image.open(base_path).convert("RGBA")
    expected_base = (FRAME_2X[0] * 8, FRAME_2X[1] * 9)
    if base.size != expected_base:
        raise ValueError(f"unexpected Einstein base size {base.size}; expected {expected_base}")

    extension_rows: list[Image.Image] = []
    row_metrics: list[dict[str, object]] = []
    for row_name, filename, seated in GENERATED_ROWS:
        sprites = extract_six_strip_frames(EINSTEIN_ROOT / filename)
        frames = [normalize_character_frame(sprite, seated=seated) for sprite in sprites]
        extension_rows.append(pack_row(frames))
        row_metrics.append(
            {
                "row": 9 + len(extension_rows) - 1,
                "name": row_name,
                "activeFrames": 6,
                "source": filename,
                "frameBounds2x": [frame.getbbox() for frame in frames],
            }
        )

    seated_rows = extract_seated_rows()
    for row_name, frames in zip(
        ("working-back-seated", "working-front-seated"), seated_rows, strict=True
    ):
        extension_rows.append(pack_row(frames))
        row_metrics.append(
            {
                "row": 9 + len(extension_rows) - 1,
                "name": row_name,
                "activeFrames": 6,
                "source": "einstein-seated-working-v1-source.png",
                "frameBounds2x": [frame.getbbox() for frame in frames],
            }
        )

    sheet_2x = Image.new(
        "RGBA", (FRAME_2X[0] * 8, FRAME_2X[1] * 15), (0, 0, 0, 0)
    )
    sheet_2x.alpha_composite(base, (0, 0))
    for index, row in enumerate(extension_rows):
        sheet_2x.alpha_composite(row, (0, (9 + index) * FRAME_2X[1]))

    output_2x = EINSTEIN_ROOT / "runtime-spritesheet-v3@2x.webp"
    output_1x = EINSTEIN_ROOT / "runtime-spritesheet-v3.webp"
    sheet_2x.save(output_2x, "WEBP", lossless=True, method=6)
    sheet_1x = sheet_2x.resize(
        (FRAME_1X[0] * 8, FRAME_1X[1] * 15), Image.Resampling.NEAREST
    )
    sheet_1x.save(output_1x, "WEBP", lossless=True, method=6)

    preview = Image.new("RGBA", sheet_1x.size, (35, 41, 52, 255))
    preview.alpha_composite(sheet_1x)
    preview_path = EINSTEIN_ROOT / "runtime-spritesheet-v3-preview.png"
    preview.save(preview_path)

    return {
        "rows": 15,
        "columns": 8,
        "frame2x": list(FRAME_2X),
        "frame1x": list(FRAME_1X),
        "sheet2x": str(output_2x.relative_to(ROOT)).replace("\\", "/"),
        "sheet1x": str(output_1x.relative_to(ROOT)).replace("\\", "/"),
        "preview": str(preview_path.relative_to(ROOT)).replace("\\", "/"),
        "base": str(base_path.relative_to(ROOT)).replace("\\", "/"),
        "size2x": list(sheet_2x.size),
        "size1x": list(sheet_1x.size),
        "extensionRows": row_metrics,
    }


def build_props() -> list[dict[str, object]]:
    source = chroma_key(Image.open(PROP_SOURCE))
    PROP_OUTPUT.mkdir(parents=True, exist_ok=True)
    records: list[dict[str, object]] = []
    for index, prop_id in enumerate(PROP_IDS):
        row, column = divmod(index, 4)
        left = round(column * source.width / 4)
        right = round((column + 1) * source.width / 4)
        top = round(row * source.height / 4)
        bottom = round((row + 1) * source.height / 4)
        cell = source.crop((left, top, right, bottom))
        bounds = cell.getbbox()
        if bounds is None:
            raise ValueError(f"held prop cell {prop_id} is empty")
        sprite = cell.crop(bounds)
        scale = min(32 / sprite.width, 32 / sprite.height)
        size = (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale)))
        sprite_2x = sprite.resize(size, Image.Resampling.NEAREST)
        canvas_2x = Image.new("RGBA", (40, 40), (0, 0, 0, 0))
        canvas_2x.alpha_composite(
            sprite_2x, ((40 - sprite_2x.width) // 2, (40 - sprite_2x.height) // 2)
        )
        canvas_1x = canvas_2x.resize((20, 20), Image.Resampling.NEAREST)
        output_2x = PROP_OUTPUT / f"{prop_id}@2x.png"
        output_1x = PROP_OUTPUT / f"{prop_id}.png"
        canvas_2x.save(output_2x)
        canvas_1x.save(output_1x)
        records.append(
            {
                "id": f"held.{prop_id}",
                "cell": [row, column],
                "file": str(output_1x.relative_to(ROOT)).replace("\\", "/"),
                "file2x": str(output_2x.relative_to(ROOT)).replace("\\", "/"),
                "bounds2x": canvas_2x.getbbox(),
            }
        )
    return records


def build_interact_preview() -> str:
    sheet = Image.open(EINSTEIN_ROOT / "runtime-spritesheet-v3.webp").convert("RGBA")
    anchors = [(48, 72), (34, 63), (43, 64), (42, 62), (39, 59), (43, 69)]
    card_size = (128, 132)
    preview = Image.new("RGBA", (card_size[0] * 4, card_size[1] * 4), (35, 41, 52, 255))
    draw = ImageDraw.Draw(preview)
    for index, prop_id in enumerate(PROP_IDS):
        frame_index = 2 + index % 3
        frame = sheet.crop(
            (
                frame_index * FRAME_1X[0],
                10 * FRAME_1X[1],
                (frame_index + 1) * FRAME_1X[0],
                11 * FRAME_1X[1],
            )
        )
        prop = Image.open(PROP_OUTPUT / f"{prop_id}.png").convert("RGBA")
        column, row = index % 4, index // 4
        origin = (column * card_size[0], row * card_size[1])
        actor_offset = (origin[0] + 16, origin[1] + 3)
        preview.alpha_composite(frame, actor_offset)
        anchor_x, anchor_y = anchors[frame_index]
        preview.alpha_composite(
            prop,
            (
                actor_offset[0] + anchor_x - prop.width // 2,
                actor_offset[1] + anchor_y - prop.height // 2,
            ),
        )
        draw.text((origin[0] + 4, origin[1] + 112), prop_id, fill=(235, 239, 247, 255))
    qa_root = PROP_OUTPUT.parent / "qa"
    qa_root.mkdir(parents=True, exist_ok=True)
    path = qa_root / "interact-front-held-props.png"
    preview.save(path)
    return str(path.relative_to(ROOT)).replace("\\", "/")


def build_foreground_masks() -> list[dict[str, object]]:
    MASK_OUTPUT.mkdir(parents=True, exist_ok=True)
    records: list[dict[str, object]] = []
    for spec in MASK_SPECS:
        source_path = ROOT / str(spec["source"])
        source = Image.open(source_path).convert("RGBA")
        region_mask = Image.new("L", source.size, 0)
        draw = ImageDraw.Draw(region_mask)
        for left, top, right, bottom in spec["regions"]:
            draw.rectangle(
                (
                    round(left * source.width),
                    round(top * source.height),
                    round(right * source.width),
                    round(bottom * source.height),
                ),
                fill=255,
            )
        output = Image.new("RGBA", source.size, (0, 0, 0, 0))
        output.paste(
            source,
            (0, 0),
            ImageChops.multiply(source.getchannel("A"), region_mask),
        )
        filename = f"{str(spec['id']).replace('.', '-')}.png"
        output_path = MASK_OUTPUT / filename
        output.save(output_path)
        records.append(
            {
                "id": spec["id"],
                "source": spec["source"],
                "file": str(output_path.relative_to(ROOT)).replace("\\", "/"),
                "size": list(output.size),
                "bounds": output.getbbox(),
                "regions": spec["regions"],
                "seatAnchors": spec["seatAnchors"],
            }
        )
    return records


def build_item_neutral_vending_loop() -> dict[str, object]:
    source_root = (
        ROOT
        / "assets"
        / "game"
        / "processed"
        / "office-library-modern-bright-v1"
        / "env-07-animated-mechanical"
    )
    FACILITY_OVERLAY_OUTPUT.mkdir(parents=True, exist_ok=True)
    source_frames = ("a", "b", "c", "c")
    outputs: list[str] = []
    for target_frame, source_frame in zip("abcd", source_frames, strict=True):
        source = source_root / f"vending.machine.loop.{source_frame}.png"
        output = FACILITY_OVERLAY_OUTPUT / (
            f"vending.machine.loop.item-neutral.{target_frame}.png"
        )
        Image.open(source).convert("RGBA").save(output)
        outputs.append(str(output.relative_to(ROOT)).replace("\\", "/"))
    return {
        "id": "vending.machine.loop.item-neutral",
        "frames": outputs,
        "outputAnchor": {"x": 0.50, "y": 0.78},
        "policy": "frame d reuses the empty open tray; selected items are overlays",
    }


def main() -> None:
    manifest = {
        "version": 1,
        "status": "runtime-ready-staging",
        "sourcePolicy": "generated sources are immutable; rerun this script for derived assets",
        "einstein": build_einstein(),
        "heldProps": {
            "sheet": str(PROP_SOURCE.relative_to(ROOT)).replace("\\", "/"),
            "grid": [4, 4],
            "count": 16,
            "assets": build_props(),
        },
        "foregroundMasks": {
            "count": len(MASK_SPECS),
            "assets": build_foreground_masks(),
        },
        "qa": {
            "interactFrontHeldProps": build_interact_preview(),
            "cases": 16,
        },
        "facilityOverlays": {
            "vendingItemNeutral": build_item_neutral_vending_loop(),
        },
        "handAnchors1x": {
            "interact-front": [(48, 72), (34, 63), (43, 64), (42, 62), (39, 59), (43, 69)],
        },
    }
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"wrote {MANIFEST_PATH.relative_to(ROOT)}")
    print("Einstein: 8 columns x 15 rows; held props: 16/16")


if __name__ == "__main__":
    main()
