const depthBands = new Map(
  ["floor", "ground", "world", "upper", "effect"].map((band, index) => [band, index]),
);

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalize(entry)]),
    );
  }
  return value;
}

export function same(actual, expected) {
  return JSON.stringify(normalize(actual)) === JSON.stringify(normalize(expected));
}

export function findAssetAdmissionDiagnostic(errors) {
  if (errors.length === 0) return null;
  const commercialError = errors.find(({ instancePath, keyword }) => (
    instancePath === "/approval/commercial" && keyword === "const"
  ));
  if (errors.length !== 1 || !commercialError) {
    return {
      code: "asset.schema-invalid",
      owner: "asset",
      version: 1,
      message: "Asset admission failed schema validation for an unexpected reason.",
      context: { schemaErrors: errors.map(({ instancePath, keyword }) => ({ instancePath, keyword })) },
    };
  }
  return {
    code: "asset.commercial-review",
    owner: "asset",
    version: 1,
    message: "Asset commercial approval is incomplete.",
    context: { pointer: commercialError.instancePath },
  };
}

export function evaluateProjection(fixture, entry) {
  const tileWidthPx = fixture.tileWidthPx ?? 64;
  const tileHeightPx = fixture.tileHeightPx ?? 32;
  const elevationHeightPx = fixture.elevationHeightPx ?? 16;
  const { x, y, elevation = 0 } = entry.world;
  const projected = {
    xPx: fixture.origin.xPx + (x - y) * (tileWidthPx / 2),
    yPx: fixture.origin.yPx + (x + y) * (tileHeightPx / 2) - elevation * elevationHeightPx,
  };
  const dx = entry.screen.xPx - fixture.origin.xPx;
  const dy = entry.screen.yPx - fixture.origin.yPx + elevation * elevationHeightPx;
  const inverse = {
    x: dy / tileHeightPx + dx / tileWidthPx,
    y: dy / tileHeightPx - dx / tileWidthPx,
    elevation,
  };
  return { projected, inverse };
}

function rotate(cell, orientation) {
  if (orientation === "east") return { ...cell, x: -cell.y, y: cell.x };
  if (orientation === "south") return { ...cell, x: -cell.x, y: -cell.y };
  if (orientation === "west") return { ...cell, x: cell.y, y: -cell.x };
  return { ...cell };
}

function translate(cells, anchor, orientation) {
  return cells.map((cell) => {
    const local = rotate(cell, orientation);
    return { x: anchor.x + local.x, y: anchor.y + local.y };
  });
}

export function evaluatePlacement(fixture, entry) {
  const footprint = translate(fixture.definition.footprint, entry.anchor, entry.orientation);
  const clearance = translate(fixture.definition.clearance ?? [], entry.anchor, entry.orientation);
  const outside = footprint.some(({ x, y }) => (
    x < 0 || y < 0 || x >= fixture.bounds.width || y >= fixture.bounds.depth
  ));
  const occupied = new Set((entry.occupied ?? []).map(({ x, y }) => `${x},${y}`));
  const clearanceBlocked = clearance.some(({ x, y }) => occupied.has(`${x},${y}`));
  const result = outside ? "out-of-bounds" : clearanceBlocked ? "clearance" : "accepted";
  return { result, footprint };
}

export function evaluateDepth(entry) {
  return entry.entities
    .toSorted((left, right) => (
      (depthBands.get(left.band) ?? Number.MAX_SAFE_INTEGER)
      - (depthBands.get(right.band) ?? Number.MAX_SAFE_INTEGER)
      || left.groundY - right.groundY
      || left.elevation - right.elevation
      || left.id.localeCompare(right.id)
    ))
    .map(({ id }) => id);
}

export function connectivityFailures(document) {
  const variants = new Set(document.variants.map(({ mask }) => mask));
  return document.supportedMasks.filter((mask) => !variants.has(mask));
}

export function evaluateConnectivity(entry) {
  const occupied = new Set(entry.cells.map(({ x, y }) => `${x},${y}`));
  return entry.cells.map(({ x, y }) => (
    (occupied.has(`${x},${y - 1}`) ? 1 : 0)
    | (occupied.has(`${x + 1},${y}`) ? 2 : 0)
    | (occupied.has(`${x},${y + 1}`) ? 4 : 0)
    | (occupied.has(`${x - 1},${y}`) ? 8 : 0)
  ));
}

function pathKey({ x, y }) {
  return `${x},${y}`;
}

