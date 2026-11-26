const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary: "bg-primary text-ink hover:bg-primary-dark",
  dark: "bg-ink text-white hover:bg-ink/85",
  outline: "border border-line bg-white text-ink hover:border-ink",
  ghost: "text-ink hover:bg-soft",
  link: "text-ink underline decoration-line underline-offset-4 hover:decoration-primary",
};

const sizes = {
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

// Button aur ButtonLink dono yahi classes use karte hain, to dono bilkul ek jaise dikhte hain
export const buttonClasses = ({ variant = "primary", size = "md", className = "" } = {}) =>
  [base, variant === "link" ? "" : sizes[size], variants[variant], className]
    .filter(Boolean)
    .join(" ");