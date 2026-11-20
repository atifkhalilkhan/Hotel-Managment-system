/* Shared authenticated layout with a fixed sidebar and scrolling content area. */
import { useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";
import MobileNavigation from "../components/MobileNavigation.jsx";

const pageTitles = { "/dashboard": "Dashboard", "/rooms": "Rooms", "/reservations": "Reservations", "/reservations/new": "New reservation", "/housekeeping": "Housekeeping", "/maintenance": "Maintenance", "/my-issues": "Report an issue", "/services": "Services", "/my-services": "My services", "/feedback": "Feedback", "/notifications": "Notifications", "/billing": "Billing report", "/analytics": "Reports & Analytics", "/settings": "Hotel Settings", "/invoices": "Invoices", "/my-invoices": "My invoices", "/my-bookings": "My bookings", "/profile": "My profile", "/users": "User management" };

export default function MainLayout({ path, children }) {
  const [collapsed, setCollapsedState] = useState(() => localStorage.getItem("luxurystay-sidebar-collapsed") === "true");

  const setCollapsed = (value) => {
    setCollapsedState(value);
    localStorage.setItem("luxurystay-sidebar-collapsed", String(value));
  };

  const sidebarWidth = collapsed ? "lg:w-[72px]" : "lg:w-[256px]";

  return (
    <div className="flex h-dvh min-w-0 overflow-hidden bg-page">
      <Sidebar
        path={path}
        collapsed={collapsed}
        className={sidebarWidth}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          title={pageTitles[path] || "LuxuryStay"}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
        <main className="min-w-0 flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="mx-auto w-full max-w-7xl min-w-0 p-3 min-[400px]:p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
      <MobileNavigation path={path} />
    </div>
  );
}
