import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const ignoredDirectories = new Set([".git", "node_modules", "dist", ".wrangler", "coverage"]);
const failures = [];

const requiredPaths = [
  "AGENTS.md",
  ".env.example",
  "apps/web/package.json",
  "apps/api/src/index.ts",
  "apps/discord-bot/src/index.ts",
  "services/automation-runner/src/index.ts",
  "packages/contracts/src/index.ts",
  "packages/workflows/src/index.ts",
  "packages/agent-catalog/src/index.ts",
  "packages/attribution/src/index.ts",
  "packages/database/migrations/0001_initial.sql",
  "config/agents.json",
  "config/attribution.json",
  "docs/ARCHITECTURE.md",
  "docs/SECURITY.md",
];

for (const path of requiredPaths) {
  if (!existsSync(join(root, path))) failures.push(`Missing required path: ${path}`);
}

function walk(directory) {
  const entries = [];
  for (const name of readdirSync(directory)) {
    if (ignoredDirectories.has(name)) continue;
    const absolute = join(directory, name);
    const stats = statSync(absolute);
    if (stats.isDirectory()) entries.push(...walk(absolute));
    else entries.push(absolute);
  }
  return entries;
}

const files = walk(root);
const secretNamePattern = /(^|[\\/])(?:\.env(?:\..+)?|cookies?(?:\..+)?|credentials?(?:\..+)?|session-archive(?:\..+)?|.*\.pem|.*\.key)$/i;

for (const file of files) {
  const projectPath = relative(root, file).replaceAll("\\", "/");
  if (projectPath === ".env.example") continue;
  if (secretNamePattern.test(projectPath)) failures.push(`Potential secret file must not be committed: ${projectPath}`);
  if (basename(file).startsWith("Screenshot ") && !projectPath.startsWith("assets/references/")) {
    failures.push(`Unorganized screenshot outside assets/references: ${projectPath}`);
  }
  if (file.endsWith(".json")) {
    try {
      JSON.parse(readFileSync(file, "utf8"));
    } catch (error) {
      failures.push(`Invalid JSON: ${projectPath} (${error.message})`);
    }
  }
}

const agents = JSON.parse(readFileSync(join(root, "config/agents.json"), "utf8")).agents;
if (agents.length !== 10) failures.push(`Expected 10 pilot agents, found ${agents.length}`);
if (new Set(agents.map((agent) => agent.id)).size !== agents.length) failures.push("Agent IDs must be unique");

const attribution = JSON.parse(readFileSync(join(root, "config/attribution.json"), "utf8"));
if (attribution.dimensions.length !== 5) failures.push("Attribution must define exactly five Sub ID dimensions");

