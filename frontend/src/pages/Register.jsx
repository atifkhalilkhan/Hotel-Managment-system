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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(event) { setValues((current) => ({ ...current, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!values.name.trim() || !values.email || !values.password) return setError("Name, email and password are required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return setError("Enter a valid email address.");
    if (values.password.length < 6) return setError("Password must be at least 6 characters.");
    if (values.password !== values.confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try {
      await register({ name: values.name, email: values.email, phone: values.phone, password: values.password });
    } catch (requestError) { setError(requestError.message); } finally { setLoading(false); }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Register as a LuxuryStay guest">
      <form className="space-y-4" onSubmit={submit}>
        {error && <Alert>{error}</Alert>}
        <Input autoComplete="name" label="Full name" name="name" onChange={update} value={values.name} />
        <Input autoComplete="email" label="Email address" name="email" onChange={update} type="email" value={values.email} />
        <Input autoComplete="tel" label="Phone (optional)" name="phone" onChange={update} type="tel" value={values.phone} />
        <div className="relative">
          <Input autoComplete="new-password" className="pr-12" label="Password" name="password" onChange={update} type={showPassword ? "text" : "password"} value={values.password} />
          <button aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-1 top-7 flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-page" onClick={() => setShowPassword(!showPassword)} type="button">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
        </div>
        <Input autoComplete="new-password" label="Confirm password" name="confirmPassword" onChange={update} type={showPassword ? "text" : "password"} value={values.confirmPassword} />
        <Button className="w-full" loading={loading} type="submit">Create account</Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">Already registered? <Link className="font-medium text-primary-dark hover:underline" href="/login">Sign in</Link></p>
    </AuthLayout>
  );
}
