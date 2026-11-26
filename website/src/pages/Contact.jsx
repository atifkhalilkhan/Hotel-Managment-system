import { useState } from "react";
import { ArrowRight, Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Section from "../components/ui/Section";
import Container from "../components/ui/Container";
import SocialLinks from "../components/ui/SocialLinks";
import { hotelInfo } from "../lib/hotelInfo";

const fieldClass = "mt-2 min-h-12 w-full rounded-sm border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

export default function Contact() {
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);
  const telHref = `tel:${hotelInfo.phone.replace(/[^\d+]/g, "")}`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setSending(true);
    setStatus(null);
    const formData = new FormData(form);
    const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
    if (!accessKey) {
      setStatus({ success: false, message: "Contact form setup is almost ready. Add the Web3Forms access key to the website environment." });
      setSending(false);
      return;
    }
    formData.append("access_key", accessKey);
    formData.append("subject", `${hotelInfo.name} website enquiry: ${formData.get("topic")}`);
    formData.append("from_name", `${hotelInfo.name} website`);
    try {
      const response = await fetch("https://api.web3forms.com/submit", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "We couldn’t send your enquiry. Please try again.");
      setStatus({ success: true, message: "Thanks for getting in touch. Your enquiry has been sent to our team." });
      form.reset();
    } catch (error) {
      setStatus({ success: false, message: error.message || "Something went wrong. Please try again or contact reception directly." });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <section
        className="relative isolate overflow-hidden bg-cover bg-center text-white"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=85')" }}
        aria-label="Contact LuxuryStay"
      >
        <div className="absolute inset-0 -z-10 bg-black/60" aria-hidden="true" />
        <Container className="grid min-h-[350px] items-center gap-7 py-12 sm:min-h-[390px] sm:py-14 lg:min-h-[420px] lg:grid-cols-[1fr_0.72fr] lg:gap-16">
          <div>
            <p className="type-eyebrow text-white/80">We’re here for you</p>
            <h1 className="type-display mt-4 max-w-3xl text-white">Let’s make your stay <span className="text-primary">special.</span></h1>
            <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/40 pt-5 text-sm text-white">
              <span className="inline-flex items-center gap-2"><Clock3 className="size-4 text-primary" />{hotelInfo.receptionHours}</span>
              <span className="inline-flex items-center gap-2"><MapPin className="size-4 text-primary" />{hotelInfo.shortAddress}</span>
            </div>
          </div>
          <div className="border border-white/20 bg-black/25 p-5 sm:p-6 lg:justify-self-end lg:text-right">
            <p className="type-body max-w-lg text-white sm:ml-auto">A question about your booking, a special request, or just planning ahead? Our team is happy to help.</p>
            <a href="#contact-form-title" className="mt-6 inline-flex min-h-12 items-center justify-center gap-3 border border-white/80 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:bg-white/90 focus-visible:outline-white">
              Send an enquiry <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </Container>
      </section>

      <Section spacing="py-12 sm:py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <aside>
            <p className="type-eyebrow text-accent">Contact the hotel</p>
            <h2 className="type-h2 mt-3">A real person is ready to help.</h2>
            <p className="type-body mt-4 text-muted">Reach out in the way that works best for you. For anything time-sensitive, give reception a call.</p>

            <div className="mt-8 divide-y divide-line border-y border-line">
              <a href={telHref} className="group flex items-start gap-4 py-5 transition-colors hover:text-primary-dark">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-dark"><Phone className="size-5" /></span>
                <span><span className="block text-xs font-medium uppercase tracking-wider text-muted">Call reception</span><span className="mt-1 block text-base font-semibold">{hotelInfo.phone}</span><span className="mt-1 block text-sm text-muted">Available around the clock</span></span>
              </a>
              <a href={`mailto:${hotelInfo.email}`} className="group flex items-start gap-4 py-5 transition-colors hover:text-primary-dark">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-dark"><Mail className="size-5" /></span>
                <span><span className="block text-xs font-medium uppercase tracking-wider text-muted">Email our team</span><span className="mt-1 block break-all text-base font-semibold">{hotelInfo.email}</span><span className="mt-1 block text-sm text-muted">We’ll get back to you as soon as we can</span></span>
              </a>
              <div className="flex items-start gap-4 py-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-dark"><MapPin className="size-5" /></span>
                <span><span className="block text-xs font-medium uppercase tracking-wider text-muted">Find us</span><span className="mt-1 block text-base font-semibold">{hotelInfo.addressLines[0]}</span><span className="mt-1 block text-sm text-muted">{hotelInfo.addressLines[1]}</span></span>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between gap-4"><p className="text-sm text-muted">Follow along</p><SocialLinks variant="outline" /></div>
          </aside>

          <section id="contact-form" className="border border-line bg-soft p-5 sm:p-8 lg:p-10" aria-labelledby="contact-form-title">
            <div className="mb-7 flex items-start justify-between gap-5">
              <div><p className="type-eyebrow text-accent">Send us a note</p><h2 id="contact-form-title" className="type-h3 mt-3">How can we help?</h2></div>
              <span className="hidden size-11 shrink-0 place-items-center rounded-full bg-white text-primary-dark sm:grid"><MessageCircle className="size-5" /></span>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} aria-hidden="true" />
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium" htmlFor="contact-name">Your name<input className={fieldClass} id="contact-name" name="name" autoComplete="name" placeholder="How should we address you?" required /></label>
                <label className="block text-sm font-medium" htmlFor="contact-email">Email address<input className={fieldClass} id="contact-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
              </div>
              <label className="block text-sm font-medium" htmlFor="contact-topic">What can we help with?
                <select className={fieldClass} id="contact-topic" name="topic" defaultValue="Booking enquiry">
                  <option>Booking enquiry</option><option>Special request</option><option>Room or service question</option><option>Other</option>
                </select>
              </label>
              <label className="block text-sm font-medium" htmlFor="contact-message">Your message<textarea className={`${fieldClass} min-h-36 resize-y`} id="contact-message" name="message" placeholder="Tell us a little about what you need…" required /></label>
              <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between"><button type="submit" disabled={sending} className="inline-flex min-h-12 items-center justify-center gap-3 bg-primary px-6 text-sm font-semibold text-ink transition-colors hover:bg-primary/85 focus-visible:outline-primary-dark disabled:cursor-wait disabled:opacity-60">{sending ? "Sending…" : "Send your enquiry"} {!sending && <ArrowRight className="size-4" />}</button><p className="text-xs leading-5 text-muted">Your enquiry is delivered securely to the hotel team.</p></div>
              {status && <p className={`text-sm font-medium ${status.success ? "text-green-700" : "text-red-700"}`} role="status">{status.message}</p>}
            </form>
          </section>
        </div>
      </Section>

      <section className="border-t border-line bg-soft" aria-label="Hotel location">
        <Container className="grid gap-7 py-12 sm:py-14 md:grid-cols-[1fr_auto] md:items-center">
          <div><p className="type-eyebrow text-accent">Come on in</p><h2 className="type-h3 mt-3">We look forward to welcoming you.</h2><p className="mt-2 text-sm leading-6 text-muted">{hotelInfo.addressLines.join(", ")} · {hotelInfo.receptionHours}</p></div>
          <a href={`https://maps.google.com/?q=${encodeURIComponent(hotelInfo.addressLines.join(", "))}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 border border-line bg-white px-5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary-dark">Get directions <ArrowRight className="size-4" /></a>
        </Container>
      </section>
    </>
  );
}
