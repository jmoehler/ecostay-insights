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
import { Cloud, Droplet, Euro, Users, Sparkles, Train, BedDouble, Shirt, Wind } from "lucide-react";
import { useConfig, useLiveCommitter, useLiveCustomer, useSimTime, useStays } from "@/lib/ecoHooks";
import { computeDailySavings, computeScore } from "@/lib/ecoStore";

export const Route = createFileRoute("/manager")({
  head: () => ({
    meta: [
      { title: "Manager Dashboard — Verdant Stay" },
      { name: "description", content: "Aggregated environmental impact across all guest stays." },
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
    const live2 = [...live.history];
    const today = computeDailySavings(live.decisions, cfg);
    const todayDay = simDay;
    if (today.co2 > 0 || today.water > 0) {
      live2.push({
        day: todayDay,
        co2: today.co2 + (live.decisions.arrivedByTrain && !live.trainAdded && live.stayStartDay === todayDay ? cfg.savings.trainBonusCo2 : 0),
        water: today.water,
        decisions: {
          cleaningSkipped: live.decisions.skipCleaning,
          towelsSkipped: live.decisions.skipTowels,
          thermostat: live.decisions.thermostat,
          acOff: !live.decisions.acOn,
          train: !live.trainAdded && live.decisions.arrivedByTrain,
        },
      });
    }
    return [...stays.flatMap((s) => s.days), ...live2];
  }, [stays, live, cfg, simDay]);

  const totalCo2 = allDays.reduce((s, d) => s + d.co2, 0);
  const totalWater = allDays.reduce((s, d) => s + d.water, 0);
  const totalEur =
    totalCo2 * cfg.finance.eurPerKgCo2 + totalWater * cfg.finance.eurPerLWater;
  const activeBackground = stays.filter(
    (s) => s.startDay <= simDay && s.startDay + s.lengthDays > simDay,
  ).length;
  const activeLive = live.stayStartDay <= simDay ? 1 : 0;
  const activeStays = activeBackground + activeLive;
  const avgScore =
    (stays.length + 1) > 0
      ? computeScore(totalCo2, totalWater, cfg) / Math.max(1, stays.length + 1)
      : 0;

  // Time series
  const series = useMemo(() => {
    const todayD = simDay;
    let bucketSize = 1;
    let count = 30;
    if (bucket === "weekly") {
      bucketSize = 7;
      count = 12;
    } else if (bucket === "monthly") {
      bucketSize = 30;
      count = 12;
    }
    const arr: { label: string; co2: number; water: number }[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const end = todayD - i * bucketSize;
      const start = end - bucketSize + 1;
      const offset = (end - todayD) / bucketSize;
      const slice = allDays.filter((d) => d.day >= start && d.day <= end);
      arr.push({
        label:
          bucket === "daily"
            ? `d${offset}`
            : bucket === "weekly"
              ? `w${offset}`
              : `m${offset}`,
        co2: Math.round(slice.reduce((s, d) => s + d.co2, 0)),
        water: Math.round(slice.reduce((s, d) => s + d.water, 0)),
      });
    }
    return arr;
  }, [allDays, bucket, simDay]);

  // Stacked contributions
  const contributions = useMemo(() => {
    const s = cfg.savings;
    let cleaning = 0,
      towels = 0,
      thermostat = 0,
      ac = 0,
      train = 0;
    for (const d of allDays) {
      if (d.decisions.cleaningSkipped) cleaning += s.cleaningSkipCo2 + s.cleaningSkipWater;
      if (d.decisions.towelsSkipped) towels += s.towelSkipCo2 + s.towelSkipWater;
      const diff = s.thermostatBaseline - d.decisions.thermostat;
      thermostat += diff * s.thermostatCoefPerDegree;
      if (d.decisions.acOff) ac += s.acOffCo2;
      if (d.decisions.train) train += s.trainBonusCo2;
    }
    const abs = {
      Cleaning: Math.max(0, cleaning),
      Towels: Math.max(0, towels),
      Thermostat: Math.max(0, thermostat),
      AC: Math.max(0, ac),
      Train: Math.max(0, train),
    };
    const total = Math.max(
      1,
      abs.Cleaning + abs.Towels + abs.Thermostat + abs.AC + abs.Train,
    );
    return [
      {
        name: "Contribution share",
        Cleaning: (abs.Cleaning / total) * 100,
        Towels: (abs.Towels / total) * 100,
        Thermostat: (abs.Thermostat / total) * 100,
        AC: (abs.AC / total) * 100,
        Train: (abs.Train / total) * 100,
      },
    ];
  }, [allDays, cfg]);

  // Behavior breakdown (across stays)
  const allStays = useMemo(() => {
    const liveStay = {
      id: "live",
      days: [...live.history],
    };
    return [...stays, liveStay];
  }, [stays, live]);

  const pctCleaning =
    (allStays.filter((s) => s.days.some((d) => d.decisions.cleaningSkipped)).length /
      Math.max(1, allStays.length)) *
    100;
  const pctTowels =
    (allStays.filter((s) => s.days.some((d) => d.decisions.towelsSkipped)).length /
      Math.max(1, allStays.length)) *
    100;
  const pctTrain =
    (allStays.filter((s) => s.days.some((d) => d.decisions.train)).length /
      Math.max(1, allStays.length)) *
    100;
  const avgThermo =
    allDays.length > 0
      ? allDays.reduce((s, d) => s + d.decisions.thermostat, 0) / allDays.length
      : cfg.savings.thermostatBaseline;

  const chartCommon = { stroke: "var(--eco-muted)", fontSize: 11 };

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Manager dashboard</h1>
        <p className="text-sm" style={{ color: "var(--eco-muted)" }}>
          Aggregated impact across background guests and the live customer stay.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Kpi icon={<Cloud size={18} />} label="CO₂ saved" value={`${Math.round(totalCo2)} kg`} />
        <Kpi icon={<Droplet size={18} />} label="Water saved" value={`${Math.round(totalWater)} L`} />
        <Kpi icon={<Euro size={18} />} label="€ saved" value={`€${totalEur.toFixed(2)}`} />
        <Kpi
          icon={<Users size={18} />}
          label={`Active stays (${activeBackground} bg / ${activeLive} live)`}
          value={activeStays.toString()}
        />
      </div>

      <Panel
        title="Savings over time"
        right={
          <div className="flex rounded-full p-1" style={{ backgroundColor: "var(--eco-bg)" }}>
            {(["daily", "weekly", "monthly"] as Bucket[]).map((b) => (
              <button
                key={b}
                onClick={() => setBucket(b)}
                className="rounded-full px-3 py-1 text-xs capitalize"
                style={{
                  backgroundColor: bucket === b ? "var(--eco-primary)" : "transparent",
                  color: bucket === b ? "var(--primary-foreground)" : "var(--eco-muted)",
                }}
              >
                {b}
              </button>
            ))}
          </div>
        }
      >
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={series}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" {...chartCommon} />
              <YAxis {...chartCommon} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--eco-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              />
              <Legend wrapperStyle={{ color: "var(--eco-muted)", fontSize: 12 }} />
              <Line type="monotone" dataKey="co2" name="CO₂ (kg)" stroke="var(--eco-primary)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="water" name="Water (L)" stroke="var(--eco-warning)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Contribution by decision">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={contributions} layout="vertical">
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${Math.round(v)}%`}
                  {...chartCommon}
                />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip
                  shared={false}
                  cursor={{ fill: "rgba(47, 143, 87, 0.08)" }}
                  content={<ContributionTooltip />}
                  contentStyle={{
                    backgroundColor: "var(--eco-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                />
                <Legend wrapperStyle={{ color: "var(--eco-muted)", fontSize: 12 }} />
                <Bar dataKey="Cleaning" stackId="a" fill="var(--eco-primary)" />
                <Bar dataKey="Towels" stackId="a" fill="#2BAA8D" />
                <Bar dataKey="Thermostat" stackId="a" fill="var(--eco-warning)" />
                <Bar dataKey="AC" stackId="a" fill="#5C8897" />
                <Bar dataKey="Train" stackId="a" fill="#7DAA52" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Guest behavior">
          <div className="grid grid-cols-2 gap-4">
            <Behavior icon={<BedDouble size={18} />} label="Skipped cleaning" value={`${pctCleaning.toFixed(0)}%`} />
            <Behavior icon={<Shirt size={18} />} label="Skipped towels" value={`${pctTowels.toFixed(0)}%`} />
            <Behavior icon={<Train size={18} />} label="Arrived by train" value={`${pctTrain.toFixed(0)}%`} />
            <Behavior icon={<Wind size={18} />} label="Avg thermostat" value={`${avgThermo.toFixed(1)}°C`} />
          </div>
        </Panel>
      </div>
    </main>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--eco-surface)" }}>
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

function Panel({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--eco-surface)" }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--eco-muted)" }}>
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
    <div className="rounded-xl p-4" style={{ backgroundColor: "var(--eco-bg)" }}>
      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--eco-muted)" }}>
        <span style={{ color: "var(--eco-primary)" }}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
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
  const p = payload[0];
  if (!p || typeof p.value !== "number") return null;
  return (
    <div
      className="rounded-md border px-3 py-2 text-sm"
      style={{
        backgroundColor: "var(--eco-surface)",
        borderColor: "var(--border)",
        color: "var(--eco-text)",
      }}
    >
      <div className="font-medium">{p.name}</div>
      <div style={{ color: p.color ?? "var(--eco-primary)" }}>{p.value.toFixed(1)}%</div>
    </div>
  );
}