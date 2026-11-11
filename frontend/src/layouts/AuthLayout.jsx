/* Consistent centered card layout for login and registration pages. */
import { Building2 } from "lucide-react";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-md"><Building2 className="h-6 w-6" /></div><p className="font-semibold">LuxuryStay</p><p className="text-xs text-muted">Hotel Management</p></div>
        <section className="rounded-2xl border border-line bg-white p-5 shadow-lg sm:p-8">
          <h1 className="text-center text-xl font-semibold sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-2 text-center text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
