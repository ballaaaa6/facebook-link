import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  resolveOfficeAttachment,
  resolveOfficeEntityOrigin,
  validateOfficeCharacterActionSocketsManifest,
  validateOfficeHeldPropsManifest,
  validateOfficeSpatialAuthorityManifest,
  type OfficeCharacterActionSocketsManifest,
  type OfficeHeldPropsManifest,
  type OfficeSpatialAuthorityManifest,
} from "../src/officeSpatialProduction.ts";

function fixture<T>(path: string): T {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8")) as T;
}

const characters = fixture<OfficeCharacterActionSocketsManifest>(
  "../../../assets/game/manifests/office-character-action-sockets-i01.json",
);
const props = fixture<OfficeHeldPropsManifest>(
  "../../../assets/game/manifests/office-held-props-h01.json",
);
const authority = fixture<OfficeSpatialAuthorityManifest>(
  "../../../assets/game/manifests/office-spatial-authority-i01.json",
);

test("I01 character sockets cover 18 actors and 108 interact-front frames", () => {
  assert.deepEqual(validateOfficeCharacterActionSocketsManifest(characters), []);
  assert.equal(characters.characterCount, 18);
  assert.equal(characters.frameRecordCount, 108);
  assert.equal(characters.foregroundMaskCount, 54);
  assert.ok(
    characters.characters.every(({ frames }) =>
      frames.length === 6
      && frames.slice(2, 5).every(({ foregroundMask }) =>
        foregroundMask?.sourcePixelExact === true)),
  );
});

test("H01 held props are fresh native-scale grip assets", () => {
  assert.deepEqual(validateOfficeHeldPropsManifest(props), []);
  assert.equal(props.count, 16);
  assert.equal(props.sourcePolicy.processedPixelReuse, false);
  assert.ok(props.props.every(({ runtimeScale }) => runtimeScale === 1));
  assert.ok(props.props.some(({ profile }) => profile === "single-handle"));
  assert.ok(props.props.some(({ profile }) => profile === "two-hand-wide"));
});

test("I01 resolves exact attachment deltas across the matrix and movement proof", () => {
  assert.deepEqual(validateOfficeSpatialAuthorityManifest(authority), []);
  assert.equal(authority.matrixValidation.visibleCaseCount, 864);
  assert.equal(authority.matrixValidation.attachmentDeltaFailures, 0);
  assert.equal(authority.movementValidation.propFollowFailures, 0);
  assert.equal(authority.movementValidation.maximumAttachmentDeltaPixels, 0);
});

test("socket transforms follow world movement without scene offsets", () => {
  const actor = characters.characters[0]!;
  const frame = actor.frames[2]!;
  const prop = props.props.find(({ id }) => id === "held.soda-can")!;
  const firstOrigin = resolveOfficeEntityOrigin(
    { position: { x: 1, y: 2, z: 0 }, orientation: "front" },
    frame.rootSocket,
  );
  const movedOrigin = resolveOfficeEntityOrigin(
    { position: { x: 7, y: 5, z: 1 }, orientation: "front" },
    frame.rootSocket,
  );
  const first = resolveOfficeAttachment({
    parentOrigin: firstOrigin,
    parentSocket: frame.primaryGripSocket,
    childSocket: prop.primaryGripSocket,
    layerRole: "between-actor-and-hand",
  });
  const moved = resolveOfficeAttachment({
    parentOrigin: movedOrigin,
    parentSocket: frame.primaryGripSocket,
    childSocket: prop.primaryGripSocket,
    layerRole: "between-actor-and-hand",
  });
  assert.deepEqual(first.attachmentDelta, { x: 0, y: 0 });
  assert.deepEqual(moved.attachmentDelta, { x: 0, y: 0 });
  assert.deepEqual(
    {
      x: moved.childOrigin.x - first.childOrigin.x,
      y: moved.childOrigin.y - first.childOrigin.y,
    },
    { x: 192, y: 64 },
  );
});

test("spatial authority rejects fallbacks and non-zero attachment failures", () => {
  const invalid = structuredClone(authority);
  (invalid.policies as { missingSocketFallback: boolean }).missingSocketFallback = true;
  (invalid.matrixValidation as { attachmentDeltaFailures: number })
    .attachmentDeltaFailures = 1;
  const issues = validateOfficeSpatialAuthorityManifest(invalid).join("\n");
  assert.match(issues, /missingSocketFallback/);
  assert.match(issues, /attachment deltas/);
});
