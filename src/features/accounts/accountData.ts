import { demoSignals, type Signal } from "@/features/signals/signalData";
import { readLocal, writeLocal } from "@/features/signals/signalData";

export type AccountStatus = "Target" | "Researching" | "Qualified" | "Disqualified";
export type AccountNote = { id: string; text: string; createdAt: string; updatedAt: string };
export type Account = {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  companySize?: string;
  region?: string;
  websiteUrl?: string;
  description?: string;
  status: AccountStatus;
  owner?: string;
  associatedSignalIds: string[];
  notes: AccountNote[];
  createdAt: string;
  updatedAt: string;
  isDemo: boolean;
};
export type AccountEvent = { id: string; accountId: string; kind: "qualification" | "edit" | "note" | "association"; description: string; recordedAt: string };

const createdAt = new Date().toISOString();
const accountDefinitions = [
  { id: "acct-fableworks", name: "Fableworks (sample)", industry: "Software", companySize: "201–500", region: "North America", domain: "fableworks.example" },
  { id: "acct-northwind", name: "Northwind Works (sample)", industry: "Manufacturing", companySize: "501–1,000", region: "Europe" },
  { id: "acct-juniper", name: "Juniper Ridge (sample)", industry: "Business services", companySize: "51–200", region: "North America" },
  { id: "acct-kite-harbor", name: "Kite & Harbor (sample)", industry: "Financial services", companySize: "1,001–5,000", region: "North America" },
  { id: "acct-copperleaf", name: "Copperleaf Studio (sample)", industry: "Software", companySize: "51–200", region: "Asia Pacific" },
  { id: "acct-redwood", name: "Redwood Motion (sample)", industry: "Manufacturing", companySize: "201–500", region: "Europe" },
  { id: "acct-bluevale", name: "Bluevale Health (sample)", industry: "Healthcare", companySize: "1,001–5,000", region: "North America" },
  { id: "acct-alpine", name: "Alpine Thread (sample)", industry: "Retail", companySize: "11–50", region: "Europe" },
];

export const initialAccounts: Account[] = accountDefinitions.map((definition) => ({
  ...definition,
  description: "Illustrative account record. Company context reflects sample data only and has not been independently verified.",
  status: "Target",
  associatedSignalIds: demoSignals.filter((signal) => signal.accountId === definition.id).map((signal) => signal.id),
  notes: [],
  createdAt,
  updatedAt: createdAt,
  isDemo: true,
}));

export const accountsStorageKey = "account-intelligence-records";
export const accountEventsStorageKey = "account-intelligence-events";
export const signalAccountAssociationsKey = "signal-account-associations";
export function loadSignalAccountAssociations(): Record<string, string> { return readLocal(signalAccountAssociationsKey, {}); }
export function saveSignalAccountAssociation(signalId: string, accountId: string) { writeLocal(signalAccountAssociationsKey, { ...loadSignalAccountAssociations(), [signalId]: accountId }); }
export function loadAccounts(): Account[] { return readLocal(accountsStorageKey, initialAccounts); }
export function saveAccounts(accounts: Account[]) { writeLocal(accountsStorageKey, accounts); }
export function loadAccountEvents(): AccountEvent[] { return readLocal(accountEventsStorageKey, []); }
export function saveAccountEvents(events: AccountEvent[]) { writeLocal(accountEventsStorageKey, events); }

export const targetCriteria = {
  industries: ["Software", "Business services", "Financial services"],
  minimumEmployees: 51,
  regions: ["North America", "Europe"],
};

function sizeMinimum(size?: string) {
  if (!size) return null;
  const match = size.match(/^(\d+)/);
  return match ? Number(match[1]) : null;
}
export type FitAssessment = { score: number | null; label: "Strong alignment" | "Partial alignment" | "Limited alignment" | "Insufficient data"; factors: { name: string; points: number | null; explanation: string }[] };
export function assessIcpFit(account: Account): FitAssessment {
  const factors: FitAssessment["factors"] = [];
  if (!account.industry) factors.push({ name: "Industry", points: null, explanation: "Industry is not recorded." });
  else {
    const match = targetCriteria.industries.includes(account.industry);
    factors.push({ name: "Industry alignment", points: match ? 40 : 0, explanation: match ? `${account.industry} is included in the illustrative target industries.` : `${account.industry} is not currently in the illustrative target industries.` });
  }
  const minimum = sizeMinimum(account.companySize);
  if (minimum === null) factors.push({ name: "Company size", points: null, explanation: "Company size is not recorded." });
  else {
    const match = minimum >= targetCriteria.minimumEmployees;
    factors.push({ name: "Company size", points: match ? 30 : 0, explanation: match ? `The recorded band starts at ${minimum} employees, meeting the sample minimum of ${targetCriteria.minimumEmployees}.` : `The recorded band is below the sample minimum of ${targetCriteria.minimumEmployees} employees.` });
  }
  if (!account.region) factors.push({ name: "Geography", points: null, explanation: "Region is not recorded." });
  else {
    const match = targetCriteria.regions.includes(account.region);
    factors.push({ name: "Geography", points: match ? 20 : 0, explanation: match ? `${account.region} is included in the illustrative target regions.` : `${account.region} is not currently in the illustrative target regions.` });
  }
  const known = factors.filter((factor) => factor.points !== null);
  if (known.length < 2) return { score: null, label: "Insufficient data", factors };
  const score = known.reduce((sum, factor) => sum + (factor.points ?? 0), 0);
  const label = score >= 70 ? "Strong alignment" : score >= 40 ? "Partial alignment" : "Limited alignment";
  return { score, label, factors };
}

export function relatedSignals(account: Account, signals: Signal[] = demoSignals) {
  const associations = loadSignalAccountAssociations();
  return signals.filter((signal) => account.associatedSignalIds.includes(signal.id) || signal.accountId === account.id || associations[signal.id] === account.id);
}
export function accountLatestSignal(account: Account, signals: Signal[] = demoSignals) {
  return relatedSignals(account, signals).filter((signal) => signal.observedAt).sort((a, b) => (b.observedAt ?? "").localeCompare(a.observedAt ?? ""))[0];
}
