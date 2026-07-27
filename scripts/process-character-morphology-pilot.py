"""Build the three-character 8x15 morphology pilot without activating it.

The generated magenta source strips are immutable inputs. This script removes
their key colour, extracts six animation frames per row, appends those rows to
the accepted PetDex atlases, and emits a measured staging manifest plus visual
QA sheets. Existing runtime atlases are never overwritten.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
CHARACTER_ROOT = ROOT / "assets" / "game" / "characters"
OUTPUT_ROOT = (
    ROOT / "assets" / "game" / "processed" / "character-morphology-pilot-v1"
)
MANIFEST_PATH = (
    ROOT / "assets" / "game" / "manifests" / "character-morphology-pilot.json"
)

FRAME_2X = (192, 208)
FRAME_1X = (96, 104)
SHEET_COLUMNS = 8
SHEET_ROWS = 15
ACTIVE_FRAMES = 6
MAGENTA = (255, 0, 255)

ROW_NAMES = [
    "working-back",
    "interact-front",
    "inspect-front",
    "lounge-front",
    "working-back-seated",
    "working-front-seated",
]


@dataclass(frozen=True)
class RowSpec:
    name: str
    source: str
    target_height: int
    max_width: int
    baseline: int = 203


@dataclass(frozen=True)
class CharacterSpec:
    character_id: str
    base_atlas: str
    base_rows: int
    output_version: int
    rows: tuple[RowSpec, ...]
    interact_hand_anchors: tuple[tuple[float, float], ...] | None = None


PILOTS = (
    CharacterSpec(
        character_id="doraemon",
        base_atlas="runtime-spritesheet-v3@2x.webp",
        base_rows=13,
        output_version=4,
        rows=(
            RowSpec(
                "working-back-seated",
                "doraemon-working-back-seated-v1-source.png",
                170,
                168,
            ),
            RowSpec(
                "working-front-seated",
                "doraemon-working-front-seated-v1-source.png",
                170,
                168,
            ),
        ),
    ),
    CharacterSpec(
        character_id="anna",
        base_atlas="runtime-spritesheet-v2@2x.webp",
        base_rows=9,
        output_version=3,
        rows=(
            RowSpec("working-back", "anna-working-back-v1-source.png", 198, 174),
            RowSpec(
                "interact-front", "anna-interact-front-v1-source.png", 198, 174
            ),
            RowSpec("inspect-front", "anna-inspect-front-v1-source.png", 198, 174),
            RowSpec("lounge-front", "anna-lounge-front-v1-source.png", 180, 174),
            RowSpec(
                "working-back-seated",
                "anna-working-back-seated-v1-source.png",
                180,
                174,
            ),
            RowSpec(
                "working-front-seated",
                "anna-working-front-seated-v1-source.png",
                180,
                174,
            ),
        ),
        interact_hand_anchors=(
            (0.58, 0.56),
            (0.59, 0.55),
            (0.60, 0.54),
            (0.60, 0.54),
            (0.59, 0.55),
            (0.58, 0.56),
        ),
    ),
    CharacterSpec(
        character_id="ai-workbot",
        base_atlas="runtime-spritesheet-v2@2x.webp",
        base_rows=9,
        output_version=3,
        rows=(
            RowSpec(
                "working-back", "ai-workbot-working-back-v1-source.png", 186, 180
            ),
            RowSpec(
                "interact-front",
                "ai-workbot-interact-front-v1-source.png",
                186,
                180,
            ),
            RowSpec(
                "inspect-front",
                "ai-workbot-inspect-front-v1-source.png",
                186,
                180,
            ),
            RowSpec(
                "lounge-front",
                "ai-workbot-lounge-front-v1-source.png",
                170,
                180,
            ),
            RowSpec(
                "working-back-seated",
                "ai-workbot-working-back-seated-v1-source.png",
                176,
                180,
            ),
            RowSpec(
                "working-front-seated",
                "ai-workbot-working-front-seated-v1-source.png",
                176,
                180,
            ),
        ),
        interact_hand_anchors=(
            (0.56, 0.56),
            (0.57, 0.55),
            (0.58, 0.54),
            (0.58, 0.54),
            (0.57, 0.55),
            (0.56, 0.56),
        ),
    ),
)


def chroma_key(image: Image.Image, tolerance: int = 46) -> Image.Image:
    rgba = image.convert("RGBA")
    output: list[tuple[int, int, int, int]] = []
    for red, green, blue, alpha in rgba.getdata():
        distance = abs(red - MAGENTA[0]) + abs(green) + abs(blue - MAGENTA[2])
        generated_magenta = (
            red >= 170
            and blue >= 155
            and green <= 105
            and abs(red - blue) <= 85
            and red + blue >= green * 4
        )
        generated_magenta_halo = (
            red >= 55
            and blue >= 75
            and green <= 120
            and abs(red - blue) <= 110
            and red + blue >= green * 2.8
        )
        output.append(
            (
                red,
                green,
                blue,
                0
                if distance <= tolerance
                or generated_magenta
                or generated_magenta_halo
                else alpha,
            )
        )
    rgba.putdata(output)
    return rgba


def non_empty_x_runs(image: Image.Image) -> list[tuple[int, int]]:
    alpha = image.getchannel("A")
    occupied = [
        sum(1 for value in alpha.crop((x, 0, x + 1, image.height)).getdata() if value)
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


def extract_strip(path: Path) -> list[Image.Image]:
    keyed = chroma_key(Image.open(path))
    runs = [run for run in non_empty_x_runs(keyed) if run[1] - run[0] > 24]
    if len(runs) != ACTIVE_FRAMES:
        raise ValueError(
            f"{path.name}: expected {ACTIVE_FRAMES} sprites, found {len(runs)}: {runs}"
        )
    frames: list[Image.Image] = []
    for left, right in runs:
        crop = keyed.crop((left, 0, right, keyed.height))
        bounds = crop.getbbox()
        if bounds is None:
            raise ValueError(f"{path.name}: extracted an empty frame")
        frames.append(crop.crop(bounds))
    return frames


def normalize_row(sprites: list[Image.Image], spec: RowSpec) -> list[Image.Image]:
    widest = max(sprite.width for sprite in sprites)
    tallest = max(sprite.height for sprite in sprites)
    scale = min(spec.max_width / widest, spec.target_height / tallest)
    frames: list[Image.Image] = []
    for sprite in sprites:
        size = (
            max(1, round(sprite.width * scale)),
            max(1, round(sprite.height * scale)),
        )
        resized = sprite.resize(size, Image.Resampling.NEAREST)
        frame = Image.new("RGBA", FRAME_2X, (0, 0, 0, 0))
        x = (FRAME_2X[0] - resized.width) // 2
        frame.alpha_composite(resized, (x, spec.baseline - resized.height))
        frames.append(frame)
    return frames


def pack_row(frames: list[Image.Image]) -> Image.Image:
    row = Image.new(
        "RGBA", (FRAME_2X[0] * SHEET_COLUMNS, FRAME_2X[1]), (0, 0, 0, 0)
    )
    for column, frame in enumerate(frames):
        row.alpha_composite(frame, (column * FRAME_2X[0], 0))
    return row


def rgba_hash(image: Image.Image) -> str:
    return hashlib.sha256(image.convert("RGBA").tobytes()).hexdigest()


def relative(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def build_character(spec: CharacterSpec) -> tuple[dict[str, object], Image.Image]:
    character_root = CHARACTER_ROOT / spec.character_id
    base_path = character_root / spec.base_atlas
    base = Image.open(base_path).convert("RGBA")
    expected_base_size = (
        FRAME_2X[0] * SHEET_COLUMNS,
        FRAME_2X[1] * spec.base_rows,
    )
    if base.size != expected_base_size:
        raise ValueError(
            f"{spec.character_id}: base size {base.size}, expected {expected_base_size}"
        )
    if spec.base_rows + len(spec.rows) != SHEET_ROWS:
        raise ValueError(
            f"{spec.character_id}: {spec.base_rows} base rows plus "
            f"{len(spec.rows)} extension rows does not equal {SHEET_ROWS}"
        )

    sheet = Image.new(
        "RGBA",
        (FRAME_2X[0] * SHEET_COLUMNS, FRAME_2X[1] * SHEET_ROWS),
        (0, 0, 0, 0),
    )
    # Paste, rather than alpha-composite, so RGB values underneath fully
    # transparent base pixels remain byte-for-byte identical.
    sheet.paste(base, (0, 0))

    rows: list[dict[str, object]] = []
    extension_preview = Image.new(
        "RGBA",
        (FRAME_1X[0] * ACTIVE_FRAMES, FRAME_1X[1] * len(spec.rows)),
        (0, 0, 0, 0),
    )
    for index, row_spec in enumerate(spec.rows):
        source_path = character_root / row_spec.source
        frames = normalize_row(extract_strip(source_path), row_spec)
        row_index = spec.base_rows + index
        sheet.alpha_composite(pack_row(frames), (0, row_index * FRAME_2X[1]))
        for column, frame in enumerate(frames):
            frame_1x = frame.resize(FRAME_1X, Image.Resampling.NEAREST)
            extension_preview.alpha_composite(
                frame_1x, (column * FRAME_1X[0], index * FRAME_1X[1])
            )
        rows.append(
            {
                "row": row_index,
                "state": row_spec.name,
                "activeFrames": ACTIVE_FRAMES,
                "source": relative(source_path),
                "frameBounds2x": [list(frame.getbbox() or ()) for frame in frames],
            }
        )

    output_2x = (
        character_root / f"runtime-spritesheet-v{spec.output_version}@2x.webp"
    )
    output_1x = character_root / f"runtime-spritesheet-v{spec.output_version}.webp"
    preview_path = (
        character_root / f"runtime-spritesheet-v{spec.output_version}-preview.png"
    )
    sheet.save(output_2x, "WEBP", lossless=True, method=6)
    sheet_1x = sheet.resize(
        (FRAME_1X[0] * SHEET_COLUMNS, FRAME_1X[1] * SHEET_ROWS),
        Image.Resampling.NEAREST,
    )
    sheet_1x.save(output_1x, "WEBP", lossless=True, method=6)
    preview = Image.new("RGBA", sheet_1x.size, (29, 35, 46, 255))
    preview.alpha_composite(sheet_1x)
    preview.save(preview_path)

    base_height = spec.base_rows * FRAME_2X[1]
    preserved = rgba_hash(sheet.crop((0, 0, sheet.width, base_height))) == rgba_hash(
        base
    )
    if not preserved:
        raise ValueError(f"{spec.character_id}: base rows changed during packing")

    record: dict[str, object] = {
        "id": spec.character_id,
        "status": "staging-only",
        "activeOfficeImported": False,
        "base": relative(base_path),
        "baseRows": spec.base_rows,
        "baseRowsPreservedPixelExact": preserved,
        "outputVersion": spec.output_version,
        "sheet1x": relative(output_1x),
        "sheet2x": relative(output_2x),
        "preview": relative(preview_path),
        "rows": SHEET_ROWS,
        "columns": SHEET_COLUMNS,
        "extensionRows": rows,
    }
    if spec.interact_hand_anchors:
        record["interactHandAnchors"] = [
            {"frame": index, "normalized": list(anchor)}
            for index, anchor in enumerate(spec.interact_hand_anchors)
        ]
    return record, extension_preview


def build_contact_sheet(
    records: list[dict[str, object]], previews: list[Image.Image]
) -> Path:
    label_width = 180
    padding = 16
    header_height = 34
    row_gap = 18
    block_heights = [
        header_height + preview.height + row_gap for preview in previews
    ]
    width = label_width + FRAME_1X[0] * ACTIVE_FRAMES + padding * 2
    height = padding * 2 + sum(block_heights)
    sheet = Image.new("RGBA", (width, height), (25, 31, 42, 255))
    draw = ImageDraw.Draw(sheet)
    y = padding
    for record, preview in zip(records, previews, strict=True):
        draw.text(
            (padding, y + 8),
            f"{record['id']} / staging 8x15",
            fill=(235, 241, 250, 255),
        )
        extension_rows = record["extensionRows"]
        assert isinstance(extension_rows, list)
        for row_index, row in enumerate(extension_rows):
            assert isinstance(row, dict)
            draw.text(
                (padding, y + header_height + row_index * FRAME_1X[1] + 46),
                f"r{row['row']} {row['state']}",
                fill=(160, 178, 204, 255),
            )
        checker = Image.new(
            "RGBA",
            (preview.width, preview.height),
            (37, 45, 59, 255),
        )
        checker.alpha_composite(preview)
        sheet.alpha_composite(checker, (label_width, y + header_height))
        y += header_height + preview.height + row_gap
    output_path = OUTPUT_ROOT / "qa" / "extension-rows-contact-sheet.png"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output_path)
    return output_path


def main() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    records: list[dict[str, object]] = []
    previews: list[Image.Image] = []
    for spec in PILOTS:
        record, preview = build_character(spec)
        records.append(record)
        previews.append(preview)

    contact_sheet = build_contact_sheet(records, previews)
    manifest = {
        "version": 1,
        "status": "staging-only",
        "activeOfficeImported": False,
        "frame1x": list(FRAME_1X),
        "frame2x": list(FRAME_2X),
        "rowOrder": ROW_NAMES,
        "acceptance": {
            "targetRows": SHEET_ROWS,
            "activeFramesPerExtensionRow": ACTIVE_FRAMES,
            "emptyTrailingCells": [6, 7],
            "baseRowsMustRemainPixelExact": True,
            "activeRegistryMustRemainUnchanged": True,
        },
        "qa": {"contactSheet": relative(contact_sheet)},
        "characters": records,
    }
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(manifest, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
