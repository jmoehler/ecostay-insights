// Central config — single source of truth for both Customer UI and Admin panel.
// All values persisted to localStorage. Admin writes via setConfig().

export type AppConfig = {
  savings: {
    cleaningSkipWater: number; // L per day
    cleaningSkipCo2: number; // kg per day
    towelSkipWater: number;
    towelSkipCo2: number;
    linenSkipWater: number;
    linenSkipCo2: number;
    thermostatCoefPerDegree: number; // kg CO2 saved per °C below baseline
    thermostatBaseline: number; // °C
    thermostatMin: number;
    thermostatMax: number;
    acOffCo2: number; // kg per day when AC off (vs on)
    trainBonusCo2: number; // one-time kg
  };
  finance: {
    eurPerKgCo2: number;
    eurPerLWater: number;
  };
  scoreFormula: string; // expression in `co2` and `water`
  trees: {
    scorePerTree: number;
    maxTrees: number;
    startingTree: number;
  };
  time: {
    secondsPerSimDay: number;
  };
  hotel: {
    backgroundEnabled: boolean;
    totalRooms: number;
    occupancyPct: number;
    occupancyVariancePct: number;
    avgStayDays: number;
    lookbackDays: number;
    ecoSharePct: number;
    mixedSharePct: number;
  };
  theme: {
    bg: string;
    surface: string;
    text: string;
    muted: string;
    primary: string;
    warning: string;
  };
};

export const DEFAULT_CONFIG: AppConfig = {
  savings: {
    cleaningSkipWater: 12,
    cleaningSkipCo2: 10,
    towelSkipWater: 20,
    towelSkipCo2: 5,
    linenSkipWater: 30,
    linenSkipCo2: 5,
    thermostatCoefPerDegree: 1,
    thermostatBaseline: 20,
    thermostatMin: 16,
    thermostatMax: 28,
    acOffCo2: 3,
    trainBonusCo2: 50,
  },
  finance: {
    eurPerKgCo2: 0.08,
    eurPerLWater: 0.002,
  },
  scoreFormula: "co2 + water",
  trees: {
    scorePerTree: 50,
    maxTrees: 10,
    startingTree: 0,
  },
  time: {
    secondsPerSimDay: 120,
  },
  hotel: {
    backgroundEnabled: true,
    totalRooms: 80,
    occupancyPct: 92,
    occupancyVariancePct: 6,
    avgStayDays: 3,
    lookbackDays: 120,
    ecoSharePct: 30,
    mixedSharePct: 45,
  },
  theme: {
    bg: "#f5f8f4",
    surface: "#ffffff",
    text: "#173127",
    muted: "#6d7f72",
    primary: "#2f8f57",
    warning: "#d90606",
  },
};

const KEY = "hotel_eco_config_v1";

export function loadConfig(): AppConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    // shallow-merge nested with defaults to tolerate added fields
    const merged: AppConfig = {
      ...DEFAULT_CONFIG,
      ...parsed,
      savings: { ...DEFAULT_CONFIG.savings, ...(parsed.savings ?? {}) },
      finance: { ...DEFAULT_CONFIG.finance, ...(parsed.finance ?? {}) },
      trees: { ...DEFAULT_CONFIG.trees, ...(parsed.trees ?? {}) },
      time: { ...DEFAULT_CONFIG.time, ...(parsed.time ?? {}) },
      hotel: { ...DEFAULT_CONFIG.hotel, ...(parsed.hotel ?? {}) },
      theme: { ...DEFAULT_CONFIG.theme, ...(parsed.theme ?? {}) },
    };
    return merged;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(cfg: AppConfig) {
  localStorage.setItem(KEY, JSON.stringify(cfg));
  window.dispatchEvent(new CustomEvent("eco-config-change"));
}

// Safe formula evaluation. Only allows numbers, the two vars co2/water,
// and basic math operators. No function calls, no identifiers.
export function evalScoreFormula(formula: string, co2: number, water: number): number {
  const cleaned = formula.replace(/\s+/g, "");
  if (!/^[0-9co2water+\-*/().]+$/i.test(cleaned)) return co2 + water;
  // Replace tokens
  const expr = cleaned.replace(/co2/gi, `(${co2})`).replace(/water/gi, `(${water})`);
  // Final safety: only digits, ops, parens, decimal
  if (!/^[0-9+\-*/().]+$/.test(expr)) return co2 + water;
  try {
    // eslint-disable-next-line no-new-func
    const v = Function(`"use strict"; return (${expr});`)();
    return typeof v === "number" && isFinite(v) ? v : co2 + water;
  } catch {
    return co2 + water;
  }
}