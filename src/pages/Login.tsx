import { FormEvent, useState, useEffect } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { Activity, AlertCircle, ArrowRight, LockKeyhole, Mail, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const { signIn, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/workspace";

  useEffect(() => {
    if (user?.app_metadata?.onboarded === true && !authLoading) {
      navigate("/workspace", { replace: true });
    }
    if (user && !authLoading && user.app_metadata?.onboarded !== true) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, authLoading, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setVerificationRequired(false);
    const result = await signIn(email.trim(), password);
    setSubmitting(false);
    if (result.error) {
      setError(result.verificationRequired ? "Please verify your email before signing in. Check your inbox for the confirmation link." : result.error);
      setVerificationRequired(result.verificationRequired);
      return;
    }
    if (user?.app_metadata?.onboarded === true) {
      navigate(destination, { replace: true });
    } else {
      navigate("/onboarding", { replace: true });
    }
  }

  if (authLoading) return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand"><span className="auth-brand-icon"><Activity size={20} /></span><span>Revenue workspace</span></div>
        <div className="auth-heading"><span className="auth-eyebrow">YOUR WORKSPACE, SECURED</span><h1 id="auth-title">Welcome back</h1><p>Sign in to continue to your revenue workspace.</p></div>
        <div className="auth-form"><div className="spinner-ctr">Checking session…</div></div>
      </section>
    </main>
  );

  if (user && !authLoading && user.app_metadata?.onboarded === true) {
      return <Navigate to="/workspace" replace />;
    }
    if (user && !authLoading && user.app_metadata?.onboarded !== true) {
      return <Navigate to="/onboarding" replace />;
    }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand"><span className="auth-brand-icon"><Activity size={20} /></span><span>Revenue workspace</span></div>
        <div className="auth-heading"><span className="auth-eyebrow">YOUR WORKSPACE, SECURED</span><h1 id="auth-title">Welcome back</h1><p>Sign in to continue to your revenue workspace.</p></div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="auth-email">Email address</label>
          <div className="auth-input-wrap"><Mail size={17} aria-hidden="true"/><input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></div>
          <label htmlFor="auth-password">Password</label>
          <div className="auth-input-wrap relative">
            <LockKeyhole size={17} aria-hidden="true"/>
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-emerald-500 transition"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {error && <div className={`auth-error${verificationRequired ? " verification" : ""}`} role="alert"><AlertCircle size={17} aria-hidden="true"/><span>{error}</span></div>}
          <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}<ArrowRight size={17}/></button>
        </form>
        <p className="auth-footnote">Use the email and password associated with your account.</p>
      </section>
    </main>
  );
}