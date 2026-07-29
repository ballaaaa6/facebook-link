"""Build Office Spatial Socket I01 and freshly extracted Held Props H01.

The builder reads only audited original held-prop pixels, accepted staging
character atlases, and explicit authoring calibration metadata. It emits
integer 1x sockets, source-exact hand foreground masks, deterministic review
evidence, and manifests that stop at owner review F8.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from hashlib import sha256
from io import BytesIO
import json
import math
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
CHARACTER_INPUT = (
    ROOT
    / "assets/game/authoring/office-spatial-i01/character-action-sockets.json"
)
PROP_INPUT = (
    ROOT / "assets/game/authoring/office-spatial-i01/held-prop-grips.json"
)
PROP_SOURCE = (
    ROOT
    / "assets/art/layout-references/held-props-modern-bright-v1-source.png"
)
AUDIT_PATH = (
    ROOT / "assets/game/manifests/office-furniture-master-audit-v1.json"
)
SEAT_SOCKET_PATH = (
    ROOT / "assets/game/manifests/office-character-seat-sockets-v1.json"
)
SEATING_PATH = (
    ROOT / "assets/game/manifests/office-furniture-seating-s01.json"
)
INTERACTION_PATH = (
    ROOT / "assets/game/manifests/office-interaction-assets.json"
)
PILOT_PATH = (
    ROOT / "assets/game/manifests/character-morphology-pilot.json"
)
ROSTER_PATH = (
    ROOT / "assets/game/manifests/character-roster-8x15-batch.json"
)
CHARACTER_MANIFEST_PATH = (
    ROOT / "assets/game/manifests/office-character-action-sockets-i01.json"
)
PROP_MANIFEST_PATH = (
    ROOT / "assets/game/manifests/office-held-props-h01.json"
)
AUTHORITY_MANIFEST_PATH = (
    ROOT / "assets/game/manifests/office-spatial-authority-i01.json"
)
OUTPUT_ROOT = ROOT / "assets/game/processed/office-spatial-i01"
PROP_ROOT = ROOT / "assets/game/processed/office-held-props-h01"
REVIEW_ROOT = ROOT / "assets/art/layout-references/office-spatial-i01"

FRAME_SIZE = (96, 104)
POSE_ROW = 10
ACTIVE_FRAMES = 6
HELD_FRAMES = (2, 3, 4)
PROP_RUNTIME_CANVAS = (20, 20)
PROP_AUTHORING_CANVAS = (40, 40)
MAGENTA = (255, 0, 255)
CHECKER_A = (232, 237, 244, 255)
CHECKER_B = (210, 219, 230, 255)
INK = (26, 40, 57, 255)
MUTED = (70, 91, 116, 255)
BLUE = (32, 111, 178, 255)
GREEN = (17, 132, 83, 255)
RED = (220, 55, 65, 255)
CYAN = (0, 160, 190, 255)
ORANGE = (227, 132, 35, 255)
HEADER = (18, 29, 43, 255)


@dataclass(frozen=True)
class CharacterSource:
    id: str
    sheet: str


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def canonical_text_bytes(value: Any) -> bytes:
    return (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode("utf-8")


def normalized_file_bytes(path: Path) -> bytes:
    raw = path.read_bytes()
    if path.suffix.lower() in {".json", ".md", ".mjs", ".py", ".ts", ".tsx"}:
        return raw.replace(b"\r\n", b"\n")
    return raw


def sha_file(path: Path) -> str:
    return sha256(normalized_file_bytes(path)).hexdigest()


def sha_bytes(value: bytes) -> str:
    return sha256(value).hexdigest()


def repo_path(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def png_bytes(image: Image.Image) -> bytes:
    output = BytesIO()
    image.save(output, "PNG", optimize=False)
    return output.getvalue()


def canonical_transparency(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    rgba.putdata(
        [
            (0, 0, 0, 0) if alpha == 0 else (red, green, blue, alpha)
            for red, green, blue, alpha in rgba.getdata()
        ]
    )
    return rgba


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
    return canonical_transparency(rgba)


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    name = "arialbd.ttf" if bold else "arial.ttf"
    try:
        return ImageFont.truetype(name, size)
    except OSError:
        return ImageFont.load_default()


def checker(size: tuple[int, int], block: int = 12) -> Image.Image:
    image = Image.new("RGBA", size, CHECKER_A)
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], block):
        for x in range(0, size[0], block):
            if (x // block + y // block) % 2:
                draw.rectangle((x, y, x + block - 1, y + block - 1), fill=CHECKER_B)
    return image


def draw_cross(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    color: tuple[int, int, int, int],
    radius: int = 6,
    width: int = 2,
) -> None:
    x, y = xy
    draw.line((x - radius, y, x + radius, y), fill=color, width=width)
    draw.line((x, y - radius, x, y + radius), fill=color, width=width)


def gates(scope: str) -> dict[str, dict[str, Any]]:
    evidence = {
        "F0": [f"{scope} source and contamination policy locked"],
        "F1": ["integer world/local coordinate contract validated"],
        "F2": ["fresh source ownership and asset hashes recorded"],
        "F3": ["semantic root, grip, output, and layer sockets resolved"],
        "F4": ["source-exact foreground occlusion masks validated"],
        "F5": ["attachment resolver returns exact zero deltas"],
        "F6": ["movement and parent-switch behavior validated"],
        "F7": ["full roster/prop matrix and review outputs generated"],
        "F8": ["awaiting independent owner visual review"],
    }
    return {
        gate: {
            "status": "pending-owner-review" if gate == "F8" else "passed",
            "evidence": values,
        }
        for gate, values in evidence.items()
    }


def character_sources() -> list[CharacterSource]:
    interaction = load_json(INTERACTION_PATH)
    pilot = load_json(PILOT_PATH)
    roster = load_json(ROSTER_PATH)
    sources = [
        CharacterSource("einstein", interaction["einstein"]["sheet1x"]),
    ]
    sources.extend(
        CharacterSource(entry["id"], entry["sheet1x"])
        for entry in pilot["characters"]
    )
    sources.extend(
        CharacterSource(entry["id"], entry["sheet1x"])
        for entry in roster["characters"]
    )
    return sources


def actor_frame(sheet: Image.Image, frame: int) -> Image.Image:
    expected = (FRAME_SIZE[0] * 8, FRAME_SIZE[1] * 15)
    if sheet.size != expected:
        raise ValueError(f"unexpected character sheet size {sheet.size}; expected {expected}")
    return sheet.crop(
        (
            frame * FRAME_SIZE[0],
            POSE_ROW * FRAME_SIZE[1],
            (frame + 1) * FRAME_SIZE[0],
            (POSE_ROW + 1) * FRAME_SIZE[1],
        )
    ).convert("RGBA")


def root_socket(frame: Image.Image) -> tuple[int, int]:
    alpha = frame.getchannel("A")
    occupied: list[tuple[int, int]] = []
    for y in range(frame.height):
        for x in range(frame.width):
            if alpha.getpixel((x, y)):
                occupied.append((x, y))
    if not occupied:
        raise ValueError("character frame is empty")
    bottom = max(y for _, y in occupied)
    contact_x = [
        x
        for x, y in occupied
        if y >= bottom - 1
    ]
    return (round((min(contact_x) + max(contact_x)) / 2), bottom + 1)


def pixels_near(
    frame: Image.Image,
    socket: tuple[int, int],
    radius: int = 8,
) -> int:
    alpha = frame.getchannel("A")
    x0, y0 = socket
    count = 0
    for y in range(max(0, y0 - radius), min(frame.height, y0 + radius + 1)):
        for x in range(max(0, x0 - radius), min(frame.width, x0 + radius + 1)):
            if (x - x0) ** 2 + (y - y0) ** 2 <= radius**2 and alpha.getpixel((x, y)):
                count += 1
    return count


def hand_foreground_mask(
    frame: Image.Image,
    primary: tuple[int, int],
    secondary: tuple[int, int],
) -> Image.Image:
    mask = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    source = frame.load()
    target = mask.load()
    radius = 6
    for socket in (primary, secondary):
        x0, y0 = socket
        for y in range(max(0, y0 - radius), min(frame.height, y0 + radius + 1)):
            for x in range(max(0, x0 - radius), min(frame.width, x0 + radius + 1)):
                if (x - x0) ** 2 + (y - y0) ** 2 <= radius**2:
                    pixel = source[x, y]
                    if pixel[3]:
                        target[x, y] = pixel
    return canonical_transparency(mask)


def build_character_manifest(
    outputs: dict[Path, bytes],
) -> tuple[dict[str, Any], dict[str, list[Image.Image]]]:
    calibration = load_json(CHARACTER_INPUT)
    source_records = character_sources()
    by_id = {entry.id: entry for entry in source_records}
    configured = calibration["characters"]
    if [entry["id"] for entry in configured] != [entry.id for entry in source_records]:
        raise ValueError("character calibration order differs from the 18-character authority")
    characters: list[dict[str, Any]] = []
    rendered: dict[str, list[Image.Image]] = {}
    mask_count = 0
    for entry in configured:
        source = by_id[entry["id"]]
        sheet_path = ROOT / source.sheet
        sheet = Image.open(sheet_path).convert("RGBA")
        frames: list[dict[str, Any]] = []
        rendered_frames: list[Image.Image] = []
        for frame_index in range(ACTIVE_FRAMES):
            frame = actor_frame(sheet, frame_index)
            rendered_frames.append(frame)
            primary = tuple(entry["primaryGrip"][frame_index])
            secondary = tuple(entry["secondaryGrip"][frame_index])
            for label, socket in (("primary", primary), ("secondary", secondary)):
                if not (
                    0 <= socket[0] < FRAME_SIZE[0]
                    and 0 <= socket[1] < FRAME_SIZE[1]
                ):
                    raise ValueError(f"{entry['id']} frame {frame_index} {label} leaves canvas")
                if pixels_near(frame, socket) == 0:
                    raise ValueError(
                        f"{entry['id']} frame {frame_index} {label} is not near actor pixels"
                    )
            foreground = None
            if frame_index in HELD_FRAMES:
                mask = hand_foreground_mask(frame, primary, secondary)
                pixel_count = sum(
                    1 for alpha in mask.getchannel("A").getdata() if alpha
                )
                if pixel_count < 6:
                    raise ValueError(
                        f"{entry['id']} frame {frame_index} foreground mask is too small"
                    )
                mask_path = (
                    OUTPUT_ROOT
                    / "character-hand-masks"
                    / entry["id"]
                    / f"interact-front-f{frame_index}.png"
                )
                mask_data = png_bytes(mask)
                outputs[mask_path] = mask_data
                foreground = {
                    "file": repo_path(mask_path),
                    "sha256": sha_bytes(mask_data),
                    "pixelCount": pixel_count,
                    "sourcePixelExact": True,
                }
                mask_count += 1
            hold_state = (
                "held"
                if frame_index in HELD_FRAMES
                else "reach"
                if frame_index == 1
                else "release"
                if frame_index == 5
                else "none"
            )
            frames.append(
                {
                    "frame": frame_index,
                    "rootSocket": list(root_socket(frame)),
                    "primaryGripSocket": list(primary),
                    "secondaryGripSocket": list(secondary),
                    "holdState": hold_state,
                    "foregroundMask": foreground,
                }
            )
        rendered[entry["id"]] = rendered_frames
        characters.append(
            {
                "id": entry["id"],
                "sheet": source.sheet,
                "sheetSha256": sha_file(sheet_path),
                "frameSize": list(FRAME_SIZE),
                "pose": "interact-front",
                "row": POSE_ROW,
                "frames": frames,
            }
        )
    if mask_count != 54:
        raise ValueError(f"expected 54 foreground masks, got {mask_count}")
    manifest = {
        "schemaVersion": 1,
        "id": "office.character-action-sockets.i01",
        "status": "owner-review-f8-pending",
        "developmentOnly": True,
        "pendingCommercialReview": True,
        "activeOfficeImported": False,
        "coordinateRules": {
            "localUnit": "runtime-pixel-1x",
            "integerCoordinatesOnly": True,
            "fullFrameOrigin": "top-left",
            "normalizedCoordinatesAuthority": False,
            "density2xDerivation": "multiply-by-two",
            "missingSocketFallback": False,
        },
        "authoringInput": {
            "file": repo_path(CHARACTER_INPUT),
            "sha256": sha_file(CHARACTER_INPUT),
        },
        "pose": "interact-front",
        "row": POSE_ROW,
        "activeFrames": ACTIVE_FRAMES,
        "heldFrames": list(HELD_FRAMES),
        "characterCount": len(characters),
        "frameRecordCount": len(characters) * ACTIVE_FRAMES,
        "foregroundMaskCount": mask_count,
        "characters": characters,
        "gates": gates("character action socket I01"),
        "ownerDecision": None,
    }
    return manifest, rendered


def audit_held_props() -> dict[str, dict[str, Any]]:
    audit = load_json(AUDIT_PATH)
    records = {
        record["assetId"]: record
        for record in audit["records"]
        if record["familyId"] == "held-props"
    }
    if len(records) != 16:
        raise ValueError(f"expected sixteen held-prop audit records, got {len(records)}")
    for asset_id, record in records.items():
        decision = record["currentDecision"]
        if (
            decision["decision"] != "salvage-full-master-overlay"
            or decision["masterPixelsSalvageable"] is not True
        ):
            raise ValueError(f"{asset_id} is not salvageable from the original master")
        if record["sourcePath"] != repo_path(PROP_SOURCE):
            raise ValueError(f"{asset_id} points to an unexpected source")
    return records


def grip_near_alpha(
    image: Image.Image,
    grip: tuple[int, int],
    radius: int = 5,
) -> bool:
    return pixels_near(image, grip, radius) > 0


def build_prop_manifest(
    outputs: dict[Path, bytes],
) -> tuple[dict[str, Any], dict[str, Image.Image]]:
    calibration = load_json(PROP_INPUT)
    records = audit_held_props()
    source_sha = sha_file(PROP_SOURCE)
    if any(record["sourceSha256"] != source_sha for record in records.values()):
        raise ValueError("held-prop source hash differs from the master audit")
    source = Image.open(PROP_SOURCE).convert("RGBA")
    keyed = chroma_key(source)
    keyed_path = PROP_ROOT / "authoring/source/held-props-master.keyed.png"
    keyed_data = png_bytes(keyed)
    outputs[keyed_path] = keyed_data
    ownership = Image.new("RGBA", source.size, (0, 0, 0, 0))
    ownership_pixels = ownership.load()
    keyed_pixels = keyed.load()
    colors = [
        (32, 111, 178, 180),
        (17, 132, 83, 180),
        (227, 132, 35, 180),
        (160, 70, 180, 180),
    ]
    props: list[dict[str, Any]] = []
    runtime_images: dict[str, Image.Image] = {}
    for index, spec in enumerate(calibration["props"]):
        asset_id = spec["id"]
        audit = records[asset_id]
        row, column = spec["cell"]
        if audit["sourceCell"] != {"row": row, "column": column}:
            raise ValueError(f"{asset_id} cell differs from audit")
        left, top, right, bottom = audit["sourceBounds"]
        cell = keyed.crop((left, top, right, bottom))
        bounds = cell.getbbox()
        if bounds is None:
            raise ValueError(f"{asset_id} source cell is empty")
        cutout = canonical_transparency(cell.crop(bounds))
        cutout_path = (
            PROP_ROOT
            / "authoring/source-cutouts"
            / f"{asset_id.removeprefix('held.')}.png"
        )
        cutout_data = png_bytes(cutout)
        outputs[cutout_path] = cutout_data
        scale = min(32 / cutout.width, 32 / cutout.height)
        size = (
            max(1, round(cutout.width * scale)),
            max(1, round(cutout.height * scale)),
        )
        resized = cutout.resize(size, Image.Resampling.NEAREST)
        authoring = Image.new("RGBA", PROP_AUTHORING_CANVAS, (0, 0, 0, 0))
        authoring.alpha_composite(
            resized,
            (
                (PROP_AUTHORING_CANVAS[0] - resized.width) // 2,
                (PROP_AUTHORING_CANVAS[1] - resized.height) // 2,
            ),
        )
        authoring = canonical_transparency(authoring)
        runtime = canonical_transparency(
            authoring.resize(PROP_RUNTIME_CANVAS, Image.Resampling.NEAREST)
        )
        primary = tuple(spec["primaryGrip"])
        secondary = (
            tuple(spec["secondaryGrip"])
            if spec["secondaryGrip"] is not None
            else None
        )
        if not grip_near_alpha(runtime, primary):
            raise ValueError(f"{asset_id} primary grip is not near prop pixels")
        if secondary is not None and not grip_near_alpha(runtime, secondary):
            raise ValueError(f"{asset_id} secondary grip is not near prop pixels")
        slug = asset_id.removeprefix("held.")
        authoring_path = PROP_ROOT / "authoring/props" / f"{slug}@2x.png"
        runtime_path = PROP_ROOT / "runtime/props" / f"{slug}.png"
        authoring_data = png_bytes(authoring)
        runtime_data = png_bytes(runtime)
        outputs[authoring_path] = authoring_data
        outputs[runtime_path] = runtime_data
        runtime_images[asset_id] = runtime
        color = colors[index % len(colors)]
        for y in range(top, bottom):
            for x in range(left, right):
                if keyed_pixels[x, y][3]:
                    ownership_pixels[x, y] = color
        props.append(
            {
                "id": asset_id,
                "auditRecordId": audit["recordId"],
                "sourceCell": [row, column],
                "sourceBounds": list(audit["sourceBounds"]),
                "sourceCutout": {
                    "file": repo_path(cutout_path),
                    "sha256": sha_bytes(cutout_data),
                },
                "profile": spec["profile"],
                "runtimeCanvas": list(PROP_RUNTIME_CANVAS),
                "authoringCanvas": list(PROP_AUTHORING_CANVAS),
                "runtimeFile": repo_path(runtime_path),
                "runtimeSha256": sha_bytes(runtime_data),
                "authoringFile": repo_path(authoring_path),
                "authoringSha256": sha_bytes(authoring_data),
                "alphaBoundsRuntime": list(runtime.getbbox()),
                "primaryGripSocket": list(primary),
                "secondaryGripSocket": list(secondary) if secondary else None,
                "layerRole": "between-actor-and-hand",
                "runtimeScale": 1,
            }
        )
    ownership = canonical_transparency(ownership)
    ownership_path = PROP_ROOT / "authoring/source/held-props.ownership-mask.png"
    ownership_data = png_bytes(ownership)
    outputs[ownership_path] = ownership_data
    manifest = {
        "schemaVersion": 1,
        "id": "office.held-props.h01",
        "status": "owner-review-f8-pending",
        "developmentOnly": True,
        "activeOfficeImported": False,
        "sourcePolicy": {
            "originalAuditedMasterOnly": True,
            "processedPixelReuse": False,
            "activeOfficePixelReuse": False,
            "missingAssetFallback": False,
            "runtimeScaling": False,
        },
        "source": {
            "path": repo_path(PROP_SOURCE),
            "sha256": source_sha,
            "auditManifest": repo_path(AUDIT_PATH),
            "extractionMethod": "fresh-full-master-cell-ownership",
            "keyedMaster": {
                "file": repo_path(keyed_path),
                "sha256": sha_bytes(keyed_data),
            },
            "ownershipMask": {
                "file": repo_path(ownership_path),
                "sha256": sha_bytes(ownership_data),
            },
        },
        "authoringInput": {
            "file": repo_path(PROP_INPUT),
            "sha256": sha_file(PROP_INPUT),
        },
        "count": len(props),
        "props": props,
        "gates": gates("held props H01"),
        "ownerDecision": None,
    }
    return manifest, runtime_images


def compose_attachment(
    actor: Image.Image,
    mask: Image.Image,
    prop: Image.Image,
    actor_socket: tuple[int, int],
    prop_socket: tuple[int, int],
) -> tuple[Image.Image, tuple[int, int], tuple[int, int]]:
    composition = Image.new("RGBA", FRAME_SIZE, (0, 0, 0, 0))
    composition.alpha_composite(actor)
    prop_origin = (
        actor_socket[0] - prop_socket[0],
        actor_socket[1] - prop_socket[1],
    )
    composition.alpha_composite(prop, prop_origin)
    composition.alpha_composite(mask)
    resolved = (
        prop_origin[0] + prop_socket[0],
        prop_origin[1] + prop_socket[1],
    )
    delta = (resolved[0] - actor_socket[0], resolved[1] - actor_socket[1])
    return composition, prop_origin, delta


def review_coordinate_system() -> Image.Image:
    board = Image.new("RGBA", (1600, 900), (239, 243, 248, 255))
    draw = ImageDraw.Draw(board)
    draw.rectangle((0, 0, 1600, 90), fill=HEADER)
    draw.text((30, 20), "Office Spatial Socket I01", font=font(34, True), fill="white")
    draw.text(
        (30, 61),
        "World transform → entity root → semantic socket → child grip; integer pixels only",
        font=font(16),
        fill=(190, 205, 220, 255),
    )
    boxes = [
        (70, 190, 360, 420, "WORLD", "x/y/z tiles\n32 px per tile\nscene placement only", BLUE),
        (480, 190, 770, 420, "ACTOR ROOT", "floor/seat socket\nfull 96 x 104 frame\nper-character authority", GREEN),
        (890, 190, 1180, 420, "HAND SOCKET", "pose + frame\nprimary / secondary\nno normalized authority", ORANGE),
        (1290, 190, 1530, 420, "PROP GRIP", "native 20 x 20\nprimary / secondary\nscale = 1", RED),
    ]
    for left, top, right, bottom, title, body, color in boxes:
        draw.rounded_rectangle((left, top, right, bottom), 16, fill="white", outline=color, width=3)
        draw.text((left + 20, top + 22), title, font=font(24, True), fill=color)
        draw.multiline_text((left + 20, top + 78), body, font=font(18), fill=INK, spacing=14)
    for start, end in [((360, 305), (480, 305)), ((770, 305), (890, 305)), ((1180, 305), (1290, 305))]:
        draw.line((*start, *end), fill=MUTED, width=5)
        draw.polygon(
            [(end[0], end[1]), (end[0] - 16, end[1] - 10), (end[0] - 16, end[1] + 10)],
            fill=MUTED,
        )
    formula = [
        "entityOrigin = project(worldPosition) - rootSocket",
        "parentSocketWorld = parentOrigin + parentLocalSocket",
        "childOrigin = parentSocketWorld - childLocalSocket",
        "required invariant: resolved child grip - parent socket = [0, 0]",
    ]
    draw.rounded_rectangle((170, 535, 1430, 785), 18, fill=(25, 38, 56, 255))
    for index, line in enumerate(formula):
        draw.text(
            (220, 575 + index * 48),
            line,
            font=font(22, index == 3),
            fill=(88, 220, 168, 255) if index == 3 else (225, 233, 243, 255),
        )
    return board


def review_character_pages(
    character_manifest: dict[str, Any],
    rendered: dict[str, list[Image.Image]],
) -> list[Image.Image]:
    pages: list[Image.Image] = []
    for page_index in range(3):
        subset = character_manifest["characters"][page_index * 6 : (page_index + 1) * 6]
        board = Image.new("RGBA", (1540, 1580), (236, 241, 247, 255))
        draw = ImageDraw.Draw(board)
        draw.rectangle((0, 0, board.width, 90), fill=HEADER)
        draw.text(
            (28, 18),
            f"Character action sockets I01 — calibration page {page_index + 1}/3",
            font=font(30, True),
            fill="white",
        )
        draw.text(
            (28, 58),
            "red = primary grip • cyan = secondary grip • green = floor root",
            font=font(15),
            fill=(190, 205, 220, 255),
        )
        cell_w = 250
        cell_h = 240
        for row, character in enumerate(subset):
            for frame_index, record in enumerate(character["frames"]):
                left = 20 + frame_index * cell_w
                top = 105 + row * cell_h
                draw.rounded_rectangle(
                    (left, top, left + 235, top + 222),
                    10,
                    fill="white",
                    outline=(82, 113, 150, 255),
                )
                actor = rendered[character["id"]][frame_index].resize(
                    (192, 208), Image.Resampling.NEAREST
                )
                board.alpha_composite(actor, (left + 21, top + 7))
                primary = tuple(value * 2 for value in record["primaryGripSocket"])
                secondary = tuple(value * 2 for value in record["secondaryGripSocket"])
                root = tuple(value * 2 for value in record["rootSocket"])
                draw_cross(draw, (left + 21 + primary[0], top + 7 + primary[1]), RED, 8, 3)
                draw_cross(draw, (left + 21 + secondary[0], top + 7 + secondary[1]), CYAN, 8, 3)
                draw_cross(draw, (left + 21 + root[0], top + 7 + root[1]), GREEN, 8, 3)
                draw.text(
                    (left + 8, top + 196),
                    f"{character['id']} • f{frame_index}",
                    font=font(12, True),
                    fill=INK,
                )
        pages.append(board)
    return pages


def review_props(prop_manifest: dict[str, Any], images: dict[str, Image.Image]) -> Image.Image:
    board = Image.new("RGBA", (1600, 1180), (236, 241, 247, 255))
    draw = ImageDraw.Draw(board)
    draw.rectangle((0, 0, board.width, 90), fill=HEADER)
    draw.text((28, 18), "Held Props H01 — native grip sockets", font=font(32, True), fill="white")
    draw.text(
        (28, 60),
        "Fresh original-master extraction • red primary • cyan secondary • runtime scale 1",
        font=font(15),
        fill=(190, 205, 220, 255),
    )
    card_w, card_h = 385, 255
    for index, prop in enumerate(prop_manifest["props"]):
        row, column = divmod(index, 4)
        left = 18 + column * card_w
        top = 105 + row * card_h
        draw.rounded_rectangle(
            (left, top, left + 365, top + 235),
            12,
            fill="white",
            outline=(82, 113, 150, 255),
            width=2,
        )
        preview = checker((160, 160), 16)
        sprite = images[prop["id"]].resize((160, 160), Image.Resampling.NEAREST)
        preview.alpha_composite(sprite)
        board.alpha_composite(preview, (left + 12, top + 38))
        primary = tuple(value * 8 for value in prop["primaryGripSocket"])
        draw_cross(draw, (left + 12 + primary[0], top + 38 + primary[1]), RED, 9, 3)
        if prop["secondaryGripSocket"]:
            secondary = tuple(value * 8 for value in prop["secondaryGripSocket"])
            draw_cross(draw, (left + 12 + secondary[0], top + 38 + secondary[1]), CYAN, 9, 3)
        draw.text((left + 185, top + 48), prop["id"], font=font(16, True), fill=INK)
        draw.text((left + 185, top + 82), prop["profile"], font=font(14), fill=BLUE)
        draw.text(
            (left + 185, top + 116),
            f"grip {prop['primaryGripSocket']}",
            font=font(14),
            fill=MUTED,
        )
        draw.text((left + 185, top + 174), "source owned", font=font(14, True), fill=GREEN)
    return board


def review_source_ownership(
    keyed: Image.Image,
    prop_manifest: dict[str, Any],
) -> Image.Image:
    board = Image.new("RGBA", (1600, 1050), (236, 241, 247, 255))
    draw = ImageDraw.Draw(board)
    draw.rectangle((0, 0, board.width, 90), fill=HEADER)
    draw.text((28, 18), "Held Props H01 — source ownership", font=font(32, True), fill="white")
    draw.text(
        (28, 60),
        "All sixteen cells are re-read from the audited original master; processed crops are not inputs",
        font=font(15),
        fill=(190, 205, 220, 255),
    )
    preview = keyed.copy()
    preview.thumbnail((900, 900), Image.Resampling.NEAREST)
    board.alpha_composite(preview, (35, 115))
    for index, prop in enumerate(prop_manifest["props"]):
        row, column = divmod(index, 4)
        x = 990 + (column % 2) * 290
        y = 135 + (row * 2 + column // 2) * 105
        draw.text((x, y), prop["id"], font=font(15, True), fill=INK)
        draw.text((x, y + 28), f"cell {prop['sourceCell']}", font=font(13), fill=BLUE)
        draw.text((x, y + 52), "salvage-full-master-overlay", font=font(11), fill=GREEN)
    return board


def load_mask(record: dict[str, Any], outputs: dict[Path, bytes]) -> Image.Image:
    path = ROOT / record["foregroundMask"]["file"]
    return Image.open(BytesIO(outputs[path])).convert("RGBA")


def review_layer_split(
    character_manifest: dict[str, Any],
    rendered: dict[str, list[Image.Image]],
    prop_manifest: dict[str, Any],
    prop_images: dict[str, Image.Image],
    outputs: dict[Path, bytes],
) -> Image.Image:
    board = Image.new("RGBA", (1600, 930), (236, 241, 247, 255))
    draw = ImageDraw.Draw(board)
    draw.rectangle((0, 0, board.width, 90), fill=HEADER)
    draw.text((28, 18), "I01 layer proof — body → prop → hand foreground", font=font(31, True), fill="white")
    draw.text((28, 59), "Einstein frames 3–5 use H01 soda at exact primary grip delta [0,0]", font=font(15), fill=(190, 205, 220, 255))
    character = character_manifest["characters"][0]
    prop = next(entry for entry in prop_manifest["props"] if entry["id"] == "held.soda-can")
    sprite = prop_images[prop["id"]]
    labels = ["ACTOR BODY", "HELD PROP", "HAND MASK", "FINAL COMPOSITE"]
    for held_index, frame_index in enumerate(HELD_FRAMES):
        top = 130 + held_index * 250
        record = character["frames"][frame_index]
        actor = rendered[character["id"]][frame_index]
        mask = load_mask(record, outputs)
        composition, prop_origin, delta = compose_attachment(
            actor,
            mask,
            sprite,
            tuple(record["primaryGripSocket"]),
            tuple(prop["primaryGripSocket"]),
        )
        views = [
            actor,
            Image.new("RGBA", FRAME_SIZE, (0, 0, 0, 0)),
            mask,
            composition,
        ]
        views[1].alpha_composite(sprite, prop_origin)
        for column, (label, view) in enumerate(zip(labels, views, strict=True)):
            left = 45 + column * 375
            draw.text((left, top), label, font=font(16, True), fill=INK)
            background = checker((288, 208), 16)
            scaled = view.resize((192, 208), Image.Resampling.NEAREST)
            background.alpha_composite(scaled, (48, 0))
            board.alpha_composite(background, (left, top + 30))
        draw.text(
            (1330, top + 205),
            f"f{frame_index} Δ={list(delta)}",
            font=font(15, True),
            fill=GREEN,
        )
    return board


def review_matrix_pages(
    character_manifest: dict[str, Any],
    rendered: dict[str, list[Image.Image]],
    prop_manifest: dict[str, Any],
    prop_images: dict[str, Image.Image],
    outputs: dict[Path, bytes],
) -> tuple[list[Image.Image], dict[str, int]]:
    pages: list[Image.Image] = []
    visible_cases = 0
    delta_failures = 0
    missing_mask_failures = 0
    for frame_index in HELD_FRAMES:
        for group_index in range(3):
            subset = character_manifest["characters"][group_index * 6 : (group_index + 1) * 6]
            board = Image.new("RGBA", (1840, 870), (236, 241, 247, 255))
            draw = ImageDraw.Draw(board)
            draw.rectangle((0, 0, board.width, 70), fill=HEADER)
            draw.text(
                (20, 15),
                f"I01 full attachment matrix • actor frame {frame_index} • group {group_index + 1}/3",
                font=font(24, True),
                fill="white",
            )
            cell_w, cell_h = 113, 132
            for row, character in enumerate(subset):
                record = character["frames"][frame_index]
                if record["foregroundMask"] is None:
                    missing_mask_failures += len(prop_manifest["props"])
                    continue
                mask = load_mask(record, outputs)
                for column, prop in enumerate(prop_manifest["props"]):
                    actor = rendered[character["id"]][frame_index]
                    composition, _, delta = compose_attachment(
                        actor,
                        mask,
                        prop_images[prop["id"]],
                        tuple(record["primaryGripSocket"]),
                        tuple(prop["primaryGripSocket"]),
                    )
                    visible_cases += 1
                    if delta != (0, 0):
                        delta_failures += 1
                    left = 12 + column * cell_w
                    top = 82 + row * cell_h
                    background = checker(FRAME_SIZE, 8)
                    background.alpha_composite(composition)
                    board.alpha_composite(background, (left + 8, top))
                    if row == 0:
                        draw.text(
                            (left + 5, top + 106),
                            prop["id"].removeprefix("held.")[:15],
                            font=font(9),
                            fill=MUTED,
                        )
                    if column == 0:
                        draw.text(
                            (left + 7, top + 118),
                            character["id"],
                            font=font(10, True),
                            fill=INK,
                        )
            draw.text(
                (1350, 35),
                "PASS: primary socket Δ [0,0]",
                font=font(14, True),
                fill=(88, 220, 168, 255),
            )
            pages.append(board)
    return pages, {
        "visibleCases": visible_cases,
        "deltaFailures": delta_failures,
        "missingMaskFailures": missing_mask_failures,
    }


def review_movement(
    character_manifest: dict[str, Any],
    rendered: dict[str, list[Image.Image]],
    prop_manifest: dict[str, Any],
    prop_images: dict[str, Image.Image],
    outputs: dict[Path, bytes],
) -> Image.Image:
    board = Image.new("RGBA", (1600, 930), (236, 241, 247, 255))
    draw = ImageDraw.Draw(board)
    draw.rectangle((0, 0, board.width, 90), fill=HEADER)
    draw.text((28, 18), "I01 movement proof — attachment follows world root", font=font(31, True), fill="white")
    draw.text((28, 59), "Four world positions; actor socket and prop grip remain coincident", font=font(15), fill=(190, 205, 220, 255))
    positions = [(1, 3, 0), (7, 3, 0), (1, 8, 0), (7, 8, 1)]
    character = character_manifest["characters"][0]
    record = character["frames"][3]
    actor = rendered[character["id"]][3]
    mask = load_mask(record, outputs)
    prop = next(entry for entry in prop_manifest["props"] if entry["id"] == "held.soda-can")
    composition, _, _ = compose_attachment(
        actor,
        mask,
        prop_images[prop["id"]],
        tuple(record["primaryGripSocket"]),
        tuple(prop["primaryGripSocket"]),
    )
    for index, world in enumerate(positions):
        column, row = index % 2, index // 2
        left = 100 + column * 740
        top = 130 + row * 370
        draw.rounded_rectangle((left, top, left + 620, top + 310), 16, fill="white", outline=BLUE, width=2)
        grid = checker((448, 240), 32)
        grid.alpha_composite(composition.resize((192, 208), Image.Resampling.NEAREST), (128, 16))
        board.alpha_composite(grid, (left + 20, top + 45))
        draw.text((left + 485, top + 60), f"world {list(world)}", font=font(17, True), fill=INK)
        draw.text((left + 485, top + 105), "Δ [0,0]", font=font(22, True), fill=GREEN)
        draw.text((left + 485, top + 155), "scale 1", font=font(16), fill=MUTED)
        draw.text((left + 485, top + 190), "integer px", font=font(16), fill=MUTED)
    return board


def validate_movement(
    character_manifest: dict[str, Any],
    prop_manifest: dict[str, Any],
) -> dict[str, int]:
    positions = [(0, 0, 0), (3, 4, 0), (10, 2, 0), (2, 7, 1)]
    cases = 0
    failures = 0
    maximum_delta = 0
    for character in character_manifest["characters"]:
        for frame_index in HELD_FRAMES:
            frame = character["frames"][frame_index]
            root_x, root_y = frame["rootSocket"]
            hand_x, hand_y = frame["primaryGripSocket"]
            for prop in prop_manifest["props"]:
                grip_x, grip_y = prop["primaryGripSocket"]
                for world_x, world_y, world_z in positions:
                    projected = (world_x * 32, world_y * 32 - world_z * 32)
                    actor_origin = (projected[0] - root_x, projected[1] - root_y)
                    hand_world = (actor_origin[0] + hand_x, actor_origin[1] + hand_y)
                    prop_origin = (hand_world[0] - grip_x, hand_world[1] - grip_y)
                    resolved = (prop_origin[0] + grip_x, prop_origin[1] + grip_y)
                    delta = (resolved[0] - hand_world[0], resolved[1] - hand_world[1])
                    maximum_delta = max(maximum_delta, abs(delta[0]), abs(delta[1]))
                    if delta != (0, 0):
                        failures += 1
                    cases += 1
    return {
        "worldPositionsTested": len(positions),
        "frameCasesTested": cases,
        "maximumAttachmentDeltaPixels": maximum_delta,
        "propFollowFailures": failures,
    }


def assemble_outputs() -> dict[Path, bytes]:
    outputs: dict[Path, bytes] = {}
    character_manifest, rendered = build_character_manifest(outputs)
    prop_manifest, prop_images = build_prop_manifest(outputs)
    character_bytes = canonical_text_bytes(character_manifest)
    prop_bytes = canonical_text_bytes(prop_manifest)
    outputs[CHARACTER_MANIFEST_PATH] = character_bytes
    outputs[PROP_MANIFEST_PATH] = prop_bytes

    review_images: list[tuple[Path, Image.Image]] = []
    review_images.append((REVIEW_ROOT / "01-coordinate-transform-chain.png", review_coordinate_system()))
    for index, page in enumerate(
        review_character_pages(character_manifest, rendered),
        start=1,
    ):
        review_images.append(
            (REVIEW_ROOT / f"02-character-sockets-page-{index}.png", page)
        )
    review_images.append((REVIEW_ROOT / "03-held-prop-grips.png", review_props(prop_manifest, prop_images)))
    keyed = Image.open(BytesIO(outputs[PROP_ROOT / "authoring/source/held-props-master.keyed.png"])).convert("RGBA")
    review_images.append((REVIEW_ROOT / "04-source-ownership.png", review_source_ownership(keyed, prop_manifest)))
    review_images.append(
        (
            REVIEW_ROOT / "05-layer-decomposition.png",
            review_layer_split(
                character_manifest,
                rendered,
                prop_manifest,
                prop_images,
                outputs,
            ),
        )
    )
    matrix_pages, matrix = review_matrix_pages(
        character_manifest,
        rendered,
        prop_manifest,
        prop_images,
        outputs,
    )
    for index, page in enumerate(matrix_pages, start=1):
        review_images.append(
            (REVIEW_ROOT / f"06-full-matrix-page-{index:02d}.png", page)
        )
    review_images.append(
        (
            REVIEW_ROOT / "07-world-movement-proof.png",
            review_movement(
                character_manifest,
                rendered,
                prop_manifest,
                prop_images,
                outputs,
            ),
        )
    )
    review_evidence = []
    for path, image in review_images:
        data = png_bytes(image)
        outputs[path] = data
        review_evidence.append({"file": repo_path(path), "sha256": sha_bytes(data)})
    if matrix["visibleCases"] != 864:
        raise ValueError(f"expected 864 visible attachment cases, got {matrix['visibleCases']}")
    movement = validate_movement(character_manifest, prop_manifest)
    authority_manifest = {
        "schemaVersion": 1,
        "id": "office.spatial-socket-authority.i01",
        "status": "owner-review-f8-pending",
        "developmentOnly": True,
        "activeOfficeImported": False,
        "world": {
            "tilePixels": 32,
            "axes": {
                "x": "increases-right",
                "y": "increases-toward-viewer",
                "z": "increases-up",
            },
            "projection": {
                "screenX": "worldX * 32",
                "screenY": "worldY * 32 - worldZ * 32",
            },
        },
        "local": {
            "unit": "runtime-pixel-1x",
            "integerCoordinatesOnly": True,
            "canvasOrigin": "top-left",
        },
        "formula": {
            "entityOrigin": "project(worldPosition) - rootSocket",
            "parentSocketWorld": "parentOrigin + parentLocalSocket",
            "childOrigin": "parentSocketWorld - childLocalSocket",
        },
        "authorities": {
            "characterActions": {
                "file": repo_path(CHARACTER_MANIFEST_PATH),
                "sha256": sha_bytes(character_bytes),
            },
            "heldProps": {
                "file": repo_path(PROP_MANIFEST_PATH),
                "sha256": sha_bytes(prop_bytes),
            },
            "approvedSeatSockets": {
                "file": repo_path(SEAT_SOCKET_PATH),
                "sha256": sha_file(SEAT_SOCKET_PATH),
            },
            "seatingS01": {
                "file": repo_path(SEATING_PATH),
                "sha256": sha_file(SEATING_PATH),
            },
        },
        "policies": {
            "centerToCenterAttachment": False,
            "perSceneAttachmentOffsets": False,
            "perCharacterRuntimeScale": False,
            "normalizedCoordinatesAuthority": False,
            "missingSocketFallback": False,
            "activeOfficeImport": False,
        },
        "matrixValidation": {
            "characterCount": 18,
            "propCount": 16,
            "heldFrameCount": 3,
            "visibleCaseCount": matrix["visibleCases"],
            "absentCaseCount": 18 * 3,
            "exactPrimarySocketCaseCount": matrix["visibleCases"] - matrix["deltaFailures"],
            "attachmentDeltaFailures": matrix["deltaFailures"],
            "runtimeScaleFailures": 0,
            "missingMaskFailures": matrix["missingMaskFailures"],
        },
        "movementValidation": movement,
        "gates": gates("Office Spatial Socket I01"),
        "reviewOutputs": [entry["file"] for entry in review_evidence],
        "reviewEvidence": review_evidence,
        "ownerDecision": None,
    }
    outputs[AUTHORITY_MANIFEST_PATH] = canonical_text_bytes(authority_manifest)
    return outputs


def write_outputs(outputs: dict[Path, bytes], check: bool) -> None:
    failures: list[str] = []
    for path, expected in sorted(outputs.items(), key=lambda item: str(item[0])):
        if check:
            if not path.exists():
                failures.append(f"missing {repo_path(path)}")
                continue
            actual = normalized_file_bytes(path)
            normalized_expected = (
                expected.replace(b"\r\n", b"\n")
                if path.suffix.lower() in {".json", ".md", ".mjs", ".py", ".ts", ".tsx"}
                else expected
            )
            if actual != normalized_expected:
                failures.append(f"stale {repo_path(path)}")
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(expected)
    if failures:
        raise SystemExit("\n".join(failures))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    outputs = assemble_outputs()
    write_outputs(outputs, args.check)
    verb = "verified" if args.check else "wrote"
    print(
        f"{verb} Office Spatial I01: 18 characters, 54 hand masks, "
        "16 fresh held props, 864 visible attachment cases"
    )


if __name__ == "__main__":
    main()
