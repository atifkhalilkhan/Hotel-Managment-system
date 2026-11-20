/* Role-aware bottom navigation with an expandable mobile More sheet. */
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BedDouble,
  Bell,
  Building2,
  CalendarCheck,
  CalendarDays,
  ConciergeBell,
  Download,
  FileText,
  LayoutDashboard,
  MessageSquareQuote,
  MoreHorizontal,
  SprayCan,
  Settings2,
  UserRound,
  Users,
  Wrench,
  X,
} from "lucide-react";
import useAuth from "../context/useAuth.js";
import Link from "./Link.jsx";

const staffTabs = [
  { label: "Home", href: "/dashboard", Icon: LayoutDashboard },
  { label: "Bookings", href: "/reservations", Icon: CalendarCheck },
  { label: "Rooms", href: "/rooms", Icon: BedDouble },
  { label: "Services", href: "/services", Icon: ConciergeBell },
];
const guestTabs = [
  { label: "Home", href: "/dashboard", Icon: LayoutDashboard },
  { label: "Bookings", href: "/my-bookings", Icon: CalendarDays },
  { label: "Services", href: "/my-services", Icon: ConciergeBell },
  { label: "Invoices", href: "/my-invoices", Icon: FileText },
];
const housekeepingTabs = [
  { label: "Home", href: "/dashboard", Icon: LayoutDashboard },
  { label: "My tasks", href: "/housekeeping", Icon: SprayCan },
  { label: "Rooms", href: "/rooms", Icon: BedDouble },
  { label: "Issues", href: "/my-issues", Icon: AlertTriangle },
];

const moreGroups = [
  {
    label: "MANAGEMENT",
    items: [
      { label: "Reservations", href: "/reservations", Icon: CalendarCheck, roles: ["admin", "manager", "receptionist"] },
      { label: "My Bookings", href: "/my-bookings", Icon: CalendarDays, roles: ["guest"] },
      { label: "Users", href: "/users", Icon: Users, roles: ["admin", "manager"] },
      { label: "Hotel Settings", href: "/settings", Icon: Settings2, roles: ["admin", "manager"] },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { label: "Rooms", href: "/rooms", Icon: BedDouble },
      { label: "Housekeeping", href: "/housekeeping", Icon: SprayCan, roles: ["admin", "manager", "receptionist"] },
      { label: "Maintenance", href: "/maintenance", Icon: Wrench, roles: ["admin", "manager", "receptionist"] },
      { label: "Services", href: "/services", Icon: ConciergeBell, roles: ["admin", "manager", "receptionist"] },
      { label: "My Services", href: "/my-services", Icon: ConciergeBell, roles: ["guest"] },
      { label: "Feedback", href: "/feedback", Icon: MessageSquareQuote, roles: ["admin", "manager"] },
      { label: "Report Issue", href: "/my-issues", Icon: AlertTriangle, roles: ["guest", "housekeeping"] },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { label: "Invoices", href: "/invoices", Icon: FileText, roles: ["admin", "manager", "receptionist"] },
      { label: "My Invoices", href: "/my-invoices", Icon: FileText, roles: ["guest"] },
      { label: "Billing Report", href: "/billing", Icon: BarChart3, roles: ["admin", "manager"] },
      { label: "Reports & Analytics", href: "/analytics", Icon: BarChart3, roles: ["admin", "manager"] },
    ],
  },
  {
    label: "GENERAL",
    items: [
      { label: "Notifications", href: "/notifications", Icon: Bell },
      { label: "My Profile", href: "/profile", Icon: UserRound },
    ],
  },
];

function isActiveRoute(path, href) {
  return path === href || path.startsWith(`${href}/`);
}

