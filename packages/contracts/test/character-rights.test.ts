import assert from "node:assert/strict";
import test from "node:test";
import {
  validateCharacterRightsReview,
  validateCommercialCharacterRoster,
} from "../src/characterRights.ts";

test("character rights review keeps prototype art out of generation inputs", () => {
  const review = {
    version: 1,
    reviewedOn: "2026-07-27",
    records: [{
      id: "prototype-one",
      currentLicenseState: "pending-commercial-review",
      usage: "alternate-prototype",
      disposition: "replace-and-quarantine",
      permittedUse: "internal-prototype-only",
      generationInputAllowed: false,
      replacementSlot: null,
      reason: "Commercial rights are not documented.",
      reviewStatus: "reviewed",
    }],
  };
  assert.deepEqual(validateCharacterRightsReview(review), []);
  review.records[0].generationInputAllowed = true;
  assert.match(validateCharacterRightsReview(review).join("\n"), /generationInputAllowed/);
});

test("commercial roster remains isolated and uses unique original IDs", () => {
  const slots = Array.from({ length: 11 }, (_, index) => ({
    slotId: index === 10 ? "office-mascot" : `agent-${index}`,
    kind: index === 10 ? "companion" : "agent",
    characterId: `original-character-${index}`,
    morphology: index === 10 ? "compact-stylized" : "standard-human",
    productionWave: index < 3 ? 1 : 2,
    reviewStatus: "planned",
  }));
  const roster = {
    version: 1,
    status: "rights-contract",
    activeOfficeImported: false,
    commercialCharacterApproval: false,
    sourcePolicy: {
      prototypePixelsAllowed: false,
      prototypeImagesAllowedAsGenerationInput: false,
      thirdPartyNamesAllowedInPrompts: false,
      technicalAnimationContractAllowed: true,
    },
    slots,
  };
  assert.deepEqual(validateCommercialCharacterRoster(roster), []);
  roster.slots[1].characterId = roster.slots[0].characterId;
  assert.match(validateCommercialCharacterRoster(roster).join("\n"), /characterId: must be unique/);
});
