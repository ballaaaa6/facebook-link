import { useEffect, useState } from "react";

export type AppRoute = "/" | "/dashboard" | "/settings";

function normalize(pathname: string): AppRoute {
  if (pathname === "/dashboard" || pathname === "/settings") return pathname;
  return "/";
}

export function useRoute() {
  const [route, setRoute] = useState<AppRoute>(() => normalize(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setRoute(normalize(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (next: AppRoute) => {
    if (next !== route) window.history.pushState({}, "", next);
    setRoute(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return { route, navigate };
}
