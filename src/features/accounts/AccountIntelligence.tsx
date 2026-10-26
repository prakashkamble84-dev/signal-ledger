import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowDown, ArrowDownUp, ArrowLeft, ArrowUp, Building2, Check, ChevronDown, CirclePlus,
  Clock3, Edit3, ExternalLink, Filter, FileText, Link2, Plus, Search, StickyNote, X,
} from "lucide-react";
import { demoSignals, readLocal, writeLocal, type Qualification, type Signal } from "@/features/signals/signalData";
import { SignalDetail } from "@/features/signals/SignalExplorer";
import {
  accountLatestSignal, assessIcpFit, initialAccounts, loadAccountEvents, loadAccounts,
  loadSignalAccountAssociations, relatedSignals, saveAccountEvents, saveAccounts,
  saveSignalAccountAssociation, type Account, type AccountEvent, type AccountStatus,
} from "./accountData";
import "./accounts.css";

type AccountTab = "Overview" | "Signals" | "Activity" | "Notes";
type SortKey = "name" | "industry" | "companySize" | "region" | "fit" | "status" | "activity";
const statuses: AccountStatus[] = ["Target", "Researching", "Qualified", "Disqualified"];
const categories = (key: "industry" | "companySize" | "region") => [...new Set(initialAccounts.map((account) => account[key]).filter((value): value is string => Boolean(value)))];
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

function AccountStatusPill({ status }: { status: string }) { return <span className={`account-status ${status.toLowerCase()}`}>{status}</span>; }
function FitPill({ label }: { label: string }) { return <span className={`fit-pill ${label.toLowerCase().replace(/ /g, "-")}`}><span className="fit-symbol">{label === "Strong alignment" ? "●" : label === "Partial alignment" ? "◐" : label === "Limited alignment" ? "○" : "—"}</span>{label}</span>; }

function AccountForm({ account, prefill, onSave, onClose }: { account?: Account; prefill?: Partial<Account>; onSave: (fields: Partial<Account>) => void; onClose: () => void }) {
  const [name, setName] = useState(account?.name ?? prefill?.name ?? "");
  const [domain, setDomain] = useState(account?.domain ?? prefill?.domain ?? "");
  const [industry, setIndustry] = useState(account?.industry ?? prefill?.industry ?? "");
  const [companySize, setCompanySize] = useState(account?.companySize ?? prefill?.companySize ?? "");
  const [region, setRegion] = useState(account?.region ?? prefill?.region ?? "");
  const [description, setDescription] = useState(account?.description ?? prefill?.description ?? "");
  const [status, setStatus] = useState<AccountStatus>(account?.status ?? "Target");
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) { setError("Company name is required."); return; }
    onSave({ name: name.trim(), domain: domain.trim() || undefined, industry: industry || undefined, companySize: companySize || undefined, region: region || undefined, description: description.trim() || undefined, status });
  };
  return <div className="account-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><form className="account-modal" role="dialog" aria-modal="true" aria-labelledby="account-form-title" onSubmit={submit}>
    <div className="account-modal-head"><div><span className="account-eyebrow">ACCOUNT DETAILS</span><h2 id="account-form-title">{account ? "Edit account" : "Add an account"}</h2></div><button type="button" className="account-icon-button" onClick={onClose} aria-label="Close account form"><X size={19}/></button></div>
    <div className="account-form-grid"><label className="account-field field-wide">Company name *<input value={name} onChange={(event) => setName(event.target.value)} autoFocus required maxLength={100} placeholder="Company name"/></label><label className="account-field field-wide">Domain (optional)<input value={domain} onChange={(event) => setDomain(event.target.value)} maxLength={160} placeholder="company.example"/></label><label className="account-field">Industry<select value={industry} onChange={(event) => setIndustry(event.target.value)}><option value="">Not specified</option>{categories("industry").map((value) => <option key={value}>{value}</option>)}<option>Other</option></select></label><label className="account-field">Company size<select value={companySize} onChange={(event) => setCompanySize(event.target.value)}><option value="">Not specified</option>{categories("companySize").map((value) => <option key={value}>{value}</option>)}</select></label><label className="account-field">Region<select value={region} onChange={(event) => setRegion(event.target.value)}><option value="">Not specified</option>{categories("region").map((value) => <option key={value}>{value}</option>)}</select></label><label className="account-field">Qualification status<select value={status} onChange={(event) => setStatus(event.target.value as AccountStatus)}>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label><label className="account-field field-wide">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={400} placeholder="Optional account context"/></label></div>
    {error && <p className="account-form-error" role="alert">{error}</p>}<div className="account-modal-actions"><button type="button" className="account-secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="account-primary-button">{account ? "Save changes" : "Create account"}</button></div>
  </form></div>;
}

