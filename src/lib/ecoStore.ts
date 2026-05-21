import { AppConfig, evalScoreFormula } from "@/config/appConfig";

// ===== Types =====
export type Decisions = {
  skipCleaning: boolean; // true = save
  skipTowels: boolean; // true = save
  skipLinen: boolean; // true = save
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
    linenSkipped: boolean;
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
  stayStartProgress: number; // 0..1 progress within stayStartDay when guest checked in
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
  if (d.skipLinen) {
    co2 += s.linenSkipCo2;
    water += s.linenSkipWater;
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
  if (typeof window === "undefined") return Date.now();
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

export type CustomerViewMode = "green" | "conventional";

export function getSkipDefaultsForView(view: CustomerViewMode) {
  const shouldSkipByDefault = view === "green";
  return {
    skipCleaning: shouldSkipByDefault,
    skipTowels: shouldSkipByDefault,
    skipLinen: shouldSkipByDefault,
  };
}

export function defaultDecisions(
  cfg: AppConfig,
  view: CustomerViewMode = "green",
): Decisions {
  const skipDefaults = getSkipDefaultsForView(view);
  return {
    ...skipDefaults,
    thermostat: cfg.savings.thermostatBaseline,
    acOn: false,
    arrivedByTrain: true,
  };
}

export function loadLive(cfg: AppConfig): LiveCustomer {
  if (typeof window === "undefined") {
    return {
      stayStartDay: 0,
      stayStartProgress: 0,
      decisions: defaultDecisions(cfg),
      history: [],
      trainAdded: false,
    };
  }
  try {
    const raw = localStorage.getItem(LIVE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        stayStartDay: p.stayStartDay ?? getSimDay(cfg),
        stayStartProgress:
          typeof p.stayStartProgress === "number"
            ? Math.max(0, Math.min(1, p.stayStartProgress))
            : 0,
        decisions: { ...defaultDecisions(cfg, getCustomerView()), ...(p.decisions ?? {}) },
        history: Array.isArray(p.history) ? p.history : [],
        trainAdded: !!p.trainAdded,
      };
    }
  } catch {}
  const fresh: LiveCustomer = {
    stayStartDay: getSimDay(cfg),
    stayStartProgress: getSimDayProgress(cfg),
    decisions: defaultDecisions(cfg, getCustomerView()),
    history: [],
    trainAdded: false,
  };
  localStorage.setItem(LIVE_KEY, JSON.stringify(fresh));
  return fresh;
}

export function saveLive(l: LiveCustomer) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LIVE_KEY, JSON.stringify(l));
  window.dispatchEvent(new CustomEvent("eco-live-change"));
}

export function resetLiveCustomer(cfg: AppConfig) {
  const fresh: LiveCustomer = {
    stayStartDay: getSimDay(cfg),
    stayStartProgress: getSimDayProgress(cfg),
    decisions: defaultDecisions(cfg, getCustomerView()),
    history: [],
    trainAdded: false,
  };
  saveLive(fresh);
  return fresh;
}

// ===== Background hotel stays =====
const STAYS_KEY = "hotel_eco_stays_v1";