export default function MobileNavigation({ path }) {
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installError, setInstallError] = useState("");
  const [iosInstallInstructions] = useState(() => (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !window.navigator.standalone &&
    !window.matchMedia("(display-mode: standalone)").matches
  ));

  const tabs = user?.role === "guest" ? guestTabs : user?.role === "housekeeping" ? housekeepingTabs : staffTabs;
  const visibleMoreGroups = moreGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => (
      (!item.roles || item.roles.includes(user?.role)) &&
      !tabs.some((tab) => tab.href === item.href)
    )),
  })).filter((group) => group.items.length);
  const activeTab = tabs.some((item) => isActiveRoute(path, item.href));
  const moreActive = moreOpen || !activeTab;

  useEffect(() => {
    const handleInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const handleInstalled = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (!moreOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [moreOpen]);

  const installApp = async () => {
    if (!installPrompt) return;
    setInstallError("");
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
    } catch (error) {
      setInstallError(error.message || "Unable to start app installation.");
    }
  };

  return (
    <>
      {moreOpen && (
        <>
          <button
            aria-label="Close More menu"
            className="mobile-drawer-backdrop fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
            onClick={() => setMoreOpen(false)}
            type="button"
          />
          <section
            aria-labelledby="mobile-more-title"
            aria-modal="true"
            className="mobile-drawer-enter fixed inset-y-0 left-0 z-[60] flex w-[min(21rem,88vw)] flex-col overflow-hidden border-r border-line bg-white shadow-2xl lg:hidden"
            role="dialog"
          >
            <header className="flex min-h-16 items-center justify-between border-b border-line px-4" style={{ paddingTop: "env(safe-area-inset-top)" }}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                  <Building2 aria-hidden="true" className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold" id="mobile-more-title">LuxuryStay</h2>
                  <p className="text-xs text-muted">Hotel management</p>
                </div>
              </div>
              <button
                aria-label="Close More menu"
                className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-page hover:text-ink"
                onClick={() => setMoreOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <nav aria-label="More app navigation" className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-5">
              <div className="space-y-6">
                {visibleMoreGroups.map((group) => (
                  <section aria-label={group.label} className="space-y-2" key={group.label}>
                    <h3 className="px-3 text-[10px] font-semibold tracking-[0.16em] text-muted">{group.label}</h3>
                    <div className="space-y-1">
                      {group.items.map(({ label, href, Icon }) => {
                        const active = isActiveRoute(path, href);
                        return (
                          <Link
                            aria-current={active ? "page" : undefined}
                            className={`flex min-h-11 min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-primary-soft text-primary-dark" : "text-ink hover:bg-page"}`}
                            href={href}
                            key={href}
                            onClick={() => setMoreOpen(false)}
                          >
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? "bg-white" : "bg-page text-primary-dark"}`}><Icon aria-hidden="true" className="h-4 w-4" /></span>
                            <span className="min-w-0 flex-1 truncate">{label}</span>
                            {active && <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </nav>

            {(installPrompt || installError || iosInstallInstructions) && (
              <div className="shrink-0 border-t border-line px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
                {installError && <p className="text-xs text-red-600">{installError}</p>}
                {iosInstallInstructions && <p className="mb-2 text-xs leading-5 text-muted">On iPhone or iPad, use Share → Add to Home Screen to install LuxuryStay.</p>}
                {installPrompt && (
                  <button
                    className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-sm font-medium text-ink transition hover:bg-page"
                    onClick={installApp}
                    type="button"
                  >
                    <Download className="h-5 w-5 text-primary-dark" />
                    Install LuxuryStay
                  </button>
                )}
              </div>
            )}

          </section>
        </>
      )}

      <nav
        aria-label="Mobile navigation"
        className="print-hide fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.375rem)" }}
      >
        <div className="mx-auto grid h-16 max-w-xl grid-cols-5 items-stretch px-1">
          {tabs.map(({ label, href, Icon }) => {
            const active = isActiveRoute(path, href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-medium transition-colors ${active ? "text-primary-dark" : "text-muted hover:bg-page"}`}
                href={href}
                key={href}
              >
                <span className={`flex h-7 w-12 items-center justify-center rounded-full ${active ? "bg-primary-soft" : ""}`}><Icon aria-hidden="true" className="h-5 w-5" /></span>
                <span className="max-w-full truncate">{label}</span>
              </Link>
            );
          })}
          <button
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            aria-label="More navigation options"
            className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-medium transition-colors ${moreActive ? "text-primary-dark" : "text-muted hover:bg-page"}`}
            onClick={() => setMoreOpen(true)}
            type="button"
          >
            <span className={`flex h-7 w-12 items-center justify-center rounded-full ${moreActive ? "bg-primary-soft" : ""}`}><MoreHorizontal aria-hidden="true" className="h-5 w-5" /></span>
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
