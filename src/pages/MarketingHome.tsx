import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Check, ChevronDown,
  ChevronRight, CircleCheck, Command, Compass, Crosshair, Database, FileSearch,
  Layers3, Menu, MessageSquareText, Radar, ShieldCheck, Sparkles, Target, Workflow, X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import "./marketing-home.css";

type PreviewTab = "signals" | "accounts" | "actions";
const tabOrder: PreviewTab[] = ["signals", "accounts", "actions"];
const tabLabels: Record<PreviewTab, string> = { signals: "Signals", accounts: "Accounts", actions: "AI Actions" };
const featureCards = [
  { icon: Radar, title: "Signal Intelligence", text: "Identify and organize relevant buying signals with their source evidence in view." },
  { icon: Crosshair, title: "Account Intelligence", text: "Assess account fit against your ideal customer profile and focus your research." },
  { icon: BarChart3, title: "Predictive Revenue Engine", text: "Support revenue prioritization with explainable, evidence-backed recommendations." },
  { icon: Sparkles, title: "AI Sales Agents", text: "Assist with research and workflows while keeping human approval in control." },
  { icon: Activity, title: "Revenue Learning Loop", text: "Connect actions and outcomes to help teams refine their prioritization over time." },
];
const plans = [
  { key: "starter", name: "Starter", price: "$79", seats: "Up to 3 seats", features: ["Core account and signal intelligence", "Basic ICP qualification", "Limited AI-assisted recommendations"] },
  { key: "growth", name: "Growth", price: "$249", seats: "Up to 10 seats", features: ["Advanced account scoring", "AI sales workflows with approval controls", "Advanced analytics", "Higher controlled usage allowances"], featured: true },
  { key: "scale", name: "Scale", price: "$699", seats: "Up to 25 seats", features: ["Advanced workflow controls", "Higher controlled usage allowances", "Expanded governance and audit capabilities", "Priority support"] },
];
const faqs = [
  { q: "How does the 7-day free trial work?", a: "The trial begins only after the trusted signup and onboarding process activates it for your workspace. Selecting a plan here does not start a trial or grant access." },
  { q: "Do I need to enter payment details to start?", a: "The proposed trial is intended to require no payment method. Signup and billing are not yet available in this preview, so no payment details are requested here." },
  { q: "What happens when my trial ends?", a: "Access after a trial depends on the workspace subscription status provided by trusted billing operations. Those billing operations are not yet connected; no charge or renewal is implied." },
  { q: "Can I change plans later?", a: "Plan changes are not available yet. The prices and plan features shown are launch hypotheses, not finalized commercial terms." },
  { q: "How are workspace seats counted?", a: "Seat counts shown are proposed limits. The final membership and seat-counting rules will be confirmed before purchase." },
  { q: "How are AI and signal usage limits handled?", a: "Usage allowances and provider availability are not finalized. No external signal source or AI action is connected by this marketing demonstration." },
  { q: "Can I cancel my subscription?", a: "Subscription cancellation is not available on this public page. Once billing is implemented, cancellation terms and controls will be provided before purchase." },
];

function ProductMock({ tab }: { tab: PreviewTab }) {
  if (tab === "signals") return <div className="mock-table" aria-label="Illustrative buying signals">
    <div className="mock-table-head"><span>BUYING SIGNAL</span><span>SOURCE EVIDENCE</span><span>FIT</span></div>
    <div className="mock-row"><span><i className="mock-dot emerald" />New market expansion</span><span>Illustrative source · 2 days ago</span><b>High</b></div>
    <div className="mock-row"><span><i className="mock-dot blue" />Leadership hiring trend</span><span>Illustrative source · 5 days ago</span><b>Strong</b></div>
    <div className="mock-row"><span><i className="mock-dot violet" />Technology evaluation</span><span>Illustrative source · 1 week ago</span><b>Review</b></div>
  </div>;
  if (tab === "accounts") return <div className="mock-accounts" aria-label="Illustrative account fit panel">
    <div className="mock-account"><span className="mock-avatar">A</span><div><strong>Example account</strong><small>Illustrative · not a customer record</small></div><span className="fit-score">82 <small>FIT</small></span></div>
    <div className="fit-track"><span /></div>
    <div className="mock-fit-tags"><span><Check size={12} /> ICP alignment</span><span><Check size={12} /> Signal match</span><span className="muted-tag">Needs review</span></div>
  </div>;
  return <div className="mock-action" aria-label="Illustrative recommended action requiring review"><span className="action-icon"><MessageSquareText size={17} /></span><div><strong>Prepare a relevant first-touch brief</strong><p>Suggested from the example signal and account context.</p></div><span className="review-chip"><ShieldCheck size={12} /> Review first</span></div>;
}

