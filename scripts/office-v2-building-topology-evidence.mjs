import {
  createOfficeSchemaValidator,
  defaultKnowledgeRoot,
} from "./office-v2-knowledge-check-core.mjs";
import {
  applyBuildingTopologyMutation,
  evaluateBuildingTopologyFixture as evaluateBuildingTopologySemantics,
} from "./office-v2-building-topology-adapter.mjs";

const buildingSchemaId = "https://affiliate-operations.example/schemas/office-v2/building.schema.json";

export function evaluateBuildingTopologyFixture({
  knowledgeRoot = defaultKnowledgeRoot,
  fixturePath,
}) {
  const evaluation = evaluateBuildingTopologySemantics({ knowledgeRoot, fixturePath });
  const ajv = createOfficeSchemaValidator({ knowledgeRoot });
  const validate = ajv.getSchema(buildingSchemaId);
  if (!validate) throw new Error("building.schema.json was not registered");
  const schemaValid = Boolean(validate(evaluation.document));
  return {
    ...evaluation,
    schemaValid,
    schemaErrors: structuredClone(validate.errors ?? []),
  };
}

export { applyBuildingTopologyMutation };
