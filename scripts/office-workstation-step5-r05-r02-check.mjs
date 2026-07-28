import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = "assets/game/manifests/office-workstation-step5-r05-r02.json";
const socketsPath = "assets/game/manifests/office-character-seat-sockets-v1.json";
const pairPath = "assets/game/maps/office-workstation-pair-r05-r02.json";
const reviewDirectory = "assets/art/layout-references/office-workstation-v3/step5-r05-r02";
const activeRegistryPath = "apps/web/src/features/office/components/officeAssetRegistry.ts";
const failures = [];

const readJson = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const sha256 = (path) => createHash("sha256").update(readFileSync(join(root, path))).digest("hex");
const add = (condition, message) => { if (!condition) failures.push(message); };
const files = (directory) => existsSync(join(root, directory))
  ? readdirSync(join(root, directory), { recursive: true })
    .filter((entry) => statSync(join(root, directory, entry)).isFile())
    .map((entry) => join(directory, entry).replaceAll("\\", "/")).sort()
  : [];
const imageSize = (path) => {
  const value = readFileSync(join(root, path));
  if (value.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return [value.readUInt32BE(16), value.readUInt32BE(20)];
  }
  if (value[0] === 0xff && value[1] === 0xd8) {
    let offset = 2;
    while (offset + 8 < value.length) {
      while (value[offset] === 0xff) offset += 1;
      const marker = value[offset];
      offset += 1;
      if (marker === 0xd8 || marker === 0xd9) continue;
      const length = value.readUInt16BE(offset);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return [value.readUInt16BE(offset + 5), value.readUInt16BE(offset + 3)];
      }
      offset += length;
    }
  }
  throw new Error(`Unsupported image format: ${path}`);
};

