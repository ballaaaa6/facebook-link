const commonV2Id = "https://affiliate-operations.example/schemas/office-v2/common-v2.schema.json";
const safeIntegerLimit = 9007199254740991;

const coordinateDefinitions = new Set([
  "cellPosition",
  "subCellPosition",
  "floorLocalCellPosition",
  "floorLocalSubCellPosition",
  "definitionLocalGeometryPosition",
  "definitionLocalPixelPosition",
  "spritePixelPosition",
  "screenPixelPosition",
]);

const expectedSpaces = new Map([
  ["cellPosition", "cell"],
  ["subCellPosition", "sub-cell"],
  ["floorLocalCellPosition", "floor-local-cell"],
  ["floorLocalSubCellPosition", "floor-local-sub-cell"],
  ["definitionLocalGeometryPosition", "definition-local-geometry"],
  ["definitionLocalPixelPosition", "definition-local-pixel"],
  ["spritePixelPosition", "sprite-pixel"],
  ["screenPixelPosition", "screen-pixel"],
]);

const expectedKinds = new Map([
  ["buildingReference", "building"],
  ["floorReference", "floor"],
  ["roomReference", "room"],
  ["entityDefinitionReference", "entity-definition"],
  ["entityInstanceReference", "entity-instance"],
  ["facilityReference", "facility"],
  ["socketReference", "socket"],
]);

function diagnostic(code, message, context = {}) {
  return { code, owner: "contract", version: 1, message, context };
}

function schemaValidator(ajv, definition) {
  return ajv.getSchema(`${commonV2Id}#/$defs/${definition}`);
}

function hasIntegerError(errors) {
  return errors.some(({ keyword, instancePath }) => (
    keyword === "type" && /(?:\/x|\/y|\/xPx|\/yPx|\/elevation|\/version|\/value)$/.test(instancePath)
  ));
}

function hasRangeError(errors) {
  return errors.some(({ keyword }) => keyword === "minimum" || keyword === "maximum");
}

function classifySchemaFailure(entry, errors) {
  if (entry.semantic === "generic-position") {
    return diagnostic(
      "contract.generic-position-forbidden",
      "A V2 boundary cannot introduce an unqualified position field.",
      { properties: Object.keys(entry.value ?? {}) },
    );
  }
  if (entry.semantic === "duplicate-identity") {
    const values = entry.values ?? [];
    const seen = new Set();
    const duplicate = values.find((value) => {
      const key = `${value.kind}:${value.value}`;
      if (seen.has(key)) return true;
      seen.add(key);
      return false;
    });
    return diagnostic(
      "contract.identifier-duplicate",
      "A typed identity namespace contains a duplicate key.",
      { duplicate: duplicate ? `${duplicate.kind}:${duplicate.value}` : null },
    );
  }
  if (coordinateDefinitions.has(entry.definition)) {
    const expectedSpace = expectedSpaces.get(entry.definition);
    if (entry.value?.space !== expectedSpace) {
      return diagnostic(
        "contract.coordinate-space-mismatch",
        "A coordinate value uses the wrong serialized space discriminator.",
        { expectedSpace, actualSpace: entry.value?.space ?? null },
      );
    }
    if (hasIntegerError(errors)) {
      return diagnostic(
        "contract.coordinate-integrality",
        "A coordinate value must use an allowed integer.",
        { definition: entry.definition },
      );
    }
    if (hasRangeError(errors)) {
      return diagnostic(
        "contract.coordinate-range",
        "A coordinate value is outside the safe contract range.",
        { definition: entry.definition },
      );
    }
  }
  if (expectedKinds.has(entry.definition)) {
    const expectedKind = expectedKinds.get(entry.definition);
    if (entry.value?.id?.kind !== expectedKind) {
      return diagnostic(
        "contract.identifier-namespace-mismatch",
        "A versioned reference uses an ID from the wrong namespace.",
        { expectedKind, actualKind: entry.value?.id?.kind ?? null },
      );
    }
    if (!Object.hasOwn(entry.value ?? {}, "version")) {
      return diagnostic(
        "contract.reference-version-missing",
        "A mutation-sensitive reference must include a positive version.",
        { definition: entry.definition },
      );
    }
    if (entry.value?.version === "latest") {
      return diagnostic(
        "contract.reference-latest-forbidden",
        "A versioned reference cannot use the latest alias.",
        { definition: entry.definition },
      );
    }
    if (hasIntegerError(errors) || hasRangeError(errors)) {
      return diagnostic(
        "contract.reference-version-missing",
        "A versioned reference must include a positive integer version.",
        { definition: entry.definition },
      );
    }
  }
  if (entry.definition === "worldFacing" || entry.definition === "screenFacing") {
    return diagnostic(
      "contract.facing-invalid",
      "A facing value is not in the accepted vocabulary.",
      { definition: entry.definition, value: entry.value ?? null },
    );
  }
  return diagnostic(
    "contract.schema-invalid",
    "A common V2 contract value failed schema validation.",
    { definition: entry.definition, schemaErrors: errors.map(({ instancePath, keyword }) => ({ instancePath, keyword })) },
  );
}

export function evaluateCommonV2Case(ajv, entry) {
  if (entry.semantic === "generic-position" || entry.semantic === "duplicate-identity") {
    const actual = classifySchemaFailure(entry, []);
    return { valid: false, diagnostic: actual };
  }

  const validate = schemaValidator(ajv, entry.definition);
  if (!validate) {
    return {
      valid: false,
      diagnostic: diagnostic(
        "contract.schema-invalid",
        "The common V2 definition is not registered.",
        { definition: entry.definition },
      ),
    };
  }
  const value = entry.values ?? entry.value;
  const valid = validate(value);
  const errors = structuredClone(validate.errors ?? []);
  return {
    valid,
    diagnostic: valid ? null : classifySchemaFailure(entry, errors),
    errors,
  };
}

export function commonV2SchemaId() {
  return commonV2Id;
}

export function safeIntegerLimitValue() {
  return safeIntegerLimit;
}
