import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  floorLocalCoordinateKey,
  validateBuildingTopology,
} from "../src/building-topology-validation.ts";
import type {
  BuildingTopologyDocument,
  PortalDocument,
} from "../src/building-topology-validation.ts";

function readFixture(name: string): BuildingTopologyDocument {
  return JSON.parse(readFileSync(new URL(`../../../docs/office-v2/fixtures/${name}`, import.meta.url), "utf8")) as BuildingTopologyDocument;
}

test("a one-floor envelope is independently addressable and site context is presentation-only", () => {
  const document = readFixture("building-topology-one-floor.json");
  const result = validateBuildingTopology(document);

  assert.equal(result.ok, true, JSON.stringify(result.diagnostics, null, 2));
  assert.deepEqual(result.floorKeys, ["floor:ground-floor@1"]);
  assert.deepEqual(result.worldKeys, ["hq-ground-floor@1"]);
  assert.deepEqual(result.portalKeys, ["main-entrance@1"]);
  assert.deepEqual(result.endpointKeys, ["ground-entrance@1", "site-entrance@1"]);
  assert.equal(document.siteEnvelope.presentationOnly, true);
});

test("a future floor adds its own world and vertical portal without changing floor one", () => {
  const oneFloor = readFixture("building-topology-one-floor.json");
  const twoFloors = readFixture("building-topology-two-floors.json");
  const result = validateBuildingTopology(twoFloors);

  assert.equal(result.ok, true, JSON.stringify(result.diagnostics, null, 2));
  assert.deepEqual(twoFloors.floors[0], oneFloor.floors[0]);
  assert.deepEqual(twoFloors.portals[0], oneFloor.portals[0]);
  assert.deepEqual(twoFloors.siteEnvelope, oneFloor.siteEnvelope);
  assert.deepEqual(result.floorKeys, ["floor:ground-floor@1", "floor:mezzanine-floor@1"]);
  assert.deepEqual(result.worldKeys, ["hq-ground-floor@1", "hq-mezzanine-floor@1"]);
  assert.deepEqual(result.portalKeys, ["future-stair-core@1", "main-entrance@1"]);
});

test("floor-local identity makes equal numeric coordinates on different floors distinct", () => {
  const document = readFixture("building-topology-two-floors.json");
  const vertical = document.portals.find(({ id }) => id === "future-stair-core") as PortalDocument;
  const ground = vertical.endpoint?.coordinate;
  const mezzanine = vertical.landing?.coordinate;

  assert.ok(ground);
  assert.ok(mezzanine);
  assert.deepEqual(ground.coordinate, mezzanine.coordinate);
  assert.notEqual(floorLocalCoordinateKey(ground), floorLocalCoordinateKey(mezzanine));
});

test("validation output is independent of floor, portal, and context input order", () => {
  const document = readFixture("building-topology-two-floors.json");
  const reordered = structuredClone(document);
  reordered.floors = reordered.floors.slice().reverse();
  reordered.portals = reordered.portals.slice().reverse();
  reordered.siteEnvelope.contextCells = reordered.siteEnvelope.contextCells.slice().reverse();

  assert.deepEqual(validateBuildingTopology(reordered), validateBuildingTopology(document));
});

for (const [name, mutation, expected] of [
  ["duplicate floor", (document: BuildingTopologyDocument) => {
    const copy = structuredClone(document);
    copy.floors.push(structuredClone(copy.floors[0]));
    return copy;
  }, "world.floor-duplicate"],
  ["duplicate portal", (document: BuildingTopologyDocument) => {
    const copy = structuredClone(document);
    const duplicate = structuredClone(copy.portals[0]);
    if (duplicate.endpoint) duplicate.endpoint.id = `${duplicate.endpoint.id}-duplicate`;
    if (duplicate.landing) duplicate.landing.id = `${duplicate.landing.id}-duplicate`;
    copy.portals.push(duplicate);
    return copy;
  }, "world.portal-duplicate"],
  ["missing endpoint", (document: BuildingTopologyDocument) => {
    const copy = structuredClone(document);
    delete (copy.portals[0] as { endpoint?: unknown }).endpoint;
    return copy;
  }, "world.portal-endpoint-missing"],
  ["missing landing", (document: BuildingTopologyDocument) => {
    const copy = structuredClone(document);
    delete (copy.portals[0] as { landing?: unknown }).landing;
    return copy;
  }, "world.portal-landing-missing"],
  ["portal direction mismatch", (document: BuildingTopologyDocument) => {
    const copy = structuredClone(document);
    const portal = copy.portals.find(({ id }) => id === "future-stair-core") as { direction: string };
    portal.direction = "inbound";
    return copy;
  }, "world.portal-direction-mismatch"],
  ["exterior/interior overlap", (document: BuildingTopologyDocument) => {
    const copy = structuredClone(document);
    copy.siteEnvelope.contextCells = [...copy.siteEnvelope.contextCells, {
      kind: "sidewalk",
      coordinate: copy.floors[0].siteFootprint[0],
    }];
    return copy;
  }, "world.exterior-interior-overlap"],
  ["elevation floor inference", (document: BuildingTopologyDocument) => {
    const copy = structuredClone(document);
    (copy.floors[0] as { identitySource: string }).identitySource = "elevation";
    return copy;
  }, "world.elevation-floor-inference"],
  ["incomplete migration context", (document: BuildingTopologyDocument) => {
    const copy = structuredClone(document);
    copy.migration = { sourceSchema: "office-world-v1", context: { building: copy.building } };
    return copy;
  }, "contract.migration-context-missing"],
] as const) {
  test(`rejects ${name} with a stable diagnostic`, () => {
    const source = name === "portal direction mismatch"
      ? readFixture("building-topology-two-floors.json")
      : readFixture("building-topology-one-floor.json");
    const result = validateBuildingTopology(mutation(source));
    assert.equal(result.ok, false);
    assert.equal(result.diagnostics.some(({ code }) => code === expected), true, JSON.stringify(result.diagnostics, null, 2));
  });
}
