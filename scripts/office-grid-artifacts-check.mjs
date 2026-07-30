import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function add(condition, message) {
  if (!condition) failures.push(message);
}

function projectPath(repoPath) {
  const absolute = resolve(root, repoPath);
  add(absolute === root || absolute.startsWith(`${root}${sep}`), `Path leaves repository: ${repoPath}`);
  return absolute;
}

function readJson(repoPath) {
  try {
    return JSON.parse(readFileSync(projectPath(repoPath), "utf8"));
  } catch (error) {
    failures.push(`Cannot read JSON ${repoPath}: ${error.message}`);
    return {};
  }
}

function sha256(repoPath) {
  return createHash("sha256").update(readFileSync(projectPath(repoPath))).digest("hex");
}

function checkRecord(record, label, requirePng = false) {
  add(typeof record?.file === "string", `${label}.file is missing`);
  add(typeof record?.sha256 === "string", `${label}.sha256 is missing`);
  if (typeof record?.file !== "string") return;
  const absolute = projectPath(record.file);
  add(existsSync(absolute), `Missing ${label}: ${record.file}`);
  if (!existsSync(absolute)) return;
  add(sha256(record.file) === record.sha256, `${label} hash changed: ${record.file}`);
  if (requirePng) {
    const bytes = readFileSync(absolute);
    add(bytes.length >= 33 && bytes.subarray(0, 8).equals(pngSignature), `Invalid PNG: ${record.file}`);
  }
}

function checkRecords(records, label) {
  add(Array.isArray(records) && records.length > 0, `${label} must not be empty`);
  for (const [index, record] of (records ?? []).entries()) {
    checkRecord(record, `${label}[${index}]`, true);
  }
}

function checkGrid(map) {
  add(map.grid?.columns === 43, "Grid must contain 43 columns");
  add(map.grid?.rows === 24, "Grid must contain 24 rows");
  add(map.grid?.cellCount === 1032, "Grid cellCount must equal 1,032");
  add(Object.keys(map.cellAssignments ?? {}).length === 1032, "Every semantic cell must be assigned");
}

function checkFullGrid() {
  const manifest = readJson("assets/game/manifests/office-full-grid-v1.json");
  const map = readJson("assets/game/maps/office-full-grid-v1.json");
  add(manifest.id === "office.full-grid.v1", "Unexpected full-grid manifest id");
  add(map.grid?.columns === 43 && map.grid?.rows === 24, "Full grid must be 43 x 24");
  checkRecord(manifest.map, "full-grid map");
  checkRecord(manifest.reviewOutput, "full-grid review output", true);
  checkRecord(manifest.activeOfficeBaseline, "full-grid active baseline");
}

function checkSemanticV2() {
  const manifest = readJson("assets/game/manifests/office-semantic-grid-v2.json");
  const map = readJson("assets/game/maps/office-semantic-grid-v2.json");
  add(manifest.id === "office.semantic-grid.v2", "Unexpected semantic-grid v2 manifest id");
  checkGrid(map);
  checkRecord(manifest.map, "semantic-grid v2 map");
  checkRecord(manifest.candidateBackground, "semantic-grid v2 candidate", true);
  checkRecord(manifest.activeOfficeBaseline, "semantic-grid v2 active baseline");
  checkRecords(manifest.ownerEvidence, "semantic-grid v2 owner evidence");
  checkRecords(manifest.reviewOutputs, "semantic-grid v2 review outputs");
}

function checkSemanticV3() {
  const manifest = readJson("assets/game/manifests/office-semantic-grid-v3.json");
  const map = readJson("assets/game/maps/office-semantic-grid-v3.json");
  add(manifest.id === "office.semantic-grid.v3", "Unexpected semantic-grid v3 manifest id");
  add(manifest.status === "rejected-left-pillar-base-underfill", "Semantic-grid v3 must remain rejected");
  add(map.status === "rejected-left-pillar-base-underfill", "Semantic-grid v3 map must remain rejected");
  add(manifest.supersededBy === "office.semantic-grid.v4", "Semantic-grid v3 must point to v4");
  add(map.activeOfficePromotion === false, "Rejected semantic-grid v3 cannot be active");
  checkGrid(map);
  checkRecord(manifest.map, "semantic-grid v3 map");
  checkRecord(manifest.candidateBackground, "semantic-grid v3 rejected candidate", true);
  checkRecord(manifest.activeOfficeBaseline, "semantic-grid v3 active baseline");
  checkRecords(manifest.reviewOutputs, "semantic-grid v3 review outputs");
}

