import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { AppConfig, DEFAULT_CONFIG, evalScoreFormula, saveConfig } from "@/config/appConfig";
import { useConfig } from "@/lib/ecoHooks";
import { resetAllData, resetLiveGuest } from "@/lib/ecoStore";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Green Proof" },
      { name: "description", content: "Tune savings constants, theme, and simulation." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [cfg] = useConfig();
  const [draft, setDraft] = useState<AppConfig>(cfg);

  useEffect(() => {
    setDraft(cfg);
  }, [cfg]);

  // Always autosave on change
  const update = (next: AppConfig) => {
    setDraft(next);
    saveConfig(next);
  };

  const setSav = <K extends keyof AppConfig["savings"]>(k: K, v: number) =>
    update({ ...draft, savings: { ...draft.savings, [k]: v } });
  const setFin = <K extends keyof AppConfig["finance"]>(k: K, v: number) =>
    update({ ...draft, finance: { ...draft.finance, [k]: v } });
  const setTree = <K extends keyof AppConfig["trees"]>(k: K, v: number) =>
    update({ ...draft, trees: { ...draft.trees, [k]: v } });
  const setTime = (v: number) =>
    update({ ...draft, time: { secondsPerSimDay: v } });
  const setHotel = <K extends keyof AppConfig["hotel"]>(k: K, v: AppConfig["hotel"][K]) =>
    update({ ...draft, hotel: { ...draft.hotel, [k]: v } });
  const setTheme = <K extends keyof AppConfig["theme"]>(k: K, v: string) =>
    update({ ...draft, theme: { ...draft.theme, [k]: v } });

  const formulaPreview = evalScoreFormula(draft.scoreFormula, 50, 200).toFixed(2);

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm" style={{ color: "var(--eco-muted)" }}>
          Edits save instantly and apply to both Guest and Manager views.
        </p>
      </div>

      <Section title="Savings constants">
        <Field label="Water saved per cleaning skip (L/day)">
          <NumberInput value={draft.savings.cleaningSkipWater} onChange={(v) => setSav("cleaningSkipWater", v)} />
        </Field>
        <Field label="CO₂ saved per cleaning skip (kg/day)">
          <NumberInput value={draft.savings.cleaningSkipCo2} onChange={(v) => setSav("cleaningSkipCo2", v)} />
        </Field>
        <Field label="Water saved per towel skip (L/day)">
          <NumberInput value={draft.savings.towelSkipWater} onChange={(v) => setSav("towelSkipWater", v)} />
        </Field>
        <Field label="CO₂ saved per towel skip (kg/day)">
          <NumberInput value={draft.savings.towelSkipCo2} onChange={(v) => setSav("towelSkipCo2", v)} />
        </Field>
        <Field label="Water saved per linen skip (L/day)">
          <NumberInput value={draft.savings.linenSkipWater} onChange={(v) => setSav("linenSkipWater", v)} />
        </Field>
        <Field label="CO₂ saved per linen skip (kg/day)">
          <NumberInput value={draft.savings.linenSkipCo2} onChange={(v) => setSav("linenSkipCo2", v)} />
        </Field>
        <Field label="Thermostat coefficient (kg CO₂ per °C diff)">
          <NumberInput value={draft.savings.thermostatCoefPerDegree} onChange={(v) => setSav("thermostatCoefPerDegree", v)} />
        </Field>
        <Field label="Baseline thermostat (°C)">
          <NumberInput value={draft.savings.thermostatBaseline} onChange={(v) => setSav("thermostatBaseline", v)} />
        </Field>
        <Field label="AC off value (kg CO₂/day)">
          <NumberInput value={draft.savings.acOffCo2} onChange={(v) => setSav("acOffCo2", v)} />
        </Field>
      </Section>

      <Section title="Train bonus">
        <Field label="Train arrival bonus (kg CO₂)">
          <NumberInput value={draft.savings.trainBonusCo2} onChange={(v) => setSav("trainBonusCo2", v)} />
        </Field>
      </Section>

      <Section title="Financial">
        <Field label="€ per kg CO₂">
          <NumberInput value={draft.finance.eurPerKgCo2} step={0.01} onChange={(v) => setFin("eurPerKgCo2", v)} />
        </Field>
        <Field label="€ per L water">
          <NumberInput value={draft.finance.eurPerLWater} step={0.001} onChange={(v) => setFin("eurPerLWater", v)} />
        </Field>
      </Section>

      <Section title="Score formula">
        <Field label="Formula (variables: co2, water)">
          <input
            type="text"
            value={draft.scoreFormula}
            onChange={(e) => update({ ...draft, scoreFormula: e.target.value })}
            className="w-full rounded-md px-3 py-2 text-sm"
            style={{ backgroundColor: "var(--eco-bg)", color: "var(--eco-text)", border: "1px solid var(--border)" }}
          />
        </Field>
        <div className="text-xs" style={{ color: "var(--eco-muted)" }}>
          Preview with co2=50, water=200 → <span style={{ color: "var(--eco-primary)" }}>{formulaPreview}</span>
        </div>
      </Section>

      <Section title="Tree thresholds">
        <Field label="Score per tree">
          <NumberInput value={draft.trees.scorePerTree} onChange={(v) => setTree("scorePerTree", v)} />
        </Field>
        <Field label="Max trees">
          <NumberInput value={draft.trees.maxTrees} onChange={(v) => setTree("maxTrees", v)} />
        </Field>
        <Field label="Starting tree count">
          <NumberInput value={draft.trees.startingTree} onChange={(v) => setTree("startingTree", v)} />
        </Field>
      </Section>

      <Section title="Time simulation">
        <Field label="Seconds per sim day">
          <NumberInput value={draft.time.secondsPerSimDay} onChange={setTime} />
        </Field>
      </Section>

      <Section title="Background guest simulation">
        <Field label="Enable simulated background guests">
          <label className="inline-flex items-center gap-2 rounded-md px-2 py-2" style={{ backgroundColor: "var(--eco-bg)" }}>
            <input
              type="checkbox"
              checked={draft.hotel.backgroundEnabled}
              onChange={(e) => setHotel("backgroundEnabled", e.target.checked)}
            />
            <span className="text-sm">Enabled</span>
          </label>
        </Field>
        <Field label="Total rooms in hotel">
          <NumberInput value={draft.hotel.totalRooms} onChange={(v) => setHotel("totalRooms", Math.max(0, Math.round(v)))} min={0} />
        </Field>
        <Field label="Target occupancy (%)">
          <NumberInput value={draft.hotel.occupancyPct} onChange={(v) => setHotel("occupancyPct", Math.max(1, Math.min(100, v)))} min={1} max={100} />
        </Field>
        <Field label="Occupancy variability (%)">
          <NumberInput value={draft.hotel.occupancyVariancePct} onChange={(v) => setHotel("occupancyVariancePct", Math.max(0, Math.min(30, v)))} min={0} max={30} />
        </Field>
        <Field label="Average stay length (days)">
          <NumberInput value={draft.hotel.avgStayDays} onChange={(v) => setHotel("avgStayDays", Math.max(1, Math.min(14, v)))} min={1} max={14} step={0.1} />
        </Field>
        <Field label="Historical days stored">
          <NumberInput value={draft.hotel.lookbackDays} onChange={(v) => setHotel("lookbackDays", Math.max(30, Math.min(365, Math.round(v))))} min={30} max={365} />
        </Field>
        <Field label="Eco profile share (%)">
          <NumberInput value={draft.hotel.ecoSharePct} onChange={(v) => setHotel("ecoSharePct", Math.max(0, Math.min(100, v)))} min={0} max={100} />
        </Field>
        <Field label="Mixed profile share (%)">
          <NumberInput value={draft.hotel.mixedSharePct} onChange={(v) => setHotel("mixedSharePct", Math.max(0, Math.min(100, v)))} min={0} max={100} />
        </Field>
        <div className="text-xs" style={{ color: "var(--eco-muted)" }}>
          Conventional share: {Math.max(0, 100 - draft.hotel.ecoSharePct - draft.hotel.mixedSharePct).toFixed(1)}%
        </div>
      </Section>

      <Section title="Theme">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(Object.keys(draft.theme) as (keyof AppConfig["theme"])[]).map((k) => (
            <label key={k} className="flex items-center gap-3 rounded-lg p-2" style={{ backgroundColor: "var(--eco-bg)" }}>
              <input
                type="color"
                value={draft.theme[k]}
                onChange={(e) => setTheme(k, e.target.value)}
                className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent"
              />
              <div>
                <div className="text-xs capitalize">{k}</div>
                <div className="text-[10px] font-mono" style={{ color: "var(--eco-muted)" }}>
                  {draft.theme[k]}
                </div>
              </div>
            </label>
          ))}
        </div>
        <button
          onClick={() => update({ ...draft, theme: DEFAULT_CONFIG.theme })}
          className="mt-2 text-xs underline"
          style={{ color: "var(--eco-muted)" }}
        >
          Reset theme to defaults
        </button>
      </Section>

      <Section title="Danger zone">
        <button
          onClick={() => resetLiveGuest(cfg)}
          className="flex items-center justify-center gap-2 rounded-sm border py-3 text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--background)",
            color: "var(--eco-muted)",
            borderColor: "var(--border)",
          }}
        >
          <RotateCcw size={16} />
          Reset guest / New stay
        </button>

        <div
          className="flex items-start gap-3 rounded-xl p-4"
          style={{ backgroundColor: "color-mix(in oklab, var(--eco-warning) 12%, transparent)" }}
        >
          <AlertTriangle style={{ color: "var(--eco-warning)" }} />
          <div className="flex-1">
            <div className="font-medium">Reset all data</div>
            <div className="text-xs" style={{ color: "var(--eco-muted)" }}>
              Clears the live guest, background simulation state, and resets every config value.
            </div>
          </div>
          <button
            onClick={() => {
              resetAllData();
              setDraft(DEFAULT_CONFIG);
            }}
            className="rounded-lg px-3 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--eco-warning)", color: "#0b1220" }}
          >
            Reset
          </button>
        </div>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl p-5" style={{ backgroundColor: "var(--eco-surface)" }}>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--eco-muted)" }}>
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs" style={{ color: "var(--eco-muted)" }}>
        {label}
      </div>
      {children}
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      step={step}
      min={min}
      max={max}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        if (!isNaN(v)) onChange(v);
      }}
      className="w-full rounded-md px-3 py-2 text-sm tabular-nums"
      style={{ backgroundColor: "var(--eco-bg)", color: "var(--eco-text)", border: "1px solid var(--border)" }}
    />
  );
}