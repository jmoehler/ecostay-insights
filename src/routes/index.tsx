import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Droplet,
  Cloud,
  Train,
  Thermometer,
  Wind,
  BedDouble,
  Shirt,
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
  getCustomerView,
  getSkipDefaultsForView,
  setCustomerView,
} from "@/lib/ecoStore";

export const Route = createFileRoute("/")({
  component: Index,
});

type CustomerView = "green" | "conventional";

function Index() {
  const [cfg] = useConfig();
  useLiveCommitter(cfg);
  const [live, setLive] = useLiveCustomer(cfg);
  const [view, setView] = useState<CustomerView>("green");
  useEffect(() => {
    setView(getCustomerView());
  }, []);
  const { day: simDay, progress } = useSimTime(cfg);
  const isGreenView = view === "green";
  const accentColor = isGreenView ? "var(--eco-primary)" : "#1f3b73";

  const liveDayProgress =
    simDay === live.stayStartDay
      ? Math.max(0, progress - live.stayStartProgress)
      : progress;

  const todayProjected = computeDailySavings(live.decisions, cfg);
  const todayLive = {
    co2: todayProjected.co2 * liveDayProgress,
    water: todayProjected.water * liveDayProgress,
  };
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
      cleaning: `If skipped: +${s.cleaningSkipWater} L · +${s.cleaningSkipCo2} kg CO₂ / day`,
      towels: `If skipped: +${s.towelSkipWater} L · +${s.towelSkipCo2} kg CO₂ / day`,
      acOff: `+${s.acOffCo2} kg CO₂ / day`,
    };
  }, [cfg]);

  const applyViewDefaults = (nextView: CustomerView) => {
    setView(nextView);
    setCustomerView(nextView);
    setLive({
      ...live,
      decisions: {
        ...live.decisions,
        ...getSkipDefaultsForView(nextView),
      },
    });
  };

  return (
    <main className="mx-auto max-w-6xl p-6">
      <section
        className="relative overflow-hidden rounded-md border shadow-sm"
        style={{
          backgroundColor: "var(--eco-surface)",
          borderColor: "var(--border)",
        }}
      >
          {/* sim-day progress bar */}
          <div
            className="absolute left-0 right-0 top-0 h-1"
            style={{ backgroundColor: `color-mix(in oklab, ${accentColor} 15%, white)` }}
          >
            <div
              className="h-full"
              style={{
                width: `${progress * 100}%`,
                backgroundColor: accentColor,
                transition: "width 250ms linear",
              }}
            />
          </div>

          <div className="flex flex-col gap-4 p-6">
            {isGreenView ? (
              <>
                {/* Tree field */}
                <TreeField score={score} cfg={cfg} />

                {/* Stat tiles */}
                <div className="grid grid-cols-2 gap-4">
                  <StatTile
                    label="CO₂ saved"
                    value={displayCo2.toFixed(1)}
                    unit="kg"
                    icon={<Cloud size={22} />}
                    accentColor={accentColor}
                  />
                  <StatTile
                    label="Water saved"
                    value={Math.round(displayWater).toString()}
                    unit="L"
                    icon={<Droplet size={22} />}
                    accentColor={accentColor}
                  />
                </div>

                {/* Train card */}
                <Card>
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-sm"
                      style={{ backgroundColor: `color-mix(in oklab, ${accentColor} 12%, white)`, color: accentColor }}
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
                      className="rounded-sm border px-3 py-1 text-sm font-medium"
                      style={{ backgroundColor: `color-mix(in oklab, ${accentColor} 8%, white)`, color: accentColor, borderColor: `color-mix(in oklab, ${accentColor} 35%, white)` }}
                    >
                      +{cfg.savings.trainBonusCo2} kg CO₂
                    </div>
                  </div>
                </Card>
              </>
            ) : null}

            {/* Decisions */}
            <div className="grid grid-cols-2 gap-4">
              <ToggleCard
                icon={<BedDouble size={22} />}
                title="Request room cleaning"
                tooltip={impact.cleaning}
                active={!live.decisions.skipCleaning}
                activeLabel="Requested"
                inactiveLabel="Skipped"
                accentColor={accentColor}
                onToggle={() => toggle("skipCleaning")}
              />
              <ToggleCard
                icon={<Shirt size={22} />}
                title="Request towel change"
                tooltip={impact.towels}
                active={!live.decisions.skipTowels}
                activeLabel="Requested"
                inactiveLabel="Skipped"
                accentColor={accentColor}
                onToggle={() => toggle("skipTowels")}
              />
              <ThermoCard
                value={live.decisions.thermostat}
                onChange={setTemp}
                cfg={cfg}
                accentColor={accentColor}
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
                accentColor={accentColor}
                onToggle={() => toggle("acOn")}
              />
            </div>

            <div className="mt-1 flex justify-center">
              <div
                className="inline-flex items-center rounded-sm border p-1"
                style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}
              >
                <button
                  onClick={() => applyViewDefaults("green")}
                  className="rounded-sm px-3 py-1.5 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: view === "green" ? "var(--eco-primary)" : "transparent",
                    color: view === "green" ? "var(--primary-foreground)" : "var(--eco-muted)",
                  }}
                >
                  Green options
                </button>
                <button
                  onClick={() => applyViewDefaults("conventional")}
                  className="rounded-sm px-3 py-1.5 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: view === "conventional" ? "#1f3b73" : "transparent",
                    color: view === "conventional" ? "#ffffff" : "var(--eco-muted)",
                  }}
                >
                  Conventional view
                </button>
              </div>
            </div>
          </div>
      </section>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-md border p-4"
      style={{ backgroundColor: "var(--eco-surface)", borderColor: "var(--border)" }}
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
  accentColor,
}: {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  accentColor: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-md border p-5"
      style={{ backgroundColor: "var(--eco-surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm" style={{ color: "var(--eco-muted)" }}>
          {label}
        </div>
        <div style={{ color: accentColor }}>{icon}</div>
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
  accentColor,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  tooltip: string;
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  accentColor: string;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="group flex flex-col gap-3 rounded-md border p-4 text-left transition-all active:scale-[0.98]"
      style={{
        backgroundColor: active
          ? `color-mix(in oklab, ${accentColor} 10%, white)`
          : "var(--eco-surface)",
        borderColor: active
          ? `color-mix(in oklab, ${accentColor} 55%, white)`
          : "var(--border)",
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-sm"
          style={{
            backgroundColor: active
              ? accentColor
              : `color-mix(in oklab, ${accentColor} 10%, white)`,
            color: active ? "var(--primary-foreground)" : "var(--eco-muted)",
          }}
        >
          {icon}
        </div>
        <span
          className="rounded-sm px-2.5 py-1 text-xs font-medium"
          style={{
            backgroundColor: active
              ? `color-mix(in oklab, ${accentColor} 30%, transparent)`
              : `color-mix(in oklab, ${accentColor} 8%, white)`,
            color: active ? accentColor : "var(--eco-muted)",
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
  accentColor,
}: {
  value: number;
  onChange: (n: number) => void;
  cfg: ReturnType<typeof useConfig>[0];
  accentColor: string;
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
      className="flex flex-col gap-3 rounded-md border p-4"
      style={{ backgroundColor: "var(--eco-surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-sm"
          style={{
            backgroundColor: `color-mix(in oklab, ${accentColor} 10%, white)`,
            color: accentColor,
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
        className="w-full"
        style={{ accentColor }}
      />
      <div className="flex justify-between text-xs" style={{ color: "var(--eco-muted)" }}>
        <span>Thermostat</span>
        <span>{impact}</span>
      </div>
    </div>
  );
}
