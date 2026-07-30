"""Build Office Facility Integrated Shell V3 assets and review evidence."""

from __future__ import annotations

import argparse
import io
import json
import sys
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

import office_facility_upsize_motion_v2_assets as motion_v2
import office_facility_upsize_shell_v3_assets as shell_v3
from office_facility_art import font as facility_font
from office_facility_art import sha256_file as normalized_sha256_file


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = Path(
    "assets/game/manifests/office-facility-upsize-shell-v3.json"
)
MOTION_MANIFEST = Path(
    "assets/game/manifests/office-facility-upsize-motion-v2.json"
)
F9_MANIFEST = Path(
    "assets/game/manifests/office-furniture-only-f9-v1.json"
)
PROMPT_RECORD = (
    shell_v3.SOURCE_ROOT / "source" / "IMAGEGEN_PROMPTS.md"
)
BOARD_SIZE = (1900, 1050)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return facility_font(size, bold=bold)


def new_board(title: str, subtitle: str) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    board = Image.new("RGBA", BOARD_SIZE, (241, 245, 249, 255))
    draw = ImageDraw.Draw(board)
    draw.rectangle((0, 0, BOARD_SIZE[0], 112), fill=(18, 27, 39, 255))
    draw.text((42, 24), title, font=font(34, True), fill=(248, 250, 252, 255))
    draw.text((44, 70), subtitle, font=font(18), fill=(163, 230, 240, 255))
    return board, draw


def checker_panel(size: tuple[int, int]) -> Image.Image:
    panel = Image.new("RGBA", size, (240, 244, 248, 255))
    draw = ImageDraw.Draw(panel)
    cell = 16
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            fill = (224, 231, 238, 255) if (x // cell + y // cell) % 2 else (
                245, 248, 251, 255
            )
            draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=fill)
    return panel


def framed_sprite(
    image: Image.Image,
    size: tuple[int, int],
    scale: int,
) -> Image.Image:
    panel = checker_panel(size)
    sprite = image.resize(
        (image.width * scale, image.height * scale),
        Image.Resampling.NEAREST,
    )
    x = (size[0] - sprite.width) // 2
    y = (size[1] - sprite.height) // 2
    panel.alpha_composite(sprite, (x, y))
    return panel


def paste_card(
    board: Image.Image,
    draw: ImageDraw.ImageDraw,
    image: Image.Image,
    box: tuple[int, int, int, int],
    label: str,
    note: str = "",
) -> None:
    left, top, right, bottom = box
    draw.rounded_rectangle(
        box,
        radius=18,
        fill=(255, 255, 255, 255),
        outline=(191, 202, 214, 255),
        width=2,
    )
    available = (right - left - 24, bottom - top - 76)
    visual = image.copy()
    visual.thumbnail(available, Image.Resampling.NEAREST)
    board.alpha_composite(
        visual,
        (
            left + (right - left - visual.width) // 2,
            top + 14 + (available[1] - visual.height) // 2,
        ),
    )
    draw.text((left + 16, bottom - 52), label, font=font(19, True), fill=(20, 31, 43, 255))
    if note:
        draw.text((left + 16, bottom - 27), note, font=font(14), fill=(79, 96, 112, 255))


def batch_board(records: list[dict[str, Any]]) -> Image.Image:
    board, draw = new_board(
        "Office Facility Integrated Shell V3",
        "Fresh ImageGen shells wrap the approved Motion V2 effects; four-side visual review only",
    )
    colors = ((252, 241, 221), (222, 244, 250), (235, 230, 249), (228, 244, 234))
    for index, record in enumerate(records):
        left = 32 + index * 467
        box = (left, 142, left + 435, 978)
        draw.rounded_rectangle(box, radius=22, fill=colors[index], outline=(137, 151, 166), width=2)
        active = record["_images"]["finite"][3]
        panel = framed_sprite(active, (390, 560), 4)
        board.alpha_composite(panel, (left + 22, 172))
        draw.text((left + 24, 756), record["label"], font=font(25, True), fill=(18, 29, 40))
        draw.text((left + 24, 798), "2x2x4 • 4 authored sides", font=font(17), fill=(45, 67, 84))
        draw.text((left + 24, 830), f"{len(record['effectAuthority']['parts'])} approved effect parts", font=font(17), fill=(45, 67, 84))
        draw.text((left + 24, 862), "shell stable • pivot [48,124]", font=font(17), fill=(45, 67, 84))
        draw.text((left + 24, 914), "OWNER VISUAL REVIEW", font=font(18, True), fill=(163, 78, 29))
    return board


