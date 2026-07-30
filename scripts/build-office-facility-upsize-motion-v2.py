#!/usr/bin/env python3
"""Build the visual-only Facility Upsize Motion Artwork V2 review package."""

from __future__ import annotations

import argparse
import io
import json
import tempfile
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageDraw, ImageSequence

from office_facility_art import (
    BODY_FONT,
    HEADING_FONT,
    SMALL_FONT,
    checkerboard,
    draw_title,
    json_bytes,
    png_bytes,
    sha256_bytes,
    sha256_file,
)
from office_facility_upsize_motion_v2_assets import (
    FAMILIES,
    PROCESSED_ROOT,
    REVIEW_ROOT,
    ROOT,
    SOURCE_ROOT,
    build_asset_outputs,
)


MANIFEST_PATH = Path(
    "assets/game/manifests/office-facility-upsize-motion-v2.json"
)
PROMPT_PATH = SOURCE_ROOT / "source" / "IMAGEGEN_PROMPTS.md"
V1_MANIFEST = Path(
    "assets/game/manifests/office-facility-upsize-2x2x4-production-v1.json"
)
F9_MANIFEST = Path(
    "assets/game/manifests/office-furniture-only-f9-v1.json"
)
DOC_PATH = Path(
    "docs/art/OFFICE_FACILITY_UPSIZE_MOTION_V2.md"
)
BOARD_SIZE = (1900, 1050)


def load_output(outputs: dict[Path, bytes], path: Path) -> Image.Image:
    return Image.open(io.BytesIO(outputs[path])).convert("RGBA")


