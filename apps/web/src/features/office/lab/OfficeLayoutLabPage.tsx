import { useMemo, useState } from "react";
import { createDemoOfficeSnapshot } from "@affiliate-ops/office-read-model";
import labMapJson from "../../../../../../assets/game/maps/office-facility-v1-lab.json";
import type { OfficeMapDefinition } from "../officeTypes";
import { OfficeCanvas } from "../components/OfficeCanvas";
import {
  modernOfficeChairForeground,
  modernOfficeLabAssetRegistry,
  modernOfficeLabSlotSets,
} from "./modernOfficeLabAssets";
import { modernOfficeLabCharacters } from "./modernOfficeLabCharacters";
import { createModernOfficeLabPresentations } from "./modernOfficeLabContract";
import "../officeScene.css";
import "./officeLayoutLab.css";

const labMap = labMapJson as unknown as OfficeMapDefinition;

export function OfficeLayoutLabPage() {
  const [selectedId, setSelectedId] = useState("");
  const query = new URLSearchParams(window.location.search);
  const debugGeometry = query.get("debug") === "1";
  const showAgents = query.get("actors") !== "0";
  const agents = useMemo(
    () => createDemoOfficeSnapshot(new Date("2026-07-27T08:00:00+07:00")).agents.map((agent) => ({
      ...agent,
      status: "running" as const,
      statusReason: "Two-row layout calibration",
      currentTask: "Testing the isolated Office replacement layout",
    })),
    [],
  );
  const agentPresentations = useMemo(
    () => createModernOfficeLabPresentations(labMap),
    [],
  );

  return (
    <main className="office-layout-lab" data-debug-geometry={debugGeometry ? "true" : "false"}>
      <header className="office-layout-lab-header">
        <div>
          <span>STAGING LAB · ACTIVE OFFICE UNCHANGED</span>
          <h1>Part 1 · paired modern workstations</h1>
        </div>
        <dl>
          <div><dt>Employees</dt><dd>10</dd></div>
          <div><dt>Pose split</dt><dd>5 + 5</dd></div>
          <div><dt>Assets</dt><dd>Modern only</dd></div>
        </dl>
      </header>
      <section className="office-layout-lab-stage" aria-label="Isolated two-row Office test room">
        <OfficeCanvas
          agentPresentations={agentPresentations}
          agents={agents}
          assetRegistry={modernOfficeLabAssetRegistry}
          backdropMode="structural"
          characterDefinitions={modernOfficeLabCharacters}
          debugGeometry={debugGeometry}
          mapDefinition={labMap}
          mode="live"
          selectedId={selectedId}
          showAgents={showAgents}
          showAmbientDecor={false}
          showWorkstationChairs
          slotSets={modernOfficeLabSlotSets}
          workstationChairForeground={modernOfficeChairForeground}
          workstationLayering="paired-seating"
          onSelect={setSelectedId}
        />
      </section>
      <footer>
        <span>Row A: faces viewer · Row B: faces away</span>
        <span>Keyboard-only: 10 · Future prop slots: 40</span>
        <span>Facilities: 0 · Legacy furniture: 0</span>
        <strong>{debugGeometry ? showAgents ? "SEATED GRID" : "FURNITURE GRID" : "LAB ONLY"}</strong>
      </footer>
    </main>
  );
}
