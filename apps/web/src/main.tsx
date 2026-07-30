import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./pages.css";

async function renderRoot() {
  const root = createRoot(document.getElementById("root")!);
  const requestedLab = import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get("lab")
    : null;
  if (requestedLab === "office-engine-v2") {
    const { OfficeEngineV2LabPage } = await import("./features/office-v2/OfficeEngineV2LabPage");
    root.render(<StrictMode><OfficeEngineV2LabPage /></StrictMode>);
    return;
  }
  const { App } = await import("./App");
  root.render(<StrictMode><App /></StrictMode>);
}

void renderRoot();
