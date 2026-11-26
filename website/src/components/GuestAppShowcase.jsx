import {
  ArrowRight,
  CalendarDays,
  ConciergeBell,
  CreditCard,
  Phone,
  ReceiptText,
  UserRound,
} from "lucide-react";

const roomPhoto = "/gallery-optimized/suite-5.jpg";

function MobileGuestApp() {
  return (
    <div className="relative z-10 h-[326px] w-[196px] rounded-[30px] bg-[#22231f] p-[4px] shadow-[0_15px_28px_rgba(38,39,33,0.18)] ring-1 ring-black/10 sm:h-[342px] sm:w-[205px]">
      <div className="relative h-full overflow-hidden rounded-[26px] bg-[#fbfaf8] px-3 pt-3 text-ink">
        <div className="absolute left-1/2 top-[6px] z-10 flex h-[15px] w-[54px] -translate-x-1/2 items-center justify-center rounded-full bg-[#171815]"><span className="mr-1 size-1 rounded-full bg-[#424b52]" /><span className="h-1 w-5 rounded-full bg-[#292a29]" /></div>
        <div className="flex items-center justify-between text-[7px] font-semibold"><span>9:41</span><span className="text-[8px]">▮▮ ◧</span></div>
        <div className="mt-3 flex items-center justify-between"><div><p className="text-[6px] uppercase tracking-[.12em] text-muted">Welcome back</p><p className="mt-0.5 text-[10px] font-semibold">Your stay, made easy</p></div><span className="grid size-6 place-items-center rounded-full bg-[#f0eee8] text-muted"><UserRound className="size-3" /></span></div>
        <div className="relative mt-3 h-[105px] overflow-hidden rounded-[7px] bg-[#d8d3c8]"><img src={roomPhoto} alt="LuxuryStay suite preview in the guest app" className="size-full object-cover" /><div className="absolute inset-0 bg-black/15" /><span className="absolute left-2 top-2 bg-white px-1.5 py-1 text-[6px] font-semibold text-[#38734f]">CONFIRMED</span><span className="absolute inset-x-0 bottom-0 bg-black/45 px-2 py-1.5 text-[7px] font-medium text-white">OCT 18 – OCT 22 <span className="px-1">·</span> 4 NIGHTS</span></div>
        <div className="mt-2 flex items-center justify-between"><span className="text-[9px] font-semibold">Deluxe ocean suite</span><ArrowRight className="size-3 text-muted" /></div>
        <div className="mt-2 rounded-[6px] border border-line bg-white p-2"><p className="text-[6px] uppercase tracking-[.1em] text-muted">Check-in</p><p className="mt-1 text-[8px] font-semibold">Saturday <span className="font-normal text-muted">· 3:00 PM</span></p></div>
        <div className="mt-2 grid grid-cols-2 gap-1.5"><div className="flex items-center gap-1.5 border border-line bg-white p-1.5 text-[7px] font-medium"><ConciergeBell className="size-3 text-accent" />Request service</div><div className="flex items-center gap-1.5 border border-line bg-white p-1.5 text-[7px] font-medium"><Phone className="size-3 text-accent" />Call reception</div></div>
        <div className="absolute inset-x-0 bottom-0 flex h-8 items-center justify-around border-t border-line bg-white text-muted"><span className="flex flex-col items-center gap-0.5 text-accent"><CalendarDays className="size-3" /><i className="h-[2px] w-3 bg-primary" /></span><ReceiptText className="size-3" /><ConciergeBell className="size-3" /><UserRound className="size-3" /></div>
        <div className="absolute bottom-1 left-1/2 h-[3px] w-10 -translate-x-1/2 rounded-full bg-ink/75" />
      </div>
    </div>
  );
}

export default function GuestAppShowcase() {
  return (
    <div className="relative mx-auto mt-5 grid min-h-[340px] w-full max-w-[500px] place-items-center md:grid-cols-[minmax(0,1fr)_205px] md:gap-4 lg:mt-0 lg:gap-6">
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 hidden size-full md:block" fill="none" viewBox="0 0 500 340" preserveAspectRatio="none">
        <path d="M260 84h32v80h34m-66 70h34v-28h32" stroke="#c2410c" strokeOpacity=".3" strokeWidth="1" />
        <circle cx="292" cy="84" r="3" fill="#c2410c" fillOpacity=".45" /><circle cx="326" cy="164" r="3" fill="#c2410c" fillOpacity=".45" /><circle cx="326" cy="226" r="3" fill="#c2410c" fillOpacity=".45" />
      </svg>
      <div className="relative z-10 hidden w-full max-w-[220px] space-y-3 md:block">
        {[{ Icon: CalendarDays, title: "Your bookings", detail: "Every stay, in one place" }, { Icon: ConciergeBell, title: "Guest services", detail: "A little help, whenever" }, { Icon: CreditCard, title: "Easy payments", detail: "Invoices kept close" }].map(({ Icon, title, detail }) => <div key={title} className="flex items-center gap-3 bg-white/90 px-3 py-3 shadow-sm ring-1 ring-black/[0.035]"><span className="grid size-9 shrink-0 place-items-center bg-primary-soft text-accent"><Icon className="size-4" /></span><span><span className="block text-[10px] font-semibold text-ink">{title}</span><span className="mt-0.5 block text-[8px] text-muted">{detail}</span></span></div>)}
      </div>
      <MobileGuestApp />
    </div>
  );
}
