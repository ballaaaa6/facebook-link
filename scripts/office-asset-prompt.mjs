import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const currentManifest = JSON.parse(
  readFileSync(join(root, "assets/game/manifests/office-assets.json"), "utf8"),
);
const plannedManifest = JSON.parse(
  readFileSync(join(root, "assets/game/manifests/office-planned-assets.json"), "utf8"),
);
const biblePath = join(root, "assets/game/manifests/office-camera-scale-bible.json");
let bible;
let bibleLoadFailure;
try {
  bible = JSON.parse(readFileSync(biblePath, "utf8"));
} catch (error) {
  bibleLoadFailure = `Camera/Scale Bible unavailable: ${error.message}`;
}
const catalog = {
  ...Object.fromEntries(
    Object.entries(currentManifest.assets).map(([id, asset]) => [id, {
      ...asset,
      requiredOrientations: ["front"],
      status: "runtime",
    }]),
  ),
  ...Object.fromEntries(
    Object.entries(plannedManifest.assets).map(([id, asset]) => [id, {
      ...asset,
      status: "planned",
    }]),
  ),
};

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function validateAsset(id, asset) {
  const failures = [];
  const positiveFields = [
    ["physicalScale.width", asset.physicalScale?.width],
    ["physicalScale.height", asset.physicalScale?.height],
    ["renderBox.width", asset.renderBox?.width],
    ["renderBox.height", asset.renderBox?.height],
  ];
  for (const [field, value] of positiveFields) {
    if (!Number.isInteger(value) || value < 1) failures.push(`${id}: ${field}`);
  }
  if (!isNonNegativeInteger(asset.physicalScale?.depth)) {
    failures.push(`${id}: physicalScale.depth`);
  }
  for (const [field, value] of [
    ["footprint.width", asset.footprint?.width],
    ["footprint.depth", asset.footprint?.depth],
    ["approachDepth", asset.approachDepth],
  ]) {
    if (value !== undefined && (!Number.isInteger(value) || value < 1)) {
      failures.push(`${id}: ${field}`);
    }
  }
  if (!Array.isArray(asset.supports) || asset.supports.length === 0) {
    failures.push(`${id}: supports`);
  }
  return failures;
}

function validateBible() {
  if (bibleLoadFailure) return [bibleLoadFailure];
  const failures = [];
  if (!["blueprint-review", "accepted"].includes(bible.status)) {
    failures.push("Camera/Scale Bible status must equal blueprint-review or accepted");
  }
  if (bible.workstationRuleVersion !== 2) failures.push("Camera/Scale Bible must target Workstation Rule v2");
  if (bible.geometrySchemaVersion !== 3) failures.push("Camera/Scale Bible must target Geometry v3");
  if (bible.authoring?.tilePixels !== 32) failures.push("Camera/Scale Bible tilePixels must equal 32");
  if (bible.camera?.perspectiveConvergence !== false) {
    failures.push("Camera/Scale Bible must disable perspective convergence");
  }
  const adult = bible.characters?.standingAdult?.physicalScale;
  if (adult?.width !== 1 || adult?.depth !== 1 || adult?.height !== 3) {
    failures.push("Camera/Scale Bible standing adult must equal 1 x 1 x 3");
  }
  const desk = bible.canonicalDesk;
  if (desk?.physicalScale?.width !== 3 || desk?.physicalScale?.depth !== 2
      || desk?.physicalScale?.height !== 2.4 || desk?.footprint?.width !== 3
      || desk?.footprint?.depth !== 2 || desk?.supportPlane?.width !== 3
      || desk?.supportPlane?.depth !== 2 || desk?.employeeEdge !== null) {
    failures.push("Camera/Scale Bible desk must equal 3 x 2 x 2.4 with one complete 3 x 2 support plane and no employee-edge row");
  }
  return failures;
}

function workstationGenerationGate(id, asset) {
  if (asset.slotSet !== "workstation") return [];
  return [
    `${id}: legacy catalog workstation prompts remain blocked; Step 4 creates only desk.workstation.modern.v2 from its versioned source workflow`,
  ];
}

