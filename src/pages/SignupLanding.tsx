import { Link, useSearchParams } from "react-router-dom";
import { Activity, ArrowLeft, ShieldCheck } from "lucide-react";
import "./marketing-home.css";
import "./signup-placeholder.css";

const plans: Record<string, { name: string; price: string }> = {
  starter: { name: "Starter", price: "$79 / month (proposed)" },
  growth: { name: "Growth", price: "$249 / month (proposed)" },
  scale: { name: "Scale", price: "$699 / month (proposed)" },
};

export default function SignupLanding() {
  const [searchParams] = useSearchParams();
  const requestedPlan = searchParams.get("plan")?.toLowerCase() ?? "growth";
  const selectedPlan = plans[requestedPlan] ? requestedPlan : "growth";
  const plan = plans[selectedPlan];
  return <main className="signup-placeholder marketing-home">
    <div className="signup-placeholder-card">
      <Link className="marketing-brand" to="/" aria-label="Return to Revenue Intelligence homepage"><span className="marketing-brand-icon"><Activity size={18} /></span><span>Revenue<span className="brand-light"> Intelligence</span></span></Link>
      <span className="section-kicker">TRIAL SIGNUP</span>
      <h1>Signup isn’t available yet.</h1>
      <p>Your requested plan is <strong>{plan.name}</strong> ({plan.price}). Plan selection is only a preference; it does not create a subscription, activate a trial, or grant access.</p>
      <div className="signup-placeholder-note"><ShieldCheck size={17} /><span>Trial activation will require the trusted signup and onboarding flow. No billing or account changes have been made.</span></div>
      <Link className="button button-primary" to="/login">Continue to log in</Link>
      <Link className="signup-back" to="/"><ArrowLeft size={14} /> Back to homepage</Link>
    </div>
  </main>;
}
