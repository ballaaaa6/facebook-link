import { Application, Container, Graphics, Text } from "pixi.js";
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

export const PIXI_RENDERER_REVISION = "pixijs-8.19.0-v1" as const;

const BACKGROUND = 0x0d1715;
const FLOOR_FILL = 0x18302d;
const FLOOR_STROKE = 0x568276;
const TEXT_COLOR = 0xe8f0ec;

function sizeValue(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.max(1, Math.floor(value)) : fallback;
}

function bundleKey(bundle: Pick<RendererBundle, "bundleId" | "version">): string {
  return `${bundle.bundleId}@${bundle.version}`;
}

function colorValue(value: string): number {
  return Number.parseInt(value.slice(1), 16);
}

/** PixiJS 8.19.0 candidate. It owns only presentation display objects/resources. */
export class PixiRendererBackend implements RendererBackend {
  private application: Application | undefined;
  private root: Container | undefined;
  private container: HTMLElement | undefined;
  private camera: CameraState | undefined;
  private snapshot: Readonly<PresentationSnapshotDocument> | undefined;
  private viewport: Readonly<{ width: number; height: number }> = Object.freeze({ width: 800, height: 600 });
  private readonly diagnostics: RendererDiagnostic[] = [];
  private readonly resources = new Map<string, RendererBundleResource>();

  async mount(container: HTMLElement): Promise<void> {
    if (this.application) return;
    if (typeof document === "undefined") throw new Error("presentation.pixi-dom-unavailable: PixiJS requires a browser document");
    const application = new Application();
    await application.init({
      width: this.viewport.width,
      height: this.viewport.height,
      backgroundColor: BACKGROUND,
      antialias: false,
      autoStart: false,
      clearBeforeRender: true,
      preference: "webgl",
      resolution: 1,
    });
    application.canvas.dataset.renderer = "pixijs-8.19.0";
    application.canvas.setAttribute("aria-label", "Office Engine V2 PixiJS renderer");
    application.canvas.setAttribute("role", "img");
    application.canvas.style.display = "block";
    application.canvas.style.width = "100%";
    application.canvas.style.height = "100%";
    this.container = container;
    this.application = application;
    this.root = new Container();
    application.stage.addChild(this.root);
    container.appendChild(application.canvas);
    this.viewport = Object.freeze({
      width: sizeValue(container.clientWidth, this.viewport.width),
      height: sizeValue(container.clientHeight, this.viewport.height),
    });
    application.renderer.resize(this.viewport.width, this.viewport.height);
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
    this.application?.renderer.resize(this.viewport.width, this.viewport.height);
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
    const canvas = this.application?.canvas;
    if (!canvas) throw new Error("presentation.pixi-not-mounted: capture requires mount");
    const dataUrl = canvas.toDataURL("image/png");
    return Object.freeze({
      rendererRevision: PIXI_RENDERER_REVISION,
      width: canvas.width,
      height: canvas.height,
      payloadHash: deterministicPayloadHash(dataUrl),
      dataUrl,
    });
  }

  async handleContextLoss(): Promise<void> {
    const container = this.container;
    if (!container || !this.application) return;
    this.destroyApplication();
    await this.mount(container);
  }

  teardown(): void {
    this.destroyApplication();
    this.container = undefined;
    this.camera = undefined;
    this.snapshot = undefined;
    this.resources.clear();
  }

  async remount(container: HTMLElement): Promise<void> {
    await this.mount(container);
  }

  private destroyApplication(): void {
    if (this.application) this.application.destroy({ removeView: true }, { children: true, texture: true, textureSource: true });
    this.application = undefined;
    this.root = undefined;
  }

  private renderFrame(): void {
    const root = this.root;
    const application = this.application;
    if (!root || !application) return;
    for (const child of root.removeChildren()) child.destroy({ children: true });
    if (this.snapshot && this.camera) {
      const scene = buildSyntheticScene(this.snapshot, this.camera);
      for (const command of scene.commands) this.drawCommand(root, command);
    }
    if (this.diagnostics.length > 0) this.drawDiagnostics(root);
    application.render();
  }

  private drawCommand(root: Container, command: SyntheticSceneCommand): void {
    if (command.kind === "floor") {
      const [first, ...rest] = command.corners;
      if (!first) return;
      const floor = new Graphics();
      floor.moveTo(first.xPx, first.yPx);
      for (const point of rest) floor.lineTo(point.xPx, point.yPx);
      floor.closePath();
      floor.fill({ color: FLOOR_FILL });
      floor.stroke({ color: FLOOR_STROKE, width: 1 });
      root.addChild(floor);
      return;
    }
    const entity = new Graphics();
    entity.circle(command.center.xPx, command.center.yPx, command.radiusPx);
    entity.fill({ color: colorValue(syntheticSceneStateColor(command.semanticState)), alpha: command.freshness === "stale" ? 0.62 : 1 });
    entity.stroke({
      color: command.focused ? TEXT_COLOR : command.selected ? 0xe0b55a : FLOOR_FILL,
      width: command.focused ? 3 : 2,
    });
    root.addChild(entity);
    const label = new Text({
      text: command.label,
      style: { fontFamily: "monospace", fontSize: 12, fill: TEXT_COLOR },
    });
    label.position.set(command.center.xPx + command.radiusPx + 5, command.center.yPx - 7);
    label.alpha = command.freshness === "stale" ? 0.62 : 1;
    root.addChild(label);
  }

  private drawDiagnostics(root: Container): void {
    const banner = new Graphics();
    banner.rect(12, 12, Math.min(this.viewport.width - 24, 480), 34);
    banner.fill({ color: 0x5b201b });
    root.addChild(banner);
    const label = new Text({
      text: `Missing asset: ${this.diagnostics.at(-1)?.code ?? "presentation.unknown"}`,
      style: { fontFamily: "monospace", fontSize: 12, fill: TEXT_COLOR },
    });
    label.position.set(22, 20);
    root.addChild(label);
  }
}

export function createPixiRendererBackend(): RendererBackend {
  return new PixiRendererBackend();
}
