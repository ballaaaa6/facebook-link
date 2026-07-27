import { useState } from "react";
import type { CharacterState } from "../characterRegistry";
import { AnimatedAgent } from "../components/AnimatedAgent";
import { prototypeCharacterReviewRoster } from "./modernOfficeLabCharacters";

export function CandidateRosterScene({ state }: { state: CharacterState }) {
  const [sceneStartedAt] = useState(() => performance.now());
  return (
    <section className="candidate-roster-grid" data-candidate-scene="roster" data-pose={state}>
      {prototypeCharacterReviewRoster.map((character) => (
        <article className="candidate-roster-card" data-roster={character.roster} key={character.id}>
          <span className="candidate-roster-character">
            <AnimatedAgent
              agentId={`roster-${character.id}`}
              characterDefinition={character.definition}
              name={character.label}
              sceneStartedAt={sceneStartedAt}
              state={state}
            />
          </span>
          <strong>{character.label}</strong>
          <small>{character.roster} · 8×15</small>
        </article>
      ))}
      <article className="candidate-roster-card is-companion" data-roster="companion">
        <span className="candidate-boba-mark">BOBA</span>
        <strong>Boba</strong>
        <small>companion · retained states</small>
      </article>
    </section>
  );
}
