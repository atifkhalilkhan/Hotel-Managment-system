import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { X, ChevronDown, LogIn, CalendarCheck, Phone, Mail, MapPin } from "lucide-react";
import Logo from "../ui/Logo";
import IconButton from "../ui/IconButton";
import ButtonLink from "../ui/ButtonLink";
import SocialLinks from "../ui/SocialLinks";
import useLockBodyScroll from "../../hooks/useLockBodyScroll";
import useEscapeKey from "../../hooks/useEscapeKey";
import { mainNav } from "../../lib/navigation";
import { hotelInfo } from "../../lib/hotelInfo";
import { portalUrl, PORTAL_LOGIN } from "../../lib/portal";

const row =
  "relative flex min-h-[52px] w-full items-center justify-between border-b border-line px-5 text-left text-base font-medium text-ink transition-colors hover:bg-soft";

const FOCUSABLE = "a[href], button:not([disabled])";

export default function MobileDrawer({ open, onClose, id = "mobile-drawer" }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const [expanded, setExpanded] = useState(null);

  useLockBodyScroll(open);
  useEscapeKey(onClose, open);

  // Khulte hi close button par focus, band hote hi pehle wali jagah par wapas
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    closeRef.current?.focus();
    return () => previous?.focus?.();
  }, [open]);

  // Tab dabane par focus drawer ke andar hi ghoomta rahe
  const handleKeyDown = (event) => {
    if (event.key !== "Tab") return;
    const items = Array.from(panelRef.current?.querySelectorAll(FOCUSABLE) ?? []).filter(
      (element) => !element.closest("[inert]")
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const telHref = `tel:${hotelInfo.phone.replace(/[^\d+]/g, "")}`;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        id={id}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        inert={!open}
        onKeyDown={handleKeyDown}
        className={`fixed inset-y-0 right-0 z-[60] flex h-dvh w-[88vw] max-w-sm flex-col bg-white transition-[transform,visibility] duration-300 lg:hidden ${
          open
            ? "visible translate-x-0 shadow-[-8px_0_24px_rgba(0,0,0,0.08)]"
            : "invisible translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
          <Logo />
          <IconButton ref={closeRef} label="Close menu" onClick={onClose} className="-mr-2">
            <X className="size-6" aria-hidden="true" />
          </IconButton>
        </div>

        <nav aria-label="Mobile" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {mainNav.map((item) => {
            if (!item.children) {
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `${row} ${
                      isActive
                        ? "text-accent before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:bg-primary"
                        : ""
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              );
            }

            const isOpen = expanded === item.label;
            const subId = `drawer-sub-${item.label.toLowerCase()}`;

            return (
              <div key={item.label}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={subId}
                  onClick={() => setExpanded(isOpen ? null : item.label)}
                  className={row}
                >
                  {item.label}
                  <ChevronDown
                    aria-hidden="true"
                    className={`size-5 text-muted transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  id={subId}
                  inert={!isOpen}
                  className={`grid transition-[grid-template-rows] duration-200 ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <ul className="overflow-hidden bg-soft">
                    {item.children.map((child) => {
                      const Icon = child.icon;
                      return (
                        <li key={child.to}>
                          <Link
                            to={child.to}
                            onClick={onClose}
                            className="flex min-h-12 items-start gap-3 border-b border-line/70 px-5 py-3 transition-colors hover:bg-white"
                          >
                            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-accent">
                              <Icon className="size-[18px]" aria-hidden="true" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-ink">{child.label}</span>
                              <span className="mt-0.5 block text-xs text-muted">{child.description}</span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-line bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <div className="grid gap-3">
            <ButtonLink to="/rooms" size="lg" className="w-full">
              <CalendarCheck className="size-4" aria-hidden="true" />
              Book now
            </ButtonLink>
            <ButtonLink to={portalUrl(PORTAL_LOGIN)} variant="outline" size="lg" className="w-full">
              <LogIn className="size-4" aria-hidden="true" />
              Log in
            </ButtonLink>
          </div>

          <div className="mt-5 space-y-2.5 text-sm">
            <p className="type-eyebrow text-muted">Reception</p>
            <a href={telHref} className="flex items-center gap-3 font-medium text-ink">
              <Phone className="size-4 text-accent" aria-hidden="true" />
              {hotelInfo.phone}
            </a>
            <a href={`mailto:${hotelInfo.email}`} className="flex items-center gap-3 text-ink">
              <Mail className="size-4 text-accent" aria-hidden="true" />
              <span className="truncate">{hotelInfo.email}</span>
            </a>
            <p className="flex items-center gap-3 text-muted">
              <MapPin className="size-4 text-accent" aria-hidden="true" />
              {hotelInfo.shortAddress}
            </p>
          </div>

          <SocialLinks variant="outline" className="mt-4" />
        </div>
      </div>
    </>
  );
}
