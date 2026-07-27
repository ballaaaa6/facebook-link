from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MANIFESTS = ROOT / "assets" / "game" / "manifests"
LIBRARY_PATH = MANIFESTS / "office-library-sheets.json"
RUNTIME_PATH = MANIFESTS / "office-assets.json"
PLANNED_PATH = MANIFESTS / "office-planned-assets.json"
CHARACTER_PATH = ROOT / "assets" / "game" / "characters"
CHARACTER_REGISTRY_PATH = CHARACTER_PATH / "registry.json"
REGISTRY_SOURCE_PATH = ROOT / "apps" / "web" / "src" / "features" / "office" / "components" / "officeAssetRegistry.ts"


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def project_path(path: Path) -> str:
    return path.resolve().relative_to(ROOT).as_posix()


def image_evidence(path_text: str | None, crop: tuple[int, int, int, int] | None = None) -> dict[str, Any] | None:
    if not path_text:
        return None
    path = ROOT / path_text
    if not path.exists():
        return {"exists": False, "path": path_text}
    payload = path.read_bytes()
    with Image.open(path) as source:
        image = source.convert("RGBA")
        if crop:
            image = image.crop(crop)
        alpha = image.getchannel("A")
        bounds = alpha.getbbox()
        visible = sum(1 for value in alpha.getdata() if value > 0)
        total = max(1, image.width * image.height)
        return {
            "exists": True,
            "path": path_text,
            "fileSha256": hashlib.sha256(payload).hexdigest(),
            "width": image.width,
            "height": image.height,
            "alphaBounds": list(bounds) if bounds else None,
            "alphaCoverage": round(visible / total, 6),
        }


def orientation(asset: dict[str, Any]) -> str:
    orientations = asset.get("requiredOrientations", [])
    if len(orientations) == 1:
        value = orientations[0]
        return {"side-left": "left", "side-right": "right"}.get(value, value)
    return "none"


def geometry_snapshot(asset: dict[str, Any]) -> dict[str, Any]:
    fields = [
        "physicalScale",
        "renderBox",
        "footprint",
        "supports",
        "anchor",
        "layer",
        "slotSet",
        "requiredOrientations",
        "animation",
    ]
    return {field: asset[field] for field in fields if field in asset}


def geometry_findings(asset: dict[str, Any]) -> list[str]:
    findings = []
    if "layer" not in asset:
        findings.append("missing-layer")
    if asset.get("supports") == ["wall"] and asset.get("footprint", {}).get("depth") not in (None, 0):
        findings.append("wall-footprint-conflict")
    findings.append("geometry-v3-fields-pending")
    return findings


def library_records() -> list[dict[str, Any]]:
    manifest = load_json(LIBRARY_PATH)
    records = []
    for sheet in manifest["sheets"]:
        for asset in sheet["assets"]:
            family = asset.get("orientationOf") or asset["id"]
            records.append({
                "recordId": f"library:{sheet['id']}:{asset['id']}",
                "catalog": "library",
                "assetId": asset["id"],
                "assetKey": f"office:{family}",
                "family": family,
                "variantOf": asset.get("orientationOf"),
                "orientation": orientation(asset),
                "runtimeState": "library-only",
                "sourceManifest": project_path(LIBRARY_PATH),
                "sourceSheet": sheet["id"],
                "sourceImage": sheet["source"],
                "sourceCell": asset.get("sourceCell"),
                "sourceFile": asset["file"],
                "licenseState": "project-generated",
                "imageEvidence": image_evidence(asset["file"]),
                "currentGeometry": geometry_snapshot(asset),
                "metadataFindings": geometry_findings(asset),
            })
    return records


