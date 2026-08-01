import type {
  DefinitionBundleDocument,
  EntityDefinitionDocument,
  EntityInstanceDocument,
  GeometryDocument,
  RenderPartReference,
} from "@affiliate-ops/office-v2-contracts";

export type WorldReferenceDiagnosticCode =
  | "contract.reference-latest-forbidden"
  | "contract.reference-version-missing"
  | "world.asset-occupancy-forbidden"
  | "world.geometry-authority-violation"
  | "world.geometry-conflict"
  | "world.geometry-rotation-invalid"
  | "world.orientation-unsupported"
  | "world.socket-duplicate"
  | "world.use-slot-duplicate"
  | "world.reference-duplicate"
  | "world.reference-kind-mismatch"
  | "world.reference-missing"
  | "world.reference-version-mismatch"
  | "world.render-attachment-cycle";

export interface WorldReferenceDiagnostic {
  readonly code: WorldReferenceDiagnosticCode;
  readonly owner: "world" | "contract";
  readonly version: 1;
  readonly message: string;
  readonly context: Readonly<Record<string, unknown>>;
}

export interface ReferenceGraphNode {
  readonly key: string;
  readonly kind: string;
  readonly value: string;
  readonly version: number;
  readonly source: string;
}

export interface ReferenceGraphEdge {
  readonly from: string;
  readonly to: string;
  readonly relation: string;
  readonly pointer: string;
}

export interface ReferenceClosureResult {
  readonly ok: boolean;
  readonly diagnostics: readonly WorldReferenceDiagnostic[];
  readonly nodes: readonly ReferenceGraphNode[];
  readonly edges: readonly ReferenceGraphEdge[];
}

interface ParsedReference {
  readonly kind: string;
  readonly value: string;
  readonly version: number;
  readonly key: string;
}

interface MutableGraph {
  readonly diagnostics: WorldReferenceDiagnostic[];
  readonly nodes: Map<string, ReferenceGraphNode>;
  readonly versions: Map<string, Set<number>>;
  readonly edges: ReferenceGraphEdge[];
}

type UnknownReference = {
  readonly id?: { readonly kind?: unknown; readonly value?: unknown };
  readonly version?: unknown;
};

const expectedKinds: Readonly<Record<string, string>> = {
  animationClipRefs: "animation-clip",
  animationSetRefs: "animation-set",
  assetFamilyRefs: "asset-family",
  characterProfileRefs: "character-profile",
  connectivityFamilyRefs: "connectivity-family",
  connectivityVariantRefs: "connectivity-variant",
  interactionRefs: "interaction",
  renderPartRefs: "render-part",
  socketRefs: "socket",
  useSlotRefs: "use-slot",
};

function keyFor(kind: string, value: string, version: number): string {
  return `${kind}:${value}@${version}`;
}

function identifierKey(kind: string, value: string): string {
  return `${kind}:${value}`;
}

function addDiagnostic(
  graph: MutableGraph,
  code: WorldReferenceDiagnosticCode,
  message: string,
  context: Readonly<Record<string, unknown>>,
): void {
  graph.diagnostics.push({
    code,
    owner: code.startsWith("contract.") ? "contract" : "world",
    version: 1,
    message,
    context,
  });
}

function parseReference(
  graph: MutableGraph,
  reference: UnknownReference,
  expectedKind: string,
  pointer: string,
): ParsedReference | null {
  const kind = reference?.id?.kind;
  const value = reference?.id?.value;
  const version = reference?.version;
  if (version === "latest") {
    addDiagnostic(graph, "contract.reference-latest-forbidden", "A reference cannot use latest.", { pointer });
    return null;
  }
  if (!Number.isSafeInteger(version) || Number(version) < 1) {
    addDiagnostic(graph, "contract.reference-version-missing", "A reference must carry a positive integer version.", { pointer });
    return null;
  }
  if (kind !== expectedKind || typeof value !== "string") {
    addDiagnostic(graph, "world.reference-kind-mismatch", "A reference ID kind does not match its declared family.", {
      pointer,
      expectedKind,
      actualKind: kind ?? null,
    });
    return null;
  }
  return {
    kind,
    value,
    version: Number(version),
    key: keyFor(kind, value, Number(version)),
  };
}

