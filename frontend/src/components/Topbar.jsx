/* Sticky dashboard header with responsive navigation controls. */
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import useAuth from "../context/useAuth.js";
import { Badge } from "./UI.jsx";

function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

export default function Topbar({ title, collapsed, setCollapsed, setDrawerOpen }) {
  const { user } = useAuth();
  return (
    <header className="print-hide sticky top-0 z-30 flex h-16 min-w-0 items-center gap-3 border-b border-line bg-white px-4 sm:px-6 lg:px-8">
      <button aria-label="Open navigation" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-page lg:hidden" onClick={() => setDrawerOpen(true)}><Menu className="h-5 w-5" /></button>
      <button aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-page lg:flex" onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}</button>
      <h1 className="min-w-0 flex-1 truncate text-base font-semibold sm:text-lg">{title}</h1>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span className="hidden max-w-36 truncate text-sm font-medium sm:block">{user?.name}</span>
        <Badge tone="primary">{user?.role}</Badge>
        <div aria-label={user?.name} className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-dark sm:hidden">{initials(user?.name)}</div>
      </div>
    </header>
  );
}
