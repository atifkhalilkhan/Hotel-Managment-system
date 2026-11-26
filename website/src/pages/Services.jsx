import { ArrowRight, AlarmClock, CarFront, ConciergeBell, Phone, SprayCan, Check } from "lucide-react";
import Container from "../components/ui/Container";
import ButtonLink from "../components/ui/ButtonLink";
import { hotelInfo } from "../lib/hotelInfo";
import { portalUrl, PORTAL_LOGIN } from "../lib/portal";

const services = [
  { id: "room-service", index: "01", label: "At your door", title: "Room service", description: "Enjoy meals and refreshments in the comfort of your room. Let us know what you’d like and our team will help arrange it.", Icon: ConciergeBell, note: "Available during your stay" },
  { id: "wake-up-call", index: "02", label: "Start well", title: "Wake-up call", description: "Have somewhere to be? Choose the time you need to wake and our team will make sure you’re up and ready.", Icon: AlarmClock, note: "Choose your preferred time" },
  { id: "transportation", index: "03", label: "Getting around", title: "Transportation", description: "Need a pickup or a ride? Contact reception and we’ll help arrange transportation for your visit.", Icon: CarFront, note: "Arranged with reception" },
  { id: "housekeeping", index: "04", label: "A fresh space", title: "Housekeeping", description: "Freshen up your room with housekeeping support. Our team can help with cleaning and fresh linen during your stay.", Icon: SprayCan, note: "Here to help you settle in" },
];

export default function Services() {
  const telHref = `tel:${hotelInfo.phone.replace(/[^\d+]/g, "")}`;
  return (
    <>
      <section
        className="relative isolate overflow-hidden bg-cover bg-center text-white"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=2000&q=85')", backgroundPosition: "center 54%" }}
      >
        <div className="absolute inset-0 -z-10 bg-black/55" aria-hidden="true" />
        <Container className="grid min-h-[380px] items-center gap-8 py-14 sm:min-h-[420px] lg:min-h-[460px] lg:grid-cols-[1fr_0.58fr] lg:gap-16">
          <div>
            <p className="type-eyebrow inline-flex items-center gap-3 text-white/85"><span className="h-px w-8 bg-primary" /> Thoughtful touches</p>
            <h1 className="type-display mt-5 max-w-3xl text-white">A little help.<br />A lot more <span className="text-primary">comfort.</span></h1>
            <p className="type-body mt-5 max-w-xl text-white/90">From the first coffee to the ride across town, our team is here to make your stay feel easier.</p>
          </div>
          <div className="border-l-2 border-primary bg-black/35 p-5 sm:p-6 lg:justify-self-end">
            <p className="type-eyebrow text-white/65">Here when you need us</p>
            <p className="mt-3 font-semibold tracking-tight text-2xl text-white">A helpful hand is always close by.</p>
            <div className="mt-5 flex items-center gap-3 border-t border-white/25 pt-4 text-sm text-white/90"><Phone className="size-4 text-primary" />{hotelInfo.phone}</div>
            <a href="#our-services" className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-primary">Explore our services <ArrowRight className="size-4" /></a>
          </div>
        </Container>
      </section>

      <section id="our-services" className="bg-white py-14 sm:py-16 lg:py-20">
        <Container>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div><p className="type-eyebrow text-accent">Made for a smoother stay</p><h2 className="type-h2 mt-3 max-w-2xl">The things you need,<br className="hidden sm:block" /> taken care of.</h2></div>
            <p className="type-body max-w-md text-muted">A few considered ways our team can help while you’re with us. Just ask reception if you need something else.</p>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-2">
            {services.map(({ id, index, label, title, description, Icon, note }) => <article id={id} key={id} className="group scroll-mt-24 border border-line bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_12px_30px_rgba(17,17,17,0.07)] sm:p-8">
              <div className="flex items-start justify-between gap-4"><span className="grid size-12 place-items-center bg-primary-soft text-primary-dark transition-colors group-hover:bg-primary group-hover:text-ink"><Icon className="size-5" /></span><span className="text-xs font-semibold tracking-[0.15em] text-muted">{index}</span></div>
              <p className="type-eyebrow mt-7 text-accent">{label}</p><h3 className="type-h3 mt-2">{title}</h3><p className="mt-3 max-w-lg text-sm leading-6 text-muted">{description}</p>
              <div className="mt-6 flex items-center gap-2 border-t border-line pt-4 text-xs font-medium text-muted"><Check className="size-4 text-primary-dark" />{note}</div>
            </article>)}
          </div>
        </Container>
      </section>

      <section className="bg-soft py-12 sm:py-14">
        <Container className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div><p className="type-eyebrow text-accent">Simple as that</p><h2 className="type-h2 mt-3">How to request a service</h2><p className="type-body mt-4 text-muted">Already checked in? Send your request through the guest portal and keep track of it there.</p></div>
          <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
            {[{ n: "01", title: "Sign in", text: "Open your guest account." }, { n: "02", title: "Choose", text: "Select a service and share the details." }, { n: "03", title: "Track", text: "Follow your request from your stay page." }].map((step) => <div className="bg-white p-5 sm:p-6" key={step.n}><span className="font-semibold tracking-tight text-xl text-primary-dark">{step.n}</span><h3 className="mt-3 text-sm font-semibold">{step.title}</h3><p className="mt-1 text-xs leading-5 text-muted">{step.text}</p></div>)}
          </div>
          <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between lg:col-span-2"><p className="text-sm text-muted">Service requests can be placed during an active, checked-in stay. Need help before arrival? Call reception.</p><div className="flex flex-wrap gap-3"><a href={telHref} className="inline-flex min-h-11 items-center justify-center gap-2 border border-line bg-white px-4 text-sm font-semibold transition-colors hover:border-ink"><Phone className="size-4" />Call reception</a><ButtonLink to={portalUrl(PORTAL_LOGIN)} className="inline-flex min-h-11 items-center gap-2">Open guest portal <ArrowRight className="size-4" /></ButtonLink></div></div>
        </Container>
      </section>
    </>
  );
}
