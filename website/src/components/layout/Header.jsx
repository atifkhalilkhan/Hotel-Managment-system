import { Link } from "react-router-dom";
import { LogIn, CalendarCheck, Menu } from "lucide-react";
import Container from "../ui/Container";
import Logo from "../ui/Logo";
import ButtonLink from "../ui/ButtonLink";
import IconButton from "../ui/IconButton";
import DesktopNav from "./DesktopNav";
import { portalUrl, PORTAL_LOGIN } from "../../lib/portal";

export default function Header({ scrolled, menuOpen, onOpenMenu, drawerId = "mobile-drawer" }) {
  return (
    <header
      className={`sticky top-0 z-40 border-b border-line bg-white transition-shadow duration-200 ${
        scrolled ? "shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : ""
      }`}
    >
      <Container className="flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        <Link to="/" aria-label="LuxuryStay home" className="shrink-0">
          <Logo />
        </Link>

        <DesktopNav />

        <div className="flex items-center gap-2">
          <ButtonLink to={portalUrl(PORTAL_LOGIN)} variant="ghost" className="max-lg:hidden">
            <LogIn className="size-4" aria-hidden="true" />
            Log in
          </ButtonLink>

          <ButtonLink to="/rooms" aria-label="Book now" className="px-3 sm:px-5">
            <CalendarCheck className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Book now</span>
          </ButtonLink>

          <IconButton
            label="Open menu"
            className="lg:hidden"
            aria-expanded={menuOpen}
            aria-controls={drawerId}
            onClick={onOpenMenu}
          >
            <Menu className="size-6" aria-hidden="true" />
          </IconButton>
        </div>
      </Container>
    </header>
  );
}
