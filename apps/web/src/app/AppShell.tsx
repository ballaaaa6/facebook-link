import type { ReactNode } from "react";
import type { ThemeName } from "../shared/types";
import type { AppRoute } from "./useRoute";

const navigation: readonly { route: AppRoute; code: string; label: string }[] = [
  { route: "/", code: "HQ", label: "Office" },
  { route: "/dashboard", code: "DB", label: "Dashboard" },
  { route: "/settings", code: "ST", label: "Settings" },
];

const pageTitles: Record<AppRoute, { eyebrow: string; title: string }> = {
  "/": { eyebrow: "Affiliate Operations", title: "Warm Studio HQ" },
  "/dashboard": { eyebrow: "Performance Center", title: "Operations Dashboard" },
  "/settings": { eyebrow: "Control Plane", title: "Workflow Settings" },
};

export function AppShell({ route, navigate, theme, children }: { route: AppRoute; navigate: (route: AppRoute) => void; theme: ThemeName; children: ReactNode }) {
  const page = pageTitles[route];
  return (
    <div className="app-shell" data-route={route} data-theme={theme}>
      <nav className="side-nav" aria-label="Main navigation">
        <div className="brand-mark">AO</div>
        {navigation.map((item) => (
          <button type="button" className={`nav-item ${route === item.route ? "is-active" : ""}`} key={item.route} onClick={() => navigate(item.route)}>
            <span>{item.code}</span><small>{item.label}</small>
          </button>
        ))}
        <div className="nav-spacer" />
        <div className="nav-version">v0.1</div>
      </nav>

      <main className="main-column">
        <header className="top-bar">
          <div><span className="eyebrow">{page.eyebrow}</span><h1>{page.title}</h1></div>
          <div className="system-pill"><i /> Simulation ready <small>10 agents</small></div>
        </header>
        {children}
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.map((item) => <button type="button" className={route === item.route ? "is-active" : ""} key={item.route} onClick={() => navigate(item.route)}>{item.label}</button>)}
      </nav>
    </div>
  );
}
