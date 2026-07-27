import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./pages.css";

async function renderRoot() {
  const root = createRoot(document.getElementById("root")!);
  const labRequested = import.meta.env.DEV
    && new URLSearchParams(window.location.search).get("lab") === "office-layout";
  if (labRequested) {
    const { OfficeLayoutLabPage } = await import("./features/office/lab/OfficeLayoutLabPage");
    root.render(<StrictMode><OfficeLayoutLabPage /></StrictMode>);
    return;
  }
  const { App } = await import("./App");
  root.render(<StrictMode><App /></StrictMode>);
}

void renderRoot();