function checkSemanticV4() {
  const manifest = readJson("assets/game/manifests/office-semantic-grid-v4.json");
  const map = readJson("assets/game/maps/office-semantic-grid-v4.json");
  add(manifest.id === "office.semantic-grid.v4", "Unexpected semantic-grid v4 manifest id");
  add(manifest.status === "superseded-by-v5", "Semantic-grid v4 manifest must be superseded");
  add(map.status === "superseded-by-v5", "Semantic-grid v4 map must be superseded");
  add(manifest.supersededBy === "office.semantic-grid.v5", "Semantic-grid v4 must point to v5");
  add(map.activeOfficePromotion === false, "Superseded semantic-grid v4 cannot remain active");
  checkGrid(map);
  const left = map.pillarAlignments?.find((pillar) => pillar.id === "pillar-left");
  add(JSON.stringify(left?.sourcePixels) === "[0,0,84,416]", "Left pillar must exclude floor pixels");
  add(JSON.stringify(left?.targetPixels) === "[0,0,78,431]", "Left pillar must fill A1:B11");
  add(map.rules?.leftPillarBaseFillsRow11 === true, "Left pillar row-11 completion must be locked");
  checkRecord(manifest.map, "semantic-grid v4 map");
  checkRecord(manifest.currentBackground, "semantic-grid v4 current background", true);
  checkRecords(manifest.reviewOutputs, "semantic-grid v4 review outputs");
  checkRecord(map.sourceBackground, "semantic-grid v4 source", true);
  checkRecord(map.rejectedBackground, "semantic-grid v4 rejected evidence", true);
  checkRecord(map.activeOfficeMap, "semantic-grid v4 active map");
}

function checkSemanticV5() {
  const manifest = readJson("assets/game/manifests/office-semantic-grid-v5.json");
  const map = readJson("assets/game/maps/office-semantic-grid-v5.json");
  add(manifest.id === "office.semantic-grid.v5", "Unexpected semantic-grid v5 manifest id");
  add(manifest.status === "superseded-by-v6", "Semantic-grid v5 manifest must be superseded");
  add(map.status === "superseded-by-v6", "Semantic-grid v5 map must be superseded");
  add(manifest.supersededBy === "office.semantic-grid.v6", "Semantic-grid v5 must point to v6");
  add(map.activeOfficePromotion === false, "Superseded semantic-grid v5 cannot remain active");
  add(map.previouslyActiveOfficePromotion === true, "Semantic-grid v5 must retain its historical promotion");
  add(map.supersededOn === "2026-07-30", "Semantic-grid v5 must record its V1 supersession date");
  add(manifest.permissions?.dynamicWhiteboardViewport === true, "V5 whiteboard viewport must be authorized");
  checkGrid(map);
  const left = map.pillarAlignments?.find((pillar) => pillar.id === "pillar-left");
  const center = map.pillarAlignments?.find((pillar) => pillar.id === "pillar-center");
  const right = map.pillarAlignments?.find((pillar) => pillar.id === "pillar-right");
  add(JSON.stringify(left?.targetPixels) === "[0,0,78,431]", "V5 left pillar must fill A1:B11");
  add(JSON.stringify(center?.targetPixels) === "[1050,0,1167,431]", "V5 center pillar must fill AB1:AD11");
  add(JSON.stringify(right?.targetPixels) === "[1594,0,1672,431]", "V5 right pillar must fill AP1:AQ11");
  const whiteboard = map.wallDisplays?.find((display) => display.id === "work-status-whiteboard");
  add(whiteboard?.supportRange === "AF4-AN9", "Whiteboard support range must be AF4:AN9");
  add(whiteboard?.contentRange === "AG5-AM8", "Whiteboard content range must be AG5:AM8");
  add(JSON.stringify(whiteboard?.contentPixels) === "[1244,157,1516,314]", "Whiteboard content pixels changed");
  checkRecord(manifest.map, "semantic-grid v5 map");
  checkRecord(manifest.generatedSource, "semantic-grid v5 generated source", true);
  checkRecord(manifest.historicalBackground, "semantic-grid v5 historical background", true);
  checkRecords(manifest.reviewOutputs, "semantic-grid v5 review outputs");
  checkRecord(map.previousBackground, "semantic-grid v5 previous background", true);
  checkRecord(map.activeOfficeMap, "semantic-grid v5 active map");
  const runtime = readFileSync(projectPath(manifest.runtime?.file ?? ""), "utf8");
  add(runtime.includes("office-c-background-modern-v8-current.png"), "Runtime must import the current v8 background");
  add(!runtime.includes("office-c-background-modern-v7-current.png"), "Runtime cannot retain the superseded v7 background");
}

