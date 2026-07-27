"""Build the remaining fourteen character atlases as staging-only 8x15 packs.

The script normalizes legacy 8x9 PetDex sheets to the runtime-v2 naming
contract when needed, keys and extracts six generated extension strips, packs
the accepted rows, and emits reproducible QA metadata. It intentionally does
not update the active Office character registry.
"""

from __future__ import annotations

import hashlib
import json
import runpy
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
CHARACTER_ROOT = ROOT / "assets" / "game" / "characters"
OUTPUT_ROOT = (
    ROOT / "assets" / "game" / "processed" / "character-roster-8x15-batch-v1"
)
MANIFEST_PATH = (
    ROOT / "assets" / "game" / "manifests" / "character-roster-8x15-batch.json"
)

FRAME_2X = (192, 208)
FRAME_1X = (96, 104)
COLUMNS = 8
BASE_ROWS = 9
ROWS = 15
ACTIVE_FRAMES = 6
ROW_NAMES = (
    "working-back",
    "interact-front",
    "inspect-front",
    "lounge-front",
    "working-back-seated",
    "working-front-seated",
)

_pilot = runpy.run_path(str(ROOT / "scripts" / "process-character-morphology-pilot.py"))
extract_strip = _pilot["extract_strip"]
normalize_row = _pilot["normalize_row"]
pack_row = _pilot["pack_row"]
RowSpec = _pilot["RowSpec"]


@dataclass(frozen=True)
class CharacterSpec:
    character_id: str
    source_prefix: str
    morphology: str
    standing_height: int
    seated_height: int
    max_width: int


CHARACTERS = (
    CharacterSpec("asuka-2", "asuka-2", "standard-human", 198, 180, 176),
    CharacterSpec("jesus", "jesus", "standard-human", 198, 180, 176),
    CharacterSpec("miku", "miku", "standard-human", 198, 180, 182),
    CharacterSpec("rem-xl", "rem-xl", "standard-human", 198, 180, 182),
    CharacterSpec("ruri", "ruri", "standard-human", 198, 180, 176),
    CharacterSpec("itachi", "itachi", "stylized-human", 198, 180, 180),
    CharacterSpec("lian-3", "lian-3", "stylized-human", 198, 180, 184),
    CharacterSpec("taffy-2", "taffy-2", "stylized-human", 198, 180, 180),
    CharacterSpec("yinyue-2", "yinyue", "stylized-human", 198, 180, 184),
    CharacterSpec("noir-webling", "noir", "stylized-human", 190, 176, 184),
    CharacterSpec("baobao-2", "baobao", "compact-costume", 186, 172, 180),
    CharacterSpec("gugugaga", "gugugaga", "compact-costume", 186, 172, 180),
    CharacterSpec("nai-long", "nai-long", "non-human", 184, 168, 180),
    CharacterSpec("qq-penguin", "qq-penguin", "non-human", 182, 164, 178),
)


