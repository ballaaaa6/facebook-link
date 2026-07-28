from __future__ import annotations

import json
from collections import Counter, defaultdict
from typing import Any


DISPOSITIONS = {
    "reuse",
    "metadata-fix",
    "derive-composite",
    "regenerate",
    "blocked-by-orientation",
    "blocked-by-license",
}
ASSET_TYPES = {
    "floor-decal",
    "upright-floor-object",
    "surface-furniture",
    "seat",
    "wall-mounted",
    "structural-opening",
    "animated-shell",
    "character",
}
PLACEMENT_PLANES = {"floor", "wall", "ceiling", "furniture-surface"}


def pixel_cleanup_overrides(review: dict[str, Any]) -> list[dict[str, Any]]:
    overrides = []
    for group in review.get("pixelCleanupOverrides", []):
        for record_id in group.get("recordIds", []):
            overrides.append({
                "recordId": record_id,
                "disposition": group.get("disposition"),
                "visualFinding": group.get("visualFinding"),
                "reason": group.get("reason"),
            })
    return overrides


def validate_review(inventory: list[dict[str, Any]], review: dict[str, Any]) -> list[str]:
    failures = []
    inventory_ids = {record["recordId"] for record in inventory}
    reviews = review.get("records", [])
    review_ids = [record.get("recordId") for record in reviews]
    if len(review_ids) != len(set(review_ids)):
        failures.append("Review manifest contains duplicate record IDs")
    missing = sorted(inventory_ids - set(review_ids))
    extra = sorted(set(review_ids) - inventory_ids)
    if missing:
        failures.append(f"Review manifest is missing {len(missing)} records: {', '.join(missing[:5])}")
    if extra:
        failures.append(f"Review manifest has {len(extra)} unknown records: {', '.join(extra[:5])}")
    overrides = pixel_cleanup_overrides(review)
    override_ids = [record.get("recordId") for record in overrides]
    if len(override_ids) != len(set(override_ids)):
        failures.append("Review manifest contains duplicate pixel-cleanup override IDs")
    unknown_overrides = sorted(set(override_ids) - inventory_ids)
    if unknown_overrides:
        failures.append(
            "Review manifest has unknown pixel-cleanup overrides: "
            f"{', '.join(unknown_overrides[:5])}"
        )
    for override in overrides:
        prefix = override.get("recordId", "unknown")
        if override.get("disposition") != "derive-composite":
            failures.append(f"{prefix}: pixel cleanup must use derive-composite")
        for field in ["visualFinding", "reason"]:
            if not isinstance(override.get(field), str) or not override[field].strip():
                failures.append(f"{prefix}: override {field} must be a non-empty string")
    for record in reviews:
        prefix = record.get("recordId", "unknown")
        if record.get("reviewStatus") != "reviewed":
            failures.append(f"{prefix}: reviewStatus must equal reviewed")
        if record.get("disposition") not in DISPOSITIONS:
            failures.append(f"{prefix}: invalid disposition")
        if record.get("proposedAssetType") not in ASSET_TYPES:
            failures.append(f"{prefix}: invalid proposedAssetType")
        if record.get("proposedPlacementPlane") not in PLACEMENT_PLANES:
            failures.append(f"{prefix}: invalid proposedPlacementPlane")
        for field in ["reason", "visualFinding", "reviewer", "evidenceMethod"]:
            if not isinstance(record.get(field), str) or not record[field].strip():
                failures.append(f"{prefix}: {field} must be a non-empty string")
        if record.get("confidence") not in {"high", "medium", "low"}:
            failures.append(f"{prefix}: confidence must be high, medium, or low")
    return failures


def effective_reviews(review: dict[str, Any]) -> dict[str, dict[str, Any]]:
    reviews = {record["recordId"]: dict(record) for record in review["records"]}
    for override in pixel_cleanup_overrides(review):
        reviews[override["recordId"]].update({
            "disposition": override["disposition"],
            "visualFinding": override["visualFinding"],
            "reason": override["reason"],
        })
    return reviews


