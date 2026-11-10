/* Responsive role-aware navigation with a desktop rail and mobile drawer. */
import { useEffect, useState } from "react";
import {
  BarChart3,
  BedDouble,
  Building2,
  CalendarCheck,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  UserRound,
  Users,
  X,
} from "lucide-react";
import useAuth from "../context/useAuth.js";
import Link from "./Link.jsx";
import { Alert, Badge } from "./UI.jsx";

const mainItems = [{ label: "Dashboard", href: "/dashboard", Icon: LayoutDashboard }];

const managementItems = [
  { label: "Rooms", href: "/rooms", Icon: BedDouble },
  { label: "Reservations", href: "/reservations", Icon: CalendarCheck, roles: ["admin", "manager", "receptionist"] },
  { label: "My Bookings", href: "/my-bookings", Icon: CalendarDays, roles: ["guest"] },
  { label: "Users", href: "/users", Icon: Users, roles: ["admin", "manager"] },
  { label: "Profile", href: "/profile", Icon: UserRound },
];

const soonItems = [
  { label: "Billing", Icon: ReceiptText, roles: ["admin", "manager", "receptionist"] },
  { label: "Housekeeping", Icon: Building2, roles: ["admin", "manager", "housekeeping"] },
  { label: "Reports", Icon: BarChart3, roles: ["admin", "manager"] },
];

function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";
}

export default function Sidebar({ path, collapsed, drawerOpen, setDrawerOpen, className = "" }) {
  const { user, logout } = useAuth();
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    if (!drawerOpen) return undefined;

    const handleKey = (event) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };

    const handleRouteChange = () => setDrawerOpen(false);

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    window.addEventListener("luxurystay:navigate", handleRouteChange);
    window.addEventListener("popstate", handleRouteChange);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("luxurystay:navigate", handleRouteChange);
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, [drawerOpen, setDrawerOpen]);

  const visibleManagementItems = managementItems.filter((item) => !item.roles || item.roles.includes(user?.role));
  const visibleSoonItems = soonItems.filter((item) => item.roles.includes(user?.role));

  const linkClass = (active, compact) => {
    const base = "flex h-10 min-w-0 items-center gap-3 rounded-lg px-3 text-sm transition-colors hover:bg-white/10";
    return `${base} ${active ? "bg-primary text-white hover:bg-primary" : "text-white/80"} ${compact ? "justify-center px-0" : ""}`;
  };

  const renderLinks = (items, compact) =>
    items.map(({ label, href, Icon }) => {
      const active = path === href;
      return (
        <Link
          aria-current={active ? "page" : undefined}
          className={linkClass(active, compact)}
          href={href}
          key={href}
          onClick={() => setDrawerOpen(false)}
          title={compact ? label : undefined}
        >
          <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
          <span className={compact ? "sr-only" : "truncate"}>{label}</span>
        </Link>
      );
    });

  const desktopSidebar = (
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
        <section className="space-y-1">
          <p className={`px-3 pb-1 text-[10px] font-semibold tracking-[0.2em] text-white/40 ${collapsed ? "hidden" : "block"}`}>MAIN</p>
          {renderLinks(mainItems, collapsed)}
        </section>

        <section className="space-y-1">
          <p className={`px-3 pb-1 text-[10px] font-semibold tracking-[0.2em] text-white/40 ${collapsed ? "hidden" : "block"}`}>MANAGEMENT</p>
          {renderLinks(visibleManagementItems, collapsed)}
        </section>

        <section className="space-y-1">
          <p className={`px-3 pb-1 text-[10px] font-semibold tracking-[0.2em] text-white/40 ${collapsed ? "hidden" : "block"}`}>MORE</p>
          {visibleSoonItems.map(({ label, Icon }) => (
            <div
              className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-white/45 ${collapsed ? "justify-center px-0" : ""}`}
              key={label}
              title={collapsed ? `${label} - Soon` : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
              {!collapsed && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">Soon</span>}
            </div>
          ))}
        </section>
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <div className={`flex min-w-0 items-center gap-3 rounded-lg bg-white/5 p-2 ${collapsed ? "justify-center p-1" : ""}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {initials(user?.name)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <Badge tone="primary">{user?.role}</Badge>
            </div>
          )}
          <button
            aria-label="Log out"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
            onClick={async () => {
              try {
                await logout();
              } catch (error) {
                setLogoutError(error.message);
              }
            }}
            title={collapsed ? "Log out" : undefined}
            type="button"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
        {logoutError && <Alert className="mt-2" onClose={() => setLogoutError("")}>{logoutError}</Alert>}
      </div>
    </aside>
  );

  const mobileSidebar = (
    <>
      {drawerOpen && (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          type="button"
        />
      )}

      <aside className={`print-hide fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col bg-ink text-white transition-transform duration-200 lg:hidden ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">LuxuryStay</p>
            <p className="truncate text-[10px] text-white/50">Hotel Management</p>
          </div>
          <button
            aria-label="Close menu"
            className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10"
            onClick={() => setDrawerOpen(false)}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Main navigation" className="no-scrollbar flex-1 min-h-0 space-y-4 overflow-y-auto p-3">
          <section className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.2em] text-white/40">MAIN</p>
            {renderLinks(mainItems, false)}
          </section>

          <section className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.2em] text-white/40">MANAGEMENT</p>
            {renderLinks(visibleManagementItems, false)}
          </section>

          <section className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.2em] text-white/40">MORE</p>
            {visibleSoonItems.map(({ label, Icon }) => (
              <div className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-white/45" key={label}>
                <Icon className="h-5 w-5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">Soon</span>
              </div>
            ))}
          </section>
        </nav>

        <div className="shrink-0 border-t border-white/10 p-3">
          <div className="flex min-w-0 items-center gap-3 rounded-lg bg-white/5 p-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              {initials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <Badge tone="primary">{user?.role}</Badge>
            </div>
            <button
              aria-label="Log out"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
              onClick={async () => {
                try {
                  await logout();
                } catch (error) {
                  setLogoutError(error.message);
                }
              }}
              type="button"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
          {logoutError && <Alert className="mt-2" onClose={() => setLogoutError("")}>{logoutError}</Alert>}
        </div>
      </aside>
    </>
  );

  return (
    <>
      {desktopSidebar}
      {mobileSidebar}
    </>
  );
}
