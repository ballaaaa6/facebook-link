import { R05StationStage } from "./R05Station";
import { r05PairMap } from "./r05Runtime";

export function R05PairScene({ debug, tick }: { debug: boolean; tick: number }) {
  return (
    <section className="r05-pair-viewport" aria-label="R05-r02 isolated paired workstation proof">
      <div
        className="r05-pair-stage"
        data-active-office-promotion="false"
        data-character-count="2"
        data-desk-depth-delta-pixels={r05PairMap.deskPair.originDeltaPixels[1]}
        data-review-status={r05PairMap.status}
      >
        <div className="r05-pair-station is-far">
          <R05StationStage
            agentId={r05PairMap.occupants.far.agentId}
            context
            debug={debug}
            orientation="far"
            tick={tick}
          />
        </div>
        <div className="r05-pair-station is-near">
          <R05StationStage
            agentId={r05PairMap.occupants.near.agentId}
            context
            debug={debug}
            orientation="near"
            tick={tick}
          />
        </div>
        {debug && (
          <aside className="r05-pair-debug-copy">
            <strong>3×2 + 3×2</strong>
            <span>Y delta: 2 tiles / 64 px</span>
            <span>tabletop gap: 0 px</span>
            <span>far base visible: 0 px</span>
          </aside>
        )}
      </div>
    </section>
  );
}
