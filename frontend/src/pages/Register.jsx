/* Guest registration form with password confirmation and immediate sign-in. */
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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
    <AuthLayout title="Create your account" subtitle="Create a guest account to book and manage your stays">
      <form className="space-y-4" onSubmit={submit}>
        {error && <Alert onClose={() => setError("")}>{error}</Alert>}
        <Input autoComplete="name" disabled={loading} label="Full name" maxLength={100} name="name" onChange={update} placeholder="Your full name" required value={values.name} />
        <Input autoComplete="email" disabled={loading} label="Email address" name="email" onChange={update} placeholder="you@example.com" required type="email" value={values.email} />
        <Input autoComplete="tel" disabled={loading} label="Phone (optional)" name="phone" onChange={update} placeholder="Your phone number" type="tel" value={values.phone} />
        <div className="relative">
          <Input autoComplete="new-password" disabled={loading} minLength={6} className="pr-12" label="Password" name="password" onChange={update} placeholder="At least 6 characters" required type={showPassword ? "text" : "password"} value={values.password} />
          <button aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute right-1 top-7 flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-page" onClick={() => setShowPassword((visible) => !visible)} type="button">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
        </div>
        <div className="relative">
          <Input autoComplete="new-password" disabled={loading} label="Confirm password" name="confirmPassword" onChange={update} required type={showConfirmPassword ? "text" : "password"} value={values.confirmPassword} />
          <button aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"} aria-pressed={showConfirmPassword} className="absolute right-1 top-7 flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-page" onClick={() => setShowConfirmPassword((visible) => !visible)} type="button">{showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
        </div>
        <Button className="w-full" loading={loading} type="submit">Create account</Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">Already registered? <Link className="font-medium text-primary-dark underline-offset-4 hover:underline" href="/login">Sign in</Link></p>
    </AuthLayout>
  );
}
