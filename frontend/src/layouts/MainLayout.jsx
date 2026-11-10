/* Shared authenticated layout with a fixed sidebar and scrolling content area. */
import { useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";

const pageTitles = { "/dashboard": "Dashboard", "/rooms": "Rooms", "/reservations": "Reservations", "/reservations/new": "New reservation", "/my-bookings": "My bookings", "/profile": "My profile", "/users": "User management" };

export default function MainLayout({ path, children }) {
  const [collapsed, setCollapsedState] = useState(() => localStorage.getItem("luxurystay-sidebar-collapsed") === "true");
  const [drawerOpen, setDrawerOpen] = useState(false);

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
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        className={sidebarWidth}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          title={pageTitles[path] || "LuxuryStay"}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          setDrawerOpen={setDrawerOpen}
        />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl min-w-0 p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