def turnaround_board(record: dict[str, Any]) -> Image.Image:
    board, draw = new_board(
        f"{record['label']} — new four-side shell",
        "Front, left, right, and back are extracted from one retained ImageGen turnaround",
    )
    for index, view_name in enumerate(shell_v3.VIEW_NAMES):
        image = record["_images"]["views"][view_name]
        left = 34 + index * 466
        paste_card(
            board,
            draw,
            framed_sprite(image, (410, 650), 5),
            (left, 142, left + 432, 930),
            view_name.upper(),
            "96x128 runtime • common base pivot",
        )
    draw.text(
        (42, 970),
        "Source pixels: built-in ImageGen → chroma removal → crop → nearest resize → integer placement",
        font=font(18),
        fill=(49, 67, 84),
    )
    return board


def seam_board(record: dict[str, Any]) -> Image.Image:
    board, draw = new_board(
        f"{record['label']} — shell/effect seam loop",
        "The new shell is byte-stable while only approved effect regions advance A → B → C → D → A",
    )
    frames = record["_images"]["seam"]
    sequence = frames + frames[:1]
    labels = ("A", "B", "C", "D", "A return")
    for index, (frame, label) in enumerate(zip(sequence, labels)):
        left = 25 + index * 375
        paste_card(
            board,
            draw,
            framed_sprite(frame, (330, 690), 4),
            (left, 145, left + 350, 920),
            label,
            "outside-region changes: 0",
        )
    draw.text(
        (42, 970),
        "No shell pixels, base pivot, footprint, or machine-local sockets move between frames.",
        font=font(18),
        fill=(49, 67, 84),
    )
    return board


def finite_board(record: dict[str, Any]) -> Image.Image:
    board, draw = new_board(
        f"{record['label']} — finite use sequence",
        "Six accepted behavior states are re-skinned with the new shell and return to the exact initial idle image",
    )
    frames = record["_images"]["finite"]
    states = record["finiteUse"]["states"]
    for index, (frame, state) in enumerate(zip(frames, states)):
        left = 20 + index * 312
        paste_card(
            board,
            draw,
            framed_sprite(frame, (275, 670), 4),
            (left, 145, left + 292, 920),
            f"{index:02d} {state}",
            "exact idle return" if index == 5 else "approved V2 timing",
        )
    return board


def interaction_board(
    family: dict[str, Any],
    record: dict[str, Any],
) -> Image.Image:
    board, draw = new_board(
        f"{record['label']} — person interaction",
        "Existing I01/H01 or seat sockets are reused; the shell change does not create new hand or seat coordinates",
    )
    frames = shell_v3.interaction_frames(
        family,
        record["_images"]["finite"],
        record["_images"]["foreground"],
    )
    for card_index, frame_index in enumerate((0, 2, 4, 7)):
        row = card_index // 2
        column = card_index % 2
        left = 42 + column * 920
        top = 145 + row * 415
        paste_card(
            board,
            draw,
            frames[frame_index],
            (left, top, left + 860, top + 375),
            ("approach", "engage", "active", "release")[card_index],
            "existing spatial authority",
        )
    return board


