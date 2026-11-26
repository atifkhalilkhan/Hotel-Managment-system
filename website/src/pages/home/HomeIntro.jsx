import { Link } from "react-router-dom";
import { ArrowRight, BedDouble, Clock3, DoorOpen, LogOut } from "lucide-react";
import Container from "../../components/ui/Container";
import Reveal from "../../components/ui/Reveal";
import { hotelInfo } from "../../lib/hotelInfo";

// Asli kaam ki maloomat: guest ko booking se pehle yahi chahiye hota hai
const FACTS = [
  { label: "Check-in", value: hotelInfo.checkInTime, note: "Earlier arrival on request", Icon: DoorOpen },
  { label: "Check-out", value: hotelInfo.checkOutTime, note: "Later departure, if rooms allow", Icon: LogOut },
  { label: "Reception", value: "24 hours", note: "Every day of the year", Icon: Clock3 },
  { label: "Room types", value: "4", note: "Single, double, deluxe, suite", Icon: BedDouble },
];

export default function HomeIntro() {
  return (
    <section className="bg-white pt-16 pb-14 sm:pt-20 lg:pt-24 lg:pb-20">
      <Container>
        <Reveal className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16">
          <div>
            <p className="type-eyebrow text-accent">Welcome to {hotelInfo.name}</p>
            <h2 className="type-h2 mt-3 max-w-xl">Feel looked after, from the moment you arrive.</h2>
          </div>
          <div className="max-w-md">
            <p className="type-body text-muted">
              A helpful team, rooms for every kind of trip and everyday services arranged around your stay. Tell
              us what you need and we will take care of the rest.
            </p>
            <Link
              to="/about"
              className="mt-5 inline-flex min-h-10 items-center gap-2 border-b border-ink pb-1 text-sm font-semibold transition-colors hover:border-primary hover:text-accent"
            >
              About the hotel <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>

        <dl className="mt-12 grid grid-cols-2 border-y border-line lg:grid-cols-4">
          {FACTS.map(({ label, value, note, Icon }, index) => (
            <Reveal
              key={label}
              delay={index * 70}
              className={`py-5 pr-4 sm:py-6 ${index % 2 ? "border-l border-line pl-4 sm:pl-6" : ""} ${
                index > 1 ? "border-t border-line lg:border-t-0" : ""
              } ${index === 2 ? "lg:border-l lg:pl-6" : ""}`}
            >
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                <Icon className="size-4 text-accent" aria-hidden="true" />
                {label}
              </dt>
              <dd className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{value}</dd>
              <dd className="mt-1 text-xs leading-5 text-muted">{note}</dd>
            </Reveal>
          ))}
        </dl>
      </Container>
    </section>
  );
}
