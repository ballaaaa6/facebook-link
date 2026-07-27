import { useMemo, useState } from "react";
import {
  validateOfficeDerivedAssetManifest,
  type OfficeDerivedAssetManifest,
} from "@affiliate-ops/contracts";
import manifestJson from "../../../../../../assets/game/manifests/office-derived-assets-v1.json";
import step13Board from "../../../../../../assets/game/processed/office-derived-v1/qa/step-13-before-derived-diff.png";
import step14Board from "../../../../../../assets/game/processed/office-derived-v1/qa/step-14-before-derived-diff.png";
import step15Board from "../../../../../../assets/game/processed/office-derived-v1/qa/step-15-before-derived-diff.png";
import step16Board from "../../../../../../assets/game/processed/office-derived-v1/qa/step-16-before-derived-diff.png";
import { derivedAssetPreviews } from "../derived/derivedAssetPreviews";
import "./officeDerivedAssetsLab.css";

const manifest = manifestJson as unknown as OfficeDerivedAssetManifest;
const boards = [
  ["Step 13 · static cleanup · 24", step13Board],
  ["Step 14 · animation cleanup · 40", step14Board],
  ["Step 15 · library composites · 6", step15Board],
  ["Step 16 · runtime staging composites · 7", step16Board],
] as const;

type CompositeWave = "all" | "step-15" | "step-16";

export function OfficeDerivedAssetsLabPage() {
  const query = new URLSearchParams(window.location.search);
  const initialWave = query.get("wave");
  const [wave, setWave] = useState<CompositeWave>(initialWave === "step-15" || initialWave === "step-16" ? initialWave : "all");
  const [actorVisible, setActorVisible] = useState(query.get("actor") !== "0");
  const [geometryVisible, setGeometryVisible] = useState(query.get("geometry") === "1");
  const issues = useMemo(() => validateOfficeDerivedAssetManifest(manifest), []);
  const records = useMemo(() => new Map(manifest.records.map((record) => [record.assetId, record])), []);
  const previews = derivedAssetPreviews.filter((preview) => wave === "all" || preview.wave === wave);

  return (
    <main className="derived-assets-lab" data-active-office-promotion={manifest.activeOfficePromotion}>
      <header className="derived-assets-header">
        <div>
          <span>GEOMETRY V3 · STAGING ONLY</span>
          <h1>Furniture and facility derivation waves</h1>
          <p>77 reviewed records · immutable source pixels · Active Office imports disabled</p>
        </div>
        <dl>
          <div><dt>Cleanup</dt><dd>64</dd></div>
          <div><dt>Composites</dt><dd>13</dd></div>
          <div><dt>No-op verified</dt><dd>{manifest.counts.verifiedNoopCleanup}</dd></div>
        </dl>
      </header>

      <section className="derived-assets-controls" aria-label="Derived asset lab controls">
        <div>
          {(["all", "step-15", "step-16"] as const).map((candidate) => (
            <button aria-pressed={wave === candidate} key={candidate} onClick={() => setWave(candidate)}>{candidate}</button>
          ))}
        </div>
        <button aria-pressed={actorVisible} onClick={() => setActorVisible((value) => !value)}>neutral actor</button>
        <button aria-pressed={geometryVisible} onClick={() => setGeometryVisible((value) => !value)}>geometry</button>
      </section>

      <section className="derived-composite-grid" aria-label="Furniture composite staging gallery">
        {previews.map((preview) => {
          const record = records.get(preview.id);
          const geometry = record?.geometry;
          return (
            <article className="derived-composite-card" key={preview.id}>
              <header><strong>{preview.id}</strong><span>{preview.wave}</span></header>
              <div className="derived-composite-stage" data-geometry={geometryVisible}>
                <img alt="" className="derived-base" src={preview.base} />
                {actorVisible && preview.id !== "door.closed" ? <span aria-label="Neutral calibration actor" className="derived-neutral-actor" /> : null}
                {preview.foreground ? <img alt="" className="derived-foreground" src={preview.foreground} /> : null}
                {geometryVisible && geometry ? (
                  <span className="derived-geometry-label">
                    {geometry.footprint ? `${geometry.footprint.width}×${geometry.footprint.depth}` : geometry.placementPlane}
                    {geometry.seatSlots.length > 0 ? ` · ${geometry.seatSlots.length} seats` : ""}
                  </span>
                ) : null}
              </div>
              <footer>{record?.operation ?? "missing record"}</footer>
            </article>
          );
        })}
      </section>

      <section className="derived-qa-boards" aria-label="Before, derived and difference boards">
        <h2>Pixel evidence</h2>
        {boards.map(([label, source]) => (
          <details key={label} open={label.startsWith("Step 13")}>
            <summary>{label}</summary>
            <img alt={label} src={source} />
          </details>
        ))}
      </section>

      <footer className="derived-assets-footer">
        <span>Source overwrites: 0</span>
        <span>Active Office promotion: false</span>
        <strong>{issues.length === 0 ? "ACCEPTED-STAGING" : `${issues.length} CONTRACT ISSUES`}</strong>
      </footer>
    </main>
  );
}
