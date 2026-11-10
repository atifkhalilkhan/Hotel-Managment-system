/* Reusable interface primitives that keep page styles consistent. */
import { useEffect } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, X } from "lucide-react";

export function Button({ variant = "primary", loading = false, className = "", children, ...props }) {
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-dark",
    dark: "bg-ink text-white hover:bg-ink-soft",
    outline: "border border-line bg-white text-ink hover:bg-page",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button {...props} className={`inline-flex h-11 min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`} disabled={loading || props.disabled}>
      {loading && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Input({ label, error, className = "", id, ...props }) {
  const inputId = id || props.name;
  return (
    <div className="min-w-0 space-y-1.5">
      {label && <label className="block text-sm font-medium text-ink" htmlFor={inputId}>{label}</label>}
      <input id={inputId} className={`h-11 w-full rounded-lg border border-line bg-white px-3 text-base text-ink placeholder:text-muted focus:border-primary sm:text-sm ${error ? "border-red-600" : ""} ${className}`} {...props} />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function Select({ label, children, className = "", id, ...props }) {
  const selectId = id || props.name;
  return (
    <div className="min-w-0 space-y-1.5">
      {label && <label className="block text-sm font-medium text-ink" htmlFor={selectId}>{label}</label>}
      <select id={selectId} className={`h-11 w-full rounded-lg border border-line bg-white px-3 text-base text-ink sm:text-sm ${className}`} {...props}>{children}</select>
    </div>
  );
}

export function Card({ className = "", children, ...props }) {
  return <section className={`min-w-0 rounded-lg border border-line bg-white p-4 shadow-sm sm:p-5 ${className}`} {...props}>{children}</section>;
}

export function Table({ headings, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[650px] text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wide text-muted"><tr>{headings.map((heading) => <th className="px-4 py-3 font-medium" key={heading}>{heading}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-page text-ink",
    primary: "bg-primary-soft text-primary-dark",
    success: "bg-green-100 text-green-600",
    error: "bg-red-100 text-red-600",
    warning: "bg-orange-100 text-primary-dark",
    dark: "bg-ink text-white",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${tones[tone]}`}>{children}</span>;
}

export function Textarea({ label, error, className = "", id, ...props }) {
  const inputId = id || props.name;
  return (
    <div className="min-w-0 space-y-1.5">
      {label && <label className="block text-sm font-medium text-ink" htmlFor={inputId}>{label}</label>}
      <textarea id={inputId} className={`min-h-[120px] w-full rounded-lg border border-line bg-white px-3 py-2 text-base text-ink placeholder:text-muted sm:text-sm ${error ? "border-red-600" : ""} ${className}`} {...props} />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function IconButton({ children, ariaLabel, title, className = "", ...props }) {
  return (
    <button aria-label={ariaLabel} className={`flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-white text-ink transition-colors hover:border-primary hover:bg-page ${className}`} title={title} type="button" {...props}>
      {children}
    </button>
  );
}

export function Loader({ label = "Loading", fullPage = false }) {
  return <div className={`flex items-center justify-center gap-3 text-sm text-muted ${fullPage ? "min-h-dvh" : "py-8"}`} role="status"><LoaderCircle className="h-5 w-5 animate-spin text-primary" /><span>{label}</span></div>;
}

export function Alert({ children, type = "error", onClose, className = "" }) {
  const success = type === "success";
  const Icon = success ? CheckCircle2 : AlertCircle;
  return (
    <div role={success ? "status" : "alert"} className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${success ? "border-green-200 bg-green-50 text-green-600" : "border-red-200 bg-red-50 text-red-600"} ${className}`}>
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 break-words">{children}</span>
      {onClose && <button aria-label="Dismiss message" className="rounded-lg p-1" onClick={onClose}><X className="h-4 w-4" /></button>}
    </div>
  );
}

export function PageHeader({ title, description, action }) {
  return <div className="mb-6 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><h1 className="truncate text-xl font-semibold sm:text-2xl">{title}</h1>{description && <p className="mt-1 text-sm text-muted">{description}</p>}</div>{action}</div>;
}

export function EmptyState({ title = "Nothing here yet", description = "Try adjusting your filters." }) {
  return <div className="rounded-lg border border-dashed border-line px-5 py-10 text-center"><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted">{description}</p></div>;
}

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center md:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section aria-labelledby="modal-title" aria-modal="true" className="max-h-[90dvh] w-full overflow-y-auto rounded-t-lg bg-white p-5 md:max-w-lg md:rounded-lg" role="dialog">
        <div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold" id="modal-title">{title}</h2><button aria-label="Close dialog" className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-page" onClick={onClose}><X className="h-5 w-5" /></button></div>
        {children}
      </section>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, children, loading }) {
  return <Modal open={open} onClose={onClose} title={title}><div className="space-y-5"><p className="text-sm text-muted">{children}</p><div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant="danger" loading={loading} onClick={onConfirm}>Confirm</Button></div></div></Modal>;
}
