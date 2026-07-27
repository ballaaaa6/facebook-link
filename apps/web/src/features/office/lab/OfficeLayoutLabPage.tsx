import { useMemo, useState } from "react";
import { createDemoOfficeSnapshot } from "@affiliate-ops/office-read-model";
import labMapJson from "../../../../../../assets/game/maps/office-facility-v1-lab.json";
import type { OfficeMapDefinition } from "../officeTypes";
import { OfficeCanvas } from "../components/OfficeCanvas";
import "../officeScene.css";
import "./officeLayoutLab.css";

const labMap = labMapJson as unknown as OfficeMapDefinition;

export function OfficeLayoutLabPage() {
  const [selectedId, setSelectedId] = useState("");
  const agents = useMemo(
    () => createDemoOfficeSnapshot(new Date("2026-07-27T08:00:00+07:00")).agents.map((agent) => ({
      ...agent,
      status: "running" as const,
      statusReason: "Two-row layout calibration",
      currentTask: "Testing the isolated Office replacement layout",
    })),
    [],
  );

  return (
    <main className="office-layout-lab">
      <header className="office-layout-lab-header">
        <div>
          <span>STAGING LAB · ACTIVE OFFICE UNCHANGED</span>
          <h1>Two-row Office layout</h1>
        </div>
        <dl>
          <div><dt>Employees</dt><dd>10</dd></div>
          <div><dt>Rows</dt><dd>2 × 5</dd></div>
          <div><dt>Surfaces</dt><dd>Floor + wall</dd></div>
        </dl>
      </header>
      <section className="office-layout-lab-stage" aria-label="Isolated two-row Office test room">
        <OfficeCanvas
          agents={agents}
          mapDefinition={labMap}
          mode="live"
          selectedId={selectedId}
          showWorkstationChairs
          onSelect={setSelectedId}
        />
      </section>
      <footer>
        <span>Work floor: 5 seats per row</span>
        <span>Right wing: service · pantry · lounge · review</span>
        <strong>LAB ONLY</strong>
      </footer>
    </main>
  );
}
