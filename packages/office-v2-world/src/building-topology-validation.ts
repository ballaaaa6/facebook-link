import type {
  BuildingReference,
  FloorLocalCellPosition,
  FloorReference,
} from "@affiliate-ops/office-v2-contracts";

export type BuildingTopologyDiagnosticCode =
  | "contract.migration-context-missing"
  | "contract.migration-reference-conflict"
  | "world.elevation-floor-inference"
  | "world.exterior-interior-overlap"
  | "world.floor-duplicate"
  | "world.portal-direction-mismatch"
  | "world.portal-duplicate"
  | "world.portal-endpoint-duplicate"
  | "world.portal-endpoint-missing"
  | "world.portal-endpoint-out-of-bounds"
  | "world.portal-floor-mismatch"
  | "world.portal-floor-missing"
  | "world.portal-landing-missing"
  | "world.portal-site-mismatch";

export interface BuildingTopologyDiagnostic {
  readonly code: BuildingTopologyDiagnosticCode;
  readonly owner: "world" | "contract";
  readonly version: 1;
  readonly message: string;
  readonly context: Readonly<Record<string, unknown>>;
}

export interface SiteCell {
  readonly space: "site-cell";
  readonly x: number;
  readonly y: number;
}

export interface TopologyBounds {
  readonly width: number;
  readonly depth: number;
  readonly maxElevation: number;
}

export interface VersionedSlugReference {
  readonly id: string;
  readonly version: number;
}

export interface SiteEnvelopeDocument extends VersionedSlugReference {
  readonly presentationOnly: true;
  readonly contextKinds: readonly string[];
  readonly contextCells: readonly {
    readonly kind: string;
    readonly coordinate: SiteCell;
  }[];
}

export interface FloorTopologyDocument {
  readonly floor: FloorReference;
  readonly world: VersionedSlugReference;
  readonly coordinateSpace: "floor-local";
  readonly bounds: TopologyBounds;
  readonly siteFootprint: readonly SiteCell[];
  readonly identitySource: "declared" | "elevation";
}

export interface PortalEndpointDocument extends VersionedSlugReference {
  readonly ownerKind: "floor" | "site";
  readonly floor?: FloorReference;
  readonly site?: VersionedSlugReference;
  readonly coordinate?: FloorLocalCellPosition;
  readonly siteCoordinate?: SiteCell;
}

export interface PortalDocument extends VersionedSlugReference {
  readonly kind: "entrance" | "vertical";
  readonly ownerFloor: FloorReference;
  readonly direction: "inbound" | "outbound" | "bidirectional";
  readonly endpoint?: PortalEndpointDocument;
  readonly landing?: PortalEndpointDocument;
}

export interface MigrationContextDocument {
  readonly building?: BuildingReference;
  readonly floor?: FloorReference;
  readonly siteEnvelope?: VersionedSlugReference;
  readonly bounds?: TopologyBounds;
  readonly portalContext?: boolean;
}

export interface BuildingMigrationDocument {
  readonly sourceSchema: "office-world-v1" | "office-structure-v1";
  readonly context?: MigrationContextDocument;
}

export interface BuildingTopologyDocument {
  readonly schemaVersion: "office-building-topology-v1";
  readonly building: BuildingReference;
  readonly siteEnvelope: SiteEnvelopeDocument;
  readonly floors: readonly FloorTopologyDocument[];
  readonly portals: readonly PortalDocument[];
  readonly migration?: BuildingMigrationDocument;
}

export interface BuildingTopologyResult {
  readonly ok: boolean;
  readonly diagnostics: readonly BuildingTopologyDiagnostic[];
  readonly floorKeys: readonly string[];
  readonly worldKeys: readonly string[];
  readonly portalKeys: readonly string[];
  readonly endpointKeys: readonly string[];
}

interface FloorRecord {
  readonly document: FloorTopologyDocument;
  readonly index: number;
  readonly key: string;
}

function referenceKey(reference: unknown): string | null {
  if (!reference || typeof reference !== "object") return null;
  const candidate = reference as { id?: { kind?: unknown; value?: unknown }; version?: unknown };
  if (typeof candidate.id?.kind !== "string" || typeof candidate.id.value !== "string" || typeof candidate.version !== "number") return null;
  return `${candidate.id.kind}:${candidate.id.value}@${candidate.version}`;
}

