const supportedWorkstationMasks = new Set([0, 2, 8, 10]);

export function assetDiagnostic(code, message, context = {}) {
  return { code, owner: code.startsWith("world.") ? "world" : code.startsWith("connectivity.") ? "connectivity" : "asset", version: 1, message, context };
}

function validOrDiagnostic(condition, code, message, context) {
  return condition ? null : assetDiagnostic(code, message, context);
}

function documentByName(fixture, name) {
  return fixture.documents?.find((entry) => entry.name === name)?.document ?? null;
}

function refKey(reference) {
  if (!reference || typeof reference !== "object") return null;
  const id = reference.id;
  if (typeof id === "string") return `${id}@${reference.version}`;
  if (id && typeof id === "object") return `${id.kind}:${id.value}@${reference.version}`;
  return null;
}

function duplicateValues(values) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) return value;
    seen.add(value);
  }
  return null;
}

function evaluateStyleProfile(profile) {
  if (!profile) return assetDiagnostic("asset.style-scale-invalid", "A style profile is missing.");
  const worldScale = profile.worldScale ?? {};
  const scaleInvalid = profile.nativePixelDensity < 1
    || worldScale.cellWidthPx !== 64
    || worldScale.cellHeightPx !== 32
    || worldScale.elevationHeightPx !== 16
    || Object.values(profile.surfaceScale ?? {}).some((scale) => (
      !scale || scale.widthPx < 1 || scale.depthPx < 1 || scale.heightPx < 1
    ));
  if (scaleInvalid) return assetDiagnostic("asset.style-scale-invalid", "The style profile contains an invalid native or world scale.", { profileId: profile.profileId ?? null });

  const roles = profile.palette?.roles ?? [];
  const duplicateRole = duplicateValues(roles.map(({ role }) => role));
  const paletteInvalid = roles.length === 0 || duplicateRole || roles.some(({ colors = [] }) => (
    colors.length === 0 || colors.some((color) => !/^#[0-9a-f]{6}$/u.test(color))
  ));
  if (paletteInvalid) return assetDiagnostic("asset.style-palette-invalid", "Palette roles or colors are invalid.", { duplicateRole: duplicateRole ?? null });

  for (const canvas of profile.canvasClasses ?? []) {
    const padding = canvas.padding ?? {};
    if ([padding.leftPx, padding.rightPx, padding.topPx, padding.bottomPx].some((value) => !Number.isInteger(value) || value < 0)) {
      return assetDiagnostic("asset.style-padding-invalid", "Canvas transparent padding is invalid.", { canvasId: canvas.id });
    }
  }

  const light = profile.lighting ?? {};
  if (light.vectorX === 0 && light.vectorY === 0 && light.vectorZ === 0) {
    return assetDiagnostic("asset.style-light-invalid", "The light vector cannot be zero.");
  }

  const zoomStops = profile.zoomStops ?? [];
  const zoomScales = zoomStops.map(({ scale }) => scale);
  if (zoomScales.some((scale) => !Number.isFinite(scale) || scale <= 0) || zoomScales.some((scale, index) => index > 0 && scale <= zoomScales[index - 1])) {
    return assetDiagnostic("asset.style-zoom-invalid", "Zoom stops must be positive and strictly increasing.", { zoomScales });
  }

  for (const band of profile.detailDensityBands ?? []) {
    if (band.minPx > band.maxPx) return assetDiagnostic("asset.style-scale-invalid", "Detail-density bands must have increasing bounds.", { bandId: band.id });
  }
  return null;
}

function evaluateRenderPartGraph(data) {
  const parts = data?.parts ?? (data ? [data] : []);
  const parent = new Map();
  const siblingOrders = new Map();
  for (const part of parts) {
    if (!part?.id) continue;
    const parentId = part.parent ?? null;
    parent.set(part.id, parentId);
    if (parentId !== null) {
      const orders = siblingOrders.get(parentId) ?? new Set();
      if (orders.has(part.siblingOrder)) return assetDiagnostic("asset.render-part-sibling-order", "Render-part siblings need a unique stable order.", { parentId, siblingOrder: part.siblingOrder });
      orders.add(part.siblingOrder);
      siblingOrders.set(parentId, orders);
    }
  }
  for (const start of parent.keys()) {
    const path = new Set();
    let current = start;
    while (current) {
      if (path.has(current)) return assetDiagnostic("world.render-attachment-cycle", "Render-part attachment graph is cyclic.", { start, cycleAt: current });
      path.add(current);
      current = parent.get(current) ?? null;
    }
  }
  return null;
}

function evaluateReferenceClosure(fixture) {
  const documents = new Map((fixture.documents ?? []).map((entry) => [entry.name, entry.document]));
  const family = documents.get("assetFamily");
  const atlas = documents.get("atlas");
  const catalog = documents.get("assetCatalog");
  const bundle = documents.get("sceneBundle");
  const recipe = documents.get("exportRecipe");
  const review = documents.get("assetReview");
  const migration = documents.get("assetMigration");
  const sourceSet = documents.get("sourceSet");
  if (!family || !atlas || !catalog || !bundle || !recipe || !review || !migration || !sourceSet) {
    return assetDiagnostic("asset.orphan-reference", "Asset pipeline closure is missing a required document.");
  }
  if (refKey(family.sourceSetRef) !== `${sourceSet.sourceSetId}@${sourceSet.sourceSetVersion}`) return assetDiagnostic("asset.orphan-reference", "Asset family source-set reference is not closed.");
  if (refKey(family.exportRecipeRef) !== `${recipe.recipeId}@${recipe.recipeVersion}`) return assetDiagnostic("asset.export-recipe-missing", "Asset family export recipe reference is not closed.");
  if (refKey(family.reviewRef) !== `${review.reviewId}@${review.reviewVersion}`) return assetDiagnostic("asset.orphan-reference", "Asset family review reference is not closed.");
  if (catalog.atlasRefs.every((reference) => refKey(reference) !== `${atlas.atlasId}@${atlas.atlasVersion}`)) return assetDiagnostic("asset.atlas-reference-missing", "Catalog does not reference the declared atlas.");
  const atlasEntries = new Set(atlas.entries.map(({ entryId }) => entryId));
  for (const entry of catalog.entries) {
    if (!atlasEntries.has(entry.entryId)) return assetDiagnostic("asset.atlas-reference-missing", "Catalog entry is absent from the atlas.", { entryId: entry.entryId });
    if (entry.admission === "runtime-approved" && sourceSet.sources.some(({ commercialStatus }) => commercialStatus !== "approved")) return assetDiagnostic("asset.commercial-review", "Runtime admission requires commercial approval.", { entryId: entry.entryId });
  }
  for (const reference of bundle.assetRefs) {
    if (!catalog.entries.some(({ entryId }) => entryId === reference.catalogEntryId)) return assetDiagnostic("asset.bundle-reference-missing", "Scene bundle references an absent catalog entry.", { catalogEntryId: reference.catalogEntryId });
  }
  if (bundle.missingAssetPolicy !== "fail-closed" || catalog.missingAssetPolicy !== "fail-closed") return assetDiagnostic("asset.bundle-reference-missing", "Catalog and bundle must fail closed on missing assets.");
  if (migration.toFamilyRef.version <= migration.fromFamilyRef.version || migration.mapping.length === 0) return assetDiagnostic("asset.migration-failed", "Migration must target a later version with explicit mappings.");
  return null;
}

function evaluateSemanticVariant(data) {
  if (!data) return assetDiagnostic("asset.semantic-variant-unsupported", "Semantic variant is missing.");
  const key = `${data.operationalState}:${data.semanticAnimationState}:${data.facilityState}:${data.connectivityMask}`;
  const supported = data.supported ?? ["working:typing:occupied:0"];
  if (!supported.includes(key) && data.fallback !== "approved-static-same-family") return assetDiagnostic("asset.semantic-variant-unsupported", "No compatible semantic variant or approved fallback exists.", { key });
  if (!supportedWorkstationMasks.has(data.connectivityMask)) return assetDiagnostic("connectivity.unsupported-mask", "The semantic variant requests an unsupported workstation mask.", { mask: data.connectivityMask });
  return null;
}

export function evaluateAssetPipelineCase(entry, fixture) {
  const data = entry.data ?? documentByName(fixture, entry.documentName);
  switch (entry.check) {
    case "style-profile": return evaluateStyleProfile(data);
    case "style-light": return evaluateStyleProfile({ nativePixelDensity: 1, worldScale: { cellWidthPx: 64, cellHeightPx: 32, elevationHeightPx: 16 }, surfaceScale: {}, palette: { roles: [{ role: "outline", colors: ["#000000"] }] }, canvasClasses: [], lighting: data, zoomStops: [{ scale: 1 }] });
    case "style-shadow": return validOrDiagnostic(Number.isInteger(data?.opacitySteps) && data.opacitySteps >= 0 && data.opacitySteps <= 16 && (data.vectorX !== 0 || data.vectorY !== 0), "asset.style-shadow-invalid", "Shadow policy is outside the style profile bounds.");
    case "style-zoom": return evaluateStyleProfile({ nativePixelDensity: 1, worldScale: { cellWidthPx: 64, cellHeightPx: 32, elevationHeightPx: 16 }, surfaceScale: {}, palette: { roles: [{ role: "outline", colors: ["#000000"] }] }, canvasClasses: [], lighting: { vectorX: -1, vectorY: -1, vectorZ: 1 }, zoomStops: data.zoomStops });
    case "render-part-graph": return evaluateRenderPartGraph(data);
    case "reference-closure": return evaluateReferenceClosure(fixture);
    case "semantic-variant": return evaluateSemanticVariant(data);
    case "export-recipe": return validOrDiagnostic(data?.determinism?.twoCleanBuilds === "required" && data?.determinism?.byteEquality === "required" && data?.overwritePolicy === "fail", "asset.export-recipe-missing", "Export recipe does not pin deterministic clean-build behavior.");
    case "source-hash": return validOrDiagnostic(data?.declared === data?.actual, "asset.source-hash-mismatch", "Immutable source hash does not match the declared digest.");
    case "commercial-review": return validOrDiagnostic(data?.admission !== "runtime-approved" || data?.commercialStatus === "approved", "asset.commercial-review", "Runtime admission requires approved commercial status.");
    case "orphan": return assetDiagnostic("asset.orphan-reference", "Asset pipeline record is orphaned.", { orphanKind: data?.orphanKind ?? null });
    case "geometry-reference": return validOrDiagnostic(refKey(data?.declared) === refKey(data?.authoritative), "world.reference-version-mismatch", "Asset geometry reference does not match the authoritative version.");
    case "connectivity-table": {
      const missing = (data?.supportedMasks ?? []).filter((mask) => !(data?.variants ?? []).includes(mask));
      return missing.length ? assetDiagnostic("connectivity.missing-variant", "A supported connectivity mask has no variant.", { missingMasks: missing }) : null;
    }
    case "connectivity-mask": return validOrDiagnostic(supportedWorkstationMasks.has(data?.requestedMask), "connectivity.unsupported-mask", "The requested connectivity mask is not supported by the proof family.", { requestedMask: data?.requestedMask ?? null });
    case "bundle-reference": return validOrDiagnostic((data?.catalogEntries ?? []).includes(data?.catalogEntryId), "asset.bundle-reference-missing", "Scene bundle references an absent catalog entry.", { catalogEntryId: data?.catalogEntryId ?? null });
    case "migration": return validOrDiagnostic((data?.mapping ?? []).length > 0 && (data?.requiredContext ?? []).every((item) => (data?.suppliedContext ?? []).includes(item)), "asset.migration-failed", "Asset migration lacks required context or mapping.");
    default: return assetDiagnostic("knowledge.asset-case-unknown", "Asset pipeline fixture case has no semantic runner.", { check: entry.check ?? null });
  }
}

export function schemaDiagnostic(code, fixture, caseName) {
  return assetDiagnostic(code, "Asset schema rejection was classified by its owning contract.", { fixture, caseName });
}
