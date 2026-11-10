import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { appearanceOptions } from "@/lib/site-appearance";

/** Applies the owner's colour choice to every page after hydration. */
export function AppearanceTheme() {
  const { data } = useQuery(appearanceOptions);
  const theme = data?.theme ?? "green";

  useEffect(() => {
    document.documentElement.dataset["theme"] = theme;
    return () => { delete document.documentElement.dataset["theme"]; };
  }, [theme]);

  return null;
}
