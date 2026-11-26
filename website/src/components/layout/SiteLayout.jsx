import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import useScrolled from "../../hooks/useScrolled";
import useMediaQuery from "../../hooks/useMediaQuery";
import SkipLink from "./SkipLink";
import TopBar from "./TopBar";
import Header from "./Header";
import MobileDrawer from "./MobileDrawer";
import MobileStickyBar from "./MobileStickyBar";
import SiteFooter from "./SiteFooter";
import GuestHelp from "./GuestHelp";

export default function SiteLayout() {
  const scrolled = useScrolled(8);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { pathname, hash } = useLocation();
  const routeKey = pathname + hash;

  // Page badalte hi drawer khud band ho jata hai
  const [menu, setMenu] = useState({ open: false, key: "" });
  const drawerOpen = menu.open && menu.key === routeKey && !isDesktop;

  const openMenu = () => setMenu({ open: true, key: routeKey });
  const closeMenu = () => setMenu({ open: false, key: routeKey });

  return (
    <>
      <SkipLink />
      <TopBar />
      <Header scrolled={scrolled} menuOpen={drawerOpen} onOpenMenu={openMenu} />
      <main id="main-content" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <SiteFooter />
      <MobileDrawer open={drawerOpen} onClose={closeMenu} />
      <MobileStickyBar suppressed={drawerOpen} />
      <GuestHelp />
    </>
  );
}