function checkSemanticV6() {
  const manifest = readJson("assets/game/manifests/office-semantic-grid-v6.json");
  const map = readJson("assets/game/maps/office-semantic-grid-v6.json");
  add(manifest.id === "office.semantic-grid.v6", "Unexpected semantic-grid v6 manifest id");
  add(manifest.status === "complete-current", "Semantic-grid v6 manifest must be complete and current");
  add(map.status === "complete-current", "Semantic-grid v6 map must be complete and current");
  add(manifest.supersedes === "office.semantic-grid.v5", "Semantic-grid v6 must supersede v5");
  add(map.activeOfficePromotion === true, "Semantic-grid v6 must be promoted");
  add(manifest.permissions?.ownerApproved === true, "Semantic-grid v6 must record owner approval");
  add(manifest.permissions?.activeOfficePromotion === true, "Semantic-grid v6 must authorize Active Office");
  add(manifest.permissions?.runtimeBackgroundPromotion === true, "Semantic-grid v6 must authorize the runtime background");
  add(map.promotedOn === "2026-07-30", "Semantic-grid v6 must record its V1 promotion date");
  add(map.ownerDecision?.decision === "approved", "Semantic-grid v6 map must record owner approval");
  add(manifest.ownerDecision?.decision === "approved", "Semantic-grid v6 manifest must record owner approval");
  checkGrid(map);
  const left = map.pillarAlignments?.find((pillar) => pillar.id === "pillar-left");
  const center = map.pillarAlignments?.find((pillar) => pillar.id === "pillar-center");
  const right = map.pillarAlignments?.find((pillar) => pillar.id === "pillar-right");
  add(JSON.stringify(left?.targetPixels) === "[0,0,78,431]", "V6 left pillar must fill A1:B11");
  add(JSON.stringify(center?.targetPixels) === "[1050,0,1167,431]", "V6 center pillar must fill AB1:AD11");
  add(JSON.stringify(right?.targetPixels) === "[1594,0,1672,431]", "V6 right pillar must fill AP1:AQ11");
  const whiteboard = map.wallDisplays?.find((display) => display.id === "work-status-whiteboard");
  add(whiteboard?.supportRange === "D4-L9", "V6 whiteboard support range must be D4:L9");
  add(whiteboard?.contentRange === "E5-K8", "V6 whiteboard content range must be E5:K8");
  add(JSON.stringify(whiteboard?.supportPixels) === "[117,118,467,353]", "V6 whiteboard support pixels changed");
  add(JSON.stringify(whiteboard?.contentPixels) === "[156,157,428,314]", "V6 whiteboard content pixels changed");
  add(map.floorReplacement?.material === "light-warm-oak-spc", "V6 Office floor must use light warm oak SPC");
  add(map.floorReplacement?.pattern === "herringbone", "V6 Office floor must use a herringbone pattern");
  add(
    JSON.stringify(map.floorReplacement?.ranges) === '["C11-AA11","A12-AA24"]',
    "V6 Office floor replacement ranges changed",
  );
  add(map.floorReplacement?.relaxationFloorUnchanged === true, "V6 relaxation floor must remain unchanged");
  checkRecord(manifest.map, "semantic-grid v6 map");
  checkRecord(manifest.ownerMarkup, "semantic-grid v6 owner markup", true);
  checkRecord(manifest.generatedSource, "semantic-grid v6 generated source", true);
  checkRecord(manifest.candidateBackground, "semantic-grid v6 candidate", true);
  checkRecord(manifest.currentBackground, "semantic-grid v6 current background", true);
  add(
    manifest.candidateBackground?.sha256 === manifest.currentBackground?.sha256,
    "Semantic-grid v6 candidate and current background must be byte-identical",
  );
  checkRecords(manifest.reviewOutputs, "semantic-grid v6 review outputs");
  checkRecord(map.generationPrompt, "semantic-grid v6 generation prompt");
  checkRecord(map.baseBackground, "semantic-grid v6 base background", true);
  checkRecord(map.currentBackground, "semantic-grid v6 current map background", true);
  checkRecord(map.previousActiveOffice?.semanticMap, "semantic-grid v6 previous semantic map");
  checkRecord(map.previousActiveOffice?.runtimeMap, "semantic-grid v6 previous runtime map");
  checkRecord(map.previousActiveOffice?.background, "semantic-grid v6 previous background", true);
  checkRecord(map.activeOfficeMap, "semantic-grid v6 active map");
  const runtimePath = map.runtimeConsumer ?? "";
  add(typeof runtimePath === "string" && runtimePath.length > 0, "Semantic-grid v6 runtime consumer is missing");
  if (typeof runtimePath === "string" && runtimePath.length > 0 && existsSync(projectPath(runtimePath))) {
    const runtime = readFileSync(projectPath(runtimePath), "utf8");
    add(runtime.includes("office-c-background-modern-v8-current.png"), "Runtime must import the current v8 background");
    add(!runtime.includes("office-c-background-modern-v8-owner-review.png"), "Runtime cannot import owner-review V8");
    add(runtime.includes("whiteboard: { x: 117, y: 118, width: 350, height: 235 }"), "Runtime whiteboard frame changed");
    add(runtime.includes("whiteboardContent: { x: 156, y: 157, width: 272, height: 157 }"), "Runtime whiteboard viewport changed");
  }
}

