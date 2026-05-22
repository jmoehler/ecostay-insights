import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Cloud,
  Droplet,
  FileBarChart,
  Leaf,
  Plug,
  ShieldCheck,
  Sparkles,
  Sprout,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import heroImg from "@/assets/landing-hero.jpg";
import managerImg from "@/assets/landing-manager.jpg";
import guestImg from "@/assets/landing-guest.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Green Proof — Real-time sustainability for Casablanca PMS" },
      {
        name: "description",
        content:
          "Green Proof turns every guest decision into verifiable sustainability data. A PMS add-on built for Casablanca, open to any third-party integration.",
      },
      { property: "og:title", content: "Green Proof — Real-time sustainability for Casablanca PMS" },
      {
        property: "og:description",
        content:
          "Turn your hotel's sustainability into a credible competitive advantage. EmpCo-ready reporting, gentle guest nudges, automated from PMS data.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative">
      {/* NAV */}
      <nav className="sticky top-0 z-50 px-4 pt-4 sm:px-8">
        <div
          className="eco-shell mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6"
          style={{
            background:
              "linear-gradient(175deg, color-mix(in oklab, var(--eco-surface) 94%, white) 0%, color-mix(in oklab, var(--eco-primary) 8%, white) 100%)",
          }}
        >
          <Link to="/" className="flex items-center gap-2">
            <img src="/green_proof_logo_transparent.svg" alt="Green Proof" className="h-9 w-auto sm:h-10" />
          </Link>
          <div className="hidden items-center gap-6 text-sm font-semibold md:flex" style={{ color: "var(--eco-text)" }}>
            <a href="#how" className="hover:opacity-70">How it works</a>
            <a href="#hotels" className="hover:opacity-70">For hotels</a>
            <a href="#guests" className="hover:opacity-70">For guests</a>
            <a href="#pilot" className="hover:opacity-70">Pilot</a>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/manager"
              className="hidden items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold sm:inline-flex"
              style={{ backgroundColor: "transparent", color: "var(--eco-text)" }}
            >
              <BarChart3 size={14} /> Manager demo
            </Link>
            <Link
              to="/guest"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold shadow-sm transition hover:translate-y-[-1px]"
              style={{ backgroundColor: "var(--eco-ink)", color: "#f7fafc" }}
            >
              Try the live demo <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative px-4 pb-16 pt-10 sm:px-8 sm:pt-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <div
              className="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={{
                borderColor: "color-mix(in oklab, var(--eco-primary) 30%, transparent)",
                backgroundColor: "color-mix(in oklab, var(--eco-primary) 8%, white)",
                color: "var(--eco-primary)",
              }}
            >
              <Sparkles size={12} /> A Casablanca PMS add-on · Open to third-party integrations
            </div>
            <h1
              className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
              style={{ color: "var(--eco-text)" }}
            >
              Turn every guest decision into <span style={{ color: "var(--eco-primary)" }}>verifiable</span> sustainability.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: "var(--eco-muted)" }}>
              Green Proof captures the small choices that already happen during a stay — skipped cleanings,
              fresh towels declined, train arrivals — and turns them into live impact for guests and
              EmpCo-ready reports for your team. No new workflows. No greenwashing.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/manager"
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold shadow-md transition hover:translate-y-[-1px]"
                style={{ backgroundColor: "var(--eco-primary)", color: "#fff" }}
              >
                See the Manager dashboard <ArrowRight size={16} />
              </Link>
              <Link
                to="/guest"
                className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-bold transition hover:bg-white"
                style={{
                  borderColor: "color-mix(in oklab, var(--eco-ink) 20%, transparent)",
                  color: "var(--eco-text)",
                }}
              >
                Open the Guest view
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium" style={{ color: "var(--eco-muted)" }}>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} style={{ color: "var(--eco-primary)" }} /> EmpCo-ready reporting</span>
              <span className="inline-flex items-center gap-1.5"><Plug size={14} style={{ color: "var(--eco-primary)" }} /> Native Casablanca PMS</span>
              <span className="inline-flex items-center gap-1.5"><Zap size={14} style={{ color: "var(--eco-primary)" }} /> Real-time, automated</span>
            </div>
          </div>

          <div className="relative">
            <div
              className="overflow-hidden rounded-3xl shadow-2xl ring-1"
              style={{ boxShadow: "0 40px 80px -40px rgba(17,37,56,0.45)", borderColor: "var(--border)" }}
            >
              <img src={heroImg} alt="Sustainable hotel by a forest at golden hour" width={1600} height={1200} className="h-full w-full object-cover" />
            </div>
            {/* floating stat cards */}
            <div
              className="absolute -left-3 bottom-6 hidden rounded-2xl border bg-white/95 p-3 shadow-xl backdrop-blur sm:flex sm:items-center sm:gap-3"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="grid h-10 w-10 place-items-center rounded-full" style={{ backgroundColor: "color-mix(in oklab, var(--eco-primary) 14%, white)", color: "var(--eco-primary)" }}>
                <Cloud size={18} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--eco-muted)" }}>CO₂ saved</div>
                <div className="text-lg font-bold" style={{ color: "var(--eco-text)" }}>162.5 t<span className="ml-1 text-xs font-medium" style={{ color: "var(--eco-muted)" }}>last 120 days</span></div>
              </div>
            </div>
            <div
              className="absolute -right-3 top-6 hidden rounded-2xl border bg-white/95 p-3 shadow-xl backdrop-blur sm:flex sm:items-center sm:gap-3"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="grid h-10 w-10 place-items-center rounded-full" style={{ backgroundColor: "color-mix(in oklab, var(--eco-blue) 14%, white)", color: "var(--eco-blue)" }}>
                <Droplet size={18} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--eco-muted)" }}>Water saved</div>
                <div className="text-lg font-bold" style={{ color: "var(--eco-text)" }}>266.2 kL</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PMS BAR */}
      <section className="px-4 sm:px-8">
        <div
          className="mx-auto flex max-w-6xl flex-col items-center gap-4 rounded-2xl border px-6 py-5 sm:flex-row sm:justify-between"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "color-mix(in oklab, var(--eco-surface) 96%, white)",
          }}
        >
          <div className="flex items-center gap-3 text-sm font-semibold" style={{ color: "var(--eco-text)" }}>
            <Plug size={18} style={{ color: "var(--eco-primary)" }} />
            Built as a native add-on for <span className="font-extrabold">Casablanca PMS</span>
          </div>
          <div className="text-xs sm:text-sm" style={{ color: "var(--eco-muted)" }}>
            Open architecture — connects to any third-party PMS, IoT, or ESG tool via API.
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="px-4 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--eco-primary)" }}>The problem</div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--eco-text)" }}>
            You do the work. Nobody sees it.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed" style={{ color: "var(--eco-muted)" }}>
            Sustainability-driven managers invest seriously in responsible operations — but lack a credible
            way to make those efforts visible to guests and regulators. Existing systems leave a gap between
            what hotels do and what anyone is able to see.
          </p>
        </div>
      </section>

      {/* FOR HOTELS */}
      <section id="hotels" className="px-4 pb-20 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div className="order-2 lg:order-1">
            <div className="overflow-hidden rounded-3xl shadow-xl">
              <img src={managerImg} alt="Manager reviewing the Green Proof dashboard" width={1400} height={1000} loading="lazy" className="h-full w-full object-cover" />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--eco-primary)" }}>
              <BarChart3 size={14} /> For hotel managers
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--eco-text)" }}>
              Sustainability that proves itself.
            </h2>
            <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--eco-muted)" }}>
              Every skipped cleaning, every towel reuse, every train arrival is captured automatically in
              your PMS. The dashboard quantifies the impact in CO₂, water and euros — and exports the
              evidence you need for certification, EmpCo compliance and confident guest communication.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { icon: TrendingUp, t: "Revenue lift", d: "Direct bookings & sustainable-stay upsells." },
                { icon: ShieldCheck, t: "Greenwashing-proof", d: "Real-time, evidence-based reporting." },
                { icon: FileBarChart, t: "EmpCo-ready", d: "One-click exports for audits & certifications." },
                { icon: Users, t: "Brand differentiation", d: "Visible impact your guests remember." },
              ].map(({ icon: Icon, t, d }) => (
                <li key={t} className="flex gap-3 rounded-2xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: "color-mix(in oklab, var(--eco-primary) 12%, white)", color: "var(--eco-primary)" }}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: "var(--eco-text)" }}>{t}</div>
                    <div className="text-xs leading-relaxed" style={{ color: "var(--eco-muted)" }}>{d}</div>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              to="/manager"
              className="mt-7 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold shadow-md transition hover:translate-y-[-1px]"
              style={{ backgroundColor: "var(--eco-ink)", color: "#f7fafc" }}
            >
              Open Manager dashboard <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="px-4 pb-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--eco-primary)" }}>How it works</div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--eco-text)" }}>
              Three layers. Zero extra work.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                n: "01",
                icon: Plug,
                t: "Connects to your PMS",
                d: "Native to Casablanca, open API for any other PMS, IoT sensor or ESG tool you already run.",
              },
              {
                n: "02",
                icon: Leaf,
                t: "Captures every choice",
                d: "Skipped cleanings, towel/linen reuse, thermostat, AC and arrival mode become live data — no manual entry.",
              },
              {
                n: "03",
                icon: FileBarChart,
                t: "Proves it to everyone",
                d: "Guests see real-time impact. Managers get EmpCo-ready reports and certification evidence.",
              },
            ].map(({ n, icon: Icon, t, d }) => (
              <div
                key={n}
                className="rounded-3xl border p-6"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--card)",
                  boxShadow: "0 24px 40px -32px rgba(17,37,56,0.35)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl" style={{ backgroundColor: "color-mix(in oklab, var(--eco-primary) 14%, white)", color: "var(--eco-primary)" }}>
                    <Icon size={20} />
                  </div>
                  <span className="text-xs font-bold tracking-widest" style={{ color: "var(--eco-muted)" }}>{n}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold" style={{ color: "var(--eco-text)" }}>{t}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--eco-muted)" }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR GUESTS */}
      <section id="guests" className="px-4 pb-20 sm:px-8">
        <div
          className="mx-auto max-w-6xl overflow-hidden rounded-3xl border"
          style={{
            borderColor: "var(--border)",
            background:
              "linear-gradient(160deg, color-mix(in oklab, var(--eco-primary) 6%, white) 0%, color-mix(in oklab, var(--eco-blue) 5%, white) 100%)",
          }}
        >
          <div className="grid gap-0 lg:grid-cols-2">
            <div className="p-8 sm:p-12">
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--eco-primary)" }}>
                <Sprout size={14} /> For your guests
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--eco-text)" }}>
                Effortless impact, gently visible.
              </h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--eco-muted)" }}>
                A QR code in the room opens a private view of their stay. Each sustainable choice grows
                a tree, saves litres, avoids CO₂. No guilt, no friction — just a quiet feeling that
                their stay actually counted.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm" style={{ color: "var(--eco-text)" }}>
                {[
                  "Real-time CO₂, water and euro impact",
                  "Tree grows with every sustainable choice",
                  "Zero account, zero app download",
                ].map((x) => (
                  <li key={x} className="flex items-center gap-2">
                    <CheckCircle2 size={16} style={{ color: "var(--eco-primary)" }} /> {x}
                  </li>
                ))}
              </ul>
              <Link
                to="/guest"
                className="mt-7 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold shadow-md transition hover:translate-y-[-1px]"
                style={{ backgroundColor: "var(--eco-primary)", color: "#fff" }}
              >
                Try the guest view <ArrowRight size={16} />
              </Link>
            </div>
            <div className="relative min-h-[280px] lg:min-h-full">
              <img src={guestImg} alt="Guest enjoying a sustainable hotel stay" width={1400} height={1000} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* PILOT */}
      <section id="pilot" className="px-4 pb-24 sm:px-8">
        <div
          className="mx-auto max-w-6xl rounded-3xl p-8 sm:p-12"
          style={{
            background:
              "linear-gradient(160deg, var(--eco-ink) 0%, color-mix(in oklab, var(--eco-ink) 70%, var(--eco-primary)) 100%)",
            color: "#f7fafc",
          }}
        >
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "color-mix(in oklab, var(--eco-primary) 70%, white)" }}>
                Pilot proposal
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Run a 3-month Green Proof pilot at your property.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed" style={{ color: "rgba(247,250,252,0.78)" }}>
                Ideal partner: a mid-sized leisure hotel (60–120 rooms) with sustainability initiatives
                already in place and a motivated GM or operations lead.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="mailto:hello@greenproof.app?subject=Green%20Proof%20Pilot"
                  className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold shadow-md transition hover:translate-y-[-1px]"
                  style={{ backgroundColor: "#fff", color: "var(--eco-ink)" }}
                >
                  Talk to the team <ArrowRight size={16} />
                </a>
                <Link
                  to="/manager"
                  className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-bold"
                  style={{ borderColor: "rgba(255,255,255,0.3)", color: "#fff" }}
                >
                  See live demo
                </Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { t: "Setup", d: "4–6 weeks" },
                { t: "Pilot run", d: "3 months" },
                { t: "Wrap-up & reporting", d: "2 weeks" },
              ].map((s, i) => (
                <div
                  key={s.t}
                  className="flex items-center gap-4 rounded-2xl border p-4"
                  style={{
                    borderColor: "rgba(255,255,255,0.16)",
                    backgroundColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold" style={{ backgroundColor: "color-mix(in oklab, var(--eco-primary) 70%, white)", color: "var(--eco-ink)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(247,250,252,0.6)" }}>{s.t}</div>
                    <div className="text-base font-semibold">{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-4 pb-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 border-t pt-6 text-xs sm:flex-row" style={{ borderColor: "var(--border)", color: "var(--eco-muted)" }}>
          <div className="flex items-center gap-2">
            <img src="/green_proof_logo_transparent.svg" alt="" className="h-6 w-auto" />
            <span>Green Proof · A Casablanca PMS add-on</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/guest" className="hover:opacity-70">Guest</Link>
            <Link to="/manager" className="hover:opacity-70">Manager</Link>
            <Link to="/admin" className="hover:opacity-70">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
