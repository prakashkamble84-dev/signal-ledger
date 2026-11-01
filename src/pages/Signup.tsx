import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, CheckCircle, Loader2, Mail, ShieldCheck, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState<string | undefined>(undefined);
  const [step, setStep] = useState<'form' | 'verify' | 'success' | 'error'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const navigate = useNavigate();
    const location = useLocation();
    const { signUp, user, loading } = useAuth();
  
    useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("plan");
    if (p && ["starter", "growth", "scale"].includes(p)) setPlan(p);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await signUp(email, password, plan);
    setSubmitting(false);
    if (result.verificationRequired) {
      setStep("verify");
      setVerificationRequired(true);
      return;
    }
    if (result.error) {
      setError(result.error);
      return;
    }
    setStep("success");
  }

  if (step === "success") return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-xl max-w-md w-full text-center shadow-lg">
        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
        <h2 className="text-2xl font-bold mb-2">Account created!</h2>
        <p className="text-gray-300 mb-6">
          A verification email has been sent to <strong className="underline">{email}</strong>. Please check your inbox and click the link to verify your email address.
        </p>
        <button onClick={() => navigate("/login")} className="button button-primary w-full">
          Continue to login
        </button>
      </div>
    </div>
  );

  if (step === "error") return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-xl max-w-md w-full text-center shadow-lg">
        <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold mb-2">Signup failed</h2>
        <p className="text-gray-300 mb-6">{error}</p>
        <button onClick={() => setStep("form")} className="button button-primary w-full">Try again</button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="spinner-ctr">Checking session…</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b gray-700" style={{ borderColor: "rgb(100 116 139 / .2)" }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Sign up</h1>
          <a href="/" className="text-sm text-gray-400 hover:text-white transition">Back to homepage</a>
        </div>
      </header>

      <main className="max-w-md mx-auto py-8">
        {step === "form" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded border border-gray-600 bg-gray-900 px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded border border-gray-600 bg-gray-900 px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <select
                value={plan ?? "growth"}
                onChange={(e) => setPlan(e.target.value)}
                className="block w-[180px] rounded border border-gray-600 bg-gray-900 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 appearance-none bg-no-repeat right-3 top-1/2 transform -translate-y-1/2"
              >
                <option value="">Select plan</option>
                <option value="starter">Starter — $79/month</option>
                <option value="growth">Growth — $249/month</option>
                <option value="scale">Scale — $699/month</option>
              </select>
              <span className="text-sm text-gray-500">
                Plan selection is not a payment method. It is used to associate your preference for future billing.
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`button button-primary w-full ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {submitting ? "Creating account…" : "Create my account"}
            </button>
          </form>
        )}

        {step === "verify" && (
                          <div className="min-h-screen bg-gray-900 text-white">
                            <header className="border-b gray-700" style={{ borderColor: "rgb(100 116 139 / .2)" }}>
                              <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                                <h1 className="text-xl font-semibold">Verify email</h1>
                                <a href="/" className="text-sm text-gray-400 hover:text-white transition">Back to homepage</a>
                              </div>
                            </header>
               
                            <main className="max-w-md mx-auto py-8">
                              <p className="text-gray-400 mb-6">
                                We've sent a verification email to <strong className="underline">{email}</strong>. Please check your inbox and click the verification link to complete your signup.
                              </p>
                              <button
                                onClick={() => supabase.auth.resend({ type: "signup", email })}
                                className="button button-primary w-full mb-4"
                              >
                                Resend verification email
                              </button>
                              <p className="text-sm text-gray-500">
                                If you don't see the email, check your spam folder. Verification is required to access the workspace.
                              </p>
                            </main>
                          </div>
                        )}
              </main>
            </div>
          );
        }