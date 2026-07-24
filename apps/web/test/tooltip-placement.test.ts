import assert from "node:assert/strict";
import test from "node:test";
import {
  placeAgentTooltip,
  type PlacementRect,
} from "../src/features/office/components/tooltipPlacement.ts";

function rect(left: number, top: number, width: number, height: number): PlacementRect {
  return {
    left,
    right: left + width,
    top,
    bottom: top + height,
    width,
    height,
  };
}

const bounds = rect(100, 100, 800, 500);
const tooltip = { width: 190, height: 110 };

test("auto placement flips left before crossing the right edge", () => {
  const placement = placeAgentTooltip({
    anchor: rect(820, 250, 60, 80),
    tooltip,
    bounds,
  });
  assert.equal(placement.side, "left");
  assert.ok(placement.left >= bounds.left);
  assert.ok(placement.left + tooltip.width <= bounds.right);
});

test("a valid author preference overrides automatic side scoring", () => {
  const placement = placeAgentTooltip({
    anchor: rect(450, 250, 60, 80),
    tooltip,
    bounds,
    obstacles: [rect(520, 220, 100, 150)],
    preference: "right",
  });
  assert.equal(placement.side, "right");
});

test("an author preference still flips when it would leave the frame", () => {
  const placement = placeAgentTooltip({
    anchor: rect(820, 250, 60, 80),
    tooltip,
    bounds,
    preference: "right",
  });
  assert.equal(placement.side, "left");
});

test("auto placement chooses the side with less actor overlap", () => {
  const placement = placeAgentTooltip({
    anchor: rect(450, 250, 60, 80),
    tooltip,
    bounds,
    obstacles: [rect(520, 220, 150, 150)],
  });
  assert.equal(placement.side, "left");
});

test("vertical placement and arrow stay inside the visible frame", () => {
  const placement = placeAgentTooltip({
    anchor: rect(450, 102, 60, 60),
    tooltip,
    bounds,
  });
  assert.ok(placement.top >= bounds.top + 8);
  assert.ok(placement.top + tooltip.height <= bounds.bottom - 8);
  assert.ok(placement.arrowTop >= 12);
  assert.ok(placement.arrowTop <= tooltip.height - 12);
});

test("obstacle avoidance does not detach the tooltip from its actor", () => {
  const anchor = rect(450, 250, 60, 80);
  const placement = placeAgentTooltip({
    anchor,
    tooltip,
    bounds,
    obstacles: [
      rect(250, 200, 180, 180),
      rect(520, 200, 180, 180),
      rect(250, 390, 450, 100),
    ],
  });
  const verticalGap = Math.max(
    0,
    placement.top - anchor.bottom,
    anchor.top - (placement.top + tooltip.height),
  );
  assert.ok(verticalGap <= 10);
});
