import { useEffect, useState } from "react";
import { ArrowRight, Phone } from "lucide-react";
import Container from "../../components/ui/Container";
import ButtonLink from "../../components/ui/ButtonLink";
import { hotelInfo } from "../../lib/hotelInfo";

// Hero ki tasveeren public/hero mein: har ek 2400px (desktop/retina) aur 1280px (mobile) mein.
// Nayi tasveer kam az kam 2400×1350 landscape honi chahiye, warna bari screen par dhundli lagegi.
const SLIDES = [
  { name: "hero-1", label: "The hotel at dusk", alt: "The hotel entrance and pool lit up in the evening", position: "center" },
  { name: "hero-2", label: "Deluxe room", alt: "A warm, elegant hotel bedroom with a sofa", position: "65% center" },
  { name: "hero-3", label: "Suite", alt: "A spacious suite with a living area and large windows", position: "60% center" },
  { name: "hero-4", label: "Pool and terrace", alt: "The pool and terrace dining area at night", position: "center" },
];
const INTERVAL = 6000;
const pad = (value) => String(value).padStart(2, "0");
const srcFor = (name, width) => `/hero/${name}-${width}.jpg`;

export default function HomeHero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const telHref = `tel:${hotelInfo.phone.replace(/[^\d+]/g, "")}`;
  const goTo = (index) => setActive(index);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setTimeout(() => setActive((active + 1) % SLIDES.length), INTERVAL);
    return () => window.clearTimeout(timer);
  }, [active, paused]);

  return (
    <section
      aria-label="Welcome"
      className="relative isolate overflow-hidden bg-night text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        {/* Pehli tasveer pehle (high priority), baqi peeche (low) taake slide badalte waqt tayyar hon */}
        {SLIDES.map((slide, index) => (
          <img
            key={slide.name}
            src={srcFor(slide.name, 2400)}
            srcSet={`${srcFor(slide.name, 1280)} 1280w, ${srcFor(slide.name, 2400)} 2400w`}
            sizes="100vw"
            width="2400"
            height="1350"
            alt=""
            fetchPriority={index === 0 ? "high" : "low"}
            decoding="async"
            className={`home-hero-slide${active === index ? " is-active" : ""}`}
            style={{ objectPosition: slide.position }}
          />
        ))}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <Container className="flex min-h-[600px] flex-col justify-center pt-16 pb-32 sm:min-h-[640px] lg:h-[calc(100svh-7rem)] lg:max-h-[780px] lg:pb-36">
        <div className="home-hero-copy max-w-3xl">
          <p className="type-eyebrow flex items-center gap-3 text-white">
            <span className="h-px w-8 bg-primary" aria-hidden="true" />
            {hotelInfo.name} Hotel · {hotelInfo.shortAddress}
          </p>
          <h1 className="type-display mt-5 text-white">
            A stay that feels easy from the <span className="text-primary">start.</span>
          </h1>
          <p className="type-body mt-5 max-w-lg text-white">
            Comfortable rooms, thoughtful service and a team at the front desk around the clock, so you can settle
            in and make the most of your time away.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/rooms" size="lg">
              Explore rooms
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink to={telHref} variant="inverse" size="lg">
              <Phone className="size-4" aria-hidden="true" />
              Call reception
            </ButtonLink>
          </div>
        </div>
      </Container>

      {/* Slide ka naam aur controls: booking bar ke upar wali patti */}
      <div className="absolute inset-x-0 bottom-20 sm:bottom-[4.5rem]">
        <Container>
          <div className="flex items-center justify-between gap-4 border-t border-white/30 pt-3 text-xs text-white/90">
          <p aria-live="polite" className="tabular-nums">
            <span className="font-semibold text-white">{pad(active + 1)}</span> / {pad(SLIDES.length)}
            <span className="mx-2 text-white/40">—</span>
            {SLIDES[active].label}
          </p>
          <div className="home-hero-pagination" role="group" aria-label="Choose hero image">
            {SLIDES.map((slide, index) => (
              <button
                key={slide.name}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Show image ${index + 1}: ${slide.alt}`}
                aria-pressed={active === index}
                className={active === index ? "is-active" : ""}
              />
            ))}
          </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
