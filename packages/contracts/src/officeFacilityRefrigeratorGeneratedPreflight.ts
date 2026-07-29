export type {
  OfficeFacilityRefrigeratorGeneratedPreflightManifest,
} from "./officeFacilityRefrigeratorGeneratedPreflightTypes.ts";

export const officeFacilityRefrigeratorPreflightGates = [
  "F0", "F1", "F2", "F3", "F4", "F5",
  "F6", "F7", "F8", "F9", "F10",
] as const;

export type OfficeFacilityRefrigeratorPreflightGate =
  (typeof officeFacilityRefrigeratorPreflightGates)[number];

type RecordValue = Record<string, unknown>;

const record = (value: unknown): value is RecordValue =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const same = (first: unknown, second: unknown): boolean =>
  JSON.stringify(first) === JSON.stringify(second);
const sha256 = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const add = (issues: string[], condition: boolean, message: string): void => {
  if (!condition) issues.push(message);
};

function validateSources(value: unknown, issues: string[]): void {
  add(
    issues,
    record(value)
      && value.workflow === "built-in-imagegen"
      && record(value.promptRecord)
      && sha256(value.promptRecord.sha256)
      && Array.isArray(value.sources)
      && value.sources.length === 2,
    "generated source authority is invalid",
  );
  if (!record(value) || !Array.isArray(value.sources)) return;
  const expected = [
    ["front-anchor", 0, null, 1],
    ["motion-parts", 1, "front-anchor", 4],
  ] as const;
  for (const [index, source] of value.sources.entries()) {
    const expectation = expected[index];
    add(
      issues,
      expectation !== undefined
        && record(source)
        && source.role === expectation[0]
        && source.inputImageCount === expectation[1]
        && source.identityReference === expectation[2]
        && source.extractionMethod === "generated-source-chroma-key"
        && sha256(source.sha256)
        && Array.isArray(source.ownership)
        && source.ownership.length === expectation[3]
        && source.ownership.every(
          (entry) =>
            record(entry)
            && entry.cellBoundaryContact === false
            && Number.isInteger(entry.visiblePixels)
            && (entry.visiblePixels as number) > 0,
        ),
      `generated source ${index} ownership changed`,
    );
  }
}

function validateMotion(value: unknown, issues: string[]): void {
  add(
    issues,
    record(value)
      && value.kind === "reversible-finite-state"
      && value.repeatingAmbientLoop === false
      && value.compositionFormula === "immutableShell + lowerDoor[state]"
      && value.immutableShell === "shell"
      && value.movingChild === "lowerDoor"
      && same(value.states, ["closed", "half", "open"])
      && same(value.forwardPath, ["closed", "half", "open"])
      && same(value.reversePath, ["open", "half", "closed"])
      && same(
        value.reviewTransition,
        ["closed", "half", "open", "half", "closed"],
      )
      && Array.isArray(value.transitionChangedPixels)
      && value.transitionChangedPixels.length === 4
      && value.transitionChangedPixels.every(
        (count) => Number.isInteger(count) && (count as number) > 0,
      )
      && same(value.changedPixelsOutsideDoorSwingRegion, [0, 0, 0, 0])
      && value.shellChangedPixels === 0
      && same(value.pivotDeltaPixels, [0, 0])
      && same(value.footprintDeltaTiles, [0, 0])
      && value.closedEndpointMismatchPixels === 0,
    "Refrigerator R01 finite animation changed",
  );
}

function validateSelection(value: unknown, issues: string[]): void {
  const examples = record(value) && Array.isArray(value.examples)
    ? value.examples
    : [];
  add(
    issues,
    record(value)
      && value.algorithm
        === "(stable-hash(actorId|slotId) + visitIndex) % pool.length"
      && value.selectedOncePerVisit === true
      && value.frameStable === true
      && value.repeatAvoidance === "two-item pool alternates across visits"
      && same(value.pool, ["held.water-bottle", "held.yogurt-box"])
      && examples.length === 4
      && examples.every(
        (entry, index) =>
          record(entry)
          && entry.visitIndex === index
          && (
            entry.assetId === "held.water-bottle"
            || entry.assetId === "held.yogurt-box"
          )
          && (
            index === 0
            || entry.assetId !== (examples[index - 1] as RecordValue).assetId
          ),
      ),
    "Refrigerator R01 stable random selection changed",
  );
}

