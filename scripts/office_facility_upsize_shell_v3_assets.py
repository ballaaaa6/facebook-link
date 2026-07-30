"""Authored-pixel compositor for Office Facility Integrated Shell V3.

Visible shell and effect pixels must come from approved raster sources. This
module may crop, resize, rotate, mask, translate, and alpha-composite those
pixels. Review labels and diagrams belong to the separate review builder.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageOps

import office_facility_upsize_motion_v2_assets as motion_v2


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path(
    "assets/art/layout-references/office-facility-upsize-shell-v3"
)
PROCESSED_ROOT = Path(
    "assets/game/processed/office-facility-upsize-shell-v3"
)
REVIEW_ROOT = SOURCE_ROOT
RUNTIME_SIZE = (96, 128)
BASE_PIVOT = (48, 124)
PHASES = ("a", "b", "c", "d")
FINITE_COUNT = 6
VIEW_NAMES = ("front", "left", "right", "back")

V2_BY_SLUG = {family["slug"]: family for family in motion_v2.FAMILIES}

FAMILIES: tuple[dict[str, Any], ...] = (
    {
        "slug": "coffee-machine-c02",
        "label": "Coffee Machine C02",
        "kind": "coffee",
        "targetHeight": 120,
        "regions": {
            "screen": (25, 14, 71, 37),
            "steam": (32, 43, 64, 76),
            "pour": (40, 52, 56, 78),
        },
        "fit": {
            "screen": "fill",
            "steam": "contain",
            "pour": "contain-bottom",
        },
        "foregroundRects": ((22, 72, 74, 80),),
        "prop": "held.coffee-mug",
    },
    {
        "slug": "water-dispenser-w02",
        "label": "Water Dispenser W02",
        "kind": "water",
        "targetHeight": 120,
        "regions": {
            "screen": (22, 11, 74, 34),
            "flow": (40, 45, 56, 79),
            "splash": (30, 73, 66, 85),
        },
        "fit": {
            "screen": "fill",
            "flow": "contain-bottom",
            "splash": "fill",
        },
        "foregroundRects": ((23, 79, 73, 87),),
        "prop": "held.water-bottle",
    },
    {
        "slug": "vending-machine-u02",
        "label": "Vending Machine U02",
        "kind": "vending",
        "targetHeight": 116,
        "regions": {
            "merchandise": (16, 12, 64, 66),
            "display": (67, 14, 84, 27),
            "coil": (22, 42, 58, 62),
            "package": (20, 82, 64, 104),
        },
        "fit": {
            "merchandise": "fill",
            "display": "fill",
            "coil": "contain-bottom",
            "package": "contain-bottom",
        },
        "foregroundRects": ((14, 99, 70, 108),),
        "prop": "held.soda-can",
    },
    {
        "slug": "massage-chair-r03",
        "label": "Massage Chair R03",
        "kind": "massage",
        "targetHeight": 112,
        "regions": {
            "seat": (28, 23, 69, 113),
            "roller": (31, 33, 66, 101),
            "display": (75, 45, 87, 69),
        },
        "fit": {
            "seat": "contain-bottom",
            "roller": "contain",
            "display": "fill",
        },
        "rotate": {"display": 90},
        "foregroundRects": (
            (0, 0, 30, 128),
            (67, 0, 96, 128),
            (30, 0, 67, 28),
            (30, 108, 67, 128),
            (22, 55, 39, 98),
            (58, 55, 76, 98),
        ),
        "prop": None,
    },
)


def alpha_column_boxes(image: Image.Image) -> list[tuple[int, int, int, int]]:
    """Return the four authored turnaround cells separated by alpha columns."""
    alpha = image.getchannel("A")
    occupied = [
        x for x in range(image.width)
        if alpha.crop((x, 0, x + 1, image.height)).getbbox()
    ]
    groups: list[list[int]] = []
    for x in occupied:
        if not groups or x > groups[-1][-1] + 1:
            groups.append([x])
        else:
            groups[-1].append(x)
    boxes: list[tuple[int, int, int, int]] = []
    for group in groups:
        band_box = alpha.crop(
            (group[0], 0, group[-1] + 1, image.height)
        ).getbbox()
        if band_box is None:
            continue
        boxes.append(
            (group[0], band_box[1], group[-1] + 1, band_box[3])
        )
    if len(boxes) != 4:
        raise ValueError(
            f"Expected four shell views, found {len(boxes)}: {boxes}"
        )
    return boxes


def normalize_view(
    view: Image.Image,
    target_height: int,
) -> tuple[Image.Image, tuple[int, int], tuple[int, int]]:
    """Scale one authored view uniformly and align it to the locked base pivot."""
    if view.getbbox() is None:
        raise ValueError("Shell source view is empty")
    width = max(1, round(view.width * target_height / view.height))
    if width > RUNTIME_SIZE[0] - 4:
        scale = (RUNTIME_SIZE[0] - 4) / width
        width = RUNTIME_SIZE[0] - 4
        target_height = max(1, round(target_height * scale))
    resized = view.resize(
        (width, target_height),
        Image.Resampling.NEAREST,
    )
    origin = (
        BASE_PIVOT[0] - width // 2,
        BASE_PIVOT[1] - target_height,
    )
    canvas = Image.new("RGBA", RUNTIME_SIZE, (0, 0, 0, 0))
    canvas.alpha_composite(resized, origin)
    return canvas, origin, resized.size


def extract_shell_views(
    family: dict[str, Any],
) -> tuple[dict[str, Image.Image], dict[str, Any]]:
    slug = family["slug"]
    alpha_path = (
        SOURCE_ROOT / "source-alpha"
        / f"{slug}-shell-turnaround-alpha.png"
    )
    chroma_path = (
        SOURCE_ROOT / "source"
        / f"{slug}-shell-turnaround-chroma.png"
    )
    source = Image.open(ROOT / alpha_path).convert("RGBA")
    boxes = alpha_column_boxes(source)
    views: dict[str, Image.Image] = {}
    records: list[dict[str, Any]] = []
    for view_name, box in zip(VIEW_NAMES, boxes):
        cutout = source.crop(box)
        normalized, origin, normalized_size = normalize_view(
            cutout,
            family["targetHeight"],
        )
        views[view_name] = normalized
        records.append(
            {
                "view": view_name,
                "sourceBox": list(box),
                "sourceSize": list(cutout.size),
                "runtimeOrigin": list(origin),
                "runtimeSize": list(normalized_size),
            }
        )
    return views, {
        "chroma": {
            "file": chroma_path.as_posix(),
            "sha256": motion_v2.sha256_file(chroma_path),
            "size": list(
                Image.open(ROOT / chroma_path).size
            ),
        },
        "alpha": {
            "file": alpha_path.as_posix(),
            "sha256": motion_v2.sha256_file(alpha_path),
            "size": list(source.size),
        },
        "views": records,
    }


def fit_part(
    part: Image.Image,
    target: tuple[int, int, int, int],
    mode: str,
) -> tuple[Image.Image, tuple[int, int]]:
    left, top, right, bottom = target
    target_size = (right - left, bottom - top)
    if mode == "fill":
        fitted = ImageOps.fit(
            part,
            target_size,
            method=Image.Resampling.NEAREST,
            centering=(0.5, 0.5),
        )
        return fitted, (left, top)
    fitted = ImageOps.contain(
        part,
        target_size,
        method=Image.Resampling.NEAREST,
    )
    x = left + (target_size[0] - fitted.width) // 2
    y = (
        bottom - fitted.height
        if mode == "contain-bottom"
        else top + (target_size[1] - fitted.height) // 2
    )
    return fitted, (x, y)


def effect_layer(
    family: dict[str, Any],
    role: str,
    part: Image.Image,
) -> Image.Image:
    rotation = family.get("rotate", {}).get(role)
    if rotation:
        part = part.rotate(
            rotation,
            expand=True,
            resample=Image.Resampling.NEAREST,
        )
    fitted, origin = fit_part(
        part,
        family["regions"][role],
        family["fit"][role],
    )
    layer = Image.new("RGBA", RUNTIME_SIZE, (0, 0, 0, 0))
    layer.alpha_composite(fitted, origin)
    return layer


def shell_foreground(
    shell: Image.Image,
    rects: tuple[tuple[int, int, int, int], ...],
) -> Image.Image:
    """Copy only authored shell pixels that must occlude moving parts."""
    foreground = Image.new("RGBA", RUNTIME_SIZE, (0, 0, 0, 0))
    for box in rects:
        foreground.alpha_composite(shell.crop(box), (box[0], box[1]))
    return foreground


def compose(
    shell: Image.Image,
    layers: list[Image.Image],
    foreground: Image.Image,
) -> Image.Image:
    output = shell.copy()
    for layer in layers:
        output.alpha_composite(layer)
    output.alpha_composite(foreground)
    return output


def neutral_scene() -> Image.Image:
    scene = Image.new("RGBA", (288, 160), (231, 238, 245, 255))
    scene.paste(
        Image.new("RGBA", (288, 32), (202, 214, 225, 255)),
        (0, 128),
    )
    return scene


def interaction_frames(
    family: dict[str, Any],
    finite: list[Image.Image],
    foreground: Image.Image,
) -> list[Image.Image]:
    sequence = (0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0)
    machine_origin = (144, 20)
    world_root = (
        machine_origin[0] + BASE_PIVOT[0],
        machine_origin[1] + BASE_PIVOT[1],
    )
    output: list[Image.Image] = []
    if family["kind"] == "massage":
        actor_frames, seat_records = motion_v2.load_anna_seated()
        for index in sequence:
            scene = neutral_scene()
            scene.alpha_composite(finite[index], machine_origin)
            seat = seat_records[index]
            actor_origin = (
                machine_origin[0] + 48 - seat["seatContactLocal"][0],
                machine_origin[1] + 78 - seat["seatContactLocal"][1],
            )
            scene.alpha_composite(actor_frames[index], actor_origin)
            scene.alpha_composite(foreground, machine_origin)
            output.append(
                scene.resize((1152, 640), Image.Resampling.NEAREST)
            )
        return output

    actor_frames, actor_records = motion_v2.load_anna_interaction()
    prop_image, prop_record = motion_v2.load_prop(family["prop"])
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
        output.append(
            scene.resize((1152, 640), Image.Resampling.NEAREST)
        )
    return output


def changed_outside_regions(
    frames: list[Image.Image],
    regions: dict[str, tuple[int, int, int, int]],
) -> list[int]:
    declared = Image.new("1", RUNTIME_SIZE, 0)
    for region in regions.values():
        declared.paste(1, region)
    counts: list[int] = []
    pairs = zip(frames, frames[1:] + frames[:1])
    for first, second in pairs:
        diff = ImageChops.difference(first, second).convert("RGBA")
        bands = diff.split()
        changed = ImageChops.lighter(
            ImageChops.lighter(bands[0], bands[1]),
            ImageChops.lighter(bands[2], bands[3]),
        )
        changed.paste(0, mask=declared)
        counts.append(sum(1 for value in changed.getdata() if value))
    return counts


def build_asset_outputs() -> tuple[dict[Path, bytes], list[dict[str, Any]]]:
    outputs: dict[Path, bytes] = {}
    records: list[dict[str, Any]] = []
    for family in FAMILIES:
        slug = family["slug"]
        v2_family = V2_BY_SLUG[slug]
        views, source_record = extract_shell_views(family)
        shell = views["front"]
        foreground = shell_foreground(
            shell,
            family["foregroundRects"],
        )

        shell_files: dict[str, dict[str, Any]] = {}
        for view_name, view in views.items():
            path = (
                PROCESSED_ROOT / slug / "runtime" / "shell"
                / f"{view_name}.png"
            )
            content = motion_v2.png_bytes(view)
            outputs[path] = content
            shell_files[view_name] = {
                "file": path.as_posix(),
                "sha256": motion_v2.sha256_bytes(content),
                "size": list(RUNTIME_SIZE),
            }
        foreground_path = (
            PROCESSED_ROOT / slug / "runtime" / "shell"
            / "front-foreground.png"
        )
        foreground_content = motion_v2.png_bytes(foreground)
        outputs[foreground_path] = foreground_content

        parts, source_parts = motion_v2.extract_atlas(v2_family)
        layers: dict[str, list[Image.Image]] = {}
        layer_records: list[dict[str, Any]] = []
        for role, role_parts in parts.items():
            layers[role] = []
            for index, (phase, part) in enumerate(zip(PHASES, role_parts)):
                layer = effect_layer(family, role, part)
                layers[role].append(layer)
                path = (
                    PROCESSED_ROOT / slug / "runtime" / "parts"
                    / f"{role}-{phase}.png"
                )
                content = motion_v2.png_bytes(layer)
                outputs[path] = content
                source_path = (
                    Path("assets/game/processed/office-facility-upsize-motion-v2")
                    / slug / "source-cutouts" / f"{role}-{phase}.png"
                )
                layer_records.append(
                    {
                        "role": role,
                        "phase": phase,
                        "approvedEffectSource": {
                            "file": source_path.as_posix(),
                            "sha256": motion_v2.sha256_file(source_path),
                            "sourceRecord": source_parts[
                                list(v2_family["rows"]).index(role) * 4 + index
                            ],
                        },
                        "runtimeLayer": {
                            "file": path.as_posix(),
                            "sha256": motion_v2.sha256_bytes(content),
                            "size": list(RUNTIME_SIZE),
                        },
                    }
                )

        seam_frames: list[Image.Image] = []
        seam_records: list[dict[str, Any]] = []
        for index, phase in enumerate(PHASES):
            selected = [
                layers[role][index]
                for role in v2_family["seamRoles"]
            ]
            frame = compose(shell, selected, foreground)
            seam_frames.append(frame)
            path = (
                PROCESSED_ROOT / slug / "runtime" / "seam"
                / f"{phase}.png"
            )
            content = motion_v2.png_bytes(frame)
            outputs[path] = content
            seam_records.append(
                {
                    "phase": phase,
                    "file": path.as_posix(),
                    "sha256": motion_v2.sha256_bytes(content),
                    "size": list(RUNTIME_SIZE),
                }
            )

        finite_frames: list[Image.Image] = []
        finite_records: list[dict[str, Any]] = []
        for state_index, state in enumerate(v2_family["finiteNames"]):
            selected: list[Image.Image] = []
            for role in v2_family["rows"]:
                phase_index = v2_family["finiteFrames"][role][state_index]
                if phase_index is not None:
                    selected.append(layers[role][phase_index])
            frame = compose(shell, selected, foreground)
            finite_frames.append(frame)
            path = (
                PROCESSED_ROOT / slug / "runtime" / "finite"
                / f"{state_index:02d}-{state}.png"
            )
            content = motion_v2.png_bytes(frame)
            outputs[path] = content
            finite_records.append(
                {
                    "index": state_index,
                    "state": state,
                    "file": path.as_posix(),
                    "sha256": motion_v2.sha256_bytes(content),
                    "size": list(RUNTIME_SIZE),
                }
            )

        seam_gif_path = REVIEW_ROOT / slug / f"{slug}-shell-v3-seam-loop.gif"
        seam_gif = motion_v2.gif_bytes(
            [
                frame.resize((384, 512), Image.Resampling.NEAREST)
                for frame in seam_frames
            ],
            240,
        )
        outputs[seam_gif_path] = seam_gif

        interaction_gif_path = (
            REVIEW_ROOT / slug / f"{slug}-shell-v3-interaction.gif"
        )
        interaction_gif = motion_v2.gif_bytes(
            interaction_frames(family, finite_frames, foreground),
            280,
        )
        outputs[interaction_gif_path] = interaction_gif

        records.append(
            {
                "slug": slug,
                "label": family["label"],
                "kind": family["kind"],
                "shellSource": source_record,
                "runtimeShell": {
                    "views": shell_files,
                    "foreground": {
                        "file": foreground_path.as_posix(),
                        "sha256": motion_v2.sha256_bytes(
                            foreground_content
                        ),
                        "size": list(RUNTIME_SIZE),
                    },
                },
                "effectAuthority": {
                    "manifest": (
                        "assets/game/manifests/"
                        "office-facility-upsize-motion-v2.json"
                    ),
                    "regions": {
                        key: list(value)
                        for key, value in family["regions"].items()
                    },
                    "parts": layer_records,
                },
                "seamLoop": {
                    "transition": ["a", "b", "c", "d", "a"],
                    "durationMs": 240,
                    "frames": seam_records,
                    "gif": {
                        "file": seam_gif_path.as_posix(),
                        "sha256": motion_v2.sha256_bytes(seam_gif),
                        "size": [384, 512],
                    },
                    "outsideDeclaredChangedPixels": changed_outside_regions(
                        seam_frames,
                        family["regions"],
                    ),
                    "pivotDeltaPixels": [0, 0],
                },
                "finiteUse": {
                    "states": list(v2_family["finiteNames"]),
                    "frames": finite_records,
                    "idleReturnExact": (
                        finite_records[0]["sha256"]
                        == finite_records[-1]["sha256"]
                    ),
                    "interactionGif": {
                        "file": interaction_gif_path.as_posix(),
                        "sha256": motion_v2.sha256_bytes(
                            interaction_gif
                        ),
                        "size": [1152, 640],
                    },
                },
                "_images": {
                    "views": views,
                    "foreground": foreground,
                    "layers": layers,
                    "seam": seam_frames,
                    "finite": finite_frames,
                },
            }
        )
    return outputs, records
