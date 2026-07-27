"""Reviewed deterministic recipes for Office derive/composite audit records."""

from __future__ import annotations


# These masks reuse source pixels only. Rectangles are normalized to the source
# canvas and intentionally mirror the accepted Facility v1 foreground method.
FOREGROUND_REGIONS: dict[str, list[tuple[float, float, float, float]]] = {
    "bookshelf.low": [(0.00, 0.38, 1.00, 1.00)],
    "counter.coffee": [(0.00, 0.32, 1.00, 1.00)],
    "sofa.sectional": [(0.00, 0.50, 1.00, 1.00), (0.00, 0.00, 0.34, 0.72)],
    "table.cafe.round": [(0.00, 0.40, 1.00, 1.00)],
    "table.coffee": [(0.00, 0.43, 1.00, 1.00)],
    "table.meeting.empty": [(0.00, 0.00, 1.00, 1.00)],
    "sofa.modern.three-seat": [
        (0.00, 0.48, 1.00, 1.00),
        (0.88, 0.18, 1.00, 0.55),
    ],
    "sofa.modern.two-seat": [
        (0.00, 0.48, 1.00, 1.00),
        (0.86, 0.18, 1.00, 0.55),
    ],
    "table.board-game": [(0.00, 0.47, 1.00, 1.00)],
    "table.side": [(0.00, 0.38, 1.00, 1.00)],
    "cabinet.storage.low": [(0.00, 0.30, 1.00, 1.00)],
    "cart.utility": [(0.00, 0.38, 1.00, 1.00)],
}


# Tile-local seat positions are staging calibration anchors, not commercial
# character approval. The neutral actor remains the only acceptance actor.
SEAT_SLOTS: dict[str, list[tuple[str, float, float, str]]] = {
    "sofa.modern.two-seat": [
        ("seat-left", 0.84, 1.08, "front"),
        ("seat-right", 2.04, 1.08, "front"),
    ],
    "sofa.modern.three-seat": [
        ("seat-left", 0.72, 1.08, "front"),
        ("seat-center", 2.00, 1.08, "front"),
        ("seat-right", 3.12, 1.08, "front"),
    ],
    "sofa.sectional": [
        ("seat-left-back", 0.85, 0.90, "front"),
        ("seat-center-back", 2.15, 0.90, "front"),
        ("seat-right-back", 3.45, 0.90, "front"),
        ("seat-left-front", 0.85, 2.05, "right"),
    ],
}


SUPPORT_SLOT_COUNTS: dict[str, int] = {
    "bookshelf.low": 3,
    "counter.coffee": 3,
    "table.cafe.round": 1,
    "table.coffee": 2,
    "table.meeting.empty": 2,
    "table.board-game": 4,
    "table.side": 1,
    "cabinet.storage.low": 2,
    "cart.utility": 2,
}


def foreground_regions(asset_id: str) -> list[tuple[float, float, float, float]]:
    return FOREGROUND_REGIONS.get(asset_id, [])


def seat_slots(asset_id: str) -> list[tuple[str, float, float, str]]:
    return SEAT_SLOTS.get(asset_id, [])
