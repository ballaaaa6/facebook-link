import { useEffect, useMemo, useRef, useState } from "react";
import { officeEngineEntryGates, officeEngineLayers } from "./foundation";
import { fitCameraToWorld, type CameraState } from "./renderer/camera.ts";
import { createCanvasRendererBackend } from "./renderer/canvas-renderer.ts";
import { createFixtureSnapshot, LAB_BOUNDS, LAB_FLOOR } from "./renderer/lab-fixture.ts";
import { createLabApi, type LabApi } from "./renderer/lab-benchmark.ts";
import { createPixiRendererBackend } from "./renderer/pixi-renderer.ts";
import { createPresentationSnapshot } from "./renderer/presentation-snapshot.ts";
import { createRendererPort, type RendererPort } from "./renderer/renderer-port.ts";
import { RendererLifecycle } from "./renderer/lifecycle.ts";
import "./officeEngineV2Lab.css";

type Candidate = "canvas-2d" | "pixijs-8.19.0";

function readCandidate(): Candidate {
  return new URLSearchParams(window.location.search).get("candidate") === "pixijs-8.19.0" ? "pixijs-8.19.0" : "canvas-2d";
}

function readActorCount(): 1 | 10 | 15 | 25 | 50 {
  const value = Number(new URLSearchParams(window.location.search).get("actors"));
  return value === 10 || value === 15 || value === 25 || value === 50 ? value : 1;
}

function cameraForHost(host: HTMLDivElement, viewport?: { readonly width: number; readonly height: number }): CameraState {
  const nextViewport = viewport ?? {
    width: Math.max(1, Math.floor(host.clientWidth || window.innerWidth)),
    height: Math.max(1, Math.floor(host.clientHeight || Math.min(520, window.innerHeight * 0.55))),
  };
  return fitCameraToWorld(LAB_FLOOR, LAB_BOUNDS, nextViewport);
}

function backendFor(candidate: Candidate) {
  return candidate === "pixijs-8.19.0" ? createPixiRendererBackend() : createCanvasRendererBackend();
}

function nextEntityId(ids: readonly string[], currentId: string | null, direction: 1 | -1): string | null {
  if (ids.length === 0) return null;
  const currentIndex = currentId === null ? -1 : ids.indexOf(currentId);
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + direction + ids.length) % ids.length;
  return ids[nextIndex] ?? ids[0] ?? null;
}