try {
  const manifest = readJson(manifestPath);
  const sockets = readJson(socketsPath);
  const pair = readJson(pairPath);
  add(manifest.version === 7 && manifest.geometrySchemaVersion === 8
    && manifest.id === "office.workstation.step5.r05.r02"
    && manifest.status === "owner-approved-p0-p3",
  "R05-r02 must be the owner-approved Geometry v8 P0-P3 baseline");
  add(JSON.stringify(manifest.completedScope) === JSON.stringify(["P0", "P1", "P2", "P3"])
    && manifest.stopGate === "approved-awaiting-ten-seat-plan-execution",
  "R05-r02 must remain approved while awaiting the named ten-seat execution phase");
  add(manifest.supersedesForPlacementAuthority === "office.workstation.step5.r05.final"
    && manifest.ownerDecision?.decision === "approved"
    && manifest.ownerDecision?.approvedOn === "2026-07-28",
  "R05-r02 owner approval record is missing or stale");
  add(manifest.activeOfficeBaseline?.sha256 === sha256(manifest.activeOfficeBaseline.file),
    "Active Office changed during R05-r02 work");
  add(manifest.rosterSockets?.file === socketsPath && manifest.rosterSockets?.sha256 === sha256(socketsPath),
    "R05-r02 socket manifest is missing or stale");
  add(manifest.pairMap?.file === pairPath && manifest.pairMap?.sha256 === sha256(pairPath),
    "R05-r02 pair map is missing or stale");
  add(pair.status === "owner-approved-p0-p3"
    && pair.developmentOnly === true && pair.activeOfficePromotion === false,
  "R05-r02 pair map must be owner-approved and development-only");

  add(sockets.version === 1 && sockets.schema === "office-character-seat-sockets"
    && sockets.status === "owner-approved" && sockets.tilePixels === 32,
  "Seat socket manifest identity changed");
  add(sockets.audit?.directoryCount === 19 && sockets.audit?.seatCapableCount === 18
    && sockets.audit?.companionNotApplicableCount === 1 && sockets.audit?.seatFrameRecordCount === 216,
  "Seat socket audit must cover all nineteen directories and 216 seated frame records");
  add(sockets.rules?.canvasBoundsAreFootprint === false
    && sockets.rules?.alphaBoundsAreFootprint === false
    && sockets.rules?.orientationMagicOffsets === false
    && sockets.rules?.frameSpecificSeatSocketsAllowed === true
    && sockets.rules?.newCharacterOrPose === false
    && sockets.rules?.handSocketsInScope === false,
  "Seat socket coordinate rules changed");
  const seated = sockets.entries?.filter(({ seatCapability }) => seatCapability === "working-seated") ?? [];
  const boba = sockets.entries?.find(({ slug }) => slug === "boba");
  add(seated.length === 18 && boba?.seatCapability === "not-applicable-companion-atlas",
    "Roster capability audit must contain eighteen seated atlases plus Boba");
  for (const entry of seated) {
    add(entry.source?.sha256 === sha256(entry.source.file), `${entry.slug} source changed`);
    for (const orientation of ["front", "back"]) {
      const frames = entry.orientations?.[orientation]?.frames;
      add(Array.isArray(frames) && frames.length === 6, `${entry.slug} ${orientation} must have six sockets`);
      for (const [index, frame] of (frames ?? []).entries()) {
        add(frame.frame === index && frame.seatContactLocal?.[0] === 48,
          `${entry.slug} ${orientation} frame ${index} socket is invalid`);
        if (orientation === "front") add(frame.seatContactLocal?.[1] === 80,
          `${entry.slug} front frame ${index} changed the approved visual baseline`);
        else add(frame.seatContactLocal?.[1] >= 85 && frame.seatContactLocal?.[1] <= 98,
          `${entry.slug} back frame ${index} leaves the measured contact range`);
      }
    }
  }

  add(JSON.stringify(pair.deskPair?.originDeltaTiles) === JSON.stringify([0, 2, 0])
    && JSON.stringify(pair.deskPair?.originDeltaPixels) === JSON.stringify([0, 64])
    && pair.deskPair?.topGapPixels === 0
    && pair.deskPair?.rearBaseVisibleBehindNearTopPixels === 0,
  "Desk pair must join by its 3x2 footprint and hide the far base");
  add(manifest.components?.monitor?.farLayerOrder === "keyboard-before-monitor"
    && JSON.stringify(manifest.station?.layerOrder?.far?.slice(5, 7)) === JSON.stringify(["keyboard", "monitor-back"]),
  "Far-row monitor must occlude the keyboard behind it");
  add(manifest.permissions?.isolatedCoordinateRenderer === true
    && manifest.permissions?.rosterSeatSocketAudit === true
    && manifest.permissions?.pairedWorkstationProof === true
    && manifest.permissions?.tenSeatExpansion === false
    && manifest.permissions?.handSockets === false
    && manifest.permissions?.newCharacterOrPose === false
    && manifest.permissions?.otherFurniture === false
    && manifest.permissions?.activeOfficePromotion === false,
  "R05-r02 permissions exceed the P0-P3 proof");

  const expectedReviews = [
    "01-coordinate-contract.png",
    "02-roster-front-overview.png",
    "03-roster-back-overview.png",
    "04-roster-front-six-frames-a.png",
    "05-roster-front-six-frames-b.png",
    "06-roster-back-six-frames-a.png",
    "07-roster-back-six-frames-b.png",
    "08-desk-depth-before-after.png",
    "09-far-equipment-before-after.png",
    "10-back-seat-before-after.png",
    "11-paired-workstation-clean-debug.png",
  ].map((name) => `${reviewDirectory}/${name}`);
  add(JSON.stringify(files(reviewDirectory)) === JSON.stringify(expectedReviews),
    "R05-r02 review directory must contain exactly eleven proof boards");
  add(JSON.stringify(manifest.reviewOutputs) === JSON.stringify(expectedReviews),
    "R05-r02 manifest review output list is stale");
  for (const path of expectedReviews) add(JSON.stringify(imageSize(path)) === JSON.stringify([1600, 1000]), `${path} must be 1600x1000`);

  const expectedCaptures = [
    "assets/game/processed/office-workstation-v3/step5-r05-r02/qa/01-browser-pair-clean.jpg",
    "assets/game/processed/office-workstation-v3/step5-r05-r02/qa/02-browser-pair-debug.jpg",
    "assets/game/processed/office-workstation-v3/step5-r05-r02/qa/03-browser-single-clean.jpg",
    "assets/game/processed/office-workstation-v3/step5-r05-r02/qa/04-browser-single-debug.jpg",
  ];
  add(JSON.stringify(manifest.browserValidation?.captures) === JSON.stringify(expectedCaptures),
    "R05-r02 browser capture list is stale");
  add(manifest.browserValidation?.consoleErrors === 0
    && manifest.browserValidation?.consoleWarnings === 0
    && manifest.browserValidation?.brokenImages === 0
    && manifest.browserValidation?.stationTopDeltaPixels === 64
    && JSON.stringify(manifest.browserValidation?.actorSeatDeltaPixels) === JSON.stringify([0, 0])
    && JSON.stringify(manifest.browserValidation?.farEquipmentOrder) === JSON.stringify(["keyboard", "monitor-back"])
    && manifest.browserValidation?.contractPass === true,
  "R05-r02 browser runtime invariants failed");
  for (const [index, path] of expectedCaptures.entries()) {
    add(existsSync(join(root, path)), `${path} is missing`);
    const expectedHeight = index < 2 ? 779 : 748;
    add(JSON.stringify(imageSize(path)) === JSON.stringify([1265, expectedHeight]), `${path} has the wrong browser capture size`);
  }

  const activeRegistry = readFileSync(join(root, activeRegistryPath), "utf8");
  add(!activeRegistry.includes("step5-r05-r02") && !activeRegistry.includes("office-character-seat-sockets-v1"),
    "Active Office registry imports the isolated coordinate proof");
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Step 5 R05-r02 check OK: owner-approved P0-P3 baseline, nineteen directories audited, 216 seat-frame sockets, 64 px desk depth join, corrected far equipment order, and Active Office unchanged.\n",
  );
}
