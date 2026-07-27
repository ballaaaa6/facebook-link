import { useMemo, useState } from "react";
import type { OfficeDerivedAssetManifest } from "@affiliate-ops/contracts";
import derivedManifestJson from "../../../../../../assets/game/manifests/office-derived-assets-v1.json";
import { AnimatedAgent } from "../components/AnimatedAgent";
import { derivedAssetPreviews } from "../derived/derivedAssetPreviews";
import { prototypeCharacterReviewRoster } from "./modernOfficeLabCharacters";

const manifest = derivedManifestJson as unknown as OfficeDerivedAssetManifest;

export function CandidateFacilityScene({ debug }: { debug: boolean }) {
  const [sceneStartedAt] = useState(() => performance.now());
  const records = useMemo(
    () => new Map(manifest.records.map((record) => [record.assetId, record])),
    [],
  );

  return (
    <section className="candidate-facility-grid" data-candidate-scene="facilities">
      {derivedAssetPreviews.map((preview, index) => {
        const record = records.get(preview.id);
        const character = prototypeCharacterReviewRoster[index % prototypeCharacterReviewRoster.length]!;
        const state = preview.id.includes("sofa") ? "lounge-front" : "interact-front";
        return (
          <article className="candidate-facility-card" key={preview.id}>
            <header><strong>{preview.id}</strong><span>{preview.wave}</span></header>
            <div className="candidate-facility-stage" data-debug={debug ? "true" : "false"}>
              <img alt="" className="candidate-facility-base" src={preview.base} />
              {preview.id !== "door.closed" && (
                <span className="candidate-facility-character" data-character={character.id}>
                  <AnimatedAgent
                    agentId={`facility-${character.id}`}
                    characterDefinition={character.definition}
                    name={character.label}
                    sceneStartedAt={sceneStartedAt}
                    state={state}
                  />
                </span>
              )}
              {preview.foreground && <img alt="" className="candidate-facility-foreground" src={preview.foreground} />}
              {debug && <span className="candidate-facility-anchor">anchor</span>}
            </div>
            <footer>
              <span>{record?.operation ?? "missing"}</span>
              <span>{record?.geometry?.seatSlots.length ?? 0} seats</span>
            </footer>
          </article>
        );
      })}
    </section>
  );
}
