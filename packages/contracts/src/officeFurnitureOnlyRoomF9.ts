export * from "./officeFurnitureOnlyRoomF9Types.ts";

type ValueRecord = Record<string, unknown>;

const record = (value: unknown): value is ValueRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const sha256 = (value: unknown) =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const point = (value: unknown) =>
  Array.isArray(value)
  && value.length === 2
  && value.every(Number.isInteger);
const same = (first: unknown, second: unknown) =>
  JSON.stringify(first) === JSON.stringify(second);
const add = (issues: string[], condition: boolean, message: string) => {
  if (!condition) issues.push(message);
};

export function validateOfficeFurnitureOnlyRoomF9Manifest(
  value: unknown,
): string[] {
  if (!record(value)) return ["manifest must be an object"];
  const issues: string[] = [];
  add(
    issues,
    value.schemaVersion === 1
      && value.id === "office.furniture-only-room.f9.v1"
      && value.revision === "f9-v1"
      && value.status === "f9-owner-review"
      && value.productionStage === "f9-candidate-owner-review"
      && value.developmentOnly === true
      && value.activeOfficePromotion === false
      && value.ownerDecision === null,
    "F9 candidate identity or isolation changed",
  );

  const source = value.sourcePolicy;
  add(
    issues,
    record(source)
      && source.ownerApprovedFamiliesOnly === true
      && source.newVersionedMap === true
      && source.activeOfficePixelReuse === false
      && source.activeOfficeMapMutation === false
      && source.processedRejectedFamilyReuse === false
      && source.missingAssetFallback === false
      && source.magicOffsets === false,
    "F9 source isolation changed",
  );

  const authorities = value.authorityLedger;
  add(
    issues,
    Array.isArray(authorities)
      && authorities.length === 13
      && new Set(
        authorities
          .filter(record)
          .map((entry) => entry.id),
      ).size === 13
      && authorities.every((entry) =>
        record(entry)
        && sha256(entry.sha256)
        && (
          entry.status === "owner-approved"
          || entry.status === "owner-approved-p0-p3"
        )),
    "F9 owner-approved authority ledger changed",
  );

  add(
    issues,
    record(value.inventory)
      && same(value.inventory, {
        workstationCount: 10,
        facilityObjectCount: 14,
        supportFurnitureCount: 1,
        reservationSlotCount: 20,
        decorCount: 0,
        personCount: 0,
      }),
    "F9 10-workstation / 14-facility / 20-slot inventory changed",
  );

  const interior = value.interiorValidation;
  add(
    issues,
    record(interior)
      && interior.workstationAnchorCell === "C12"
      && interior.workstationRows === 2
      && interior.workstationsPerRow === 5
      && interior.rightEdgeSideOrientedFacilityCount === 3
      && interior.frontOnlyFamilyOrientationViolations === 0
      && interior.footprintOverlapCount === 0
      && interior.blockedApproachCount === 0
      && interior.circulationDisconnectedCount === 0,
    "F9 interior layout contract changed",
  );

  const map = value.map;
  add(
    issues,
    record(map)
      && map.file === "assets/game/maps/office-furniture-only-f9-v1.json"
      && sha256(map.sha256)
      && same(map.grid, [43, 24])
      && map.tilePixels === 32,
    "F9 map reference changed",
  );

  const layers = value.layers;
  const layerIds = Array.isArray(layers)
    ? layers.filter(record).map((entry) => entry.id)
    : [];
  add(
    issues,
    Array.isArray(layers)
      && layers.length === 10
      && new Set(layerIds).size === 10
      && [
        "architecture",
        "workstations",
        "support-furniture",
        "facilities",
        "footprints",
        "approaches",
        "routes",
        "reservations",
        "decor",
        "grid",
      ].every((id) => layerIds.includes(id))
      && layers.every((entry) =>
        record(entry)
        && sha256(entry.sha256)
        && same(entry.size, [1376, 768])),
    "F9 independent layer contract changed",
  );

  add(
    issues,
    record(value.routeValidation)
      && value.routeValidation.queryCount === 200
      && value.routeValidation.reachableCount === 200
      && value.routeValidation.unreachableCount === 0
      && value.routeValidation.minimumRequired === 200,
    "F9 200-route validation changed",
  );

  const reservations = value.reservationValidation;
  add(
    issues,
    record(reservations)
      && reservations.successfulInitialReservations === 20
      && reservations.blockedAttempts === 1
      && reservations.successfulReleases === 21
      && reservations.successfulRetries === 1
      && reservations.maximumConcurrentReservations === 20
      && reservations.endingConcurrentReservations === 0
      && reservations.doubleBookingCount === 0
      && reservations.leakedReservationCount === 0,
    "F9 reservation stress summary changed",
  );

  add(
    issues,
    record(value.people)
      && value.people.visible === false
      && value.people.placementCount === 0
      && value.people.spriteReferenceCount === 0,
    "F9 must remain furniture-only",
  );

  add(
    issues,
    Array.isArray(value.reviewOutputs)
      && value.reviewOutputs.length === 15
      && value.reviewOutputs.every((entry) =>
        record(entry)
        && sha256(entry.sha256)
        && same(entry.size, [1600, 1000])),
    "F9 review output ledger changed",
  );

  const gates = value.gates;
  const permissions = value.permissions;
  add(
    issues,
    record(gates)
      && record(gates.F8)
      && gates.F8.status === "passed"
      && record(gates.F9)
      && gates.F9.status === "pending-owner-review"
      && record(gates.F10)
      && gates.F10.status === "blocked",
    "F9/F10 gate boundary changed",
  );
  add(
    issues,
    record(permissions)
      && permissions.ownerReview === true
      && permissions.f10CharacterPopulation === false
      && permissions.activeOfficePromotion === false,
    "F9 permissions changed",
  );
  return issues;
}

