import {
  Bell,
  BellRing,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronRight,
  ConciergeBell,
  Download,
  ReceiptText,
  AlarmClock,
  SprayCan,
} from "lucide-react";
import { hotelInfo } from "../lib/hotelInfo";

// Phone ke andar dikhne wali app ki screens. Sirf tasveer hai (aria-hidden), asli data nahi.
// Maqsad: guest ko dikhana ke portal mein kya milega.

const TABS = [
  { id: "bookings", Icon: CalendarDays },
  { id: "services", Icon: ConciergeBell },
  { id: "invoices", Icon: ReceiptText },
  { id: "updates", Icon: Bell },
];

function StatusPill({ tone = "green", children }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    neutral: "bg-soft text-muted",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tones[tone]}`}>{children}</span>;
}

function ScreenTitle({ eyebrow, title }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">{eyebrow}</p>
      <p className="mt-0.5 text-[17px] font-semibold tracking-tight">{title}</p>
    </div>
  );
}

function BookingsScreen() {
  return (
    <>
      <ScreenTitle eyebrow="Good evening, Sara" title="Your upcoming stay" />
      <div className="mt-3 overflow-hidden rounded-xl border border-line bg-white">
        <div className="relative h-[118px]">
          <img src="/gallery-optimized/bedrooms-3.jpg" alt="" className="size-full object-cover" />
          <span className="absolute left-2.5 top-2.5"><StatusPill>Confirmed</StatusPill></span>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold">Deluxe room</p>
            <p className="text-[11px] text-muted">Room 304</p>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-line pt-2.5 text-[11px]">
            <div>
              <p className="text-muted">Check-in</p>
              <p className="mt-0.5 font-semibold">Fri, 18 Dec</p>
              <p className="text-muted">{hotelInfo.checkInTime}</p>
            </div>
            <div>
              <p className="text-muted">Check-out</p>
              <p className="mt-0.5 font-semibold">Tue, 22 Dec</p>
              <p className="text-muted">{hotelInfo.checkOutTime}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2.5 text-[11px]">
        <span><span className="font-semibold">4 nights</span> · 2 guests</span>
        <span className="inline-flex items-center gap-0.5 font-semibold text-accent">Details <ChevronRight className="size-3" /></span>
      </div>
      <div className="mt-2.5 rounded-xl bg-ink px-3 py-2.5 text-[11px] text-white">
        <p className="font-semibold">Arriving early?</p>
        <p className="mt-0.5 text-white/65">Let reception know from the app.</p>
      </div>
    </>
  );
}

function ServicesScreen() {
  const services = [
    { label: "Room service", Icon: ConciergeBell },
    { label: "Housekeeping", Icon: SprayCan },
    { label: "Wake-up call", Icon: AlarmClock },
    { label: "Transport", Icon: Car },
  ];
  return (
    <>
      <ScreenTitle eyebrow="Room 304" title="How can we help?" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {services.map(({ label, Icon }, index) => (
          <div
            key={label}
            className={`rounded-xl border p-2.5 ${index === 0 ? "border-primary bg-primary-soft" : "border-line bg-white"}`}
          >
            <Icon className={`size-4 ${index === 0 ? "text-primary-dark" : "text-accent"}`} />
            <p className="mt-3 text-[11px] font-semibold">{label}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Your requests</p>
      <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-white text-[11px]">
        <li className="flex items-center justify-between px-3 py-2.5">
          <span><span className="block font-semibold">Housekeeping</span><span className="text-muted">Fresh towels</span></span>
          <StatusPill tone="amber">On the way</StatusPill>
        </li>
        <li className="flex items-center justify-between px-3 py-2.5">
          <span><span className="block font-semibold">Wake-up call</span><span className="text-muted">Tomorrow, 7:00 AM</span></span>
          <StatusPill tone="neutral">Scheduled</StatusPill>
        </li>
        <li className="flex items-center justify-between px-3 py-2.5">
          <span><span className="block font-semibold">Room service</span><span className="text-muted">Dinner for two</span></span>
          <StatusPill>Delivered</StatusPill>
        </li>
      </ul>
    </>
  );
}

function InvoicesScreen() {
  const lines = [
    { label: "Deluxe room × 4 nights", amount: "72,000" },
    { label: "Room service", amount: "4,500" },
    { label: "Airport transfer", amount: "3,000" },
  ];
  return (
    <>
      <ScreenTitle eyebrow="Invoice INV-1042" title="Stay summary" />
      <div className="mt-3 rounded-xl border border-line bg-white p-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted">18 – 22 Dec</p>
          <StatusPill>Paid</StatusPill>
        </div>
        <ul className="mt-3 space-y-2 text-[11px]">
          {lines.map((line) => (
            <li key={line.label} className="flex justify-between gap-2">
              <span className="text-muted">{line.label}</span>
              <span className="font-medium tabular-nums">{line.amount}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-line pt-3">
          <span className="text-[11px] font-semibold">Total (PKR)</span>
          <span className="text-[18px] font-semibold tabular-nums tracking-tight">79,500</span>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-[11px] font-semibold text-ink">
        <Download className="size-3.5" /> Download PDF
      </div>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Earlier</p>
      <div className="mt-2 flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2.5 text-[11px]">
        <span><span className="block font-semibold">INV-0987</span><span className="text-muted">Single room · Aug</span></span>
        <span className="font-medium tabular-nums">18,000</span>
      </div>
    </>
  );
}

function UpdatesScreen() {
  const updates = [
    { title: "Your room is ready", text: "Room 304 is ready. Collect your key at reception.", time: "Now", Icon: CheckCircle2, fresh: true },
    { title: "Housekeeping completed", text: "Fresh towels have been delivered.", time: "2h", Icon: SprayCan },
    { title: "Payment received", text: "Invoice INV-1042 has been paid.", time: "Yesterday", Icon: ReceiptText },
    { title: "Booking confirmed", text: "Deluxe room, 18 – 22 Dec.", time: "Mon", Icon: CalendarDays },
  ];
  return (
    <>
      <ScreenTitle eyebrow="Notifications" title="Updates" />
      <ul className="mt-3 space-y-2">
        {updates.map(({ title, text, time, Icon, fresh }) => (
          <li key={title} className={`flex gap-2.5 rounded-xl border p-2.5 ${fresh ? "border-primary bg-primary-soft" : "border-line bg-white"}`}>
            <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${fresh ? "bg-primary text-ink" : "bg-soft text-accent"}`}>
              <Icon className="size-3.5" />
            </span>
            <span className="min-w-0 flex-1 text-[11px]">
              <span className="flex justify-between gap-2">
                <span className="truncate font-semibold">{title}</span>
                <span className="shrink-0 text-muted">{time}</span>
              </span>
              <span className="mt-0.5 block leading-snug text-muted">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

