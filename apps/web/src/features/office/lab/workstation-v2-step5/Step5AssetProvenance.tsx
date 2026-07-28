import type { CSSProperties } from "react";
import type { OfficeWorkstationStep5ManifestV1 } from "@affiliate-ops/contracts";
import {
  step5ChairAssets,
  step5DeskComposites,
  step5EinsteinAssets,
  step5KeyboardAsset,
  step5MonitorAssets,
} from "./step5Assets";

const cards = [
  { label: "Desk front · accepted v2", src: step5DeskComposites.front, className: "is-desk" },
  { label: "Desk back · accepted v2", src: step5DeskComposites.back, className: "is-desk" },
  { label: "Chair front · existing", src: step5ChairAssets.front, className: "is-chair" },
  { label: "Chair back · existing", src: step5ChairAssets.back, className: "is-chair" },
  { label: "Monitor front · existing", src: step5MonitorAssets.front, className: "is-monitor" },
  { label: "Monitor back · existing", src: step5MonitorAssets.back, className: "is-monitor" },
  { label: "Keyboard · existing", src: step5KeyboardAsset, className: "is-keyboard" },
] as const;

export function Step5AssetProvenance({ manifest }: { manifest: OfficeWorkstationStep5ManifestV1 }) {
  return (
    <section className="step5-provenance" data-review-panel="assets">
      <header>
        <span>LOCKED INPUTS · NO NEW ART</span>
        <h2>Asset provenance and runtime scale</h2>
        <p>Only these accepted/existing assets feed the Step 5 assembly.</p>
      </header>
      <div className="step5-asset-grid">
        {cards.map((card) => (
          <figure className={`step5-asset-card ${card.className}`} key={card.label}>
            <div><img alt={card.label} draggable={false} src={card.src} /></div>
            <figcaption>{card.label}</figcaption>
          </figure>
        ))}
        <figure className="step5-asset-card is-character">
          <div>
            <span
              aria-label="Einstein existing working-front-seated pose"
              className="step5-provenance-character"
              style={{
                backgroundImage: `image-set(url("${step5EinsteinAssets.sheet}") 1x, url("${step5EinsteinAssets.sheet2x}") 2x)`,
                backgroundPosition: "0% 100%",
              } as CSSProperties}
            />
          </div>
          <figcaption>Einstein v3 · existing seated poses</figcaption>
        </figure>
      </div>
      <footer>
        <strong>{manifest.lockedInputs.length} files hash-locked</strong>
        <span>Active Office input count: 0</span>
        <span>Generated replacement art: 0</span>
      </footer>
    </section>
  );
}