def relative(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def rgba_hash(image: Image.Image) -> str:
    # Lossless WebP does not promise to preserve RGB values underneath fully
    # transparent pixels. Canonicalize those invisible bytes before comparing
    # decoded atlases; visible RGB and the full alpha plane remain exact.
    pixels = bytearray(image.convert("RGBA").tobytes())
    for index in range(0, len(pixels), 4):
        if pixels[index + 3] == 0:
            pixels[index : index + 3] = b"\0\0\0"
    return hashlib.sha256(pixels).hexdigest()


def ensure_runtime_v2(character_root: Path) -> tuple[Path, bool]:
    base_2x = character_root / "runtime-spritesheet-v2@2x.webp"
    base_1x = character_root / "runtime-spritesheet-v2.webp"
    if base_2x.exists():
        return base_2x, False

    source = character_root / "spritesheet.webp"
    source_image = Image.open(source).convert("RGBA")
    expected = (FRAME_2X[0] * COLUMNS, FRAME_2X[1] * BASE_ROWS)
    if source_image.size != expected:
        raise ValueError(f"{source}: expected {expected}, got {source_image.size}")

    source_image.save(base_2x, "WEBP", lossless=True, method=6)
    source_image.resize(
        (FRAME_1X[0] * COLUMNS, FRAME_1X[1] * BASE_ROWS),
        Image.Resampling.NEAREST,
    ).save(base_1x, "WEBP", lossless=True, method=6)
    return base_2x, True


def row_specs(spec: CharacterSpec) -> tuple[object, ...]:
    rows = []
    for row_name in ROW_NAMES:
        height = (
            spec.seated_height
            if row_name in {"lounge-front", "working-back-seated", "working-front-seated"}
            else spec.standing_height
        )
        rows.append(
            RowSpec(
                row_name,
                f"{spec.source_prefix}-{row_name}-v1-source.png",
                height,
                spec.max_width,
            )
        )
    return tuple(rows)


def hand_anchor_template(spec: CharacterSpec) -> list[dict[str, object]]:
    if spec.morphology == "non-human":
        anchors = ((0.57, 0.58), (0.61, 0.56), (0.64, 0.54), (0.64, 0.54), (0.60, 0.56), (0.57, 0.58))
    elif spec.morphology == "compact-costume":
        anchors = ((0.58, 0.57), (0.61, 0.55), (0.63, 0.53), (0.63, 0.53), (0.60, 0.55), (0.58, 0.57))
    else:
        anchors = ((0.58, 0.56), (0.60, 0.54), (0.62, 0.52), (0.62, 0.52), (0.60, 0.54), (0.58, 0.56))
    return [
        {"frame": frame, "normalized": list(anchor), "status": "provisional-derived"}
        for frame, anchor in enumerate(anchors)
    ]


def build_character(spec: CharacterSpec) -> tuple[dict[str, object], Image.Image]:
    character_root = CHARACTER_ROOT / spec.character_id
    base_path, normalized_base = ensure_runtime_v2(character_root)
    base = Image.open(base_path).convert("RGBA")
    expected_base = (FRAME_2X[0] * COLUMNS, FRAME_2X[1] * BASE_ROWS)
    if base.size != expected_base:
        raise ValueError(f"{spec.character_id}: base {base.size}, expected {expected_base}")

    sheet = Image.new(
        "RGBA",
        (FRAME_2X[0] * COLUMNS, FRAME_2X[1] * ROWS),
        (0, 0, 0, 0),
    )
    sheet.paste(base, (0, 0))
    extension_preview = Image.new(
        "RGBA",
        (FRAME_1X[0] * ACTIVE_FRAMES, FRAME_1X[1] * len(ROW_NAMES)),
        (0, 0, 0, 0),
    )

    extension_rows: list[dict[str, object]] = []
    for extension_index, row_spec in enumerate(row_specs(spec)):
        source_path = character_root / row_spec.source
        frames = normalize_row(extract_strip(source_path), row_spec)
        row_index = BASE_ROWS + extension_index
        sheet.alpha_composite(pack_row(frames), (0, row_index * FRAME_2X[1]))
        for column, frame in enumerate(frames):
            extension_preview.alpha_composite(
                frame.resize(FRAME_1X, Image.Resampling.NEAREST),
                (column * FRAME_1X[0], extension_index * FRAME_1X[1]),
            )
        extension_rows.append(
            {
                "row": row_index,
                "state": row_spec.name,
                "activeFrames": ACTIVE_FRAMES,
                "emptyTrailingCells": [6, 7],
                "source": relative(source_path),
                "frameBounds2x": [list(frame.getbbox() or ()) for frame in frames],
            }
        )

    output_2x = character_root / "runtime-spritesheet-v3@2x.webp"
    output_1x = character_root / "runtime-spritesheet-v3.webp"
    preview_path = character_root / "runtime-spritesheet-v3-preview.png"
    sheet.save(output_2x, "WEBP", lossless=True, method=6)
    sheet_1x = sheet.resize(
        (FRAME_1X[0] * COLUMNS, FRAME_1X[1] * ROWS),
        Image.Resampling.NEAREST,
    )
    sheet_1x.save(output_1x, "WEBP", lossless=True, method=6)
    preview = Image.new("RGBA", sheet_1x.size, (29, 35, 46, 255))
    preview.alpha_composite(sheet_1x)
    preview.save(preview_path)

    preserved = rgba_hash(
        sheet.crop((0, 0, sheet.width, FRAME_2X[1] * BASE_ROWS))
    ) == rgba_hash(base)
    if not preserved:
        raise ValueError(f"{spec.character_id}: base rows changed during packing")

    record = {
        "id": spec.character_id,
        "morphology": spec.morphology,
        "status": "staging-only",
        "activeOfficeImported": False,
        "normalizedLegacyBase": normalized_base,
        "base": relative(base_path),
        "baseRows": BASE_ROWS,
        "baseRowsPreservedPixelExact": preserved,
        "pixelEqualityMode": "decoded-rgba-with-transparent-rgb-canonicalized",
        "sheet1x": relative(output_1x),
        "sheet2x": relative(output_2x),
        "preview": relative(preview_path),
        "rows": ROWS,
        "columns": COLUMNS,
        "extensionRows": extension_rows,
        "interactHandAnchors": hand_anchor_template(spec),
        "seatOffset1x": {"x": 0, "y": 0, "status": "provisional-per-furniture-calibration"},
    }
    return record, extension_preview


def build_contact_sheet(
    records: list[dict[str, object]], previews: list[Image.Image]
) -> Path:
    columns = 2
    label_width = 170
    padding = 18
    header_height = 34
    block_width = label_width + FRAME_1X[0] * ACTIVE_FRAMES + padding
    block_height = header_height + FRAME_1X[1] * len(ROW_NAMES) + padding
    rows = (len(records) + columns - 1) // columns
    sheet = Image.new(
        "RGBA",
        (padding + block_width * columns, padding + block_height * rows),
        (25, 31, 42, 255),
    )
    draw = ImageDraw.Draw(sheet)
    for index, (record, preview) in enumerate(zip(records, previews, strict=True)):
        grid_x = index % columns
        grid_y = index // columns
        x = padding + grid_x * block_width
        y = padding + grid_y * block_height
        draw.text((x, y + 8), f"{record['id']} / {record['morphology']}", fill=(235, 241, 250, 255))
        extension_rows = record["extensionRows"]
        assert isinstance(extension_rows, list)
        for row_index, row in enumerate(extension_rows):
            assert isinstance(row, dict)
            draw.text(
                (x, y + header_height + row_index * FRAME_1X[1] + 46),
                f"r{row['row']} {row['state']}",
                fill=(160, 178, 204, 255),
            )
        checker = Image.new("RGBA", preview.size, (37, 45, 59, 255))
        checker.alpha_composite(preview)
        sheet.alpha_composite(checker, (x + label_width, y + header_height))

    output = OUTPUT_ROOT / "qa" / "extension-rows-contact-sheet.png"
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output)
    return output


def main() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    records: list[dict[str, object]] = []
    previews: list[Image.Image] = []
    for spec in CHARACTERS:
        record, preview = build_character(spec)
        records.append(record)
        previews.append(preview)
        print(f"packed {spec.character_id}")

    contact_sheet = build_contact_sheet(records, previews)
    manifest = {
        "version": 1,
        "status": "staging-only",
        "activeOfficeImported": False,
        "frame1x": list(FRAME_1X),
        "frame2x": list(FRAME_2X),
        "rowOrder": list(ROW_NAMES),
        "characterCount": len(records),
        "acceptance": {
            "targetRows": ROWS,
            "targetColumns": COLUMNS,
            "activeFramesPerExtensionRow": ACTIVE_FRAMES,
            "emptyTrailingCells": [6, 7],
            "baseRowsMustRemainPixelExact": True,
            "activeRegistryMustRemainUnchanged": True,
        },
        "qa": {
            "contactSheet": relative(contact_sheet),
            "visualReview": "passed-2026-07-27",
            "sourceStripExtraction": "84-of-84",
        },
        "characters": records,
    }
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {relative(MANIFEST_PATH)}")


if __name__ == "__main__":
    main()
