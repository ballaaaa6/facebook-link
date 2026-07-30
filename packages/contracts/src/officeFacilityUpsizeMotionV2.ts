import type {
  OfficeFacilityUpsizeMotionV2Manifest,
} from "./officeFacilityUpsizeMotionV2Types.ts";

export type {
  OfficeFacilityUpsizeMotionV2Asset,
  OfficeFacilityUpsizeMotionV2Family,
  OfficeFacilityUpsizeMotionV2Manifest,
  OfficeFacilityUpsizeMotionV2Part,
} from "./officeFacilityUpsizeMotionV2Types.ts";

const record = (value: unknown): value is Record<string, any> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const same = (first: unknown, second: unknown): boolean =>
  JSON.stringify(first) === JSON.stringify(second);

const hash = (value: unknown): boolean =>
  typeof value === "string" && /^[0-9a-f]{64}$/.test(value);

const asset = (value: unknown, size?: [number, number]): boolean =>
  record(value)
  && typeof value.file === "string"
  && hash(value.sha256)
  && Array.isArray(value.size)
  && (!size || same(value.size, size));

export function validateOfficeFacilityUpsizeMotionV2Manifest(
  value: unknown,
): string[] {
  const issues: string[] = [];
  if (!record(value)) return ["manifest must be an object"];

  if (
    value.schemaVersion !== 1
    || value.id !== "office.facility.upsize-motion.v2"
    || value.revision !== "motion-artwork-v2-visual-r01"
    || value.status !== "motion-artwork-owner-review"
    || value.developmentOnly !== true
    || value.ownerDecision !== null
  ) {
    issues.push("motion V2 identity or visual-review stop changed");
  }

  const decision = value.decisionBoundary;
  const productionV1 = record(decision) ? decision.productionV1 : null;
  if (
    !record(decision)
    || !record(productionV1)
    || productionV1.decision !== "rejected-at-f8"
    || productionV1.systemBehavior !== "accepted"
    || productionV1.visualIdentity !== "accepted"
    || productionV1.motionArtwork
      !== "rejected-procedural-effect-pixels"
    || !hash(productionV1.manifestSha256)
    || decision.replacementScope !== "visual-motion-artwork-only"
    || decision.fullProductionRebuildBeforeVisualApproval !== false
  ) {
    issues.push("V1 visual rejection or behavior-retention boundary changed");
  }

  const policy = value.sourcePolicy;
  if (
    !record(policy)
    || policy.workflow !== "built-in ImageGen"
    || policy.approvedShellPixelReuse !== true
    || policy.freshMotionPixelGeneration !== true
    || policy.proceduralRuntimeEffectPixels !== false
    || policy.codeMayCrop !== true
    || policy.codeMayChromaRemove !== true
    || policy.codeMayNearestResize !== true
    || policy.codeMayIntegerTranslate !== true
    || policy.codeMayAlphaComposite !== true
    || policy.missingAssetFallback !== false
    || !record(policy.promptRecord)
    || !hash(policy.promptRecord.sha256)
  ) {
    issues.push("ImageGen-only motion source policy changed");
  }

  const physical = value.physicalContract;
  if (
    !record(physical)
    || !same(physical.physicalScaleTiles, [2, 2, 4])
    || !same(physical.floorFootprintTiles, [2, 2])
    || !same(physical.renderBoxTiles, [3, 4])
    || !same(physical.runtimeCanvas, [96, 128])
    || !same(physical.basePivotPixels, [48, 124])
  ) {
    issues.push("approved 2x2x4 physical contract changed");
  }

  const expected = new Map([
    ["coffee-machine-c02", 12],
    ["water-dispenser-w02", 12],
    ["vending-machine-u02", 16],
    ["massage-chair-r03", 12],
  ]);
  if (!Array.isArray(value.families) || value.families.length !== 4) {
    issues.push("exactly four motion families are required");
  } else {
    for (const family of value.families) {
      if (!record(family) || !expected.has(family.slug)) {
        issues.push("unknown motion family");
        continue;
      }
      const expectedParts = expected.get(family.slug)!;
      if (
        !asset(family.approvedShell, [96, 128])
        || !asset(family.derivedShell, [96, 128])
        || !record(family.atlas)
        || family.atlas.componentCount !== expectedParts
        || !same(family.atlas.chromaSize, [1254, 1254])
        || !same(family.atlas.alphaSize, [1254, 1254])
        || !hash(family.atlas.chromaSha256)
        || !hash(family.atlas.alphaSha256)
        || !Array.isArray(family.parts)
        || family.parts.length !== expectedParts
      ) {
        issues.push(`${family.slug} authored source or part count changed`);
      }
      if (
        !record(family.seamLoop)
        || !same(family.seamLoop.transition, ["a", "b", "c", "d", "a"])
        || !Array.isArray(family.seamLoop.frames)
        || family.seamLoop.frames.length !== 4
        || !same(family.seamLoop.outsideDeclaredChangedPixels, [0, 0, 0, 0])
        || !same(family.seamLoop.pivotDeltaPixels, [0, 0])
        || !asset(family.seamLoop.gif, [384, 512])
      ) {
        issues.push(`${family.slug} seam-loop invariants changed`);
      }
      if (
        !record(family.finiteUse)
        || !Array.isArray(family.finiteUse.frames)
        || family.finiteUse.frames.length !== 6
        || !Array.isArray(family.finiteUse.states)
        || family.finiteUse.states.length !== 6
        || family.finiteUse.states[0]
          !== family.finiteUse.states[family.finiteUse.states.length - 1]
        || family.finiteUse.frames[0]?.sha256
          !== family.finiteUse.frames[family.finiteUse.frames.length - 1]?.sha256
        || !asset(family.finiteUse.interactionGif, [1152, 640])
      ) {
        issues.push(`${family.slug} finite interaction changed`);
      }
      if (
        !Array.isArray(family.reviewOutputs)
        || family.reviewOutputs.length !== 5
      ) {
        issues.push(`${family.slug} review evidence is incomplete`);
      }
    }
  }

  const gates = value.gates;
  if (
    !record(gates)
    || gates.V2_SOURCE?.status !== "passed"
    || gates.V2_ALPHA?.status !== "passed"
    || gates.V2_PARTS?.status !== "passed"
    || gates.V2_VISUAL_REVIEW?.status !== "pending-owner-review"
    || gates.F4_F7_REBUILD?.status !== "blocked"
    || gates.F8?.status !== "blocked"
    || gates.SLOT_TRANSFER?.status !== "blocked"
    || gates.F9?.status !== "blocked"
    || gates.F10_ACTIVE_OFFICE?.status !== "blocked"
  ) {
    issues.push("motion V2 gate stop changed");
  }

  const isolation = value.roomIsolation;
  const permissions = value.permissions;
  if (
    !record(isolation)
    || isolation.f9Changed !== false
    || isolation.activeOfficeChanged !== false
    || isolation.reservationSlotsActivated !== 0
    || !record(permissions)
    || permissions.visualReview !== true
    || permissions.fullProductionRebuild !== false
    || permissions.reservationSlotTransfer !== false
    || permissions.f9Composition !== false
    || permissions.activeOfficePromotion !== false
  ) {
    issues.push("room, slot, or Active Office isolation changed");
  }
  return issues;
}

export function assertOfficeFacilityUpsizeMotionV2Manifest(
  value: unknown,
): asserts value is OfficeFacilityUpsizeMotionV2Manifest {
  const issues = validateOfficeFacilityUpsizeMotionV2Manifest(value);
  if (issues.length) throw new Error(issues.join("; "));
}
