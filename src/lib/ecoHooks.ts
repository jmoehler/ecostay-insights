import { useEffect, useState } from "react";
import { AppConfig, loadConfig } from "@/config/appConfig";
import {
  LiveCustomer,
  Role,
  computeDailySavings,
  getRole,
  getSimDay,
  getSimDayProgress,
  loadLive,
  loadStays,
  saveLive,
  Stay,
} from "@/lib/ecoStore";

export function useConfig(): [AppConfig, (c: AppConfig) => void] {
  const [cfg, setCfg] = useState<AppConfig>(() => loadConfig());
  useEffect(() => {
    const onChange = () => setCfg(loadConfig());
    window.addEventListener("eco-config-change", onChange);
    return () => window.removeEventListener("eco-config-change", onChange);
  }, []);
  return [cfg, setCfg];
}

export function useRoleState(): [Role, () => void] {
  const [role, setR] = useState<Role>(() =>
    typeof window === "undefined" ? "customer" : getRole(),
  );
  useEffect(() => {
    const onChange = () => setR(getRole());
    window.addEventListener("eco-role-change", onChange);
    return () => window.removeEventListener("eco-role-change", onChange);
  }, []);
  return [role, () => {}];
}

// Live ticker: drives sim-day state, commits days into live history.
export function useSimTime(cfg: AppConfig) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 250);
    return () => clearInterval(id);
  }, []);
  const day = getSimDay(cfg);
  const progress = getSimDayProgress(cfg);
  const remainingSec = Math.max(
    0,
    Math.floor(cfg.time.secondsPerSimDay * (1 - progress)),
  );
  const hh = Math.floor((1 - progress) * 24)
    .toString()
    .padStart(2, "0");
  const mm = Math.floor(((1 - progress) * 24 * 60) % 60)
    .toString()
    .padStart(2, "0");
  return { day, progress, remainingSec, clock: `${hh}:${mm}` };
}

export function useLiveCustomer(cfg: AppConfig) {
  const [live, setLive] = useState<LiveCustomer>(() => loadLive(cfg));
  useEffect(() => {
    const onChange = () => setLive(loadLive(cfg));
    window.addEventListener("eco-live-change", onChange);
    return () => window.removeEventListener("eco-live-change", onChange);
  }, [cfg]);
  return [live, (l: LiveCustomer) => saveLive(l)] as const;
}

export function useStays(cfg: AppConfig): Stay[] {
  const [stays, setStays] = useState<Stay[]>(() => loadStays(cfg));
  useEffect(() => {
    const onChange = () => setStays(loadStays(cfg));
    window.addEventListener("eco-config-change", onChange);
    window.addEventListener("eco-live-change", onChange);
    return () => {
      window.removeEventListener("eco-config-change", onChange);
      window.removeEventListener("eco-live-change", onChange);
    };
  }, [cfg]);
  return stays;
}

// Commit-on-day-change effect for the live customer.
export function useLiveCommitter(cfg: AppConfig) {
  useEffect(() => {
    const tick = () => {
      const live = loadLive(cfg);
      const now = getSimDay(cfg);
      // Add train bonus once on first ever tick of stay
      let changed = false;
      const updated: LiveCustomer = { ...live, history: [...live.history] };
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
            thermostat: updated.decisions.thermostat,
            acOff: !updated.decisions.acOn,
            train: trainBonus > 0,
          },
        });
        // reset transient toggles for new day
        updated.decisions = {
          ...updated.decisions,
          skipCleaning: false,
          skipTowels: false,
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
