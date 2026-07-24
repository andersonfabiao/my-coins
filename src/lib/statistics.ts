import type { CatalogEntry, CollectionItem } from "@/types";

export interface StatisticGroup {
  id: string;
  label: string;
  total: number;
  owned: number;
  missing: number;
  quantity: number;
  percent: number;
}

export interface CompletionEstimate {
  months: number | null;
  ratePerMonth: number | null;
  datedItems: number;
}

export interface QuantityGroup {
  id: string;
  label: string;
  count: number;
  percent: number;
}

function finishGroup(id: string, label: string, entries: CatalogEntry[], items: Map<string, CollectionItem>): StatisticGroup {
  const ownedEntries = entries.filter(({ coinIssue }) => items.get(coinIssue.id)?.owned);
  const quantity = ownedEntries.reduce((sum, { coinIssue }) => sum + (items.get(coinIssue.id)?.quantity ?? 0), 0);
  return {
    id, label, total: entries.length, owned: ownedEntries.length,
    missing: entries.length - ownedEntries.length, quantity,
    percent: entries.length ? Math.round((ownedEntries.length / entries.length) * 100) : 0,
  };
}

export function groupStatistics(
  entries: CatalogEntry[],
  items: Map<string, CollectionItem>,
  keyFor: (entry: CatalogEntry) => string,
  labelFor: (entry: CatalogEntry) => string = keyFor,
): StatisticGroup[] {
  const groups = new Map<string, { label: string; entries: CatalogEntry[] }>();
  for (const entry of entries) {
    const key = keyFor(entry);
    const current = groups.get(key) ?? { label: labelFor(entry), entries: [] };
    current.entries.push(entry);
    groups.set(key, current);
  }
  return [...groups.entries()].map(([id, group]) => finishGroup(id, group.label, group.entries, items));
}

export function estimateCompletion(items: Map<string, CollectionItem>, missing: number, today = new Date()): CompletionEstimate {
  const dates = [...items.values()]
    .filter((item) => item.owned && item.acquisitionDate)
    .map((item) => new Date(`${item.acquisitionDate}T00:00:00`))
    .filter((date) => !Number.isNaN(date.getTime()) && date <= today)
    .sort((a, b) => a.getTime() - b.getTime());
  if (missing === 0) return { months: 0, ratePerMonth: null, datedItems: dates.length };
  if (dates.length < 2) return { months: null, ratePerMonth: null, datedItems: dates.length };
  const elapsedDays = Math.max(0, (today.getTime() - dates[0].getTime()) / 86_400_000);
  if (elapsedDays < 7) return { months: null, ratePerMonth: null, datedItems: dates.length };
  const ratePerMonth = dates.length / Math.max(elapsedDays / 30.4375, 0.25);
  return { months: Math.ceil(missing / ratePerMonth), ratePerMonth: Math.round(ratePerMonth * 10) / 10, datedItems: dates.length };
}

export function buildStatistics(entries: CatalogEntry[], items: Map<string, CollectionItem>, familyNames: Record<string, string>) {
  const owned = entries.filter(({ coinIssue }) => items.get(coinIssue.id)?.owned);
  const totalQuantity = owned.reduce((sum, { coinIssue }) => sum + (items.get(coinIssue.id)?.quantity ?? 0), 0);
  const missing = entries.length - owned.length;
  const quantityBuckets = [
    { id: "1", label: "1 exemplar", test: (quantity: number) => quantity === 1 },
    { id: "2", label: "2 exemplares", test: (quantity: number) => quantity === 2 },
    { id: "3-5", label: "3 a 5 exemplares", test: (quantity: number) => quantity >= 3 && quantity <= 5 },
    { id: "6+", label: "6 ou mais", test: (quantity: number) => quantity >= 6 },
  ];
  const byQuantity: QuantityGroup[] = quantityBuckets.map((bucket) => {
    const count = owned.filter(({ coinIssue }) => bucket.test(items.get(coinIssue.id)?.quantity ?? 1)).length;
    return { id: bucket.id, label: bucket.label, count, percent: owned.length ? Math.round((count / owned.length) * 100) : 0 };
  });
  return {
    total: entries.length,
    owned: owned.length,
    missing,
    totalQuantity,
    duplicates: Math.max(0, totalQuantity - owned.length),
    percent: entries.length ? Math.round((owned.length / entries.length) * 100) : 0,
    estimate: estimateCompletion(items, missing),
    byQuantity,
    bySystem: groupStatistics(entries, items, (entry) => entry.monetarySystem.id, (entry) => entry.monetarySystem.name),
    byFamily: groupStatistics(entries, items, (entry) => entry.coinType.family, (entry) => familyNames[entry.coinType.family] ?? entry.coinType.family),
    byValue: groupStatistics(entries, items, (entry) => `${entry.monetarySystem.id}:${entry.coinType.denomination}`, (entry) => `${entry.coinType.denominationLabel} · ${entry.monetarySystem.name}`),
    byDecade: groupStatistics(entries, items, (entry) => `${Math.floor(entry.coinIssue.year / 10) * 10}`, (entry) => `Década de ${Math.floor(entry.coinIssue.year / 10) * 10}`),
    byYear: groupStatistics(entries, items, (entry) => `${entry.coinIssue.year}`, (entry) => `${entry.coinIssue.year}`),
  };
}