function rand(seed: () => number, min: number, max: number) {
  return min + seed() * (max - min);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(cfg: AppConfig) {
  const h = cfg.hotel;
  const s = cfg.savings;
  return (
    1 +
    h.totalRooms * 104729 +
    Math.round(h.occupancyPct * 100) * 193 +
    Math.round(h.avgStayDays * 100) * 389 +
    Math.round(s.thermostatBaseline * 10) * 997
  );
}

function pickProfile(rng: () => number, cfg: AppConfig): Stay["profile"] {
  const eco = clamp(cfg.hotel.ecoSharePct, 0, 100);
  const mixed = clamp(cfg.hotel.mixedSharePct, 0, 100);
  const sum = eco + mixed;
  const ecoNorm = sum > 100 ? (eco / sum) * 100 : eco;
  const mixedNorm = sum > 100 ? (mixed / sum) * 100 : mixed;
  const roll = rng() * 100;
  if (roll < ecoNorm) return "eco";
  if (roll < ecoNorm + mixedNorm) return "mixed";
  return "conventional";
}

function sampleStayLength(rng: () => number, cfg: AppConfig) {
  const avg = clamp(cfg.hotel.avgStayDays, 1, 14);
  const min = Math.max(1, Math.floor(avg * 0.5));
  const max = Math.max(min + 1, Math.ceil(avg * 2.1));
  return Math.max(1, Math.round(rand(rng, min, max)));
}

function decisionsForProfile(
  profile: Stay["profile"],
  rng: () => number,
  cfg: AppConfig,
): Decisions {
  const base = cfg.savings.thermostatBaseline;
  if (profile === "eco") {
    return {
      skipCleaning: rng() < 0.8,
      skipTowels: rng() < 0.82,
      skipLinen: rng() < 0.74,
      thermostat: Math.round(rand(rng, base - 2.5, base - 0.5)),
      acOn: rng() < 0.15,
      arrivedByTrain: rng() < 0.62,
    };
  }
  if (profile === "conventional") {
    return {
      skipCleaning: rng() < 0.08,
      skipTowels: rng() < 0.18,
      skipLinen: rng() < 0.14,
      thermostat: Math.round(rand(rng, base + 1, base + 4)),
      acOn: rng() < 0.82,
      arrivedByTrain: rng() < 0.1,
    };
  }
  return {
    skipCleaning: rng() < 0.42,
    skipTowels: rng() < 0.55,
    skipLinen: rng() < 0.46,
    thermostat: Math.round(rand(rng, base - 1, base + 2)),
    acOn: rng() < 0.45,
    arrivedByTrain: rng() < 0.28,
  };
}

function targetOccupancyRooms(day: number, cfg: AppConfig, rng: () => number) {
  const h = cfg.hotel;
  const dow = ((day % 7) + 7) % 7;
  const weekendBump = dow === 5 || dow === 6 ? 3 : dow === 0 ? 1 : 0;
  const midweekDip = dow === 2 ? -1 : 0;
  const seasonalWave = Math.sin(day / 18) * 2.5;
  const noise = rand(rng, -h.occupancyVariancePct, h.occupancyVariancePct);
  const pct = clamp(
    h.occupancyPct + weekendBump + midweekDip + seasonalWave + noise,
    45,
    99,
  );
  return clamp(Math.round((h.totalRooms * pct) / 100), 0, h.totalRooms);
}

export function generateBackgroundStays(cfg: AppConfig, simDay: number): Stay[] {
  if (!cfg.hotel.backgroundEnabled || cfg.hotel.totalRooms <= 0) return [];
  const rng = mulberry32(hashSeed(cfg));
  const lookbackDays = Math.max(30, Math.round(cfg.hotel.lookbackDays));
  const recordStart = simDay - lookbackDays + 1;
  const warmupDays = Math.max(14, Math.ceil(cfg.hotel.avgStayDays * 3));
  const simulationStart = recordStart - warmupDays;
  const stays: Stay[] = [];
  const rooms: Array<{ stay: Stay; remainingDays: number; train: boolean } | null> =
    Array.from({ length: Math.max(0, Math.round(cfg.hotel.totalRooms)) }, () => null);
  let stayCounter = 0;

  for (let day = simulationStart; day <= simDay; day++) {
    const targetRooms = targetOccupancyRooms(day, cfg, rng);
    let occupied = rooms.reduce((n, r) => n + (r ? 1 : 0), 0);
    const toCheckIn = Math.max(0, targetRooms - occupied);

    if (toCheckIn > 0) {
      const emptyIndices: number[] = [];
      for (let i = 0; i < rooms.length; i++) {
        if (!rooms[i]) emptyIndices.push(i);
      }
      for (let i = 0; i < Math.min(toCheckIn, emptyIndices.length); i++) {
        const roomIndex = emptyIndices[i];
        const profile = pickProfile(rng, cfg);
        const lengthDays = sampleStayLength(rng, cfg);
        const trainProb =
          profile === "eco" ? 0.62 : profile === "mixed" ? 0.28 : 0.1;
        const train = rng() < trainProb;
        const stay: Stay = {
          id: `bg-${day}-${stayCounter++}`,
          startDay: day,
          lengthDays,
          profile,
          days: [],
        };
        rooms[roomIndex] = { stay, remainingDays: lengthDays, train };
        stays.push(stay);
      }
      occupied = rooms.reduce((n, r) => n + (r ? 1 : 0), 0);
    }

    if (occupied === 0) continue;
    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      if (!room) continue;
      const d = decisionsForProfile(room.stay.profile, rng, cfg);
      const { co2, water } = computeDailySavings(d, cfg);
      if (day >= recordStart) {
        room.stay.days.push({
          day,
          co2: co2 + (day === room.stay.startDay && room.train ? cfg.savings.trainBonusCo2 : 0),
          water,
          decisions: {
            cleaningSkipped: d.skipCleaning,
            towelsSkipped: d.skipTowels,
            linenSkipped: d.skipLinen,
            thermostat: d.thermostat,
            acOff: !d.acOn,
            train: day === room.stay.startDay && room.train,
          },
        });
      }
      room.remainingDays -= 1;
      if (room.remainingDays <= 0) {
        rooms[i] = null;
      }
    }
  }

  return stays.filter((s) => s.days.length > 0 || s.startDay + s.lengthDays > simDay);
}

export function generateDummyStays(cfg: AppConfig): Stay[] {
  return generateBackgroundStays(cfg, getSimDay(cfg));
}

export function loadStays(cfg: AppConfig, simDay = getSimDay(cfg)): Stay[] {
  if (typeof window === "undefined") return [];
  return generateBackgroundStays(cfg, simDay);
}

export function resetAllData() {
  if (typeof window === "undefined") return;
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
  if (typeof window === "undefined") return "customer";
  return (localStorage.getItem(ROLE_KEY) as Role) || "customer";
}
export function setRole(r: Role) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROLE_KEY, r);
  window.dispatchEvent(new CustomEvent("eco-role-change"));
}

const CUSTOMER_VIEW_KEY = "hotel_eco_customer_view_v1";

export function getCustomerView(): CustomerViewMode {
  if (typeof window === "undefined") return "green";
  return localStorage.getItem(CUSTOMER_VIEW_KEY) === "conventional"
    ? "conventional"
    : "green";
}

export function setCustomerView(v: CustomerViewMode) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOMER_VIEW_KEY, v);
  window.dispatchEvent(new CustomEvent("eco-customer-view-change"));
}