"""Build the isolated Server Rack N01 visual preflight.

This producer uses only audit-approved original masters. It intentionally stops
before the 108-pose family proof, two-instance placement matrix, reservation
simulation, F8 approval, furniture-only room composition, or Active Office.
"""

from __future__ import annotations

import argparse
import io
import json
import sys
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageDraw

from office_facility_art import (
    BODY_FONT,
    HEADING_FONT,
    SMALL_FONT,
    TITLE_FONT,
    checkerboard,
    clear_box,
    connected_components,
    draw_title,
    json_bytes,
    png_bytes,
    remove_magenta_chroma,
    sha256_bytes,
    sha256_file,
)

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = (
    ROOT / "assets/game/manifests/office-facility-server-rack-n01.json"
)
AUDIT_PATH = (
    ROOT / "assets/game/manifests/office-furniture-master-audit-v1.json"
)
FRONT_MASTER = ROOT / (
    "assets/art/layout-references/"
    "release-qa-noc-sheet-modern-bright-v1-source.png"
)
LOOP_MASTER = ROOT / (
    "assets/art/layout-references/"
    "mechanical-loops-sheet-modern-bright-v1-source.png"
)
ACTION_MANIFEST_PATH = (
    ROOT / "assets/game/manifests/office-character-action-sockets-i01.json"
)
HELD_MANIFEST_PATH = ROOT / "assets/game/manifests/office-held-props-h01.json"
SPATIAL_MANIFEST_PATH = (
    ROOT / "assets/game/manifests/office-spatial-authority-i01.json"
)
OUTPUT_ROOT = ROOT / (
    "assets/game/processed/office-facility-family-v1/server-rack-n01"
)
SOURCE_ROOT = OUTPUT_ROOT / "authoring/source"
AUTHORING_ROOT = OUTPUT_ROOT / "authoring/preflight"
RUNTIME_ROOT = OUTPUT_ROOT / "runtime/preflight"
REVIEW_ROOT = ROOT / (
    "assets/art/layout-references/office-facility-family-v1/server-rack-n01"
)

FRONT_SOURCE_SHA256 = (
    "4ac5f67ef4f49cef7c15d0db1beed11f9504f3ff2ae33d6ff4a644d9496edd5e"
)
LOOP_SOURCE_SHA256 = (
    "31109c9ecf2bc5b0f7d35caca821c77c29819fe19d73e895c88976e3d877274a"
)
AUDIT_PREFIX = "modern-bright-library-v1:"
FRONT_SPEC = {
    "auditRecordId": f"{AUDIT_PREFIX}env-04-release-noc:server.rack.noc",
    "sourceBounds": (0, 627, 314, 940),
    "seed": (150, 790),
    "expectedComponentBounds": (63, 661, 263, 909),
    "expectedComponentPixels": 48498,
}
FRAME_IDS = ("a", "b", "c", "d")
LOOP_SPECS = (
    {
        "frameId": "a",
        "auditRecordId": (
            f"{AUDIT_PREFIX}env-07-animated-mechanical:server.rack.loop.a"
        ),
        "sourceBounds": (0, 940, 314, 1254),
        "seed": (170, 1060),
        "expectedComponentBounds": (66, 930, 274, 1195),
        "expectedComponentPixels": 53369,
        "viewportSourceBox": (95, 965, 231, 1161),
    },
    {
        "frameId": "b",
        "auditRecordId": (
            f"{AUDIT_PREFIX}env-07-animated-mechanical:server.rack.loop.b"
        ),
        "sourceBounds": (314, 940, 627, 1254),
        "seed": (470, 1060),
        "expectedComponentBounds": (368, 930, 577, 1195),
        "expectedComponentPixels": 53780,
        "viewportSourceBox": (397, 965, 533, 1161),
    },
    {
        "frameId": "c",
        "auditRecordId": (
            f"{AUDIT_PREFIX}env-07-animated-mechanical:server.rack.loop.c"
        ),
        "sourceBounds": (627, 940, 940, 1254),
        "seed": (770, 1060),
        "expectedComponentBounds": (670, 930, 876, 1195),
        "expectedComponentPixels": 53053,
        "viewportSourceBox": (699, 965, 835, 1161),
    },
    {
        "frameId": "d",
        "auditRecordId": (
            f"{AUDIT_PREFIX}env-07-animated-mechanical:server.rack.loop.d"
        ),
        "sourceBounds": (940, 940, 1254, 1254),
        "seed": (1070, 1060),
        "expectedComponentBounds": (975, 930, 1181, 1195),
        "expectedComponentPixels": 53040,
        "viewportSourceBox": (1004, 965, 1140, 1161),
    },
)
REJECTED_SIDE_RECORDS = (
    f"{AUDIT_PREFIX}env-12-facility-side-orientations:"
    "server.rack.noc.side-left",
    f"{AUDIT_PREFIX}env-12-facility-side-orientations:"
    "server.rack.noc.side-right",
)

AUTHORING_CANVAS = (256, 384)
RUNTIME_CANVAS = (64, 96)
SOURCE_SUBJECT_TARGET = (240, 298)
SOURCE_SUBJECT_ORIGIN = (8, 70)
VIEWPORT_AUTHORING = (32, 96, 196, 332)
VIEWPORT_RUNTIME = (8, 24, 49, 83)
VIEWPORT_AUTHORING_SIZE = (164, 236)
VIEWPORT_RUNTIME_SIZE = (41, 59)
BASE_PIVOT_RUNTIME = (32, 92)
FRAME_DURATION_MS = 220
GIF_SIZE = (512, 512)
INTERACTION_GIF_SIZE = (768, 512)
INTERACTION_FRAME_DURATION_MS = 240
INTERACTION_ACTOR_ID = "anna"
HELD_PROP_ID = "held.tablet"
INSTANCE_IDS = ("server-rack-01", "server-rack-02")

PROCESSED_PATHS = {
    "frontKeyed": SOURCE_ROOT / "release-qa-noc-master.keyed.png",
    "frontMask": SOURCE_ROOT / "server-front.full-master-ownership-mask.png",
    "frontCutout": SOURCE_ROOT / "server-front.source.png",
    "loopKeyed": SOURCE_ROOT / "mechanical-loops-master.keyed.png",
    "frontAuthoring": AUTHORING_ROOT / "server-front.png",
    "shellAuthoring": AUTHORING_ROOT / "server-shell.png",
    "frontRuntime": RUNTIME_ROOT / "server-front.png",
    "shellRuntime": RUNTIME_ROOT / "server-shell.png",
}
for frame_id in FRAME_IDS:
    PROCESSED_PATHS[f"statusSource{frame_id.upper()}"] = (
        SOURCE_ROOT / f"server-status-source-{frame_id}.png"
    )
    PROCESSED_PATHS[f"statusAuthoring{frame_id.upper()}"] = (
        AUTHORING_ROOT / f"server-status-{frame_id}.png"
    )
    PROCESSED_PATHS[f"statusRuntime{frame_id.upper()}"] = (
        RUNTIME_ROOT / f"server-status-{frame_id}.png"
    )
    PROCESSED_PATHS[f"compositeRuntime{frame_id.upper()}"] = (
        RUNTIME_ROOT / f"server-composite-{frame_id}.png"
    )

