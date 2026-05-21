import { AppConfig, evalScoreFormula } from "@/config/appConfig";

// ===== Types =====
export type Decisions = {
  skipCleaning: boolean; // true = save
  skipTowels: boolean; // true = save
  thermostat: number; // °C
  acOn: boolean;
  arrivedByTrain: boolean;
};

export type DailySavings = {
  day: number; // sim-day index (epoch days)
  co2: number;
  water: number;
  decisions: {
    cleaningSkipped: boolean;
    towelsSkipped: boolean;
    thermostat: number;
    acOff: boolean;
    train: boolean; // only true on day 0 of stay
  };
};

export type Stay = {
  id: string;
  startDay: number; // sim day index
  lengthDays: number;
  profile: "eco" | "conventional" | "mixed";
  days: DailySavings[];
};

export type LiveCustomer = {
  stayStartDay: number;
  decisions: Decisions;
  history: DailySavings[]; // committed days
  trainAdded: boolean;
};

// ===== Per-day savings calculation =====
export function computeDailySavings(
  d: Decisions,
  cfg: AppConfig,
): { co2: number; water: number } {
  const s = cfg.savings;
  let co2 = 0;
  let water = 0;
  if (d.skipCleaning) {
    co2 += s.cleaningSkipCo2;
    water += s.cleaningSkipWater;
  }
  if (d.skipTowels) {
    co2 += s.towelSkipCo2;
    water += s.towelSkipWater;
  }
  // Thermostat: each °C below baseline saves; above subtracts.
  const minClamp = Math.max(s.thermostatMin, 15);
  const effective = Math.max(minClamp, Math.min(s.thermostatMax, d.thermostat));
  const diff = s.thermostatBaseline - effective; // positive => savings
  co2 += diff * s.thermostatCoefPerDegree;
  if (!d.acOn) co2 += s.acOffCo2;
  return { co2, water };
}

export function computeScore(co2: number, water: number, cfg: AppConfig) {
  return evalScoreFormula(cfg.scoreFormula, co2, water);
}

// ===== Time simulation =====
// One "real" anchor: epoch ms when sim time started. Sim day index = floor((now-anchor)/dayMs).
const ANCHOR_KEY = "hotel_eco_time_anchor_v1";
export function getTimeAnchor(): number {
  let v = localStorage.getItem(ANCHOR_KEY);
  if (!v) {
    const now = Date.now();
    localStorage.setItem(ANCHOR_KEY, String(now));
    v = String(now);
  }
  return parseInt(v, 10);
}
export function resetTimeAnchor() {
  localStorage.removeItem(ANCHOR_KEY);
}
export function getSimDay(cfg: AppConfig): number {
  const dayMs = cfg.time.secondsPerSimDay * 1000;
  return Math.floor((Date.now() - getTimeAnchor()) / dayMs);
}
export function getSimDayProgress(cfg: AppConfig): number {
  const dayMs = cfg.time.secondsPerSimDay * 1000;
  return ((Date.now() - getTimeAnchor()) % dayMs) / dayMs;
}

// ===== Live customer =====
const LIVE_KEY = "hotel_eco_live_customer_v1";

export function defaultDecisions(cfg: AppConfig): Decisions {
  return {
    skipCleaning: false,
    skipTowels: false,
    thermostat: cfg.savings.thermostatBaseline,
    acOn: false,
    arrivedByTrain: true,
  };
}

export function loadLive(cfg: AppConfig): LiveCustomer {
  try {
    const raw = localStorage.getItem(LIVE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        stayStartDay: p.stayStartDay ?? getSimDay(cfg),
        decisions: { ...defaultDecisions(cfg), ...(p.decisions ?? {}) },
        history: Array.isArray(p.history) ? p.history : [],
        trainAdded: !!p.trainAdded,
      };
    }
  } catch {}
  const fresh: LiveCustomer = {
    stayStartDay: getSimDay(cfg),
    decisions: defaultDecisions(cfg),
    history: [],
    trainAdded: false,
  };
  localStorage.setItem(LIVE_KEY, JSON.stringify(fresh));
  return fresh;
}

