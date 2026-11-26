import { ArrowLeft, Building2, CalendarCheck2, ShieldCheck, Sparkles, Star } from "lucide-react";

// Public website (hotel ka home page). Production mein .env mein VITE_WEBSITE_URL set karein.
const WEBSITE_URL = (import.meta.env.VITE_WEBSITE_URL || "http://localhost:5175").replace(/\/+$/, "") + "/";

export default function AuthLayout({ title, subtitle, children, compact = false }) {
  return (
    <main className="auth-page flex h-dvh min-h-0 justify-center overflow-hidden bg-white px-0 py-0 sm:bg-[#f3f4f6] sm:px-6 sm:py-6">
      <div className="grid h-full min-h-0 w-full max-w-6xl grid-rows-[190px_1fr] overflow-hidden bg-white sm:grid-rows-1 sm:rounded-[2rem] sm:shadow-[0_24px_80px_-30px_rgba(15,23,42,0.28)] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="auth-panel relative isolate flex min-h-[190px] min-w-0 flex-col justify-between overflow-hidden bg-[#17191e] px-6 py-5 text-white sm:min-h-0 sm:justify-between sm:px-9 sm:py-7 lg:px-12 lg:py-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-36 -z-10 h-[28rem] w-[28rem] rounded-full border border-white/10 shadow-[0_0_0_50px_rgba(255,255,255,0.025),0_0_0_100px_rgba(255,255,255,0.02)]" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 -left-24 -z-10 h-80 w-80 rounded-full bg-orange-500/20 blur-[90px]" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-950/30"><Building2 aria-hidden="true" className="h-5 w-5" /></div>
              <div><p className="text-sm font-semibold tracking-wide">LuxuryStay</p><p className="mt-0.5 text-[11px] tracking-[0.16em] text-white/45">GUEST PORTAL</p></div>
            </div>
            <a
              href={WEBSITE_URL}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-3.5 text-xs font-medium text-white/80 transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300"
            >
              <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="max-[380px]:hidden">Back to home</span>
              <span className="hidden max-[380px]:inline">Home</span>
            </a>
          </div>
          <div className="sm:hidden">
            <p className="text-[17px] font-semibold tracking-[-0.02em] text-white">Your stay, made simple.</p>
            <p className="mt-1 text-[11px] text-white/55">Bookings and little details, all in one place.</p>
          </div>
          <div className="flex items-center gap-2.5 sm:hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-orange-300/25 bg-orange-400/10 text-orange-200"><CalendarCheck2 aria-hidden="true" className="h-3.5 w-3.5" /></span>
            <p className="text-[9px] font-medium uppercase tracking-[0.17em] text-white/45">Bookings <span className="px-1 text-orange-300/70">·</span> Stays <span className="px-1 text-orange-300/70">·</span> Support</p>
          </div>

          <div className="auth-story my-5 hidden max-w-lg sm:my-8 sm:block lg:my-auto lg:py-12 [@media(max-height:800px)]:lg:my-4 [@media(max-height:800px)]:lg:py-3">
            <div className="mb-4 hidden w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-white/75 sm:flex"><Sparkles className="h-3.5 w-3.5 text-orange-300" /> A more comfortable stay starts here</div>
            <h2 className="max-w-md text-[1.7rem] font-semibold leading-[1.12] tracking-[-0.04em] sm:text-4xl lg:text-[2.8rem]">A little closer to your <span className="text-orange-300">next getaway.</span></h2>
            <p className="mt-3 hidden max-w-sm text-sm leading-6 text-white/55 sm:block">Your personal space to plan a stay, keep your bookings close, and enjoy every detail.</p>
            <div className="mt-8 hidden space-y-4 lg:block">
              <div className="flex items-center gap-3 text-sm text-white/75"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.07] text-orange-200"><CalendarCheck2 className="h-4 w-4" /></span>Keep every reservation in one place</div>
              <div className="flex items-center gap-3 text-sm text-white/75"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.07] text-orange-200"><ShieldCheck className="h-4 w-4" /></span>Your account, thoughtfully protected</div>
            </div>
          </div>

          <div className="auth-rating hidden items-center justify-between border-t border-white/10 pt-5 sm:flex">
            <div className="flex items-center gap-1 text-amber-300"><Star className="h-3.5 w-3.5 fill-current" /><Star className="h-3.5 w-3.5 fill-current" /><Star className="h-3.5 w-3.5 fill-current" /><Star className="h-3.5 w-3.5 fill-current" /><Star className="h-3.5 w-3.5 fill-current" /></div>
            <p className="text-xs text-white/45">Make yourself at home</p>
          </div>
        </aside>

        <section className={`auth-content flex min-h-0 min-w-0 items-center justify-center overflow-hidden px-5 py-3 sm:px-10 sm:py-6 lg:px-14 ${compact ? "lg:py-5" : "lg:py-8"}`}>
          <div className="w-full max-w-[27rem]">
            <div className="auth-heading mb-3 sm:mb-5 lg:mb-6">
              <h1 className="text-[1.9rem] font-semibold tracking-[-0.04em] text-[#17191e] sm:text-[2.1rem]">{title}</h1>
              {subtitle && <p className="auth-subtitle mt-3 max-w-sm text-sm leading-6 text-[#737782]">{subtitle}</p>}
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
