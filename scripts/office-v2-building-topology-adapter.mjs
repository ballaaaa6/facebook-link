import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validateBuildingTopology } from "@affiliate-ops/office-v2-world";

const defaultTopologyRoot = join(import.meta.dirname, "..", "docs", "office-v2");

function readJson(root, path) {
  return JSON.parse(readFileSync(join(root, path), "utf8"));
}

export function applyBuildingTopologyMutation(document, mutation) {
  const copy = structuredClone(document);
  if (mutation === "duplicate-floors[0]") {
    copy.floors.push(structuredClone(copy.floors[0]));
  } else if (mutation === "duplicate-portals[0]-unique-endpoints") {
    const duplicate = structuredClone(copy.portals[0]);
    if (duplicate.endpoint) duplicate.endpoint.id = `${duplicate.endpoint.id}-duplicate`;
    if (duplicate.landing) duplicate.landing.id = `${duplicate.landing.id}-duplicate`;
    copy.portals.push(duplicate);
  } else if (mutation === "delete-portals[0].endpoint") {
    delete copy.portals[0].endpoint;
  } else if (mutation === "delete-portals[0].landing") {
    delete copy.portals[0].landing;
  } else if (mutation === "set-portals.future-stair-core.direction=inbound") {
    const portal = copy.portals.find(({ id }) => id === "future-stair-core");
    if (!portal) throw new Error("future-stair-core portal is missing");
    portal.direction = "inbound";
  } else if (mutation === "add-context-cell-overlapping-ground-footprint") {
    copy.siteEnvelope.contextCells.push({
      kind: "sidewalk",
      coordinate: copy.floors[0].siteFootprint[0],
    });
  } else if (mutation === "set-floors[0].identitySource=elevation") {
    copy.floors[0].identitySource = "elevation";
  } else if (mutation === "set-incomplete-v1-migration-context") {
    copy.migration = {
      sourceSchema: "office-world-v1",
      context: { building: copy.building },
    };
  } else {
    throw new Error(`Unsupported building topology mutation: ${mutation}`);
  }
  return copy;
}

export function evaluateBuildingTopologyFixture({
  knowledgeRoot = defaultTopologyRoot,
  fixturePath,
}) {
  const fixture = readJson(knowledgeRoot, fixturePath);
  const document = fixture.baseFixture
    ? applyBuildingTopologyMutation(readJson(knowledgeRoot, fixture.baseFixture), fixture.mutation)
    : fixture;
  return {
    document,
    expectedFailure: fixture.expectedFailure,
    result: validateBuildingTopology(document),
  };
}
