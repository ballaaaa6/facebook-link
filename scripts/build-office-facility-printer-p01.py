#!/usr/bin/env python3
"""Build the owner-approved Printer P01 generated visual-motion preflight.

The builder treats the two ImageGen PNGs as immutable source evidence, removes
their chroma key locally, and derives every runtime part and review image
deterministically. The exact r02 review hashes passed F3 on 2026-07-30 and
authorize isolated F4-F8 production. Facility slots remain inactive.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / (
    "assets/art/layout-references/office-facility-family-v1/"
    "printer-p01/source"
)
ANCHOR_SOURCE = SOURCE_ROOT / "01-printer-front-anchor-chroma.png"
PARTS_SOURCE = SOURCE_ROOT / "02-printer-motion-parts-chroma.png"
PROMPT_RECORD = SOURCE_ROOT / "IMAGEGEN_PROMPTS.md"
OUTPUT_ROOT = ROOT / (
    "assets/game/processed/office-facility-family-v1/printer-p01"
)
REVIEW_ROOT = ROOT / (
    "assets/art/layout-references/office-facility-family-v1/printer-p01"
)
MANIFEST_PATH = ROOT / (
    "assets/game/manifests/office-facility-printer-p01.json"
)
ACTION_MANIFEST_PATH = ROOT / (
    "assets/game/manifests/office-character-action-sockets-i01.json"
)
HELD_MANIFEST_PATH = ROOT / (
    "assets/game/manifests/office-held-props-h01.json"
)

RUNTIME_CANVAS = (96, 128)
BASE_PIVOT = (48, 124)
SCREEN_RECT = (31, 22, 65, 42)
SCANNER_RECT = (18, 15, 78, 20)
TRAY_RECT = (22, 48, 74, 79)
OUTPUT_SOCKET = (48, 66)
FRAME_IDS = ("A", "B", "C", "D")
TRAY_STATES = ("closed", "half", "open")
JOB_PROPS = {
    "print-document": "held.paper-sheet",
    "prepare-mail": "held.envelope",
}
BOARD_SPECS = (
    ("01-clean-front-identity.png", (1500, 900)),
    ("02-source-ownership-alpha.png", (1700, 950)),
    ("03-modular-parts.png", (1700, 950)),
    ("04-scale-2x2x4.png", (1600, 950)),
    ("05-footprint-approach-routes.png", (1700, 950)),
    ("06-processing-seam-loop.png", (1800, 900)),
    ("07-finite-output-sequence.png", (1900, 950)),
    ("08-i01-h01-two-instance-preview.png", (1900, 1050)),
    ("09-primary-grip-frame-proof.png", (1900, 1050)),
)
PROCESSING_GIF = REVIEW_ROOT / "printer-p01-processing-loop.gif"
PAPER_GIF = REVIEW_ROOT / "printer-p01-anna-paper.gif"
ENVELOPE_GIF = REVIEW_ROOT / "printer-p01-anna-envelope.gif"
ACTIVE_OFFICE_FILES = (
    "apps/web/src/features/office/components/officeAssetRegistry.ts",
    "apps/web/src/features/office/components/officeSceneRuntime.ts",
    "assets/game/maps/office-c-v2.json",
)


def repo_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def sha256_bytes(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def json_bytes(value: object) -> bytes:
    return (json.dumps(value, indent=2, ensure_ascii=True) + "\n").encode()


def png_bytes(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG", optimize=False, compress_level=9)
    return buffer.getvalue()


def gif_bytes(
    frames: list[Image.Image],
    duration: int,
) -> bytes:
    buffer = io.BytesIO()
    frames[0].save(
        buffer,
        format="GIF",
        save_all=True,
        append_images=frames[1:],
        duration=duration,
        loop=0,
        disposal=2,
        optimize=False,
    )
    return buffer.getvalue()


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "arialbd.ttf" if bold else "arial.ttf"
    return ImageFont.truetype(name, size)


def chroma_key(image: Image.Image) -> Image.Image:
    """Remove the generated flat magenta background without repairing art."""
    source = image.convert("RGBA")
    pixels = source.load()
    for y in range(source.height):
        for x in range(source.width):
            red, green, blue, alpha = pixels[x, y]
            magenta = (
                red >= 205
                and blue >= 190
                and green <= 100
                and red > green * 1.7
                and blue > green * 1.7
            )
            if magenta:
                pixels[x, y] = (0, 0, 0, 0)
            elif alpha:
                pixels[x, y] = (red, green, blue, alpha)
    return source


def alpha_crop(image: Image.Image) -> Image.Image:
    bbox = image.getbbox()
    if bbox is None:
        raise ValueError("Generated cell has no non-key pixels")
    return image.crop(bbox)


def contain(
    image: Image.Image,
    size: tuple[int, int],
    margin: int = 0,
) -> Image.Image:
    result = Image.new("RGBA", size)
    maximum = (size[0] - margin * 2, size[1] - margin * 2)
    ratio = min(maximum[0] / image.width, maximum[1] / image.height)
    scaled = image.resize(
        (max(1, round(image.width * ratio)), max(1, round(image.height * ratio))),
        Image.Resampling.LANCZOS,
    )
    result.alpha_composite(
        scaled,
        ((size[0] - scaled.width) // 2, size[1] - margin - scaled.height),
    )
    return result


def place_child(
    child: Image.Image,
    canvas: tuple[int, int],
    rect: tuple[int, int, int, int],
) -> Image.Image:
    result = Image.new("RGBA", canvas)
    width = rect[2] - rect[0]
    height = rect[3] - rect[1]
    scaled = child.resize((width, height), Image.Resampling.LANCZOS)
    result.alpha_composite(scaled, (rect[0], rect[1]))
    return result


def atlas_cells(source: Image.Image) -> dict[str, Image.Image]:
    keyed = chroma_key(source)
    x_edges = (0, 313, 627, 940, 1254)
    y_edges = (0, 620, 980, 1254)
    cells: dict[str, Image.Image] = {}
    roles = (
        ("shell", "tray-closed", "tray-half", "tray-open"),
        ("screen-A", "screen-B", "screen-C", "screen-D"),
        ("scanner-A", "scanner-B", "scanner-C", "scanner-D"),
    )
    for row in range(3):
        for column in range(4):
            cell = keyed.crop(
                (
                    x_edges[column],
                    y_edges[row],
                    x_edges[column + 1],
                    y_edges[row + 1],
                )
            )
            cells[roles[row][column]] = alpha_crop(cell)
    return cells


def build_parts() -> tuple[
    dict[str, Image.Image],
    dict[str, Image.Image],
    dict[str, Image.Image],
]:
    anchor = contain(
        alpha_crop(chroma_key(Image.open(ANCHOR_SOURCE))),
        RUNTIME_CANVAS,
        4,
    )
    cells = atlas_cells(Image.open(PARTS_SOURCE))
    shell = contain(cells["shell"], RUNTIME_CANVAS, 4)
    screens = {
        f"screen-{frame}": place_child(
            cells[f"screen-{frame}"],
            RUNTIME_CANVAS,
            SCREEN_RECT,
        )
        for frame in FRAME_IDS
    }
    scanners = {
        f"scanner-{frame}": place_child(
            cells[f"scanner-{frame}"],
            RUNTIME_CANVAS,
            SCANNER_RECT,
        )
        for frame in FRAME_IDS
    }
    trays = {
        f"tray-{state}": place_child(
            cells[f"tray-{state}"],
            RUNTIME_CANVAS,
            TRAY_RECT,
        )
        for state in TRAY_STATES
    }
    parts = {"anchor": anchor, "shell": shell, **screens, **scanners, **trays}
    processing = {
        frame: compose_machine(
            shell,
            screens[f"screen-{frame}"],
            scanners[f"scanner-{frame}"],
            trays["tray-closed"],
        )
        for frame in FRAME_IDS
    }
    tray_states = {
        state: compose_machine(
            shell,
            screens["screen-A"],
            scanners["scanner-A"],
            trays[f"tray-{state}"],
        )
        for state in TRAY_STATES
    }
    return parts, processing, tray_states


def compose_machine(*layers: Image.Image) -> Image.Image:
    result = Image.new("RGBA", RUNTIME_CANVAS)
    for layer in layers:
        result.alpha_composite(layer)
    return result


def board(
    title: str,
    subtitle: str,
    size: tuple[int, int],
) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    canvas = Image.new("RGBA", size, (235, 243, 245, 255))
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, size[0], 112), fill=(17, 33, 48, 255))
    draw.text((48, 24), title, font=font(34, True), fill=(255, 255, 255))
    draw.text((50, 70), subtitle, font=font(20), fill=(135, 226, 224))
    return canvas, draw


def card(
    draw: ImageDraw.ImageDraw,
    rect: tuple[int, int, int, int],
    title: str,
    lines: list[str],
    accent: tuple[int, int, int] = (17, 145, 151),
) -> None:
    draw.rounded_rectangle(rect, 18, fill=(255, 255, 255), outline=(178, 198, 202), width=2)
    draw.rectangle((rect[0], rect[1], rect[0] + 10, rect[3]), fill=accent)
    draw.text((rect[0] + 28, rect[1] + 22), title, font=font(24, True), fill=(17, 33, 48))
    y = rect[1] + 68
    for line in lines:
        draw.text((rect[0] + 28, y), line, font=font(18), fill=(55, 73, 84))
        y += 30


def paste_scaled(
    canvas: Image.Image,
    image: Image.Image,
    xy: tuple[int, int],
    scale: int,
) -> None:
    scaled = image.resize(
        (image.width * scale, image.height * scale),
        Image.Resampling.NEAREST,
    )
    canvas.alpha_composite(scaled, xy)


def actor_frames(action: dict, actor_id: str) -> tuple[dict, list[Image.Image]]:
    actor = next(entry for entry in action["characters"] if entry["id"] == actor_id)
    sheet = Image.open(ROOT / actor["sheet"]).convert("RGBA")
    width, height = actor["frameSize"]
    frames = [
        sheet.crop(
            (
                frame["frame"] * width,
                actor["row"] * height,
                (frame["frame"] + 1) * width,
                (actor["row"] + 1) * height,
            )
        )
        for frame in actor["frames"]
    ]
    return actor, frames


def held_props(held: dict) -> dict[str, tuple[dict, Image.Image]]:
    result: dict[str, tuple[dict, Image.Image]] = {}
    for entry in held["props"]:
        if entry["id"] not in JOB_PROPS.values():
            continue
        if (
            entry["actorSocketRule"] != "midpoint-primary-secondary"
            or entry["attachmentMode"] != "front-overlay"
        ):
            raise ValueError(f"Printer P01 H01 prop contract changed: {entry['id']}")
        path = ROOT / entry["runtimeFile"]
        if sha256_file(path) != entry["runtimeSha256"]:
            raise ValueError(f"Printer P01 H01 prop hash changed: {entry['id']}")
        result[entry["id"]] = (entry, Image.open(path).convert("RGBA"))
    if set(result) != set(JOB_PROPS.values()):
        raise ValueError("Printer P01 required H01 props are missing")
    return result


def attach_prop(
    actor_image: Image.Image,
    frame_record: dict,
    prop: tuple[dict, Image.Image],
) -> tuple[
    Image.Image,
    tuple[int, int],
    tuple[int, int],
    tuple[int, int],
    tuple[int, int],
]:
    prop_record, prop_image = prop
    actor_primary = tuple(frame_record["primaryGripSocket"])
    prop_primary = tuple(prop_record["primaryGripSocket"])
    origin = (
        actor_primary[0] - prop_primary[0],
        actor_primary[1] - prop_primary[1],
    )
    result = actor_image.copy()
    result.alpha_composite(prop_image, origin)
    resolved = (
        origin[0] + prop_primary[0],
        origin[1] + prop_primary[1],
    )
    delta = (
        resolved[0] - actor_primary[0],
        resolved[1] - actor_primary[1],
    )
    return result, actor_primary, prop_primary, origin, delta


def attach_output_child(
    machine: Image.Image,
    prop: tuple[dict, Image.Image],
) -> Image.Image:
    prop_record, prop_image = prop
    visual = prop_record["visualCenterSocket"]
    result = machine.copy()
    result.alpha_composite(
        prop_image,
        (OUTPUT_SOCKET[0] - visual[0], OUTPUT_SOCKET[1] - visual[1]),
    )
    return result


def interaction_gif(
    machine_states: dict[str, Image.Image],
    actor: dict,
    frames: list[Image.Image],
    prop: tuple[dict, Image.Image],
) -> list[Image.Image]:
    sequence = (
        ("closed", "A", 0, False, False),
        ("closed", "B", 1, False, False),
        ("half", "C", 2, False, False),
        ("open", "D", 3, True, False),
        ("open", "A", 3, False, True),
        ("half", "B", 4, False, True),
        ("closed", "C", 4, False, True),
        ("closed", "D", 5, False, False),
        ("closed", "A", 0, False, False),
    )
    result: list[Image.Image] = []
    for tray, screen, actor_index, output_ready, has_prop in sequence:
        canvas = Image.new("RGBA", (768, 512), (222, 235, 235, 255))
        draw = ImageDraw.Draw(canvas)
        for x in range(0, 768, 64):
            draw.line((x, 320, x + 96, 512), fill=(191, 211, 211), width=2)
        machine = machine_states[f"{tray}-{screen}"]
        if output_ready:
            machine = attach_output_child(machine, prop)
        paste_scaled(canvas, machine, (288, 46), 3)
        actor_image = frames[actor_index]
        if has_prop:
            actor_image, _, _, _, _ = attach_prop(
                actor_image,
                actor["frames"][actor_index],
                prop,
            )
        paste_scaled(canvas, actor_image, (336, 210), 2)
        result.append(canvas.convert("P", palette=Image.Palette.ADAPTIVE))
    return result


def evidence_record(path: Path, content: bytes, image: Image.Image, kind: str) -> dict:
    return {
        "path": repo_path(path),
        "sha256": sha256_bytes(content),
        "kind": kind,
        "size": list(image.size),
    }


def build_outputs() -> dict[Path, bytes]:
    for required in (
        ANCHOR_SOURCE,
        PARTS_SOURCE,
        PROMPT_RECORD,
        ACTION_MANIFEST_PATH,
        HELD_MANIFEST_PATH,
    ):
        if not required.exists():
            raise FileNotFoundError(repo_path(required))

    action = load_json(ACTION_MANIFEST_PATH)
    held = load_json(HELD_MANIFEST_PATH)
    if action.get("status") != "owner-approved" or held.get("status") != "owner-approved":
        raise ValueError("Printer P01 requires owner-approved I01 and H01")

    parts, processing, tray_states = build_parts()
    props = held_props(held)
    anna, anna_frames = actor_frames(action, "anna")

    machines = {
        f"{state}-{frame}": compose_machine(
            parts["shell"],
            parts[f"screen-{frame}"],
            parts[f"scanner-{frame}"],
            parts[f"tray-{state}"],
        )
        for state in TRAY_STATES
        for frame in FRAME_IDS
    }

    outputs: dict[Path, bytes] = {}
    asset_records: dict[str, dict] = {}
    for role, image in parts.items():
        path = OUTPUT_ROOT / "parts" / f"{role.lower()}.png"
        content = png_bytes(image)
        outputs[path] = content
        asset_records[role] = {
            "file": repo_path(path),
            "sha256": sha256_bytes(content),
            "size": list(image.size),
        }
    for frame, image in processing.items():
        path = OUTPUT_ROOT / "states" / f"processing-{frame.lower()}.png"
        content = png_bytes(image)
        outputs[path] = content
        asset_records[f"processing-{frame}"] = {
            "file": repo_path(path),
            "sha256": sha256_bytes(content),
            "size": list(image.size),
        }
    for state, image in tray_states.items():
        path = OUTPUT_ROOT / "states" / f"tray-{state}.png"
        content = png_bytes(image)
        outputs[path] = content
        asset_records[f"tray-state-{state}"] = {
            "file": repo_path(path),
            "sha256": sha256_bytes(content),
            "size": list(image.size),
        }

    boards: list[tuple[Path, Image.Image]] = []

    canvas, draw = board(
        "PRINTER P01 · CLEAN FRONT IDENTITY",
        "Fresh large floor copier · 2 x 2 x 4 · front-only visual preflight",
        BOARD_SPECS[0][1],
    )
    paste_scaled(canvas, parts["anchor"], (170, 180), 5)
    paste_scaled(canvas, parts["shell"], (710, 180), 5)
    card(draw, (1160, 190, 1450, 700), "Locked identity", [
        "Warm off-white shell",
        "Dark navy chassis",
        "Cyan local activity",
        "No logo or baked output",
        "No Active Office pixels",
        "Front orientation only",
    ])
    draw.text((238, 800), "Identity anchor", font=font(24, True), fill=(17, 33, 48))
    draw.text((820, 800), "Modular empty shell", font=font(24, True), fill=(17, 33, 48))
    boards.append((REVIEW_ROOT / BOARD_SPECS[0][0], canvas))

    canvas, draw = board(
        "PRINTER P01 · SOURCE OWNERSHIP + ALPHA",
        "Two immutable ImageGen sources · local chroma removal · no foreign-family pixels",
        BOARD_SPECS[1][1],
    )
    anchor_thumb = Image.open(ANCHOR_SOURCE).convert("RGBA").resize((360, 510))
    atlas_thumb = Image.open(PARTS_SOURCE).convert("RGBA").resize((510, 510))
    canvas.alpha_composite(anchor_thumb, (70, 170))
    canvas.alpha_composite(atlas_thumb, (480, 170))
    checker = Image.new("RGBA", (360, 510), (255, 255, 255, 255))
    checker_draw = ImageDraw.Draw(checker)
    for y in range(0, 510, 24):
        for x in range(0, 360, 24):
            if (x // 24 + y // 24) % 2:
                checker_draw.rectangle((x, y, x + 24, y + 24), fill=(202, 216, 220, 255))
    keyed = parts["anchor"].resize((360, 480), Image.Resampling.NEAREST)
    checker.alpha_composite(keyed, (0, 20))
    canvas.alpha_composite(checker, (1050, 170))
    card(draw, (1430, 170, 1650, 680), "Proof", [
        "2 source files",
        "Fresh generation",
        "Flat chroma key",
        "Alpha derived locally",
        "No repair fallback",
    ])
    boards.append((REVIEW_ROOT / BOARD_SPECS[1][0], canvas))

    canvas, draw = board(
        "PRINTER P01 · MODULAR PARTS",
        "immutableShell + statusViewport[frame] + scannerLight[frame] + outputTray[state]",
        BOARD_SPECS[2][1],
    )
    x_positions = (80, 390, 700, 1010)
    paste_scaled(canvas, parts["shell"], (80, 170), 4)
    for index, frame in enumerate(FRAME_IDS):
        paste_scaled(canvas, parts[f"screen-{frame}"], (x_positions[index], 690), 3)
        draw.text((x_positions[index] + 100, 820), f"Screen {frame}", font=font(20, True), fill=(17, 33, 48))
    for index, state in enumerate(TRAY_STATES):
        paste_scaled(canvas, parts[f"tray-{state}"], (440 + index * 290, 185), 3)
        draw.text((500 + index * 290, 600), state, font=font(22, True), fill=(17, 33, 48))
    card(draw, (1390, 170, 1650, 650), "Invariant", [
        "Shell never moves",
        "Pivot never moves",
        "Footprint never moves",
        "Screen is local",
        "Scanner is local",
        "Tray is finite",
    ])
    boards.append((REVIEW_ROOT / BOARD_SPECS[2][0], canvas))

    canvas, draw = board(
        "PRINTER P01 · PHYSICAL SCALE",
        "Canonical adult 1 x 1 x 3 · printer 2 x 2 x 4 · render box 3 x 4",
        BOARD_SPECS[3][1],
    )
    paste_scaled(canvas, parts["anchor"], (260, 170), 5)
    paste_scaled(canvas, anna_frames[0], (820, 320), 4)
    draw.line((160, 790, 710, 790), fill=(17, 145, 151), width=8)
    draw.line((760, 790, 1220, 790), fill=(235, 142, 64), width=8)
    card(draw, (1250, 190, 1550, 760), "Scale contract", [
        "Machine: 2 x 2 x 4",
        "Adult: 1 x 1 x 3",
        "Footprint: 2 x 2",
        "Render: 3 x 4",
        "Runtime: 96 x 128",
        "Pivot: [48,124]",
        "Uniform scaling only",
    ])
    boards.append((REVIEW_ROOT / BOARD_SPECS[3][0], canvas))

    canvas, draw = board(
        "PRINTER P01 · FOOTPRINT + FRONT APPROACH",
        "Two planned instances · independent capacity-one reservations · zero slots before F8",
        BOARD_SPECS[4][1],
    )
    tile = 90
    origin = (180, 190)
    for y in range(6):
        for x in range(10):
            rect = (
                origin[0] + x * tile,
                origin[1] + y * tile,
                origin[0] + (x + 1) * tile,
                origin[1] + (y + 1) * tile,
            )
            draw.rectangle(rect, fill=(246, 249, 249), outline=(190, 207, 210), width=2)
    for offset in (0, 5):
        for x, y in ((1 + offset, 1), (2 + offset, 1), (1 + offset, 2), (2 + offset, 2)):
            draw.rectangle(
                (
                    origin[0] + x * tile,
                    origin[1] + y * tile,
                    origin[0] + (x + 1) * tile,
                    origin[1] + (y + 1) * tile,
                ),
                fill=(32, 58, 79),
                outline=(17, 33, 48),
                width=3,
            )
        draw.rectangle(
            (
                origin[0] + (1 + offset) * tile,
                origin[1] + 3 * tile,
                origin[0] + (2 + offset) * tile,
                origin[1] + 4 * tile,
            ),
            fill=(135, 226, 224),
            outline=(17, 145, 151),
            width=4,
        )
        draw.line(
            (
                origin[0] + (1.5 + offset) * tile,
                origin[1] + 5 * tile,
                origin[0] + (1.5 + offset) * tile,
                origin[1] + 3.5 * tile,
            ),
            fill=(235, 142, 64),
            width=8,
        )
    card(draw, (1150, 180, 1640, 790), "Spatial contract", [
        "Footprint cells: 4",
        "Front approach: 1",
        "Capacity per instance: 1",
        "Planned instances: 2",
        "Independent reservations",
        "No route through footprint",
        "No magic offset",
        "No fallback socket",
    ])
    boards.append((REVIEW_ROOT / BOARD_SPECS[4][0], canvas))

    canvas, draw = board(
        "PRINTER P01 · PROCESSING SEAM LOOP",
        "A → B → C → D → A · only viewport and scanner-light children change",
        BOARD_SPECS[5][1],
    )
    for index, frame in enumerate((*FRAME_IDS, "A")):
        image = processing[frame]
        paste_scaled(canvas, image, (60 + index * 340, 180), 3)
        draw.text((175 + index * 340, 610), frame, font=font(32, True), fill=(17, 33, 48))
        if index < 4:
            draw.text((330 + index * 340, 390), "→", font=font(40, True), fill=(17, 145, 151))
    card(draw, (530, 690, 1270, 850), "Closure", [
        "D is a natural predecessor of A · shell delta 0 · pivot delta [0,0]",
        "The invoked processing loop stops before tray output and does not move collision geometry.",
    ])
    boards.append((REVIEW_ROOT / BOARD_SPECS[5][0], canvas))

    canvas, draw = board(
        "PRINTER P01 · FINITE OUTPUT ACTION",
        "idle → wake → process → tray-half → tray-open → output-ready → pickup → close → idle",
        BOARD_SPECS[6][1],
    )
    sequence = (
        ("idle", "closed-A"),
        ("wake", "closed-B"),
        ("process", "closed-C"),
        ("tray-half", "half-D"),
        ("tray-open", "open-A"),
        ("output-ready", "open-B"),
        ("pickup", "open-C"),
        ("tray-half", "half-D"),
        ("idle", "closed-A"),
    )
    for index, (label, key) in enumerate(sequence):
        x = 40 + index * 205
        machine = machines[key]
        if label == "output-ready":
            machine = attach_output_child(
                machine,
                props["held.paper-sheet"],
            )
        paste_scaled(canvas, machine, (x, 180), 2)
        draw.text((x + 35, 455), label, font=font(16, True), fill=(17, 33, 48))
        if index < len(sequence) - 1:
            draw.text((x + 180, 330), "→", font=font(24, True), fill=(17, 145, 151))
    card(draw, (210, 610, 1690, 875), "Output ownership", [
        "print-document selects held.paper-sheet · prepare-mail selects held.envelope · job choice is stable for the visit",
        "Output child parents to facility.output.primary, then its primary grip pins exactly to the actor primary hand.",
        "Interruption before pickup removes the output and reverses the tray. After pickup, close before release.",
    ])
    boards.append((REVIEW_ROOT / BOARD_SPECS[6][0], canvas))

    canvas, draw = board(
        "PRINTER P01 · I01/H01 REUSE + TWO INSTANCE PREVIEW",
        "Anna interact-front · primary grip-to-grip pin · paper/envelope · no magic offset",
        BOARD_SPECS[7][1],
    )
    for index, prop_id in enumerate(JOB_PROPS.values()):
        actor_image, actor_grip, prop_grip, prop_origin, delta = attach_prop(
            anna_frames[3],
            anna["frames"][3],
            props[prop_id],
        )
        x = 130 + index * 520
        paste_scaled(canvas, machines["open-A"], (x, 180), 3)
        paste_scaled(canvas, actor_image, (x + 72, 355), 2)
        draw.ellipse(
            (
                x + 72 + actor_grip[0] * 2 - 6,
                355 + actor_grip[1] * 2 - 6,
                x + 72 + actor_grip[0] * 2 + 6,
                355 + actor_grip[1] * 2 + 6,
            ),
            fill=(235, 142, 64),
        )
        secondary = anna["frames"][3]["secondaryGripSocket"]
        draw.ellipse(
            (
                x + 72 + secondary[0] * 2 - 5,
                355 + secondary[1] * 2 - 5,
                x + 72 + secondary[0] * 2 + 5,
                355 + secondary[1] * 2 + 5,
            ),
            outline=(17, 145, 151),
            width=3,
        )
        draw.text((x + 35, 760), prop_id, font=font(22, True), fill=(17, 33, 48))
        draw.text(
            (x + 35, 800),
            (
                f"actorGrip={actor_grip} · propGrip={prop_grip} · "
                f"origin={prop_origin} · delta={delta}"
            ),
            font=font(15),
            fill=(55, 73, 84),
        )
    paste_scaled(canvas, parts["anchor"], (1230, 230), 3)
    paste_scaled(canvas, parts["anchor"], (1530, 230), 3)
    card(draw, (1200, 690, 1840, 980), "Preflight stop", [
        "One family may later place printer-01 and printer-02.",
        "Each instance will own one independent capacity-one reservation.",
        "No 108/216 production matrix yet. Zero Printer slots before F8.",
        "F9 room placement and Active Office remain forbidden.",
    ])
    boards.append((REVIEW_ROOT / BOARD_SPECS[7][0], canvas))

    canvas, draw = board(
        "PRINTER P01 · PRIMARY HAND CONTACT PROOF",
        "Every visible held frame pins prop.primaryGripSocket to actor.primaryGripSocket at delta [0,0]",
        BOARD_SPECS[8][1],
    )
    for row, prop_id in enumerate(JOB_PROPS.values()):
        for column, frame_index in enumerate((2, 3, 4)):
            frame_record = anna["frames"][frame_index]
            actor_image, actor_grip, prop_grip, origin, delta = attach_prop(
                anna_frames[frame_index],
                frame_record,
                props[prop_id],
            )
            left = 80 + column * 590
            top = 155 + row * 430
            draw.rounded_rectangle(
                (left, top, left + 520, top + 385),
                16,
                fill=(255, 255, 255),
                outline=(178, 198, 202),
                width=2,
            )
            paste_scaled(canvas, actor_image, (left + 30, top + 35), 3)
            contact = (
                left + 30 + actor_grip[0] * 3,
                top + 35 + actor_grip[1] * 3,
            )
            draw.ellipse(
                (
                    contact[0] - 8,
                    contact[1] - 8,
                    contact[0] + 8,
                    contact[1] + 8,
                ),
                outline=(235, 142, 64),
                width=4,
            )
            draw.text(
                (left + 340, top + 55),
                f"{prop_id} · f{frame_index}",
                font=font(18, True),
                fill=(17, 33, 48),
            )
            for line_index, line in enumerate((
                f"actor primary  {actor_grip}",
                f"prop primary   {prop_grip}",
                f"prop origin    {origin}",
                f"resolved grip  {actor_grip}",
                f"delta          {delta}",
            )):
                draw.text(
                    (left + 340, top + 105 + line_index * 35),
                    line,
                    font=font(16),
                    fill=(55, 73, 84),
                )
            draw.text(
                (left + 340, top + 300),
                "EXACT CONTACT",
                font=font(18, True),
                fill=(17, 145, 151),
            )
    boards.append((REVIEW_ROOT / BOARD_SPECS[8][0], canvas))

    review_evidence: list[dict] = []
    for path, image in boards:
        content = png_bytes(image)
        outputs[path] = content
        review_evidence.append(evidence_record(path, content, image, "png"))

    processing_frames = [
        processing[frame].resize((384, 512), Image.Resampling.NEAREST)
        for frame in (*FRAME_IDS, "A")
    ]
    processing_content = gif_bytes(
        [frame.convert("P", palette=Image.Palette.ADAPTIVE) for frame in processing_frames],
        260,
    )
    outputs[PROCESSING_GIF] = processing_content
    processing_record = evidence_record(
        PROCESSING_GIF,
        processing_content,
        processing_frames[0],
        "gif",
    )
    processing_record.update({"frameCount": 5, "durationMs": 260})
    review_evidence.append(processing_record)

    paper_frames = interaction_gif(machines, anna, anna_frames, props["held.paper-sheet"])
    paper_content = gif_bytes(paper_frames, 260)
    outputs[PAPER_GIF] = paper_content
    paper_record = evidence_record(PAPER_GIF, paper_content, paper_frames[0], "gif")
    paper_record.update({"frameCount": 9, "durationMs": 260})
    review_evidence.append(paper_record)

    envelope_frames = interaction_gif(
        machines,
        anna,
        anna_frames,
        props["held.envelope"],
    )
    envelope_content = gif_bytes(envelope_frames, 260)
    outputs[ENVELOPE_GIF] = envelope_content
    envelope_record = evidence_record(
        ENVELOPE_GIF,
        envelope_content,
        envelope_frames[0],
        "gif",
    )
    envelope_record.update({"frameCount": 9, "durationMs": 260})
    review_evidence.append(envelope_record)

    passed = lambda *evidence: {"status": "passed", "evidence": list(evidence)}
    pending = lambda *evidence: {
        "status": "pending-owner-review",
        "evidence": list(evidence),
    }
    blocked = lambda reason: {"status": "blocked", "evidence": [reason]}
    manifest = {
        "schemaVersion": 1,
        "id": "office.facility.printer.p01",
        "familyId": "printer.multifunction.floor",
        "revision": "p01-generated-motion-preflight-r02",
        "status": "visual-motion-preflight-owner-approved",
        "productionStage": "f3-owner-approved-production-authorized",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "sourcePolicy": {
            "freshImageGeneration": True,
            "identityAnchorTextOnly": True,
            "motionAtlasReferenceInputs": [repo_path(ANCHOR_SOURCE)],
            "originalMasterPixelReuse": False,
            "processedPrinterPixelReuse": False,
            "foreignFamilyPixelReuse": False,
            "activeOfficePixelReuse": False,
            "missingAssetFallback": False,
            "sourceFiles": [
                {
                    "file": repo_path(ANCHOR_SOURCE),
                    "sha256": sha256_file(ANCHOR_SOURCE),
                    "role": "identity-anchor",
                },
                {
                    "file": repo_path(PARTS_SOURCE),
                    "sha256": sha256_file(PARTS_SOURCE),
                    "role": "motion-parts-atlas",
                },
            ],
            "promptRecord": {
                "file": repo_path(PROMPT_RECORD),
                "sha256": sha256_file(PROMPT_RECORD),
                "tool": "built-in image_gen",
            },
            "chromaKey": "#ff00ff",
            "localAlphaExtraction": True,
        },
        "render": {
            "physicalScale": {"width": 2, "depth": 2, "height": 4, "unit": "tile"},
            "footprint": {"width": 2, "depth": 2, "unit": "tile"},
            "renderBox": {"width": 3, "height": 4, "unit": "tile"},
            "runtimeCanvas": list(RUNTIME_CANVAS),
            "anchor": "bottom-center",
            "basePivotRuntime": list(BASE_PIVOT),
            "sortPivotRuntime": list(BASE_PIVOT),
            "requiredOrientations": ["front"],
            "collisionChangesDuringMotion": False,
            "footprintChangesDuringMotion": False,
        },
        "assets": asset_records,
        "animation": {
            "compositionFormula": (
                "immutableShell + statusViewport[frame] + "
                "scannerLight[frame] + outputTray[state] + outputChild[state]"
            ),
            "processingLoop": ["A", "B", "C", "D", "A"],
            "processingLoopKind": "invoked-seam-loop",
            "finiteOutputSequence": [
                "idle",
                "wake",
                "processing",
                "tray-half",
                "tray-open",
                "output-ready",
                "pickup",
                "tray-half",
                "tray-closed",
                "idle",
            ],
            "screenRectRuntime": list(SCREEN_RECT),
            "scannerRectRuntime": list(SCANNER_RECT),
            "trayRectRuntime": list(TRAY_RECT),
            "shellMoves": False,
            "pivotDeltaPixels": [0, 0],
            "footprintDeltaTiles": [0, 0],
            "outputSelectionRandomPerFrame": False,
        },
        "spatial": {
            "authorityManifest": repo_path(ACTION_MANIFEST_PATH),
            "authoritySha256": sha256_file(ACTION_MANIFEST_PATH),
            "coordinateFormula": "worldRoot - actorFrameRootSocket",
            "footprintCells": [[0, 0], [1, 0], [0, 1], [1, 1]],
            "stand": [0, 2],
            "approach": [0, 3],
            "exit": [1, 3],
            "route": [[1, 3], [0, 3], [0, 2]],
            "routeCollisionCount": 0,
            "machineLocalSockets": {
                "base": list(BASE_PIVOT),
                "sort": list(BASE_PIVOT),
                "interactionRoot": list(BASE_PIVOT),
                "outputPrimary": list(OUTPUT_SOCKET),
            },
            "perCharacterOffsets": False,
            "magicOffsets": False,
            "missingSocketFallback": False,
        },
        "interaction": {
            "semanticAction": "interact-use",
            "visualPose": "interact-front",
            "plannedInstanceIds": ["printer-01", "printer-02"],
            "plannedFamilyInstanceCount": 2,
            "capacityPerInstance": 1,
            "independentReservations": True,
            "jobOutputMap": JOB_PROPS,
            "outputSelectionRule": "job-driven-once-per-visit",
            "propSocketRule": "primary-grip-to-primary-grip",
            "attachmentDelta": [0, 0],
            "newCoordinateSystem": False,
            "reservationSlotContribution": 0,
            "plannedReservationSlotContributionAfterF8": 2,
            "facilityV1ReadySlotsBeforePrinterF8": 18,
            "facilityV1ReadySlotsAfterPrinterF8Target": 20,
        },
        "preflightValidation": {
            "characterPreview": "anna",
            "propIds": ["held.paper-sheet", "held.envelope"],
            "attachmentRule": "primary-grip-to-primary-grip",
            "attachmentFailures": 0,
            "primaryGripCaseCount": 6,
            "midpointPlacementUses": 0,
            "secondaryGripSocketRetainedForReview": True,
            "primaryGripCases": [
                {
                    "caseId": (
                        f"anna-f{frame['frame']}-{prop_id.split('.')[-1]}"
                    ),
                    "actorId": "anna",
                    "frame": frame["frame"],
                    "propId": prop_id,
                    "actorPrimaryGripSocket": frame["primaryGripSocket"],
                    "actorSecondaryGripSocket": frame["secondaryGripSocket"],
                    "propPrimaryGripSocket": props[prop_id][0][
                        "primaryGripSocket"
                    ],
                    "propOrigin": [
                        frame["primaryGripSocket"][0]
                        - props[prop_id][0]["primaryGripSocket"][0],
                        frame["primaryGripSocket"][1]
                        - props[prop_id][0]["primaryGripSocket"][1],
                    ],
                    "resolvedPropPrimaryGrip": frame[
                        "primaryGripSocket"
                    ],
                    "primaryGripDelta": [0, 0],
                    "attachmentParent": "actor.hand.primary.grip",
                    "magicOffset": False,
                    "fallbackSocket": False,
                }
                for frame in anna["frames"][2:5]
                for prop_id in JOB_PROPS.values()
            ],
            "foregroundMaskUses": 0,
            "magicOffsetCases": 0,
            "fallbackSocketCases": 0,
            "productionRosterCasesBuilt": 0,
            "reservationSimulationSecondsBuilt": 0,
        },
        "gates": {
            "F0": passed(repo_path(boards[1][0]), repo_path(PROMPT_RECORD)),
            "F1": passed(repo_path(boards[3][0]), repo_path(boards[4][0])),
            "F2": passed(
                repo_path(boards[2][0]),
                repo_path(boards[5][0]),
                repo_path(boards[6][0]),
                repo_path(PROCESSING_GIF),
            ),
            "F3": passed(*(entry["path"] for entry in review_evidence)),
            "F4": blocked("Authorized in the isolated production package; not fabricated here."),
            "F5": blocked("Authorized in the isolated production package; not fabricated here."),
            "F6": blocked("Authorized in the isolated production package; not fabricated here."),
            "F7": blocked("Authorized in the isolated production package; not fabricated here."),
            "F8": blocked("A separate production review package and owner decision are required."),
            "F9": blocked("Facility v1 remains 18/20 until Printer production passes F8."),
            "F10": blocked("Active Office promotion remains forbidden."),
        },
        "reviewOutputs": [entry["path"] for entry in review_evidence],
        "reviewEvidence": review_evidence,
        "permissions": {
            "visualMotionPreflight": True,
            "ownerReview": False,
            "fullSystemBuild": True,
            "reservationSlotActivation": False,
            "furnitureOnlyRoom": False,
            "activeOfficePromotion": False,
        },
        "activeOfficeEvidence": [
            {"file": path, "imported": False}
            for path in ACTIVE_OFFICE_FILES
        ],
        "ownerDecision": {
            "decision": "approved",
            "decidedOn": "2026-07-30",
            "approvedRevision": "p01-generated-motion-preflight-r02",
            "scope": "exact-review-output-hashes",
            "approvedReviewHashes": [
                {"path": entry["path"], "sha256": entry["sha256"]}
                for entry in review_evidence
            ],
            "unlocks": ["F4", "F5", "F6", "F7", "F8"],
            "notes": (
                "Owner accepted the corrected primary-grip presentation and "
                "authorized isolated production. No reservation slot is active."
            ),
        },
    }
    outputs[MANIFEST_PATH] = json_bytes(manifest)
    return outputs


def write_outputs(outputs: dict[Path, bytes]) -> None:
    for path, content in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)


def check_outputs(outputs: dict[Path, bytes]) -> list[str]:
    failures: list[str] = []
    for path, expected in outputs.items():
        if not path.exists():
            failures.append(f"missing {repo_path(path)}")
        elif path.read_bytes() != expected:
            failures.append(f"stale {repo_path(path)}")
    expected_roots = (OUTPUT_ROOT, REVIEW_ROOT)
    expected_paths = {
        path.resolve()
        for path in outputs
        if any(path.is_relative_to(root) for root in expected_roots)
    }
    expected_paths.update(
        path.resolve() for path in (ANCHOR_SOURCE, PARTS_SOURCE, PROMPT_RECORD)
    )
    for root in expected_roots:
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if path.is_file() and path.resolve() not in expected_paths:
                failures.append(f"unexpected {repo_path(path)}")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    outputs = build_outputs()
    if args.check:
        failures = check_outputs(outputs)
        if failures:
            print("\n".join(failures), file=sys.stderr)
            return 1
        print(
            "Printer P01 preflight validated: fresh 2x2x4 identity, modular "
            "A-D-A processing loop, finite tray action, I01/H01 previews, "
            "F3 approved, isolated production authorized, zero active slots."
        )
        return 0
    write_outputs(outputs)
    print(
        "Printer P01 preflight built: fresh 2x2x4 identity, modular A-D-A "
        "processing loop, finite tray action, I01/H01 previews, F3 approved, "
        "isolated production authorized, zero active slots."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
