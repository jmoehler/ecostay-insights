import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Droplet,
  Cloud,
  Train,
  Thermometer,
  Wind,
  Sparkles,
  BedDouble,
  Shirt,
  RotateCcw,
} from "lucide-react";
import { TreeField } from "@/components/TreeField";
import {
  useConfig,
  useLiveCommitter,
  useLiveCustomer,
  useSimTime,
} from "@/lib/ecoHooks";
import {
  computeDailySavings,
  computeScore,
  resetLiveCustomer,
} from "@/lib/ecoStore";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [cfg] = useConfig();
  useLiveCommitter(cfg);
  const [live, setLive] = useLiveCustomer(cfg);
  const { progress } = useSimTime(cfg);

  const todayLive = computeDailySavings(live.decisions, cfg);
  const totalCo2 =
    live.history.reduce((s, d) => s + d.co2, 0) + todayLive.co2;
  const totalWater =
    live.history.reduce((s, d) => s + d.water, 0) + todayLive.water;
  const trainBonus =
    live.decisions.arrivedByTrain && !live.trainAdded
      ? cfg.savings.trainBonusCo2
      : 0;
  const displayCo2 = Math.max(0, totalCo2 + trainBonus);
  const displayWater = Math.max(0, totalWater);
  const score = computeScore(displayCo2, displayWater, cfg);

  const toggle = (k: "skipCleaning" | "skipTowels" | "acOn") =>
    setLive({ ...live, decisions: { ...live.decisions, [k]: !live.decisions[k] } });
  const setTemp = (t: number) =>
    setLive({ ...live, decisions: { ...live.decisions, thermostat: t } });

  const impact = useMemo(() => {
    const s = cfg.savings;
    return {
      cleaning: `+${s.cleaningSkipWater} L · +${s.cleaningSkipCo2} kg CO₂ / day`,
      towels: `+${s.towelSkipWater} L · +${s.towelSkipCo2} kg CO₂ / day`,
      acOff: `+${s.acOffCo2} kg CO₂ / day`,
    };
  }, [cfg]);

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
      {/* iPad bezel */}
      <div
        className="relative rounded-[44px] p-3 shadow-2xl"
        style={{
          width: "min(100%, 1180px)",
          background:
            "linear-gradient(145deg, #0e1620, #0a1018)",
          boxShadow:
            "0 30px 80px -20px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        <div
          className="relative overflow-hidden rounded-[32px]"
          style={{
            width: "100%",
            height: 820,
            backgroundColor: "var(--eco-bg)",
          }}
        >
          {/* sim-day progress bar */}
          <div
            className="absolute left-0 right-0 top-0 h-1"
            style={{ backgroundColor: "color-mix(in oklab, var(--eco-primary) 25%, transparent)" }}
          >
            <div
              className="h-full"
              style={{
                width: `${progress * 100}%`,
                backgroundColor: "var(--eco-primary)",
                transition: "width 250ms linear",
              }}
            />
          </div>

          <div className="flex h-full flex-col gap-4 overflow-y-auto p-6">
            {/* Tree field */}
            <TreeField score={score} cfg={cfg} />

            {/* Stat tiles */}
            <div className="grid grid-cols-2 gap-4">
              <StatTile
                label="CO₂ saved"
                value={displayCo2.toFixed(1)}
                unit="kg"
                icon={<Cloud size={22} />}
                accent="primary"
              />
              <StatTile
                label="Water saved"
                value={Math.round(displayWater).toString()}
                unit="L"
                icon={<Droplet size={22} />}
                accent="primary"
              />
            </div>

            {/* Train card */}
            <Card>
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "color-mix(in oklab, var(--eco-primary) 20%, transparent)", color: "var(--eco-primary)" }}
                >
                  <Train size={22} />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Arrived by train</div>
                  <div className="text-xs" style={{ color: "var(--eco-muted)" }}>
                    From booking data.
                  </div>
                </div>
                <div
                  className="rounded-full px-3 py-1 text-sm font-medium"
                  style={{ backgroundColor: "color-mix(in oklab, var(--eco-primary) 18%, transparent)", color: "var(--eco-primary)" }}
                >
                  +{cfg.savings.trainBonusCo2} kg CO₂
                </div>
              </div>
            </Card>

            {/* Decisions */}
            <div className="grid grid-cols-2 gap-4">
              <ToggleCard
                icon={<BedDouble size={22} />}
                title="Skip room cleaning"
                tooltip={impact.cleaning}
                active={live.decisions.skipCleaning}
                onToggle={() => toggle("skipCleaning")}
              />
              <ToggleCard
                icon={<Shirt size={22} />}
                title="Skip towel change"
                tooltip={impact.towels}
                active={live.decisions.skipTowels}
                onToggle={() => toggle("skipTowels")}
              />
              <ThermoCard
                value={live.decisions.thermostat}
                onChange={setTemp}
                cfg={cfg}
              />
              <ToggleCard
                icon={<Wind size={22} />}
                title="Air conditioning"
                tooltip={
                  live.decisions.acOn
                    ? "AC on — full draw"
                    : `AC off — ${impact.acOff}`
                }
                active={!live.decisions.acOn}
                activeLabel="Off"
                inactiveLabel="On"
                onToggle={() => toggle("acOn")}
              />
            </div>

            <button
              onClick={() => resetLiveCustomer(cfg)}
              className="mt-auto flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--eco-surface)",
                color: "var(--eco-muted)",
              }}
            >
              <RotateCcw size={16} />
              Reset customer / New stay
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ backgroundColor: "var(--eco-surface)" }}
    >
      {children}
    </div>
  );
}

