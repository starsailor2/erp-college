export function fuzzyScore(query: string, target: string): number {
  if (!query) return 0;
  if (target === query) return 100;
  if (target.startsWith(query)) return 80;
  if (target.includes(query)) return 60;
  if (target.split(/\s+/).some((word) => word.startsWith(query))) return 50;
  return 0;
}

export function extractPercent(query: string): number | null {
  const percentMatch = query.match(/(\d{1,3})\s*%/);
  if (percentMatch) return Number(percentMatch[1]);
  const numberMatch = query.match(/\b(\d{1,3})\b/);
  return numberMatch ? Number(numberMatch[1]) : null;
}

export function extractComparisonDirection(query: string): "below" | "above" | null {
  if (/\b(below|under|less than|lower than)\b/.test(query)) return "below";
  if (/\b(above|over|more than|greater than|higher than)\b/.test(query)) return "above";
  return null;
}

export function matchByNameOrId<T extends { id: string; name: string }>(query: string, items: T[]): T | null {
  const q = query.toLowerCase();
  return items.find((item) => q.includes(item.name.toLowerCase()) || q.includes(item.id.toLowerCase())) ?? null;
}

export function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}
