import { useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { TooltipPreference } from "./tooltipPlacement";
import { useAgentCalloutPlacement } from "./useAgentCalloutPlacement";

export function AgentActivityBadge({
  agentId,
  frameRef,
  label,
  preference,
  suppressed,
}: {
  agentId: string;
  frameRef: RefObject<HTMLDivElement | null>;
  label: string;
  preference: TooltipPreference;
  suppressed: boolean;
}) {
  const badgeRef = useRef<HTMLSpanElement>(null);
  useAgentCalloutPlacement({
    calloutRef: badgeRef,
    frameRef,
    agentId,
    preference,
    gap: 7,
  });

  return createPortal(
    <span
      ref={badgeRef}
      className={`agent-activity-badge ${suppressed ? "is-suppressed" : ""}`}
      aria-hidden="true"
      style={{ left: -10_000, top: -10_000, visibility: "hidden" }}
    >
      <span className="agent-activity-text">{label}</span>
    </span>,
    document.body,
  );
}
