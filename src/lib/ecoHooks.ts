import { useEffect, useState } from "react";
import { AppConfig, DEFAULT_CONFIG, loadConfig } from "@/config/appConfig";
import {
  defaultDecisions,
  LiveGuest,
  Role,
  computeDailySavings,
  getGuestView,
  getRole,
  getSkipDefaultsForView,
  getSimDay,
  getSimDayProgress,
  loadLive,
  loadStays,
  saveLive,
  Stay,
} from "@/lib/ecoStore";

export function useConfig(): [AppConfig, (c: AppConfig) => void] {
  const [cfg, setCfg] = useState<AppConfig>(DEFAULT_CONFIG);
  useEffect(() => {
    setCfg(loadConfig());
    const onChange = () => setCfg(loadConfig());
    window.addEventListener("eco-config-change", onChange);
    return () => window.removeEventListener("eco-config-change", onChange);
  }, []);
  return [cfg, setCfg];
}

export function useRoleState(): [Role, () => void] {
  const [role, setR] = useState<Role>("guest");
  useEffect(() => {
    setR(getRole());
    const onChange = () => setR(getRole());
    window.addEventListener("eco-role-change", onChange);
    return () => window.removeEventListener("eco-role-change", onChange);
  }, []);
  return [role, () => {}];
}

// Live ticker: drives sim-day state, commits days into live history.
export function useSimTime(cfg: AppConfig) {
  const [hydrated, setHydrated] = useState(false);
  const [, force] = useState(0);
  useEffect(() => {
    setHydrated(true);
    const id = setInterval(() => force((n) => n + 1), 250);
    return () => clearInterval(id);
  }, []);
  if (!hydrated) {
    return {
      day: 0,
      progress: 0,
      remainingSec: cfg.time.secondsPerSimDay,
      clock: "24h",
    };
  }
  const day = getSimDay(cfg);
  const progress = getSimDayProgress(cfg);
  const remainingSec = Math.max(
    0,
    Math.floor(cfg.time.secondsPerSimDay * (1 - progress)),
  );
  const hoursLeft = Math.floor((1 - progress) * 24)
    .toString()
    .padStart(2, "0");
  return { day, progress, remainingSec, clock: `${hoursLeft}h` };
}

function getInitialLive(cfg: AppConfig): LiveGuest {
  return {
    stayStartDay: 0,
    stayStartProgress: 0,
    decisions: defaultDecisions(cfg),
    history: [],
    trainAdded: false,
  };
}

export function useLiveGuest(cfg: AppConfig) {
  const [live, setLive] = useState<LiveGuest>(() => getInitialLive(cfg));
  useEffect(() => {
    setLive(loadLive(cfg));
    const onChange = () => setLive(loadLive(cfg));
    window.addEventListener("eco-live-change", onChange);
    return () => window.removeEventListener("eco-live-change", onChange);
  }, [cfg]);
  return [live, (l: LiveGuest) => saveLive(l)] as const;
}

export function useStays(cfg: AppConfig, simDay: number): Stay[] {
  const [stays, setStays] = useState<Stay[]>([]);
  useEffect(() => {
    setStays(loadStays(cfg, simDay));
    const onChange = () => setStays(loadStays(cfg, simDay));
    window.addEventListener("eco-config-change", onChange);
    return () => {
      window.removeEventListener("eco-config-change", onChange);
    };
  }, [cfg, simDay]);
  return stays;
}

// Commit-on-day-change effect for the live guest.
export function useLiveCommitter(cfg: AppConfig) {
  useEffect(() => {
    const tick = () => {
      const live = loadLive(cfg);
      const now = getSimDay(cfg);
      // Add train bonus once on first ever tick of stay
      let changed = false;
      const updated: LiveGuest = { ...live, history: [...live.history] };
      if (!updated.trainAdded && updated.decisions.arrivedByTrain) {
        // No history entry yet — train counted separately on day 0 commit
      }
      // Commit any days strictly less than `now` and after stayStartDay
      // that aren't already in history.
      const existing = new Set(updated.history.map((d) => d.day));
      for (let d = updated.stayStartDay; d < now; d++) {
        if (existing.has(d)) continue;
        const { co2, water } = computeDailySavings(updated.decisions, cfg);
        const isFirst = d === updated.stayStartDay;
        const trainBonus =
          isFirst && updated.decisions.arrivedByTrain && !updated.trainAdded
            ? cfg.savings.trainBonusCo2
            : 0;
        if (trainBonus > 0) updated.trainAdded = true;
        updated.history.push({
          day: d,
          co2: co2 + trainBonus,
          water,
          decisions: {
            cleaningSkipped: updated.decisions.skipCleaning,
            towelsSkipped: updated.decisions.skipTowels,
            linenSkipped: updated.decisions.skipLinen,
            thermostat: updated.decisions.thermostat,
            acOff: !updated.decisions.acOn,
            train: trainBonus > 0,
          },
        });
        // reset transient toggles for new day
        updated.decisions = {
          ...updated.decisions,
          ...getSkipDefaultsForView(getGuestView()),
          thermostat: cfg.savings.thermostatBaseline,
          acOn: false,
        };
        changed = true;
      }
      if (changed) saveLive(updated);
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cfg]);
}
