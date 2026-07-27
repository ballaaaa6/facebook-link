from __future__ import annotations

import io
import math
import re
from collections import defaultdict
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

from office_geometry_audit_inventory import ROOT


CELL_WIDTH = 320
CELL_HEIGHT = 240
COLUMNS = 4
COLORS = {
    "reuse": "#2f855a",
    "metadata-fix": "#2b6cb0",
    "derive-composite": "#8b5a2b",
    "regenerate": "#c53030",
    "blocked-by-orientation": "#805ad5",
    "blocked-by-license": "#718096",
}


def safe_name(value: str) -> str:
    return re.sub(r"[^a-z0-9-]+", "-", value.lower()).strip("-")


def checkerboard(width: int, height: int) -> Image.Image:
    image = Image.new("RGBA", (width, height), "#f7fafc")
    draw = ImageDraw.Draw(image)
    size = 16
    for y in range(0, height, size):
        for x in range(0, width, size):
            if (x // size + y // size) % 2:
                draw.rectangle((x, y, x + size - 1, y + size - 1), fill="#e2e8f0")
    return image


def asset_preview(record: dict[str, Any], width: int, height: int) -> Image.Image:
    canvas = checkerboard(width, height)
    source_path = record.get("sourceFile")
    if not source_path or not (ROOT / source_path).exists():
        draw = ImageDraw.Draw(canvas)
        draw.line((16, 16, width - 16, height - 16), fill="#c53030", width=5)
        draw.line((width - 16, 16, 16, height - 16), fill="#c53030", width=5)
        return canvas
    with Image.open(ROOT / source_path) as source:
        image = source.convert("RGBA")
        if record["catalog"] == "character":
            evidence = record.get("imageEvidence") or {}
            image = image.crop((0, 0, evidence.get("width", 96), evidence.get("height", 104)))
        image.thumbnail((width - 12, height - 12), Image.Resampling.NEAREST)
        x = (width - image.width) // 2
        y = (height - image.height) // 2
        canvas.alpha_composite(image, (x, y))
    return canvas


def render_sheet(records: list[dict[str, Any]], title: str) -> bytes:
    rows = math.ceil(len(records) / COLUMNS)
    image = Image.new("RGB", (CELL_WIDTH * COLUMNS, 48 + CELL_HEIGHT * rows), "#1a202c")
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    draw.text((16, 16), title, fill="white", font=font)
    for index, record in enumerate(records):
        column = index % COLUMNS
        row = index // COLUMNS
        x = column * CELL_WIDTH
        y = 48 + row * CELL_HEIGHT
        disposition = record["review"]["disposition"]
        draw.rectangle((x + 4, y + 4, x + CELL_WIDTH - 5, y + CELL_HEIGHT - 5), fill="#edf2f7", outline=COLORS[disposition], width=5)
        preview = asset_preview(record, CELL_WIDTH - 20, 166).convert("RGB")
        image.paste(preview, (x + 10, y + 10))
        label = record["assetId"]
        if len(label) > 42:
            label = label[:39] + "..."
        draw.text((x + 12, y + 182), label, fill="#1a202c", font=font)
        draw.text((x + 12, y + 198), disposition, fill=COLORS[disposition], font=font)
        geometry = record.get("currentGeometry", {})
        footprint = geometry.get("footprint")
        footprint_text = "footprint: -" if not footprint else f"footprint: {footprint.get('width')} x {footprint.get('depth')}"
        draw.text((x + 12, y + 214), footprint_text, fill="#4a5568", font=font)
    payload = io.BytesIO()
    image.save(payload, format="PNG", optimize=False)
    return payload.getvalue()


def build_contact_sheets(records: list[dict[str, Any]]) -> dict[str, bytes]:
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    runtime = []
    characters = []
    for record in records:
        if record["catalog"] == "library":
            groups[f"library-{record['sourceSheet']}"] .append(record)
        elif record["catalog"] == "runtime":
            runtime.append(record)
        elif record["catalog"] == "character":
            characters.append(record)
    for offset in range(0, len(runtime), 16):
        groups[f"runtime-page-{offset // 16 + 1:02d}"] = runtime[offset:offset + 16]
    for offset in range(0, len(characters), 16):
        groups[f"characters-page-{offset // 16 + 1:02d}"] = characters[offset:offset + 16]
    return {
        f"{safe_name(key)}.png": render_sheet(items, key)
        for key, items in sorted(groups.items())
    }
