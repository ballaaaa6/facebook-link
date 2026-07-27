"""Build the reviewed Office derive/composite waves without repainting pixels."""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageDraw

from office_derived_asset_recipes import (
    SUPPORT_SLOT_COUNTS,
    foreground_regions,
    seat_slots,
)


ROOT = Path(__file__).resolve().parents[1]
AUDIT_PATH = ROOT / "assets/game/manifests/office-asset-geometry-audit.json"
MANIFEST_PATH = ROOT / "assets/game/manifests/office-derived-assets-v1.json"
OUTPUT_ROOT = ROOT / "assets/game/processed/office-derived-v1"
EXPECTED_WAVES = {"step-13": 24, "step-14": 40, "step-15": 6, "step-16": 7}


def project_path(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def png_bytes(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, "PNG", optimize=False, compress_level=9)
    return buffer.getvalue()


def alpha_pixels(image: Image.Image) -> int:
    return sum(1 for value in image.getchannel("A").getdata() if value > 0)


def alpha_components(image: Image.Image) -> list[tuple[int, tuple[int, int, int, int]]]:
    alpha = image.getchannel("A")
    pixels = alpha.load()
    width, height = image.size
    seen: set[tuple[int, int]] = set()
    components: list[tuple[int, tuple[int, int, int, int]]] = []
    for y in range(height):
        for x in range(width):
            if pixels[x, y] == 0 or (x, y) in seen:
                continue
            stack = [(x, y)]
            seen.add((x, y))
            count = 0
            left = right = x
            top = bottom = y
            while stack:
                px, py = stack.pop()
                count += 1
                left, right = min(left, px), max(right, px)
                top, bottom = min(top, py), max(bottom, py)
                for neighbor in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                    nx, ny = neighbor
                    if 0 <= nx < width and 0 <= ny < height and pixels[nx, ny] > 0 and neighbor not in seen:
                        seen.add(neighbor)
                        stack.append(neighbor)
            components.append((count, (left, top, right + 1, bottom + 1)))
    return sorted(components, reverse=True)


def cleanup_image(source: Image.Image) -> tuple[Image.Image, tuple[int, int, int, int] | None, str]:
    components = alpha_components(source)
    if len(components) <= 1:
        return source.copy(), None, "verified-noop-cleanup"
    keep_box = components[0][1]
    mask = Image.new("L", source.size, 0)
    ImageDraw.Draw(mask).rectangle((keep_box[0], keep_box[1], keep_box[2] - 1, keep_box[3] - 1), fill=255)
    output = Image.new("RGBA", source.size, (0, 0, 0, 0))
    output.paste(source, (0, 0), ImageChops.multiply(source.getchannel("A"), mask))
    return output, keep_box, "clean-largest-component-bounds"


def foreground_image(source: Image.Image, regions: list[tuple[float, float, float, float]]) -> Image.Image | None:
    if not regions:
        return None
    mask = Image.new("L", source.size, 0)
    draw = ImageDraw.Draw(mask)
    for left, top, right, bottom in regions:
        draw.rectangle(
            (
                round(left * source.width),
                round(top * source.height),
                min(source.width - 1, round(right * source.width)),
                min(source.height - 1, round(bottom * source.height)),
            ),
            fill=255,
        )
    output = Image.new("RGBA", source.size, (0, 0, 0, 0))
    output.paste(source, (0, 0), ImageChops.multiply(source.getchannel("A"), mask))
    return output


def wave_for(record: dict[str, Any], is_composite: bool) -> str:
    if is_composite:
        return "step-15" if record["catalog"] == "library" else "step-16"
    return "step-14" if record["review"]["proposedAssetType"] == "animated-shell" else "step-13"


def geometry_for(record: dict[str, Any], foreground: bool) -> dict[str, Any]:
    current = record["currentGeometry"]
    asset_type = record["review"]["proposedAssetType"]
    plane = record["review"]["proposedPlacementPlane"]
    scale = current["physicalScale"]
    footprint_source = current.get("footprint")
    footprint = None if footprint_source is None else {**footprint_source, "unit": "tile"}
    floor_geometry = footprint is not None
    width = float(footprint_source["width"]) if footprint_source else float(scale["width"])
    depth = float(footprint_source["depth"]) if footprint_source else 0.0
    base_pivot = {"x": width / 2, "y": depth if floor_geometry else 0, "unit": "tile"}
    support = None
    attachments: list[dict[str, Any]] = []
    if asset_type == "surface-furniture":
        support = {
            "id": f"{record['assetId']}-surface",
            "width": width,
            "depth": depth,
            "height": float(scale["height"]),
            "unit": "tile",
        }
        count = SUPPORT_SLOT_COUNTS.get(record["assetId"], 1)
        for index in range(count):
            attachments.append({
                "id": f"surface-{index + 1}",
                "surfaceId": support["id"],
                "x": width * (index + 1) / (count + 1),
                "y": min(depth * 0.5, max(0.0, depth - 0.01)),
                "unit": "tile",
            })
    seats = [
        {"id": slot_id, "x": x, "y": y, "unit": "tile", "facing": facing}
        for slot_id, x, y, facing in seat_slots(record["assetId"])
    ]
    orientation = record.get("orientation")
    if orientation not in {"none", "front", "back", "left", "right"}:
        orientation = "front"
    return {
        "schemaVersion": 3,
        "id": f"derived.v1.{record['assetId']}",
        "assetType": asset_type,
        "placementPlane": plane,
        "physicalScale": {**scale, "unit": "tile"},
        "footprint": footprint,
        "supportPlane": support,
        "basePivot": base_pivot,
        "sortPivot": base_pivot if floor_geometry else None,
        "renderBounds": {
            "width": record["imageEvidence"]["width"],
            "height": record["imageEvidence"]["height"],
            "unit": "authoring-pixel",
        },
        "renderOffset": {"x": 0, "y": 0, "unit": "authoring-pixel"},
        "verticalExtension": {
            "aboveBase": float(scale["height"]),
            "belowBase": 0,
            "unit": "tile",
        },
        "occlusionParts": ([{
            "id": "foreground",
            "role": "foreground",
            "assetId": f"derived.v1.{record['assetId']}.foreground",
        }] if foreground else []),
        "attachmentSlots": attachments,
        "seatSlots": seats,
        "orientation": orientation,
    }


def output_record(role: str, path: Path, image: Image.Image, writes: dict[Path, bytes]) -> dict[str, Any]:
    data = png_bytes(image)
    writes[path] = data
    return {
        "role": role,
        "file": project_path(path),
        "sha256": sha256_bytes(data),
        "width": image.width,
        "height": image.height,
        "alphaPixels": alpha_pixels(image),
    }


def build_record(record: dict[str, Any], writes: dict[Path, bytes]) -> tuple[dict[str, Any], Image.Image, Image.Image, Image.Image]:
    source_path = ROOT / record["sourceFile"]
    source = Image.open(source_path).convert("RGBA")
    evidence_hash = record["imageEvidence"]["fileSha256"]
    actual_hash = sha256_file(source_path)
    if actual_hash != evidence_hash:
        raise ValueError(f"{record['recordId']}: source hash drifted from the reviewed audit")
    is_composite = record["review"]["reason"].startswith("Reuse the accepted pixels")
    wave = wave_for(record, is_composite)
    folder = OUTPUT_ROOT / wave / record["sourceSheet"]
    outputs: list[dict[str, Any]] = []
    regions: list[tuple[float, float, float, float]] = []
    keep_box = None
    if is_composite:
        derived = source.copy()
        regions = foreground_regions(record["assetId"])
        foreground = foreground_image(source, regions)
        outputs.append(output_record("base", folder / f"{record['assetId']}.base.png", derived, writes))
        if foreground is not None:
            outputs.append(output_record("foreground", folder / f"{record['assetId']}.foreground.png", foreground, writes))
        operation = "semantic-structural-composite" if record["review"]["proposedAssetType"] == "structural-opening" else "foreground-overlay-composite"
        preview = foreground if foreground is not None else derived
        geometry = geometry_for(record, foreground is not None)
    else:
        derived, keep_box, operation = cleanup_image(source)
        outputs.append(output_record("clean", folder / f"{record['assetId']}.clean.png", derived, writes))
        preview = derived
        geometry = None
    source_alpha = alpha_pixels(source)
    retained = alpha_pixels(derived)
    difference = ImageChops.difference(source, derived)
    return ({
        "recordId": record["recordId"],
        "assetId": record["assetId"],
        "wave": wave,
        "operation": operation,
        "status": "accepted-staging",
        "source": {
            "file": record["sourceFile"],
            "sha256": actual_hash,
            "width": source.width,
            "height": source.height,
            "alphaPixels": source_alpha,
            "licenseState": str(record.get("licenseState") or "project-controlled"),
        },
        "recipe": {
            "keepBox": list(keep_box) if keep_box else None,
            "foregroundRegions": [list(region) for region in regions],
        },
        "metrics": {
            "retainedAlphaPixels": retained,
            "removedAlphaPixels": source_alpha - retained,
        },
        "outputs": outputs,
        "geometry": geometry,
    }, source, preview, difference)


def checker(size: tuple[int, int]) -> Image.Image:
    image = Image.new("RGBA", size, (34, 41, 53, 255))
    draw = ImageDraw.Draw(image)
    block = 10
    for y in range(0, size[1], block):
        for x in range(0, size[0], block):
            if (x // block + y // block) % 2 == 0:
                draw.rectangle((x, y, x + block - 1, y + block - 1), fill=(49, 58, 73, 255))
    return image


def thumbnail(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    scale = min(size[0] / image.width, size[1] / image.height, 1.0)
    resized = image.resize((max(1, round(image.width * scale)), max(1, round(image.height * scale))), Image.Resampling.NEAREST)
    canvas = checker(size)
    canvas.alpha_composite(resized, ((size[0] - resized.width) // 2, (size[1] - resized.height) // 2))
    return canvas


def contact_sheet(wave: str, cases: list[tuple[dict[str, Any], Image.Image, Image.Image, Image.Image]]) -> Image.Image:
    columns = 4
    card_width, card_height = 330, 220
    rows = math.ceil(len(cases) / columns)
    board = Image.new("RGBA", (columns * card_width, 34 + rows * card_height), (24, 30, 40, 255))
    draw = ImageDraw.Draw(board)
    draw.text((10, 10), f"Office derived assets v1 — {wave} — {len(cases)} records", fill=(236, 241, 248, 255))
    for index, (record, source, derived, difference) in enumerate(cases):
        column, row = index % columns, index // columns
        x, y = column * card_width, 34 + row * card_height
        draw.rectangle((x + 3, y + 3, x + card_width - 4, y + card_height - 4), outline=(83, 101, 126, 255), width=2)
        draw.text((x + 10, y + 10), record["assetId"][:43], fill=(236, 241, 248, 255))
        draw.text((x + 10, y + 27), record["operation"], fill=(126, 205, 217, 255))
        for offset, label, image in ((8, "source", source), (114, "derived", derived), (220, "diff", difference)):
            draw.text((x + offset, y + 48), label, fill=(180, 191, 207, 255))
            board.alpha_composite(thumbnail(image, (98, 138)), (x + offset, y + 66))
    return board


def build() -> tuple[dict[str, Any], dict[Path, bytes]]:
    audit = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))
    records = [record for record in audit["records"] if record["review"]["disposition"] == "derive-composite"]
    if len(records) != 77:
        raise ValueError(f"expected 77 derive-composite records, found {len(records)}")
    writes: dict[Path, bytes] = {}
    generated: list[dict[str, Any]] = []
    cases: dict[str, list[tuple[dict[str, Any], Image.Image, Image.Image, Image.Image]]] = {wave: [] for wave in EXPECTED_WAVES}
    for source_record in records:
        record, source, preview, difference = build_record(source_record, writes)
        generated.append(record)
        cases[record["wave"]].append((record, source, preview, difference))
    generated.sort(key=lambda record: (record["wave"], record["recordId"]))
    by_wave = {wave: sum(1 for record in generated if record["wave"] == wave) for wave in EXPECTED_WAVES}
    if by_wave != EXPECTED_WAVES:
        raise ValueError(f"unexpected wave coverage: {by_wave}")
    qa: dict[str, str] = {}
    for wave, wave_cases in cases.items():
        path = OUTPUT_ROOT / "qa" / f"{wave}-before-derived-diff.png"
        writes[path] = png_bytes(contact_sheet(wave, wave_cases))
        qa[wave] = project_path(path)
    manifest = {
        "version": 1,
        "geometrySchemaVersion": 3,
        "status": "accepted-staging",
        "activeOfficePromotion": False,
        "auditSource": project_path(AUDIT_PATH),
        "sourcePolicy": "Original reviewed pixels are immutable; cleanup keeps a reviewed component envelope and composites reuse exact source pixels as staging layers.",
        "counts": {
            "total": len(generated),
            "byWave": by_wave,
            "cleanup": sum(1 for record in generated if not record["operation"].endswith("composite")),
            "composites": sum(1 for record in generated if record["operation"].endswith("composite")),
            "verifiedNoopCleanup": sum(1 for record in generated if record["operation"] == "verified-noop-cleanup"),
        },
        "records": generated,
        "qa": qa,
    }
    writes[MANIFEST_PATH] = (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    return manifest, writes


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="fail when committed outputs differ from deterministic recipes")
    args = parser.parse_args()
    manifest, writes = build()
    failures: list[str] = []
    if args.check:
        for path, expected in writes.items():
            if not path.exists():
                failures.append(f"missing {project_path(path)}")
            elif path.read_bytes() != expected:
                failures.append(f"stale {project_path(path)}")
        if failures:
            raise SystemExit("Office derived assets check failed:\n- " + "\n- ".join(failures))
        print(f"Office derived assets OK: {manifest['counts']['total']} records across four waves.")
        return
    for path, data in writes.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    print(f"Built {manifest['counts']['total']} Office derived records: {manifest['counts']['byWave']}")


if __name__ == "__main__":
    main()
