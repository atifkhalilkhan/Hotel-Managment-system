import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Container from "../../components/ui/Container";
import Reveal from "../../components/ui/Reveal";
import { mainNav } from "../../lib/navigation";

// Services wahi jo navigation mein hain, taake ek hi jagah se badlein
const SERVICES = mainNav.find((item) => item.label === "Services")?.children ?? [];

export default function HomeServices() {
  return (
    <section className="bg-white pb-16 sm:pb-20 lg:pb-24" aria-labelledby="home-services-title">
      <Container>
        <div className="flex flex-col justify-between gap-5 border-t border-line pt-16 sm:pt-20 md:flex-row md:items-end">
          <div>
            <p className="type-eyebrow text-accent">Guest services</p>
            <h2 id="home-services-title" className="type-h2 mt-3">Consider it taken care of.</h2>
          </div>
          <Link
            to="/services"
            className="inline-flex min-h-10 items-center gap-2 border-b border-ink pb-1 text-sm font-semibold transition-colors hover:border-primary hover:text-accent"
          >
            All services <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <ul className="mt-10 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
          {SERVICES.map(({ label, description, to, icon: Icon }, index) => (
            <Reveal as="li" key={label} delay={index * 70} className="bg-white">
              <Link to={to} className="group flex h-full flex-col p-6 transition-colors hover:bg-soft">
                <span className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-md bg-primary-soft text-primary-dark transition-colors group-hover:bg-primary group-hover:text-ink">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-muted">0{index + 1}</span>
                </span>
                <h3 className="mt-6 text-base font-semibold">{label}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted">{description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-accent">
                  How it works
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
