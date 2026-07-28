import type { CSSProperties } from "react";
import type { OfficeWorkstationStep5ManifestV2 } from "@affiliate-ops/contracts";
import {
  step5ChairAssets,
  step5DeskComposites,
  step5EinsteinAssets,
  step5KeyboardAssets,
  step5MonitorAssets,
} from "./step5Assets";

const cards = [
  { label: "Public side · modesty panel · FAR", src: step5DeskComposites.publicSide, className: "is-desk" },
  { label: "Seat side · drawers/knee space · NEAR", src: step5DeskComposites.seatSide, className: "is-desk" },
  { label: "Chair front · backrest part", src: step5ChairAssets.front.backrest, className: "is-chair-front" },
  { label: "Chair front · seat/base part", src: step5ChairAssets.front.seatBase, className: "is-chair-front" },
  { label: "Chair back · backrest part", src: step5ChairAssets.back.backrest, className: "is-chair-back" },
  { label: "Chair back · seat/base part", src: step5ChairAssets.back.seatBase, className: "is-chair-back" },
  { label: "Monitor front/back · existing", src: step5MonitorAssets.front, className: "is-monitor" },
  { label: "Full tight keyboard · no crop", src: step5KeyboardAssets.full, className: "is-keyboard" },
] as const;

export function Step5AssetProvenance({ compact = false, manifest }: {
  compact?: boolean;
  manifest: OfficeWorkstationStep5ManifestV2;
}) {
  return (
    <section className="step5-provenance" data-compact={compact} data-review-panel="assets">
      <header>
        <span>CHARACTER SCALE AUTHORITY · DETERMINISTIC PARTS</span>
        <h2>One floor tile. Three logical units tall. Visible pixels may overflow.</h2>
        <p>The 1×1 footprint controls collision; the 96×104 Office frame controls appearance.</p>
      </header>
      <div className="step5-scale-board">
        <figure className="step5-character-standard">
          <div className="step5-character-grid">
            <i className="step5-character-volume" />
            <i className="step5-character-footprint" />
            <span
              aria-label="Einstein current Office-scale working-front-seated pose"
              className="step5-provenance-character"
              style={{
                backgroundImage: `image-set(url("${step5EinsteinAssets.sheet}") 1x, url("${step5EinsteinAssets.sheet2x}") 2x)`,
                backgroundPosition: "0% 100%",
              } as CSSProperties}
            />
          </div>
          <figcaption><strong>Person logical volume 1×1×3</strong><span>Render envelope 96×104 · overflow allowed</span></figcaption>
        </figure>
        <div className="step5-scale-rules">
          <div><strong>32×32</strong><span>floor footprint</span></div>
          <div><strong>32×96</strong><span>logical column</span></div>
          <div><strong>96×104</strong><span>current Office frame</span></div>
          <div><strong>NO CLIP</strong><span>hair/clothes may overlap</span></div>
        </div>
      </div>
      <div className="step5-asset-grid">
        {cards.map((card) => (
          <figure className={`step5-asset-card ${card.className}`} key={card.label}>
            <div><img alt={card.label} draggable={false} src={card.src} /></div>
            <figcaption>{card.label}</figcaption>
          </figure>
        ))}
      </div>
      <footer>
        <strong>{manifest.lockedInputs.length} files hash-locked</strong>
        <span>New designed artwork: 0</span>
        <span>Derived masks/crop: authorized</span>
        <span>Active Office imports: scale rule only</span>
      </footer>
    </section>
  );
}
