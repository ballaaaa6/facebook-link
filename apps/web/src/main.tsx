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
  if (requestedLab === "office-layout") {
    const { OfficeLayoutLabPage } = await import("./features/office/lab/OfficeLayoutLabPage");
    root.render(<StrictMode><OfficeLayoutLabPage /></StrictMode>);
    return;
  }
  const { App } = await import("./App");
  root.render(<StrictMode><App /></StrictMode>);
}

void renderRoot();