export default function MarketingHome() {
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PreviewTab>("signals");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        if (window.matchMedia("(max-width: 720px)").matches) menuButtonRef.current?.focus();
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);
  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const index = tabOrder.indexOf(activeTab);
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabOrder.length - 1 : (index + (event.key === "ArrowRight" ? 1 : tabOrder.length - 1)) % tabOrder.length;
    setActiveTab(tabOrder[next]);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
  }
  const signupLink = (plan: string) => `/signup?plan=${encodeURIComponent(plan)}`;
  const navLinkClick = () => {
    setMenuOpen(false);
    if (window.matchMedia("(max-width: 720px)").matches) menuButtonRef.current?.focus();
  };

  return <div className="marketing-home">
    <header className="marketing-header">
      <div className="marketing-nav-wrap">
        <Link className="marketing-brand" to="/" aria-label="Revenue Workspace home"><span className="marketing-brand-icon"><Activity size={18} /></span><span>Revenue<span className="brand-light"> Intelligence</span></span></Link>
        <button ref={menuButtonRef} className="marketing-menu-toggle" type="button" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} aria-controls="marketing-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        <nav id="marketing-navigation" className={`marketing-nav${menuOpen ? " is-open" : ""}`} aria-label="Main navigation">
          <a href="#platform" onClick={navLinkClick}>Platform</a><a href="#how-it-works" onClick={navLinkClick}>How it works</a><a href="#pricing" onClick={navLinkClick}>Pricing</a>
          <span className="nav-spacer" />
          {!loading && user ? <Link className="nav-login" to="/workspace" onClick={navLinkClick}>Open workspace <ArrowUpRight size={15} /></Link> : <><Link className="nav-login" to="/login" onClick={navLinkClick}>Log in</Link><Link className="button button-small" to={signupLink("growth")} onClick={navLinkClick}>Start free trial <ArrowRight size={15} /></Link></>}
        </nav>
      </div>
    </header>

    <main>
      <section className="marketing-hero" aria-labelledby="hero-title">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-copy"><span className="hero-eyebrow"><span className="eyebrow-pulse" /> AI-POWERED REVENUE INTELLIGENCE</span>
            <h1 id="hero-title">Find the signal.<br /><span>Win the account.</span></h1>
            <p>Turn buying signals into prioritized accounts and evidence-backed sales actions—all in one intelligent revenue workspace.</p>
            <div className="hero-actions"><Link className="button button-primary" to={signupLink("growth")}>Start 7-day free trial <ArrowRight size={17} /></Link><a className="button button-secondary" href="#platform">Explore the platform <ArrowDownRight size={16} /></a></div>
            <div className="hero-reassurance"><Check size={14} /> Free for 7 days <span>·</span> No payment method required</div>
          </div>
          <div className="hero-visual"><div className="visual-orbit orbit-a" /><div className="visual-orbit orbit-b" /><div className="dashboard-window">
            <div className="dashboard-top"><span className="dashboard-mark"><Activity size={13} /></span><strong>Revenue workspace</strong><span className="preview-status"><i />Illustrative preview</span><span className="window-dots">•••</span></div>
            <div className="dashboard-body"><div className="dashboard-sidebar"><span className="side-active"><LayoutMini />Overview</span><span><Radar size={13} />Signals</span><span><Target size={13} />Accounts</span><span><Workflow size={13} />Workflows</span><span><BarChart3 size={13} />Analytics</span></div>
              <div className="dashboard-content"><div className="dashboard-title"><div><small>MONDAY, MAY 20</small><h3>Revenue overview</h3></div><span className="date-chip">Last 30 days <ChevronDown size={12} /></span></div>
                <div className="metric-row"><div className="metric-card"><span>Signal queue</span><strong>For review</strong><small><i className="metric-indicator" /> Evidence linked</small></div><div className="metric-card"><span>Account focus</span><strong>Prioritized</strong><small><i className="metric-indicator teal" /> Fit qualified</small></div></div>
                <div className="signal-card"><div className="signal-card-title"><span>RECENT SIGNALS</span><span>VIEW ALL <ChevronRight size={11} /></span></div><div className="signal-line"><i className="signal-icon"><FileSearch size={12} /></i><span><b>Expansion activity detected</b><small>Example source evidence</small></span><em>Review</em></div><div className="signal-line"><i className="signal-icon green"><Compass size={12} /></i><span><b>Account fit updated</b><small>Illustrative qualification</small></span><em className="ready">Ready</em></div></div>
              </div>
            </div>
          </div><div className="visual-caption"><span><ShieldCheck size={13} />Illustrative interface</span><span>Not connected to live data</span></div></div>
        </div>
        <a href="#platform" className="hero-scroll" aria-label="Scroll to platform"><span /></a>
      </section>

      <section className="product-section section-wrap" id="platform" aria-labelledby="preview-title">
        <div className="section-intro"><span className="section-kicker">ONE INTELLIGENT WORKSPACE</span><h2 id="preview-title">From scattered signals<br />to clear next steps.</h2><p>Bring research, account context, and recommended actions into a single reviewable workflow.</p></div>
        <div className="product-preview-shell"><div className="preview-shell-top"><div><span className="shell-brand"><Activity size={14} /></span><strong>Workspace preview</strong></div><span className="illustrative-label"><span />CONCEPTUAL · ILLUSTRATIVE DATA</span></div>
          <div className="preview-workspace"><div className="preview-tabs" role="tablist" aria-label="Illustrative workspace views">{tabOrder.map((tab) => <button key={tab} id={`preview-tab-${tab}`} role="tab" aria-selected={activeTab === tab} aria-controls="preview-panel" tabIndex={activeTab === tab ? 0 : -1} onClick={() => setActiveTab(tab)} onKeyDown={handleTabKey}>{tabLabels[tab]}</button>)}</div>
            <div className="preview-panel" id="preview-panel" role="tabpanel" aria-labelledby={`preview-tab-${activeTab}`}><div className="preview-panel-heading"><div><span>WORKSPACE / {tabLabels[activeTab].toUpperCase()}</span><h3>{activeTab === "signals" ? "Signal intelligence" : activeTab === "accounts" ? "Account intelligence" : "Recommended actions"}</h3></div><span className="concept-pill">CONCEPT</span></div><ProductMock tab={activeTab} /></div>
          </div>
        </div>
        <div className="preview-caption"><ShieldCheck size={14} />All names, signals, scores, and activity shown are illustrative. No customer data or live integrations.</div>
      </section>

      <section className="value-strip" aria-label="Product principles"><div><FileSearch size={18} /><span>Evidence-backed prioritization</span></div><i /><div><Layers3 size={18} /><span>Workspace-based intelligence</span></div><i /><div><ShieldCheck size={18} /><span>Approval-first AI actions</span></div></section>

      <section className="problem-section section-wrap" aria-labelledby="problem-title"><div className="section-intro centered"><span className="section-kicker">A MORE CONNECTED WAY TO SELL</span><h2 id="problem-title">Revenue teams deserve<br />a clearer picture.</h2><p>Good decisions start with the right context—not another disconnected tab.</p></div>
        <div className="problem-grid"><article><span className="problem-number">01</span><h3>Signals are scattered</h3><p>Buying cues live across sources, making it hard to see what matters and why.</p></article><article><span className="problem-number">02</span><h3>Research time gets lost</h3><p>Teams spend too much effort investigating accounts that may not fit.</p></article><article><span className="problem-number">03</span><h3>Next steps vary</h3><p>Follow-through is inconsistent, with limited visibility into what happened next.</p></article></div>
        <div className="connection-flow"><div><Radar size={17} /><span>Signals</span></div><ChevronRight /><div><Target size={17} /><span>Account fit</span></div><ChevronRight /><div><Sparkles size={17} /><span>Recommended actions</span></div><ChevronRight /><div><BarChart3 size={17} /><span>Outcomes</span></div></div>
      </section>

      <section className="capabilities-section section-wrap" aria-labelledby="capabilities-title"><div className="section-heading-row"><div><span className="section-kicker">THE PLATFORM</span><h2 id="capabilities-title">Intelligence that connects<br />the whole revenue motion.</h2></div><p>Designed to support better research and thoughtful action. Availability of advanced capabilities depends on future product releases.</p></div>
        <div className="capability-grid">{featureCards.map(({ icon: Icon, title, text }, index) => <article className="capability-card" key={title}><span className="capability-icon"><Icon size={19} /></span><span className="capability-index">0{index + 1}</span><h3>{title}</h3><p>{text}</p><span className="capability-link">Explore capability <ArrowUpRight size={14} /></span></article>)}</div>
        <p className="capability-note"><i />Capabilities are directional product descriptions. Provider integrations, predictive models, and autonomous agents are not represented as currently operational.</p>
      </section>

      <section className="workflow-section" id="how-it-works" aria-labelledby="workflow-title"><div className="section-wrap"><div className="section-intro centered"><span className="section-kicker">HOW IT WORKS</span><h2 id="workflow-title">A thoughtful path from<br />signal to action.</h2><p>People stay in control at each decision point.</p></div>
          <ol className="workflow-steps"><li><span className="step-index">01</span><span className="step-icon"><Radar size={19} /></span><h3>Detect signals</h3><p>Bring relevant buying context together.</p></li><li><span className="step-index">02</span><span className="step-icon"><Target size={19} /></span><h3>Qualify accounts</h3><p>Review fit and supporting evidence.</p></li><li><span className="step-index">03</span><span className="step-icon"><Sparkles size={19} /></span><h3>Recommend actions</h3><p>Surface a considered next step.</p></li><li><span className="step-index">04</span><span className="step-icon"><ShieldCheck size={19} /></span><h3>Approve execution</h3><p>Keep people in the approval loop.</p></li><li><span className="step-index">05</span><span className="step-icon"><Activity size={19} /></span><h3>Learn from outcomes</h3><p>Use feedback to inform future focus.</p></li></ol>
        </div></section>

      <section className="showcase-section section-wrap" aria-labelledby="showcase-title"><div className="showcase-copy"><span className="section-kicker">A CLOSER LOOK</span><h2 id="showcase-title">See the workflow<br />from every angle.</h2><p>Switch views to explore a conceptual sample of the workspace. Nothing here is connected to production.</p><div className="showcase-list"><span><Check size={15} />Evidence stays close to the signal</span><span><Check size={15} />Account fit is surfaced for review</span><span><Check size={15} />AI suggestions wait for approval</span></div></div>
        <div className="showcase-window"><div className="showcase-top"><span className="window-mark"><Command size={14} /></span><span>Revenue intelligence</span><span className="showcase-badge">DEMO VIEW</span></div><div className="showcase-inner"><div className="showcase-side"><i /><i /><i /><i /></div><div className="showcase-main"><div className="showcase-heading"><div><span>WORKSPACE SNAPSHOT</span><strong>{tabLabels[activeTab]}</strong></div><span className="concept-pill">ILLUSTRATIVE</span></div><div className="showcase-tablist" role="tablist" aria-label="Marketing product showcase">{tabOrder.map((tab) => <button key={tab} id={`showcase-tab-${tab}`} role="tab" aria-selected={activeTab === tab} aria-controls="showcase-panel" tabIndex={activeTab === tab ? 0 : -1} onClick={() => setActiveTab(tab)} onKeyDown={handleTabKey}>{tabLabels[tab]}</button>)}</div><div id="showcase-panel" role="tabpanel" aria-labelledby={`showcase-tab-${activeTab}`} className="showcase-content"><ProductMock tab={activeTab} /></div></div></div><div className="showcase-bottom"><span><i />Illustrative only</span><span>No live workspace data</span></div></div>
      </section>

      <section className="pricing-section" id="pricing" aria-labelledby="pricing-title"><div className="section-wrap"><div className="section-intro centered"><span className="section-kicker">PROPOSED WORKSPACE PLANS</span><h2 id="pricing-title">A plan for your next stage.</h2><p>Launch pricing hypotheses for planning—not finalized commercial terms.</p></div>
        <div className="pricing-grid">{plans.map((plan) => <article className={`pricing-card${plan.featured ? " recommended" : ""}`} key={plan.key}>{plan.featured && <span className="recommended-label">RECOMMENDED</span>}<div className="pricing-card-head"><div><h3>{plan.name}</h3><span>Workspace plan</span></div><span className="plan-icon"><Database size={17} /></span></div><p className="plan-price"><strong>{plan.price}</strong><span>/ month</span></p><p className="plan-seats">{plan.seats}</p><div className="plan-divider"/><ul>{plan.features.map((feature) => <li key={feature}><CircleCheck size={15} />{feature}</li>)}</ul><p className="trial-note">7-day free trial · No payment method required</p><Link className={`button ${plan.featured ? "button-primary" : "button-outline"}`} to={signupLink(plan.key)}>Start free trial <ArrowRight size={15} /></Link></article>)}</div>
        <p className="pricing-disclaimer">Prices are launch hypotheses, not finalized commercial terms. Taxes, usage limits, and final plan entitlements may vary or be confirmed before purchase. Plan selection does not activate a trial or grant subscription access.</p>
      </div></section>

      <section className="faq-section section-wrap" aria-labelledby="faq-title"><div className="faq-intro"><span className="section-kicker">GOOD TO KNOW</span><h2 id="faq-title">Questions, answered<br />with clarity.</h2><p>Billing and signup are not yet connected. These answers distinguish the intended trial from what is currently available.</p></div><div className="faq-list">{faqs.map(({ q, a }) => <details key={q}><summary>{q}<ChevronDown size={17} /></summary><p>{a}</p></details>)}</div></section>

      <section className="final-cta"><div className="final-cta-orb" aria-hidden="true" /><div className="final-cta-content"><span className="section-kicker">MAKE THE NEXT MOVE COUNT</span><h2>Turn revenue signals into<br />your next best action.</h2><p>Start with a clearer view of the accounts and context that matter.</p><Link className="button button-primary" to={signupLink("growth")}>Start 7-day free trial <ArrowRight size={17} /></Link><small>7-day free trial · No payment method required</small></div></section>
    </main>

    <footer className="marketing-footer"><div className="footer-main"><Link className="marketing-brand" to="/" aria-label="Revenue Workspace home"><span className="marketing-brand-icon"><Activity size={17} /></span><span>Revenue<span className="brand-light"> Intelligence</span></span></Link><p>Find the signal. Win the account.</p><nav aria-label="Footer navigation"><a href="#platform">Platform</a><a href="#pricing">Pricing</a><Link to="/login">Log in</Link><a href="#privacy">Privacy <small>not published</small></a><a href="#terms">Terms <small>not published</small></a><a href="#contact">Contact / support <small>details unavailable</small></a></nav></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Revenue Intelligence. Product preview.</span><span>Illustrative content · No live customer data</span></div></footer>
  </div>;
}

function LayoutMini() { return <Activity size={13} />; }