export default function AccountIntelligence({ accountId }: { accountId?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [accounts, setAccounts] = useState<Account[]>(() => loadAccounts());
  const [events, setEvents] = useState<AccountEvent[]>(() => loadAccountEvents());
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ industry: "", companySize: "", region: "", status: "", fit: "" });
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterOpen, setFilterOpen] = useState(false);
  const [formAccount, setFormAccount] = useState<Account | null | false>(false);
  const [tab, setTab] = useState<AccountTab>("Overview");
  const [noteText, setNoteText] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [signalSelected, setSignalSelected] = useState<Signal | null>(null);
  const [accountSignalStatuses, setAccountSignalStatuses] = useState<Record<string, Qualification>>(() => readLocal("signal-demo-qualifications", {}));
  const [shortlist, setShortlist] = useState<string[]>(() => readLocal("signal-demo-shortlist", []));
  const [associateId, setAssociateId] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [mobileFilters, setMobileFilters] = useState(false);
  const account = accounts.find((item) => item.id === accountId);
  const prefillSignal = demoSignals.find((signal) => signal.id === new URLSearchParams(location.search).get("signalId"));
  const activeCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => saveAccounts(accounts), [accounts]);
  useEffect(() => saveAccountEvents(events), [events]);
  useEffect(() => { if (!accountId && prefillSignal) setFormAccount(null); }, [accountId, prefillSignal]);
  useEffect(() => {
    if (!mobileFilters) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileFilters(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [mobileFilters]);

  const fitByAccount = useMemo(() => new Map(accounts.map((item) => [item.id, assessIcpFit(item)])), [accounts]);
  const directory = useMemo(() => accounts.filter((item) => {
    const q = query.trim().toLowerCase();
    const fit = fitByAccount.get(item.id)?.label ?? "Insufficient data";
    return (!q || [item.name, item.domain ?? "", item.industry ?? ""].some((value) => value.toLowerCase().includes(q)))
      && (!filters.industry || item.industry === filters.industry)
      && (!filters.companySize || item.companySize === filters.companySize)
      && (!filters.region || item.region === filters.region)
      && (!filters.status || item.status === filters.status)
      && (!filters.fit || fit === filters.fit);
  }).sort((a, b) => {
    const latestA = accountLatestSignal(a)?.observedAt ?? a.updatedAt;
    const latestB = accountLatestSignal(b)?.observedAt ?? b.updatedAt;
    const values: Record<SortKey, (item: Account) => string | number> = {
      name: (item) => item.name.toLowerCase(), industry: (item) => item.industry ?? "", companySize: (item) => item.companySize ?? "", region: (item) => item.region ?? "", fit: (item) => fitByAccount.get(item.id)?.score ?? -1, status: (item) => item.status, activity: (item) => item === a ? latestA : latestB,
    };
    const left = values[sortKey](a); const right = values[sortKey](b);
    const order = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right));
    return sortDirection === "asc" ? order : -order;
  }), [accounts, filters, fitByAccount, query, sortDirection, sortKey]);

  const recordEvent = (targetId: string, kind: AccountEvent["kind"], description: string) => setEvents((current) => [{ id: newId("event"), accountId: targetId, kind, description, recordedAt: new Date().toISOString() }, ...current]);
  const saveAccount = (fields: Partial<Account>) => {
    if (formAccount) {
      const existing = formAccount;
      if (accounts.some((item) => item.id !== existing.id && (item.name.trim().toLowerCase() === fields.name?.trim().toLowerCase() || Boolean(fields.domain && item.domain?.toLowerCase() === fields.domain.toLowerCase())))) { setAnnouncement("An account with that company name or domain already exists."); return; }
      setAccounts((current) => current.map((item) => item.id === existing.id ? { ...item, ...fields, updatedAt: new Date().toISOString() } : item));
      recordEvent(existing.id, "edit", "Account details updated"); setAnnouncement("Account details saved.");
    } else {
      const duplicate = accounts.some((item) => item.name.trim().toLowerCase() === fields.name?.trim().toLowerCase() || Boolean(fields.domain && item.domain?.toLowerCase() === fields.domain.toLowerCase()));
      if (duplicate) { setAnnouncement("An account with that company name or domain already exists."); return; }
      const created: Account = { id: newId("acct"), name: fields.name ?? "", domain: fields.domain, industry: fields.industry, companySize: fields.companySize, region: fields.region, description: fields.description, status: fields.status ?? "Target", associatedSignalIds: prefillSignal ? [prefillSignal.id] : [], notes: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDemo: true };
      if (prefillSignal) saveSignalAccountAssociation(prefillSignal.id, created.id);
      setAccounts((current) => [created, ...current]); recordEvent(created.id, "edit", "Account created locally"); if (prefillSignal) recordEvent(created.id, "association", `Associated illustrative signal: ${prefillSignal.headline}`); setAnnouncement("Account created in this browser."); navigate(`/accounts/${created.id}`);
    }
    setFormAccount(false);
  };

  const updateStatus = (targetId: string, status: AccountStatus) => {
    const prior = accounts.find((item) => item.id === targetId)?.status;
    setAccounts((current) => current.map((item) => item.id === targetId ? { ...item, status, updatedAt: new Date().toISOString() } : item));
    recordEvent(targetId, "qualification", `Status changed from ${prior ?? "unknown"} to ${status}`); setAnnouncement(`Account status changed to ${status}.`);
  };
  const saveNote = (target: Account) => {
    const text = noteText.trim(); if (!text) return;
    const now = new Date().toISOString();
    setAccounts((current) => current.map((item) => item.id !== target.id ? item : { ...item, notes: editingNote ? item.notes.map((note) => note.id === editingNote ? { ...note, text, updatedAt: now } : note) : [{ id: newId("note"), text, createdAt: now, updatedAt: now }, ...item.notes], updatedAt: now }));
    recordEvent(target.id, "note", editingNote ? "Account note edited" : "Account note added"); setNoteText(""); setEditingNote(null); setAnnouncement(editingNote ? "Note updated." : "Note added.");
  };
  const deleteNote = (target: Account, noteId: string) => {
    if (!window.confirm("Delete this note? This action cannot be undone.")) return;
    setAccounts((current) => current.map((item) => item.id === target.id ? { ...item, notes: item.notes.filter((note) => note.id !== noteId), updatedAt: new Date().toISOString() } : item));
    recordEvent(target.id, "note", "Account note deleted"); setAnnouncement("Note deleted.");
  };
  const associateSignal = (target: Account) => {
    if (!associateId || target.associatedSignalIds.includes(associateId)) return;
    const signal = demoSignals.find((item) => item.id === associateId); if (!signal) return;
    saveSignalAccountAssociation(signal.id, target.id);
    setAccounts((current) => current.map((item) => item.id === target.id ? { ...item, associatedSignalIds: [...item.associatedSignalIds, signal.id], updatedAt: new Date().toISOString() } : item));
    recordEvent(target.id, "association", `Associated illustrative signal: ${signal.headline}`); setAssociateId(""); setAnnouncement("Sample signal associated with account.");
  };
  const sort = (key: SortKey) => { setSortDirection((current) => sortKey === key && current === "asc" ? "desc" : "asc"); setSortKey(key); };
  const sortIcon = (key: SortKey) => sortKey !== key ? <ArrowDownUp size={13}/> : sortDirection === "asc" ? <ArrowUp size={13}/> : <ArrowDown size={13}/>;
  const setFilter = (key: keyof typeof filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));

  if (accountId && !account) return <div className="account-page"><div className="account-empty"><Building2 size={24}/><h1>Account not found</h1><p>This account is not available in this browser workspace.</p><button className="account-secondary-button" onClick={() => navigate("/accounts")}>Back to accounts</button></div></div>;
  if (!accountId) return <div className="account-page">
    <div className="account-page-heading"><div><span className="account-eyebrow">ACCOUNT INTELLIGENCE</span><h1>Accounts</h1><p>Understand your target companies and identify your next best opportunities.</p></div><div className="account-demo-pill"><span/>Illustrative sample data</div></div>
    <div className="account-directory-toolbar"><label className="account-search"><Search size={17}/><input aria-label="Search accounts by company, domain, or industry" placeholder="Search company, domain, or industry" value={query} onChange={(event) => setQuery(event.target.value)}/>{query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={15}/></button>}</label><button className="account-secondary-button account-mobile-filter" onClick={() => setMobileFilters(true)}><Filter size={15}/>Filters{activeCount > 0 && <span>{activeCount}</span>}</button><button className="account-primary-button" onClick={() => setFormAccount(null)}><Plus size={16}/>Add account</button></div>
    <div className="account-filter-strip"><label>Industry<select value={filters.industry} onChange={(event) => setFilter("industry", event.target.value)}><option value="">All industries</option>{categories("industry").map((item) => <option key={item}>{item}</option>)}</select></label><label>Company size<select value={filters.companySize} onChange={(event) => setFilter("companySize", event.target.value)}><option value="">All sizes</option>{categories("companySize").map((item) => <option key={item}>{item}</option>)}</select></label><label>Region<select value={filters.region} onChange={(event) => setFilter("region", event.target.value)}><option value="">All regions</option>{categories("region").map((item) => <option key={item}>{item}</option>)}</select></label><label>Status<select value={filters.status} onChange={(event) => setFilter("status", event.target.value)}><option value="">All statuses</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label><label>ICP fit<select value={filters.fit} onChange={(event) => setFilter("fit", event.target.value)}><option value="">All fit levels</option>{["Strong alignment", "Partial alignment", "Limited alignment", "Insufficient data"].map((item) => <option key={item}>{item}</option>)}</select></label>{activeCount > 0 && <button className="account-clear-filters" onClick={() => setFilters({ industry: "", companySize: "", region: "", status: "", fit: "" })}>Clear filters</button>}</div>
    <div className="account-results-heading"><div><h2>Account directory <span>{directory.length}</span></h2><p>Account fit reflects sample criteria, not purchase probability.</p></div></div>
    {directory.length === 0 ? <div className="account-empty"><Building2 size={23}/><h2>No accounts found</h2><p>Try changing your search or filters.</p><button className="account-secondary-button" onClick={() => { setQuery(""); setFilters({ industry: "", companySize: "", region: "", status: "", fit: "" }); }}>Clear search and filters</button></div> : <><div className="account-table-wrap"><table className="account-table"><thead><tr>{([["name", "Company"], ["industry", "Industry"], ["companySize", "Size"], ["region", "Region"], ["fit", "ICP fit"], ["status", "Status"], ["activity", "Latest signal"]] as [SortKey,string][]).map(([key,label]) => <th key={key}><button onClick={() => sort(key)}>{label}{sortIcon(key)}</button></th>)}<th><span className="sr-only">Row actions</span></th></tr></thead><tbody>{directory.map((item) => { const fit = fitByAccount.get(item.id)!; const latest = accountLatestSignal(item); return <tr key={item.id} tabIndex={0} onClick={() => navigate(`/accounts/${item.id}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate(`/accounts/${item.id}`); } }}><td><strong className="account-company-name">{item.name}</strong><span className="account-domain">{item.domain ?? "Domain not provided"}</span></td><td>{item.industry ?? "Not specified"}</td><td>{item.companySize ?? "Not specified"}</td><td>{item.region ?? "Not specified"}</td><td><FitPill label={fit.label}/></td><td><AccountStatusPill status={item.status}/></td><td><span className="latest-signal">{latest?.headline ?? "No linked signals"}</span><small>{latest?.observedAt ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(latest.observedAt)) : "No activity"}</small></td><td><button className="account-row-action" aria-label={`Open ${item.name}`} onClick={(event) => { event.stopPropagation(); navigate(`/accounts/${item.id}`); }}><ChevronDown size={17}/></button></td></tr>; })}</tbody></table></div><div className="account-mobile-list">{directory.map((item) => { const fit = fitByAccount.get(item.id)!; const latest = accountLatestSignal(item); return <article key={item.id} className="account-card"><div className="account-card-title"><div className="account-monogram">{item.name[0]}</div><div><strong>{item.name}</strong><span>{item.domain ?? "Domain not provided"}</span></div></div><div className="account-card-meta"><span>{item.industry ?? "Industry n/a"}</span><span>{item.companySize ?? "Size n/a"}</span><span>{item.region ?? "Region n/a"}</span></div><div className="account-card-tags"><FitPill label={fit.label}/><AccountStatusPill status={item.status}/></div><p>{latest?.headline ?? "No associated signals"}</p><button className="account-open-action" onClick={() => navigate(`/accounts/${item.id}`)}>Open account<ChevronDown size={15}/></button></article>; })}</div></>}
    <p className="account-local-note">Sample accounts and edits are stored in this browser only; not shared with a team.</p>
    {formAccount !== false && <AccountForm account={formAccount || undefined} prefill={prefillSignal ? { name: prefillSignal.company, domain: prefillSignal.domain, industry: prefillSignal.industry, companySize: prefillSignal.companySize, region: prefillSignal.region, description: `Created from an illustrative sample signal: ${prefillSignal.headline}` } : undefined} onSave={saveAccount} onClose={() => setFormAccount(false)}/>}
    {mobileFilters && <div className="account-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setMobileFilters(false); }}><div className="account-filter-dialog" role="dialog" aria-modal="true" aria-labelledby="mobile-account-filter-title"><div className="account-modal-head"><h2 id="mobile-account-filter-title">Filter accounts</h2><button className="account-icon-button" onClick={() => setMobileFilters(false)} aria-label="Close filters"><X size={19}/></button></div>{([ ["industry", "Industry", categories("industry")], ["companySize", "Company size", categories("companySize")], ["region", "Region", categories("region")], ["status", "Status", statuses], ["fit", "ICP fit", ["Strong alignment", "Partial alignment", "Limited alignment", "Insufficient data"]] ] as [keyof typeof filters,string,string[]][]).map(([key,label,options]) => <label className="account-field" key={key}>{label}<select value={filters[key]} onChange={(event) => setFilter(key,event.target.value)}><option value="">All</option>{options.map((value) => <option key={value}>{value}</option>)}</select></label>)}<button className="account-primary-button" onClick={() => setMobileFilters(false)}>Show {directory.length} accounts</button></div></div>}
  </div>;

  const related = relatedSignals(account);
  const links = loadSignalAccountAssociations();
  const unlinked = demoSignals.filter((signal) => !signal.accountId && !links[signal.id] && !accounts.some((item) => item.associatedSignalIds.includes(signal.id)));
  const accountEvents = events.filter((item) => item.accountId === account.id);
  const addAccountNote = () => saveNote(account);
  const renderSignalLink = (signal: Signal) => <article className="account-signal-item" key={signal.id}><div><span className="signal-category-label">{signal.category}</span><h3>{signal.headline}</h3><p>{signal.evidence}</p><div className="account-signal-meta"><span>{signal.sourceLabel}</span><span>Observed {signal.observedAt ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(signal.observedAt)) + " UTC" : "date unknown"}</span></div></div><button className="account-secondary-button" onClick={() => setSignalSelected(signal)}>View evidence</button></article>;
  return <div className="account-page account-profile-page">
    <button className="account-back-link" onClick={() => navigate("/accounts")}><ArrowLeft size={15}/>Accounts</button>
    <div className="account-profile-head"><div className="account-profile-id"><span className="account-monogram large">{account.name[0]}</span><div><div className="account-profile-title"><h1>{account.name}</h1><span className="profile-demo-label">Sample account</span></div><div className="account-subtitle">{account.domain ?? "Domain not provided"}{account.websiteUrl && <a href={account.websiteUrl} target="_blank" rel="noreferrer" aria-label="Open verified company website"><ExternalLink size={13}/></a>}<span>·</span>{account.industry ?? "Industry unspecified"}<span>·</span>{account.companySize ?? "Size unspecified"}<span>·</span>{account.region ?? "Region unspecified"}</div></div></div><div className="account-profile-actions"><button className="account-secondary-button" onClick={() => setFormAccount(account)}><Edit3 size={15}/>Edit account</button><label className="account-next-action">Next action<select value={account.status} onChange={(event) => updateStatus(account.id, event.target.value as AccountStatus)} aria-label="Change account qualification status">{statuses.map((item) => <option key={item}>{item}</option>)}</select></label></div></div>
    <div className="account-profile-summary"><div><span>ICP fit</span><FitPill label={fitByAccount.get(account.id)?.label ?? "Insufficient data"}/></div><div><span>Qualification</span><AccountStatusPill status={account.status}/></div><div><span>Associated signals</span><strong>{related.length}</strong></div><div><span>Last updated</span><strong>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(account.updatedAt))}</strong></div></div>
    <div className="account-tablist" role="tablist" aria-label="Account details">{(["Overview", "Signals", "Activity", "Notes"] as AccountTab[]).map((item) => <button key={item} role="tab" tabIndex={tab === item ? 0 : -1} aria-selected={tab === item} className={tab === item ? "active" : ""} onKeyDown={(event) => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); const buttons = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]") ?? []); const index = buttons.indexOf(event.currentTarget); const next = buttons[(index + (event.key === "ArrowRight" ? 1 : buttons.length - 1)) % buttons.length]; next?.focus(); next?.click(); } }} onClick={() => setTab(item)}>{item}{item === "Signals" && <span>{related.length}</span>}{item === "Notes" && <span>{account.notes.length}</span>}</button>)}</div>
    <section className="account-tab-content" role="tabpanel" aria-label={`${tab} for ${account.name}`}>
      {tab === "Overview" && <div className="account-overview-grid"><div className="account-panel account-company-panel"><div className="account-section-head"><div><h2>Company overview</h2><p>Illustrative record details</p></div></div><p className="account-description">{account.description || "No company description has been added."}</p><dl className="account-facts"><div><dt>Industry</dt><dd>{account.industry ?? "Not specified"}</dd></div><div><dt>Company size</dt><dd>{account.companySize ?? "Not specified"}</dd></div><div><dt>Headquarters / region</dt><dd>{account.region ?? "Not specified"}</dd></div><div><dt>Website</dt><dd>{account.websiteUrl ? <a href={account.websiteUrl} target="_blank" rel="noreferrer">{account.websiteUrl}</a> : "Not provided"}</dd></div><div><dt>Account owner</dt><dd>{account.owner ?? "Unassigned"}</dd></div><div><dt>Data provenance</dt><dd>Illustrative local sample</dd></div></dl></div><div className="account-panel fit-panel"><div className="account-section-head"><div><h2>ICP fit assessment</h2><p>Rule-based alignment · not close probability</p></div><FitPill label={fitByAccount.get(account.id)?.label ?? "Insufficient data"}/></div>{fitByAccount.get(account.id)?.score !== null && <div className="fit-score"><strong>{fitByAccount.get(account.id)?.score}</strong><span>/ 90 sample alignment points</span></div>}<p className="fit-explainer">Fit compares recorded firmographics with the illustrative target profile. Buying intent is assessed separately in Signals.</p><ul className="fit-factor-list">{fitByAccount.get(account.id)?.factors.map((factor) => <li key={factor.name}><span className={factor.points === null ? "factor-unknown" : factor.points > 0 ? "factor-match" : "factor-mismatch"}>{factor.points === null ? "?" : factor.points > 0 ? "✓" : "−"}</span><div><strong>{factor.name}{factor.points !== null && <em>{factor.points}/ {factor.name === "Industry alignment" ? "40" : factor.name === "Company size" ? "30" : "20"}</em>}</strong><p>{factor.explanation}</p></div></li>)}</ul><p className="criteria-note">Sample target criteria: Software, Business services, Financial services · 51+ employees · North America or Europe.</p></div><div className="account-panel account-notes-preview"><div className="account-section-head"><div><h2>Account notes</h2><p>{account.notes.length ? `${account.notes.length} local note${account.notes.length === 1 ? "" : "s"}` : "No notes yet"}</p></div><button className="account-text-action" onClick={() => setTab("Notes")}><StickyNote size={14}/>Manage notes</button></div>{account.notes.slice(0,2).map((note) => <p className="note-preview" key={note.id}>{note.text}</p>)}{account.notes.length === 0 && <p className="subtle-copy">Add private context for your team. Notes stay in this browser demo.</p>}</div></div>}
      {tab === "Signals" && <div className="account-panel account-signals-panel"><div className="account-section-head"><div><h2>Associated signals</h2><p>Shared sample records from Signal Explorer</p></div></div>{related.length ? related.map(renderSignalLink) : <div className="account-empty compact"><Link2 size={20}/><p>No signals are associated with this account yet.</p></div>}{unlinked.length > 0 && <div className="associate-signal"><label>Associate existing unlinked sample signal<select value={associateId} onChange={(event) => setAssociateId(event.target.value)}><option value="">Choose a signal</option>{unlinked.map((signal) => <option key={signal.id} value={signal.id}>{signal.company} — {signal.headline}</option>)}</select></label><button className="account-secondary-button" disabled={!associateId} onClick={() => associateSignal(account)}><Link2 size={14}/>Associate</button><p>This links the existing signal record; it does not duplicate or verify it.</p></div>}</div>}
      {tab === "Activity" && <div className="account-panel activity-panel"><div className="account-section-head"><div><h2>Account activity</h2><p>Observed sample signal dates and locally recorded actions</p></div></div><div className="activity-timeline">{[...related.map((signal) => ({ id: signal.id, date: signal.observedAt ?? signal.createdAt, kind: "signal", text: signal.headline, source: signal.observedAt ? "Observed date from illustrative sample" : "Record creation date; observation time unknown" })), ...accountEvents.map((event) => ({ id: event.id, date: event.recordedAt, kind: event.kind, text: event.description, source: "Recorded locally in this browser" }))].sort((a,b) => b.date.localeCompare(a.date)).map((entry) => <div className="activity-item" key={entry.id}><span className={`activity-marker ${entry.kind}`}>{entry.kind === "signal" ? <CirclePlus size={14}/> : <Clock3 size={14}/>}</span><div><strong>{entry.text}</strong><span>{entry.source}</span><time>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(entry.date))} UTC</time></div></div>)}{!related.length && !accountEvents.length && <p className="subtle-copy">No activity recorded for this account.</p>}</div></div>}
      {tab === "Notes" && <div className="account-panel notes-panel"><div className="account-section-head"><div><h2>Notes</h2><p>Private to this browser demo</p></div></div><form className="note-compose" onSubmit={(event) => { event.preventDefault(); addAccountNote(); }}><label htmlFor="account-note-input">{editingNote ? "Edit note" : "Add a note"}</label><textarea id="account-note-input" value={noteText} onChange={(event) => setNoteText(event.target.value)} maxLength={1000} rows={4} placeholder="Record useful account context…"/><div><span>{noteText.length}/1000</span><button type="submit" className="account-primary-button" disabled={!noteText.trim()}>{editingNote ? "Save note" : "Add note"}</button></div></form>{account.notes.length ? <div className="account-notes-list">{account.notes.map((note) => <article className="account-note" key={note.id}><div><p>{note.text}</p><time>Updated {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(note.updatedAt))}</time></div><div><button className="account-icon-button" onClick={() => { setEditingNote(note.id); setNoteText(note.text); }} aria-label="Edit note"><Edit3 size={15}/></button><button className="account-icon-button delete-note" onClick={() => deleteNote(account,note.id)} aria-label="Delete note"><X size={16}/></button></div></article>)}</div> : <p className="subtle-copy notes-empty"><FileText size={17}/>No notes have been added.</p>}</div>}
    </section>
    <p className="account-local-note">Account edits, qualification changes, notes, and signal associations are stored only in this browser.</p>
    {formAccount !== false && <AccountForm account={formAccount || undefined} onSave={saveAccount} onClose={() => setFormAccount(false)}/>}
    {signalSelected && <SignalDetail signal={signalSelected} qualification={accountSignalStatuses[signalSelected.id] ?? signalSelected.qualification} shortlisted={shortlist.includes(signalSelected.id)} onClose={() => setSignalSelected(null)} onQualification={(value) => { const next = { ...accountSignalStatuses, [signalSelected.id]: value }; setAccountSignalStatuses(next); writeLocal("signal-demo-qualifications", next); setAnnouncement(`Signal marked ${value.toLowerCase()}.`); }} onShortlist={() => { const next = shortlist.includes(signalSelected.id) ? shortlist.filter((id) => id !== signalSelected.id) : [...shortlist, signalSelected.id]; setShortlist(next); writeLocal("signal-demo-shortlist", next); setAnnouncement("Signal shortlist updated."); }} announce={setAnnouncement}/>}
    <div className="sr-only" role="status" aria-live="polite">{announcement}</div>
  </div>;
}