export function OfficeEngineV2LabPage() {
  const candidate = useMemo(readCandidate, []);
  const actorCount = useMemo(readActorCount, []);
  const [revision, setRevision] = useState(0);
  const [removedIds, setRemovedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [selectedId, setSelectedId] = useState<string | null>("actor-01");
  const [focusedId, setFocusedId] = useState<string | null>("actor-01");
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Mounting presentation resources");
  const hostRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const portRef = useRef<RendererPort | null>(null);
  const cameraRef = useRef<CameraState | null>(null);
  const readyRef = useRef(false);
  const snapshotBase = useMemo(() => createFixtureSnapshot(actorCount, revision), [actorCount, revision]);
  const visibleEntities = useMemo(() => snapshotBase.entities.filter((entity) => !removedIds.has(entity.entityId.value)), [removedIds, snapshotBase.entities]);
  const renderedSnapshot = useMemo(() => createPresentationSnapshot({
    ...snapshotBase,
    entities: visibleEntities.map((entity) => ({
      ...entity,
      selection: { selected: entity.entityId.value === selectedId, focused: entity.entityId.value === focusedId },
    })),
  }), [focusedId, selectedId, snapshotBase, visibleEntities]);
  const renderedSnapshotRef = useRef(renderedSnapshot);
  renderedSnapshotRef.current = renderedSnapshot;
  const qaLifecycle = useMemo(() => {
    const lifecycle = new RendererLifecycle();
    lifecycle.transition("mount");
    lifecycle.transition("show");
    return lifecycle;
  }, []);

  const selectedEntity = visibleEntities.find((entity) => entity.entityId.value === selectedId) ?? visibleEntities[0];
  const ids = visibleEntities.map((entity) => entity.entityId.value);

  useEffect(() => {
    const missingFocus = focusedId !== null && !ids.includes(focusedId);
    const missingSelection = selectedId !== null && !ids.includes(selectedId);
    if (missingFocus || missingSelection) {
      const fallback = ids[0] ?? null;
      setFocusedId(fallback);
      setSelectedId(fallback);
    }
  }, [focusedId, ids, selectedId]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const port = createRendererPort(backendFor(candidate));
    portRef.current = port;
    let active = true;
    const resize = async () => {
      const camera = cameraForHost(host);
      cameraRef.current = camera;
      await port.setCamera(camera);
    };
    void (async () => {
      try {
        await port.mount(host);
        if (!active) {
          await port.teardown();
          return;
        }
        const camera = cameraForHost(host);
        cameraRef.current = camera;
        await port.setCamera(camera);
        await port.renderSnapshot(renderedSnapshotRef.current);
        if (active) {
          readyRef.current = true;
          setReady(true);
          setStatusMessage("Ready for semantic and renderer QA");
        }
      } catch (error) {
        if (active) setStatusMessage(error instanceof Error ? error.message : "Renderer mount failed");
      }
    })();
    const onResize = () => { void resize(); };
    window.addEventListener("resize", onResize);
    return () => {
      active = false;
      window.removeEventListener("resize", onResize);
      readyRef.current = false;
      setReady(false);
      if (qaLifecycle.state !== "destroyed") qaLifecycle.transition("teardown");
      void port.teardown();
      portRef.current = null;
    };
  }, [candidate, qaLifecycle]);

  useEffect(() => {
    const port = portRef.current;
    if (!port || !ready) return;
    void port.renderSnapshot(renderedSnapshot);
  }, [ready, renderedSnapshot]);

  function selectEntity(entityId: string): void {
    if (!ids.includes(entityId)) return;
    setSelectedId(entityId);
    setFocusedId(entityId);
  }

  function onEntityKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, entityId: string): void {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (event.key === "Enter" || event.key === " ") {
      selectEntity(entityId);
      return;
    }
    const nextId = nextEntityId(ids, entityId, event.key === "ArrowDown" ? 1 : -1);
    if (!nextId) return;
    setFocusedId(nextId);
    const button = listRef.current?.querySelector(`[data-entity-id="${nextId}"]`) as HTMLButtonElement | null;
    button?.focus();
  }

  function onRendererClick(event: React.MouseEvent<HTMLDivElement>): void {
    const port = portRef.current;
    const host = hostRef.current;
    if (!port || !host) return;
    const bounds = host.getBoundingClientRect();
    const picked = port.pickSemantic({ xPx: event.clientX - bounds.left, yPx: event.clientY - bounds.top });
    if (picked) selectEntity(picked.entityId);
  }

  function refreshSnapshot(): void {
    setRemovedIds(new Set());
    setRevision((value) => value + 1);
    setStatusMessage("Snapshot refreshed; semantic focus is retained when possible");
  }

  function removeFocused(): void {
    if (!focusedId) return;
    setRemovedIds((current) => new Set([...current, focusedId]));
    setStatusMessage("Focused entity removed; focus falls forward to the next stable entity");
  }

  function toggleHidden(): void {
    if (hidden) {
      if (qaLifecycle.state === "hidden") {
        qaLifecycle.transition("pageshow");
        qaLifecycle.transition("bfcache-restore");
      }
      setHidden(false);
      setStatusMessage("Renderer resumed after hidden/page restore");
    } else {
      if (qaLifecycle.state === "visible") qaLifecycle.transition("hide");
      setHidden(true);
      setStatusMessage("Renderer hidden; semantic inspector remains available");
    }
  }

  async function recoverContext(): Promise<void> {
    const port = portRef.current;
    if (!port) return;
    if (qaLifecycle.state === "visible") qaLifecycle.transition("context-lost");
    await port.handleContextLoss();
    if (qaLifecycle.state === "restoring") qaLifecycle.transition("context-restored");
    setStatusMessage("Context recovery rendered the latest immutable snapshot");
  }

  async function remountRenderer(): Promise<void> {
    const port = portRef.current;
    const host = hostRef.current;
    if (!port || !host) return;
    if (qaLifecycle.state !== "destroyed") {
      qaLifecycle.transition("teardown");
      await port.teardown();
    }
    qaLifecycle.transition("remount");
    await port.remount(host);
    qaLifecycle.transition("show");
    const camera = cameraForHost(host);
    cameraRef.current = camera;
    await port.setCamera(camera);
    await port.renderSnapshot(renderedSnapshotRef.current);
    setReady(true);
    readyRef.current = true;
    setStatusMessage("Renderer remounted with zero prior presentation resources");
  }

  useEffect(() => {
    const api: LabApi = createLabApi({
      candidate,
      actorCount,
      portRef,
      hostRef,
      cameraRef,
      readyRef,
      renderedSnapshotRef,
      getState: () => Object.freeze({ candidate, actorCount, ready: readyRef.current, selectedId, focusedId, lifecycle: portRef.current?.lifecycleSnapshot() ?? null, qaLifecycle: qaLifecycle.snapshot(), diagnostics: portRef.current?.diagnostics() ?? [] }),
    });
    (window as Window & { __officeV2Lab?: LabApi }).__officeV2Lab = api;
    return () => {
      const current = (window as Window & { __officeV2Lab?: LabApi }).__officeV2Lab;
      if (current === api) delete (window as Window & { __officeV2Lab?: LabApi }).__officeV2Lab;
    };
  }, [actorCount, candidate, focusedId, qaLifecycle, selectedId]);

  return (
    <main className="engine-lab" data-engine="office-v2" data-assets="none" data-renderer-candidate={candidate} data-actor-count={actorCount}>
      <header className="engine-lab__header">
        <div>
          <span>Clean-room renderer evidence lab</span>
          <h1>Office Engine V2</h1>
          <p>One immutable snapshot, one synthetic geometric scene, two renderer candidates, and one semantic inspector.</p>
        </div>
        <a href="/">Return to Office</a>
      </header>

      <section className="engine-lab__controls" aria-label="Renderer QA controls">
        <label>Candidate
          <select data-testid="candidate-select" value={candidate} onChange={(event) => { window.location.search = `?lab=office-engine-v2&candidate=${event.target.value}&actors=${actorCount}`; }}>
            <option value="canvas-2d">Canvas 2D</option>
            <option value="pixijs-8.19.0">PixiJS 8.19.0</option>
          </select>
        </label>
        <label>Actor profile
          <select data-testid="actor-select" value={actorCount} onChange={(event) => { window.location.search = `?lab=office-engine-v2&candidate=${candidate}&actors=${event.target.value}`; }}>
            {[1, 10, 15, 25, 50].map((value) => <option value={value} key={value}>{value} actors</option>)}
          </select>
        </label>
        <span className={`engine-lab__ready ${ready ? "is-ready" : ""}`} data-testid="renderer-ready">{ready ? "Ready" : "Mounting"}</span>
        <span className="engine-lab__status" role="status">{statusMessage}</span>
      </section>

      <section className="engine-lab__workspace" aria-label="Renderer and semantic inspector">
        <div className={`engine-lab__viewport ${hidden ? "is-hidden" : ""}`} ref={hostRef} onClick={onRendererClick} data-testid="renderer-host" aria-label={`${candidate} renderer viewport`} />
        <aside className="engine-lab__inspector" aria-label="Semantic inspector" data-testid="semantic-inspector">
          <span className="engine-lab__eyebrow">Inspector</span>
          <h2>{selectedEntity?.label ?? "No entity selected"}</h2>
          {selectedEntity ? <>
            <p className="engine-lab__inspector-id">{selectedEntity.entityId.value}</p>
            <dl>
              <div><dt>State</dt><dd data-testid="inspector-state">{selectedEntity.semanticState}</dd></div>
              <div><dt>Freshness</dt><dd>{selectedEntity.freshness}</dd></div>
              <div><dt>Selection</dt><dd>{selectedId === selectedEntity.entityId.value ? "selected" : "available"}</dd></div>
            </dl>
          </> : <p>Select an entity from the semantic list.</p>}
        </aside>
      </section>

      <section className="engine-lab__semantic" aria-label="Semantic entity tree">
        <div className="engine-lab__semantic-header"><div><span className="engine-lab__eyebrow">Accessible source of truth</span><h2>Entities</h2></div><span>{visibleEntities.length}/{snapshotBase.entities.length} visible</span></div>
        <div className="engine-lab__entity-list" role="listbox" aria-label="Office entities" ref={listRef}>
          {visibleEntities.map((entity) => <button
            type="button"
            role="option"
            key={entity.entityId.value}
            data-entity-id={entity.entityId.value}
            data-state={entity.semanticState}
            data-freshness={entity.freshness}
            aria-selected={selectedId === entity.entityId.value}
            aria-label={`${entity.label}; ${entity.semanticState}; ${entity.freshness}`}
            aria-disabled={entity.freshness === "unavailable"}
            tabIndex={focusedId === entity.entityId.value ? 0 : -1}
            onFocus={() => setFocusedId(entity.entityId.value)}
            onClick={() => selectEntity(entity.entityId.value)}
            onKeyDown={(event) => onEntityKeyDown(event, entity.entityId.value)}
          ><span className="engine-lab__entity-dot" aria-hidden="true" /> <span>{entity.label}</span><small>{entity.semanticState} · {entity.freshness}</small></button>)}
        </div>
      </section>

      <section className="engine-lab__actions" aria-label="Lifecycle and snapshot actions">
        <button type="button" onClick={refreshSnapshot}>Refresh snapshot</button>
        <button type="button" onClick={removeFocused} disabled={!focusedId}>Remove focused</button>
        <button type="button" onClick={toggleHidden}>{hidden ? "Resume renderer" : "Hide renderer"}</button>
        <button type="button" onClick={() => void recoverContext()}>Recover context</button>
        <button type="button" onClick={() => void remountRenderer()}>Teardown and remount</button>
      </section>

      <section className="engine-lab__gates">
        <div><span>Build order</span><h2>Entry gates</h2></div>
        <ol>{officeEngineEntryGates.map((gate) => <li key={gate}>{gate}</li>)}</ol>
      </section>
      <section className="engine-lab__grid" aria-label="Engine boundaries">
        {officeEngineLayers.map((layer, index) => <article key={layer.id}><span>{String(index + 1).padStart(2, "0")}</span><h2>{layer.title}</h2><p>{layer.responsibility}</p></article>)}
      </section>
    </main>
  );
}
