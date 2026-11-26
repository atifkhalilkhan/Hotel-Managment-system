import { Phone, CalendarCheck } from "lucide-react";
import ButtonLink from "../ui/ButtonLink";
import useScrolled from "../../hooks/useScrolled";
import useElementInView from "../../hooks/useElementInView";
import { hotelInfo } from "../../lib/hotelInfo";
import { guestRegisterUrl } from "../../lib/portal";

// Sirf mobile par: thoda scroll karne ke baad neeche Call aur Book now ka bar
export default function MobileStickyBar({ suppressed = false }) {
  const pastHero = useScrolled(320);
  const footerVisible = useElementInView("site-footer");
  const show = pastHero && !footerVisible && !suppressed;
  const telHref = `tel:${hotelInfo.phone.replace(/[^\d+]/g, "")}`;

  return (
    <div
      role="region"
      aria-label="Quick actions"
      inert={!show}
      className={`fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-3 border-t border-line bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-transform duration-300 lg:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <ButtonLink to={telHref} variant="outline" size="lg">
        <Phone className="size-4" aria-hidden="true" />
        Call
      </ButtonLink>
      <ButtonLink to={guestRegisterUrl()} size="lg">
        <CalendarCheck className="size-4" aria-hidden="true" />
        Book now
      </ButtonLink>
    </div>
  );
}
