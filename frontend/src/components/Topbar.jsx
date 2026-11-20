/* Sticky header with user identity and persistent notification access. */
import { lazy, Suspense, useState } from "react";
import { PanelLeftClose, PanelLeftOpen, Power } from "lucide-react";
import useAuth from "../context/useAuth.js";
import { Badge } from "./UI.jsx";
import Link from "./Link.jsx";

const NotificationBell = lazy(() => import("./NotificationBell.jsx"));

function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

export default function Topbar({ title, collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const [failedAvatarUrl, setFailedAvatarUrl] = useState("");
  const avatarUrl = user?.avatar?.url;
  const showAvatar = avatarUrl && failedAvatarUrl !== avatarUrl;

  return (
    <header className="print-hide sticky top-0 z-30 flex h-16 min-w-0 items-center gap-2 border-b border-line bg-white/95 px-3 shadow-sm backdrop-blur sm:gap-3 sm:px-6 lg:px-8">
      <button aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-page lg:flex" onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}</button>
      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-lg">{title}</h1>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link aria-label="Open your profile" className="flex min-w-0 items-center gap-2 rounded-full p-1 pr-2 transition hover:bg-page" href="/profile" title="Open your profile">
          {showAvatar ? <img alt="" className="h-9 w-9 shrink-0 rounded-full border border-line object-cover" onError={() => setFailedAvatarUrl(avatarUrl)} src={avatarUrl} /> : <div aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-dark">{initials(user?.name)}</div>}
          <span className="min-w-0 max-w-16 max-[360px]:hidden sm:max-w-36">
            <span className="block truncate text-xs font-semibold sm:text-sm">{user?.name}</span>
            <span className="hidden sm:block"><Badge tone="primary">{user?.role}</Badge></span>
          </span>
        </Link>
        <Suspense fallback={<div aria-hidden="true" className="h-11 w-11 shrink-0 rounded-full bg-page" />}>
          <NotificationBell />
        </Suspense>
        <button
          aria-label="Log out"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 lg:hidden"
          onClick={logout}
          type="button"
          title="Log out"
        >
          <Power aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