function validateInteraction(value: unknown, issues: string[]): void {
  add(
    issues,
    record(value)
      && value.semanticAction === "interact-use"
      && value.visualPoseAuthority === "interact-front"
      && value.capacity === 1
      && value.frontApproachCells === 1
      && value.actorId === "anna"
      && value.reservationSimulationBuilt === false
      && value.rosterCasesBuilt === 0,
    "Refrigerator R01 interaction preview changed",
  );
  if (!record(value)) return;
  const held = value.heldPropAuthority;
  add(
    issues,
    record(held)
      && held.status === "owner-approved"
      && Array.isArray(held.pool)
      && same(
        held.pool.map((entry) => record(entry) ? entry.assetId : null),
        ["held.water-bottle", "held.yogurt-box"],
      )
      && held.pool.every(
        (entry) =>
          record(entry)
          && sha256(entry.runtimeSha256)
          && entry.attachmentMode === "front-overlay",
      ),
    "Refrigerator R01 H01 pool changed",
  );
  validateSelection(value.selection, issues);
  const handoff = value.handoff;
  add(
    issues,
    record(handoff)
      && handoff.facilityParent === "facility.output.primary"
      && handoff.actorParent === "actor.hand.primary.grip"
      && handoff.childSocket === "prop.visualCenterSocket"
      && same(handoff.attachmentDelta, [0, 0])
      && handoff.magicOffset === false
      && handoff.missingSocketFallback === false
      && handoff.newCoordinateSystem === false
      && handoff.foregroundMaskUses === 0,
    "Refrigerator R01 must reuse I01/H01 with zero attachment drift",
  );
  add(
    issues,
    Array.isArray(value.timeline)
      && value.timeline.length === 12
      && same(
        value.timeline.map((entry) => record(entry) ? entry.doorState : null),
        [
          "closed", "closed", "closed", "closed", "half", "open",
          "open", "open", "half", "closed", "closed", "closed",
        ],
      )
      && value.timeline.every(
        (entry) =>
          record(entry)
          && entry.magicOffset === false
          && entry.fallbackSocket === false
          && (
            entry.attachmentDelta === null
            || same(entry.attachmentDelta, [0, 0])
          ),
      ),
    "Refrigerator R01 interaction timeline changed",
  );
}

function validateGates(value: unknown, issues: string[]): void {
  add(issues, record(value), "Refrigerator R01 gates are missing");
  if (!record(value)) return;
  for (const gate of officeFacilityRefrigeratorPreflightGates) {
    const expected = ["F0", "F1", "F2", "F3"].includes(gate)
      ? "passed"
      : "blocked";
    const entry = value[gate];
    add(
      issues,
      record(entry)
        && entry.status === expected
        && Array.isArray(entry.evidence),
      `Refrigerator R01 ${gate} must remain ${expected}`,
    );
  }
}

