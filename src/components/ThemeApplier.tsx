import { useEffect } from "react";
import { useConfig } from "@/lib/ecoHooks";

export function ThemeApplier() {
  const [cfg] = useConfig();
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--eco-bg", cfg.theme.bg);
    r.setProperty("--eco-surface", cfg.theme.surface);
    r.setProperty("--eco-text", cfg.theme.text);
    r.setProperty("--eco-muted", cfg.theme.muted);
    r.setProperty("--eco-primary", cfg.theme.primary);
    r.setProperty("--eco-warning", cfg.theme.warning);
  }, [cfg.theme]);
  return null;
}
