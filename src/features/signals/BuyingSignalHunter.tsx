import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Building2, ChevronDown, ChevronUp, CircleAlert, Clock3, FlaskConical, Search, X } from "lucide-react";
import { loadAccounts, type Account } from "@/features/accounts/accountData";
import { demoSignals, signalCategories, type Qualification, type Signal } from "./signalData";
import "./buying-signal-hunter.css";

type SearchStatus = "idle" | "searching" | "results" | "empty" | "cancelled";
type ResearchResult = { signal: Signal; discoveredAt: string; status: Qualification; accountId: string; expanded: boolean; dismissed: boolean };

export default function BuyingSignalHunter() {
  const [company, setCompany] = useState("");
  const [context, setContext] = useState("");
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const activeTimer = useRef<number | null>(null);
  const accounts = useMemo(() => loadAccounts(), []);
  const visibleResults = results.filter((result) => !result.dismissed);
  const canSearch = Boolean(question.trim() && status !== "searching");
  useEffect(() => () => { if (activeTimer.current !== null) window.clearTimeout(activeTimer.current); }, []);

  const runSearch = (event: FormEvent) => {
    event.preventDefault();
    if (!question.trim() || status === "searching") return;
    setResults([]);
    setStatus("searching");
    setAnnouncement("Searching the local illustrative sample records. No external search is being made.");
    activeTimer.current = window.setTimeout(() => {
      const terms = [company, context, question].join(" ").toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2);
      const matches = demoSignals.filter((signal) => {
        const categoryMatch = !category || signal.category === category;
        const haystack = [signal.company, signal.domain ?? "", signal.industry, signal.headline, signal.evidence, signal.category].join(" ").toLowerCase();
        const textMatch = !terms.length || terms.some((term) => haystack.includes(term));
        return categoryMatch && textMatch;
      });
      const discoveredAt = new Date().toISOString();
      const next = matches.map((signal) => ({ signal, discoveredAt, status: signal.qualification, accountId: signal.accountId ?? "", expanded: false, dismissed: false }));
      setResults(next);
      setStatus(next.length ? "results" : "empty");
      setAnnouncement(next.length ? `${next.length} illustrative sample record${next.length === 1 ? "" : "s"} found. No external search was made.` : "No illustrative sample records matched. No external search was made.");
      activeTimer.current = null;
    }, 450);
  };

  const cancelSearch = () => {
    if (activeTimer.current !== null) window.clearTimeout(activeTimer.current);
    activeTimer.current = null;
    setStatus("cancelled");
    setAnnouncement("Demo search cancelled.");
  };

  const updateResult = (id: string, update: Partial<ResearchResult>) => setResults((current) => current.map((result) => result.signal.id === id ? { ...result, ...update } : result));
  const dateLabel = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

  return <section className="hunter-panel" aria-labelledby="hunter-title">
    <div className="hunter-heading">
      <div className="hunter-heading-copy"><span className="hunter-icon"><FlaskConical size={17} /></span><div><div className="hunter-eyebrow">BUYING SIGNAL HUNTER · DEMO</div><h2 id="hunter-title">Research a buying signal</h2><p>Explore the sample records using your research context. This does not search the web.</p></div></div>
      <span className="hunter-mode"><span />Live Exa search not configured</span>
    </div>
    <div className="hunter-notice" role="note"><CircleAlert size={16} /><span>Demo mode only. Results are illustrative local examples, not verified company activity. Nothing is saved to Supabase.</span></div>
    <form className="hunter-form" onSubmit={runSearch}>
      <label>Company or domain <span className="hunter-optional">optional</span><input value={company} onChange={(event) => setCompany(event.target.value)} maxLength={160} placeholder="e.g. Example Co or example.com" /></label>
      <label>Industry or company context <span className="hunter-optional">optional</span><input value={context} onChange={(event) => setContext(event.target.value)} maxLength={300} placeholder="e.g. B2B software, expanding sales team" /></label>
      <label className="hunter-question">Research question or keywords <span aria-hidden="true">*</span><input value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={240} required placeholder="What potential buying signal are you investigating?" /></label>
      <label>Signal category <span className="hunter-optional">optional</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{signalCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <div className="hunter-form-actions"><span className="hunter-form-hint">Search is limited to {demoSignals.length} illustrative records.</span><div><button type="submit" className="hunter-run" disabled={!canSearch}><Search size={15} />Run demo research</button>{status === "searching" && <button type="button" className="hunter-cancel" onClick={cancelSearch}>Cancel</button>}</div></div>
    </form>

    <div className="hunter-feedback" aria-live="polite" role="status">
      {status === "idle" && <span>Enter a research question to inspect matching demo records.</span>}
      {status === "searching" && <span className="hunter-loading"><span className="hunter-spinner" />Searching local samples…</span>}
      {status === "cancelled" && <span>Demo search cancelled. No external request was made.</span>}
      {status === "empty" && <span>No sample records matched those inputs. Try broader terms or a different category.</span>}
      {status === "results" && <span>{visibleResults.length} result{visibleResults.length === 1 ? "" : "s"} · illustrative demo · not saved</span>}
    </div>

    {status === "results" && <div className="hunter-results" aria-label="Illustrative research results">
      {visibleResults.length === 0 && <p className="hunter-feedback">All illustrative results have been dismissed for this session.</p>}
      {visibleResults.map((result) => {
        const { signal } = result;
        const associated = accounts.find((account: Account) => account.id === result.accountId);
        return <article className="hunter-result" key={signal.id}>
          <div className="hunter-result-top"><div><span className="hunter-result-company">{signal.company}</span><span className="hunter-result-category">{signal.category}</span></div><span className="hunter-unsaved">Demo · unsaved</span></div>
          <h3>{signal.headline}</h3>
          <p className="hunter-evidence">{signal.evidence}</p>
          <div className="hunter-provenance"><span><Building2 size={13} />{signal.sourceLabel}</span><span><Clock3 size={13} />Discovered {dateLabel(result.discoveredAt)}</span>{signal.observedAt && <span>Sample observed date {dateLabel(signal.observedAt)}</span>}</div>
          <div className="hunter-rationale"><strong>Why it may be relevant</strong><p>{signal.interpretation}</p><span>Illustrative rationale only · relevance label: {signal.relevance} (not a validated score)</span></div>
          {result.expanded && <div className="hunter-evidence-detail"><strong>Evidence and source</strong><p>{signal.evidence}</p><p className="hunter-no-source">No source URL or verified publisher is available for this illustrative record. No publication date was provided.</p></div>}
          <div className="hunter-result-controls"><label>Review status<select value={result.status} onChange={(event) => updateResult(signal.id, { status: event.target.value as Qualification })}><option>Unreviewed</option><option>For review</option><option>Relevant</option><option>Not relevant</option></select></label><label>Associate with account<select value={result.accountId} onChange={(event) => updateResult(signal.id, { accountId: event.target.value })}><option value="">No account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>{associated && <span className="hunter-associated-note">Draft association: {associated.name} · session only</span>}</div>
          <div className="hunter-result-actions"><button type="button" className="hunter-text-action" onClick={() => updateResult(signal.id, { expanded: !result.expanded })}>{result.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}{result.expanded ? "Hide evidence" : "Inspect evidence"}</button><button type="button" className="hunter-text-action hunter-dismiss" onClick={() => { updateResult(signal.id, { dismissed: true }); setAnnouncement("Illustrative result hidden for this session. No data was saved."); }}>{result.status === "Not relevant" ? "Dismiss sample" : "Dismiss"}<X size={14} /></button></div>
        </article>;
      })}
    </div>}
    <div className="sr-only" role="status">{announcement}</div>
  </section>;
}
