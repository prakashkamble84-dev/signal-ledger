import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, CheckCircle, Loader2, Mail, ShieldCheck, XCircle, Icon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Onboarding() {
  const [workspaceName, setWorkspaceName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [plan, setPlan] = useState<string>("");
  const [step, setStep] = useState<'collect' | 'confirm' | 'success' | 'error'>('collect');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("plan");
    if (p && ["starter", "growth", "scale"].includes(p)) setPlan(p);
  }, []);

  useEffect(() => {
    const input = document.getElementById("workspace-name") as HTMLInputElement;
    if (input) input.focus();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();
    if (!workspaceName.trim()) {
      setError("Workspace name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .rpc("create_personal_workspace_for_new_user", {
          target_user_id: user?.id,
        });

      if (dbError) throw dbError;

      if (!data) throw new Error("Workspace creation returned no data.");

      const workspaceId = data.id;
      const workspaceNameVal = data.name || workspaceName;

      const { error: membershipError } = await supabase
        .from("workspace_memberships")
        .insert({
          workspace_id: workspaceId,
          user_id: user?.id!,
          role: "owner",
        });

      if (membershipError) throw membershipError;

      const { error: updateError } = await supabase.auth.updateUser({
        data: { onboarded: true, plan },
      });

      if (updateError) throw updateError;

      setStep("success");
    } catch (err: any) {
      console.error("Onboarding error:", err);
      setError(err?.message || "Failed to complete onboarding. Please try again.");
      setStep("error");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "success") return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-xl max-w-md w-full text-center shadow-lg">
        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
        <h2 className="text-2xl font-bold mb-2">Onboarding complete!</h2>
        <p className="text-gray-300 mb-6">
          Your workspace has been set up successfully. You can now explore the platform.
        </p>
        <button onClick={() => navigate("/workspace")} className="button button-primary w-full">
          Open workspace
        </button>
        <a href="/" className="text-sm text-gray-500 hover:text-white transition mt-2">Back to homepage</a>
      </div>
    </div>
  );

  if (step === "error") return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-md mx-auto py-8">
        <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold mb-2">Onboarding failed</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <button onClick={() => setStep("collect")} className="button button-primary w-full">Try again</button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">Checking session…</div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b gray-700" style={{ borderColor: "rgb(100 116 139 / .2)" }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Welcome to Revenue Intelligence</h1>
          <a href="/" className="text-sm text-gray-400 hover:text-white transition">Back to homepage</a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-8">
        {step === "collect" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="hidden"
              value={plan}
              defaultValue={plan ?? "growth"}
              id="selected-plan"
            />
            <input
              type="hidden"
              defaultValue={plan ?? "growth"}
              id="plan-identifier"
            />

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="workspace-name">
                Workspace name
                <span className="text-red-500">*</span>
              </label>
              <input
                id="workspace-name"
                required
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="block w-full rounded border border-gray-600 bg-gray-900 px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition"
                placeholder="e.g. Acme Corp"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="website">
                Website (optional)
              </label>
              <input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="block w-full rounded border border-gray-600 bg-gray-900 px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition"
                placeholder="https://www.example.com"
              />
              <p className="text-xs text-gray-500">Optional — can be updated later.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="industry">
                Industry (optional)
              </label>
              <input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="block w-full rounded border border-gray-600 bg-gray-900 px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition"
                placeholder="e.g. Technology, Healthcare, Finance"
              />
              <p className="text-xs text-gray-500">Optional — can be updated later.</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Selected plan: <strong className="font-medium">{plan === "starter" ? "$79/month" : plan === "growth" ? "$249/month" : "$699/month"}</strong> — 7-day free trial, no payment method required.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`button button-primary w-full ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {submitting ? "Setting up workspace…" : "Continue to workspace"}
            </button>
          </form>
        )}

        {step === "confirm" && (
          <div className="text-gray-400 mb-6">
            <p>We're creating your workspace…</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
          </div>
        )}
      </main>
    </div>
  );
}