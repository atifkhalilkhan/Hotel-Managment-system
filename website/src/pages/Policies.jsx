import { ArrowRight, CalendarDays, Clock3, ConciergeBell, CreditCard, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import Container from "../components/ui/Container";
import { hotelInfo } from "../lib/hotelInfo";

const policies = [
  {
    id: "reservations",
    number: "01",
    title: "Reservations",
    Icon: CalendarDays,
    intro: "Your booking confirmation is the best source for the details of your stay.",
    details: ["Please check the room type, dates, guest count and rate shown in your confirmation.", "Special requests can be shared with our team and are confirmed subject to availability."],
  },
  {
    id: "arrival",
    number: "02",
    title: "Arrival and departure",
    Icon: Clock3,
    intro: `Check-in begins at ${hotelInfo.checkInTime}; check-out is by ${hotelInfo.checkOutTime}.`,
    details: ["If you need an earlier arrival or a later departure, contact reception ahead of time. Requests depend on room availability.", "Reception is open 24 hours if you need help during your stay."],
  },
  {
    id: "changes",
    number: "03",
    title: "Changes and cancellations",
    Icon: ShieldCheck,
    intro: "Cancellation and change terms depend on the rate and booking channel you selected.",
    details: ["Review the terms shown before confirming your reservation and in your booking confirmation.", "For help changing your plans, contact the hotel or the booking provider as soon as possible."],
  },
  {
    id: "payment",
    number: "04",
    title: "Rates and payment",
    Icon: CreditCard,
    intro: "Your confirmation shows the rate and payment information that applies to your reservation.",
    details: ["Check your booking details for the amount due and any payment instructions.", "Please contact reservations if anything in your confirmation is unclear."],
  },
  {
    id: "services",
    number: "05",
    title: "Guest services",
    Icon: ConciergeBell,
    intro: "Our team can help arrange the everyday details that make a stay more comfortable.",
    details: ["Room service, housekeeping, wake-up calls and transportation are available on request.", "Service timing and availability can vary; reception can advise and take your request."],
  },
  {
    id: "guests",
    number: "06",
    title: "Guest details",
    Icon: Users,
    intro: "Please make sure your reservation reflects the people staying in the room.",
    details: ["Room capacity and included amenities are listed with each room.", "If you need help choosing a room or have a specific request, contact our team before arrival."],
  },
];

export default function Policies() {
  return (
    <>
      <section className="bg-ink text-white">
        <Container className="grid min-h-[280px] items-center gap-7 py-12 sm:min-h-[320px] sm:py-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div><p className="type-eyebrow text-primary">A helpful guide</p><h1 className="type-display mt-4 max-w-3xl text-white">The details that make your stay easier.</h1></div>
          <p className="type-body max-w-xl text-white/75">A quick guide to arrival, reservations and the services we offer. Your booking confirmation includes the specific terms for your reservation.</p>
        </Container>
      </section>

      <section className="bg-soft py-7 sm:py-9" aria-label="Key hotel information">
        <Container className="grid grid-cols-1 border border-line bg-white sm:grid-cols-3">
          {[{ label: "Check-in", value: hotelInfo.checkInTime, Icon: CalendarDays }, { label: "Check-out", value: hotelInfo.checkOutTime, Icon: Clock3 }, { label: "Reception", value: "Open 24 hours", Icon: ConciergeBell }].map(({ label, value, Icon }, index) => <div key={label} className={`flex items-center gap-4 p-4 sm:p-5 ${index ? "border-t border-line sm:border-l sm:border-t-0" : ""}`}><span className="grid size-10 shrink-0 place-items-center bg-primary-soft text-primary-dark"><Icon className="size-5" /></span><div><p className="text-xs text-muted">{label}</p><p className="mt-1 text-sm font-semibold text-ink">{value}</p></div></div>)}
        </Container>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <Container className="grid gap-9 lg:grid-cols-[230px_1fr] lg:gap-14">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="type-eyebrow text-accent">At a glance</p>
            <nav aria-label="Policy sections" className="mt-3 flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
              {policies.map((policy) => <a key={policy.id} href={`#${policy.id}`} className="inline-flex min-h-9 shrink-0 items-center border border-line px-3 text-xs font-medium text-muted transition-colors hover:border-ink hover:text-ink lg:flex lg:border-0 lg:px-0">{policy.title}</a>)}
            </nav>
            <div className="mt-6 hidden border-l-2 border-primary bg-soft p-4 lg:block"><p className="text-sm font-semibold">Need a hand?</p><p className="mt-2 text-xs leading-5 text-muted">Our reception team is available around the clock.</p><Link to="/contact" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-accent">Contact the hotel <ArrowRight className="size-3.5" /></Link></div>
          </aside>

          <div className="space-y-4">
            {policies.map(({ id, number, title, Icon, intro, details }) => <article id={id} key={id} className="scroll-mt-28 border border-line bg-white p-5 sm:p-7">
              <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center bg-primary-soft text-primary-dark"><Icon className="size-5" /></span><div className="min-w-0"><p className="type-eyebrow text-accent">{number} / Guest information</p><h2 className="type-h3 mt-2">{title}</h2><p className="mt-3 text-sm leading-6 text-muted">{intro}</p></div></div>
              <ul className="ml-[3.75rem] mt-4 space-y-2 border-t border-line pt-4 text-sm leading-6 text-ink">{details.map((detail) => <li key={detail} className="relative pl-4 before:absolute before:left-0 before:top-[.65rem] before:size-1.5 before:bg-primary">{detail}</li>)}</ul>
            </article>)}
            <div className="flex flex-col justify-between gap-4 bg-ink p-5 text-white sm:flex-row sm:items-center sm:p-6"><div><p className="type-eyebrow text-primary">We’re here to help</p><p className="mt-2 font-serif text-xl">Have a question about your stay?</p></div><Link to="/contact" className="inline-flex min-h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-ink transition-colors hover:bg-primary-dark">Contact us <ArrowRight className="size-4" /></Link></div>
          </div>
        </Container>
      </section>
    </>
  );
}