export function findPath(fixture, entry) {
  const stepCost = fixture.costModel?.cardinalStepCost ?? 100;
  const heuristicName = fixture.costModel?.heuristic ?? "manhattan";
  const heuristicUnit = fixture.costModel?.heuristicUnit ?? stepCost;
  if (!Number.isInteger(stepCost) || stepCost <= 0) {
    throw new Error("cardinalStepCost must be a positive integer");
  }
  if (heuristicName !== "manhattan") throw new Error(`Unsupported heuristic: ${heuristicName}`);
  if (heuristicUnit !== stepCost) throw new Error("heuristicUnit must equal cardinalStepCost");
  const blocked = new Set((fixture.blockedCells ?? []).map(pathKey));
  const heuristic = ({ x, y }) => (
    (Math.abs(entry.goal.x - x) + Math.abs(entry.goal.y - y)) * heuristicUnit
  );
  const open = [{ cell: entry.start, cost: 0, path: [entry.start] }];
  const best = new Map([[pathKey(entry.start), 0]]);

  while (open.length) {
    open.sort((left, right) => (
      left.cost + heuristic(left.cell) - right.cost - heuristic(right.cell)
      || heuristic(left.cell) - heuristic(right.cell)
      || left.cell.y - right.cell.y
      || left.cell.x - right.cell.x
    ));
    const current = open.shift();
    if (current.cost !== best.get(pathKey(current.cell))) continue;
    if (pathKey(current.cell) === pathKey(entry.goal)) {
      return {
        path: current.path,
        stepCount: current.path.length - 1,
        stepCost,
        heuristicUnit,
        totalCost: current.cost,
      };
    }
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const cell = { x: current.cell.x + dx, y: current.cell.y + dy };
      const key = pathKey(cell);
      const outside = cell.x < 0 || cell.y < 0
        || cell.x >= fixture.bounds.width || cell.y >= fixture.bounds.depth;
      if (outside || blocked.has(key)) continue;
      const cost = current.cost + stepCost;
      if (cost >= (best.get(key) ?? Infinity)) continue;
      best.set(key, cost);
      open.push({ cell, cost, path: [...current.path, cell] });
    }
  }

  return { path: [], stepCount: 0, stepCost, heuristicUnit, totalCost: null };
}

export function evaluateReservation(entry) {
  const ordered = entry.requests.toSorted((left, right) => (
    left.issuedTick - right.issuedTick
    || left.commandId.localeCompare(right.commandId)
    || left.actorId.localeCompare(right.actorId)
  ));
  return {
    owner: ordered[0]?.actorId ?? null,
    waiting: ordered.slice(1).map(({ actorId }) => actorId),
  };
}

export function evaluateInteraction(fixture, entry) {
  const cancelled = entry.events.some(({ type }) => type === "cancel" || type === "timeout");
  if (cancelled) {
    return {
      result: fixture.definition.cancellation.resultEvent,
      reservationReleased: fixture.definition.cancellation.releaseReservations,
    };
  }
  const start = entry.events.find(({ type }) => type === "start");
  const completed = entry.events.some(({ tick, type }) => (
    type === "advance" && start && tick - start.tick >= fixture.definition.durationTicks
  ));
  return {
    result: completed ? fixture.definition.resultEvent : null,
    reservationReleased: false,
  };
}

export function evaluateStructure(fixture, entry) {
  const doors = fixture.definitions
    .filter(({ kind }) => kind === "door")
    .toSorted((left, right) => (
      left.definitionId.localeCompare(right.definitionId)
      || left.definitionVersion - right.definitionVersion
    ));
  if (doors.length !== 1) throw new Error(`Expected one door definition, received ${doors.length}`);
  return { traversable: !doors[0].blockingStates.includes(entry.state) };
}

export function findWorldOverlap(rejected) {
  const definitions = new Map(
    rejected.definitions.map((definition) => [definition.definitionId, definition]),
  );
  const occupied = new Map();
  for (const [entityIndex, entity] of rejected.document.entities.entries()) {
    const definition = definitions.get(entity.definitionId);
    if (!definition || definition.blocking !== true) continue;
    for (const localCell of definition.footprint) {
      const local = rotate(localCell, entity.orientation);
      const cell = {
        x: entity.anchor.x + local.x,
        y: entity.anchor.y + local.y,
        elevation: entity.anchor.elevation + (local.elevation ?? 0),
      };
      const key = `${cell.x},${cell.y},${cell.elevation}`;
      const previous = occupied.get(key);
      if (previous) {
        return {
          entityIds: [previous.entityId, entity.id],
          cell,
          pointer: `/entities/${entityIndex}/anchor`,
        };
      }
      occupied.set(key, { entityId: entity.id });
    }
  }
  return null;
}
