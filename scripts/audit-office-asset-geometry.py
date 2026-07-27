from __future__ import annotations

import argparse
import json
from pathlib import Path

from office_geometry_audit_inventory import ROOT, collect_inventory
from office_geometry_audit_report import (
    audit_markdown,
    build_audit,
    effective_reviews,
    json_text,
    validate_review,
)
from office_geometry_audit_visuals import build_contact_sheets


REVIEW_PATH = ROOT / "assets" / "game" / "manifests" / "office-asset-geometry-review.json"
AUDIT_PATH = ROOT / "assets" / "game" / "manifests" / "office-asset-geometry-audit.json"
REPORT_PATH = ROOT / "docs" / "art" / "OFFICE_ASSET_GEOMETRY_AUDIT.md"
CONTACT_DIR = ROOT / "assets" / "game" / "processed" / "office-geometry-audit-v1" / "contact-sheets"


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def compare(path: Path, expected: bytes, failures: list[str]) -> None:
    if not path.exists():
        failures.append(f"Missing generated file: {path.relative_to(ROOT).as_posix()}")
    elif path.read_bytes() != expected:
        failures.append(f"Stale generated file: {path.relative_to(ROOT).as_posix()}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate or verify the reviewed Office geometry audit")
    parser.add_argument("--check", action="store_true", help="fail when generated outputs are stale")
    args = parser.parse_args()

    if not REVIEW_PATH.exists():
        print(f"Missing reviewed input: {REVIEW_PATH.relative_to(ROOT).as_posix()}")
        return 1
    inventory = collect_inventory()
    review = read_json(REVIEW_PATH)
    failures = validate_review(inventory, review)
    if failures:
        print("\n".join(f"- {failure}" for failure in failures))
        return 1
    reviews = effective_reviews(review)
    reviewed_records = [{**record, "review": reviews[record["recordId"]]} for record in inventory]
    contact_sheets = build_contact_sheets(reviewed_records)
    contact_paths = [
        (CONTACT_DIR / filename).relative_to(ROOT).as_posix()
        for filename in sorted(contact_sheets)
    ]
    audit = build_audit(inventory, review, contact_paths)
    audit_bytes = json_text(audit).encode("utf-8")
    report_bytes = audit_markdown(audit).encode("utf-8")

    if args.check:
        output_failures: list[str] = []
        compare(AUDIT_PATH, audit_bytes, output_failures)
        compare(REPORT_PATH, report_bytes, output_failures)
        for filename, payload in contact_sheets.items():
            compare(CONTACT_DIR / filename, payload, output_failures)
        actual_contacts = {path.name for path in CONTACT_DIR.glob("*.png")} if CONTACT_DIR.exists() else set()
        extra = sorted(actual_contacts - set(contact_sheets))
        if extra:
            output_failures.append(f"Unexpected contact sheets: {', '.join(extra)}")
        if output_failures:
            print("\n".join(f"- {failure}" for failure in output_failures))
            return 1
    else:
        CONTACT_DIR.mkdir(parents=True, exist_ok=True)
        for stale in CONTACT_DIR.glob("*.png"):
            if stale.name not in contact_sheets:
                stale.unlink()
        AUDIT_PATH.write_bytes(audit_bytes)
        REPORT_PATH.write_bytes(report_bytes)
        for filename, payload in contact_sheets.items():
            (CONTACT_DIR / filename).write_bytes(payload)

    summary = audit["summary"]
    print(
        "Office geometry audit OK: "
        f"{summary['totalRecords']} records, "
        f"{summary['distinctAssetKeys']} asset keys, "
        f"{summary['unreviewedRecords']} unreviewed."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
