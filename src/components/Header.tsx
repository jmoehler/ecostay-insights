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
  const headerAccent = isConventionalCustomer ? "#1f3b73" : "var(--eco-primary)";

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
    <header
      className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b px-6 py-3"
      style={{
        backgroundColor: "var(--eco-surface)",
        borderColor: "var(--border)",
      }}
    >
      <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
        <Leaf size={20} style={{ color: headerAccent }} />
        <span>Green Proof</span>
      </Link>

      <div className="flex items-center gap-3">
        {/* Main nav segmented control */}
        <div
          className="flex items-center rounded-sm border p-1 text-sm"
          style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}
        >
          <button
            onClick={() => goToPage("/")}
            className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 transition-colors"
            style={{
              backgroundColor: isCustomerPage ? headerAccent : "transparent",
              color: isCustomerPage ? "var(--primary-foreground)" : "var(--eco-muted)",
            }}
          >
            <User size={14} /> Customer
          </button>
          <button
            onClick={() => goToPage("/manager")}
            className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 transition-colors"
            style={{
              backgroundColor: isManagerPage ? headerAccent : "transparent",
              color: isManagerPage ? "var(--primary-foreground)" : "var(--eco-muted)",
            }}
          >
            <BarChart3 size={14} /> Manager
          </button>
          <button
            onClick={() => goToPage("/admin")}
            className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 transition-colors"
            style={{
              backgroundColor: isAdminPage ? headerAccent : "transparent",
              color: isAdminPage ? "var(--primary-foreground)" : "var(--eco-muted)",
            }}
          >
            <Settings size={14} /> Admin
          </button>
        </div>

        <div
          className="hidden items-center gap-2 rounded-sm border px-3 py-1.5 text-xs sm:flex"
          style={{ backgroundColor: "var(--background)", color: "var(--eco-muted)", borderColor: "var(--border)" }}
        >
          <span style={{ color: headerAccent }}>●</span>
          Sim day {day} · {clock} left
        </div>

      </div>
    </header>
  );
}
