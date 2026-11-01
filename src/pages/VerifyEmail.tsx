import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, Mail, ShieldCheck, XCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function VerifyEmail() {
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = new URLSearchParams(location.search).get("from") ?? "/login";

  useEffect(() => {
    if (session?.user?.app_metadata?.onboarded === true) {
      navigate("/app", { replace: true });
    }
  }, [session?.user?.app_metadata?.onboarded, navigate]);

  async function handleResend() {
      setResending(true);
      setError(null);
      const { error } = await supabase.auth.resend({ type: "signup", email: user?.email || "" });
      setResending(false);
      if (error) setError(error.message || "Failed to resend verification email.");
    }

  useEffect(() => {
    if (session?.access_token) {
      supabase.from("users").select("onboarded").eq("id", session.user.id).single().then(({ data }) => {
        if (data?.onboarded) navigate("/app", { replace: true });
      });
    }
  }, [session?.access_token, navigate]);

  useEffect(() => {
    const checkVerification = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) return;
      if (session?.user?.app_metadata?.onboarded === true) {
        navigate("/app", { replace: true });
        return;
      }
      setError(null);
    };
    checkVerification();
  }, [navigate]);

  if (error) return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-md mx-auto py-8">
        <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold mb-2">Verification error</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <button onClick={() => setError(null)} className="button button-primary w-full">Try again</button>
      </div>
    </div>
  );

  if (user?.app_metadata?.onboarded === true) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-xl max-w-md w-full text-center shadow-lg">
        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
        <h2 className="text-2xl font-bold mb-2">Email verified!</h2>
        <p className="text-gray-300 mb-6">
          Your email address has been verified. You're now ready to continue onboarding.
        </p>
        <button onClick={() => navigate("/onboarding")} className="button button-primary w-full">
          Start onboarding
        </button>
        <a href="/" className="text-sm text-gray-500 hover:text-white transition mt-2">Back to homepage</a>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-md mx-auto py-8">
        <Mail className="w-12 h-12 mx-auto mb-4 text-emerald-600" />
        <h2 className="text-2xl font-bold mb-2">Verify your email</h2>
        <p className="text-gray-400 mb-6">
          A verification link has been sent to your email. Please check your inbox and click the link to verify your email address.
        </p>
        <button onClick={() => setResending(true)} className="button button-primary w-full" disabled={resending}>
          {resending ? "Sending…" : "Resend verification email"}
        </button>
        <p className="text-sm text-gray-500 mt-4">
                  Didn't receive the email? <button onClick={handleResend} className="underline text-emerald-500" disabled={resending}>{resending ? "Sending…" : "Resend verification email"}</button>
                </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b gray-700" style={{ borderColor: "rgb(100 116 139 / .2)" }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Verify email</h1>
          <a href="/" className="text-sm text-gray-400 hover:text-white transition">Back to homepage</a>
        </div>
      </header>

      <main className="max-w-md mx-auto py-8">
        <p className="text-gray-400 mb-6">
          Your email verification link appears to be expired or invalid. Please <a href="/login" className="underline text-emerald-500">log in</a> or <button onClick={() => setResending(true)} className="button button-outline w-full mb-4">{resending ? "Sending…" : "Resend verification email"}</button> to request a new one.
        </p>
        {resending && <p className="text-gray-500 text-center">Sending verification email…</p>}
      </main>
    </div>
  );
}