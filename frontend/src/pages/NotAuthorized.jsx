/* Destination shown when an authenticated user lacks page permissions. */
import { ShieldX } from "lucide-react";
import Link from "../components/Link.jsx";
import { Card } from "../components/UI.jsx";

export default function NotAuthorized() {
  return <main className="flex min-h-dvh items-center justify-center p-4"><Card className="w-full max-w-md text-center"><ShieldX aria-hidden="true" className="mx-auto h-10 w-10 text-muted" /><h1 className="mt-3 text-xl font-semibold">Access not available</h1><p className="mt-2 text-sm text-muted">Your account doesn’t have permission to view this page.</p><Link className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark" href="/dashboard">Back to dashboard</Link></Card></main>;
}
