import { useEffect } from "react";

import { useSettings } from "@/store/settings";

/**
 * Ages are read off birth dates when settings load or change, which is
 * enough unless a tab is left open across a birthday. Re-reading them each
 * time the tab comes back into view closes that gap. Run once at app root.
 */
export function useKeepAgesCurrent() {
  const refreshAges = useSettings((s) => s.refreshAges);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshAges();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refreshAges);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refreshAges);
    };
  }, [refreshAges]);
}
