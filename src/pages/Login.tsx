import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Activity, AlertCircle, ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/workspace";

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
    navigate(destination, { replace: true });
  }

  return <main className="auth-page">
    <section className="auth-card" aria-labelledby="auth-title">
      <div className="auth-brand"><span className="auth-brand-icon"><Activity size={20} /></span><span>Revenue workspace</span></div>
      <div className="auth-heading"><span className="auth-eyebrow">YOUR WORKSPACE, SECURED</span><h1 id="auth-title">Welcome back</h1><p>Sign in to continue to your revenue workspace.</p></div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="auth-email">Email address</label>
        <div className="auth-input-wrap"><Mail size={17} aria-hidden="true"/><input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></div>
        <label htmlFor="auth-password">Password</label>
        <div className="auth-input-wrap"><LockKeyhole size={17} aria-hidden="true"/><input id="auth-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /></div>
        {error && <div className={`auth-error${verificationRequired ? " verification" : ""}`} role="alert"><AlertCircle size={17} aria-hidden="true"/><span>{error}</span></div>}
        <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}<ArrowRight size={17}/></button>
      </form>
      <p className="auth-footnote">Use the email and password associated with your account.</p>
    </section>
  </main>;
}
