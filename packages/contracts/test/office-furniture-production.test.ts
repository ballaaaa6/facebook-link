import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  validateOfficeFurnitureFamilyManifest,
  type OfficeFurnitureFamilyManifest,
} from "../src/officeFurnitureProduction.ts";

const rejectedManifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-furniture-chair-massage-r01.json",
  import.meta.url,
), "utf8")) as OfficeFurnitureFamilyManifest;
const manifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-furniture-chair-massage-r02.json",
  import.meta.url,
), "utf8")) as OfficeFurnitureFamilyManifest;
const seatingFiles = [
  "office-furniture-chair-reading-r01.json",
  "office-furniture-pouf-lounge-r01.json",
  "office-furniture-beanbag-lounge-r01.json",
  "office-furniture-stool-side-r01.json",
  "office-furniture-sofa-modern-two-seat-r01.json",
  "office-furniture-sofa-modern-three-seat-r01.json",
  "office-furniture-table-review-long-r01.json",
] as const;
const seatingManifests = seatingFiles.map((file) => JSON.parse(readFileSync(
  new URL(`../../../assets/game/manifests/${file}`, import.meta.url),
  "utf8",
)) as OfficeFurnitureFamilyManifest);
const approvedSeatingFamilyIds = new Set([
  "sofa.modern.two-seat",
  "sofa.modern.three-seat",
]);

test("rejected massage chair r01 remains valid audit history", () => {
  assert.deepEqual(validateOfficeFurnitureFamilyManifest(rejectedManifest), []);
  assert.equal(rejectedManifest.familyId, "chair.massage.modern");
  assert.equal(rejectedManifest.status, "rejected");
  assert.equal(rejectedManifest.gates.F8.status, "blocked");
  assert.equal(rejectedManifest.ownerDecision?.decision, "rejected");
  assert.equal(rejectedManifest.gates.F9.status, "blocked");
  assert.equal(rejectedManifest.gates.F10.status, "blocked");
});

test("massage chair r02 separates behavior from its approved visual pose", () => {
  assert.deepEqual(validateOfficeFurnitureFamilyManifest(manifest), []);
  assert.equal(manifest.status, "owner-approved");
  assert.equal(manifest.gates.F8.status, "passed");
  assert.equal(manifest.ownerDecision?.decision, "approved");
  assert.equal(manifest.interaction.slots[0]?.action, "use-massage-chair");
  assert.equal(manifest.interaction.slots[0]?.visualPose, "working-front-seated");
  assert.equal(manifest.rosterValidation.visualPose, "working-front-seated");
  assert.equal(manifest.rosterValidation.poseAuthority.status, "owner-approved");
});

test("current furniture candidates reject conflated action and visual pose", () => {
  const invalid = structuredClone(manifest);
  invalid.interaction.slots[0]!.action = "working-front-seated";
  const issues = validateOfficeFurnitureFamilyManifest(invalid).join("\n");
  assert.match(issues, /separate semantic action from visual pose/);
});

test("Seating S01 records two independent F8 approvals and keeps five pending", () => {
  for (const candidate of seatingManifests) {
    const isApproved = approvedSeatingFamilyIds.has(candidate.familyId);
    assert.deepEqual(validateOfficeFurnitureFamilyManifest(candidate), []);
    assert.equal(
      candidate.status,
      isApproved ? "owner-approved" : "owner-review-f8-pending",
    );
    assert.equal(candidate.gates.F7.status, "passed");
    assert.equal(
      candidate.gates.F8.status,
      isApproved ? "passed" : "pending-owner-review",
    );
    assert.equal(
      candidate.ownerDecision?.decision,
      isApproved ? "approved" : undefined,
    );
    assert.equal(
      candidate.ownerDecision?.decidedOn,
      isApproved ? "2026-07-29" : undefined,
    );
    assert.equal(candidate.permissions.ownerReview, !isApproved);
    assert.equal(candidate.gates.F9.status, "blocked");
    assert.equal(candidate.gates.F10.status, "blocked");
  }
  assert.equal(
    seatingManifests.filter(({ status }) => status === "owner-approved").length,
    2,
  );
  assert.equal(
    seatingManifests.filter(
      ({ status }) => status === "owner-review-f8-pending",
    ).length,
    5,
  );
  assert.equal(
    seatingManifests.reduce(
      (total, candidate) => total + candidate.interaction.capacity,
      0,
    ),
    13,
  );
});

