/* Existing account sign-in form with backend error reporting. */
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to your account">
      <form className="space-y-4" onSubmit={submit}>
        {error && <Alert>{error}</Alert>}
        <Input autoComplete="email" label="Email address" name="email" onChange={(event) => setValues({ ...values, email: event.target.value })} placeholder="you@example.com" type="email" value={values.email} />
        <div className="relative">
          <Input autoComplete="current-password" className="pr-12" label="Password" name="password" onChange={(event) => setValues({ ...values, password: event.target.value })} type={showPassword ? "text" : "password"} value={values.password} />
          <button aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-1 top-7 flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-page" onClick={() => setShowPassword(!showPassword)} type="button">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
        </div>
        <Button className="w-full" loading={loading} type="submit">Sign in</Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">Don’t have an account? <Link className="font-medium text-primary-dark hover:underline" href="/register">Create one</Link></p>
    </AuthLayout>
  );
}
