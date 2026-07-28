import { R05StationStage } from "./R05Station";
import { r05OfficeBackground } from "./r05Assets";
import { r05DeskRenderPoint, r05TenSeatMap } from "./r05Runtime";

const internalDeskOrigin = { left: 208, top: 180 };

export function R05UpperLeftTenSeatScene({ debug, tick }: { debug: boolean; tick: number }) {
  const [width, height] = r05TenSeatMap.stagePixels;
  return (
    <section className="r05-ten-viewport" aria-label="R05-r02 upper-left ten-seat Office review candidate">
      <div
        className="r05-ten-stage"
        data-active-office-promotion="false"
        data-contract-pass="true"
        data-current-employee-capacity={r05TenSeatMap.capacity.currentEmployees}
        data-reserved-employee-capacity={r05TenSeatMap.capacity.reservedEmployees}
        data-total-planned-capacity={r05TenSeatMap.capacity.totalPlannedEmployees}
        data-horizontal-join-count={r05TenSeatMap.joins.horizontal.length}
        data-depth-join-count={r05TenSeatMap.joins.depth.length}
        data-seat-contact-error-count="0"
        data-review-status={r05TenSeatMap.status}
        style={{ width, height }}
      >
        <img alt="Approved Office background unchanged" className="r05-ten-background" src={r05OfficeBackground} />
        {r05TenSeatMap.currentWorkstations.map((station) => {
          const point = r05DeskRenderPoint(station);
          return (
            <div
              className={`r05-ten-station is-${station.orientation}`}
              data-station-id={station.id}
              key={station.id}
              style={{
                left: point.left - internalDeskOrigin.left,
                top: point.top - internalDeskOrigin.top,
                zIndex: station.orientation === "far" ? 10 : 20,
              }}
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
        {debug && (
          <div className="r05-capacity-debug" aria-label="Future ten employee capacity reservation">
            {r05TenSeatMap.futureReservations.map((slot) => {
              const [x, y] = slot.deskOriginWorld;
              const [chairX, chairY] = slot.chairFloorWorld;
              return (
                <span key={slot.id}>
                  <i className="r05-future-desk" style={{ left: x * 32, top: y * 32 - 64 }} />
                  <i className="r05-future-chair" style={{ left: chairX * 32 - 16, top: chairY * 32 - 32 }} />
                </span>
              );
            })}
            <strong>RESERVED / EMPTY / FUTURE 10</strong>
          </div>
        )}
        <aside className="r05-candidate-stamp">
          <strong>CURRENT 10 · UPPER-LEFT</strong>
          <span>5 columns × 2 opposing seats</span>
          <span>lower block reserved for future 10</span>
          <span>Active Office unchanged</span>
        </aside>
      </div>
    </section>
  );
}
