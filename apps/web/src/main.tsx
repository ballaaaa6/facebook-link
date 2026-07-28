import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./pages.css";

async function renderRoot() {
  const root = createRoot(document.getElementById("root")!);
  const requestedLab = import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get("lab")
    : null;
  if (requestedLab === "workstation-v1") {
    const { WorkstationGeometryV1LabPage } = await import("./features/office/lab/WorkstationGeometryV1LabPage");
    root.render(<StrictMode><WorkstationGeometryV1LabPage /></StrictMode>);
    return;
  }
  if (requestedLab === "office-ten-v1") {
    const { OfficeTenWorkstationLabPage } = await import("./features/office/lab/OfficeTenWorkstationLabPage");
    root.render(<StrictMode><OfficeTenWorkstationLabPage /></StrictMode>);
    return;
  }
  if (requestedLab === "office-derived-v1") {
    const { OfficeDerivedAssetsLabPage } = await import("./features/office/lab/OfficeDerivedAssetsLabPage");
    root.render(<StrictMode><OfficeDerivedAssetsLabPage /></StrictMode>);
    return;
  }
  if (requestedLab === "office-candidate-v1") {
    const { OfficeCandidateLabPage } = await import("./features/office/lab/OfficeCandidateLabPage");
    root.render(<StrictMode><OfficeCandidateLabPage /></StrictMode>);
    return;
  }
  if (requestedLab === "office-workstation-v2-step5") {
    const { OfficeWorkstationStep5LabPage } = await import("./features/office/lab/workstation-v2-step5/OfficeWorkstationStep5LabPage");
    root.render(<StrictMode><OfficeWorkstationStep5LabPage /></StrictMode>);
    return;
  }
  if (requestedLab === "office-workstation-v3-step5") {
    const { OfficeWorkstationStep5R04LabPage } = await import("./features/office/lab/workstation-v3-step5/OfficeWorkstationStep5R04LabPage");
    root.render(<StrictMode><OfficeWorkstationStep5R04LabPage /></StrictMode>);
    return;
  }
  if (requestedLab === "office-workstation-r05") {
    const { OfficeWorkstationR05LabPage } = await import("./features/office/lab/workstation-r05/OfficeWorkstationR05LabPage");
    root.render(<StrictMode><OfficeWorkstationR05LabPage /></StrictMode>);
    return;
  }
  if (requestedLab === "office-layout") {
    const { OfficeLayoutLabPage } = await import("./features/office/lab/OfficeLayoutLabPage");
    root.render(<StrictMode><OfficeLayoutLabPage /></StrictMode>);
    return;
  }
  const { App } = await import("./App");
  root.render(<StrictMode><App /></StrictMode>);
}

void renderRoot();
