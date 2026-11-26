import { ArrowRight, BedDouble, Clock3, ConciergeBell, HeartHandshake, Sparkles } from "lucide-react";
import Container from "../components/ui/Container";
import Section from "../components/ui/Section";
import ButtonLink from "../components/ui/ButtonLink";
import { hotelInfo } from "../lib/hotelInfo";
import { guestRegisterUrl } from "../lib/portal";

const guestCare = [
  { Icon: BedDouble, title: "Room to feel at home", text: "Choose a single, double, deluxe room or suite to suit the way you travel." },
  { Icon: ConciergeBell, title: "Help when you need it", text: "Room service, housekeeping, wake-up calls and transportation can be arranged on request." },
  { Icon: Clock3, title: "Here around the clock", text: "Reception is open 24 hours, so a member of the team is here whenever you need a hand." },
];

export default function About() {
  return (
    <>
      <section
        className="relative isolate overflow-hidden bg-cover bg-center text-white"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=2000&q=85')", backgroundPosition: "center 55%" }}
      >
        <div className="absolute inset-0 -z-10 bg-black/55" aria-hidden="true" />
        <Container className="grid min-h-[410px] items-center gap-8 py-14 sm:min-h-[460px] sm:py-16 lg:min-h-[500px] lg:grid-cols-[1fr_0.62fr] lg:gap-16">
          <div className="max-w-3xl">
            <p className="type-eyebrow inline-flex items-center gap-3 text-white/85"><span className="h-px w-8 bg-primary" /> Welcome to {hotelInfo.name}</p>
            <h1 className="type-display mt-5 max-w-3xl text-white">Stay well.<br /><span className="text-primary">Feel at home.</span></h1>
            <p className="type-body mt-5 max-w-xl text-white/90">A comfortable room, a helpful team and the little details that make settling in easier.</p>
            <div className="mt-7 flex flex-wrap gap-3"><ButtonLink to={guestRegisterUrl()} className="inline-flex min-h-12 items-center gap-3">Find your room <ArrowRight className="size-4" /></ButtonLink><ButtonLink to="/rooms" variant="outline" className="inline-flex min-h-12 items-center gap-2 border-white/60 bg-white/10 text-white hover:bg-white/20">Explore rooms</ButtonLink></div>
          </div>
          <div className="border-l-2 border-primary bg-black/35 p-5 backdrop-blur-[2px] sm:p-6 lg:justify-self-end">
            <p className="type-eyebrow text-white/65">The comfort of knowing</p>
            <p className="mt-3 font-serif text-2xl text-white">We’re here, whenever you need us.</p>
            <div className="mt-5 flex items-center gap-3 border-t border-white/25 pt-4 text-sm text-white/90"><Clock3 className="size-4 shrink-0 text-primary" />{hotelInfo.receptionHours}</div>
            <div className="mt-3 flex items-center gap-3 text-sm text-white/90"><HeartHandshake className="size-4 shrink-0 text-primary" />A warm welcome, from arrival onward</div>
          </div>
        </Container>
      </section>

      <Section spacing="py-14 sm:py-18 lg:py-24">
        <div className="about-enter mx-auto max-w-4xl text-center">
          <p className="type-eyebrow text-accent">The LuxuryStay experience</p>
          <h2 className="type-h2 mt-4">The little details make the difference.</h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-muted">Every trip has its own rhythm. Sometimes it’s a quiet room after a long journey; sometimes it’s having a ride arranged before you arrive. We’re here to make those details easier, with four room styles and everyday services that help you settle in.</p>
        </div>
        <div className="mt-10 grid grid-cols-2 border-y border-line py-6 text-center sm:grid-cols-4 sm:py-7">
          {["Single rooms", "Double rooms", "Deluxe rooms", "Suites"].map((room, index) => <div key={room} className={`px-2 ${index ? "border-l border-line" : ""}`}><span className="block font-serif text-lg text-ink sm:text-xl">0{index + 1}</span><span className="mt-1 block text-xs text-muted sm:text-sm">{room}</span></div>)}
        </div>
      </Section>

      <Section tone="soft" spacing="py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center"><p className="type-eyebrow text-accent">Here for your stay</p><h2 className="type-h2 mt-3">Thoughtful care, from arrival onward.</h2><p className="type-body mt-4 text-muted">A few of the ways our team helps make your time with us comfortable.</p></div>
        <div className="mt-9 grid gap-px border border-line bg-line md:grid-cols-3">
          {guestCare.map(({ Icon, title, text }, index) => <article className="about-enter bg-white p-6 sm:p-7" style={{ animationDelay: `${index * 110}ms` }} key={title}>
            <div className="flex items-center justify-between"><span className="grid size-11 place-items-center bg-primary-soft text-primary-dark"><Icon className="size-5" /></span><span className="text-xs font-medium tracking-widest text-muted">0{index + 1}</span></div>
            <h3 className="type-h3 mt-5">{title}</h3><p className="mt-3 text-sm leading-6 text-muted">{text}</p>
          </article>)}
        </div>
      </Section>

      <section className="bg-soft py-10 text-ink sm:py-12">
        <Container className="flex flex-col gap-6 border border-line bg-white px-5 py-6 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center bg-primary-soft text-primary-dark"><Sparkles className="size-5" /></span><div><p className="type-eyebrow text-accent">Your next stay</p><h2 className="mt-2 font-serif text-2xl sm:text-3xl">We’d be glad to welcome you.</h2><p className="mt-2 text-sm text-muted">Explore the rooms and find the right fit for your visit.</p></div></div>
          <div className="flex flex-wrap gap-3"><ButtonLink to="/rooms" variant="outline" className="border-line text-ink">Explore rooms <ArrowRight className="size-4" /></ButtonLink><ButtonLink to={guestRegisterUrl()} className="inline-flex items-center gap-2">Book your stay <ArrowRight className="size-4" /></ButtonLink></div>
        </Container>
      </section>
    </>
  );
}
