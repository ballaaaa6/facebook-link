import type {
  OfficeWorkstationBundleV1,
  OfficeWorkstationPreset,
  WorkstationDeploymentV1,
} from "@affiliate-ops/contracts";
import { GeometryWorkstationComposite } from "./GeometryWorkstationComposite";

interface WorkstationDeploymentProps {
  bundle: OfficeWorkstationBundleV1;
  debug: boolean;
  elapsedMs: number;
  equipmentDebug: boolean;
  grid: { width: number; height: number };
  pose: "seated" | "standing";
  preset: OfficeWorkstationPreset;
  showActor: boolean;
  station: WorkstationDeploymentV1;
}

export function WorkstationDeployment({
  bundle,
  debug,
  elapsedMs,
  equipmentDebug,
  grid,
  pose,
  preset,
  showActor,
  station,
}: WorkstationDeploymentProps) {
  return (
    <GeometryWorkstationComposite
      bundle={bundle}
      debug={debug}
      elapsedMs={elapsedMs}
      equipmentDebug={equipmentDebug}
      grid={grid}
      label={station.agentId}
      pose={pose}
      preset={preset}
      showActor={showActor}
      station={{
        id: station.id,
        role: station.role,
        orientation: station.orientation,
        facing: station.facing,
        footprint: station.footprint,
        seat: station.seat,
        pose,
      }}
    />
  );
}
