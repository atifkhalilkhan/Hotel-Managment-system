import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Container from "../../components/ui/Container";
import Reveal from "../../components/ui/Reveal";

const photo = "overflow-hidden rounded-md bg-soft";

export default function HomeExperience() {
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <Container className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal className="max-w-lg">
          <p className="type-eyebrow text-accent">Dining and family time</p>
          <h2 className="type-h2 mt-3">Good food, shared tables and room to unwind.</h2>
          <p className="type-body mt-4 text-muted">
            Sit down to a relaxed meal, gather the family in a suite with space to spread out, or ask for dinner
            in your room. However you like to spend the evening, there is a place for it here.
          </p>
          <ul className="mt-6 divide-y divide-line border-y border-line text-sm">
            {["Dining spaces made for sitting down together", "Suites with a separate living area", "Room service brought to your door"].map((item) => (
              <li key={item} className="flex items-center gap-3 py-3">
                <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap items-center gap-5">
            <Link
              to="/gallery"
              className="inline-flex min-h-10 items-center gap-2 border-b border-ink pb-1 text-sm font-semibold transition-colors hover:border-primary hover:text-accent"
            >
              Browse the gallery <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link to="/services#room-service" className="text-sm font-semibold text-muted transition-colors hover:text-accent">
              About room service
            </Link>
          </div>
        </Reveal>

        <Reveal delay={120} className="grid h-[420px] grid-cols-[1.4fr_1fr] grid-rows-2 gap-3 sm:h-[540px] sm:gap-4">
          <div className={`${photo} row-span-2`}>
            <img src="/gallery-optimized/dinning-1.jpg" alt="Dining table set for a family meal" loading="lazy" decoding="async" className="size-full object-cover" />
          </div>
          <div className={photo}>
            <img src="/gallery-optimized/family-3.jpg" alt="Two guests cooking a meal together" loading="lazy" decoding="async" className="size-full object-cover" />
          </div>
          <div className={photo}>
            <img src="/gallery-optimized/dinning-5.jpg" alt="Open living and dining area in a suite" loading="lazy" decoding="async" className="size-full object-cover" />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