function StatTile({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  accent?: "primary" | "warning";
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5"
      style={{ backgroundColor: "var(--eco-surface)" }}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm" style={{ color: "var(--eco-muted)" }}>
          {label}
        </div>
        <div style={{ color: "var(--eco-primary)" }}>{icon}</div>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <div
          className="text-4xl font-semibold tabular-nums tracking-tight"
          style={{ color: "var(--eco-text)", transition: "all 400ms ease" }}
        >
          {value}
        </div>
        <div className="text-sm" style={{ color: "var(--eco-muted)" }}>
          {unit}
        </div>
      </div>
      <Sparkles
        size={80}
        className="pointer-events-none absolute -right-4 -bottom-4 opacity-[0.06]"
      />
    </div>
  );
}

function ToggleCard({
  icon,
  title,
  tooltip,
  active,
  activeLabel = "On",
  inactiveLabel = "Off",
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  tooltip: string;
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="group flex flex-col gap-3 rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
      style={{
        backgroundColor: active
          ? "color-mix(in oklab, var(--eco-primary) 18%, var(--eco-surface))"
          : "var(--eco-surface)",
        outline: active ? "1px solid var(--eco-primary)" : "1px solid transparent",
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            backgroundColor: active
              ? "var(--eco-primary)"
              : "color-mix(in oklab, var(--eco-text) 10%, transparent)",
            color: active ? "var(--primary-foreground)" : "var(--eco-muted)",
          }}
        >
          {icon}
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-xs font-medium"
          style={{
            backgroundColor: active
              ? "color-mix(in oklab, var(--eco-primary) 30%, transparent)"
              : "color-mix(in oklab, var(--eco-text) 10%, transparent)",
            color: active ? "var(--eco-primary)" : "var(--eco-muted)",
          }}
        >
          {active ? activeLabel : inactiveLabel}
        </span>
      </div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs" style={{ color: "var(--eco-muted)" }}>
          {tooltip}
        </div>
      </div>
    </button>
  );
}

function ThermoCard({
  value,
  onChange,
  cfg,
}: {
  value: number;
  onChange: (n: number) => void;
  cfg: ReturnType<typeof useConfig>[0];
}) {
  const { thermostatMin: min, thermostatMax: max, thermostatBaseline: base, thermostatCoefPerDegree: coef } = cfg.savings;
  const diff = base - value;
  const impact =
    diff > 0
      ? `+${(diff * coef).toFixed(1)} kg CO₂ / day`
      : diff < 0
        ? `−${(Math.abs(diff) * coef).toFixed(1)} kg CO₂ / day`
        : "Baseline";
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl p-4"
      style={{ backgroundColor: "var(--eco-surface)" }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            backgroundColor: "color-mix(in oklab, var(--eco-primary) 20%, transparent)",
            color: "var(--eco-primary)",
          }}
        >
          <Thermometer size={22} />
        </div>
        <div className="text-2xl font-semibold tabular-nums">{value}°C</div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full accent-[var(--eco-primary)]"
      />
      <div className="flex justify-between text-xs" style={{ color: "var(--eco-muted)" }}>
        <span>Thermostat</span>
        <span>{impact}</span>
      </div>
    </div>
  );
}
}