function identityKey(reference: unknown): string | null {
  if (!reference || typeof reference !== "object") return null;
  const candidate = reference as { id?: { kind?: unknown; value?: unknown } };
  if (typeof candidate.id?.kind !== "string" || typeof candidate.id.value !== "string") return null;
  return `${candidate.id.kind}:${candidate.id.value}`;
}

function versionedSlugKey(reference: unknown): string | null {
  if (!reference || typeof reference !== "object") return null;
  const candidate = reference as { id?: unknown; version?: unknown };
  return typeof candidate.id === "string" && typeof candidate.version === "number"
    ? `${candidate.id}@${candidate.version}`
    : null;
}

function siteKey(cell: SiteCell): string {
  return `${cell.x},${cell.y}`;
}

function cellKey(position: FloorLocalCellPosition): string {
  return `${referenceKey(position.floor) ?? "invalid-floor"}:${position.coordinate.x},${position.coordinate.y},${position.coordinate.elevation}`;
}

function sameReference(left: unknown, right: unknown): boolean {
  return referenceKey(left) !== null && referenceKey(left) === referenceKey(right);
}

function sameBounds(left: TopologyBounds | undefined, right: TopologyBounds | undefined): boolean {
  return left?.width === right?.width
    && left?.depth === right?.depth
    && left?.maxElevation === right?.maxElevation;
}

function diagnostic(
  code: BuildingTopologyDiagnosticCode,
  message: string,
  context: Readonly<Record<string, unknown>>,
): BuildingTopologyDiagnostic {
  return {
    code,
    owner: code.startsWith("contract.") ? "contract" : "world",
    version: 1,
    message,
    context,
  };
}

function sortDiagnostics(diagnostics: readonly BuildingTopologyDiagnostic[]): readonly BuildingTopologyDiagnostic[] {
  return diagnostics.slice().sort((left, right) => (
    left.code.localeCompare(right.code)
    || String(left.context.pointer ?? "").localeCompare(String(right.context.pointer ?? ""))
    || JSON.stringify(left.context).localeCompare(JSON.stringify(right.context))
  ));
}

function validateMigration(
  document: BuildingTopologyDocument,
  diagnostics: BuildingTopologyDiagnostic[],
): void {
  const migration = document.migration;
  if (!migration) return;
  const context = migration.context;
  const missing = [
    ["building", context?.building],
    ["floor", context?.floor],
    ["siteEnvelope", context?.siteEnvelope],
    ["bounds", context?.bounds],
    ["portalContext", context?.portalContext],
  ].filter(([, value]) => value === undefined).map(([name]) => name);
  if (missing.length > 0) {
    diagnostics.push(diagnostic(
      "contract.migration-context-missing",
      "A V1 topology migration requires explicit building, floor, site, bounds, and portal context.",
      { pointer: "/migration/context", sourceSchema: migration.sourceSchema, missing },
    ));
    return;
  }
  const floor = document.floors.find((entry) => sameReference(entry.floor, context?.floor));
  if (!sameReference(document.building, context?.building)
    || context?.siteEnvelope?.id !== document.siteEnvelope.id
    || context?.siteEnvelope?.version !== document.siteEnvelope.version
    || !floor
    || !sameBounds(floor.bounds, context?.bounds)
    || context?.portalContext !== true) {
    diagnostics.push(diagnostic(
      "contract.migration-reference-conflict",
      "V1 topology migration context disagrees with the explicit topology envelope.",
      { pointer: "/migration/context", sourceSchema: migration.sourceSchema },
    ));
  }
}