function checkC12() {
  const manifest = readJson("assets/game/manifests/office-c12-ten-seat-v1.json");
  const map = readJson("assets/game/maps/office-c12-ten-seat-v1.json");
  add(manifest.id === "office.c12-ten-seat.v1", "Unexpected C12 ten-seat manifest id");
  add(map.placement?.anchorCell === "C12", "C12 placement must start at C12");
  add(map.placement?.protectedEnvelope?.range === "C12:S19", "C12 envelope must be C12:S19");
  add(map.counts?.people === 10 && map.counts?.desks === 10, "C12 scene must contain ten people and desks");
  checkRecord(manifest.map, "C12 ten-seat map");
  checkRecords(manifest.reviewOutputs, "C12 ten-seat review outputs");
  checkRecord(map.sourceBackground, "C12 source background", true);
  checkRecord(map.activeOfficeBaseline, "C12 active baseline");
  checkRecord(map.seatSockets, "C12 seat sockets");
  checkRecord(map.componentAuthority, "C12 component authority");
}

const checks = {
  "full-grid": checkFullGrid,
  "semantic-v2": checkSemanticV2,
  "semantic-v3": checkSemanticV3,
  "semantic-v4": checkSemanticV4,
  "semantic-v5": checkSemanticV5,
  "semantic-v6": checkSemanticV6,
  "c12-ten-seat": checkC12,
};
const mode = process.argv[2];
if (!(mode in checks)) {
  process.stderr.write(`Usage: node scripts/office-grid-artifacts-check.mjs ${Object.keys(checks).join("|")}\n`);
  process.exit(2);
}
checks[mode]();
if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Office ${mode} portable artifact check OK (no Pillow required).\n`);
}
