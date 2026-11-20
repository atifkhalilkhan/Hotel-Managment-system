/* Role-aware desktop navigation rail. */
import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BedDouble,
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  ConciergeBell,
  LayoutDashboard,
  LogOut,
  Bell,
  MessageSquareQuote,
  ReceiptText,
  SprayCan,
  Settings2,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";
import useAuth from "../context/useAuth.js";
import Link from "./Link.jsx";
import { Alert } from "./UI.jsx";

const mainItems = [{ label: "Dashboard", href: "/dashboard", Icon: LayoutDashboard }];
const managementItems = [
  { label: "Rooms", href: "/rooms", Icon: BedDouble },
  { label: "Reservations", href: "/reservations", Icon: CalendarCheck, roles: ["admin", "manager", "receptionist"] },
  { label: "My Bookings", href: "/my-bookings", Icon: CalendarDays, roles: ["guest"] },
  { label: "Users", href: "/users", Icon: Users, roles: ["admin", "manager"] },
  { label: "Hotel Settings", href: "/settings", Icon: Settings2, roles: ["admin", "manager"] },
  { label: "Profile", href: "/profile", Icon: UserRound },
  { label: "Notifications", href: "/notifications", Icon: Bell },
];
const billingItems = [
  { label: "Invoices", href: "/invoices", Icon: ReceiptText, roles: ["admin", "manager", "receptionist"] },
  { label: "Billing Report", href: "/billing", Icon: BarChart3, roles: ["admin", "manager"] },
  { label: "My Invoices", href: "/my-invoices", Icon: ReceiptText, roles: ["guest"] },
];
const operationsItems = [
  { label: "Housekeeping", href: "/housekeeping", Icon: SprayCan, roles: ["admin", "manager", "receptionist"] },
  { label: "My Tasks", href: "/housekeeping", Icon: ClipboardList, roles: ["housekeeping"] },
  { label: "Maintenance", href: "/maintenance", Icon: Wrench, roles: ["admin", "manager", "receptionist"] },
  { label: "Services", href: "/services", Icon: ConciergeBell, roles: ["admin", "manager", "receptionist"] },
  { label: "My Services", href: "/my-services", Icon: ConciergeBell, roles: ["guest"] },
  { label: "Feedback", href: "/feedback", Icon: MessageSquareQuote, roles: ["admin", "manager"] },
  { label: "Report Issue", href: "/my-issues", Icon: AlertTriangle, roles: ["guest", "housekeeping"] },
];
const analyticsItems = [{ label: "Reports & Analytics", href: "/analytics", Icon: BarChart3, roles: ["admin", "manager"] }];

export default function Sidebar({ path, collapsed, className = "" }) {
  const { user, logout } = useAuth();
  const [logoutError, setLogoutError] = useState("");

  const handleLogout = async () => {
    setLogoutError("");
    try {
      await logout();
    } catch (error) {
      setLogoutError(error.message || "Unable to log out.");
    }
  };

  const visibleManagementItems = managementItems.filter((item) => !item.roles || item.roles.includes(user?.role));
  const visibleBillingItems = billingItems.filter((item) => item.roles.includes(user?.role));
  const visibleOperationsItems = operationsItems.filter((item) => item.roles.includes(user?.role));
  const visibleAnalyticsItems = analyticsItems.filter((item) => item.roles.includes(user?.role));
  const linkClass = (active, compact) => {
    const base = "flex h-10 min-w-0 items-center gap-3 rounded-lg px-3 text-sm transition-colors hover:bg-white/10";
    return `${base} ${active ? "bg-primary text-white hover:bg-primary" : "text-white/80"} ${compact ? "justify-center px-0" : ""}`;
  };

  const renderLinks = (items) => items.map(({ label, href, Icon }) => {
    const active = path === href;
    return (
      <Link
        aria-current={active ? "page" : undefined}
        className={linkClass(active, collapsed)}
        href={href}
        key={`${label}-${href}`}
        title={collapsed ? label : undefined}
      >
        <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
        <span className={collapsed ? "sr-only" : "truncate"}>{label}</span>
      </Link>
    );
  });

  const section = (label, items) => (
    <section className="space-y-1" key={label}>
      <p className={`px-3 pb-1 text-[10px] font-semibold tracking-[0.2em] text-white/40 ${collapsed ? "hidden" : "block"}`}>{label}</p>
      {renderLinks(items)}
    </section>
  );

  return (
    <aside className={`print-hide hidden h-dvh shrink-0 flex-col overflow-hidden bg-ink text-white transition-[width] duration-200 lg:flex ${collapsed ? "w-[72px]" : "w-[256px]"} ${className}`}>
      <div className={`flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4 ${collapsed ? "justify-center px-2" : ""}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <Building2 className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">LuxuryStay</p>
            <p className="truncate text-[10px] text-white/50">Hotel Management</p>
          </div>
        )}
      </div>

      <nav aria-label="Main navigation" className="no-scrollbar flex-1 min-h-0 space-y-4 overflow-y-auto p-3">
        {section("MAIN", mainItems)}
        {section("MANAGEMENT", visibleManagementItems)}
        {section("BILLING", visibleBillingItems)}
        {section("OPERATIONS", visibleOperationsItems)}
        {section("INSIGHTS", visibleAnalyticsItems)}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <button
          aria-label="Log out"
          className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/75 transition hover:bg-red-500/15 hover:text-white ${collapsed ? "justify-center px-0" : ""}`}
          onClick={handleLogout}
          title={collapsed ? "Log out" : undefined}
          type="button"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
        {logoutError && <Alert className="mt-2" onClose={() => setLogoutError("")}>{logoutError}</Alert>}
      </div>
    </aside>
  );
}