function validateFloorEndpoint(
  endpoint: PortalEndpointDocument,
  pointer: string,
  floors: ReadonlyMap<string, FloorRecord>,
  site: SiteEnvelopeDocument,
  diagnostics: BuildingTopologyDiagnostic[],
): void {
  if (endpoint.ownerKind === "floor") {
    const floorKey = referenceKey(endpoint.floor);
    const floor = floorKey ? floors.get(floorKey) : undefined;
    if (!floor || !endpoint.floor) {
      diagnostics.push(diagnostic("world.portal-floor-missing", "A floor portal endpoint does not resolve to a declared floor.", { pointer: `${pointer}/floor`, floor: endpoint.floor ?? null }));
      return;
    }
    if (!endpoint.coordinate) {
      diagnostics.push(diagnostic("world.portal-floor-missing", "A floor portal endpoint has no floor-local coordinate.", { pointer: `${pointer}/coordinate`, floor: floorKey }));
      return;
    }
    if (!sameReference(endpoint.coordinate.floor, endpoint.floor)) {
      diagnostics.push(diagnostic("world.portal-floor-mismatch", "A portal endpoint coordinate names a different floor than its owner.", { pointer: `${pointer}/coordinate/floor`, endpointFloor: floorKey, coordinateFloor: referenceKey(endpoint.coordinate.floor) }));
    }
    const { x, y, elevation } = endpoint.coordinate.coordinate;
    if (endpoint.coordinate.space !== "floor-local-cell"
      || x < 0 || y < 0 || x >= floor.document.bounds.width || y >= floor.document.bounds.depth
      || elevation < 0 || elevation > floor.document.bounds.maxElevation) {
      diagnostics.push(diagnostic("world.portal-endpoint-out-of-bounds", "A floor portal endpoint is outside its floor-local bounds.", {
        pointer: `${pointer}/coordinate`,
        floor: floorKey,
        coordinate: endpoint.coordinate.coordinate,
        bounds: floor.document.bounds,
      }));
    }
    return;
  }
  if (endpoint.ownerKind === "site") {
    if (!endpoint.site || endpoint.site.id !== site.id || endpoint.site.version !== site.version) {
      diagnostics.push(diagnostic("world.portal-site-mismatch", "A site portal endpoint does not reference the building site envelope.", { pointer: `${pointer}/site`, site: endpoint.site ?? null }));
    }
    if (!endpoint.siteCoordinate || endpoint.siteCoordinate.space !== "site-cell") {
      diagnostics.push(diagnostic("world.portal-site-mismatch", "A site portal endpoint has no site-cell coordinate.", { pointer: `${pointer}/siteCoordinate` }));
    }
  }
}

function validatePortal(
  portal: PortalDocument,
  index: number,
  floors: ReadonlyMap<string, FloorRecord>,
  site: SiteEnvelopeDocument,
  endpointIds: Set<string>,
  diagnostics: BuildingTopologyDiagnostic[],
): void {
  const pointer = `/portals/${index}`;
  const ownerFloorKey = referenceKey(portal.ownerFloor);
  if (!ownerFloorKey || !floors.has(ownerFloorKey)) {
    diagnostics.push(diagnostic("world.portal-floor-missing", "A portal owner floor is not declared by the building.", { pointer: `${pointer}/ownerFloor`, ownerFloor: portal.ownerFloor }));
  }
  if (!portal.endpoint) {
    diagnostics.push(diagnostic("world.portal-endpoint-missing", "A portal has no owner-side endpoint.", { pointer: `${pointer}/endpoint`, portalId: portal.id }));
  }
  if (!portal.landing) {
    diagnostics.push(diagnostic("world.portal-landing-missing", "A portal has no opposite-side landing.", { pointer: `${pointer}/landing`, portalId: portal.id }));
  }
  for (const [role, endpoint] of [["endpoint", portal.endpoint], ["landing", portal.landing]] as const) {
    if (!endpoint) continue;
    const endpointKey = `${endpoint.id}@${endpoint.version}`;
    if (endpointIds.has(endpointKey)) {
      diagnostics.push(diagnostic("world.portal-endpoint-duplicate", "A topology envelope repeats a portal endpoint identity.", { pointer: `${pointer}/${role}/id`, endpoint: endpointKey }));
    }
    endpointIds.add(endpointKey);
    validateFloorEndpoint(endpoint, `${pointer}/${role}`, floors, site, diagnostics);
  }
  if (portal.kind === "vertical" && portal.endpoint && portal.landing) {
    if (portal.direction !== "bidirectional") {
      diagnostics.push(diagnostic("world.portal-direction-mismatch", "A vertical portal must be bidirectional in topology version 1.", { pointer: `${pointer}/direction`, direction: portal.direction }));
    }
    if (portal.endpoint?.ownerKind !== "floor" || portal.landing?.ownerKind !== "floor") {
      diagnostics.push(diagnostic("world.portal-direction-mismatch", "A vertical portal must connect two floor endpoints.", { pointer, endpointKind: portal.endpoint?.ownerKind ?? null, landingKind: portal.landing?.ownerKind ?? null }));
    } else if (sameReference(portal.endpoint.floor, portal.landing.floor)) {
      diagnostics.push(diagnostic("world.portal-direction-mismatch", "A vertical portal must land on a different declared floor.", { pointer: `${pointer}/landing/floor`, floor: referenceKey(portal.endpoint.floor) }));
    }
  }
  if (portal.kind === "entrance" && portal.endpoint && portal.landing
    && (portal.endpoint.ownerKind !== "floor" || portal.landing.ownerKind !== "site")) {
    diagnostics.push(diagnostic("world.portal-direction-mismatch", "An entrance must connect its owner floor to the site envelope.", { pointer, endpointKind: portal.endpoint?.ownerKind ?? null, landingKind: portal.landing?.ownerKind ?? null }));
  }
  if (portal.endpoint?.ownerKind === "floor" && ownerFloorKey !== referenceKey(portal.endpoint.floor)) {
    diagnostics.push(diagnostic("world.portal-floor-mismatch", "A portal endpoint is not owned by the portal owner floor.", { pointer: `${pointer}/endpoint/floor`, ownerFloor: ownerFloorKey, endpointFloor: referenceKey(portal.endpoint.floor) }));
  }
}

