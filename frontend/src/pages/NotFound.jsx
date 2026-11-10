/* Friendly fallback for URLs that do not match an application page. */
import Link from "../components/Link.jsx";
import { Card } from "../components/UI.jsx";

export default function NotFound() {
  return <main className="flex min-h-dvh items-center justify-center p-4"><Card className="w-full max-w-md text-center"><p className="text-sm font-semibold text-primary-dark">404</p><h1 className="mt-2 text-2xl font-semibold">Page not found</h1><p className="mt-2 text-sm text-muted">The page you’re looking for doesn’t exist.</p><Link className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark" href="/dashboard">Back to dashboard</Link></Card></main>;
}