function declareNode(
  graph: MutableGraph,
  reference: UnknownReference,
  expectedKind: string,
  source: string,
): ParsedReference | null {
  const parsed = parseReference(graph, reference, expectedKind, source);
  if (!parsed) return null;
  const identifier = identifierKey(parsed.kind, parsed.value);
  const versions = graph.versions.get(identifier) ?? new Set<number>();
  versions.add(parsed.version);
  graph.versions.set(identifier, versions);
  if (graph.nodes.has(parsed.key)) {
    addDiagnostic(graph, "world.reference-duplicate", "A versioned graph key occurs more than once.", {
      pointer: source,
      key: parsed.key,
    });
  } else {
    graph.nodes.set(parsed.key, {
      key: parsed.key,
      kind: parsed.kind,
      value: parsed.value,
      version: parsed.version,
      source,
    });
  }
  return parsed;
}

function targetForNestedId(
  graph: MutableGraph,
  id: { readonly kind?: unknown; readonly value?: unknown },
  expectedKind: string,
  relation: string,
  pointer: string,
): ParsedReference | null {
  if (id.kind !== expectedKind || typeof id.value !== "string") {
    addDiagnostic(graph, "world.reference-kind-mismatch", "A nested geometry ID does not match its relation.", {
      pointer,
      relation,
      expectedKind,
      actualKind: id.kind ?? null,
    });
    return null;
  }
  const matches = [...graph.nodes.values()]
    .filter((node) => node.kind === expectedKind && node.value === id.value)
    .sort((left, right) => left.version - right.version);
  if (matches.length === 0) {
    addDiagnostic(graph, "world.reference-missing", "A nested geometry reference has no bundle record.", {
      pointer,
      relation,
      kind: expectedKind,
      value: id.value,
    });
    return null;
  }
  if (matches.length > 1) {
    addDiagnostic(graph, "world.reference-version-mismatch", "A nested geometry ID resolves to multiple versions.", {
      pointer,
      relation,
      kind: expectedKind,
      value: id.value,
      versions: matches.map(({ version }) => version),
    });
    return null;
  }
  const first = matches[0];
  if (!first) return null;
  return {
    kind: first.kind,
    value: first.value,
    version: first.version,
    key: first.key,
  };
}

function connect(
  graph: MutableGraph,
  from: string,
  reference: UnknownReference,
  expectedKind: string,
  relation: string,
  pointer: string,
): void {
  const parsed = parseReference(graph, reference, expectedKind, pointer);
  if (!parsed) return;
  if (!graph.nodes.has(parsed.key)) {
    const versions = graph.versions.get(identifierKey(parsed.kind, parsed.value));
    const code = versions?.size ? "world.reference-version-mismatch" : "world.reference-missing";
    addDiagnostic(graph, code, code === "world.reference-missing"
      ? "A declared reference has no matching bundle record."
      : "A consumer asks for a different version than the authoritative record.", {
      pointer,
      from,
      relation,
      key: parsed.key,
      availableVersions: versions ? [...versions].sort((left, right) => left - right) : [],
    });
    return;
  }
  graph.edges.push({ from, to: parsed.key, relation, pointer });
}

function addReferenceSetNodes(graph: MutableGraph, references: Record<string, readonly UnknownReference[]>): void {
  for (const [field, expectedKind] of Object.entries(expectedKinds)) {
    for (const [index, reference] of (references[field] ?? []).entries()) {
      declareNode(graph, reference, expectedKind, `/references/${field}/${index}`);
    }
  }
}