function generationAsset(asset) {
  if (asset.slotSet !== "workstation") return asset;
  return {
    ...asset,
    physicalScale: bible.canonicalDesk.physicalScale,
    footprint: bible.canonicalDesk.footprint,
    renderBox: bible.canonicalDesk.generationRenderBox,
    requiredOrientations: bible.canonicalDesk.requiredOrientations,
    geometryGenerationRule: bible.canonicalDesk.generationRule,
  };
}

function formatScale(scale) {
  return `${scale.width} x ${scale.depth} x ${scale.height}`;
}

function formatFootprint(asset) {
  return asset.footprint
    ? `${asset.footprint.width} x ${asset.footprint.depth}`
    : `parent support (${asset.supports.join(", ")})`;
}

function createPrompt(id, asset, orientations) {
  const generation = generationAsset(asset);
  const views = orientations.length > 0
    ? orientations
    : generation.requiredOrientations ?? ["front"];
  const adult = bible.characters.standingAdult.physicalScale;
  const deskRule = generation.geometryGenerationRule
    ? `\nWorkstation composite rule: ${generation.geometryGenerationRule}`
    : "";
  return `Create one original modern-bright orthographic pixel-art ${id}.
Use the accepted Camera/Scale Bible: ${bible.authoring.tilePixels} authoring pixels per tile,
${bible.camera.spriteProjection}, ${bible.authoring.lightDirection} lighting,
and ${bible.authoring.outlinePixels}-pixel authoring outlines.
Standing adult reference: ${formatScale(adult)} tiles.
Locked physical scale: ${formatScale(generation.physicalScale)} tiles.
Target render box: ${generation.renderBox.width} x ${generation.renderBox.height} tiles.
Floor footprint: ${formatFootprint(generation)}.
Support: ${generation.supports.join(", ")}. Anchor: ${generation.anchor}.${deskRule}
Create ONLY these required orientations: ${views.join(", ")}.
Use exactly one equal cell per orientation. Preserve one design, physical scale,
silhouette, anchor, material, outline, and upper-left lighting across all views.
Use lighter graphite, pale slate, brushed metal, warm white, and controlled
cyan, teal, lime, amber, or coral accents.
All views are straight orthographic: front/back face the camera directly and
left/right are exact 90-degree turns. Never use an oblique, diagonal,
three-quarter, tilted, or perspective view.
If the asset has a screen or display, use a bright high-value content palette
of warm white, pale sky, cyan, mint, teal, lime, amber, coral, or lavender;
never use a mostly black, navy, or dark-blue display background.
Place one isolated object per cell on a perfectly flat #FF00FF chroma-key
background. Leave generous empty padding. Do not enlarge or distort the object
to fill the cell. No people, room, floor, text, logo, watermark, cast shadow,
perspective convergence, or isometric camera.`;
}

const args = process.argv.slice(2);
if (args.includes("--check")) {
  const failures = [
    ...validateBible(),
    ...Object.entries(catalog).flatMap(([id, asset]) => validateAsset(id, asset)),
  ];
  if (failures.length > 0) {
    process.stderr.write(`${failures.join("\n")}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(
      `Office prompt catalogs OK: ${Object.keys(currentManifest.assets).length} runtime, `
      + `${Object.keys(plannedManifest.assets).length} planned.\n`,
    );
  }
} else if (args.includes("--list")) {
  process.stdout.write(`${Object.keys(catalog).sort().join("\n")}\n`);
} else {
  const id = args.find((arg) => !arg.startsWith("--"));
  const bibleFailures = validateBible();
  if (bibleFailures.length > 0) {
    process.stderr.write(`${bibleFailures.join("\n")}\n`);
    process.exitCode = 1;
  } else if (!id || !catalog[id]) {
    process.stderr.write(
      `Usage: npm run art:prompt -- <asset-id> [--orientations=front,back,side]\n`
      + `Use --list to show asset IDs or --check to validate both catalogs.\n`,
    );
    process.exitCode = 1;
  } else {
    const gateFailures = workstationGenerationGate(id, catalog[id]);
    if (gateFailures.length > 0) {
      process.stderr.write(`${gateFailures.join("\n")}\n`);
      process.exitCode = 1;
      process.exit();
    }
    const orientationArg = args.find((arg) => arg.startsWith("--orientations="));
    const orientations = orientationArg
      ? orientationArg.slice("--orientations=".length).split(",").filter(Boolean)
      : [];
    process.stdout.write(`${createPrompt(id, catalog[id], orientations)}\n`);
  }
}