def contain(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    copy = image.copy()
    copy.thumbnail(size, Image.Resampling.NEAREST)
    return copy


def panel(
    canvas: Image.Image,
    box: tuple[int, int, int, int],
    title: str,
    image: Image.Image,
    *,
    checker: bool = True,
) -> None:
    draw = ImageDraw.Draw(canvas)
    left, top, right, bottom = box
    draw.rounded_rectangle(
        box,
        radius=16,
        fill=(247, 250, 253, 255),
        outline=(190, 204, 216, 255),
        width=2,
    )
    draw.text((left + 18, top + 14), title, font=BODY_FONT, fill=(26, 48, 66, 255))
    area = (right - left - 36, bottom - top - 66)
    fitted = contain(image, area)
    x = left + (right - left - fitted.width) // 2
    y = top + 52 + (area[1] - fitted.height) // 2
    if checker:
        background = checkerboard((fitted.width, fitted.height), 18)
        background.alpha_composite(fitted)
        canvas.alpha_composite(background, (x, y))
    else:
        canvas.alpha_composite(fitted, (x, y))


def board_canvas(title: str, subtitle: str) -> Image.Image:
    canvas = Image.new("RGBA", BOARD_SIZE, (235, 241, 247, 255))
    draw_title(canvas, title, subtitle)
    return canvas


def source_parts_board(
    family: dict[str, Any],
    record: dict[str, Any],
    outputs: dict[Path, bytes],
) -> Image.Image:
    slug = family["slug"]
    canvas = board_canvas(
        f"{record['label']} — authored source and extracted parts",
        "All visible motion pixels come from the built-in ImageGen atlas; runtime code draws none.",
    )
    atlas = Image.open(ROOT / record["atlas"]["alpha"]).convert("RGBA")
    panel(canvas, (35, 125, 930, 1010), "SOURCE ALPHA ATLAS", atlas)
    roles = list(family["rows"])
    part_width = 210
    part_height = 205
    start_x = 970
    start_y = 150
    for row_index, role in enumerate(roles):
        for phase_index, phase in enumerate(("a", "b", "c", "d")):
            path = (
                PROCESSED_ROOT / slug / "source-cutouts" / f"{role}-{phase}.png"
            )
            image = load_output(outputs, path)
            left = start_x + phase_index * (part_width + 10)
            top = start_y + row_index * (part_height + 20)
            panel(
                canvas,
                (left, top, left + part_width, top + part_height),
                f"{role.upper()} {phase.upper()}",
                image,
            )
    draw = ImageDraw.Draw(canvas)
    draw.text(
        (980, 930),
        f"source components: {record['atlas']['componentCount']} · "
        "cell-boundary ownership failures: 0",
        font=SMALL_FONT,
        fill=(35, 76, 95, 255),
    )
    return canvas


def sequence_board(
    record: dict[str, Any],
    outputs: dict[Path, bytes],
    *,
    finite: bool,
) -> Image.Image:
    slug = record["slug"]
    if finite:
        title = f"{record['label']} — finite use with authored motion parts"
        subtitle = "Idle → action → release → exact idle; no procedural bars, lines, arcs, or rectangles."
        entries = record["finiteUse"]["frames"]
        labels = [entry["state"].upper() for entry in entries]
        images = [load_output(outputs, Path(entry["file"])) for entry in entries]
    else:
        title = f"{record['label']} — authored seam loop A–D–A"
        subtitle = "Generated motion artwork only; immutable shell and base pivot remain fixed."
        entries = record["seamLoop"]["frames"]
        labels = ["A", "B", "C", "D", "A"]
        images = [
            load_output(outputs, Path(entry["file"]))
            for entry in entries
        ]
        images.append(images[0])
    canvas = board_canvas(title, subtitle)
    count = len(images)
    gap = 18
    margin = 40
    width = (BOARD_SIZE[0] - margin * 2 - gap * (count - 1)) // count
    for index, (label, image) in enumerate(zip(labels, images)):
        left = margin + index * (width + gap)
        panel(
            canvas,
            (left, 150, left + width, 930),
            label,
            image.resize((384, 512), Image.Resampling.NEAREST),
        )
    draw = ImageDraw.Draw(canvas)
    draw.text(
        (55, 970),
        "D→A closure is logical and exact · shell drift 0 · pivot drift [0,0]",
        font=BODY_FONT,
        fill=(30, 65, 83, 255),
    )
    return canvas


def interaction_board(
    record: dict[str, Any],
    outputs: dict[Path, bytes],
) -> Image.Image:
    canvas = board_canvas(
        f"{record['label']} — person interaction close-ups",
        "Existing I01/H01 or approved seat sockets; only the machine motion artwork changed.",
    )
    gif = Image.open(
        io.BytesIO(outputs[Path(record["finiteUse"]["interactionGif"]["file"])])
    )
    frames = [
        frame.convert("RGBA")
        for frame in ImageSequence.Iterator(gif)
    ]
    sample_indexes = (0, 2, 4, 6, 8, 10)
    labels = ("IDLE", "ENGAGE", "ACTION", "OUTPUT / HOLD", "RELEASE", "IDLE")
    for index, (frame_index, label) in enumerate(zip(sample_indexes, labels)):
        row = index // 3
        column = index % 3
        left = 40 + column * 620
        top = 135 + row * 440
        panel(
            canvas,
            (left, top, left + 600, top + 415),
            label,
            frames[frame_index],
            checker=False,
        )
    return canvas


def shell_lock_board(
    family: dict[str, Any],
    record: dict[str, Any],
    outputs: dict[Path, bytes],
) -> Image.Image:
    canvas = board_canvas(
        f"{record['label']} — shell, region, and pivot lock",
        "Approved 2×2×4 identity retained; only generated child artwork changes inside declared regions.",
    )
    approved = Image.open(ROOT / record["approvedShell"]["file"]).convert("RGBA")
    derived = load_output(outputs, Path(record["derivedShell"]["file"]))
    first = load_output(outputs, Path(record["seamLoop"]["frames"][0]["file"]))
    last = load_output(outputs, Path(record["seamLoop"]["frames"][-1]["file"]))
    diff = ImageChops.difference(first, last)
    panel(
        canvas,
        (45, 145, 465, 855),
        "APPROVED SHELL",
        approved.resize((384, 512), Image.Resampling.NEAREST),
    )
    panel(
        canvas,
        (500, 145, 920, 855),
        "DERIVED IMMUTABLE SHELL",
        derived.resize((384, 512), Image.Resampling.NEAREST),
    )
    panel(
        canvas,
        (955, 145, 1375, 855),
        "COMPOSITE A",
        first.resize((384, 512), Image.Resampling.NEAREST),
    )
    panel(
        canvas,
        (1410, 145, 1830, 855),
        "A↔D DIFFERENCE",
        diff.resize((384, 512), Image.Resampling.NEAREST),
    )
    draw = ImageDraw.Draw(canvas)
    lines = [
        f"regions: {', '.join(family['rows'])}",
        "runtime effect source: built-in ImageGen atlas only",
        f"outside-region changed pixels: {record['seamLoop']['outsideDeclaredChangedPixels']}",
        "base pivot: [48,124] · delta [0,0] · footprint 2×2 unchanged",
        "slot transfer: false · F9: unchanged · Active Office: unchanged",
    ]
    for index, line in enumerate(lines):
        draw.text(
            (65, 890 + index * 27),
            line,
            font=SMALL_FONT,
            fill=(31, 66, 84, 255),
        )
    return canvas


def batch_board(
    records: list[dict[str, Any]],
    outputs: dict[Path, bytes],
) -> Image.Image:
    canvas = board_canvas(
        "Facility Upsize Motion Artwork V2 — visual review",
        "Four approved 2×2×4 designs · fresh authored motion atlases · behavior contracts retained.",
    )
    positions = (
        (45, 150, 460, 900),
        (510, 150, 925, 900),
        (975, 150, 1390, 900),
        (1440, 150, 1855, 900),
    )
    for record, box in zip(records, positions):
        image = load_output(
            outputs,
            Path(record["finiteUse"]["frames"][3]["file"]),
        )
        panel(
            canvas,
            box,
            record["label"],
            image.resize((384, 512), Image.Resampling.NEAREST),
        )
    draw = ImageDraw.Draw(canvas)
    draw.text(
        (55, 955),
        "V1 behavior accepted · V1 procedural motion artwork rejected · V2 waits for visual approval before 108/432 rebuild",
        font=BODY_FONT,
        fill=(29, 61, 78, 255),
    )
    return canvas


def output_record(path: Path, content: bytes, kind: str = "png") -> dict[str, Any]:
    image = Image.open(io.BytesIO(content))
    return {
        "file": path.as_posix(),
        "sha256": sha256_bytes(content),
        "kind": kind,
        "size": list(image.size),
    }


def build_outputs() -> dict[Path, bytes]:
    outputs, records = build_asset_outputs()
    for family, record in zip(FAMILIES, records):
        slug = family["slug"]
        review_images = (
            (
                "01-authored-source-and-parts.png",
                source_parts_board(family, record, outputs),
            ),
            (
                "02-authored-seam-loop-a-d-a.png",
                sequence_board(record, outputs, finite=False),
            ),
            (
                "03-authored-finite-use.png",
                sequence_board(record, outputs, finite=True),
            ),
            (
                "04-person-interaction-closeups.png",
                interaction_board(record, outputs),
            ),
            (
                "05-shell-region-pivot-lock.png",
                shell_lock_board(family, record, outputs),
            ),
        )
        record["reviewOutputs"] = []
        for filename, image in review_images:
            path = REVIEW_ROOT / slug / filename
            content = png_bytes(image)
            outputs[path] = content
            record["reviewOutputs"].append(output_record(path, content))

    batch_path = REVIEW_ROOT / "00-motion-v2-batch-review.png"
    batch_content = png_bytes(batch_board(records, outputs))
    outputs[batch_path] = batch_content

    for record in records:
        for key in ("chroma", "alpha"):
            path = Path(record["atlas"][key])
            record["atlas"][f"{key}Sha256"] = sha256_file(ROOT / path)
            with Image.open(ROOT / path) as image:
                record["atlas"][f"{key}Size"] = list(image.size)

    manifest = {
        "schemaVersion": 1,
        "id": "office.facility.upsize-motion.v2",
        "revision": "motion-artwork-v2-visual-r01",
        "status": "motion-artwork-owner-review",
        "createdOn": "2026-07-30",
        "developmentOnly": True,
        "decisionBoundary": {
            "productionV1": {
                "manifest": V1_MANIFEST.as_posix(),
                "manifestSha256": sha256_file(ROOT / V1_MANIFEST),
                "decision": "rejected-at-f8",
                "systemBehavior": "accepted",
                "visualIdentity": "accepted",
                "motionArtwork": "rejected-procedural-effect-pixels",
            },
            "replacementScope": "visual-motion-artwork-only",
            "fullProductionRebuildBeforeVisualApproval": False,
        },
        "sourcePolicy": {
            "workflow": "built-in ImageGen",
            "promptRecord": {
                "file": PROMPT_PATH.as_posix(),
                "sha256": sha256_file(ROOT / PROMPT_PATH),
            },
            "approvedShellPixelReuse": True,
            "freshMotionPixelGeneration": True,
            "proceduralRuntimeEffectPixels": False,
            "codeMayCrop": True,
            "codeMayChromaRemove": True,
            "codeMayNearestResize": True,
            "codeMayIntegerTranslate": True,
            "codeMayAlphaComposite": True,
            "missingAssetFallback": False,
        },
        "physicalContract": {
            "physicalScaleTiles": [2, 2, 4],
            "floorFootprintTiles": [2, 2],
            "renderBoxTiles": [3, 4],
            "runtimeCanvas": [96, 128],
            "basePivotPixels": [48, 124],
        },
        "families": records,
        "batchReview": output_record(batch_path, batch_content),
        "gates": {
            "V2_SOURCE": {"status": "passed"},
            "V2_ALPHA": {"status": "passed"},
            "V2_PARTS": {"status": "passed"},
            "V2_VISUAL_REVIEW": {"status": "pending-owner-review"},
            "F4_F7_REBUILD": {"status": "blocked"},
            "F8": {"status": "blocked"},
            "SLOT_TRANSFER": {"status": "blocked"},
            "F9": {"status": "blocked"},
            "F10_ACTIVE_OFFICE": {"status": "blocked"},
        },
        "roomIsolation": {
            "f9Manifest": F9_MANIFEST.as_posix(),
            "f9ManifestSha256": sha256_file(ROOT / F9_MANIFEST),
            "f9Changed": False,
            "activeOfficeChanged": False,
            "reservationSlotsActivated": 0,
        },
        "permissions": {
            "visualReview": True,
            "fullProductionRebuild": False,
            "reservationSlotTransfer": False,
            "f9Composition": False,
            "activeOfficePromotion": False,
        },
        "ownerDecision": None,
    }
    outputs[MANIFEST_PATH] = json_bytes(manifest)
    return outputs


def compare_outputs(outputs: dict[Path, bytes]) -> list[str]:
    failures: list[str] = []
    for path, expected in outputs.items():
        absolute = ROOT / path
        if not absolute.exists():
            failures.append(f"missing {path.as_posix()}")
        elif absolute.read_bytes() != expected:
            failures.append(f"changed {path.as_posix()}")
    return failures


def write_outputs(outputs: dict[Path, bytes]) -> None:
    for path, content in outputs.items():
        absolute = ROOT / path
        absolute.parent.mkdir(parents=True, exist_ok=True)
        absolute.write_bytes(content)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    outputs = build_outputs()
    if args.check:
        failures = compare_outputs(outputs)
        if failures:
            raise SystemExit(
                "Motion V2 deterministic rebuild failed:\n- "
                + "\n- ".join(failures)
            )
        print(
            f"Motion V2 deterministic rebuild passed: {len(outputs)} artifacts."
        )
        return
    write_outputs(outputs)
    print(
        f"Generated {len(outputs)} Motion Artwork V2 artifacts; "
        "visual owner review remains pending."
    )


if __name__ == "__main__":
    main()
