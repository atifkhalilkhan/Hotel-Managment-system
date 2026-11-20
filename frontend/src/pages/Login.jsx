/* Existing account sign-in form with backend error reporting. */
import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import useAuth from "../context/useAuth.js";
import AuthLayout from "../layouts/AuthLayout.jsx";
import Link from "../components/Link.jsx";
import { Alert, Button, Input } from "../components/UI.jsx";

export default function Login() {
  const { login } = useAuth();
  const [values, setValues] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return setError("Enter a valid email address.");
    if (!values.password) return setError("Password is required.");
    setLoading(true);
    try { await login(values); } catch (requestError) { setError(requestError.message); } finally { setLoading(false); }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your bookings and make the most of your stay.">
      <form className="auth-login-form space-y-5" onSubmit={submit}>
        {error && <Alert className="rounded-xl" onClose={() => setError("")}>{error}</Alert>}
        <Input autoComplete="email" className="h-12 rounded-xl border-[#e7e8eb] bg-[#fafafa] px-4 focus:bg-white" disabled={loading} label="Email address" name="email" onChange={(event) => setValues({ ...values, email: event.target.value })} placeholder="you@example.com" type="email" value={values.email} />
        <div className="relative">
          <Input autoComplete="current-password" className="h-12 rounded-xl border-[#e7e8eb] bg-[#fafafa] px-4 pr-12 focus:bg-white" disabled={loading} label="Password" name="password" onChange={(event) => setValues({ ...values, password: event.target.value })} placeholder="Enter your password" type={showPassword ? "text" : "password"} value={values.password} />
          <button aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute right-1 top-7 flex h-10 w-10 items-center justify-center rounded-lg text-muted transition hover:bg-white hover:text-ink" disabled={loading} onClick={() => setShowPassword(!showPassword)} type="button">{showPassword ? <EyeOff aria-hidden="true" className="h-[18px] w-[18px]" /> : <Eye aria-hidden="true" className="h-[18px] w-[18px]" />}</button>
        </div>
        <Button className="auth-submit group mt-1 h-12 w-full rounded-xl bg-[#f97316] text-[15px] font-semibold shadow-lg shadow-orange-500/20 hover:-translate-y-0.5 hover:bg-[#e85f08] hover:shadow-orange-500/30" loading={loading} type="submit">Sign in <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Button>
      </form>
      <p className="auth-footer mt-6 border-t border-[#eff0f2] pt-5 text-center text-sm text-[#737782]">New to LuxuryStay? <Link className="ml-1 font-semibold text-orange-600 hover:text-orange-700 hover:underline" href="/register">Create an account</Link></p>
    </AuthLayout>
  );
}
