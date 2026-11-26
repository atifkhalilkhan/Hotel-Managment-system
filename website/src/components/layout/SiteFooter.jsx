import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Clock3, MapPin, Phone } from "lucide-react";
import Container from "../ui/Container";
import Logo from "../ui/Logo";
import SocialLinks from "../ui/SocialLinks";
import { footerGroups } from "../../lib/navigation";
import { hotelInfo } from "../../lib/hotelInfo";

function FooterLink({ to, children }) {
  const external = /^(https?:|tel:|mailto:)/.test(to);
  return external ? <a href={to}>{children}</a> : <Link to={to}>{children}</Link>;
}

export default function SiteFooter() {
  const telHref = `tel:${hotelInfo.phone.replace(/[^\d+]/g, "")}`;
  return (
    <footer id="site-footer" className="bg-ink text-white">
      <Container className="grid gap-8 py-8 sm:py-10 lg:grid-cols-[1.25fr_2fr] lg:gap-14 lg:py-12">
        <section aria-label="Hotel contact details">
          <Link to="/" aria-label={`${hotelInfo.name} home`} className="inline-flex rounded-sm focus-visible:outline-white">
            <Logo tone="light" />
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-7 text-white/65">{hotelInfo.tagline}</p>
          <div className="mt-4 space-y-1 text-sm text-white/75">
            <a className="flex min-h-9 items-center gap-3 transition-colors hover:text-white" href={telHref}><Phone className="size-4 text-primary" aria-hidden="true" />{hotelInfo.phone}</a>
            <a className="flex min-h-9 items-center gap-3 transition-colors hover:text-white" href={`mailto:${hotelInfo.email}`}><span className="grid size-4 place-items-center text-primary" aria-hidden="true">@</span>{hotelInfo.email}</a>
            <p className="flex items-start gap-3 leading-6"><MapPin className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" /><span>{hotelInfo.addressLines.map((line) => <span className="block" key={line}>{line}</span>)}</span></p>
            <p className="flex items-center gap-3"><Clock3 className="size-4 text-primary" aria-hidden="true" />{hotelInfo.receptionHours}</p>
          </div>
          <SocialLinks variant="boxed" className="mt-4" />
        </section>

        <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-4 sm:gap-x-7">
          {footerGroups.map((group) => (
            <section key={group.title}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">{group.title}</h2>
              <ul className="space-y-0">
                {group.links.map((item) => <li key={`${group.title}-${item.label}`}><FooterLink to={item.to}><span className="inline-flex min-h-8 items-center text-sm text-white/75 transition-colors hover:text-white">{item.label}</span></FooterLink></li>)}
              </ul>
            </section>
          ))}
        </div>

        <div className="border-t border-white/15 pt-5 lg:col-span-2 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div><p className="font-semibold tracking-tight text-xl sm:text-2xl">A good stay starts with a warm welcome.</p><p className="mt-2 text-sm text-white/55">We’re here whenever you’re ready.</p></div>
          <Link to="/rooms" className="mt-4 inline-flex min-h-10 items-center justify-center gap-3 bg-primary px-5 text-sm font-semibold text-ink transition-colors hover:bg-primary/85 focus-visible:outline-white lg:mt-0">Book your stay <ArrowRight className="size-4" aria-hidden="true" /></Link>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex min-h-[48px] flex-col justify-center gap-2 py-2 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {hotelInfo.name}. All rights reserved.</p>
          <div className="flex items-center gap-5"><FooterLink to="/policies">Privacy &amp; policies</FooterLink><a href="#main-content" className="inline-flex items-center gap-1 transition-colors hover:text-white">Back to top <ArrowUpRight className="size-3" aria-hidden="true" /></a></div>
        </Container>
      </div>
    </footer>
  );
}
