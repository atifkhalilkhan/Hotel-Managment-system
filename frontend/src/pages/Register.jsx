import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import useAuth from "../context/useAuth.js";
import AuthLayout from "../layouts/AuthLayout.jsx";
import Link from "../components/Link.jsx";
import { Alert, Button, Input } from "../components/UI.jsx";

export default function Register() {
  const { register } = useAuth();
  const [values, setValues] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    const name = values.name.trim();
    const email = values.email.trim().toLowerCase();
    if (!name || !email || !values.password) return setError("Name, email and password are required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address.");
    if (values.password.length < 6) return setError("Password must be at least 6 characters.");
    if (values.password !== values.confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try {
      await register({ name, email, phone: values.phone.trim(), password: values.password });
    } catch (requestError) {
      setError(requestError.message || "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout compact title="Create your account" subtitle="Create a guest account to book and manage your stays">
      <form className="auth-register-form grid grid-cols-1 gap-y-2.5 min-[360px]:grid-cols-2 min-[360px]:gap-x-3 sm:gap-y-3 sm:gap-x-4" onSubmit={submit}>
        {error && <Alert className="rounded-xl sm:col-span-2" onClose={() => setError("")}>{error}</Alert>}
        <div className="auth-field min-[360px]:col-span-2"><Input autoComplete="name" className="h-10 rounded-xl border-[#e7e8eb] bg-[#fafafa] px-3 text-sm focus:bg-white sm:h-11 sm:px-4" disabled={loading} label="Full name" maxLength={100} name="name" onChange={update} placeholder="How should we address you?" required value={values.name} /></div>
        <div className="auth-field"><Input autoComplete="email" className="h-10 rounded-xl border-[#e7e8eb] bg-[#fafafa] px-3 text-sm focus:bg-white sm:h-11 sm:px-4" disabled={loading} label="Email address" name="email" onChange={update} placeholder="you@example.com" required type="email" value={values.email} /></div>
        <div className="auth-field"><Input autoComplete="tel" className="h-10 rounded-xl border-[#e7e8eb] bg-[#fafafa] px-3 text-sm focus:bg-white sm:h-11 sm:px-4" disabled={loading} label="Phone (optional)" name="phone" onChange={update} placeholder="Phone number" type="tel" value={values.phone} /></div>
        <div className="auth-field relative">
          <Input autoComplete="new-password" className="h-10 rounded-xl border-[#e7e8eb] bg-[#fafafa] px-3 pr-9 text-sm focus:bg-white sm:h-11 sm:px-4 sm:pr-11" disabled={loading} minLength={6} label="Password" name="password" onChange={update} placeholder="At least 6 characters" required type={showPassword ? "text" : "password"} value={values.password} />
          <button aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute right-0.5 top-7 flex h-9 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-white hover:text-ink sm:right-1 sm:h-10 sm:w-10" disabled={loading} onClick={() => setShowPassword((visible) => !visible)} type="button">{showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4 sm:h-[18px] sm:w-[18px]" /> : <Eye aria-hidden="true" className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />}</button>
        </div>
        <div className="auth-field relative">
          <Input autoComplete="new-password" className="h-10 rounded-xl border-[#e7e8eb] bg-[#fafafa] px-3 pr-9 text-sm focus:bg-white sm:h-11 sm:px-4 sm:pr-11" disabled={loading} label="Confirm password" name="confirmPassword" onChange={update} placeholder="Re-enter password" required type={showConfirmPassword ? "text" : "password"} value={values.confirmPassword} />
          <button aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"} aria-pressed={showConfirmPassword} className="absolute right-0.5 top-7 flex h-9 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-white hover:text-ink sm:right-1 sm:h-10 sm:w-10" disabled={loading} onClick={() => setShowConfirmPassword((visible) => !visible)} type="button">{showConfirmPassword ? <EyeOff aria-hidden="true" className="h-4 w-4 sm:h-[18px] sm:w-[18px]" /> : <Eye aria-hidden="true" className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />}</button>
        </div>
        <Button className="auth-submit mt-0.5 h-11 w-full rounded-xl bg-[#f97316] text-sm font-semibold shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-[#e85f08] hover:shadow-orange-500/30 min-[360px]:col-span-2 sm:mt-1 sm:h-12 sm:text-[15px]" loading={loading} type="submit">Create guest account <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Button>
      </form>
      <p className="auth-footer mt-5 border-t border-[#eff0f2] pt-4 text-center text-sm text-[#737782]">Already have an account? <Link className="ml-1 font-semibold text-orange-600 hover:text-orange-700 hover:underline" href="/login">Sign in</Link></p>
    </AuthLayout>
  );
}
