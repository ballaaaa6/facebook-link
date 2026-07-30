import { useState } from "react";
import { AppShell } from "./app/AppShell";
import { useRoute } from "./app/useRoute";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { OfficeV2Page } from "./features/office-v2/OfficeV2Page";
import { SettingsPage } from "./features/settings/SettingsPage";
import type { ThemeName } from "./shared/types";

export function App() {
  const { route, navigate } = useRoute();
  const [theme, setTheme] = useState<ThemeName>("warm-studio");

  return (
    <AppShell route={route} navigate={navigate} theme={theme}>
      {route === "/settings" && <SettingsPage theme={theme} onThemeChange={setTheme} />}
      {route === "/dashboard" && <DashboardPage />}
      {route === "/" && <OfficeV2Page />}
    </AppShell>
  );
}
