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

function formatScale(scale) {
  return `${scale.width} x ${scale.depth} x ${scale.height}`;
}

function formatFootprint(asset) {
  return asset.footprint
    ? `${asset.footprint.width} x ${asset.footprint.depth}`
    : `parent support (${asset.supports.join(", ")})`;
}

function createPrompt(id, asset, orientations) {
  const views = orientations.length > 0
    ? orientations
    : asset.requiredOrientations ?? ["front"];
  return `Create one original modern-bright orthographic pixel-art ${id}.
Use the Office Scale Bible adult reference of 1 wide x 1 deep x 3 high.
Locked physical scale: ${formatScale(asset.physicalScale)} tiles.
Target render box: ${asset.renderBox.width} x ${asset.renderBox.height} tiles.
Floor footprint: ${formatFootprint(asset)}.
Support: ${asset.supports.join(", ")}. Anchor: ${asset.anchor}.
Create ONLY these required orientations: ${views.join(", ")}.
Use exactly one equal cell per orientation. Preserve one design, physical scale,
silhouette, anchor, material, outline, and upper-left lighting across all views.
Use lighter graphite, pale slate, brushed metal, warm white, and controlled
cyan, teal, lime, amber, or coral accents.
Place one isolated object per cell on a perfectly flat #FF00FF chroma-key
background. Leave generous empty padding. Do not enlarge or distort the object
to fill the cell. No people, room, floor, text, logo, watermark, cast shadow,
perspective convergence, or isometric camera.`;
}

const args = process.argv.slice(2);
if (args.includes("--check")) {
  const failures = Object.entries(catalog).flatMap(([id, asset]) => validateAsset(id, asset));
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
  if (!id || !catalog[id]) {
    process.stderr.write(
      `Usage: npm run art:prompt -- <asset-id> [--orientations=front,back,side]\n`
      + `Use --list to show asset IDs or --check to validate both catalogs.\n`,
    );
    process.exitCode = 1;
  } else {
    const orientationArg = args.find((arg) => arg.startsWith("--orientations="));
    const orientations = orientationArg
      ? orientationArg.slice("--orientations=".length).split(",").filter(Boolean)
      : [];
    process.stdout.write(`${createPrompt(id, catalog[id], orientations)}\n`);
  }
}