export function saveLive(l: LiveCustomer) {
  localStorage.setItem(LIVE_KEY, JSON.stringify(l));
  window.dispatchEvent(new CustomEvent("eco-live-change"));
}

export function resetLiveCustomer(cfg: AppConfig) {
  const fresh: LiveCustomer = {
    stayStartDay: getSimDay(cfg),
    decisions: defaultDecisions(cfg),
    history: [],
    trainAdded: false,
  };
  saveLive(fresh);
  return fresh;
}

// ===== Dummy stays =====
const STAYS_KEY = "hotel_eco_stays_v1";

function rand(seed: () => number, min: number, max: number) {
  return min + seed() * (max - min);
}
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateDummyStays(cfg: AppConfig): Stay[] {
  const seed = mulberry32(42);
  const today = getSimDay(cfg);
  const stays: Stay[] = [];
  for (let i = 0; i < 50; i++) {
    const r = seed();
    const profile: Stay["profile"] = r < 0.3 ? "eco" : r < 0.6 ? "conventional" : "mixed";
    const length = Math.max(1, Math.floor(rand(seed, 1, 10)));
    const startOffset = Math.floor(rand(seed, 0, 30));
    const startDay = today - startOffset;
    const stay: Stay = { id: `dummy-${i}`, startDay, lengthDays: length, profile, days: [] };
    const train =
      profile === "eco" ? seed() < 0.85 : profile === "conventional" ? seed() < 0.05 : seed() < 0.4;
    for (let day = 0; day < length; day++) {
      let d: Decisions;
      if (profile === "eco") {
        d = {
          skipCleaning: seed() < 0.85,
          skipTowels: seed() < 0.8,
          thermostat: Math.round(rand(seed, 17, 19)),
          acOn: false,
          arrivedByTrain: train,
        };
      } else if (profile === "conventional") {
        d = {
          skipCleaning: false,
          skipTowels: false,
          thermostat: Math.round(rand(seed, 21, 24)),
          acOn: true,
          arrivedByTrain: train,
        };
      } else {
        d = {
          skipCleaning: seed() < 0.4,
          skipTowels: seed() < 0.5,
          thermostat: Math.round(rand(seed, 19, 22)),
          acOn: seed() < 0.5,
          arrivedByTrain: train,
        };
      }
      const { co2, water } = computeDailySavings(d, cfg);
      stay.days.push({
        day: startDay + day,
        co2: co2 + (day === 0 && train ? cfg.savings.trainBonusCo2 : 0),
        water,
        decisions: {
          cleaningSkipped: d.skipCleaning,
          towelsSkipped: d.skipTowels,
          thermostat: d.thermostat,
          acOff: !d.acOn,
          train: day === 0 && train,
        },
      });
    }
    stays.push(stay);
  }
  return stays;
}

export function loadStays(cfg: AppConfig): Stay[] {
  const raw = localStorage.getItem(STAYS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {}
  }
  const seeded = generateDummyStays(cfg);
  localStorage.setItem(STAYS_KEY, JSON.stringify(seeded));
  return seeded;
}

export function resetAllData() {
  localStorage.removeItem(STAYS_KEY);
  localStorage.removeItem(LIVE_KEY);
  localStorage.removeItem(ANCHOR_KEY);
  localStorage.removeItem("hotel_eco_config_v1");
  window.dispatchEvent(new CustomEvent("eco-config-change"));
  window.dispatchEvent(new CustomEvent("eco-live-change"));
}

// ===== Role =====
const ROLE_KEY = "hotel_eco_role_v1";
export type Role = "customer" | "manager";
export function getRole(): Role {
  return (localStorage.getItem(ROLE_KEY) as Role) || "customer";
}
export function setRole(r: Role) {
  localStorage.setItem(ROLE_KEY, r);
  window.dispatchEvent(new CustomEvent("eco-role-change"));
}