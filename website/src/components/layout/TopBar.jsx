import { Phone, Mail, Clock, User } from "lucide-react";
import Container from "../ui/Container";
import SocialLinks from "../ui/SocialLinks";
import { hotelInfo } from "../../lib/hotelInfo";
import { portalUrl, PORTAL_LOGIN } from "../../lib/portal";

const item = "inline-flex items-center gap-2 transition-colors hover:text-white";

export default function TopBar() {
  const { phone, email, receptionHours } = hotelInfo;

  return (
    <div className="hidden bg-ink text-xs text-white/80 lg:block">
      <Container className="flex h-10 items-center justify-between">
        <div className="flex items-center gap-6">
          <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={item}>
            <Phone className="size-3.5" aria-hidden="true" />
            {phone}
          </a>
          <a href={`mailto:${email}`} className={item}>
            <Mail className="size-3.5" aria-hidden="true" />
            {email}
          </a>
          <span className="inline-flex items-center gap-2">
            <Clock className="size-3.5" aria-hidden="true" />
            {receptionHours}
          </span>
        </div>
        <div className="flex items-center gap-5">
          <SocialLinks variant="bar" />
          <a href={portalUrl(PORTAL_LOGIN)} className={item}>
            <User className="size-3.5" aria-hidden="true" />
            Guest login
          </a>
        </div>
      </Container>
    </div>
  );
}