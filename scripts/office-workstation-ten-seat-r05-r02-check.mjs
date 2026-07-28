import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(root, "assets/game/manifests/office-workstation-ten-seat-r05-r02.json"), "utf8"));
const map = JSON.parse(readFileSync(join(root, "assets/game/maps/office-workstation-ten-seat-r05-r02.json"), "utf8"));
const failures = [];
const add = (condition, message) => { if (!condition) failures.push(message); };
const same = (value, expected) => JSON.stringify(value) === JSON.stringify(expected);
const sha256 = (path) => createHash("sha256").update(readFileSync(join(root, path))).digest("hex");

add(manifest.status === "owner-review-p4-p6", "ten-seat manifest must stop at owner review");
add(map.status === "owner-review-p4-p6" && map.developmentOnly === true, "ten-seat map must remain development-only owner review");
add(map.activeOfficePromotion === false && manifest.permissions?.activeOfficePromotion === false, "Active Office promotion must remain false");
add(same(map.stagePixels, [1365, 768]) && map.grid?.tilePixels === 32, "stage and tile scale changed");
add(map.placement?.zone === "upper-left" && same(map.placement?.deskOriginsX, [2, 5, 8, 11, 14]), "current ten must remain in five upper-left columns");
add(same(map.placement?.currentDeskOriginsY, { far: 11, near: 13 }), "current opposing desk rows must retain the approved depth join");
add(same(map.placement?.reservedDeskOriginsY, { far: 18, near: 20 }), "future ten must remain reserved below current ten");
add(same(map.capacity, { currentEmployees: 10, reservedEmployees: 10, totalPlannedEmployees: 20 }), "capacity must remain 10 current + 10 reserved");
add(map.currentWorkstations?.length === 10 && map.futureReservations?.length === 10, "current/reserved counts must both equal ten");
add(map.futureReservations?.every((slot) => slot.employeeAssigned === false && slot.artRendered === false), "future reservations must be empty and unrendered");
add(map.joins?.horizontal?.length === 8 && map.joins.horizontal.every((join) => join.gapPixels === 0), "all eight horizontal joins must have zero gap");
add(map.joins?.depth?.length === 5 && map.joins.depth.every((join) => same(join.originDeltaPixels, [0, 64]) && join.tabletopGapPixels === 0), "all five depth joins must be 64 px with zero tabletop gap");
const contacts = map.currentWorkstations?.flatMap((station) => station.seatContacts) ?? [];
add(contacts.length === 60 && contacts.every((contact) => same(contact.resolvedDeltaPixels, [0, 0])), "all sixty seat contacts must resolve at zero error");
add(map.rules?.deriveFromApprovedPair === true && map.rules?.importRejectedTenSeatCoordinates === false, "new map must derive from the approved pair and reject old ten-seat coordinates");
add(map.rules?.newCharacterOrPose === false && map.rules?.otherFurniture === false, "new characters, poses, and other furniture remain out of scope");
add(sha256(manifest.map.file) === manifest.map.sha256, "ten-seat map hash mismatch");
add(sha256(manifest.activeOfficeBaseline.file) === manifest.activeOfficeBaseline.sha256, "Active Office baseline changed");
add(sha256(map.sourceBackground.file) === map.sourceBackground.sha256, "approved background changed");
add(sha256(map.seatSockets.file) === map.seatSockets.sha256, "seat socket authority changed");
for (const path of manifest.reviewOutputs ?? []) add(existsSync(join(root, path)), `missing review output: ${path}`);
for (const path of manifest.browserValidation?.captures ?? []) add(existsSync(join(root, path)), `missing browser capture: ${path}`);
add(manifest.browserValidation?.result === "passed"
  && manifest.browserValidation?.durationSeconds === 60
  && manifest.browserValidation?.warningsAndErrors === 0
  && manifest.browserValidation?.sampledActorSeatDeltasAllZero === true,
"browser QA must record a 60-second zero-warning, zero-seat-delta pass");

if (failures.length) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("Ten-seat R05-r02 OK: 10 current upper-left, 10 empty reservations below, 13 zero-gap joins, 60/60 seat contacts, Active Office unchanged.\n");
}
