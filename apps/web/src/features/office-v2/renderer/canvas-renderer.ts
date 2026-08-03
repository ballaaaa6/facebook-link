import type { PresentationSnapshotDocument } from "@affiliate-ops/office-v2-contracts";
import {
  buildSyntheticScene,
  deterministicPayloadHash,
  syntheticSceneStateColor,
  type SyntheticSceneCommand,
} from "./candidate-scene.ts";
import { pickSemanticEntity, type SemanticPickResult } from "./semantic-picking.ts";
import type { CameraState, ScreenPoint } from "./camera.ts";
import type {
  RendererBackend,
  RendererBundle,
  RendererBundleResource,
  RendererCapture,
  RendererDiagnostic,
} from "./renderer-port.ts";

export const CANVAS_RENDERER_REVISION = "canvas-2d-v1" as const;

const BACKGROUND = "#0d1715";
const FLOOR_FILL = "#18302d";
const FLOOR_STROKE = "#568276";
const TEXT_COLOR = "#e8f0ec";

function sizeValue(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && value !== undefined && value > 0 ? Math.max(1, Math.floor(value)) : fallback;
}

function bundleKey(bundle: Pick<RendererBundle, "bundleId" | "version">): string {
  return `${bundle.bundleId}@${bundle.version}`;
}

/** Canvas 2D candidate. It owns only DOM/canvas presentation resources. */
export class CanvasRendererBackend implements RendererBackend {
  private canvas: HTMLCanvasElement | undefined;
  private context: CanvasRenderingContext2D | undefined;
  private container: HTMLElement | undefined;
  private camera: CameraState | undefined;
  private snapshot: Readonly<PresentationSnapshotDocument> | undefined;
  private viewport: Readonly<{ width: number; height: number }> = Object.freeze({ width: 800, height: 600 });
  private readonly diagnostics: RendererDiagnostic[] = [];
  private readonly resources = new Map<string, RendererBundleResource>();

  mount(container: HTMLElement): void {
    if (this.canvas) return;
    if (typeof document === "undefined") throw new Error("presentation.canvas-dom-unavailable: Canvas requires a browser document");
    const canvas = document.createElement("canvas");
    canvas.dataset.renderer = "canvas-2d";
    canvas.setAttribute("aria-label", "Office Engine V2 Canvas renderer");
    canvas.setAttribute("role", "img");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("presentation.canvas-context-unavailable: Canvas 2D context is unavailable");
    this.container = container;
    this.canvas = canvas;
    this.context = context;
    this.viewport = Object.freeze({
      width: sizeValue(container.clientWidth, this.viewport.width),
      height: sizeValue(container.clientHeight, this.viewport.height),
    });
    container.appendChild(canvas);
    this.setCanvasSize();
    this.renderFrame();
  }

  renderSnapshot(snapshot: Readonly<PresentationSnapshotDocument>): void {
    this.snapshot = snapshot;
    this.renderFrame();
  }

  setCamera(camera: CameraState): void {
    this.camera = camera;
    this.resize({ width: camera.viewport.width, height: camera.viewport.height });
  }

  pickSemantic(point: ScreenPoint): SemanticPickResult | null {
    if (!this.snapshot || !this.camera) return null;
    return pickSemanticEntity(this.snapshot, this.camera, point);
  }

  resize(viewport: { readonly width: number; readonly height: number }): void {
    this.viewport = Object.freeze({ width: sizeValue(viewport.width, 1), height: sizeValue(viewport.height, 1) });
    this.setCanvasSize();
    this.renderFrame();
  }

  attachBundle(bundle: RendererBundle, resource: RendererBundleResource): void {
    this.resources.set(bundleKey(bundle), resource);
  }

  detachBundle(bundle: RendererBundle): void {
    this.resources.delete(bundleKey(bundle));
  }

  showMissingAsset(diagnostic: RendererDiagnostic): void {
    this.diagnostics.push(Object.freeze({ ...diagnostic }));
    this.renderFrame();
  }

  captureDeterministic(): RendererCapture {
    if (!this.canvas) throw new Error("presentation.canvas-not-mounted: capture requires mount");
    const dataUrl = this.canvas.toDataURL("image/png");
    return Object.freeze({
      rendererRevision: CANVAS_RENDERER_REVISION,
      width: this.canvas.width,
      height: this.canvas.height,
      payloadHash: deterministicPayloadHash(dataUrl),
      dataUrl,
    });
  }

  handleContextLoss(): void {
    if (!this.canvas) return;
    const context = this.canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("presentation.canvas-context-unavailable: Canvas 2D context is unavailable after recovery");
    this.context = context;
    this.renderFrame();
  }

  teardown(): void {
    if (this.canvas && this.container) this.container.removeChild(this.canvas);
    this.canvas = undefined;
    this.context = undefined;
    this.container = undefined;
    this.camera = undefined;
    this.snapshot = undefined;
    this.resources.clear();
  }

  remount(container: HTMLElement): void {
    this.mount(container);
  }

  private setCanvasSize(): void {
    if (!this.canvas) return;
    this.canvas.width = this.viewport.width;
    this.canvas.height = this.viewport.height;
  }

  private renderFrame(): void {
    const context = this.context;
    if (!context) return;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, this.viewport.width, this.viewport.height);
    context.fillStyle = BACKGROUND;
    context.fillRect(0, 0, this.viewport.width, this.viewport.height);
    if (this.snapshot && this.camera) {
      const scene = buildSyntheticScene(this.snapshot, this.camera);
      for (const command of scene.commands) this.drawCommand(context, command);
    }
    if (this.diagnostics.length > 0) this.drawDiagnostics(context);
    context.restore();
  }

  private drawCommand(context: CanvasRenderingContext2D, command: SyntheticSceneCommand): void {
    if (command.kind === "floor") {
      const [first, ...rest] = command.corners;
      if (!first) return;
      context.beginPath();
      context.moveTo(first.xPx, first.yPx);
      for (const point of rest) context.lineTo(point.xPx, point.yPx);
      context.closePath();
      context.fillStyle = FLOOR_FILL;
      context.fill();
      context.strokeStyle = FLOOR_STROKE;
      context.lineWidth = 1;
      context.stroke();
      return;
    }
    context.save();
    context.globalAlpha = command.freshness === "stale" ? 0.62 : 1;
    context.beginPath();
    context.arc(command.center.xPx, command.center.yPx, command.radiusPx, 0, Math.PI * 2);
    context.fillStyle = syntheticSceneStateColor(command.semanticState);
    context.fill();
    context.strokeStyle = command.focused ? TEXT_COLOR : command.selected ? "#e0b55a" : "#18302d";
    context.lineWidth = command.focused ? 3 : 2;
    context.stroke();
    context.fillStyle = TEXT_COLOR;
    context.font = "12px monospace";
    context.textBaseline = "middle";
    context.fillText(command.label, command.center.xPx + command.radiusPx + 5, command.center.yPx);
    context.restore();
  }

  private drawDiagnostics(context: CanvasRenderingContext2D): void {
    context.save();
    context.fillStyle = "#5b201b";
    context.fillRect(12, 12, Math.min(this.viewport.width - 24, 480), 34);
    context.fillStyle = TEXT_COLOR;
    context.font = "12px monospace";
    context.textBaseline = "middle";
    context.fillText(`Missing asset: ${this.diagnostics.at(-1)?.code ?? "presentation.unknown"}`, 22, 29);
    context.restore();
  }
}

export function createCanvasRendererBackend(): RendererBackend {
  return new CanvasRendererBackend();
}