const officeMap = JSON.parse(readFileSync(join(root, "assets/game/maps/office-c-v1.json"), "utf8"));
const characterRegistry = JSON.parse(readFileSync(join(root, "assets/game/characters/registry.json"), "utf8"));
const agentIds = new Set(agents.map((agent) => agent.id));
const officeAssetIds = new Set(
  ["core-furniture-sheet.json", "decor-mechanical-sheet.json", "equipment-sheet.json", "office-utility-sheet.json"]
    .flatMap((manifest) => JSON.parse(readFileSync(join(root, "assets/game/manifests", manifest), "utf8")).cells)
    .map((cell) => cell.id),
);
if (officeMap.workstations.length !== agents.length) failures.push("Office map must provide one workstation per pilot agent");
if (Object.keys(characterRegistry.agents).length !== agents.length) failures.push("Character registry must provide one character per pilot agent");
if (!Array.isArray(officeMap.objects) || officeMap.objects.length < 20) failures.push("Office map must provide a populated objects layer");
const officeObjectIds = new Set();
const officeParentIds = new Set([
  ...officeMap.workstations.map((station) => station.id),
  ...(officeMap.objects ?? []).filter((object) => Number.isFinite(object.x) && Number.isFinite(object.y)).map((object) => object.id),
]);
const officeAttachmentSlots = new Set([
  "desk-rear-center", "desk-rear-left", "desk-rear-right",
  "desk-front-center", "desk-front-left", "desk-front-right",
  "table-left", "table-right", "counter-left", "counter-right",
]);
for (const object of officeMap.objects ?? []) {
  if (officeObjectIds.has(object.id)) failures.push(`Duplicate office object ID: ${object.id}`);
  officeObjectIds.add(object.id);
  if (!officeAssetIds.has(object.asset)) failures.push(`Unknown office object asset: ${object.asset}`);
  if (!["wall", "furniture", "equipment", "decor"].includes(object.layer)) failures.push(`Invalid office object layer: ${object.id}`);
  if (!["center", "bottom-center", "wall-top", "wall-right"].includes(object.anchor)) failures.push(`Invalid office object anchor: ${object.id}`);
  const hasPosition = Number.isFinite(object.x) && Number.isFinite(object.y);
  const hasAttachment = typeof object.parentId === "string" && typeof object.slot === "string";
  if (hasPosition === hasAttachment) failures.push(`Office object must use either coordinates or an attachment: ${object.id}`);
  if (hasAttachment && !officeParentIds.has(object.parentId)) failures.push(`Unknown office object parent: ${object.id}`);
  if (hasAttachment && !officeAttachmentSlots.has(object.slot)) failures.push(`Unknown office object slot: ${object.id}`);
  if (hasPosition && (object.x < 0 || object.x > officeMap.width || object.y < 0 || object.y > officeMap.height)) {
    failures.push(`Office object outside map bounds: ${object.id}`);
  }
  if (object.anchor === "wall-top" && (!hasPosition || object.y > 2.4)) failures.push(`Top-wall object is not attached to the wall: ${object.id}`);
  if (object.anchor === "wall-right" && (!hasPosition || object.x < officeMap.width - 1.5)) failures.push(`Right-wall object is not attached to the wall: ${object.id}`);
}
for (const station of officeMap.workstations) {
  if (!agentIds.has(station.id)) failures.push(`Unknown office workstation agent: ${station.id}`);
  if (!characterRegistry.agents[station.id]) failures.push(`Missing runtime character mapping: ${station.id}`);
  if (!officeAssetIds.has(station.desk)) failures.push(`Unknown workstation desk asset: ${station.desk}`);
  for (const anchorName of ["seat", "stand"]) {
    const point = station[anchorName];
    if (!point || point.x < 0 || point.x > officeMap.width || point.y < 0 || point.y > officeMap.height) {
      failures.push(`Invalid ${anchorName} anchor for ${station.id}`);
      continue;
    }
    const hitbox = station.collision;
    const collides = point.x >= hitbox.x
      && point.x <= hitbox.x + hitbox.width
      && point.y >= hitbox.y
      && point.y <= hitbox.y + hitbox.height;
    if (collides) failures.push(`${station.id} ${anchorName} anchor intersects its desk collision`);
  }
}
if (!Array.isArray(officeMap.routes) || officeMap.routes.length < 8) {
  failures.push("Office map must protect its primary walking routes");
} else {
  const routeContains = (point) => officeMap.routes.some((route) => (
    point.x >= route.x
    && point.x <= route.x + route.width
    && point.y >= route.y
    && point.y <= route.y + route.height
  ));
  const navigationNodes = new Map((officeMap.navigation?.nodes ?? []).map((node) => [node.id, node]));
  for (const object of (officeMap.objects ?? []).filter((item) => item.layer !== "wall" && Number.isFinite(item.x) && Number.isFinite(item.y))) {
    if (routeContains(object)) failures.push(`Office object center blocks a protected route: ${object.id}`);
  }
  for (const [fromId, toId] of officeMap.navigation?.edges ?? []) {
    const from = navigationNodes.get(fromId);
    const to = navigationNodes.get(toId);
    if (!from || !to) {
      failures.push(`Office navigation edge references an unknown node: ${fromId} -> ${toId}`);
      continue;
    }
    if (from.x !== to.x && from.y !== to.y) {
      failures.push(`Office navigation edge must be axis-aligned: ${fromId} -> ${toId}`);
      continue;
    }
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(length * 4));
    for (let step = 0; step <= steps; step += 1) {
      const ratio = step / steps;
      const sample = { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio };
      if (!routeContains(sample)) {
        failures.push(`Office navigation leaves protected routes: ${fromId} -> ${toId}`);
        break;
      }
    }
  }
}
for (const [agentId, slug] of Object.entries(characterRegistry.agents)) {
  const sheetPath = join(root, "assets/game/characters", slug, "spritesheet.webp");
  if (!existsSync(sheetPath)) failures.push(`Missing spritesheet for ${agentId}: ${slug}`);
}

const validationReports = files.filter((file) => file.endsWith(".report.json"));
let validatedAssets = 0;
for (const file of validationReports) {
  const report = JSON.parse(readFileSync(file, "utf8"));
  validatedAssets += report.summary?.total ?? 0;
  if ((report.summary?.failed ?? 0) > 0) failures.push(`Asset validation failure: ${relative(root, file)}`);
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Repository structure OK: ${files.length} files, ${agents.length} agents, ${validatedAssets} validated assets.`);
}
