import { useEffect, useMemo, useState } from "react";
import "./signals.css";
import {
  ArrowDown, ArrowDownUp, ArrowUp, Bookmark, Check, ChevronDown, CircleHelp, Clock3,
  Copy, ExternalLink, Filter, ListFilter, Search, SlidersHorizontal, Star, X,
} from "lucide-react";
import {
  demoSignals, emptyFilters, filterSignals, getFreshness, readLocal, signalCategories,
  signalIndustries, signalRegions, signalSizes, writeLocal,
  type Freshness, type Qualification, type SavedView, type Signal, type SignalFilters,
} from "./signalData";

type SortKey = "company" | "headline" | "relevance" | "observedAt";
type SortDirection = "asc" | "desc";
const qualificationOptions: Qualification[] = ["Unreviewed", "For review", "Relevant", "Not relevant"];
const freshnessOptions: Freshness[] = ["Recent", "Aging", "Stale", "Unknown"];

function StatusTag({ value, kind }: { value: string; kind: "relevance" | "freshness" | "qualification" }) {
  const style = kind === "relevance" ? value.toLowerCase() : value.toLowerCase().replace(/ /g, "-");
  return <span className={`signal-tag ${kind} ${style}`}>{kind === "relevance" && <span className="tag-dot" />}{value}</span>;
}