export function validateOfficeFurnitureOnlyRoomF9Map(
  value: unknown,
): string[] {
  if (!record(value)) return ["map must be an object"];
  const issues: string[] = [];
  const coordinate = value.coordinateSystem;
  add(
    issues,
    value.schemaVersion === 1
      && value.id === "office.furniture-only-room.f9.v1"
      && value.status === "f9-owner-review"
      && value.developmentOnly === true
      && value.activeOfficePromotion === false
      && record(coordinate)
      && coordinate.origin === "top-left"
      && coordinate.indexing === "zero-based"
      && coordinate.columns === 43
      && coordinate.rows === 24
      && coordinate.tilePixels === 32
      && same(coordinate.canvasPixels, [1376, 768]),
    "F9 map identity or coordinate system changed",
  );

  const plan = value.interiorPlan;
  const arrangement = record(plan) ? plan.workstationArrangement : undefined;
  add(
    issues,
    record(plan)
      && plan.workstationAnchorCell === "C12"
      && plan.workstationProtectedEnvelope === "C12:S19"
      && plan.workstationContentFootprint === "D13:R18"
      && record(arrangement)
      && arrangement.rows === 2
      && arrangement.stationsPerRow === 5
      && same(arrangement.perimeterWalkways, [
        "C12:S12",
        "C19:S19",
        "C13:C18",
        "S13:S18",
      ]),
    "F9 C12 two-row workstation plan changed",
  );

  const workstations = value.workstations;
  const expectedOrigins = [
    [3, 13],
    [6, 13],
    [9, 13],
    [12, 13],
    [15, 13],
    [3, 15],
    [6, 15],
    [9, 15],
    [12, 15],
    [15, 15],
  ];
  add(
    issues,
    Array.isArray(workstations)
      && workstations.length === 10
      && workstations.every((entry, index) =>
        record(entry)
        && same(entry.origin, expectedOrigins[index])
        && entry.orientation === (index < 5 ? "far" : "near")
        && point(entry.chairCell)
        && point(entry.routeStart)
        && Array.isArray(entry.deskFootprint)
        && entry.deskFootprint.length === 6
        && entry.deskFootprint.every(point)),
    "F9 workstation origins no longer match C12 two-row authority",
  );

  const facilities = value.facilities;
  const sideBank = Array.isArray(facilities)
    ? facilities.filter(
      (entry) => record(entry) && entry.wallRelationship === "right-edge",
    )
    : [];
  add(
    issues,
    Array.isArray(facilities)
      && facilities.length === 14
      && sideBank.length === 3
      && sideBank.every((entry) =>
        record(entry)
        && entry.visualOrientation === "left"
        && Array.isArray(entry.origin)
        && entry.origin[0] === 41),
    "F9 right-edge side-oriented facility bank changed",
  );

  const slots = value.reservationSlots;
  const slotIds = Array.isArray(slots)
    ? slots.filter(record).map((entry) => entry.id)
    : [];
  add(
    issues,
    Array.isArray(slots)
      && slots.length === 20
      && new Set(slotIds).size === 20
      && slots.every((entry) =>
        record(entry)
        && entry.capacity === 1
        && point(entry.approachCell)
        && entry.interaction === "front-relative-to-visual-orientation"),
    "F9 reservation slot geometry changed",
  );

  const people = value.people;
  const decor = value.decor;
  add(
    issues,
    record(people)
      && people.visible === false
      && Array.isArray(people.placements)
      && people.placements.length === 0
      && Array.isArray(people.spriteReferences)
      && people.spriteReferences.length === 0
      && record(decor)
      && Array.isArray(decor.placements)
      && decor.placements.length === 0
      && decor.approvedCount === 0,
    "F9 map must contain no people and no unapproved decor",
  );

  const route = value.routeValidation;
  const queries = record(route) ? route.queries : undefined;
  add(
    issues,
    record(route)
      && route.queryCount === 200
      && route.reachableCount === 200
      && route.unreachableCount === 0
      && Array.isArray(queries)
      && queries.length === 200
      && new Set(
        queries.filter(record).map(
          (entry) => `${entry.fromWorkstationId}:${entry.toReservationId}`,
        ),
      ).size === 200
      && queries.every((entry) =>
        record(entry)
        && entry.reachable === true
        && typeof entry.pathLength === "number"
        && entry.pathLength >= 0),
    "F9 route matrix changed",
  );

  const stress = value.reservationStress;
  const summary = record(stress) ? stress.summary : undefined;
  add(
    issues,
    record(stress)
      && stress.durationSeconds === 300
      && stress.syntheticActorCount === 21
      && stress.slotCount === 20
      && Array.isArray(stress.concurrencySamples)
      && stress.concurrencySamples.length === 301
      && record(summary)
      && summary.blockedAttempts === 1
      && summary.successfulRetries === 1
      && summary.doubleBookingCount === 0
      && summary.leakedReservationCount === 0,
    "F9 300-second reservation stress changed",
  );
  return issues;
}