const SCREENS = { bookings: BookingsScreen, services: ServicesScreen, invoices: InvoicesScreen, updates: UpdatesScreen };

export default function GuestAppShowcase({ screen = "bookings" }) {
  const Screen = SCREENS[screen] ?? BookingsScreen;
  return (
    <div aria-hidden="true" className="relative mx-auto w-[288px] select-none">
      {/* Side buttons */}
      <span className="absolute -left-[3px] top-[110px] h-8 w-[3px] rounded-l bg-ink/80" />
      <span className="absolute -left-[3px] top-[154px] h-12 w-[3px] rounded-l bg-ink/80" />
      <span className="absolute -right-[3px] top-[140px] h-16 w-[3px] rounded-r bg-ink/80" />

      <div className="rounded-[46px] bg-ink p-[10px] shadow-[0_24px_50px_rgba(17,17,17,0.18)]">
        <div className="relative flex h-[580px] flex-col overflow-hidden rounded-[36px] bg-[#FAFAF8] text-ink">
          {/* Status bar + island */}
          <div className="relative flex h-11 shrink-0 items-center justify-between px-7 text-[12px] font-semibold">
            <span>9:41</span>
            <span className="absolute left-1/2 top-2.5 h-[26px] w-[86px] -translate-x-1/2 rounded-full bg-ink" />
            <span className="flex items-center gap-1">
              <span className="flex items-end gap-[2px]">
                {[4, 6, 8, 10].map((h) => <i key={h} className="w-[3px] rounded-sm bg-ink" style={{ height: h }} />)}
              </span>
              <span className="ml-1 h-[10px] w-5 rounded-[3px] border border-ink/60 p-[1px]"><i className="block h-full w-3/4 rounded-[1px] bg-ink" /></span>
            </span>
          </div>

          {/* App header */}
          <div className="flex shrink-0 items-center justify-between px-4 pb-2">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold">
              <span className="grid size-6 place-items-center rounded-md bg-primary text-[11px] font-bold">L</span>
              {hotelInfo.name}
            </span>
            <span className="relative grid size-8 place-items-center rounded-full border border-line bg-white">
              <BellRing className="size-3.5" />
              <i className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
            </span>
          </div>

          {/* Screen content */}
          <div key={screen} className="app-screen-in min-h-0 flex-1 overflow-hidden px-4 pt-1">
            <Screen />
          </div>

          {/* Tab bar */}
          <nav className="grid shrink-0 grid-cols-4 border-t border-line bg-white px-2 pt-2 pb-6">
            {TABS.map(({ id, Icon }) => (
              <span key={id} className={`flex flex-col items-center gap-1 ${id === screen ? "text-primary-dark" : "text-muted"}`}>
                <Icon className="size-[18px]" />
                <span className="text-[9px] font-semibold capitalize">{id}</span>
              </span>
            ))}
          </nav>
          <span className="absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-ink" />
        </div>
      </div>
    </div>
  );
}