def parse_runtime_files() -> dict[str, str]:
    source = REGISTRY_SOURCE_PATH.read_text(encoding="utf-8")
    imports: dict[str, str] = {}
    for name, relative in re.findall(r'import\s+(\w+)\s+from\s+"([^"]+assets/[^"]+)";', source):
        imports[name] = project_path((REGISTRY_SOURCE_PATH.parent / relative).resolve())
    body_match = re.search(r"const assetFiles:[^=]+=\s*\{(?P<body>.*?)\n\};", source, re.DOTALL)
    if not body_match:
        raise RuntimeError("Cannot locate active Office assetFiles registry")
    files = {}
    for asset_id, import_name in re.findall(r'"([^"]+)":\s*(\w+)', body_match.group("body")):
        if import_name not in imports:
            raise RuntimeError(f"Missing import for runtime asset {asset_id}: {import_name}")
        files[asset_id] = imports[import_name]
    return files


def runtime_records() -> list[dict[str, Any]]:
    manifest = load_json(RUNTIME_PATH)
    files = parse_runtime_files()
    records = []
    for asset_id, asset in manifest["assets"].items():
        path = files.get(asset_id)
        records.append({
            "recordId": f"runtime:{asset_id}",
            "catalog": "runtime",
            "assetId": asset_id,
            "assetKey": f"office:{asset_id}",
            "family": asset_id,
            "variantOf": None,
            "orientation": "none",
            "runtimeState": "active-runtime",
            "sourceManifest": project_path(RUNTIME_PATH),
            "sourceSheet": "active-office-registry",
            "sourceImage": None,
            "sourceCell": None,
            "sourceFile": path,
            "licenseState": "project-generated",
            "imageEvidence": image_evidence(path),
            "currentGeometry": geometry_snapshot(asset),
            "metadataFindings": geometry_findings(asset),
        })
    return records


def planned_records(library_ids: dict[str, str]) -> list[dict[str, Any]]:
    manifest = load_json(PLANNED_PATH)
    records = []
    for asset_id, asset in manifest["assets"].items():
        linked = library_ids.get(asset_id)
        records.append({
            "recordId": f"planned:{asset_id}",
            "catalog": "planned",
            "assetId": asset_id,
            "assetKey": f"office:{asset_id}",
            "family": asset_id,
            "variantOf": linked,
            "orientation": "none",
            "runtimeState": "planning-only",
            "sourceManifest": project_path(PLANNED_PATH),
            "sourceSheet": "planning-only",
            "sourceImage": None,
            "sourceCell": None,
            "sourceFile": None,
            "licenseState": "project-generated",
            "imageEvidence": None,
            "currentGeometry": geometry_snapshot(asset),
            "metadataFindings": ["planning-entry-linked-to-library" if linked else "no-image-evidence", "geometry-v3-fields-pending"],
        })
    return records


def character_records() -> list[dict[str, Any]]:
    registry = load_json(CHARACTER_REGISTRY_PATH)
    runtime = registry["activeRuntime"]
    records = []
    for directory in sorted(path for path in CHARACTER_PATH.iterdir() if path.is_dir()):
        slug = directory.name
        override = registry.get("characterOverrides", {}).get(slug, {})
        filename = override.get("sheet1x", runtime["sheet1x"])
        frame = override.get("frame", {"width": runtime["frame1x"]["width"], "height": runtime["frame1x"]["height"]})
        path = directory / filename
        crop = (0, 0, frame["width"], frame["height"])
        records.append({
            "recordId": f"character:{slug}",
            "catalog": "character",
            "assetId": slug,
            "assetKey": f"character:{slug}",
            "family": slug,
            "variantOf": None,
            "orientation": "front",
            "runtimeState": "character-library",
            "sourceManifest": project_path(CHARACTER_REGISTRY_PATH),
            "sourceSheet": "character-runtime",
            "sourceImage": None,
            "sourceCell": None,
            "sourceFile": project_path(path),
            "licenseState": registry["licenseStatus"],
            "imageEvidence": image_evidence(project_path(path), crop),
            "currentGeometry": {"frame": frame, "footprint": {"width": 1, "depth": 1}},
            "metadataFindings": ["character-anchor-audit-deferred", "geometry-v3-fields-pending"],
        })
    return records


def collect_inventory() -> list[dict[str, Any]]:
    library = library_records()
    library_ids = {record["assetId"]: record["recordId"] for record in library}
    records = library + runtime_records() + planned_records(library_ids) + character_records()
    records.sort(key=lambda record: record["recordId"])
    return records
