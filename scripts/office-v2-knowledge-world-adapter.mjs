import { validateDefinitionBundle } from "@affiliate-ops/office-v2-world";

export function evaluateDefinitionBundleMutation(context, fixture) {
  const base = context.readJson(fixture.baseFixture);
  if (!base) return null;
  const document = structuredClone(base);
  if (fixture.mutation === "remove-references.assetFamilyRefs[0]") {
    document.references.assetFamilyRefs.splice(0, 1);
  } else {
    throw new Error(`Unsupported definition-bundle mutation: ${fixture.mutation}`);
  }
  return validateDefinitionBundle(document);
}
