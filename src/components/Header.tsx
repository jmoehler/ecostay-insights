import { Link, useRouter, useLocation } from "@tanstack/react-router";
import { Settings, User, BarChart3, Leaf } from "lucide-react";
import { useConfig, useSimTime } from "@/lib/ecoHooks";
import { setRole, getCustomerView, CustomerViewMode } from "@/lib/ecoStore";
import { useEffect, useState } from "react";

export function Header() {
  const [cfg] = useConfig();
  const { day, clock } = useSimTime(cfg);
  const router = useRouter();
  const location = useLocation();
  const [customerView, setCustomerView] = useState<CustomerViewMode>("green");
  const isCustomerPage = location.pathname === "/";
  const isManagerPage = location.pathname === "/manager";
  const isAdminPage = location.pathname === "/admin";
  const isConventionalCustomer = location.pathname === "/" && customerView === "conventional";
  const headerAccent = isConventionalCustomer ? "var(--eco-blue)" : "var(--eco-primary)";
  const shellTone = isConventionalCustomer ? "var(--eco-blue)" : "var(--eco-primary)";
  const shellBackground = isConventionalCustomer
    ? "linear-gradient(175deg, color-mix(in oklab, var(--eco-surface) 92%, white) 0%, color-mix(in oklab, var(--eco-shell) 70%, white) 100%)"
    : "linear-gradient(175deg, color-mix(in oklab, var(--eco-surface) 92%, white) 0%, color-mix(in oklab, var(--eco-primary) 10%, white) 100%)";

  useEffect(() => {
    setCustomerView(getCustomerView());
    const onChange = () => setCustomerView(getCustomerView());
    window.addEventListener("eco-customer-view-change", onChange);
    return () => window.removeEventListener("eco-customer-view-change", onChange);
  }, []);

  const goToPage = (to: "/" | "/manager" | "/admin") => {
    if (to === "/") setRole("customer");
    if (to === "/manager") setRole("manager");
    if (location.pathname !== to) router.navigate({ to });
  };

  return (
    <header className="sticky top-0 z-50 px-4 pb-2 pt-4 sm:px-6">
      <div
        className="eco-shell flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
        style={{
          background: shellBackground,
          borderColor: `color-mix(in oklab, ${shellTone} 14%, transparent)`,
        }}
      >
        <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: `color-mix(in oklab, ${headerAccent} 14%, white)` }}
          >
            <Leaf size={18} style={{ color: headerAccent }} />
          </span>
          <span className="leading-tight">
            Green Proof
            <span
              className="block text-[10px] font-medium tracking-[0.12em] uppercase"
              style={{ color: "var(--eco-muted)" }}
            >
              Eco Stay Prototype
            </span>
          </span>
        </Link>

        <div
          className="flex items-center rounded-full border p-1 text-sm"
          style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}
        >
          <button
            onClick={() => goToPage("/")}
            className="eco-nav-pill flex items-center gap-1.5"
            style={{
              backgroundColor: isCustomerPage ? "var(--eco-ink)" : "transparent",
              color: isCustomerPage ? "#f7fafc" : "var(--eco-muted)",
            }}
          >
            <User size={14} /> Customer
          </button>
          <button
            onClick={() => goToPage("/manager")}
            className="eco-nav-pill flex items-center gap-1.5"
            style={{
              backgroundColor: isManagerPage ? "var(--eco-ink)" : "transparent",
              color: isManagerPage ? "#f7fafc" : "var(--eco-muted)",
            }}
          >
            <BarChart3 size={14} /> Manager
          </button>
          <button
            onClick={() => goToPage("/admin")}
            className="eco-nav-pill flex items-center gap-1.5"
            style={{
              backgroundColor: isAdminPage ? "var(--eco-ink)" : "transparent",
              color: isAdminPage ? "#f7fafc" : "var(--eco-muted)",
            }}
          >
            <Settings size={14} /> Admin
          </button>
        </div>

        <div
          className="hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs sm:flex"
          style={{
            backgroundColor: "var(--background)",
            color: "var(--eco-muted)",
            borderColor: "var(--border)",
          }}
        >
          <span style={{ color: headerAccent }}>●</span>
          Day {day} · {clock} left
        </div>
      </div>
    </header>
  );
}
