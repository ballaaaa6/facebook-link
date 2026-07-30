"""Source-only motion asset compositor for Facility Upsize Motion V2.

This module may crop, resize, translate, clip, and alpha-composite authored
pixels. It must never draw runtime effect pixels procedurally. Review labels
and diagrams belong to the separate review builder.
"""

from __future__ import annotations

import hashlib
import io
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path(
    "assets/art/layout-references/office-facility-upsize-motion-v2"
)
PROCESSED_ROOT = Path(
    "assets/game/processed/office-facility-upsize-motion-v2"
)
REVIEW_ROOT = SOURCE_ROOT
I01_MANIFEST = Path(
    "assets/game/manifests/office-character-action-sockets-i01.json"
)
H01_MANIFEST = Path("assets/game/manifests/office-held-props-h01.json")
SEAT_MANIFEST = Path(
    "assets/game/manifests/office-character-seat-sockets-v1.json"
)

RUNTIME_SIZE = (96, 128)
PHASES = ("a", "b", "c", "d")
FINITE_COUNT = 6
BASE_PIVOT = (48, 124)

FAMILIES: tuple[dict[str, Any], ...] = (
    {
        "slug": "coffee-machine-c02",
        "label": "Coffee Machine C02",
        "kind": "coffee",
        "rows": ("screen", "steam", "pour"),
        "base": (
            "assets/game/processed/office-facility-upsize-v1/"
            "coffee-machine-c02/runtime/front.png"
        ),
        "regions": {
            "screen": (24, 8, 72, 31),
            "steam": (31, 42, 65, 64),
            "pour": (40, 48, 56, 69),
        },
        "fit": {"screen": "fill", "steam": "contain", "pour": "contain-bottom"},
        "finiteNames": (
            "idle", "wake", "preheat", "pour", "finish", "idle",
        ),
        "finiteFrames": {
            "screen": (0, 1, 2, 3, 2, 0),
            "steam": (None, 0, 1, 2, 3, None),
            "pour": (None, None, 0, 2, 3, None),
        },
        "seamRoles": ("screen", "steam"),
        "prop": "held.coffee-mug",
    },
    {
        "slug": "water-dispenser-w02",
        "label": "Water Dispenser W02",
        "kind": "water",
        "rows": ("screen", "flow", "splash"),
        "base": (
            "assets/game/processed/office-facility-upsize-v1/"
            "water-dispenser-w02/runtime/front.png"
        ),
        "regions": {
            "screen": (27, 9, 69, 28),
            "flow": (40, 41, 56, 67),
            "splash": (31, 61, 65, 70),
        },
        "fit": {"screen": "fill", "flow": "contain-bottom", "splash": "fill"},
        "finiteNames": (
            "idle", "ready", "dispense-start", "dispense", "drip-stop", "idle",
        ),
        "finiteFrames": {
            "screen": (0, 1, 2, 3, 2, 0),
            "flow": (None, 0, 1, 2, 3, None),
            "splash": (None, None, 0, 1, 2, None),
        },
        "seamRoles": ("screen", "splash"),
        "prop": "held.water-bottle",
    },
    {
        "slug": "vending-machine-u02",
        "label": "Vending Machine U02",
        "kind": "vending",
        "rows": ("merchandise", "display", "coil", "package"),
        "base": (
            "assets/game/processed/office-facility-upsize-v1/"
            "vending-machine-u02/runtime/front.png"
        ),
        "regions": {
            "merchandise": (14, 9, 63, 65),
            "display": (68, 18, 83, 29),
            "coil": (23, 44, 55, 62),
            "package": (22, 88, 68, 105),
        },
        "fit": {
            "merchandise": "fill",
            "display": "fill",
            "coil": "contain-bottom",
            "package": "contain-bottom",
        },
        "finiteNames": (
            "idle", "select", "payment", "dispense", "pickup-ready", "idle",
        ),
        "finiteFrames": {
            "merchandise": (0, 1, 2, 3, 0, 0),
            "display": (0, 1, 2, 3, 2, 0),
            "coil": (None, None, 0, 2, 3, None),
            "package": (None, None, None, 1, 3, None),
        },
        "seamRoles": ("merchandise", "display"),
        "prop": "held.soda-can",
    },
    {
        "slug": "massage-chair-r03",
        "label": "Massage Chair R03",
        "kind": "massage",
        "rows": ("seat", "roller", "display"),
        "base": (
            "assets/game/processed/office-facility-upsize-v1/"
            "massage-chair-r03/runtime/front.png"
        ),
        "rearBase": (
            "assets/game/processed/office-facility-upsize-production-v1/"
            "massage-chair-r03/runtime/seat-parts/rear.png"
        ),
        "foreground": (
            "assets/game/processed/office-facility-upsize-production-v1/"
            "massage-chair-r03/runtime/seat-parts/foreground.png"
        ),
        "regions": {
            "seat": (18, 20, 79, 117),
            "roller": (29, 35, 68, 102),
            "display": (77, 32, 89, 58),
        },
        "fit": {
            "seat": "contain-bottom",
            "roller": "contain",
            "display": "fill",
        },
        "rotate": {"display": 90},
        "finiteNames": (
            "upright", "recline-half", "reclined",
            "massage-hold", "recline-half", "upright",
        ),
        "finiteFrames": {
            "seat": (0, 1, 2, 2, 1, 0),
            "roller": (None, None, 0, 2, 3, None),
            "display": (0, 1, 2, 3, 1, 0),
        },
        "seamRoles": ("seat", "roller", "display"),
        "prop": None,
    },
)


