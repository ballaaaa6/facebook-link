import { useState } from "react";
import { AppShell } from "./app/AppShell";
import { useRoute } from "./app/useRoute";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { OfficePage } from "./features/office/OfficePage";
import { SettingsPage } from "./features/settings/SettingsPage";
import type { ThemeName } from "./shared/types";

export function App() {
  const { route, navigate } = useRoute();
  const [theme, setTheme] = useState<ThemeName>("warm-studio");

  return (
    <AppShell route={route} navigate={navigate} theme={theme}>
      {route === "/dashboard" && <DashboardPage />}
      {route === "/settings" && <SettingsPage theme={theme} onThemeChange={setTheme} />}
      {route === "/" && <OfficePage />}
    </AppShell>
  );
}
