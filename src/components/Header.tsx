import { Link, useRouter, useLocation } from "@tanstack/react-router";
import { Settings, User, BarChart3, Leaf } from "lucide-react";
import { useConfig, useSimTime } from "@/lib/ecoHooks";
import { setRole, getRole, getCustomerView, CustomerViewMode } from "@/lib/ecoStore";
import { useEffect, useState } from "react";

export function Header() {
  const [cfg] = useConfig();
  const { day, clock } = useSimTime(cfg);
  const router = useRouter();
  const location = useLocation();
  const [role, setLocalRole] = useState<"customer" | "manager">("customer");
  const [customerView, setCustomerView] = useState<CustomerViewMode>("green");
  const isConventionalCustomer = location.pathname === "/" && customerView === "conventional";
  const headerAccent = isConventionalCustomer ? "#1f3b73" : "var(--eco-primary)";

  useEffect(() => {
    setLocalRole(getRole());
    const onChange = () => setLocalRole(getRole());
    window.addEventListener("eco-role-change", onChange);
    return () => window.removeEventListener("eco-role-change", onChange);
  }, []);

  useEffect(() => {
    setCustomerView(getCustomerView());
    const onChange = () => setCustomerView(getCustomerView());
    window.addEventListener("eco-customer-view-change", onChange);
    return () => window.removeEventListener("eco-customer-view-change", onChange);
  }, []);

  const switchRole = (r: "customer" | "manager") => {
    setRole(r);
    setLocalRole(r);
    if (r === "customer" && location.pathname !== "/") router.navigate({ to: "/" });
    if (r === "manager" && location.pathname !== "/manager") router.navigate({ to: "/manager" });
  };

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b px-6 py-3"
      style={{
        backgroundColor: "var(--eco-surface)",
        borderColor: "var(--border)",
      }}
    >
      <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
        <Leaf size={20} style={{ color: headerAccent }} />
        <span>Verdant Stay</span>
      </Link>

      <div className="flex items-center gap-3">
        {/* Role segmented control */}
        <div
          className="flex items-center rounded-sm border p-1 text-sm"
          style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}
        >
          <button
            onClick={() => switchRole("customer")}
            className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 transition-colors"
            style={{
              backgroundColor: role === "customer" ? headerAccent : "transparent",
              color: role === "customer" ? "var(--primary-foreground)" : "var(--eco-muted)",
            }}
          >
            <User size={14} /> Customer
          </button>
          <button
            onClick={() => switchRole("manager")}
            className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 transition-colors"
            style={{
              backgroundColor: role === "manager" ? headerAccent : "transparent",
              color: role === "manager" ? "var(--primary-foreground)" : "var(--eco-muted)",
            }}
          >
            <BarChart3 size={14} /> Manager
          </button>
        </div>

        <div
          className="hidden items-center gap-2 rounded-sm border px-3 py-1.5 text-xs sm:flex"
          style={{ backgroundColor: "var(--background)", color: "var(--eco-muted)", borderColor: "var(--border)" }}
        >
          <span style={{ color: headerAccent }}>●</span>
          Sim day {day} · {clock} left
        </div>

        <Link
          to="/admin"
          className="flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-sm transition-colors"
          style={{ backgroundColor: "var(--background)", color: "var(--eco-text)", borderColor: "var(--border)" }}
        >
          <Settings size={14} /> Admin
        </Link>
      </div>
    </header>
  );
}
