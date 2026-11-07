import type { NavigateOptions } from "react-router-dom";

import { useEffect } from "react";
import { HeroUIProvider } from "@heroui/system";
import { useHref, useNavigate } from "react-router-dom";

import { resolveTheme, useUi } from "@/store/ui";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

/** Keeps `data-theme` on <html> in step with the preference and the OS. */
function useApplyTheme() {
  const mode = useUi((s) => s.theme);

  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(mode);
    };

    apply();

    if (mode !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    media.addEventListener("change", apply);

    return () => media.removeEventListener("change", apply);
  }, [mode]);
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  useApplyTheme();

  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      {children}
    </HeroUIProvider>
  );
}
