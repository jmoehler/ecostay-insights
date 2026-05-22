import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Droplet,
  Cloud,
  Train,
  Thermometer,
  Wind,
  BedDouble,
  Bath,
  Shirt,
  Sparkles,
} from "lucide-react";
import { TreeField } from "@/components/TreeField";
import { useConfig, useLiveCommitter, useLiveGuest, useSimTime } from "@/lib/ecoHooks";
import {
  computeDailySavings,
  computeScore,
  getGuestView,
  getSkipDefaultsForView,
  setGuestView,
} from "@/lib/ecoStore";

export const Route = createFileRoute("/")({
  component: Index,
});

type GuestView = "green" | "conventional";

function Index() {
  const [cfg] = useConfig();
  useLiveCommitter(cfg);
  const [live, setLive] = useLiveGuest(cfg);
  const [view, setView] = useState<GuestView>("green");

  useEffect(() => {
    setView(getGuestView());
  }, []);

  const { day: simDay, progress } = useSimTime(cfg);
  const isGreenView = view === "green";
  const accentColor = isGreenView ? "var(--eco-primary)" : "var(--eco-blue)";
  const headerTrackColor = isGreenView
    ? "color-mix(in oklab, var(--eco-primary) 24%, white)"
    : "color-mix(in oklab, var(--eco-blue) 14%, white)";
  const headerFillColor = isGreenView
    ? "color-mix(in oklab, var(--eco-primary) 90%, #72bf7d)"
    : "var(--eco-blue)";
  const panelGlow = isGreenView
    ? "radial-gradient(circle at 10% -10%, color-mix(in oklab, var(--eco-primary) 18%, white) 0%, transparent 46%), radial-gradient(circle at 94% 0%, color-mix(in oklab, var(--eco-primary) 10%, white) 0%, transparent 48%)"
    : "radial-gradient(circle at 10% -10%, color-mix(in oklab, var(--eco-blue) 7%, white) 0%, transparent 46%), radial-gradient(circle at 94% 0%, color-mix(in oklab, var(--eco-blue) 10%, white) 0%, transparent 46%)";

  const liveDayProgress =
    simDay === live.stayStartDay ? Math.max(0, progress - live.stayStartProgress) : progress;

  const todayProjected = computeDailySavings(live.decisions, cfg);
  const todayLive = {
    co2: todayProjected.co2 * liveDayProgress,
    water: todayProjected.water * liveDayProgress,
  };

  const totalCo2 = live.history.reduce((sum, d) => sum + d.co2, 0) + todayLive.co2;
  const totalWater = live.history.reduce((sum, d) => sum + d.water, 0) + todayLive.water;
  const trainBonus =
    live.decisions.arrivedByTrain && !live.trainAdded ? cfg.savings.trainBonusCo2 : 0;

  const displayCo2 = Math.max(0, totalCo2 + trainBonus);
  const displayWater = Math.max(0, totalWater);
  const score = computeScore(displayCo2, displayWater, cfg);

  const toggle = (key: "skipCleaning" | "skipTowels" | "skipLinen" | "acOn") =>
    setLive({
      ...live,
      decisions: { ...live.decisions, [key]: !live.decisions[key] },
    });

  const setTemp = (temp: number) =>
    setLive({
      ...live,
      decisions: { ...live.decisions, thermostat: temp },
    });

  const impact = useMemo(() => {
    const s = cfg.savings;
    return {
      cleaning: `If skipped: +${s.cleaningSkipWater} L and +${s.cleaningSkipCo2} kg CO2/day`,
      towels: `If skipped: +${s.towelSkipWater} L and +${s.towelSkipCo2} kg CO2/day`,
      linen: `If skipped: +${s.linenSkipWater} L and +${s.linenSkipCo2} kg CO2/day`,
      acOff: `+${s.acOffCo2} kg CO2/day`,
    };
  }, [cfg]);

  const applyViewDefaults = (nextView: GuestView) => {
    setView(nextView);
    setGuestView(nextView);
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
        className="relative overflow-hidden rounded-[2rem] border shadow-[0_24px_50px_-42px_rgba(12,29,42,0.75)]"
        style={{
          backgroundColor: "color-mix(in oklab, var(--eco-surface) 82%, white)",
          borderColor: "color-mix(in oklab, var(--eco-ink) 10%, transparent)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: panelGlow,
          }}
        />

        <div
          className="absolute left-0 right-0 top-0 h-1"
          style={{ backgroundColor: headerTrackColor }}
        >
          <div
            className="h-full"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: headerFillColor,
              transition: "width 250ms linear",
            }}
          />
        </div>

        <div className="relative flex flex-col gap-4 p-6">
          {isGreenView ? (
            <>
              <TreeField score={score} cfg={cfg} />

              <div className="grid grid-cols-2 gap-4">
                <StatTile
                  label="CO2 saved"
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

              <Card>
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${accentColor} 10%, white)`,
                      color: accentColor,
                    }}
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
                    className="rounded-full border px-3 py-1 text-sm font-medium"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${accentColor} 8%, white)`,
                      color: accentColor,
                      borderColor: `color-mix(in oklab, ${accentColor} 30%, white)`,
                    }}
                  >
                    -{cfg.savings.trainBonusCo2} kg CO2
                  </div>
                </div>
              </Card>
            </>
          ) : null}

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <ToggleCard
              icon={<Sparkles size={22} />}
              title="Request room cleaning"
              tooltip={impact.cleaning}
              active={!live.decisions.skipCleaning}
              activeLabel="Requested"
              inactiveLabel="Skipped"
              compactActiveLabel="Req"
              compactInactiveLabel="Skip"
              highlightWhenActive={false}
              accentColor={accentColor}
              onToggle={() => toggle("skipCleaning")}
            />
            <ToggleCard
              icon={<Bath size={22} />}
              title="Request towel change"
              tooltip={impact.towels}
              active={!live.decisions.skipTowels}
              activeLabel="Requested"
              inactiveLabel="Skipped"
              compactActiveLabel="Req"
              compactInactiveLabel="Skip"
              highlightWhenActive={false}
              accentColor={accentColor}
              onToggle={() => toggle("skipTowels")}
            />
            <ToggleCard
              icon={<Shirt size={22} />}
              title="Request linen change"
              tooltip={impact.linen}
              active={!live.decisions.skipLinen}
              activeLabel="Requested"
              inactiveLabel="Skipped"
              compactActiveLabel="Req"
              compactInactiveLabel="Skip"
              highlightWhenActive={false}
              accentColor={accentColor}
              onToggle={() => toggle("skipLinen")}
            />
            <ToggleCard
              icon={<Wind size={22} />}
              title="Air conditioning"
              tooltip={live.decisions.acOn ? "AC on - full draw" : `AC off - ${impact.acOff}`}
              active={!live.decisions.acOn}
              activeLabel="Off"
              inactiveLabel="On"
              accentColor={accentColor}
              onToggle={() => toggle("acOn")}
            />
            <div className="col-span-2">
              <ThermoCard
                value={live.decisions.thermostat}
                onChange={setTemp}
                cfg={cfg}
                accentColor={accentColor}
              />
            </div>
          </div>

          <div className="mt-1 flex justify-center">
            <div
              className="inline-flex items-center rounded-full border p-1"
              style={{
                backgroundColor: "color-mix(in oklab, var(--eco-surface) 84%, white)",
                borderColor: "var(--border)",
              }}
            >
              <button
                onClick={() => applyViewDefaults("green")}
                className="rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor:
                    view === "green"
                      ? "color-mix(in oklab, var(--eco-primary) 16%, white)"
                      : "transparent",
                  color: view === "green" ? "var(--eco-primary)" : "var(--eco-muted)",
                }}
              >
                Green View
              </button>
              <button
                onClick={() => applyViewDefaults("conventional")}
                className="rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: view === "conventional" ? "var(--eco-ink)" : "transparent",
                  color: view === "conventional" ? "#ffffff" : "var(--eco-muted)",
                }}
              >
                Conventional View
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
      className="rounded-3xl border p-4"
      style={{
        backgroundColor: "color-mix(in oklab, var(--eco-surface) 88%, white)",
        borderColor: "color-mix(in oklab, var(--eco-ink) 10%, transparent)",
      }}
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
      className="relative overflow-hidden rounded-3xl border p-5"
      style={{
        backgroundColor: "color-mix(in oklab, var(--eco-surface) 88%, white)",
        borderColor: "color-mix(in oklab, var(--eco-ink) 10%, transparent)",
      }}
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
  compactActiveLabel,
  compactInactiveLabel,
  highlightWhenActive = true,
  accentColor,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  tooltip: string;
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  compactActiveLabel?: string;
  compactInactiveLabel?: string;
  highlightWhenActive?: boolean;
  accentColor: string;
  onToggle: () => void;
}) {
  const highlighted = highlightWhenActive ? active : !active;
  const fullStatusLabel = active ? activeLabel : inactiveLabel;
  const defaultCompactLabel = (label: string) => {
    const normalized = label.trim().toLowerCase();
    if (normalized === "requested") return "Req.";
    if (normalized === "skipped") return "Skip";
    if (label.length <= 6) return label;
    return `${label.slice(0, 4)}.`;
  };
  const compactStatusLabel = active
    ? (compactActiveLabel ?? defaultCompactLabel(activeLabel))
    : (compactInactiveLabel ?? defaultCompactLabel(inactiveLabel));

  return (
    <button
      onClick={onToggle}
      className="group flex flex-col gap-2.5 rounded-3xl border p-3.5 text-left transition-all active:scale-[0.98] sm:gap-3 sm:p-4"
      style={{
        backgroundColor: highlighted
          ? `color-mix(in oklab, ${accentColor} 10%, white)`
          : "color-mix(in oklab, var(--eco-surface) 88%, white)",
        borderColor: highlighted
          ? `color-mix(in oklab, ${accentColor} 38%, white)`
          : "color-mix(in oklab, var(--eco-ink) 10%, transparent)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11"
          style={{
            backgroundColor: highlighted
              ? accentColor
              : `color-mix(in oklab, ${accentColor} 10%, white)`,
            color: highlighted ? "var(--primary-foreground)" : "var(--eco-muted)",
          }}
        >
          {icon}
        </div>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium leading-none sm:gap-1.5 sm:px-2.5 sm:text-xs"
          style={{
            backgroundColor: highlighted
              ? `color-mix(in oklab, ${accentColor} 24%, white)`
              : `color-mix(in oklab, ${accentColor} 7%, white)`,
            color: highlighted ? accentColor : "var(--eco-muted)",
          }}
          aria-label={fullStatusLabel}
        >
          <span
            className="hidden h-1.5 w-1.5 rounded-full sm:block"
            style={{
              backgroundColor: highlighted
                ? accentColor
                : "color-mix(in oklab, var(--eco-ink) 24%, transparent)",
            }}
          />
          <span className="hidden sm:inline">{fullStatusLabel}</span>
          <span className="sm:hidden">{compactStatusLabel}</span>
        </span>
      </div>
      <div>
        <div className="text-[15px] font-medium leading-snug sm:text-base">{title}</div>
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
  onChange: (next: number) => void;
  cfg: ReturnType<typeof useConfig>[0];
  accentColor: string;
}) {
  const {
    thermostatMin: min,
    thermostatMax: max,
    thermostatBaseline: base,
    thermostatCoefPerDegree: coef,
  } = cfg.savings;

  const diff = base - value;
  const impact =
    diff > 0
      ? `+${(diff * coef).toFixed(1)} kg CO2/day`
      : diff < 0
        ? `-${(Math.abs(diff) * coef).toFixed(1)} kg CO2/day`
        : "Baseline";

  return (
    <div
      className="flex flex-col gap-3 rounded-3xl border p-4"
      style={{
        backgroundColor: "color-mix(in oklab, var(--eco-surface) 88%, white)",
        borderColor: "color-mix(in oklab, var(--eco-ink) 10%, transparent)",
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{
            backgroundColor: `color-mix(in oklab, ${accentColor} 10%, white)`,
            color: accentColor,
          }}
        >
          <Thermometer size={22} />
        </div>
        <div className="text-2xl font-semibold tabular-nums">{value}C</div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(parseInt(event.target.value, 10))}
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
