export const signalCategories = [
  "Competitor alternatives",
  "Customer pain points",
  "Product or service requests",
  "Hiring or expansion",
  "Company news & strategic changes",
  "Technology or vendor changes",
] as const;

export type SignalCategory = (typeof signalCategories)[number];
export type Relevance = "High" | "Medium" | "Low";
export type Qualification = "Unreviewed" | "For review" | "Relevant" | "Not relevant";
export type Freshness = "Recent" | "Aging" | "Stale" | "Unknown";

export type Signal = {
  id: string;
  company: string;
  domain?: string;
  category: SignalCategory;
  headline: string;
  evidence: string;
  sourceLabel: string;
  sourceUrl?: string;
  observedAt?: string;
  createdAt: string;
  relevance: Relevance;
  illustrativeScore: number;
  industry: string;
  companySize: string;
  region: string;
  qualification: Qualification;
  isDemo: true;
  interpretation: string;
  recommendation: string;
};

const daysAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
const makeSignal = (signal: Omit<Signal, "createdAt" | "isDemo" | "sourceLabel"> & { ageDays?: number }) => ({
  ...signal,
  createdAt: daysAgo(0),
  isDemo: true as const,
  sourceLabel: "Illustrative sample — not a verified source",
  observedAt: signal.ageDays === undefined ? undefined : daysAgo(signal.ageDays),
});

export const demoSignals: Signal[] = [
  makeSignal({ id: "sig-01", company: "Fableworks (sample)", domain: "fableworks.example", category: "Technology or vendor changes", headline: "Evaluating a replacement for fragmented sales tools", evidence: "Illustrative scenario: a growing revenue team is reviewing whether to consolidate its prospecting and engagement tools.", relevance: "High", illustrativeScore: 91, industry: "Software", companySize: "201–500", region: "North America", qualification: "Unreviewed", ageDays: 1, interpretation: "A tool consolidation initiative may create an opening to discuss workflow fit and data quality.", recommendation: "Review the account context and validate whether a consolidation project is active before reaching out." }),
  makeSignal({ id: "sig-02", company: "Northwind Works (sample)", category: "Hiring or expansion", headline: "Adding sales leadership as the team expands", evidence: "Illustrative scenario: several commercial leadership roles are being added ahead of a planned regional expansion.", relevance: "High", illustrativeScore: 87, industry: "Manufacturing", companySize: "501–1,000", region: "Europe", qualification: "For review", ageDays: 3, interpretation: "New sales leadership and territory growth can indicate changing needs for account visibility.", recommendation: "Check whether the expansion is confirmed and identify the leader responsible for the new region." }),
  makeSignal({ id: "sig-03", company: "Juniper Ridge (sample)", category: "Customer pain points", headline: "Difficulty keeping account research current", evidence: "Illustrative scenario: a sales team has described inconsistent account notes and time-consuming manual research.", relevance: "Medium", illustrativeScore: 73, industry: "Business services", companySize: "51–200", region: "North America", qualification: "Relevant", ageDays: 9, interpretation: "Research friction may align with a need for a shared, current view of account context.", recommendation: "Ask how reps currently gather account context and which gaps have the largest impact." }),
  makeSignal({ id: "sig-04", company: "Kite & Harbor (sample)", category: "Competitor alternatives", headline: "Comparing alternatives to an incumbent platform", evidence: "Illustrative scenario: stakeholders are mapping requirements before a potential renewal decision.", relevance: "High", illustrativeScore: 89, industry: "Financial services", companySize: "1,001–5,000", region: "North America", qualification: "Unreviewed", ageDays: 2, interpretation: "An evaluation window may make requirements and switching criteria timely topics.", recommendation: "Validate the evaluation timeline and understand which outcomes matter to the buying group." }),
  makeSignal({ id: "sig-05", company: "Copperleaf Studio (sample)", category: "Product or service requests", headline: "Request for clearer visibility across buying groups", evidence: "Illustrative scenario: account teams want a simpler way to understand stakeholder changes across active opportunities.", relevance: "Medium", illustrativeScore: 68, industry: "Software", companySize: "51–200", region: "Asia Pacific", qualification: "For review", ageDays: 16, interpretation: "Stakeholder visibility needs can signal an opportunity to improve account planning.", recommendation: "Explore how the team tracks decision-makers today and where updates are being missed." }),
  makeSignal({ id: "sig-06", company: "Redwood Motion (sample)", category: "Company news & strategic changes", headline: "Restructuring commercial operations", evidence: "Illustrative scenario: a company is reorganizing regional teams and reviewing how commercial work is coordinated.", relevance: "Low", illustrativeScore: 48, industry: "Manufacturing", companySize: "201–500", region: "Europe", qualification: "Not relevant", ageDays: 42, interpretation: "A restructuring can change ownership and priorities, but the signal may be too broad without account context.", recommendation: "Do not prioritize unless a specific revenue operations initiative is confirmed." }),
  makeSignal({ id: "sig-07", company: "Bluevale Health (sample)", category: "Technology or vendor changes", headline: "Reviewing data governance across revenue systems", evidence: "Illustrative scenario: operations teams are assessing inconsistent records and access controls between commercial tools.", relevance: "High", illustrativeScore: 84, industry: "Healthcare", companySize: "1,001–5,000", region: "North America", qualification: "Unreviewed", ageDays: 6, interpretation: "Data governance work may open a conversation about trusted, usable revenue context.", recommendation: "Confirm the scope of the review and whether commercial data consistency is a priority." }),
  makeSignal({ id: "sig-08", company: "Alpine Thread (sample)", category: "Hiring or expansion", headline: "Entering a new market with a small sales team", evidence: "Illustrative scenario: a business is planning a first sales presence in a new market.", relevance: "Medium", illustrativeScore: 65, industry: "Retail", companySize: "11–50", region: "Europe", qualification: "Unreviewed", ageDays: 31, interpretation: "A new market can create a need for faster account discovery, although timing should be validated.", recommendation: "Ask about launch milestones and how the team will identify initial target accounts." }),
  makeSignal({ id: "sig-09", company: "Meridian Labs (sample)", category: "Customer pain points", headline: "Sales handoffs lose important account context", evidence: "Illustrative scenario: teams report that key account details are not consistently carried between prospecting and sales conversations.", relevance: "Low", illustrativeScore: 42, industry: "Business services", companySize: "51–200", region: "Asia Pacific", qualification: "Unreviewed", ageDays: undefined, interpretation: "Handoff friction may be relevant, but this sample has no observed date and should be validated.", recommendation: "Confirm whether the handoff issue is current before deciding whether to prioritize." }),
];