def geometry_board(
    family: dict[str, Any],
    record: dict[str, Any],
) -> Image.Image:
    board, draw = new_board(
        f"{record['label']} — authored layers and geometry lock",
        "Rear shell → approved moving parts → authored shell foreground; 2x2 footprint and [48,124] pivot remain unchanged",
    )
    shell = record["_images"]["views"]["front"]
    foreground = record["_images"]["foreground"]
    active = record["_images"]["finite"][3]
    panels = (
        ("rear shell", shell),
        ("foreground mask", foreground),
        ("integrated active", active),
    )
    for index, (label, image) in enumerate(panels):
        left = 35 + index * 465
        paste_card(
            board,
            draw,
            framed_sprite(image, (410, 620), 4),
            (left, 145, left + 430, 870),
            label,
            "authored source pixels only",
        )

    diagram = Image.new("RGBA", (390, 620), (250, 252, 254, 255))
    d = ImageDraw.Draw(diagram)
    origin_x, origin_y = 48, 54
    scale = 6
    preview = active.resize((active.width * scale, active.height * scale), Image.Resampling.NEAREST)
    preview.thumbnail((370, 490), Image.Resampling.NEAREST)
    diagram.alpha_composite(preview, ((390 - preview.width) // 2, 12))
    for role, region in family["regions"].items():
        left, top, right, bottom = region
        ratio_x = preview.width / shell_v3.RUNTIME_SIZE[0]
        ratio_y = preview.height / shell_v3.RUNTIME_SIZE[1]
        x0 = (390 - preview.width) // 2 + round(left * ratio_x)
        y0 = 12 + round(top * ratio_y)
        x1 = (390 - preview.width) // 2 + round(right * ratio_x)
        y1 = 12 + round(bottom * ratio_y)
        d.rectangle((x0, y0, x1, y1), outline=(242, 112, 38, 255), width=2)
        d.text((x0 + 3, y0 + 2), role, font=font(13, True), fill=(242, 112, 38, 255))
    d.ellipse(
        (
            (390 - preview.width) // 2 + round(48 * preview.width / 96) - 5,
            12 + round(124 * preview.height / 128) - 5,
            (390 - preview.width) // 2 + round(48 * preview.width / 96) + 5,
            12 + round(124 * preview.height / 128) + 5,
        ),
        fill=(15, 171, 189, 255),
    )
    d.text((26, 520), "physical: 2×2×4 tiles", font=font(19, True), fill=(23, 43, 59))
    d.text((26, 554), "runtime: 96×128 px", font=font(17), fill=(53, 72, 89))
    d.text((26, 584), "pivot: [48,124] • delta [0,0]", font=font(17), fill=(53, 72, 89))
    paste_card(
        board,
        draw,
        diagram,
        (1430, 145, 1860, 870),
        "declared regions",
        "orange boxes • cyan pivot",
    )
    draw.text(
        (42, 930),
        "Visible-pixel rule: no ImageDraw or runtime shape generation in the asset compositor.",
        font=font(19, True),
        fill=(147, 58, 31),
    )
    return board


def review_outputs(
    records: list[dict[str, Any]],
) -> tuple[dict[Path, bytes], list[dict[str, Any]], dict[str, Any]]:
    outputs: dict[Path, bytes] = {}
    batch_path = shell_v3.REVIEW_ROOT / "00-shell-v3-batch-review.png"
    batch_content = motion_v2.png_bytes(batch_board(records))
    outputs[batch_path] = batch_content
    batch_record = {
        "file": batch_path.as_posix(),
        "sha256": motion_v2.sha256_bytes(batch_content),
        "kind": "png",
        "size": list(BOARD_SIZE),
    }
    all_reviews: list[dict[str, Any]] = []
    for family, record in zip(shell_v3.FAMILIES, records):
        slug = family["slug"]
        boards = (
            ("01-new-shell-four-sides.png", turnaround_board(record)),
            ("02-integrated-seam-a-d-a.png", seam_board(record)),
            ("03-integrated-finite-use.png", finite_board(record)),
            ("04-person-interaction.png", interaction_board(family, record)),
            ("05-layers-regions-pivot.png", geometry_board(family, record)),
        )
        artifacts: list[dict[str, Any]] = []
        for filename, board in boards:
            path = shell_v3.REVIEW_ROOT / slug / filename
            content = motion_v2.png_bytes(board)
            outputs[path] = content
            artifacts.append(
                {
                    "file": path.as_posix(),
                    "sha256": motion_v2.sha256_bytes(content),
                    "kind": "png",
                    "size": list(BOARD_SIZE),
                }
            )
        for gif_key in ("seamLoop", "finiteUse"):
            gif_record = (
                record[gif_key]["gif"]
                if gif_key == "seamLoop"
                else record[gif_key]["interactionGif"]
            )
            artifacts.append(
                {
                    "file": gif_record["file"],
                    "sha256": gif_record["sha256"],
                    "kind": "gif",
                    "size": gif_record["size"],
                }
            )
        all_reviews.append({"slug": slug, "artifacts": artifacts})
    return outputs, all_reviews, batch_record


def clean_record(record: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in record.items() if key != "_images"}


def build_manifest(
    records: list[dict[str, Any]],
    reviews: list[dict[str, Any]],
    batch_review: dict[str, Any],
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "id": "office.facility.upsize-shell.v3",
        "revision": "integrated-shell-v3-visual-r01",
        "status": "shell-integration-owner-review",
        "createdOn": "2026-07-30",
        "developmentOnly": True,
        "decisionBoundary": {
            "motionV2": {
                "manifest": MOTION_MANIFEST.as_posix(),
                "manifestSha256": normalized_sha256_file(ROOT / MOTION_MANIFEST),
                "effects": "accepted",
                "shellIntegration": "rejected-at-owner-review",
            },
            "replacementScope": "fresh-shell-pixels-and-integration-only",
            "approvedEffectRegeneration": False,
            "fullProductionRebuildBeforeVisualApproval": False,
        },
        "sourcePolicy": {
            "workflow": "built-in ImageGen",
            "promptRecord": {
                "file": PROMPT_RECORD.as_posix(),
                "sha256": normalized_sha256_file(ROOT / PROMPT_RECORD),
            },
            "oldShellPixelReuse": False,
            "approvedMotionV2EffectReuse": True,
            "freshShellPixelGeneration": True,
            "proceduralRuntimeShellPixels": False,
            "proceduralRuntimeEffectPixels": False,
            "codeMayCrop": True,
            "codeMayChromaRemove": True,
            "codeMayNearestResize": True,
            "codeMayIntegerTranslate": True,
            "codeMayAlphaMask": True,
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
        "families": [clean_record(record) for record in records],
        "reviews": reviews,
        "batchReview": batch_review,
        "gates": {
            "V3_SOURCE": {"status": "passed"},
            "V3_ALPHA": {"status": "passed"},
            "V3_FOUR_SIDES": {"status": "passed"},
            "V3_EFFECT_INTEGRATION": {"status": "passed"},
            "V3_VISUAL_REVIEW": {"status": "pending-owner-review"},
            "F4_F7_REBUILD": {"status": "blocked"},
            "F8": {"status": "blocked"},
            "SLOT_TRANSFER": {"status": "blocked"},
            "F9": {"status": "blocked"},
            "F10_ACTIVE_OFFICE": {"status": "blocked"},
        },
        "roomIsolation": {
            "f9Manifest": F9_MANIFEST.as_posix(),
            "f9ManifestSha256": normalized_sha256_file(ROOT / F9_MANIFEST),
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


def build_outputs() -> dict[Path, bytes]:
    asset_outputs, records = shell_v3.build_asset_outputs()
    review_files, reviews, batch_review = review_outputs(records)
    outputs = {**asset_outputs, **review_files}
    manifest = build_manifest(records, reviews, batch_review)
    outputs[MANIFEST_PATH] = (
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    ).encode("utf-8")
    return outputs


def write_outputs(outputs: dict[Path, bytes]) -> None:
    for path, content in outputs.items():
        destination = ROOT / path
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(content)


def check_outputs(outputs: dict[Path, bytes]) -> list[str]:
    issues: list[str] = []
    for path, expected in outputs.items():
        destination = ROOT / path
        if not destination.exists():
            issues.append(f"missing generated artifact: {path.as_posix()}")
        elif destination.read_bytes() != expected:
            issues.append(f"generated artifact drift: {path.as_posix()}")
    return issues


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    outputs = build_outputs()
    if args.check:
        issues = check_outputs(outputs)
        if issues:
            for issue in issues:
                print(issue, file=sys.stderr)
            raise SystemExit(1)
        print(f"Shell V3 deterministic rebuild passed: {len(outputs)} artifacts.")
        return
    write_outputs(outputs)
    print(
        f"Generated {len(outputs)} Shell V3 artifacts; "
        "visual owner review remains pending."
    )


if __name__ == "__main__":
    main()
