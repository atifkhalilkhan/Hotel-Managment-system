import { useEffect, useId, useState } from "react";
import { ArrowRight, Bell, CalendarDays, ConciergeBell, ReceiptText } from "lucide-react";
import Container from "../../components/ui/Container";
import Reveal from "../../components/ui/Reveal";
import ButtonLink from "../../components/ui/ButtonLink";
import GuestAppShowcase from "../../components/GuestAppShowcase";
import { hotelInfo } from "../../lib/hotelInfo";
import { guestLoginUrl, guestRegisterUrl } from "../../lib/portal";

const FEATURES = [
  {
    id: "bookings",
    title: "Your bookings",
    text: "Dates, room number and check-in time for every stay, always up to date.",
    Icon: CalendarDays,
  },
  {
    id: "services",
    title: "Request a service",
    text: "Ask for room service, housekeeping, a wake-up call or a ride, and follow its status.",
    Icon: ConciergeBell,
  },
  {
    id: "invoices",
    title: "Invoices and payments",
    text: "A clear breakdown of every charge. Pay online and download a PDF copy.",
    Icon: ReceiptText,
  },
  {
    id: "updates",
    title: "Live updates",
    text: "Know the moment your room is ready or a request has been completed.",
    Icon: Bell,
  },
];
const STEPS = ["Open the guest app in your phone's browser", "Tap Share, then Add to Home Screen", "Sign in and your stay is there"];
const CYCLE = 6000;

export default function HomeGuestApp() {
  const id = useId();
  const [active, setActive] = useState(0);
  // User ne khud tab chuna ya hover kiya to auto-play ruk jata hai
  const [autoplay, setAutoplay] = useState(true);
  const [hovering, setHovering] = useState(false);
  const running = autoplay && !hovering;

  useEffect(() => {
    if (!running || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setTimeout(() => setActive((index) => (index + 1) % FEATURES.length), CYCLE);
    return () => window.clearTimeout(timer);
  }, [active, running]);

  const select = (index) => {
    setActive(index);
    setAutoplay(false);
  };

  // Arrow keys se tabs badlein (WAI-ARIA tabs pattern)
  const onKeyDown = (event) => {
    const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const next = (active + keys[event.key] + FEATURES.length) % FEATURES.length;
    select(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };

  return (
    <section className="overflow-hidden bg-soft py-16 sm:py-20 lg:py-24" aria-labelledby="guest-app-title">
      <Container>
        <Reveal className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="type-eyebrow text-accent">The {hotelInfo.name} guest app</p>
            <h2 id="guest-app-title" className="type-h2 mt-3 max-w-xl">Your whole stay, in your pocket.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted">
            Works in any phone browser, on iPhone and Android. No app store, no download, nothing to update.
          </p>
        </Reveal>

        <div
          className="mt-12 grid items-center gap-12 lg:grid-cols-[1fr_auto] lg:gap-20"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <div>
            <div role="tablist" aria-label="Guest app features" aria-orientation="vertical" onKeyDown={onKeyDown} className="border-t border-line">
              {FEATURES.map(({ id: featureId, title, text, Icon }, index) => {
                const selected = index === active;
                return (
                  <button
                    key={featureId}
                    id={`${id}-tab-${index}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`${id}-panel`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => select(index)}
                    className={`group relative block w-full border-b border-line py-5 text-left transition-colors ${selected ? "" : "hover:bg-white/60"}`}
                  >
                    <span className="flex items-center gap-4">
                      <span
                        className={`grid size-10 shrink-0 place-items-center rounded-md transition-colors ${
                          selected ? "bg-primary text-ink" : "bg-white text-muted group-hover:text-ink"
                        }`}
                      >
                        <Icon className="size-[18px]" aria-hidden="true" />
                      </span>
                      <span className={`text-base font-semibold sm:text-lg ${selected ? "text-ink" : "text-ink/60 group-hover:text-ink"}`}>
                        {title}
                      </span>
                      <span className="ml-auto text-xs font-semibold tabular-nums text-muted">0{index + 1}</span>
                    </span>
                    <span
                      className={`grid transition-[grid-template-rows] duration-300 ${selected ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                    >
                      <span className="overflow-hidden">
                        <span className="block max-w-md pt-2 pl-14 text-sm leading-6 text-muted">{text}</span>
                      </span>
                    </span>
                    {/* Agla feature kab aayega: patli progress line */}
                    {selected && (
                      <span className="absolute inset-x-0 -bottom-px h-0.5 bg-line" aria-hidden="true">
                        <span
                          key={`${active}-${running}`}
                          className={`block h-full origin-left bg-primary ${running ? "app-progress" : ""}`}
                          style={{ "--app-cycle": `${CYCLE}ms` }}
                        />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <ButtonLink to={guestRegisterUrl()} size="lg">
                Open the guest app
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
              <a href={guestLoginUrl()} className="text-sm font-semibold text-muted transition-colors hover:text-ink">
                Already have an account? <span className="text-ink underline underline-offset-4">Log in</span>
              </a>
            </div>
          </div>

          <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${active}`} className="relative">
            <GuestAppShowcase screen={FEATURES[active].id} />
          </div>
        </div>

        <ol className="mt-14 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step} className="flex items-center gap-4 bg-white px-5 py-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-ink text-xs font-semibold tabular-nums">
                {index + 1}
              </span>
              <span className="text-sm">{step}</span>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
