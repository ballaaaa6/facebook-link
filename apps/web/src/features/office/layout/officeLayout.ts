import type {
  OfficeAnchor,
  OfficeLayer,
  OfficeMapDefinition,
  OfficeMapObject,
  OfficePoint,
  OfficeRectangle,
  OfficeSupport,
} from "../officeTypes";

export interface OfficeAssetGeometryLike {
  renderBox: { width: number; height: number };
  fit?: "contain" | "fill";
  layer: OfficeLayer;
  anchor: OfficeAnchor;
  supports: OfficeSupport[];
  footprint?: { width: number; depth: number };
  slotSet?: string;
}

export interface OfficeSlotLike extends OfficePoint {
  surface: OfficeSupport;
}

export interface ResolvedOfficeObject extends OfficeMapObject {
  x: number;
  y: number;
  support: OfficeSupport;
  depthY: number;
}

export interface OfficeLayoutResult {
  objects: ResolvedOfficeObject[];
  issues: string[];
}

interface ParentPlacement extends OfficePoint {
  asset: string;
}

function rectanglesOverlap(a: OfficeRectangle, b: OfficeRectangle) {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

function footprintRectangle(
  point: OfficePoint,
  anchor: OfficeAnchor,
  footprint: { width: number; depth: number },
): OfficeRectangle {
  return {
    x: point.x - footprint.width / 2,
    y: anchor === "bottom-center" ? point.y - footprint.depth : point.y - footprint.depth / 2,
    width: footprint.width,
    height: footprint.depth,
  };
}

function resolveDepthY(
  point: OfficePoint,
  anchor: OfficeAnchor,
  footprint?: { width: number; depth: number },
) {
  if (!footprint || anchor === "bottom-center") return point.y;
  return point.y + footprint.depth / 2;
}

export function resolveOfficeLayout(
  map: OfficeMapDefinition,
  assets: Record<string, OfficeAssetGeometryLike>,
  slotSets: Record<string, Record<string, OfficeSlotLike>>,
): OfficeLayoutResult {
  const issues: string[] = [];
  const parents = new Map<string, ParentPlacement>();
  for (const station of map.workstations) {
    parents.set(station.id, { asset: station.desk, x: station.x, y: station.y });
  }
  for (const object of map.objects) {
    if (typeof object.x === "number" && typeof object.y === "number") {
      parents.set(object.id, { asset: object.asset, x: object.x, y: object.y });
    }
  }

  const claimedSlots = new Set<string>();
  const objects: ResolvedOfficeObject[] = [];
  for (const object of map.objects) {
    const geometry = assets[object.asset];
    if (!geometry) {
      issues.push(`${object.id}: unknown asset geometry ${object.asset}`);
      continue;
    }
    if (object.layer !== geometry.layer) {
      issues.push(`${object.id}: layer ${object.layer} does not match ${geometry.layer}`);
    }
    if (object.anchor !== geometry.anchor) {
      issues.push(`${object.id}: anchor ${object.anchor} does not match ${geometry.anchor}`);
    }
    if (typeof object.x === "number" && typeof object.y === "number") {
      const support = geometry.supports[0];
      if (!support) {
        issues.push(`${object.id}: asset has no supported placement`);
        continue;
      }
      if (!["floor", "wall", "ceiling"].includes(support)) {
        issues.push(`${object.id}: ${support} assets require a parent slot`);
        continue;
      }
      objects.push({
        ...object,
        x: object.x,
        y: object.y,
        support,
        depthY: resolveDepthY({ x: object.x, y: object.y }, object.anchor, geometry.footprint),
      });
      continue;
    }
    if (!object.parentId || !object.slot) {
      issues.push(`${object.id}: object needs coordinates or a parent slot`);
      continue;
    }
    const parent = parents.get(object.parentId);
    const parentGeometry = parent ? assets[parent.asset] : undefined;
    const slots = parentGeometry?.slotSet ? slotSets[parentGeometry.slotSet] : undefined;
    const slot = slots?.[object.slot];
    if (!parent || !parentGeometry || !slot) {
      issues.push(`${object.id}: invalid parent slot ${object.parentId}.${object.slot}`);
      continue;
    }
    const claim = `${object.parentId}:${object.slot}`;
    if (claimedSlots.has(claim)) {
      issues.push(`${object.id}: parent slot already occupied ${claim}`);
      continue;
    }
    claimedSlots.add(claim);
    if (!geometry.supports.includes(slot.surface)) {
      issues.push(`${object.id}: ${geometry.supports.join("|")} cannot use ${slot.surface}`);
      continue;
    }
    const x = parent.x + slot.x;
    const y = parent.y + slot.y;
    objects.push({
      ...object,
      x,
      y,
      support: slot.surface,
      depthY: parent.y + 0.25,
    });
  }
  return { objects, issues };
}

export function validateOfficeLayout(
  map: OfficeMapDefinition,
  assets: Record<string, OfficeAssetGeometryLike>,
  resolved: OfficeLayoutResult,
) {
  const issues = [...resolved.issues];
  const integerFields = [
    { id: "map width", value: map.width },
    { id: "map height", value: map.height },
    ...map.zones.flatMap((zone) => [
      { id: `${zone.id}.x`, value: zone.x },
      { id: `${zone.id}.y`, value: zone.y },
      { id: `${zone.id}.width`, value: zone.width },
      { id: `${zone.id}.height`, value: zone.height },
    ]),
    ...map.workstations.flatMap((station) => [
      { id: `${station.id}.x`, value: station.x },
      { id: `${station.id}.y`, value: station.y },
      { id: `${station.id}.seat.x`, value: station.seat.x },
      { id: `${station.id}.seat.y`, value: station.seat.y },
      { id: `${station.id}.approach.x`, value: station.approach.x },
      { id: `${station.id}.approach.y`, value: station.approach.y },
      { id: `${station.id}.stand.x`, value: station.stand.x },
      { id: `${station.id}.stand.y`, value: station.stand.y },
      { id: `${station.id}.collision.x`, value: station.collision.x },
      { id: `${station.id}.collision.y`, value: station.collision.y },
      { id: `${station.id}.collision.width`, value: station.collision.width },
      { id: `${station.id}.collision.height`, value: station.collision.height },
    ]),
    ...map.objects.flatMap((object) => [
      ...(typeof object.x === "number" ? [{ id: `${object.id}.x`, value: object.x }] : []),
      ...(typeof object.y === "number" ? [{ id: `${object.id}.y`, value: object.y }] : []),
    ]),
    ...map.routes.flatMap((route) => [
      { id: `${route.id}.x`, value: route.x },
      { id: `${route.id}.y`, value: route.y },
      { id: `${route.id}.width`, value: route.width },
      { id: `${route.id}.height`, value: route.height },
    ]),
    ...map.navigation.nodes.flatMap((node) => [
      { id: `${node.id}.x`, value: node.x },
      { id: `${node.id}.y`, value: node.y },
    ]),
    ...map.pois.flatMap((poi) => [
      { id: `${poi.id}.point.x`, value: poi.point.x },
      { id: `${poi.id}.point.y`, value: poi.point.y },
      ...(poi.slots ?? []).flatMap((slot, index) => [
        { id: `${poi.id}.slots[${index}].x`, value: slot.x },
        { id: `${poi.id}.slots[${index}].y`, value: slot.y },
      ]),
    ]),
  ];
  for (const field of integerFields) {
    if (!Number.isInteger(field.value)) issues.push(`${field.id} must be an integer grid value`);
  }
  for (const [assetId, geometry] of Object.entries(assets)) {
    for (const [name, value] of [
      ["renderBox.width", geometry.renderBox.width],
      ["renderBox.height", geometry.renderBox.height],
      ["footprint.width", geometry.footprint?.width],
      ["footprint.depth", geometry.footprint?.depth],
    ] as const) {
      if (value !== undefined && (!Number.isInteger(value) || value < 1)) {
        issues.push(`${assetId}.${name} must be a positive integer`);
      }
    }
  }
  const allIds = [
    ...map.workstations.map((station) => `workstation:${station.id}`),
    ...map.objects.map((object) => `object:${object.id}`),
    ...map.pois.map((poi) => `poi:${poi.id}`),
  ];
  const rawIds = allIds.map((entry) => entry.slice(entry.indexOf(":") + 1));
  if (new Set(rawIds).size !== rawIds.length) issues.push("map entity identifiers must be unique");
  const occupied: Array<{ id: string; rect: OfficeRectangle }> = map.workstations.map((station) => ({
    id: `workstation:${station.id}`,
    rect: {
      x: station.collision.x,
      y: station.collision.y,
      width: station.collision.width,
      height: station.collision.height,
    },
  }));

  for (const object of resolved.objects) {
    const geometry = assets[object.asset];
    if (!geometry) continue;
    if (object.support === "floor" && !geometry.footprint) {
      issues.push(`${object.id}: floor object has no footprint`);
      continue;
    }
    if (!geometry.footprint || object.support !== "floor") continue;
    const rect = footprintRectangle(object, object.anchor, geometry.footprint);
    if (rect.x < 0 || rect.y < 0 || rect.x + rect.width > map.width || rect.y + rect.height > map.height) {
      issues.push(`${object.id}: footprint leaves map bounds`);
    }
    occupied.push({ id: object.id, rect });
  }

  for (let left = 0; left < occupied.length; left += 1) {
    for (let right = left + 1; right < occupied.length; right += 1) {
      const a = occupied[left]!;
      const b = occupied[right]!;
      if (rectanglesOverlap(a.rect, b.rect)) issues.push(`${a.id} overlaps ${b.id}`);
    }
  }

  for (const item of occupied) {
    for (const route of map.routes) {
      if (rectanglesOverlap(item.rect, route)) {
        issues.push(`${item.id} blocks protected route ${route.id}`);
      }
    }
  }

  for (const poi of map.pois) {
    if (poi.capacity < 1) issues.push(`${poi.id}: capacity must be positive`);
    if (!poi.slots || poi.slots.length < poi.capacity) {
      issues.push(`${poi.id}: capacity exceeds declared interaction slots`);
    }
    const uniqueSlots = new Set((poi.slots ?? []).map((slot) => `${slot.x}:${slot.y}`));
    if (poi.slots && uniqueSlots.size !== poi.slots.length) {
      issues.push(`${poi.id}: interaction slots must be unique`);
    }
    for (const point of [poi.point, ...(poi.slots ?? [])]) {
      if (point.x < 0 || point.y < 0 || point.x > map.width || point.y > map.height) {
        issues.push(`${poi.id}: interaction point leaves map bounds`);
      }
    }
  }

  const nodeIds = new Set(map.navigation.nodes.map((node) => node.id));
  const adjacency = new Map<string, string[]>();
  for (const [from, to] of map.navigation.edges) {
    if (!nodeIds.has(from) || !nodeIds.has(to)) {
      issues.push(`navigation edge references an unknown node: ${from} -> ${to}`);
      continue;
    }
    adjacency.set(from, [...(adjacency.get(from) ?? []), to]);
    adjacency.set(to, [...(adjacency.get(to) ?? []), from]);
  }
  const start = map.workstations[0]?.navNode;
  const reachable = new Set<string>();
  if (start && nodeIds.has(start)) {
    const queue = [start];
    reachable.add(start);
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const next of adjacency.get(current) ?? []) {
        if (reachable.has(next)) continue;
        reachable.add(next);
        queue.push(next);
      }
    }
  }
  for (const destination of [
    ...map.workstations.map((station) => ({ id: station.id, node: station.navNode })),
    ...map.pois.map((poi) => ({ id: poi.id, node: poi.navNode })),
  ]) {
    if (!nodeIds.has(destination.node)) issues.push(`${destination.id}: unknown navigation node ${destination.node}`);
    else if (!reachable.has(destination.node)) issues.push(`${destination.id}: navigation node is unreachable`);
  }
  return issues;
}