def read_json(path: Path) -> dict[str, Any]:
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def sha256_bytes(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def sha256_file(path: Path) -> str:
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


def png_bytes(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, "PNG", optimize=False, compress_level=9)
    return buffer.getvalue()


def gif_bytes(frames: list[Image.Image], duration_ms: int) -> bytes:
    converted = [
        frame.convert("RGB").quantize(colors=255)
        for frame in frames
    ]
    buffer = io.BytesIO()
    converted[0].save(
        buffer,
        "GIF",
        save_all=True,
        append_images=converted[1:],
        duration=duration_ms,
        loop=0,
        disposal=2,
        optimize=False,
    )
    return buffer.getvalue()


def occupied_runs(values: list[bool]) -> list[tuple[int, int]]:
    runs: list[tuple[int, int]] = []
    start: int | None = None
    for index, occupied in enumerate(values + [False]):
        if occupied and start is None:
            start = index
        elif not occupied and start is not None:
            if index - start > 2:
                runs.append((start, index))
            start = None
    return runs


def reduce_runs(
    runs: list[tuple[int, int]],
    expected_count: int,
) -> list[tuple[int, int]]:
    reduced = list(runs)
    while len(reduced) > expected_count:
        gaps = [
            reduced[index + 1][0] - reduced[index][1]
            for index in range(len(reduced) - 1)
        ]
        merge_at = gaps.index(min(gaps))
        reduced[merge_at:merge_at + 2] = [
            (reduced[merge_at][0], reduced[merge_at + 1][1])
        ]
    return reduced


def projection_runs(
    image: Image.Image,
    axis: str,
) -> list[tuple[int, int]]:
    alpha = image.getchannel("A")
    if axis == "x":
        values = [
            alpha.crop((x, 0, x + 1, image.height)).getbbox() is not None
            for x in range(image.width)
        ]
    else:
        values = [
            alpha.crop((0, y, image.width, y + 1)).getbbox() is not None
            for y in range(image.height)
        ]
    return occupied_runs(values)


def extract_atlas(
    family: dict[str, Any],
) -> tuple[dict[str, list[Image.Image]], list[dict[str, Any]]]:
    slug = family["slug"]
    path = SOURCE_ROOT / "source-alpha" / f"{slug}-motion-atlas-alpha.png"
    atlas = Image.open(ROOT / path).convert("RGBA")
    columns = projection_runs(atlas, "x")
    rows = reduce_runs(
        projection_runs(atlas, "y"),
        len(family["rows"]),
    )
    if len(columns) != 4 or len(rows) != len(family["rows"]):
        raise ValueError(
            f"{slug} atlas layout changed: columns={columns}, rows={rows}"
        )
    parts: dict[str, list[Image.Image]] = {}
    records: list[dict[str, Any]] = []
    for row_index, role in enumerate(family["rows"]):
        parts[role] = []
        y0, y1 = rows[row_index]
        for column, phase in enumerate(PHASES):
            x0, x1 = columns[column]
            cell = atlas.crop((x0, y0, x1, y1))
            bounds = cell.getbbox()
            if bounds is None:
                raise ValueError(f"{slug}.{role}.{phase} is empty")
            left, top, right, bottom = bounds
            pad = 4
            crop_box = (
                max(0, left - pad),
                max(0, top - pad),
                min(cell.width, right + pad),
                min(cell.height, bottom + pad),
            )
            cutout = cell.crop(crop_box)
            if cutout.getbbox() is None:
                raise ValueError(f"{slug}.{role}.{phase} cutout is empty")
            parts[role].append(cutout)
            records.append(
                {
                    "role": role,
                    "phase": phase,
                    "sourceBox": [
                        x0 + crop_box[0],
                        y0 + crop_box[1],
                        x0 + crop_box[2],
                        y0 + crop_box[3],
                    ],
                    "sourceCellTouchesAtlasBoundary": False,
                    "size": list(cutout.size),
                }
            )
    return parts, records


def fit_part(
    part: Image.Image,
    target: tuple[int, int, int, int],
    mode: str,
) -> tuple[Image.Image, tuple[int, int]]:
    left, top, right, bottom = target
    target_size = (right - left, bottom - top)
    if mode == "fill":
        resized = ImageOps.fit(
            part,
            target_size,
            method=Image.Resampling.NEAREST,
            centering=(0.5, 0.5),
        )
        return resized, (left, top)
    contained = ImageOps.contain(
        part,
        target_size,
        method=Image.Resampling.NEAREST,
    )
    x = left + (target_size[0] - contained.width) // 2
    if mode == "contain-bottom":
        y = bottom - contained.height
    else:
        y = top + (target_size[1] - contained.height) // 2
    return contained, (x, y)


def layer_for(
    family: dict[str, Any],
    role: str,
    part: Image.Image,
) -> Image.Image:
    layer = Image.new("RGBA", RUNTIME_SIZE, (0, 0, 0, 0))
    rotation = family.get("rotate", {}).get(role)
    if rotation:
        part = part.rotate(rotation, expand=True, resample=Image.Resampling.NEAREST)
    fitted, origin = fit_part(
        part,
        family["regions"][role],
        family["fit"][role],
    )
    layer.alpha_composite(fitted, origin)
    return layer


def shell_for(family: dict[str, Any]) -> Image.Image:
    source = family.get("rearBase", family["base"])
    shell = Image.open(ROOT / source).convert("RGBA")
    if shell.size != RUNTIME_SIZE:
        raise ValueError(f"{family['slug']} base size changed: {shell.size}")
    for role in family.get("clearRegions", ()):
        left, top, right, bottom = family["regions"][role]
        shell.paste(
            Image.new("RGBA", (right - left, bottom - top), (0, 0, 0, 0)),
            (left, top),
        )
    return shell


def compose(
    shell: Image.Image,
    layers: list[Image.Image],
    foreground: Image.Image | None = None,
) -> Image.Image:
    output = shell.copy()
    for layer in layers:
        output.alpha_composite(layer)
    if foreground is not None:
        output.alpha_composite(foreground)
    return output


def crop_actor(
    sheet: Image.Image,
    row: int,
    frame: int,
) -> Image.Image:
    if sheet.width % 8 or sheet.height % 15:
        raise ValueError(f"Unexpected actor sheet size: {sheet.size}")
    width = sheet.width // 8
    height = sheet.height // 15
    return sheet.crop(
        (frame * width, row * height, (frame + 1) * width, (row + 1) * height)
    ).convert("RGBA")


def load_anna_interaction() -> tuple[list[Image.Image], list[dict[str, Any]]]:
    manifest = read_json(I01_MANIFEST)
    anna = next(item for item in manifest["characters"] if item["id"] == "anna")
    if sha256_file(Path(anna["sheet"])) != anna["sheetSha256"]:
        raise ValueError("Anna I01 sheet authority changed")
    sheet = Image.open(ROOT / anna["sheet"]).convert("RGBA")
    frames = [
        crop_actor(sheet, anna["row"], frame)
        for frame in range(FINITE_COUNT)
    ]
    return frames, anna["frames"]


def load_anna_seated() -> tuple[list[Image.Image], list[dict[str, Any]]]:
    manifest = read_json(SEAT_MANIFEST)
    anna = next(item for item in manifest["entries"] if item["slug"] == "anna")
    front = anna["orientations"]["front"]
    if sha256_file(Path(anna["source"]["file"])) != anna["source"]["sha256"]:
        raise ValueError("Anna seat sheet authority changed")
    sheet = Image.open(ROOT / anna["source"]["file"]).convert("RGBA")
    frames = [
        crop_actor(sheet, front["row"], frame)
        for frame in range(FINITE_COUNT)
    ]
    return frames, front["frames"]


def load_prop(prop_id: str) -> tuple[Image.Image, dict[str, Any]]:
    manifest = read_json(H01_MANIFEST)
    record = next(item for item in manifest["props"] if item["id"] == prop_id)
    if sha256_file(Path(record["runtimeFile"])) != record["runtimeSha256"]:
        raise ValueError(f"{prop_id} H01 authority changed")
    return Image.open(ROOT / record["runtimeFile"]).convert("RGBA"), record


def neutral_scene() -> Image.Image:
    scene = Image.new("RGBA", (288, 160), (231, 238, 245, 255))
    scene.paste(Image.new("RGBA", (288, 32), (202, 214, 225, 255)), (0, 128))
    return scene


def interaction_frames(
    family: dict[str, Any],
    finite: list[Image.Image],
) -> list[Image.Image]:
    sequence = (0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0)
    machine_origin = (144, 20)
    world_root = (
        machine_origin[0] + BASE_PIVOT[0],
        machine_origin[1] + BASE_PIVOT[1],
    )
    output: list[Image.Image] = []
    if family["kind"] == "massage":
        actor_frames, seat_records = load_anna_seated()
        foreground_path = Path(
            "assets/game/processed/office-facility-upsize-production-v1/"
            "massage-chair-r03/runtime/seat-parts/foreground.png"
        )
        foreground = Image.open(ROOT / foreground_path).convert("RGBA")
        for index in sequence:
            scene = neutral_scene()
            scene.alpha_composite(finite[index], machine_origin)
            seat = seat_records[index]
            actor_origin = (
                machine_origin[0] + 48 - seat["seatContactLocal"][0],
                machine_origin[1] + 76 - seat["seatContactLocal"][1],
            )
            scene.alpha_composite(actor_frames[index], actor_origin)
            scene.alpha_composite(foreground, machine_origin)
            output.append(
                scene.resize((1152, 640), Image.Resampling.NEAREST)
            )
        return output

    actor_frames, actor_records = load_anna_interaction()
    prop_image, prop_record = load_prop(family["prop"])
    for index in sequence:
        scene = neutral_scene()
        scene.alpha_composite(finite[index], machine_origin)
        actor = actor_records[index]
        actor_origin = (
            world_root[0] - actor["rootSocket"][0],
            world_root[1] - actor["rootSocket"][1],
        )
        scene.alpha_composite(actor_frames[index], actor_origin)
        if index in (2, 3, 4):
            prop_origin = (
                actor_origin[0]
                + actor["primaryGripSocket"][0]
                - prop_record["primaryGripSocket"][0],
                actor_origin[1]
                + actor["primaryGripSocket"][1]
                - prop_record["primaryGripSocket"][1],
            )
            scene.alpha_composite(prop_image, prop_origin)
        output.append(scene.resize((1152, 640), Image.Resampling.NEAREST))
    return output


def build_asset_outputs() -> tuple[dict[Path, bytes], list[dict[str, Any]]]:
    outputs: dict[Path, bytes] = {}
    family_records: list[dict[str, Any]] = []
    for family in FAMILIES:
        slug = family["slug"]
        parts, source_records = extract_atlas(family)
        shell = shell_for(family)
        foreground = (
            Image.open(ROOT / family["foreground"]).convert("RGBA")
            if family.get("foreground")
            else None
        )
        shell_path = PROCESSED_ROOT / slug / "runtime" / "shell-front.png"
        outputs[shell_path] = png_bytes(shell)

        layers: dict[str, list[Image.Image]] = {}
        part_records: list[dict[str, Any]] = []
        for role, frames in parts.items():
            layers[role] = []
            for phase_index, (phase, cutout) in enumerate(zip(PHASES, frames)):
                source_path = (
                    PROCESSED_ROOT / slug / "source-cutouts"
                    / f"{role}-{phase}.png"
                )
                source_content = png_bytes(cutout)
                outputs[source_path] = source_content
                layer = layer_for(family, role, cutout)
                layers[role].append(layer)
                layer_path = (
                    PROCESSED_ROOT / slug / "runtime" / "parts"
                    / f"{role}-{phase}.png"
                )
                layer_content = png_bytes(layer)
                outputs[layer_path] = layer_content
                part_records.append(
                    {
                        "role": role,
                        "phase": phase,
                        "sourceCutout": {
                            "file": source_path.as_posix(),
                            "sha256": sha256_bytes(source_content),
                            "size": list(cutout.size),
                        },
                        "runtimeLayer": {
                            "file": layer_path.as_posix(),
                            "sha256": sha256_bytes(layer_content),
                            "size": list(RUNTIME_SIZE),
                        },
                        "sourceRecord": source_records[
                            list(family["rows"]).index(role) * 4 + phase_index
                        ],
                    }
                )

        seam_frames: list[Image.Image] = []
        seam_records: list[dict[str, Any]] = []
        for phase_index, phase in enumerate(PHASES):
            selected = [
                layers[role][phase_index]
                for role in family["seamRoles"]
            ]
            frame = compose(shell, selected, foreground)
            seam_frames.append(frame)
            path = PROCESSED_ROOT / slug / "runtime" / "seam" / f"{phase}.png"
            content = png_bytes(frame)
            outputs[path] = content
            seam_records.append(
                {
                    "phase": phase,
                    "file": path.as_posix(),
                    "sha256": sha256_bytes(content),
                    "size": list(RUNTIME_SIZE),
                }
            )

        finite_frames: list[Image.Image] = []
        finite_records: list[dict[str, Any]] = []
        for state_index, state_name in enumerate(family["finiteNames"]):
            selected: list[Image.Image] = []
            for role in family["rows"]:
                phase_index = family["finiteFrames"][role][state_index]
                if phase_index is not None:
                    selected.append(layers[role][phase_index])
            frame = compose(shell, selected, foreground)
            finite_frames.append(frame)
            path = (
                PROCESSED_ROOT / slug / "runtime" / "finite"
                / f"{state_index:02d}-{state_name}.png"
            )
            content = png_bytes(frame)
            outputs[path] = content
            finite_records.append(
                {
                    "index": state_index,
                    "state": state_name,
                    "file": path.as_posix(),
                    "sha256": sha256_bytes(content),
                    "size": list(RUNTIME_SIZE),
                }
            )

        seam_preview = [
            frame.resize((384, 512), Image.Resampling.NEAREST)
            for frame in seam_frames
        ]
        seam_gif_path = REVIEW_ROOT / slug / f"{slug}-authored-seam-loop.gif"
        seam_gif = gif_bytes(seam_preview, 240)
        outputs[seam_gif_path] = seam_gif

        person_preview = interaction_frames(family, finite_frames)
        interaction_path = (
            REVIEW_ROOT / slug / f"{slug}-authored-interaction.gif"
        )
        interaction_gif = gif_bytes(person_preview, 280)
        outputs[interaction_path] = interaction_gif

        outside_diffs: list[int] = []
        declared = Image.new("1", RUNTIME_SIZE, 0)
        for role in family["regions"]:
            declared.paste(1, family["regions"][role])
        for first, second in zip(seam_frames, seam_frames[1:] + seam_frames[:1]):
            diff = ImageChops.difference(first, second).convert("RGBA")
            bands = diff.split()
            changed = ImageChops.lighter(
                ImageChops.lighter(bands[0], bands[1]),
                ImageChops.lighter(bands[2], bands[3]),
            )
            changed.paste(0, mask=declared)
            outside_diffs.append(
                sum(1 for value in changed.getdata() if value)
            )

        family_records.append(
            {
                "slug": slug,
                "label": family["label"],
                "kind": family["kind"],
                "approvedShell": {
                    "file": family["base"],
                    "sha256": sha256_file(Path(family["base"])),
                    "size": list(RUNTIME_SIZE),
                },
                "derivedShell": {
                    "file": shell_path.as_posix(),
                    "sha256": sha256_bytes(outputs[shell_path]),
                    "size": list(RUNTIME_SIZE),
                },
                "atlas": {
                    "chroma": (
                        SOURCE_ROOT / "source"
                        / f"{slug}-motion-atlas-chroma.png"
                    ).as_posix(),
                    "alpha": (
                        SOURCE_ROOT / "source-alpha"
                        / f"{slug}-motion-atlas-alpha.png"
                    ).as_posix(),
                    "componentCount": len(source_records),
                    "rows": list(family["rows"]),
                },
                "regions": {
                    role: list(region)
                    for role, region in family["regions"].items()
                },
                "parts": part_records,
                "seamLoop": {
                    "transition": ["a", "b", "c", "d", "a"],
                    "durationMs": 240,
                    "frames": seam_records,
                    "gif": {
                        "file": seam_gif_path.as_posix(),
                        "sha256": sha256_bytes(seam_gif),
                        "size": [384, 512],
                    },
                    "outsideDeclaredChangedPixels": outside_diffs,
                    "pivotDeltaPixels": [0, 0],
                },
                "finiteUse": {
                    "states": list(family["finiteNames"]),
                    "frames": finite_records,
                    "interactionGif": {
                        "file": interaction_path.as_posix(),
                        "sha256": sha256_bytes(interaction_gif),
                        "size": [1152, 640],
                    },
                },
            }
        )
    return outputs, family_records