function validateRenderCycles(graph: MutableGraph): void {
  const adjacency = new Map<string, string[]>();
  for (const edge of graph.edges) {
    if (edge.relation !== "render-parent" && edge.relation !== "render-dependency") continue;
    const targets = adjacency.get(edge.from) ?? [];
    targets.push(edge.to);
    adjacency.set(edge.from, targets);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const walk = (key: string, path: readonly string[]): void => {
    if (visiting.has(key)) {
      addDiagnostic(graph, "world.render-attachment-cycle", "Render-part attachment dependencies must be acyclic.", {
        cycle: [...path, key],
      });
      return;
    }
    if (visited.has(key)) return;
    visiting.add(key);
    for (const target of (adjacency.get(key) ?? []).slice().sort()) walk(target, [...path, key]);
    visiting.delete(key);
    visited.add(key);
  };
  for (const key of [...adjacency.keys()].sort()) walk(key, []);
}

function resultFor(graph: MutableGraph): ReferenceClosureResult {
  const diagnostics = graph.diagnostics.slice().sort((left, right) => (
    left.code.localeCompare(right.code)
    || String(left.context.pointer ?? "").localeCompare(String(right.context.pointer ?? ""))
  ));
  const nodes = [...graph.nodes.values()].sort((left, right) => left.key.localeCompare(right.key));
  const edges = graph.edges.slice().sort((left, right) => (
    left.from.localeCompare(right.from)
    || left.to.localeCompare(right.to)
    || left.relation.localeCompare(right.relation)
    || left.pointer.localeCompare(right.pointer)
  ));
  return { ok: diagnostics.length === 0, diagnostics, nodes, edges };
}

function geometryDocuments(bundle: DefinitionBundleDocument): readonly GeometryDocument[] {
  return bundle.geometries as readonly GeometryDocument[];
}

function entityDefinitionDocuments(bundle: DefinitionBundleDocument): readonly EntityDefinitionDocument[] {
  return bundle.entityDefinitions as readonly EntityDefinitionDocument[];
}

function entityInstanceDocuments(bundle: DefinitionBundleDocument): readonly EntityInstanceDocument[] {
  return bundle.entityInstances as readonly EntityInstanceDocument[];
}

/** Validate one immutable bundle and return its stable, order-independent reference graph. */
export function validateDefinitionBundle(bundle: DefinitionBundleDocument): ReferenceClosureResult {
  const graph: MutableGraph = {
    diagnostics: [],
    nodes: new Map(),
    versions: new Map(),
    edges: [],
  };
  const bundleReference = declareNode(graph, bundle.bundle, "definition-bundle", "/bundle");
  const geometryRefs = new Map<string, GeometryDocument>();
  const definitionRefs = new Map<string, EntityDefinitionDocument>();

  for (const [index, geometry] of geometryDocuments(bundle).entries()) {
    const parsed = declareNode(graph, geometry.geometry, "geometry", `/geometries/${index}/geometry`);
    if (parsed) geometryRefs.set(parsed.key, geometry);
  }
  for (const [index, definition] of entityDefinitionDocuments(bundle).entries()) {
    const parsed = declareNode(graph, definition.definition, "entity-definition", `/entityDefinitions/${index}/definition`);
    if (parsed) definitionRefs.set(parsed.key, definition);
  }
  for (const [index, instance] of entityInstanceDocuments(bundle).entries()) {
    declareNode(graph, instance.instance, "entity-instance", `/entityInstances/${index}/instance`);
  }
  addReferenceSetNodes(graph, bundle.references as unknown as Record<string, readonly UnknownReference[]>);

  if (bundleReference) {
    for (const [index, definition] of entityDefinitionDocuments(bundle).entries()) {
      const from = keyFor("entity-definition", definition.definition.id.value, definition.definition.version);
      connect(graph, from, definition.geometry, "geometry", "geometry", `/entityDefinitions/${index}/geometry`);
      for (const [field, expectedKind] of Object.entries(expectedKinds)) {
        const refs = (definition as unknown as Record<string, readonly UnknownReference[]>)[field] ?? [];
        for (const [refIndex, reference] of refs.entries()) {
          connect(graph, from, reference, expectedKind, field, `/entityDefinitions/${index}/${field}/${refIndex}`);
        }
      }
    }
    for (const [index, instance] of entityInstanceDocuments(bundle).entries()) {
      const from = keyFor("entity-instance", instance.instance.id.value, instance.instance.version);
      connect(graph, from, instance.definition, "entity-definition", "definition", `/entityInstances/${index}/definition`);
      const definition = definitionRefs.get(instance.definition.id.kind === "entity-definition"
        ? keyFor("entity-definition", instance.definition.id.value, instance.definition.version)
        : "");
      if (definition) {
        const geometryKey = keyFor("geometry", definition.geometry.id.value, definition.geometry.version);
        const geometry = geometryRefs.get(geometryKey);
        if (geometry && !geometry.supportedOrientations.includes(instance.orientation)) {
          addDiagnostic(graph, "world.orientation-unsupported", "An instance requests an undeclared geometry orientation.", {
            pointer: `/entityInstances/${index}/orientation`,
            orientation: instance.orientation,
            geometry: geometryKey,
          });
        }
      }
    }
    for (const [geometryIndex, geometry] of geometryDocuments(bundle).entries()) {
      const from = keyFor("geometry", geometry.geometry.id.value, geometry.geometry.version);
      for (const [socketIndex, socket] of geometry.sockets.entries()) {
        const target = targetForNestedId(graph, socket.id, "socket", "socket", `/geometries/${geometryIndex}/sockets/${socketIndex}/id`);
        if (target) graph.edges.push({ from, to: target.key, relation: "socket", pointer: `/geometries/${geometryIndex}/sockets/${socketIndex}/id` });
      }
      for (const [slotIndex, slot] of geometry.useSlots.entries()) {
        const slotTarget = targetForNestedId(graph, slot.id, "use-slot", "use-slot", `/geometries/${geometryIndex}/useSlots/${slotIndex}/id`);
        if (slotTarget) graph.edges.push({ from, to: slotTarget.key, relation: "use-slot", pointer: `/geometries/${geometryIndex}/useSlots/${slotIndex}/id` });
        const socketTarget = targetForNestedId(graph, slot.actorSocket, "socket", "actor-socket", `/geometries/${geometryIndex}/useSlots/${slotIndex}/actorSocket`);
        if (socketTarget) graph.edges.push({ from, to: socketTarget.key, relation: "actor-socket", pointer: `/geometries/${geometryIndex}/useSlots/${slotIndex}/actorSocket` });
        if (slot.heldPropSocket) {
          const heldTarget = targetForNestedId(graph, slot.heldPropSocket, "socket", "held-prop-socket", `/geometries/${geometryIndex}/useSlots/${slotIndex}/heldPropSocket`);
          if (heldTarget) graph.edges.push({ from, to: heldTarget.key, relation: "held-prop-socket", pointer: `/geometries/${geometryIndex}/useSlots/${slotIndex}/heldPropSocket` });
        }
      }
    }
  }
  return resultFor(graph);
}

export interface RenderPartDependency {
  readonly id: RenderPartReference;
  readonly parent?: RenderPartReference;
  readonly dependencies?: readonly RenderPartReference[];
}

/** Validate the presentation-only render-part DAG without granting it geometry authority. */
export function validateRenderPartDependencies(parts: readonly RenderPartDependency[]): ReferenceClosureResult {
  const graph: MutableGraph = { diagnostics: [], nodes: new Map(), versions: new Map(), edges: [] };
  for (const [index, part] of parts.entries()) {
    declareNode(graph, part.id, "render-part", `/renderParts/${index}/id`);
  }
  for (const [index, part] of parts.entries()) {
    const from = keyFor("render-part", part.id.id.value, part.id.version);
    if (part.parent) {
      connect(graph, from, part.parent, "render-part", "render-parent", `/renderParts/${index}/parent`);
    }
    for (const [dependencyIndex, dependency] of (part.dependencies ?? []).entries()) {
      connect(graph, from, dependency, "render-part", "render-dependency", `/renderParts/${index}/dependencies/${dependencyIndex}`);
    }
  }
  validateRenderCycles(graph);
  return resultFor(graph);
}