def build_audit(
    inventory: list[dict[str, Any]],
    review: dict[str, Any],
    contact_sheet_paths: list[str],
) -> dict[str, Any]:
    failures = validate_review(inventory, review)
    if failures:
        raise ValueError("\n".join(failures))
    reviews = effective_reviews(review)
    records = []
    for item in inventory:
        record = dict(item)
        record["review"] = reviews[item["recordId"]]
        records.append(record)
    source_counts = Counter(record["catalog"] for record in records)
    disposition_counts = Counter(record["review"]["disposition"] for record in records)
    type_counts = Counter(record["review"]["proposedAssetType"] for record in records)
    missing_layer = sum("missing-layer" in record["metadataFindings"] for record in records)
    missing_images = sum(record["sourceFile"] is not None and not (record["imageEvidence"] or {}).get("exists") for record in records)
    return {
        "version": 1,
        "geometrySchemaVersion": 3,
        "status": "reviewed",
        "inputs": {
            "reviewVersion": review["version"],
            "reviewedOn": review["reviewedOn"],
            "inventorySources": [
                "assets/game/manifests/office-library-sheets.json",
                "assets/game/manifests/office-assets.json",
                "assets/game/manifests/office-planned-assets.json",
                "assets/game/characters/registry.json",
                "apps/web/src/features/office/components/officeAssetRegistry.ts",
            ],
        },
        "summary": {
            "totalRecords": len(records),
            "distinctAssetKeys": len({record["assetKey"] for record in records}),
            "sourceCounts": dict(sorted(source_counts.items())),
            "dispositionCounts": dict(sorted(disposition_counts.items())),
            "assetTypeCounts": dict(sorted(type_counts.items())),
            "missingLayerRecords": missing_layer,
            "missingImageFiles": missing_images,
            "unreviewedRecords": 0,
        },
        "contactSheets": contact_sheet_paths,
        "records": records,
    }


def escape(value: Any) -> str:
    return str(value).replace("|", "\\|").replace("\n", " ")


def audit_markdown(audit: dict[str, Any]) -> str:
    summary = audit["summary"]
    lines = [
        "# Office Asset Geometry Audit",
        "",
        "Status: Frozen 2026-07-27 inventory; workstation conclusions superseded",
        "",
        "This report is generated from the Office manifests, actual image files,",
        "and `assets/game/manifests/office-asset-geometry-review.json`. Do not edit",
        "this file directly; update the reviewed input and regenerate both outputs.",
        "Its workstation dispositions and `5 x 4` conclusions are historical and",
        "must not override `docs/art/OFFICE_COORDINATE_SYSTEM.md`.",
        "",
        "## Coverage",
        "",
        f"- Total inventory records: {summary['totalRecords']}",
        f"- Distinct asset keys: {summary['distinctAssetKeys']}",
        f"- Missing layer declarations: {summary['missingLayerRecords']}",
        f"- Missing referenced image files: {summary['missingImageFiles']}",
        f"- Unreviewed records: {summary['unreviewedRecords']}",
        "",
        "### Records by source",
        "",
        "| Source | Records |",
        "| --- | ---: |",
    ]
    for key, count in summary["sourceCounts"].items():
        lines.append(f"| `{key}` | {count} |")
    lines.extend(["", "### Dispositions", "", "| Disposition | Records |", "| --- | ---: |"])
    for key, count in summary["dispositionCounts"].items():
        lines.append(f"| `{key}` | {count} |")
    lines.extend([
        "",
        "## Review conclusions",
        "",
        "- Existing pixels are retained whenever their visible geometry supports the",
        "  intended plane, base, and orientation.",
        "- The 2026-07-27 workstation dispositions are frozen history. Their former",
        "  `5 x 4` target is rejected and superseded by the owner-approved R05-r02",
        "  `3 x 2` workstation authority.",
        "- Surface furniture with usable pixels is assigned `derive-composite` when",
        "  support, underframe, or foreground parts can be separated deterministically.",
        "- Contact-sheet pixel cleanup is recorded as a reviewed override when an",
        "  intended sprite is usable but its processed crop contains detached pixels",
        "  from an adjacent source-sheet cell.",
        "- The env-12 and env-13 side sheets are blocked because the side silhouettes",
        "  do not form faithful turnarounds of their front families.",
        "- Character pixels remain prototype-only and blocked independently by",
        "  `pending-commercial-review`; detailed pose-anchor calibration is deferred",
        "  until accepted furniture exists.",
        "",
        "## Contact sheets",
        "",
    ])
    for path in audit["contactSheets"]:
        lines.append(f"- `{path}`")
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for record in audit["records"]:
        grouped[record["catalog"]].append(record)
    for catalog, records in sorted(grouped.items()):
        lines.extend([
            "",
            f"## {catalog.title()} records",
            "",
            "| Record | Type | Plane | Disposition | Visual finding | Reason |",
            "| --- | --- | --- | --- | --- | --- |",
        ])
        for record in records:
            review = record["review"]
            lines.append(
                f"| `{escape(record['recordId'])}` | `{review['proposedAssetType']}` | "
                f"`{review['proposedPlacementPlane']}` | `{review['disposition']}` | "
                f"{escape(review['visualFinding'])} | {escape(review['reason'])} |"
            )
    lines.extend(["", "## Regeneration authorization", "", "This audit does not authorize production generation. The accepted Camera/Scale", "Bible remains the final Step 4 gate before any replacement image is created.", ""])
    return "\n".join(lines)


def json_text(payload: dict[str, Any]) -> str:
    return json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=False) + "\n"
