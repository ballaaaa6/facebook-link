import { useLayoutEffect, type RefObject } from "react";
import { subscribeToOfficeFrame } from "../motion/frameScheduler";
import { placeAgentTooltip, type PlacementRect, type TooltipPreference } from "./tooltipPlacement";

export function useAgentCalloutPlacement({
  calloutRef,
  frameRef,
  agentId,
  preference,
  gap = 10,
}: {
  calloutRef: RefObject<HTMLElement | null>;
  frameRef: RefObject<HTMLDivElement | null>;
  agentId: string;
  preference: TooltipPreference;
  gap?: number;
}) {
  useLayoutEffect(() => {
    const callout = calloutRef.current;
    const frame = frameRef.current;
    if (!callout || !frame) return;

    const update = () => {
      const anchor = frame.querySelector<HTMLElement>(`[data-agent-anchor="${agentId}"]`);
      const actor = frame.querySelector<HTMLElement>(`[data-agent-id="${agentId}"]`);
      if (!anchor || !actor) {
        callout.style.visibility = "hidden";
        return;
      }

      const frameRect = frame.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();
      const bounds = {
        left: Math.max(0, frameRect.left),
        right: Math.min(window.innerWidth, frameRect.right),
        top: Math.max(0, frameRect.top),
        bottom: Math.min(window.innerHeight, frameRect.bottom),
        width: Math.min(window.innerWidth, frameRect.right) - Math.max(0, frameRect.left),
        height: Math.min(window.innerHeight, frameRect.bottom) - Math.max(0, frameRect.top),
      };
      const outside = anchorRect.right < bounds.left
        || anchorRect.left > bounds.right
        || anchorRect.bottom < bounds.top
        || anchorRect.top > bounds.bottom;
      if (outside || bounds.width <= 0 || bounds.height <= 0) {
        callout.style.visibility = "hidden";
        return;
      }

      const calloutRect = callout.getBoundingClientRect();
      const obstacles = [...frame.querySelectorAll<HTMLElement>("[data-agent-id]")]
        .filter((element) => element !== actor)
        .map((element) => element.getBoundingClientRect() as PlacementRect);
      const placement = placeAgentTooltip({
        anchor: anchorRect as PlacementRect,
        tooltip: { width: calloutRect.width, height: calloutRect.height },
        bounds,
        obstacles,
        preference,
        gap,
      });
      callout.style.left = `${placement.left}px`;
      callout.style.top = `${placement.top}px`;
      callout.style.setProperty("--callout-arrow-top", `${placement.arrowTop}px`);
      callout.dataset.side = placement.side;
      callout.style.visibility = "visible";
    };

    update();
    return subscribeToOfficeFrame(update);
  }, [agentId, calloutRef, frameRef, gap, preference]);
}
