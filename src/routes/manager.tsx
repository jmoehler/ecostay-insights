import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Cloud, Droplet, Euro, Users, Train, BedDouble, Shirt, Wind } from "lucide-react";
import { useConfig, useLiveCommitter, useLiveCustomer, useSimTime, useStays } from "@/lib/ecoHooks";
import { computeDailySavings, computeScore } from "@/lib/ecoStore";

export const Route = createFileRoute("/manager")({
  head: () => ({
    meta: [
      { title: "Manager Dashboard - Green Proof" },
      {
        name: "description",
        content: "Aggregated environmental impact across all guest stays.",
      },
    ],
  }),
  component: ManagerPage,
});

type Bucket = "daily" | "weekly" | "monthly";

function ManagerPage() {
  const [cfg] = useConfig();
  useLiveCommitter(cfg);
  const { day: simDay } = useSimTime(cfg);
  const stays = useStays(cfg, simDay);
  const [live] = useLiveCustomer(cfg);
  const [bucket, setBucket] = useState<Bucket>("daily");

  const allDays = useMemo(() => {
    const liveDays = [...live.history];
    const today = computeDailySavings(live.decisions, cfg);
    const todayDay = simDay;

    if (today.co2 > 0 || today.water > 0) {
      liveDays.push({
        day: todayDay,
        co2:
          today.co2 +
          (live.decisions.arrivedByTrain && !live.trainAdded && live.stayStartDay === todayDay
            ? cfg.savings.trainBonusCo2
            : 0),
        water: today.water,
        decisions: {
          cleaningSkipped: live.decisions.skipCleaning,
          towelsSkipped: live.decisions.skipTowels,
          linenSkipped: live.decisions.skipLinen,
          thermostat: live.decisions.thermostat,
          acOff: !live.decisions.acOn,
          train: !live.trainAdded && live.decisions.arrivedByTrain,
        },
      });
    }

    return [...stays.flatMap((stay) => stay.days), ...liveDays];
  }, [stays, live, cfg, simDay]);

  const totalCo2 = allDays.reduce((sum, day) => sum + day.co2, 0);
  const totalWater = allDays.reduce((sum, day) => sum + day.water, 0);
  const totalEur = totalCo2 * cfg.finance.eurPerKgCo2 + totalWater * cfg.finance.eurPerLWater;

  const activeBackground = stays.filter(
    (stay) => stay.startDay <= simDay && stay.startDay + stay.lengthDays > simDay,
  ).length;
  const activeLive = live.stayStartDay <= simDay ? 1 : 0;
  const activeStays = activeBackground + activeLive;

  const avgScore =
    stays.length + 1 > 0
      ? computeScore(totalCo2, totalWater, cfg) / Math.max(1, stays.length + 1)
      : 0;

  const series = useMemo(() => {
    const todayDay = simDay;
    let bucketSize = 1;
    let count = 30;

    if (bucket === "weekly") {
      bucketSize = 7;
      count = 12;
    } else if (bucket === "monthly") {
      bucketSize = 30;
      count = 12;
    }

    const points: { idx: number; label: string; co2: number; water: number }[] = [];

    for (let i = count - 1; i >= 0; i--) {
      const end = todayDay - i * bucketSize;
      const start = end - bucketSize + 1;
      const offset = (end - todayDay) / bucketSize;
      const slice = allDays.filter((day) => day.day >= start && day.day <= end);

      points.push({
        idx: count - 1 - i,
        label:
          bucket === "daily" ? `d${offset}` : bucket === "weekly" ? `w${offset}` : `m${offset}`,
        co2: Math.round(slice.reduce((sum, day) => sum + day.co2, 0)),
        water: Math.round(slice.reduce((sum, day) => sum + day.water, 0)),
      });
    }

    return points;
  }, [allDays, bucket, simDay]);

  const seriesTicks = useMemo(() => {
    if (series.length === 0) return [] as number[];

    const step = bucket === "daily" ? 2 : 1;
    if (step === 1) return series.map((point) => point.idx);

    const start = (series.length - 1) % step;
    return series
      .filter((_, index) => index >= start && (index - start) % step === 0)
      .map((point) => point.idx);
  }, [series, bucket]);

  const contributions = useMemo(() => {
    const s = cfg.savings;
    let cleaning = 0;
    let towels = 0;
    let linen = 0;
    let thermostat = 0;
    let ac = 0;
    let train = 0;

    for (const day of allDays) {
      if (day.decisions.cleaningSkipped) cleaning += s.cleaningSkipCo2 + s.cleaningSkipWater;
      if (day.decisions.towelsSkipped) towels += s.towelSkipCo2 + s.towelSkipWater;
      if (day.decisions.linenSkipped) linen += s.linenSkipCo2 + s.linenSkipWater;
      const diff = s.thermostatBaseline - day.decisions.thermostat;
      thermostat += diff * s.thermostatCoefPerDegree;
      if (day.decisions.acOff) ac += s.acOffCo2;
      if (day.decisions.train) train += s.trainBonusCo2;
    }

    const abs = {
      Cleaning: Math.max(0, cleaning),
      Towels: Math.max(0, towels),
      Linen: Math.max(0, linen),
      Thermostat: Math.max(0, thermostat),
      AC: Math.max(0, ac),
      Train: Math.max(0, train),
    };

    const total = Math.max(
      1,
      abs.Cleaning + abs.Towels + abs.Linen + abs.Thermostat + abs.AC + abs.Train,
    );

    return [
      {
        name: "Contribution share",
        Cleaning: (abs.Cleaning / total) * 100,
        Towels: (abs.Towels / total) * 100,
        Linen: (abs.Linen / total) * 100,
        Thermostat: (abs.Thermostat / total) * 100,
        AC: (abs.AC / total) * 100,
        Train: (abs.Train / total) * 100,
      },
    ];
  }, [allDays, cfg]);

  const allStays = useMemo(() => {
    const liveStay = {
      id: "live",
      days: [...live.history],
    };
    return [...stays, liveStay];
  }, [stays, live]);

  const pctCleaning =
    (allStays.filter((stay) => stay.days.some((day) => day.decisions.cleaningSkipped)).length /
      Math.max(1, allStays.length)) *
    100;

  const pctTowels =
    (allStays.filter((stay) => stay.days.some((day) => day.decisions.towelsSkipped)).length /
      Math.max(1, allStays.length)) *
    100;

  const pctLinen =
    (allStays.filter((stay) => stay.days.some((day) => day.decisions.linenSkipped)).length /
      Math.max(1, allStays.length)) *
    100;

  const pctTrain =
    (allStays.filter((stay) => stay.days.some((day) => day.decisions.train)).length /
      Math.max(1, allStays.length)) *
    100;

  const avgThermo =
    allDays.length > 0
      ? allDays.reduce((sum, day) => sum + day.decisions.thermostat, 0) / allDays.length
      : cfg.savings.thermostatBaseline;

  const chartCommon = { stroke: "var(--eco-muted)", fontSize: 11 };
  const chartPalette = useMemo(() => {
    const { primary, warning } = cfg.theme;
    return {
      co2: `color-mix(in oklab, ${primary} 90%, white)`,
      water: "color-mix(in oklab, var(--eco-blue) 78%, white)",
      cleaning: `color-mix(in oklab, ${primary} 72%, white)`,
      towels: `color-mix(in oklab, var(--eco-blue) 62%, ${primary})`,
      linen: `color-mix(in oklab, var(--eco-blue) 48%, ${primary})`,
      thermostat: `color-mix(in oklab, ${warning} 58%, white)`,
      ac: "color-mix(in oklab, var(--eco-blue) 42%, white)",
      train: `color-mix(in oklab, ${primary} 56%, #d8ec93)`,
    };
  }, [cfg.theme]);
  const kpiCo2 = formatCo2(totalCo2);
  const kpiWater = formatWater(totalWater);
  const kpiEur = formatEur(totalEur);

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Manager dashboard</h1>
        <p className="text-sm" style={{ color: "var(--eco-muted)" }}>
          Aggregated impact across background guests and the live customer stay.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi icon={<Cloud size={18} />} label="CO2 saved" value={kpiCo2} />
        <Kpi icon={<Droplet size={18} />} label="Water saved" value={kpiWater} />
        <Kpi icon={<Euro size={18} />} label="EUR saved" value={kpiEur} />
        <Kpi
          icon={<Users size={18} />}
          label={`Current active stays`}
          value={activeStays.toString()}
        />
      </div>

      <Panel
        title="Savings over time"
        right={
          <div
            className="flex rounded-full p-1"
            style={{ backgroundColor: "color-mix(in oklab, var(--eco-surface) 82%, white)" }}
          >
            {(["daily", "weekly", "monthly"] as Bucket[]).map((value) => (
              <button
                key={value}
                onClick={() => setBucket(value)}
                className="rounded-full px-3 py-1 text-xs capitalize"
                style={{
                  backgroundColor: bucket === value ? "var(--eco-ink)" : "transparent",
                  color: bucket === value ? "#ffffff" : "var(--eco-muted)",
                }}
              >
                {value}
              </button>
            ))}
          </div>
        }
      >
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={series}>
              <CartesianGrid stroke="color-mix(in oklab, var(--eco-ink) 8%, transparent)" />
              <XAxis
                dataKey="idx"
                type="number"
                domain={[0, Math.max(0, series.length - 1)]}
                ticks={seriesTicks}
                tickFormatter={(value) => series[Math.round(value)]?.label ?? ""}
                allowDecimals={false}
                interval={0}
                padding={{ left: 4, right: 12 }}
                {...chartCommon}
              />
              <YAxis {...chartCommon} />
              <Tooltip
                cursor={{ stroke: "color-mix(in oklab, var(--eco-ink) 22%, transparent)" }}
                content={<SavingsTooltip />}
              />
              <Legend wrapperStyle={{ color: "var(--eco-muted)", fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="co2"
                name="CO2 (kg)"
                stroke={chartPalette.co2}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="water"
                name="Water (L)"
                stroke={chartPalette.water}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Contribution by decision">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={contributions} layout="vertical">
                <CartesianGrid stroke="color-mix(in oklab, var(--eco-ink) 8%, transparent)" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${Math.round(value)}%`}
                  {...chartCommon}
                />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip
                  shared={false}
                  cursor={{ fill: "color-mix(in oklab, var(--eco-primary) 10%, white)" }}
                  content={<ContributionTooltip />}
                  contentStyle={{
                    backgroundColor: "color-mix(in oklab, var(--eco-surface) 90%, white)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />
                <Legend wrapperStyle={{ color: "var(--eco-muted)", fontSize: 12 }} />
                <Bar dataKey="Cleaning" stackId="a" fill={chartPalette.cleaning} />
                <Bar dataKey="Towels" stackId="a" fill={chartPalette.towels} />
                <Bar dataKey="Linen" stackId="a" fill={chartPalette.linen} />
                <Bar dataKey="Thermostat" stackId="a" fill={chartPalette.thermostat} />
                <Bar dataKey="AC" stackId="a" fill={chartPalette.ac} />
                <Bar dataKey="Train" stackId="a" fill={chartPalette.train} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Guest behavior">
          <div className="grid grid-cols-2 gap-4">
            <Behavior
              icon={<BedDouble size={18} />}
              label="Skipped cleaning"
              value={`${pctCleaning.toFixed(0)}%`}
            />
            <Behavior
              icon={<Shirt size={18} />}
              label="Skipped towels"
              value={`${pctTowels.toFixed(0)}%`}
            />
            <Behavior
              icon={<Droplet size={18} />}
              label="Skipped linen"
              value={`${pctLinen.toFixed(0)}%`}
            />
            <Behavior
              icon={<Train size={18} />}
              label="Arrived by train"
              value={`${pctTrain.toFixed(0)}%`}
            />
            <Behavior
              icon={<Wind size={18} />}
              label="Avg thermostat"
              value={`${avgThermo.toFixed(1)} C`}
            />
          </div>
        </Panel>
      </div>
    </main>
  );
}

function formatBaseNumber(value: number, maxFractionDigits = 0) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: 0,
  });
}

function formatCo2(kg: number) {
  if (Math.abs(kg) >= 1000) return `${formatBaseNumber(kg / 1000, 1)} t`;
  return `${formatBaseNumber(Math.round(kg))} kg`;
}

function formatWater(liters: number) {
  if (Math.abs(liters) >= 1000) return `${formatBaseNumber(liters / 1000, 1)} kL`;
  return `${formatBaseNumber(Math.round(liters))} L`;
}

function formatEur(eur: number) {
  if (Math.abs(eur) >= 1000) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "EUR",
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
    }).format(eur);
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(eur);
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      className="rounded-3xl border p-4"
      style={{
        backgroundColor: "color-mix(in oklab, var(--eco-surface) 86%, white)",
        borderColor: "color-mix(in oklab, var(--eco-ink) 10%, transparent)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--eco-muted)" }}>
          {label}
        </span>
        <span style={{ color: "var(--eco-primary)" }}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
    </div>
  );
}

function Panel({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[2rem] border p-5"
      style={{
        backgroundColor: "color-mix(in oklab, var(--eco-surface) 84%, white)",
        borderColor: "color-mix(in oklab, var(--eco-ink) 10%, transparent)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: "var(--eco-muted)" }}
        >
          {title}
        </h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function Behavior({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      className="rounded-2xl border p-6"
      style={{
        backgroundColor: "color-mix(in oklab, var(--eco-surface) 88%, white)",
        borderColor: "color-mix(in oklab, var(--eco-ink) 10%, transparent)",
      }}
    >
      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--eco-muted)" }}>
        <span style={{ color: "var(--eco-primary)" }}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function SavingsTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
    payload?: { label?: string };
  }>;
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const first = payload[0];
  const dataLabel =
    typeof first?.payload?.label === "string"
      ? first.payload.label
      : typeof label === "string"
        ? label
        : String(label ?? "");

  return (
    <div
      className="rounded-xl border px-3 py-2 text-sm"
      style={{
        backgroundColor: "color-mix(in oklab, var(--eco-surface) 92%, white)",
        borderColor: "var(--border)",
        color: "var(--eco-text)",
      }}
    >
      <div className="mb-2 font-medium">{dataLabel}</div>
      <div className="space-y-1">
        {payload.map((entry) => {
          const numericValue =
            typeof entry.value === "number" ? Math.round(entry.value) : entry.value;

          return (
            <div key={entry.name} style={{ color: entry.color ?? "var(--eco-primary)" }}>
              {entry.name}: {numericValue}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContributionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0];
  if (!item || typeof item.value !== "number") return null;

  return (
    <div
      className="rounded-xl border px-3 py-2 text-sm"
      style={{
        backgroundColor: "color-mix(in oklab, var(--eco-surface) 92%, white)",
        borderColor: "var(--border)",
        color: "var(--eco-text)",
      }}
    >
      <div className="font-medium">{item.name}</div>
     xs <div style={{ color: item.color ?? "var(--eco-primary)" }}>{item.value.toFixed(1)}%</div>
    </div>
  );
}
