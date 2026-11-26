// Sirf icon wala button. aria-label zaroori hai taake screen reader ko pata chale ye kya hai
export default function IconButton({ label, className = "", children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`inline-flex size-11 items-center justify-center rounded-lg text-ink transition-colors hover:bg-soft ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}