/** Validate building/floor/site/portal topology without creating world or simulation state. */
export function validateBuildingTopology(document: BuildingTopologyDocument): BuildingTopologyResult {
  const diagnostics: BuildingTopologyDiagnostic[] = [];
  const floorRecords: FloorRecord[] = [];
  const floorIdentities = new Set<string>();
  const worldIdentities = new Set<string>();
  for (const [index, floor] of document.floors.entries()) {
    const floorIdentity = identityKey(floor.floor) ?? `invalid-floor-${index}`;
    const floorKey = referenceKey(floor.floor) ?? floorIdentity;
    if (floorIdentities.has(floorIdentity)) {
      diagnostics.push(diagnostic("world.floor-duplicate", "A building declares one floor identity more than once.", { pointer: `/floors/${index}/floor`, floor: floorKey }));
    }
    floorIdentities.add(floorIdentity);
    const worldIdentity = versionedSlugKey(floor.world) ?? `invalid-world-${index}`;
    if (worldIdentities.has(worldIdentity) && !floorIdentities.has(floorIdentity)) {
      diagnostics.push(diagnostic("world.floor-duplicate", "A building declares one floor-local world identity more than once.", { pointer: `/floors/${index}/world`, world: worldIdentity }));
    }
    worldIdentities.add(worldIdentity);
    if (floor.identitySource === "elevation") {
      diagnostics.push(diagnostic("world.elevation-floor-inference", "Floor identity cannot be inferred from elevation.", { pointer: `/floors/${index}/identitySource`, floor: floorKey }));
    }
    floorRecords.push({ document: floor, index, key: floorKey });
  }
  const floors = new Map(floorRecords.map((record) => [record.key, record]));
  const footprintByFloor = floorRecords.map((record) => ({
    record,
    cells: new Set(record.document.siteFootprint.map(siteKey)),
  }));
  for (const [contextIndex, contextCell] of document.siteEnvelope.contextCells.entries()) {
    const key = siteKey(contextCell.coordinate);
    for (const { record, cells } of footprintByFloor) {
      if (cells.has(key)) {
        diagnostics.push(diagnostic("world.exterior-interior-overlap", "Presentation-only exterior context overlaps a floor interior envelope.", {
          pointer: `/siteEnvelope/contextCells/${contextIndex}`,
          floor: record.key,
          cell: key,
        }));
      }
    }
  }
  const portalIdentities = new Set<string>();
  const endpointIdentities = new Set<string>();
  for (const [index, portal] of document.portals.entries()) {
    const portalIdentity = `${portal.id}@${portal.version}`;
    if (portalIdentities.has(portalIdentity)) {
      diagnostics.push(diagnostic("world.portal-duplicate", "A topology envelope repeats a portal identity.", { pointer: `/portals/${index}/id`, portal: portalIdentity }));
    }
    portalIdentities.add(portalIdentity);
    validatePortal(portal, index, floors, document.siteEnvelope, endpointIdentities, diagnostics);
  }
  validateMigration(document, diagnostics);
  return {
    ok: diagnostics.length === 0,
    diagnostics: sortDiagnostics(diagnostics),
    floorKeys: floorRecords.map(({ key }) => key).slice().sort(),
    worldKeys: [...worldIdentities].sort(),
    portalKeys: [...portalIdentities].sort(),
    endpointKeys: [...endpointIdentities].sort(),
  };
}

/** Return a stable key for a floor-local coordinate; its floor reference is part of identity. */
export function floorLocalCoordinateKey(position: FloorLocalCellPosition): string {
  return cellKey(position);
}