function SignalFiltersPanel({ filters, setFilters, clear, onClose, mobile = false }: { filters: SignalFilters; setFilters: (filters: SignalFilters) => void; clear: () => void; onClose?: () => void; mobile?: boolean }) {
  const update = (key: keyof SignalFilters, value: string) => setFilters({ ...filters, [key]: value });
  return <div className={`signal-filters${mobile ? " mobile-filter-content" : ""}`}>
    <div className="filter-heading"><div><SlidersHorizontal size={16} /><strong id={mobile ? "mobile-filter-title" : undefined}>Filters</strong></div>{mobile && <button className="signals-icon-button" onClick={onClose} aria-label="Close filters"><X size={19} /></button>}</div>
    <label className="filter-field"><span>Category</span><select value={filters.category} onChange={(e) => update("category", e.target.value)}><option value="">All categories</option>{signalCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="filter-field"><span>Industry</span><select value={filters.industry} onChange={(e) => update("industry", e.target.value)}><option value="">All industries</option>{signalIndustries.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="filter-field"><span>Company size</span><select value={filters.size} onChange={(e) => update("size", e.target.value)}><option value="">All sizes</option>{signalSizes.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="filter-field"><span>Region</span><select value={filters.region} onChange={(e) => update("region", e.target.value)}><option value="">All regions</option>{signalRegions.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="filter-field"><span>Relevance</span><select value={filters.relevance} onChange={(e) => update("relevance", e.target.value)}><option value="">All levels</option>{["High", "Medium", "Low"].map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="filter-field"><span>Freshness</span><select value={filters.freshness} onChange={(e) => update("freshness", e.target.value)}><option value="">Any age</option>{freshnessOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="filter-field"><span>Qualification</span><select value={filters.qualification} onChange={(e) => update("qualification", e.target.value)}><option value="">Any status</option>{qualificationOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
    <button className="clear-filters" onClick={clear} disabled={Object.values(filters).every((value) => !value)}><X size={14} />Clear all filters</button>
  </div>;
}

function SignalDetail({ signal, qualification, shortlisted, onClose, onQualification, onShortlist, announce }: { signal: Signal; qualification: Qualification; shortlisted: boolean; onClose: () => void; onQualification: (value: Qualification) => void; onShortlist: () => void; announce: (message: string) => void }) {
  useEffect(() => {
    const panel = document.querySelector<HTMLElement>(".signal-detail");
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>('button, select, a[href], input, [tabindex="0"]') ?? []).filter((item) => !item.hasAttribute("disabled"));
    focusable()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const items = focusable();
        if (!items.length) return;
        if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items[items.length - 1].focus(); }
        else if (!event.shiftKey && document.activeElement === items[items.length - 1]) { event.preventDefault(); items[0].focus(); }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);
  const observed = signal.observedAt ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(signal.observedAt)) + " UTC" : "Unknown";
  const copySource = async () => {
    if (!signal.sourceUrl) return;
    try { await navigator.clipboard.writeText(signal.sourceUrl); announce("Source URL copied."); } catch { announce("Could not copy the source URL."); }
  };
  return <div className="signal-detail-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <aside className="signal-detail" role="dialog" aria-modal="true" aria-labelledby="signal-detail-title">
      <div className="detail-top"><div><span className="detail-eyebrow">SIGNAL DETAILS</span><span className="demo-label"><span className="demo-dot" />Illustrative demo</span></div><button className="signals-icon-button" onClick={onClose} aria-label="Close signal details"><X size={20} /></button></div>
      <div className="detail-scroll"><div className="detail-company"><span className="company-monogram">{signal.company[0]}</span><div><strong>{signal.company}</strong><span>{signal.domain ?? "Domain not provided"} · {signal.industry}</span></div></div>
        <StatusTag value={signal.category} kind="qualification" />
        <h2 id="signal-detail-title" className="detail-title">{signal.headline}</h2>
        <div className="detail-tags"><StatusTag value={signal.relevance + " relevance"} kind="relevance" /><StatusTag value={getFreshness(signal.observedAt)} kind="freshness" /></div>
        <section className="detail-section evidence-section"><h3>Observed evidence</h3><p>{signal.evidence}</p><div className="source-row"><span><ExternalLink size={14} />{signal.sourceLabel}</span>{signal.sourceUrl && <button className="inline-action" onClick={copySource}><Copy size={13} />Copy URL</button>}</div></section>
        <section className="detail-section interpretation-section"><h3><CircleHelp size={15} />Why this may matter</h3><p>{signal.interpretation}</p><span className="interpretation-note">Illustrative interpretation — not a source statement</span></section>
        <section className="detail-section recommendation-section"><h3>Suggested next step</h3><p>{signal.recommendation}</p><span className="interpretation-note">Suggested action for human review</span></section>
        <div className="detail-metadata"><div><span>Observed</span><strong><Clock3 size={14} />{observed}</strong></div><div><span>Company size</span><strong>{signal.companySize} employees</strong></div><div><span>Region</span><strong>{signal.region}</strong></div><div><span>Relevance</span><strong>{signal.relevance} · illustrative score {signal.illustrativeScore}</strong></div><div><span>Record created</span><strong>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(signal.createdAt))} UTC</strong></div></div>
        <label className="detail-qualification">Qualification status<select value={qualification} onChange={(e) => onQualification(e.target.value as Qualification)}>{qualificationOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <div className="detail-actions"><button className={`signal-secondary-button${shortlisted ? " is-saved" : ""}`} onClick={onShortlist}><Bookmark size={16} fill={shortlisted ? "currentColor" : "none"} />{shortlisted ? "Remove from shortlist" : "Save to shortlist"}</button><button className="signal-primary-button" onClick={() => onQualification("Relevant")}><Check size={16} />Mark relevant</button></div>
    </aside>
  </div>;
}

function SavedViews({ views, onApply, onRemove, onSave }: { views: SavedView[]; onApply: (view: SavedView) => void; onRemove: (id: string) => void; onSave: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  return <div className="saved-views-wrap">
    <button className="signal-secondary-button saved-view-trigger" onClick={() => setOpen(!open)} aria-expanded={open}><Bookmark size={15} />Saved views<ChevronDown size={14} /></button>
    {open && <div className="saved-views-popover"><div className="saved-popover-head"><strong>Saved views</strong><span>Saved on this device</span></div>
      {views.length === 0 ? <p className="saved-empty">No saved views yet.</p> : views.map((view) => <div className="saved-view-row" key={view.id}><button className="saved-view-name" onClick={() => { onApply(view); setOpen(false); }}>{view.name}</button><button className="remove-view" onClick={() => onRemove(view.id)} aria-label={`Remove saved view ${view.name}`}><X size={14} /></button></div>)}
      {creating ? <form className="save-view-form" onSubmit={(event) => { event.preventDefault(); if (name.trim()) { onSave(name.trim()); setName(""); setCreating(false); setOpen(false); } }}><label htmlFor="saved-view-name">View name</label><input id="saved-view-name" value={name} onChange={(event) => setName(event.target.value)} autoFocus maxLength={36} required placeholder="e.g. Recent high relevance"/><div><button type="button" className="small-text-button" onClick={() => setCreating(false)}>Cancel</button><button type="submit" className="small-primary-button">Save view</button></div></form> : <button className="create-view-button" onClick={() => setCreating(true)}><span>+</span>Save current filters</button>}
    </div>}
  </div>;
}

const formatDate = (value?: string) => value ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value)) : "Unknown";

export default function SignalExplorer() {
  const [filters, setFilters] = useState<SignalFilters>(emptyFilters);
  const [qualifications, setQualifications] = useState<Record<string, Qualification>>(() => readLocal("signal-demo-qualifications", {}));
  const [shortlist, setShortlist] = useState<string[]>(() => readLocal("signal-demo-shortlist", []));
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => readLocal("signal-demo-saved-views", []));
  const [selected, setSelected] = useState<Signal | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("observedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filterDrawer, setFilterDrawer] = useState(false);
  const [shortlistOnly, setShortlistOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [announcement, setAnnouncement] = useState("");
  const perPage = 8;

  useEffect(() => writeLocal("signal-demo-qualifications", qualifications), [qualifications]);
  useEffect(() => writeLocal("signal-demo-shortlist", shortlist), [shortlist]);
  useEffect(() => writeLocal("signal-demo-saved-views", savedViews), [savedViews]);
  useEffect(() => {
    if (!filterDrawer) return;
    const drawer = document.querySelector<HTMLElement>(".filter-drawer");
    const focusable = () => Array.from(drawer?.querySelectorAll<HTMLElement>('button, select, input, [tabindex="0"]') ?? []).filter((item) => !item.hasAttribute("disabled"));
    focusable()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFilterDrawer(false);
      if (event.key === "Tab") {
        const items = focusable();
        if (!items.length) return;
        if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items[items.length - 1].focus(); }
        else if (!event.shiftKey && document.activeElement === items[items.length - 1]) { event.preventDefault(); items[0].focus(); }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [filterDrawer]);
  const filtered = useMemo(() => filterSignals(demoSignals, filters, qualifications).filter((signal) => !shortlistOnly || shortlist.includes(signal.id)), [filters, qualifications, shortlist, shortlistOnly]);
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const left = a[sortKey] ?? ""; const right = b[sortKey] ?? "";
    const result = sortKey === "relevance" ? ({ High: 3, Medium: 2, Low: 1 }[String(left)] - { High: 3, Medium: 2, Low: 1 }[String(right)]) : String(left).localeCompare(String(right));
    return (sortDirection === "asc" ? result : -result);
  }), [filtered, sortKey, sortDirection]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / perPage));
  const visible = sorted.slice((page - 1) * perPage, page * perPage);
  const updateFilter = (value: SignalFilters) => { setFilters(value); setPage(1); };
  const setQualification = (id: string, value: Qualification) => { setQualifications((current) => ({ ...current, [id]: value })); setAnnouncement(`Signal marked ${value.toLowerCase()}.`); };
  const toggleShortlist = (id: string) => { const exists = shortlist.includes(id); setShortlist((current) => exists ? current.filter((item) => item !== id) : [...current, id]); setAnnouncement(exists ? "Removed from shortlist." : "Saved to shortlist."); };
  const setSort = (key: SortKey) => { setSortDirection(sortKey === key && sortDirection === "asc" ? "desc" : "asc"); setSortKey(key); };
  const saveView = (name: string) => { const view = { id: crypto.randomUUID(), name, filters: { ...filters } }; setSavedViews((current) => [...current, view]); setAnnouncement(`Saved view ${name}.`); };
  const applyView = (view: SavedView) => { updateFilter(view.filters); setShortlistOnly(false); setAnnouncement(`Applied saved view ${view.name}.`); };
  const countActive = Object.values(filters).filter(Boolean).length + (shortlistOnly ? 1 : 0);
  const activeFilterEntries = (Object.entries(filters) as [keyof SignalFilters, string][]).filter(([, value]) => Boolean(value));
  const sortIcon = (key: SortKey) => sortKey !== key ? <ArrowDownUp size={13} /> : sortDirection === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />;

  return <div className="signal-page">
    <div className="signal-page-heading"><div><div className="eyebrow">DISCOVER & QUALIFY</div><h1>Signal Explorer</h1><p className="page-description">Find potential buying intent and identify accounts worth a closer look.</p></div><span className="demo-banner"><span className="demo-dot" />Illustrative demo data</span></div>
    <div className="signal-toolbar"><label className="signal-search"><Search size={17} /><input value={filters.query} onChange={(event) => updateFilter({ ...filters, query: event.target.value })} placeholder="Search company, signal, or keyword" aria-label="Search company, signal, or keyword"/><kbd>/</kbd>{filters.query && <button onClick={() => updateFilter({ ...filters, query: "" })} aria-label="Clear search"><X size={15}/></button>}</label>
      <div className="signal-toolbar-actions"><SavedViews views={savedViews} onApply={applyView} onRemove={(id) => setSavedViews((current) => current.filter((view) => view.id !== id))} onSave={saveView}/><button className={`signal-secondary-button filter-toggle${countActive ? " has-active" : ""}`} onClick={() => setFilterDrawer(true)}><Filter size={15}/>Filters{countActive > 0 && <span className="filter-count">{countActive}</span>}</button><button className={`signal-secondary-button shortlist-toggle${shortlistOnly ? " is-saved" : ""}`} onClick={() => { setShortlistOnly(!shortlistOnly); setPage(1); }}><Star size={15} fill={shortlistOnly ? "currentColor" : "none"}/><span>Shortlist</span><span className="shortlist-count">{shortlist.length}</span></button></div>
    </div>
    {(activeFilterEntries.length > 0 || shortlistOnly) && <div className="active-signal-filters" aria-label="Active filters">{shortlistOnly && <button onClick={() => setShortlistOnly(false)}>Shortlist only <X size={12}/></button>}{activeFilterEntries.map(([key, value]) => <button key={key} onClick={() => updateFilter({ ...filters, [key]: "" })}>{key === "query" ? `Search: ${value}` : `${key[0].toUpperCase()}${key.slice(1)}: ${value}`}<X size={12}/></button>)}<button className="active-clear" onClick={() => { updateFilter(emptyFilters); setShortlistOnly(false); }}>Clear all</button></div>}
    <div className="signal-summary" aria-label="Signal summary based on current results"><div><span>Signals in view</span><strong>{filtered.length}</strong><small>of {demoSignals.length} illustrative records</small></div><div><span>High relevance</span><strong>{filtered.filter((signal) => signal.relevance === "High").length}</strong><small>qualitative sample labels</small></div><div><span>Needs review</span><strong>{filtered.filter((signal) => ["Unreviewed", "For review"].includes(qualifications[signal.id] ?? signal.qualification)).length}</strong><small>unreviewed or marked for review</small></div></div>
    <div className="signals-content-grid"><aside className="desktop-filter-rail"><SignalFiltersPanel filters={filters} setFilters={updateFilter} clear={() => { updateFilter(emptyFilters); setShortlistOnly(false); }}/></aside><section className="signals-results" aria-labelledby="results-title"><div className="results-heading"><div><h2 id="results-title">Signal results <span>{filtered.length}</span></h2><p>Illustrative records only · no verified source connections</p></div><button className="compact-filter-button" onClick={() => setFilterDrawer(true)}><ListFilter size={16}/>Filters{countActive > 0 && <span>{countActive}</span>}</button></div>
      {filtered.length === 0 ? <div className="signals-empty"><span className="empty-filter-icon"><Search size={21}/></span><h3>No signals match these filters</h3><p>Try a different search or clear one or more filters.</p><button className="signal-secondary-button" onClick={() => { updateFilter(emptyFilters); setShortlistOnly(false); }}>Clear filters</button></div> : <>
        <div className="signals-table-wrap"><table className="signals-table"><thead><tr><th><button onClick={() => setSort("company")}>Company{sortIcon("company")}</button></th><th><button onClick={() => setSort("headline")}>Signal{sortIcon("headline")}</button></th><th>Evidence summary</th><th><button onClick={() => setSort("relevance")}>Relevance{sortIcon("relevance")}</button></th><th><button onClick={() => setSort("observedAt")}>Observed{sortIcon("observedAt")}</button></th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map((signal) => { const status = qualifications[signal.id] ?? signal.qualification; return <tr key={signal.id} className={selected?.id === signal.id ? "row-selected" : ""} onClick={() => setSelected(signal)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(signal); } }} aria-label={`${signal.company}: ${signal.headline}; open details`}><td><strong className="company-name">{signal.company}</strong><span className="company-industry">{signal.industry} · {signal.companySize}</span></td><td><span className="signal-title-cell">{signal.headline}</span><span className="signal-category-cell">{signal.category}</span></td><td><span className="evidence-cell">{signal.evidence}</span></td><td><StatusTag value={signal.relevance} kind="relevance"/><span className="score-note">Illustrative {signal.illustrativeScore}</span></td><td><span className="observed-date">{formatDate(signal.observedAt)}</span><StatusTag value={getFreshness(signal.observedAt)} kind="freshness"/></td><td><StatusTag value={status} kind="qualification"/></td><td><button className={`row-save${shortlist.includes(signal.id) ? " saved" : ""}`} title={shortlist.includes(signal.id) ? "Remove from shortlist" : "Save to shortlist"} aria-label={`${shortlist.includes(signal.id) ? "Remove from" : "Save to"} shortlist: ${signal.company}`} onClick={(event) => { event.stopPropagation(); toggleShortlist(signal.id); }}><Bookmark size={16} fill={shortlist.includes(signal.id) ? "currentColor" : "none"}/></button></td></tr>; })}</tbody></table></div>
        <div className="signals-mobile-list">{visible.map((signal) => { const status = qualifications[signal.id] ?? signal.qualification; return <article className="signal-mobile-card" key={signal.id}><div className="mobile-card-top"><div><strong>{signal.company}</strong><span>{signal.industry} · {signal.companySize}</span></div><button className={`row-save${shortlist.includes(signal.id) ? " saved" : ""}`} title={shortlist.includes(signal.id) ? "Remove from shortlist" : "Save to shortlist"} aria-label={`${shortlist.includes(signal.id) ? "Remove from" : "Save to"} shortlist: ${signal.company}`} onClick={() => toggleShortlist(signal.id)}><Bookmark size={17} fill={shortlist.includes(signal.id) ? "currentColor" : "none"}/></button></div><h3>{signal.headline}</h3><span className="signal-category-cell">{signal.category}</span><p>{signal.evidence}</p><div className="mobile-card-tags"><StatusTag value={signal.relevance} kind="relevance"/><StatusTag value={getFreshness(signal.observedAt)} kind="freshness"/><StatusTag value={status} kind="qualification"/></div><div className="mobile-card-bottom"><span>{formatDate(signal.observedAt)}</span><button className="text-action" onClick={() => setSelected(signal)}>View details<ChevronDown size={14}/></button></div></article>; })}</div>
        <div className="results-pagination"><span>Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, sorted.length)} of {sorted.length}</span><div><button className="pagination-button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><button className="pagination-button" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Next</button></div></div>
      </>}
    </section></div>
    <p className="local-storage-note">Demo actions and saved views are stored only in this browser. This workspace has no connected signal sources.</p>
    {filterDrawer && <div className="filter-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setFilterDrawer(false); }}><aside role="dialog" aria-modal="true" aria-labelledby="mobile-filter-title" className="filter-drawer"><SignalFiltersPanel filters={filters} setFilters={updateFilter} clear={() => { updateFilter(emptyFilters); setShortlistOnly(false); }} onClose={() => setFilterDrawer(false)} mobile/><button className="signal-primary-button filter-done" onClick={() => setFilterDrawer(false)}>Show {filtered.length} results</button></aside></div>}
    {selected && <SignalDetail signal={selected} qualification={qualifications[selected.id] ?? selected.qualification} shortlisted={shortlist.includes(selected.id)} onClose={() => setSelected(null)} onQualification={(value) => setQualification(selected.id, value)} onShortlist={() => toggleShortlist(selected.id)} announce={setAnnouncement}/>}
    <div className="sr-only" role="status" aria-live="polite">{announcement}</div>
  </div>;
}