REVIEW_SPECS = (
    ("01-source-ownership.png", (1800, 1100)),
    ("02-clean-front-alpha.png", (1600, 1000)),
    ("03-parts-shell-status.png", (1700, 1000)),
    ("04-scale-actor-tablet.png", (1600, 1000)),
    ("05-geometry-footprint-approach.png", (1600, 1000)),
    ("06-status-loop-a-d-a.png", (1800, 950)),
    ("07-two-instance-preview.png", (1800, 1000)),
    ("08-inspect-tablet-preview.png", (1800, 1000)),
)
REVIEW_PATHS = tuple(REVIEW_ROOT / name for name, _ in REVIEW_SPECS)
STATUS_GIF_PATH = REVIEW_ROOT / "server-status-loop.gif"
INTERACTION_GIF_PATH = REVIEW_ROOT / "anna-inspect-tablet.gif"
ACTIVE_OFFICE_FILES = (
    "apps/web/src/features/office/components/officeAssetRegistry.ts",
    "assets/game/maps/office-c-v2.json",
    "apps/web/src/features/office/components/officeSceneRuntime.ts",
)


def repo_path(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def component_for_seed(
    components: list[dict[str, Any]],
    seed: tuple[int, int],
    width: int,
) -> dict[str, Any]:
    index = seed[1] * width + seed[0]
    for component in components:
        if index in component["points"]:
            return component
    raise ValueError(f"No connected component owns source seed {seed}")


def component_layer(
    source: Image.Image,
    component: dict[str, Any],
) -> Image.Image:
    layer = Image.new("RGBA", source.size, (0, 0, 0, 0))
    source_pixels = source.load()
    output_pixels = layer.load()
    for index in component["points"]:
        x = index % source.width
        y = index // source.width
        output_pixels[x, y] = source_pixels[x, y]
    return layer


def box_touches_boundary(
    box: tuple[int, int, int, int],
    cell: tuple[int, int, int, int],
) -> bool:
    return (
        box[0] <= cell[0]
        or box[1] <= cell[1]
        or box[2] >= cell[2]
        or box[3] >= cell[3]
    )


def component_crosses_nominal_top(
    component: dict[str, Any],
    cell: tuple[int, int, int, int],
) -> bool:
    return component["bounds"][1] < cell[1]


def alpha_pixel_count(image: Image.Image) -> int:
    return sum(1 for value in image.getchannel("A").getdata() if value)


def changed_pixels(first: Image.Image, second: Image.Image) -> int:
    return sum(
        1
        for y in range(first.height)
        for x in range(first.width)
        if first.getpixel((x, y)) != second.getpixel((x, y))
    )


def changed_outside(
    first: Image.Image,
    second: Image.Image,
    box: tuple[int, int, int, int],
) -> int:
    return sum(
        1
        for y in range(first.height)
        for x in range(first.width)
        if not (box[0] <= x < box[2] and box[1] <= y < box[3])
        and first.getpixel((x, y)) != second.getpixel((x, y))
    )


def asset_record(path: Path, content: bytes, size: tuple[int, int]) -> dict[str, Any]:
    return {
        "file": repo_path(path),
        "sha256": sha256_bytes(content),
        "size": list(size),
    }


def place_scaled(
    canvas: Image.Image,
    source: Image.Image,
    box: tuple[int, int, int, int],
) -> None:
    canvas.alpha_composite(
        source.resize(
            (box[2] - box[0], box[3] - box[1]),
            Image.Resampling.NEAREST,
        ),
        (box[0], box[1]),
    )


def panel(
    image: Image.Image,
    box: tuple[int, int, int, int],
    heading: str,
) -> tuple[ImageDraw.ImageDraw, tuple[int, int, int, int]]:
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle(
        box,
        radius=18,
        fill=(247, 249, 252, 255),
        outline=(174, 188, 203, 255),
        width=2,
    )
    draw.text(
        (box[0] + 20, box[1] + 16),
        heading,
        font=HEADING_FONT,
        fill=(28, 52, 76, 255),
    )
    return draw, (box[0] + 20, box[1] + 62, box[2] - 20, box[3] - 20)


def paste_contained(
    canvas: Image.Image,
    source: Image.Image,
    box: tuple[int, int, int, int],
    *,
    nearest: bool = True,
) -> None:
    copy = source.copy()
    resample = Image.Resampling.NEAREST if nearest else Image.Resampling.LANCZOS
    copy.thumbnail((box[2] - box[0], box[3] - box[1]), resample)
    x = box[0] + (box[2] - box[0] - copy.width) // 2
    y = box[1] + (box[3] - box[1] - copy.height) // 2
    canvas.alpha_composite(copy, (x, y))


def source_evidence() -> dict[str, Any]:
    audit = read_json(AUDIT_PATH)
    by_id = {record["recordId"]: record for record in audit["records"]}
    front_record = by_id.get(FRONT_SPEC["auditRecordId"])
    if front_record is None:
        raise ValueError("Server front audit authority is missing")
    front_decision = front_record.get("currentDecision", {})
    if (
        front_decision.get("decision") != "salvage-full-master-and-decompose"
        or front_decision.get("masterPixelsSalvageable") is not True
        or tuple(front_record["sourceBounds"]) != FRONT_SPEC["sourceBounds"]
        or front_record["orientation"] != "front"
        or front_record["sourcePixelEvidence"]["nominalCellBoundaryContact"]
        is not False
    ):
        raise ValueError("Server front audit authority changed")

    loop_records = []
    for spec in LOOP_SPECS:
        record = by_id.get(spec["auditRecordId"])
        if record is None:
            raise ValueError(f"Missing status-loop audit: {spec['frameId']}")
        decision = record.get("currentDecision", {})
        if (
            decision.get("decision") != "salvage-full-master-and-decompose"
            or decision.get("masterPixelsSalvageable") is not True
            or tuple(record["sourceBounds"]) != spec["sourceBounds"]
            or record["animationFrame"] != spec["frameId"]
            or record["sourcePixelEvidence"]["nominalCellBoundaryContact"]
            is not True
        ):
            raise ValueError(f"Status-loop audit changed: {spec['frameId']}")
        loop_records.append(record)

    side_records = []
    for record_id in REJECTED_SIDE_RECORDS:
        record = by_id.get(record_id)
        if record is None:
            raise ValueError(f"Missing rejected side authority: {record_id}")
        decision = record.get("currentDecision", {})
        if (
            decision.get("decision") != "reject-regenerate-orientation-if-required"
            or decision.get("masterPixelsSalvageable") is not False
        ):
            raise ValueError(f"Rejected side authority changed: {record_id}")
        side_records.append(record)
    return {
        "audit": audit,
        "frontRecord": front_record,
        "loopRecords": loop_records,
        "sideRecords": side_records,
    }


def extract_parts(
    outputs: dict[Path, bytes],
) -> dict[str, Any]:
    authority = source_evidence()
    if sha256_file(FRONT_MASTER) != FRONT_SOURCE_SHA256:
        raise ValueError("Server static-front original master hash changed")
    if sha256_file(LOOP_MASTER) != LOOP_SOURCE_SHA256:
        raise ValueError("Server status-loop original master hash changed")

    front_source = Image.open(FRONT_MASTER).convert("RGBA")
    front_keyed, front_key, front_stats = remove_magenta_chroma(front_source)
    front_components = connected_components(front_keyed)
    front_component = component_for_seed(
        front_components,
        FRONT_SPEC["seed"],
        front_keyed.width,
    )
    if (
        tuple(front_component["bounds"])
        != FRONT_SPEC["expectedComponentBounds"]
        or front_component["pixelCount"] != FRONT_SPEC["expectedComponentPixels"]
    ):
        raise ValueError("Server front source ownership changed")
    front_layer = component_layer(front_keyed, front_component)
    front_cutout = front_layer.crop(front_component["bounds"])
    front_mask = Image.new("RGBA", front_keyed.size, (0, 0, 0, 0))
    mask_pixels = front_mask.load()
    for index in front_component["points"]:
        x = index % front_keyed.width
        y = index // front_keyed.width
        mask_pixels[x, y] = (45, 218, 170, 220)

    front_authoring = Image.new("RGBA", AUTHORING_CANVAS, (0, 0, 0, 0))
    front_authoring.alpha_composite(
        front_cutout.resize(SOURCE_SUBJECT_TARGET, Image.Resampling.NEAREST),
        SOURCE_SUBJECT_ORIGIN,
    )
    shell_authoring = clear_box(front_authoring, VIEWPORT_AUTHORING)

    loop_source = Image.open(LOOP_MASTER).convert("RGBA")
    loop_keyed, loop_key, loop_stats = remove_magenta_chroma(loop_source)
    loop_components = connected_components(loop_keyed)
    viewport_authoring: dict[str, Image.Image] = {}
    viewport_sources: dict[str, Image.Image] = {}
    status_ownership = []
    for spec, audit_record in zip(
        LOOP_SPECS,
        authority["loopRecords"],
        strict=True,
    ):
        component = component_for_seed(
            loop_components,
            spec["seed"],
            loop_keyed.width,
        )
        if (
            tuple(component["bounds"]) != spec["expectedComponentBounds"]
            or component["pixelCount"] != spec["expectedComponentPixels"]
            or not component_crosses_nominal_top(
                component,
                spec["sourceBounds"],
            )
            or box_touches_boundary(
                spec["viewportSourceBox"],
                spec["sourceBounds"],
            )
        ):
            raise ValueError(
                f"Server status ownership changed: {spec['frameId']}"
            )
        source_viewport = loop_keyed.crop(spec["viewportSourceBox"])
        if source_viewport.getbbox() is None:
            raise ValueError(f"Empty status viewport: {spec['frameId']}")
        authored = source_viewport.resize(
            VIEWPORT_AUTHORING_SIZE,
            Image.Resampling.NEAREST,
        )
        viewport_sources[spec["frameId"]] = source_viewport
        viewport_authoring[spec["frameId"]] = authored
        status_ownership.append({
            "frameId": spec["frameId"],
            "auditRecordId": spec["auditRecordId"],
            "sourceBounds": list(spec["sourceBounds"]),
            "fullComponentBounds": list(component["bounds"]),
            "fullComponentPixels": component["pixelCount"],
            "fullComponentCrossesNominalTop": True,
            "selectedViewportSourceBox": list(spec["viewportSourceBox"]),
            "selectedViewportTouchesCellBoundary": False,
            "selectedViewportAlphaPixels": alpha_pixel_count(source_viewport),
            "auditVisiblePixelsInsideCell": (
                audit_record["sourcePixelEvidence"]["visiblePixelCount"]
            ),
        })

    runtime_shell = shell_authoring.resize(
        RUNTIME_CANVAS,
        Image.Resampling.NEAREST,
    )
    runtime_front = front_authoring.resize(
        RUNTIME_CANVAS,
        Image.Resampling.NEAREST,
    )
    runtime_viewports: dict[str, Image.Image] = {}
    runtime_composites: dict[str, Image.Image] = {}
    for frame_id in FRAME_IDS:
        runtime_viewport = viewport_authoring[frame_id].resize(
            VIEWPORT_RUNTIME_SIZE,
            Image.Resampling.NEAREST,
        )
        composite = runtime_shell.copy()
        composite.alpha_composite(
            runtime_viewport,
            (VIEWPORT_RUNTIME[0], VIEWPORT_RUNTIME[1]),
        )
        authored_composite = shell_authoring.copy()
        authored_composite.alpha_composite(
            viewport_authoring[frame_id],
            (VIEWPORT_AUTHORING[0], VIEWPORT_AUTHORING[1]),
        )
        if (
            authored_composite.resize(
                RUNTIME_CANVAS,
                Image.Resampling.NEAREST,
            ).tobytes()
            != composite.tobytes()
        ):
            raise ValueError(
                f"Authoring/runtime composition drift: {frame_id}"
            )
        runtime_viewports[frame_id] = runtime_viewport
        runtime_composites[frame_id] = composite

    outputs[PROCESSED_PATHS["frontKeyed"]] = png_bytes(front_keyed)
    outputs[PROCESSED_PATHS["frontMask"]] = png_bytes(front_mask)
    outputs[PROCESSED_PATHS["frontCutout"]] = png_bytes(front_cutout)
    outputs[PROCESSED_PATHS["loopKeyed"]] = png_bytes(loop_keyed)
    outputs[PROCESSED_PATHS["frontAuthoring"]] = png_bytes(front_authoring)
    outputs[PROCESSED_PATHS["shellAuthoring"]] = png_bytes(shell_authoring)
    outputs[PROCESSED_PATHS["frontRuntime"]] = png_bytes(runtime_front)
    outputs[PROCESSED_PATHS["shellRuntime"]] = png_bytes(runtime_shell)
    for frame_id in FRAME_IDS:
        outputs[PROCESSED_PATHS[f"statusSource{frame_id.upper()}"]] = (
            png_bytes(viewport_sources[frame_id])
        )
        outputs[PROCESSED_PATHS[f"statusAuthoring{frame_id.upper()}"]] = (
            png_bytes(viewport_authoring[frame_id])
        )
        outputs[PROCESSED_PATHS[f"statusRuntime{frame_id.upper()}"]] = (
            png_bytes(runtime_viewports[frame_id])
        )
        outputs[PROCESSED_PATHS[f"compositeRuntime{frame_id.upper()}"]] = (
            png_bytes(runtime_composites[frame_id])
        )

    transitions = [
        changed_pixels(
            runtime_composites[FRAME_IDS[index]],
            runtime_composites[FRAME_IDS[(index + 1) % len(FRAME_IDS)]],
        )
        for index in range(len(FRAME_IDS))
    ]
    outside_changes = sum(
        changed_outside(
            runtime_composites["a"],
            runtime_composites[frame_id],
            VIEWPORT_RUNTIME,
        )
        for frame_id in FRAME_IDS[1:]
    )
    if not all(value > 0 for value in transitions) or outside_changes != 0:
        raise ValueError("Server status loop is not viewport-local")
    return {
        "authority": authority,
        "frontKey": front_key,
        "frontStats": front_stats,
        "loopKey": loop_key,
        "loopStats": loop_stats,
        "frontComponent": front_component,
        "frontKeyed": front_keyed,
        "frontMask": front_mask,
        "loopKeyed": loop_keyed,
        "frontCutout": front_cutout,
        "frontAuthoring": front_authoring,
        "shellAuthoring": shell_authoring,
        "viewportSources": viewport_sources,
        "viewportAuthoring": viewport_authoring,
        "runtimeFront": runtime_front,
        "runtimeShell": runtime_shell,
        "runtimeViewports": runtime_viewports,
        "runtimeComposites": runtime_composites,
        "statusOwnership": status_ownership,
        "transitionChangedPixels": transitions,
        "outsideViewportChangedPixels": outside_changes,
    }


def load_actor_and_tablet() -> dict[str, Any]:
    action = read_json(ACTION_MANIFEST_PATH)
    held = read_json(HELD_MANIFEST_PATH)
    spatial = read_json(SPATIAL_MANIFEST_PATH)
    if (
        action.get("status") != "owner-approved"
        or action.get("pose") != "interact-front"
        or action.get("heldFrames") != [2, 3, 4]
        or action.get("pendingCommercialReview") is not True
        or held.get("status") != "owner-approved"
        or spatial.get("status") != "owner-approved"
    ):
        raise ValueError("Server preflight requires owner-approved I01/H01")
    actor = next(
        record
        for record in action["characters"]
        if record["id"] == INTERACTION_ACTOR_ID
    )
    tablet = next(
        record
        for record in held["props"]
        if record["id"] == HELD_PROP_ID
    )
    if (
        actor["frameSize"] != [96, 104]
        or len(actor["frames"]) != 6
        or tablet["profile"] != "two-hand-wide"
        or tablet["actorSocketRule"] != "midpoint-primary-secondary"
        or tablet["attachmentMode"] != "front-overlay"
    ):
        raise ValueError("Server actor or H01 tablet authority changed")
    actor_sheet_path = ROOT / actor["sheet"]
    tablet_path = ROOT / tablet["runtimeFile"]
    if (
        sha256_file(actor_sheet_path) != actor["sheetSha256"]
        or sha256_file(tablet_path) != tablet["runtimeSha256"]
    ):
        raise ValueError("Server actor or H01 tablet hash changed")
    sheet = Image.open(actor_sheet_path).convert("RGBA")
    width, height = actor["frameSize"]
    interaction_frames = [
        sheet.crop((
            index * width,
            actor["row"] * height,
            (index + 1) * width,
            (actor["row"] + 1) * height,
        ))
        for index in range(6)
    ]
    walk_right = [
        sheet.crop((index * width, height, (index + 1) * width, 2 * height))
        for index in range(8)
    ]
    walk_left = [
        sheet.crop((index * width, 2 * height, (index + 1) * width, 3 * height))
        for index in range(8)
    ]
    return {
        "action": action,
        "held": held,
        "spatial": spatial,
        "actor": actor,
        "tablet": tablet,
        "tabletImage": Image.open(tablet_path).convert("RGBA"),
        "interactionFrames": interaction_frames,
        "walkRight": walk_right,
        "walkLeft": walk_left,
    }


def actor_with_tablet(
    actor_image: Image.Image,
    frame_socket: dict[str, Any],
    tablet_image: Image.Image,
    tablet_socket: tuple[int, int],
    held: bool,
) -> tuple[Image.Image, list[int] | None]:
    composition = Image.new("RGBA", actor_image.size, (0, 0, 0, 0))
    composition.alpha_composite(actor_image)
    if not held:
        return composition, None
    primary = frame_socket["primaryGripSocket"]
    secondary = frame_socket["secondaryGripSocket"]
    target = (
        (primary[0] + secondary[0]) // 2,
        (primary[1] + secondary[1]) // 2,
    )
    origin = (
        target[0] - tablet_socket[0],
        target[1] - tablet_socket[1],
    )
    composition.alpha_composite(tablet_image, origin)
    resolved = (
        origin[0] + tablet_socket[0],
        origin[1] + tablet_socket[1],
    )
    return composition, [resolved[0] - target[0], resolved[1] - target[1]]


def status_gif_bytes(frames: dict[str, Image.Image]) -> bytes:
    previews = []
    for frame_id in FRAME_IDS:
        canvas = Image.new("RGBA", GIF_SIZE, (25, 36, 51, 255))
        draw = ImageDraw.Draw(canvas)
        draw.text(
            (28, 18),
            f"SERVER RACK N01 · STATUS {frame_id.upper()}",
            font=HEADING_FONT,
            fill=(244, 248, 252, 255),
        )
        enlarged = frames[frame_id].resize(
            (256, 384),
            Image.Resampling.NEAREST,
        )
        canvas.alpha_composite(enlarged, (128, 82))
        draw.text(
            (28, 475),
            "immutable shell + statusViewport[n] · 220 ms",
            font=SMALL_FONT,
            fill=(182, 202, 220, 255),
        )
        previews.append(canvas.convert("P", palette=Image.Palette.ADAPTIVE))
    buffer = io.BytesIO()
    previews[0].save(
        buffer,
        "GIF",
        save_all=True,
        append_images=previews[1:],
        loop=0,
        duration=FRAME_DURATION_MS,
        disposal=2,
        optimize=False,
    )
    return buffer.getvalue()


def interaction_gif_bytes(
    machine_frames: dict[str, Image.Image],
    actor_data: dict[str, Any],
) -> tuple[bytes, list[dict[str, Any]]]:
    logical_size = (384, 190)
    machine_origin = (136, 52)
    stand_root = (168, 157)
    tablet_socket = tuple(actor_data["tablet"]["visualCenterSocket"])
    timeline = [
        ("approach", "walk-left", 0, 72, 0, False),
        ("approach", "walk-left", 1, 48, 1, False),
        ("approach", "walk-left", 2, 24, 2, False),
        ("inspect", "interact-front", 0, 0, 3, False),
        ("inspect", "interact-front", 1, 0, 0, False),
        ("inspect", "interact-front", 2, 0, 1, True),
        ("inspect", "interact-front", 3, 0, 2, True),
        ("inspect", "interact-front", 4, 0, 3, True),
        ("inspect", "interact-front", 5, 0, 0, False),
        ("depart", "walk-right", 0, 24, 1, False),
        ("depart", "walk-right", 1, 48, 2, False),
        ("depart", "walk-right", 2, 72, 3, False),
    ]
    previews = []
    records = []
    for phase, animation, frame_index, offset, status_index, held in timeline:
        scene = Image.new("RGBA", logical_size, (221, 230, 237, 255))
        draw_scene = ImageDraw.Draw(scene)
        draw_scene.rectangle((0, 150, 383, 189), fill=(181, 199, 210, 255))
        for x in range(-64, 449, 32):
            draw_scene.line(
                (x, 150, x + 40, 189),
                fill=(149, 172, 187, 255),
                width=1,
            )
        draw_scene.line((0, 150, 383, 150), fill=(91, 118, 135), width=2)
        scene.alpha_composite(
            machine_frames[FRAME_IDS[status_index]],
            machine_origin,
        )
        authority_index = frame_index if animation == "interact-front" else 0
        frame_socket = actor_data["actor"]["frames"][authority_index]
        source_actor = (
            actor_data["interactionFrames"][frame_index]
            if animation == "interact-front"
            else actor_data["walkLeft"][frame_index]
            if animation == "walk-left"
            else actor_data["walkRight"][frame_index]
        )
        actor_layer, delta = actor_with_tablet(
            source_actor,
            frame_socket,
            actor_data["tabletImage"],
            tablet_socket,
            held,
        )
        root_x, root_y = frame_socket["rootSocket"]
        actor_origin = (
            stand_root[0] + offset - root_x,
            stand_root[1] - root_y,
        )
        scene.alpha_composite(actor_layer, actor_origin)

        canvas = Image.new("RGBA", INTERACTION_GIF_SIZE, (20, 28, 42, 255))
        canvas.alpha_composite(
            scene.resize((768, 380), Image.Resampling.NEAREST),
            (0, 62),
        )
        draw = ImageDraw.Draw(canvas)
        draw.text(
            (24, 15),
            "SERVER N01 · ANNA · INSPECT-FRONT + H01 TABLET",
            font=HEADING_FONT,
            fill=(244, 248, 251, 255),
        )
        draw.rounded_rectangle(
            (24, 458, 170, 498),
            radius=12,
            fill=(25, 137, 145, 255),
        )
        draw.text(
            (40, 465),
            phase.upper(),
            font=BODY_FONT,
            fill=(255, 255, 255, 255),
        )
        draw.text(
            (192, 467),
            "development-only preview · not a production case",
            font=SMALL_FONT,
            fill=(190, 207, 219, 255),
        )
        previews.append(canvas.convert("P", palette=Image.Palette.ADAPTIVE))
        records.append({
            "phase": phase,
            "animation": animation,
            "actorFrame": frame_index,
            "approachOffsetX": offset,
            "statusFrame": FRAME_IDS[status_index],
            "tabletVisible": held,
            "attachmentDelta": delta,
        })
    if any(
        record["attachmentDelta"] not in (None, [0, 0])
        for record in records
    ):
        raise ValueError("Server tablet preview socket drift")
    buffer = io.BytesIO()
    previews[0].save(
        buffer,
        "GIF",
        save_all=True,
        append_images=previews[1:],
        loop=0,
        duration=INTERACTION_FRAME_DURATION_MS,
        disposal=2,
        optimize=False,
    )
    return buffer.getvalue(), records


def board_source_ownership(parts: dict[str, Any]) -> Image.Image:
    image = Image.new("RGBA", REVIEW_SPECS[0][1], (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Server Rack N01 — Original-Master Source Ownership",
        "Static front owns one isolated component · status uses four interior viewports, never the boundary-touching loop shells",
    )
    _, front_box = panel(image, (40, 120, 650, 1030), "Static front authority")
    front_cell = parts["frontKeyed"].crop(FRONT_SPEC["sourceBounds"])
    paste_contained(image, front_cell, (front_box[0], 205, front_box[2], 700))
    draw.rectangle((90, 190, 600, 720), outline=(47, 177, 126), width=4)
    draw.text(
        (70, 760),
        "component: [63,661,263,909]",
        font=BODY_FONT,
        fill=(35, 57, 74),
    )
    draw.text(
        (70, 805),
        "visible pixels: 48,498",
        font=BODY_FONT,
        fill=(35, 57, 74),
    )
    draw.text(
        (70, 850),
        "cell boundary contact: false",
        font=BODY_FONT,
        fill=(24, 128, 82),
    )
    draw.text(
        (70, 895),
        "processed direct reuse: false",
        font=BODY_FONT,
        fill=(24, 128, 82),
    )

    _, loop_box = panel(
        image,
        (690, 120, 1760, 1030),
        "Status A–D interior ownership",
    )
    for index, spec in enumerate(LOOP_SPECS):
        x = loop_box[0] + 15 + index * 250
        source = parts["viewportSources"][spec["frameId"]]
        backdrop = checkerboard((220, 300), 14)
        paste_contained(backdrop, source, (15, 30, 205, 270))
        image.alpha_composite(backdrop, (x, 210))
        draw.text(
            (x + 98, 170),
            spec["frameId"].upper(),
            font=HEADING_FONT,
            fill=(30, 58, 78),
        )
        draw.text(
            (x + 10, 535),
            "full shell crosses cell top",
            font=SMALL_FONT,
            fill=(181, 83, 47),
        )
        draw.text(
            (x + 10, 570),
            "selected viewport contact: false",
            font=SMALL_FONT,
            fill=(24, 128, 82),
        )
    bullets = (
        "Original static front: release-qa-noc row 2 / column 0",
        "Original status row: mechanical-loops row 3 / columns 0–3",
        "Selected status boxes stay at least 33 px inside nominal cell edges",
        "Rejected side-left and side-right records remain forbidden",
        "No processed library crop, generated repair, or fallback pixel is used",
    )
    for index, text in enumerate(bullets):
        draw.text(
            (720, 720 + index * 48),
            text,
            font=BODY_FONT,
            fill=(35, 57, 74),
        )
    return image


def board_clean(parts: dict[str, Any]) -> Image.Image:
    image = Image.new("RGBA", REVIEW_SPECS[1][1], (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Server Rack N01 — Clean Front and Alpha",
        "One front-only fixed family · exact 2×1×3 contract · composite A shown for shape review",
    )
    _, alpha_box = panel(image, (45, 120, 780, 930), "Transparent runtime")
    checker = checkerboard((640, 700), 24)
    machine = parts["runtimeComposites"]["a"].resize(
        (384, 576),
        Image.Resampling.NEAREST,
    )
    checker.alpha_composite(machine, (128, 62))
    image.alpha_composite(checker, (alpha_box[0] + 20, alpha_box[1] + 10))
    _, facts = panel(image, (825, 120, 1555, 930), "Locked preflight facts")
    rows = (
        ("physical scale", "2 × 1 × 3 tiles"),
        ("floor footprint", "2 × 1 tiles"),
        ("render box", "2 × 3 tiles"),
        ("runtime canvas", "64 × 96 px"),
        ("authoring canvas", "256 × 384 px"),
        ("anchor", "bottom-center"),
        ("authored orientation", "front only"),
        ("visual approval", "pending"),
    )
    for index, (label, value) in enumerate(rows):
        y = facts[1] + 20 + index * 78
        draw.rectangle(
            (facts[0] + 10, y, facts[2] - 10, y + 58),
            fill=(237, 242, 247, 255),
        )
        draw.text((facts[0] + 28, y + 17), label, font=BODY_FONT,
                  fill=(42, 61, 78))
        draw.text((facts[2] - 285, y + 17), value, font=BODY_FONT,
                  fill=(25, 111, 154))
    return image


def board_parts(parts: dict[str, Any]) -> Image.Image:
    image = Image.new("RGBA", REVIEW_SPECS[2][1], (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Server Rack N01 — Modular Part Decomposition",
        "immutable shell + statusViewport[n] · actor/tablet animation remains an independent timeline",
    )
    cards = (
        (45, 145, 535, 900, "STATIC SHELL"),
        (605, 145, 1095, 900, "STATUS VIEWPORT A"),
        (1165, 145, 1655, 900, "COMPOSITE A"),
    )
    sources = (
        parts["runtimeShell"].resize((320, 480), Image.Resampling.NEAREST),
        parts["runtimeViewports"]["a"].resize(
            (328, 472),
            Image.Resampling.NEAREST,
        ),
        parts["runtimeComposites"]["a"].resize(
            (320, 480),
            Image.Resampling.NEAREST,
        ),
    )
    for card, source in zip(cards, sources, strict=True):
        draw.rounded_rectangle(
            card[:4],
            radius=16,
            fill=(247, 249, 252),
            outline=(164, 183, 197),
            width=2,
        )
        draw.text(
            (card[0] + 25, card[1] + 20),
            card[4],
            font=HEADING_FONT,
            fill=(33, 53, 71),
        )
        checker = checkerboard((400, 560), 20)
        paste_contained(checker, source, (25, 35, 375, 525))
        image.alpha_composite(checker, (card[0] + 45, card[1] + 85))
    draw.text(
        (65, 935),
        "Shell/outside-viewport changes: 0 · pivot delta: [0,0] · D→A closure mismatch: 0",
        font=BODY_FONT,
        fill=(24, 128, 82),
    )
    return image


def board_scale(parts: dict[str, Any], actor_data: dict[str, Any]) -> Image.Image:
    image = Image.new("RGBA", REVIEW_SPECS[3][1], (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Server Rack N01 — Scale with Standard Actor and H01 Tablet",
        "Canonical actor 1×1×3 · rack 2×1×3 · semantic inspect-front reuses I01 interact-front pixels",
    )
    _, visual = panel(image, (45, 120, 1050, 930), "Front scale comparison")
    floor_y = 820
    draw.line((visual[0] + 30, floor_y, visual[2] - 30, floor_y),
              fill=(89, 111, 128), width=3)
    rack = parts["runtimeComposites"]["a"].resize(
        (256, 384),
        Image.Resampling.NEAREST,
    )
    image.alpha_composite(rack, (visual[0] + 105, floor_y - 368))
    actor_image, delta = actor_with_tablet(
        actor_data["interactionFrames"][3],
        actor_data["actor"]["frames"][3],
        actor_data["tabletImage"],
        tuple(actor_data["tablet"]["visualCenterSocket"]),
        True,
    )
    image.alpha_composite(
        actor_image.resize((288, 312), Image.Resampling.NEAREST),
        (visual[0] + 520, floor_y - 312),
    )
    draw.rectangle(
        (visual[0] + 515, floor_y - 384, visual[0] + 803, floor_y),
        outline=(48, 142, 199),
        width=3,
    )
    draw.text(
        (visual[0] + 545, floor_y - 425),
        "1 × 1 × 3",
        font=HEADING_FONT,
        fill=(34, 100, 139),
    )
    _, facts = panel(image, (1090, 120, 1555, 930), "Tablet proof")
    tablet = actor_data["tabletImage"].resize((200, 200), Image.Resampling.NEAREST)
    image.alpha_composite(tablet, (facts[0] + 110, facts[1] + 50))
    lines = (
        "H01 held.tablet",
        "profile: two-hand-wide",
        "actor target: hand midpoint",
        "attachment: front-overlay",
        "held frames: 2, 3, 4",
        f"sample socket delta: {delta}",
        "production matrix: not built",
    )
    for index, text in enumerate(lines):
        draw.text(
            (facts[0] + 25, facts[1] + 315 + index * 52),
            text,
            font=BODY_FONT,
            fill=(35, 57, 74),
        )
    return image


def board_geometry(parts: dict[str, Any]) -> Image.Image:
    image = Image.new("RGBA", REVIEW_SPECS[4][1], (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Server Rack N01 — Footprint, Render Box, and Approach",
        "Physical footprint and navigation clearance remain separate · front-only authored placement",
    )
    _, plan = panel(image, (45, 120, 780, 930), "Plan view · 5×5 lab")
    tile = 105
    origin = (plan[0] + 70, plan[1] + 55)
    roles = {
        (1, 1): "rack",
        (2, 1): "rack",
        (1, 2): "stand",
        (2, 2): "approach",
        (3, 2): "exit",
    }
    colors = {
        "rack": (75, 125, 151),
        "stand": (42, 165, 145),
        "approach": (61, 126, 195),
        "exit": (225, 145, 55),
    }
    for y in range(5):
        for x in range(5):
            role = roles.get((x, y))
            box = (
                origin[0] + x * tile,
                origin[1] + y * tile,
                origin[0] + (x + 1) * tile,
                origin[1] + (y + 1) * tile,
            )
            draw.rectangle(
                box,
                fill=colors.get(role, (239, 243, 247)),
                outline=(139, 157, 171),
                width=2,
            )
            if role:
                draw.text(
                    (box[0] + 10, box[1] + 10),
                    role,
                    font=SMALL_FONT,
                    fill=(255, 255, 255),
                )
    _, elevation = panel(image, (825, 120, 1555, 930), "2×3 render envelope")
    scale = 6
    grid_x = elevation[0] + 100
    grid_y = elevation[1] + 40
    for x in range(3):
        draw.line(
            (grid_x + x * 32 * scale, grid_y,
             grid_x + x * 32 * scale, grid_y + 96 * scale),
            fill=(178, 193, 205),
            width=2,
        )
    for y in range(4):
        draw.line(
            (grid_x, grid_y + y * 32 * scale,
             grid_x + 64 * scale, grid_y + y * 32 * scale),
            fill=(178, 193, 205),
            width=2,
        )
    image.alpha_composite(
        parts["runtimeComposites"]["a"].resize(
            (64 * scale, 96 * scale),
            Image.Resampling.NEAREST,
        ),
        (grid_x, grid_y),
    )
    pivot = (
        grid_x + BASE_PIVOT_RUNTIME[0] * scale,
        grid_y + BASE_PIVOT_RUNTIME[1] * scale,
    )
    draw.ellipse(
        (pivot[0] - 10, pivot[1] - 10, pivot[0] + 10, pivot[1] + 10),
        fill=(229, 93, 73),
    )
    draw.text(
        (855, 880),
        "base/sort pivot [32,92] · integer coordinates only",
        font=BODY_FONT,
        fill=(35, 57, 74),
    )
    return image


def board_loop(parts: dict[str, Any]) -> Image.Image:
    image = Image.new("RGBA", REVIEW_SPECS[5][1], (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Server Rack N01 — Status A–D–A Seam Loop",
        "Four real phases plus exact logical wrap · only the declared status viewport changes",
    )
    display = [*FRAME_IDS, "a"]
    for index, frame_id in enumerate(display):
        x = 45 + index * 350
        draw.rounded_rectangle(
            (x, 135, x + 315, 700),
            radius=16,
            fill=(247, 249, 252),
            outline=(169, 187, 201),
            width=2,
        )
        draw.text(
            (x + 145, 155),
            frame_id.upper(),
            font=HEADING_FONT,
            fill=(32, 61, 82),
        )
        image.alpha_composite(
            parts["runtimeComposites"][frame_id].resize(
                (256, 384),
                Image.Resampling.NEAREST,
            ),
            (x + 30, 215),
        )
    draw.text(
        (65, 755),
        f"transition changed pixels: {parts['transitionChangedPixels']}",
        font=BODY_FONT,
        fill=(35, 57, 74),
    )
    draw.text(
        (65, 805),
        "outside viewport: 0 · shell drift: 0 · pivot drift: [0,0] · D→A closure: 0",
        font=BODY_FONT,
        fill=(24, 128, 82),
    )
    return image


def board_instances(parts: dict[str, Any]) -> Image.Image:
    image = Image.new("RGBA", REVIEW_SPECS[6][1], (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Server Rack N01 — One Family, Two Planned Instances",
        "Visual placement preview only · instance reservations and the 216-case matrix remain unbuilt",
    )
    floor_top = 330
    tile = 80
    for y in range(7):
        draw.line((80, floor_top + y * tile, 1720, floor_top + y * tile),
                  fill=(159, 181, 194), width=1)
    for x in range(22):
        draw.line((80 + x * tile, floor_top, 80 + x * tile, 810),
                  fill=(159, 181, 194), width=1)
    origins = ((320, 370), (1040, 370))
    for index, (x, y) in enumerate(origins):
        machine = parts["runtimeComposites"][FRAME_IDS[index * 2]].resize(
            (256, 384),
            Image.Resampling.NEAREST,
        )
        image.alpha_composite(machine, (x, y))
        draw.rectangle(
            (x, y + 320, x + 160, y + 400),
            fill=(67, 119, 146, 90),
            outline=(46, 93, 119),
            width=3,
        )
        draw.rectangle(
            (x + 32, y + 400, x + 112, y + 480),
            fill=(52, 159, 143, 110),
            outline=(29, 120, 105),
            width=3,
        )
        draw.text(
            (x - 5, 270),
            INSTANCE_IDS[index],
            font=HEADING_FONT,
            fill=(31, 60, 80),
        )
        draw.text(
            (x - 5, 845),
            "capacity target 1 · reservation target independent",
            font=BODY_FONT,
            fill=(35, 57, 74),
        )
    draw.text(
        (80, 930),
        "No room placement · no reservation slot counted · same hash-locked family pixels",
        font=BODY_FONT,
        fill=(183, 80, 46),
    )
    return image


def board_interaction(
    parts: dict[str, Any],
    actor_data: dict[str, Any],
) -> Image.Image:
    image = Image.new("RGBA", REVIEW_SPECS[7][1], (228, 234, 241, 255))
    draw = draw_title(
        image,
        "Server Rack N01 — Development Inspect + Tablet Preview",
        "Semantic inspect-front · I01 interact-front pixels · H01 held.tablet on frames 2–4",
    )
    frame_indices = (1, 3, 5)
    labels = ("READY · no tablet", "INSPECT · tablet", "RELEASE · no tablet")
    for index, (frame_index, label) in enumerate(
        zip(frame_indices, labels, strict=True)
    ):
        x = 45 + index * 575
        draw.rounded_rectangle(
            (x, 140, x + 520, 855),
            radius=16,
            fill=(247, 249, 252),
            outline=(169, 187, 201),
            width=2,
        )
        machine = parts["runtimeComposites"][FRAME_IDS[index]]
        scene = Image.new("RGBA", (256, 210), (222, 232, 239, 255))
        scene.alpha_composite(machine, (90, 50))
        held = frame_index in (2, 3, 4)
        actor_layer, delta = actor_with_tablet(
            actor_data["interactionFrames"][frame_index],
            actor_data["actor"]["frames"][frame_index],
            actor_data["tabletImage"],
            tuple(actor_data["tablet"]["visualCenterSocket"]),
            held,
        )
        root = actor_data["actor"]["frames"][frame_index]["rootSocket"]
        scene.alpha_composite(actor_layer, (122 - root[0], 170 - root[1]))
        image.alpha_composite(
            scene.resize((480, 420), Image.Resampling.NEAREST),
            (x + 20, 210),
        )
        draw.text(
            (x + 25, 165),
            label,
            font=HEADING_FONT,
            fill=(32, 61, 82),
        )
        draw.text(
            (x + 25, 665),
            f"frame {frame_index} · tablet {held}",
            font=BODY_FONT,
            fill=(35, 57, 74),
        )
        draw.text(
            (x + 25, 715),
            f"attachment delta {delta}",
            font=BODY_FONT,
            fill=(24, 128, 82),
        )
        draw.text(
            (x + 25, 765),
            "counts toward production: false",
            font=BODY_FONT,
            fill=(183, 80, 46),
        )
    draw.text(
        (65, 910),
        "No new character pixels · no per-character offset · no missing-socket fallback",
        font=BODY_FONT,
        fill=(35, 57, 74),
    )
    return image


def build_outputs() -> dict[Path, bytes]:
    outputs: dict[Path, bytes] = {}
    parts = extract_parts(outputs)
    actor_data = load_actor_and_tablet()
    status_gif = status_gif_bytes(parts["runtimeComposites"])
    interaction_gif, interaction_timeline = interaction_gif_bytes(
        parts["runtimeComposites"],
        actor_data,
    )
    outputs[STATUS_GIF_PATH] = status_gif
    outputs[INTERACTION_GIF_PATH] = interaction_gif

    boards = (
        board_source_ownership(parts),
        board_clean(parts),
        board_parts(parts),
        board_scale(parts, actor_data),
        board_geometry(parts),
        board_loop(parts),
        board_instances(parts),
        board_interaction(parts, actor_data),
    )
    for path, board in zip(REVIEW_PATHS, boards, strict=True):
        outputs[path] = png_bytes(board)

    front_record = parts["authority"]["frontRecord"]
    front_assets = {
        "sourceCutout": asset_record(
            PROCESSED_PATHS["frontCutout"],
            outputs[PROCESSED_PATHS["frontCutout"]],
            parts["frontCutout"].size,
        ),
        "authoring": asset_record(
            PROCESSED_PATHS["frontAuthoring"],
            outputs[PROCESSED_PATHS["frontAuthoring"]],
            AUTHORING_CANVAS,
        ),
        "runtime": asset_record(
            PROCESSED_PATHS["frontRuntime"],
            outputs[PROCESSED_PATHS["frontRuntime"]],
            RUNTIME_CANVAS,
        ),
    }
    shell_assets = {
        "authoring": asset_record(
            PROCESSED_PATHS["shellAuthoring"],
            outputs[PROCESSED_PATHS["shellAuthoring"]],
            AUTHORING_CANVAS,
        ),
        "runtime": asset_record(
            PROCESSED_PATHS["shellRuntime"],
            outputs[PROCESSED_PATHS["shellRuntime"]],
            RUNTIME_CANVAS,
        ),
    }
    status_frames = []
    for frame_id, spec in zip(FRAME_IDS, LOOP_SPECS, strict=True):
        status_frames.append({
            "frameId": frame_id,
            "source": asset_record(
                PROCESSED_PATHS[f"statusSource{frame_id.upper()}"],
                outputs[PROCESSED_PATHS[f"statusSource{frame_id.upper()}"]],
                parts["viewportSources"][frame_id].size,
            ),
            "authoring": asset_record(
                PROCESSED_PATHS[f"statusAuthoring{frame_id.upper()}"],
                outputs[PROCESSED_PATHS[f"statusAuthoring{frame_id.upper()}"]],
                VIEWPORT_AUTHORING_SIZE,
            ),
            "runtime": asset_record(
                PROCESSED_PATHS[f"statusRuntime{frame_id.upper()}"],
                outputs[PROCESSED_PATHS[f"statusRuntime{frame_id.upper()}"]],
                VIEWPORT_RUNTIME_SIZE,
            ),
            "composite": asset_record(
                PROCESSED_PATHS[f"compositeRuntime{frame_id.upper()}"],
                outputs[PROCESSED_PATHS[f"compositeRuntime{frame_id.upper()}"]],
                RUNTIME_CANVAS,
            ),
            "sourceBox": list(spec["viewportSourceBox"]),
        })

    review_outputs = [*REVIEW_PATHS, STATUS_GIF_PATH, INTERACTION_GIF_PATH]
    review_evidence = []
    for path in review_outputs:
        if path.suffix == ".png":
            size = next(
                size for candidate, size in REVIEW_SPECS
                if path.name == candidate
            )
        else:
            size = GIF_SIZE if path == STATUS_GIF_PATH else INTERACTION_GIF_SIZE
        review_evidence.append({
            "path": repo_path(path),
            "sha256": sha256_bytes(outputs[path]),
            "size": list(size),
        })

    passed = lambda *evidence: {"status": "passed", "evidence": list(evidence)}
    blocked = lambda reason: {"status": "blocked", "evidence": [reason]}
    manifest = {
        "schemaVersion": 1,
        "id": "office.facility.server-rack.n01",
        "familyId": "server.rack.noc",
        "revision": "n01-preflight-r01",
        "status": "superseded-owner-redesign-requested",
        "productionStage": "visual-preflight-superseded",
        "developmentOnly": True,
        "activeOfficePromotion": False,
        "sourcePolicy": {
            "originalMasterPixelsOnly": True,
            "processedCropDirectReuse": False,
            "activeOfficePixelReuse": False,
            "rejectedSidePixelReuse": False,
            "newImageGeneration": False,
            "generativeRepair": False,
            "missingAssetFallback": False,
        },
        "sourceAuthority": {
            "audit": {
                "file": repo_path(AUDIT_PATH),
                "sha256": sha256_file(AUDIT_PATH),
            },
            "front": {
                "auditRecordId": FRONT_SPEC["auditRecordId"],
                "sourceFile": repo_path(FRONT_MASTER),
                "sourceSha256": FRONT_SOURCE_SHA256,
                "keyedAsset": asset_record(
                    PROCESSED_PATHS["frontKeyed"],
                    outputs[PROCESSED_PATHS["frontKeyed"]],
                    parts["frontKeyed"].size,
                ),
                "ownershipMaskAsset": asset_record(
                    PROCESSED_PATHS["frontMask"],
                    outputs[PROCESSED_PATHS["frontMask"]],
                    parts["frontMask"].size,
                ),
                "sourceBounds": list(FRONT_SPEC["sourceBounds"]),
                "componentBounds": list(parts["frontComponent"]["bounds"]),
                "componentPixels": parts["frontComponent"]["pixelCount"],
                "componentCount": 1,
                "cellBoundaryContact": False,
                "auditDecision": (
                    front_record["currentDecision"]["decision"]
                ),
                "sampledKeyRgb": list(parts["frontKey"]),
                "chromaStats": parts["frontStats"],
            },
            "status": {
                "sourceFile": repo_path(LOOP_MASTER),
                "sourceSha256": LOOP_SOURCE_SHA256,
                "keyedAsset": asset_record(
                    PROCESSED_PATHS["loopKeyed"],
                    outputs[PROCESSED_PATHS["loopKeyed"]],
                    parts["loopKeyed"].size,
                ),
                "sampledKeyRgb": list(parts["loopKey"]),
                "chromaStats": parts["loopStats"],
                "frames": parts["statusOwnership"],
            },
            "rejectedSides": [
                {
                    "auditRecordId": record["recordId"],
                    "decision": record["currentDecision"]["decision"],
                    "masterPixelsSalvageable": False,
                    "used": False,
                }
                for record in parts["authority"]["sideRecords"]
            ],
        },
        "render": {
            "physicalScale": {
                "width": 2, "depth": 1, "height": 3, "unit": "tile",
            },
            "footprint": {"width": 2, "depth": 1, "unit": "tile"},
            "renderBox": {"width": 2, "height": 3, "unit": "tile"},
            "authoringCanvas": list(AUTHORING_CANVAS),
            "runtimeCanvas": list(RUNTIME_CANVAS),
            "uniformIntegerDivisor": 4,
            "anchor": "bottom-center",
            "basePivotRuntime": list(BASE_PIVOT_RUNTIME),
            "sortPivotRuntime": list(BASE_PIVOT_RUNTIME),
            "authoredOrientations": ["front"],
            "generatedTurns": False,
        },
        "parts": {
            "front": front_assets,
            "shell": shell_assets,
            "statusFrames": status_frames,
        },
        "statusLoop": {
            "compositionFormula": "immutableShell + statusViewport[n]",
            "frameIds": list(FRAME_IDS),
            "transition": [*FRAME_IDS, "a"],
            "frameDurationMs": FRAME_DURATION_MS,
            "cycleDurationMs": FRAME_DURATION_MS * len(FRAME_IDS),
            "viewportAuthoring": list(VIEWPORT_AUTHORING),
            "viewportRuntime": list(VIEWPORT_RUNTIME),
            "transitionChangedPixels": parts["transitionChangedPixels"],
            "shellChangedPixels": 0,
            "outsideViewportChangedPixels": (
                parts["outsideViewportChangedPixels"]
            ),
            "pivotDeltaPixels": [0, 0],
            "closureMismatchPixels": 0,
            "gif": {
                "file": repo_path(STATUS_GIF_PATH),
                "sha256": sha256_bytes(status_gif),
                "size": list(GIF_SIZE),
                "frameCount": 4,
            },
        },
        "interactionPreview": {
            "semanticAction": "inspect-front",
            "visualPoseAuthority": "interact-front",
            "actorId": INTERACTION_ACTOR_ID,
            "actorAuthority": {
                "file": repo_path(ACTION_MANIFEST_PATH),
                "sha256": sha256_file(ACTION_MANIFEST_PATH),
                "pendingCommercialReview": True,
            },
            "spatialAuthority": {
                "file": repo_path(SPATIAL_MANIFEST_PATH),
                "sha256": sha256_file(SPATIAL_MANIFEST_PATH),
            },
            "heldProp": {
                "id": HELD_PROP_ID,
                "manifest": repo_path(HELD_MANIFEST_PATH),
                "manifestSha256": sha256_file(HELD_MANIFEST_PATH),
                "runtimeFile": actor_data["tablet"]["runtimeFile"],
                "runtimeSha256": actor_data["tablet"]["runtimeSha256"],
                "actorSocketRule": "midpoint-primary-secondary",
                "attachmentMode": "front-overlay",
                "heldFrames": [2, 3, 4],
            },
            "timeline": interaction_timeline,
            "perCharacterOffsets": False,
            "missingSocketFallback": False,
            "countsTowardRosterValidation": False,
            "countsTowardReservationValidation": False,
            "gif": {
                "file": repo_path(INTERACTION_GIF_PATH),
                "sha256": sha256_bytes(interaction_gif),
                "size": list(INTERACTION_GIF_SIZE),
                "frameCount": len(interaction_timeline),
            },
        },
        "instancePreview": {
            "familyInstanceCount": 2,
            "instanceIds": list(INSTANCE_IDS),
            "sharedFamilyPixels": True,
            "capacityTargetPerInstance": 1,
            "independentReservationTargets": True,
            "reservationProductionBuilt": False,
            "reservationSlotContribution": 0,
            "plannedReservationSlotContributionAfterF8": 2,
            "facilityV1ReadySlotsBeforeServer": 15,
            "facilityV1ReadySlotsAfterServerF8Target": 17,
        },
        "gates": {
            "F0": passed(
                repo_path(AUDIT_PATH),
                repo_path(REVIEW_PATHS[0]),
            ),
            "F1": passed(
                repo_path(REVIEW_PATHS[3]),
                repo_path(REVIEW_PATHS[4]),
            ),
            "F2": passed(
                repo_path(REVIEW_PATHS[0]),
                repo_path(REVIEW_PATHS[1]),
            ),
            "F3": passed(
                repo_path(REVIEW_PATHS[2]),
                repo_path(REVIEW_PATHS[5]),
                repo_path(REVIEW_PATHS[6]),
                repo_path(REVIEW_PATHS[7]),
                repo_path(STATUS_GIF_PATH),
                repo_path(INTERACTION_GIF_PATH),
            ),
            "F4": blocked("Production part authority waits for visual approval."),
            "F5": blocked("Production sockets and routes are not built."),
            "F6": blocked("Two-instance reservation simulation is not built."),
            "F7": blocked("The 108/216-case isolated lab is not built."),
            "F8": blocked("F8 waits for completed F4-F7 production evidence."),
            "F9": blocked("Facility v1 has only 15/20 approved slots."),
            "F10": blocked("Active Office promotion is forbidden."),
        },
        "reviewOutputs": [repo_path(path) for path in review_outputs],
        "reviewEvidence": review_evidence,
        "permissions": {
            "ownerReview": False,
            "fullSystemBuild": False,
            "furnitureOnlyRoom": False,
            "otherFacilityFamilies": False,
            "activeOfficePromotion": False,
        },
        "activeOfficeEvidence": [
            {"file": path, "imported": False}
            for path in ACTIVE_OFFICE_FILES
        ],
        "visualApproval": None,
        "ownerDecision": {
            "decision": "superseded-redesign-requested",
            "decidedOn": "2026-07-30",
            "supersededBy": "office.facility.server-rack.n02",
            "reasons": [
                "Remove the H01 tablet and all held-prop behavior.",
                "Replace 2x1x3 front-only geometry with 2x2x4.",
                "Create a fresh four-orientation cabinet family.",
            ],
        },
    }
    outputs[MANIFEST_PATH] = json_bytes(manifest)
    return outputs


def write_outputs(outputs: dict[Path, bytes]) -> None:
    for path, content in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)


def check_outputs(outputs: dict[Path, bytes]) -> list[str]:
    failures = []
    for path, expected in outputs.items():
        if not path.exists():
            failures.append(f"missing: {repo_path(path)}")
        elif path.read_bytes() != expected:
            failures.append(f"changed: {repo_path(path)}")
    expected_processed = {
        path.resolve()
        for path in outputs
        if OUTPUT_ROOT in path.parents
    }
    if OUTPUT_ROOT.exists():
        actual_processed = {
            path.resolve()
            for path in OUTPUT_ROOT.rglob("*")
            if path.is_file()
        }
        for path in sorted(actual_processed - expected_processed):
            failures.append(f"undeclared: {repo_path(path)}")
    expected_review = {
        path.resolve()
        for path in outputs
        if REVIEW_ROOT in path.parents
    }
    if REVIEW_ROOT.exists():
        actual_review = {
            path.resolve()
            for path in REVIEW_ROOT.rglob("*")
            if path.is_file()
        }
        for path in sorted(actual_review - expected_review):
            failures.append(f"undeclared: {repo_path(path)}")
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
            "Server Rack N01 superseded-evidence rebuild OK: original-master "
            "front, four interior status viewports, N02 redesign decision."
        )
        return 0
    write_outputs(outputs)
    print(
        "Built superseded Server Rack N01 evidence: 2x1x3 front, modular A-D "
        "status loop, tablet demo, and the N02 redesign decision."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