export function getFreshness(observedAt?: string): Freshness {
  if (!observedAt) return "Unknown";
  const days = (Date.now() - new Date(observedAt).getTime()) / 86400000;
  if (days <= 7) return "Recent";
  if (days <= 30) return "Aging";
  return "Stale";
}

export const signalIndustries = [...new Set(demoSignals.map((signal) => signal.industry))];
export const signalRegions = [...new Set(demoSignals.map((signal) => signal.region))];
export const signalSizes = [...new Set(demoSignals.map((signal) => signal.companySize))];

export type SignalFilters = {
  query: string;
  category: string;
  industry: string;
  size: string;
  region: string;
  relevance: string;
  freshness: string;
  qualification: string;
};

export const emptyFilters: SignalFilters = { query: "", category: "", industry: "", size: "", region: "", relevance: "", freshness: "", qualification: "" };

export function filterSignals(signals: Signal[], filters: SignalFilters, qualifications: Record<string, Qualification>) {
  const query = filters.query.trim().toLowerCase();
  return signals.filter((signal) => {
    const status = qualifications[signal.id] ?? signal.qualification;
    return (!query || [signal.company, signal.headline, signal.evidence, signal.category, signal.industry].some((value) => value.toLowerCase().includes(query)))
      && (!filters.category || signal.category === filters.category)
      && (!filters.industry || signal.industry === filters.industry)
      && (!filters.size || signal.companySize === filters.size)
      && (!filters.region || signal.region === filters.region)
      && (!filters.relevance || signal.relevance === filters.relevance)
      && (!filters.freshness || getFreshness(signal.observedAt) === filters.freshness)
      && (!filters.qualification || status === filters.qualification);
  });
}

export type SavedView = { id: string; name: string; filters: SignalFilters };
const storage = (key: string) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
export function readLocal<T>(key: string, fallback: T): T {
  const value = storage(key);
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}
export function writeLocal(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Browser storage may be unavailable. */ }
}
