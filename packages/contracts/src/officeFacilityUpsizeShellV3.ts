import type {
  OfficeFacilityUpsizeShellV3Manifest,
  OfficeFacilityUpsizeShellV3Slug,
} from "./officeFacilityUpsizeShellV3Types.ts";

const expectedParts = new Map<OfficeFacilityUpsizeShellV3Slug, number>([
  ["coffee-machine-c02", 12],
  ["water-dispenser-w02", 12],
  ["vending-machine-u02", 16],
  ["massage-chair-r03", 12],
]);

const same = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

export function validateOfficeFacilityUpsizeShellV3(
  value: OfficeFacilityUpsizeShellV3Manifest,
): string[] {
  const issues: string[] = [];
  if (
    value.schemaVersion !== 1
    || value.id !== "office.facility.upsize-shell.v3"
    || value.status !== "shell-integration-owner-review"
    || value.developmentOnly !== true
  ) {
    issues.push("Shell V3 identity or review status changed");
  }

  const decision = value.decisionBoundary;
  if (
    decision.motionV2.effects !== "accepted"
    || decision.motionV2.shellIntegration !== "rejected-at-owner-review"
    || decision.replacementScope !== "fresh-shell-pixels-and-integration-only"
    || decision.approvedEffectRegeneration !== false
    || decision.fullProductionRebuildBeforeVisualApproval !== false
  ) {
    issues.push("Motion V2 effect/shell decision boundary changed");
  }

  const policy = value.sourcePolicy;
  if (
    policy.workflow !== "built-in ImageGen"
    || policy.oldShellPixelReuse !== false
    || policy.approvedMotionV2EffectReuse !== true
    || policy.freshShellPixelGeneration !== true
    || policy.proceduralRuntimeShellPixels !== false
    || policy.proceduralRuntimeEffectPixels !== false
    || policy.missingAssetFallback !== false
  ) {
    issues.push("fresh authored-shell source policy changed");
  }

  const physical = value.physicalContract;
  if (
    !same(physical.physicalScaleTiles, [2, 2, 4])
    || !same(physical.floorFootprintTiles, [2, 2])
    || !same(physical.renderBoxTiles, [3, 4])
    || !same(physical.runtimeCanvas, [96, 128])
    || !same(physical.basePivotPixels, [48, 124])
  ) {
    issues.push("approved 2x2x4 physical contract changed");
  }

  if (value.families.length !== 4) {
    issues.push(`expected four Shell V3 families, found ${value.families.length}`);
  }
  const seen = new Set<string>();
  for (const family of value.families) {
    if (seen.has(family.slug)) {
      issues.push(`duplicate Shell V3 family ${family.slug}`);
      continue;
    }
    seen.add(family.slug);
    const partCount = expectedParts.get(family.slug);
    if (partCount === undefined || family.effectAuthority.parts.length !== partCount) {
      issues.push(`${family.slug} approved effect part count changed`);
    }
    if (
      family.effectAuthority.manifest
      !== "assets/game/manifests/office-facility-upsize-motion-v2.json"
    ) {
      issues.push(`${family.slug} no longer consumes Motion V2 effects`);
    }
    if (
      !same(
        family.shellSource.views.map((view) => view.view),
        ["front", "left", "right", "back"],
      )
      || !same(Object.keys(family.runtimeShell.views), [
        "front",
        "left",
        "right",
        "back",
      ])
    ) {
      issues.push(`${family.slug} four-side shell contract changed`);
    }
    if (
      !same(family.seamLoop.transition, ["a", "b", "c", "d", "a"])
      || family.seamLoop.frames.length !== 4
      || !same(family.seamLoop.outsideDeclaredChangedPixels, [0, 0, 0, 0])
      || !same(family.seamLoop.pivotDeltaPixels, [0, 0])
    ) {
      issues.push(`${family.slug} shell-stable seam loop changed`);
    }
    if (
      family.finiteUse.frames.length !== 6
      || family.finiteUse.idleReturnExact !== true
    ) {
      issues.push(`${family.slug} finite-use idle return changed`);
    }
  }

  if (
    value.gates.V3_VISUAL_REVIEW?.status !== "pending-owner-review"
    || value.gates.F4_F7_REBUILD?.status !== "blocked"
    || value.gates.F9?.status !== "blocked"
    || value.gates.F10_ACTIVE_OFFICE?.status !== "blocked"
  ) {
    issues.push("Shell V3 visual-review gates changed");
  }
  if (
    value.roomIsolation.f9Changed !== false
    || value.roomIsolation.activeOfficeChanged !== false
    || value.roomIsolation.reservationSlotsActivated !== 0
    || value.permissions.visualReview !== true
    || value.permissions.fullProductionRebuild !== false
    || value.permissions.reservationSlotTransfer !== false
    || value.permissions.f9Composition !== false
    || value.permissions.activeOfficePromotion !== false
  ) {
    issues.push("Shell V3 isolation or permissions changed");
  }
  if (value.ownerDecision !== null) {
    issues.push("Shell V3 owner decision must remain null before review");
  }
  return issues;
}

export type {
  OfficeFacilityUpsizeShellV3Family,
  OfficeFacilityUpsizeShellV3File,
  OfficeFacilityUpsizeShellV3Manifest,
  OfficeFacilityUpsizeShellV3Slug,
} from "./officeFacilityUpsizeShellV3Types.ts";
