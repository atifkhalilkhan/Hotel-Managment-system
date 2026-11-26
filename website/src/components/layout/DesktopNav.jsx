import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { mainNav } from "../../lib/navigation";
import NavDropdown from "./NavDropdown";
import { navLinkClass } from "./navStyles";

export default function DesktopNav() {
  const { pathname, hash } = useLocation();
  const routeKey = pathname + hash;

  // Dropdown sirf usi page par khula maana jata hai jahan khola gaya tha
  const [openState, setOpenState] = useState({ label: null, key: "" });
  const openLabel = openState.key === routeKey ? openState.label : null;

  const open = (label) => setOpenState({ label, key: routeKey });
  const close = (label) =>
    setOpenState((state) => (state.label === label ? { label: null, key: routeKey } : state));

  const isActive = (to) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <nav aria-label="Primary" className="hidden h-full items-stretch gap-5 lg:flex xl:gap-7">
      {mainNav.map((item) =>
        item.children ? (
          <NavDropdown
            key={item.label}
            item={item}
            active={isActive(item.to)}
            isOpen={openLabel === item.label}
            onOpen={() => open(item.label)}
            onClose={() => close(item.label)}
          />
        ) : (
          <div key={item.label} className="flex items-center">
            <NavLink
              to={item.to}
              end={item.to === "/"}
              className={({ isActive: current }) =>
                `${navLinkClass} ${current ? "after:scale-x-100" : ""}`
              }
            >
              {item.label}
            </NavLink>
          </div>
        )
      )}
    </nav>
  );
}