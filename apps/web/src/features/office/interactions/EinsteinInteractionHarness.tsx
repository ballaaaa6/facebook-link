import {
  einstein15RowStagingAsset,
  heldPropAssetCatalog,
} from "./interactionAssetCatalog";
import {
  heldPropAtInteractFrame,
  interactFrontHandAnchors1x,
  selectHeldProp,
  type FacilityInteractionId,
  type HeldPropChoice,
} from "./officeInteractionContract";

export interface EinsteinInteractionHarnessProps {
  agentId: string;
  facility: FacilityInteractionId;
  facilitySlotId: string;
  frame: number;
  visitIndex: number;
  previousProp?: HeldPropChoice;
}

export function EinsteinInteractionHarness({
  agentId,
  facility,
  facilitySlotId,
  frame,
  visitIndex,
  previousProp,
}: EinsteinInteractionHarnessProps) {
  const normalizedFrame = ((Math.trunc(frame) % 6) + 6) % 6;
  const selectedProp = selectHeldProp({
    agentId,
    facility,
    facilitySlotId,
    visitIndex,
    previous: previousProp,
  });
  const visibleProp = heldPropAtInteractFrame(selectedProp, normalizedFrame);
  const anchor = interactFrontHandAnchors1x[normalizedFrame];

  return (
    <div
      aria-label={`Einstein ${facility} interaction frame ${normalizedFrame + 1}`}
      data-held-prop={visibleProp ?? "none"}
      style={{
        backgroundImage: `image-set(url("${einstein15RowStagingAsset.sheet}") 1x, url("${einstein15RowStagingAsset.sheet2x}") 2x)`,
        backgroundPosition: `${-normalizedFrame * 96}px ${-10 * 104}px`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "768px 1560px",
        height: 104,
        imageRendering: "pixelated",
        position: "relative",
        width: 96,
      }}
    >
      {visibleProp ? (
        <img
          alt=""
          aria-hidden="true"
          src={heldPropAssetCatalog[visibleProp]}
          style={{
            height: 20,
            imageRendering: "pixelated",
            left: anchor.x - 10,
            pointerEvents: "none",
            position: "absolute",
            top: anchor.y - 10,
            width: 20,
          }}
        />
      ) : null}
    </div>
  );
}