export function validateOfficeFacilityRefrigeratorGeneratedPreflightManifest(
  value: unknown,
): string[] {
  if (!record(value)) return ["manifest must be an object"];
  const issues: string[] = [];
  add(
    issues,
    value.schemaVersion === 1
      && value.id === "office.facility.refrigerator.r01"
      && value.familyId === "refrigerator.modern"
      && value.revision === "r01-generated-motion-preflight-r01",
    "Refrigerator R01 identity changed",
  );
  add(
    issues,
    value.status === "visual-motion-preflight-owner-review"
      && value.productionStage === "visual-motion-preflight"
      && value.developmentOnly === true
      && value.activeOfficePromotion === false,
    "Refrigerator R01 must remain an isolated preflight",
  );
  const directive = value.ownerDirective;
  add(
    issues,
    record(directive)
      && directive.physicalScale === "2x2x4"
      && directive.animatedDoor === true
      && directive.randomHeldOutput === true
      && directive.reuseExistingSpatialSystem === true
      && directive.freshRefrigeratorIdentity === true,
    "Refrigerator R01 owner directive changed",
  );
  const policy = value.sourcePolicy;
  add(issues, record(policy), "source policy is missing");
  if (record(policy)) {
    add(issues, policy.freshImageGeneration === true, "fresh source required");
    for (const field of [
      "originalMasterPixelReuse",
      "processedCropDirectReuse",
      "rejectedSideOrientationPixelReuse",
      "activeOfficePixelReuse",
      "otherFacilityPixelReuse",
      "missingAssetFallback",
    ]) {
      add(issues, policy[field] === false, `sourcePolicy.${field} must be false`);
    }
  }
  validateSources(value.generation, issues);

  const render = value.render;
  add(
    issues,
    record(render)
      && same(render.physicalScale, {
        width: 2, depth: 2, height: 4, unit: "tile",
      })
      && same(render.footprint, { width: 2, depth: 2, unit: "tile" })
      && same(render.renderBox, { width: 3, height: 4, unit: "tile" })
      && same(render.authoringCanvas, [384, 512])
      && same(render.runtimeCanvas, [96, 128])
      && render.uniformIntegerDivisor === 4
      && render.nonUniformScaling === false
      && render.anchor === "bottom-center"
      && same(render.requiredOrientations, ["front"])
      && same(render.basePivotRuntime, [48, 124])
      && same(render.sortPivotRuntime, [48, 124])
      && same(render.interactionTargetRuntime, [48, 124])
      && same(render.outputSocketRuntime, [49, 76])
      && same(render.doorSwingRegionRuntime, [14, 38, 89, 124])
      && render.collisionChangesDuringMotion === false
      && render.footprintChangesDuringMotion === false,
    "Refrigerator R01 2x2x4 geometry changed",
  );
  add(
    issues,
    record(value.parts)
      && same(Object.keys(value.parts).sort(), [
        "door-closed", "door-half", "door-open", "shell",
      ])
      && record(value.states)
      && same(Object.keys(value.states).sort(), ["closed", "half", "open"]),
    "Refrigerator R01 modular parts changed",
  );
  validateMotion(value.finiteAnimation, issues);
  validateInteraction(value.interactionPreview, issues);

  const targets = value.productionTargets;
  add(
    issues,
    record(targets)
      && targets.basePoseCases === 108
      && targets.propOverlayCasesPerTwoAssetPool === 108
      && targets.builtPoseCases === 0
      && targets.builtPropOverlayCases === 0
      && targets.reservationDurationSeconds === 30
      && targets.reservationActorCount === 2
      && targets.reservationSlotContribution === 0
      && targets.plannedReservationSlotContributionAfterF8 === 1
      && targets.facilityV1ReadySlotsBeforeRefrigeratorF8 === 17
      && targets.facilityV1ReadySlotsAfterRefrigeratorF8Target === 18,
    "Refrigerator R01 fabricated production or slot authority",
  );
  validateGates(value.gates, issues);

  const outputs = Array.isArray(value.reviewOutputs)
    ? value.reviewOutputs
    : [];
  add(
    issues,
    outputs.length === 10
      && Array.isArray(value.reviewEvidence)
      && value.reviewEvidence.length === 10
      && value.reviewEvidence.every(
        (entry, index) =>
          record(entry)
          && entry.file === outputs[index]
          && sha256(entry.sha256),
      ),
    "Refrigerator R01 review evidence changed",
  );
  add(
    issues,
    value.visualApproval === null,
    "Refrigerator R01 visual approval must await owner review",
  );
  const permissions = value.permissions;
  add(
    issues,
    record(permissions)
      && permissions.ownerReview === true
      && permissions.fullSystemBuild === false
      && permissions.reservationSlotActivation === false
      && permissions.furnitureOnlyRoom === false
      && permissions.activeOfficePromotion === false,
    "Refrigerator R01 permissions exceed preflight authority",
  );
  return issues;
}
