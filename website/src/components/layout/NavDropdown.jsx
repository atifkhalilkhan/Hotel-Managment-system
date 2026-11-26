import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ArrowRight } from "lucide-react";
import useOnClickOutside from "../../hooks/useOnClickOutside";
import { navLinkClass } from "./navStyles";

export default function NavDropdown({ item, active, isOpen, onOpen, onClose }) {
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const openTimer = useRef(0);
  const closeTimer = useRef(0);
  const pinned = useRef(false);
  const focusOnOpen = useRef(false);

  const panelId = `nav-panel-${item.label.toLowerCase()}`;
  const twoCol = item.children.length > 4;

  useEffect(
    () => () => {
      clearTimeout(openTimer.current);
      clearTimeout(closeTimer.current);
    },
    []
  );

  useEffect(() => {
    if (!isOpen) {
      pinned.current = false;
      return;
    }
    if (focusOnOpen.current) {
      focusOnOpen.current = false;
      panelRef.current?.querySelector("a")?.focus();
    }
  }, [isOpen]);

  useOnClickOutside(rootRef, onClose, isOpen);

  const handleEnter = (event) => {
    if (event.pointerType !== "mouse") return;
    clearTimeout(closeTimer.current);
    if (!isOpen) openTimer.current = setTimeout(onOpen, 120);
  };

  const handleLeave = (event) => {
    if (event.pointerType !== "mouse") return;
    clearTimeout(openTimer.current);
    if (pinned.current) return;
    closeTimer.current = setTimeout(onClose, 200);
  };

  const handleClick = () => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
    if (!isOpen) {
      pinned.current = true;
      onOpen();
      return;
    }
    if (!pinned.current) {
      pinned.current = true;
      return;
    }
    pinned.current = false;
    onClose();
  };

  const links = () => Array.from(panelRef.current?.querySelectorAll("a") ?? []);

  const handleTriggerKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (isOpen) {
        links()[0]?.focus();
      } else {
        focusOnOpen.current = true;
        pinned.current = true;
        onOpen();
      }
    } else if (event.key === "Escape" && isOpen) {
      onClose();
    }
  };

  const handlePanelKeyDown = (event) => {
    const list = links();
    const index = list.indexOf(document.activeElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      list[(index + 1) % list.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      list[(index - 1 + list.length) % list.length]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      list[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      list[list.length - 1]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      triggerRef.current?.focus();
    }
  };

  const handleBlur = (event) => {
    if (!rootRef.current?.contains(event.relatedTarget)) onClose();
  };

  return (
    <div
      ref={rootRef}
      className="relative flex items-center"
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      onBlur={handleBlur}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={handleClick}
        onKeyDown={handleTriggerKeyDown}
        className={`${navLinkClass} ${active || isOpen ? "after:scale-x-100" : ""}`}
      >
        {item.label}
        <ChevronDown
          aria-hidden="true"
          className={`size-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        id={panelId}
        ref={panelRef}
        onKeyDown={handlePanelKeyDown}
          className={`absolute left-0 top-full z-50 origin-top-left pt-2 transition-[opacity,transform,visibility] duration-200 ease-out ${
          twoCol ? "w-[560px]" : "w-[360px]"
          } ${isOpen ? "visible translate-y-0 scale-100 opacity-100" : "invisible -translate-y-2 scale-[0.98] opacity-0"}`}
      >
        <div
          className={`rounded-xl border border-line bg-white p-2 shadow-[0_16px_40px_rgba(0,0,0,0.14)] ${
            twoCol ? "grid grid-cols-2 gap-1" : "flex flex-col gap-1"
          }`}
        >
          {item.children.map((child, index) => {
            const Icon = child.icon;
            const wide = twoCol && index === 0;
            return (
              <Link
                key={child.to}
                to={child.to}
                className={`group flex items-start gap-3 rounded-lg p-3 transition duration-200 hover:translate-x-0.5 hover:bg-soft focus-visible:bg-soft ${
                  wide ? "col-span-2" : ""
                }`}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-accent">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{child.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{child.description}</span>
                </span>
                {
                  <ArrowRight
                    aria-hidden="true"
                    className="mt-2.5 size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
                  />
                }
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
