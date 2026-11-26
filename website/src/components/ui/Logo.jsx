import { hotelInfo } from "../../lib/hotelInfo";

// Abhi likha hua logo. Asli logo aaye to sirf is file ko badalna hai
export default function Logo({ tone = "dark", className = "" }) {
  const text = tone === "light" ? "text-white" : "text-ink";
  const sub = tone === "light" ? "text-white/60" : "text-muted";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span aria-hidden="true" className="grid size-8 place-items-center rounded-sm bg-primary">
        <svg
          viewBox="0 0 24 24"
          className="size-5 text-ink"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="square"
        >
          <path d="M8 5v14h9" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className={`text-lg font-semibold tracking-tight ${text}`}>{hotelInfo.name}</span>
        <span
          className={`mt-1 hidden text-[10px] font-medium uppercase tracking-[0.22em] lg:block ${sub}`}
        >
          Hotel
        </span>
      </span>
    </span>
  );
}