test("Seating S01 keeps every seated lower body in front of the seat layer", () => {
  for (const candidate of seatingManifests) {
    for (const roster of candidate.rosterValidations ?? []) {
      for (const character of roster.characters) {
        for (const frame of character.frames) {
          assert.ok(frame.slots?.length);
          for (const slot of frame.slots ?? []) {
            assert.ok(slot.lowerBodyPixels > 0);
            assert.equal(slot.visibleLowerBodyPixels, slot.lowerBodyPixels);
            assert.equal(slot.lowerBodyVisibilityRatio, 1);
          }
        }
      }
    }
  }
});

test("seat-layer evidence rejects a foreground that hides hanging legs", () => {
  const invalid = structuredClone(seatingManifests[0]);
  const slot = invalid.rosterValidations![0]!
    .characters[0]!.frames[0]!.slots![0]!;
  slot.visibleLowerBodyPixels -= 1;
  slot.lowerBodyVisibilityRatio = slot.visibleLowerBodyPixels
    / slot.lowerBodyPixels;
  const issues = validateOfficeFurnitureFamilyManifest(invalid).join("\n");
  assert.match(issues, /hides lower-body pixels behind the seat foreground/);
});

test("four-seat review evidence covers front and back without side poses", () => {
  const review = seatingManifests.find(
    ({ familyId }) => familyId === "table.review.long.modern",
  )!;
  assert.equal(review.interaction.capacity, 4);
  assert.deepEqual(
    review.interaction.slots.map(({ facing }) => facing),
    ["front", "front", "back", "back"],
  );
  assert.deepEqual(
    review.rosterValidations?.map(({ visualPose, slotIds }) => [
      visualPose,
      slotIds?.length,
    ]),
    [
      ["working-front-seated", 2],
      ["working-back-seated", 2],
    ],
  );
  assert.equal(review.reservationValidation.maximumConcurrentReservations, 4);
});

test("multi-pose furniture rejects duplicate slot coverage", () => {
  const review = structuredClone(seatingManifests.find(
    ({ familyId }) => familyId === "table.review.long.modern",
  )!);
  review.rosterValidations![1]!.slotIds = [
    review.rosterValidations![0]!.slotIds![0]!,
  ];
  const issues = validateOfficeFurnitureFamilyManifest(review).join("\n");
  assert.match(issues, /duplicate roster evidence/);
  assert.match(issues, /cover every interaction slot/);
});

test("boundary-crossing ownership requires explicit silhouette evidence", () => {
  const sofa = structuredClone(seatingManifests.find(
    ({ familyId }) => familyId === "sofa.modern.three-seat",
  )!);
  assert.equal(sofa.source.extraction.touchesNominalCellBoundary, true);
  delete sofa.source.extraction.boundaryReview;
  const issues = validateOfficeFurnitureFamilyManifest(sofa).join("\n");
  assert.match(issues, /boundaryReview/);
});

test("furniture production rejects non-uniform scaling and processed crop reuse", () => {
  const invalid = structuredClone(manifest);
  (invalid.render as { nonUniformScaling: boolean }).nonUniformScaling = true;
  (invalid.sourcePolicy as { processedCropDirectReuse: boolean }).processedCropDirectReuse = true;
  invalid.source.path = "assets/game/processed/office-library-modern-bright-v1/chair.png";
  const issues = validateOfficeFurnitureFamilyManifest(invalid).join("\n");
  assert.match(issues, /nonUniformScaling/);
  assert.match(issues, /processedCropDirectReuse/);
  assert.match(issues, /original layout-reference master/);
});

test("furniture production keeps room and Active Office integration blocked", () => {
  const invalid = structuredClone(manifest);
  (invalid as { activeOfficePromotion: boolean }).activeOfficePromotion = true;
  invalid.gates.F9.status = "passed";
  invalid.gates.F10.status = "passed";
  const issues = validateOfficeFurnitureFamilyManifest(invalid).join("\n");
  assert.match(issues, /activeOfficePromotion/);
  assert.match(issues, /gates\.F9/);
  assert.match(issues, /gates\.F10/);
});
