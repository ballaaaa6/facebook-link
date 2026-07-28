import { R05StationStage } from "./R05Station";
import { r05OfficeBackground } from "./r05Assets";
import { r05DeskRenderPoint, r05TenSeatMap } from "./r05Runtime";

export function R05TenSeatScene({ debug, tick }: { debug: boolean; tick: number }) {
  const [width, height] = r05TenSeatMap.renderProjection.stagePixels;
  return (
    <section className="r05-ten-viewport" aria-label="R05 isolated ten-seat Office candidate">
      <div
        className="r05-ten-stage"
        data-active-office-promotion="false"
        data-character-count="10"
        data-old-furniture-count="0"
        data-review-status={r05TenSeatMap.status}
        style={{ width, height }}
      >
        <img alt="Approved Office background unchanged" className="r05-ten-background" src={r05OfficeBackground} />
        {r05TenSeatMap.workstations.map((station) => {
          const point = r05DeskRenderPoint(station);
          return (
            <div
              className="r05-ten-station"
              data-station-id={station.id}
              key={station.id}
              style={{ left: point.left - 208, top: point.top - 180 }}
            >
              <R05StationStage
                agentId={station.agentId}
                context
                debug={debug}
                orientation={station.orientation}
                tick={tick}
              />
            </div>
          );
        })}
        {debug && <div className="r05-work-zone-debug">24×24 WORK ZONE</div>}
        <aside className="r05-candidate-stamp">
          <strong>R05 isolated candidate</strong>
          <span>10 real chairs · 10 existing characters</span>
          <span>Active Office unchanged</span>
        </aside>
      </div>
    </section>
  );
}
