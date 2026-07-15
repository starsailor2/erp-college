import type { NavItem } from "@/components/navigation";
import type { CommandRecordRow } from "@/command-center/types";
import { fuzzyScore } from "@/command-center/shared";

export function searchNavItems(query: string, navItems: NavItem[], limit = 5): CommandRecordRow[] {
  const queryLower = query.trim().toLowerCase();
  if (queryLower.length < 2) return [];

  const flatItems: { label: string; path: string }[] = [];
  for (const item of navItems) {
    flatItems.push({ label: item.label, path: item.path });
    if (item.children) {
      for (const child of item.children) flatItems.push({ label: child.label, path: child.path });
    }
  }

  return flatItems
    .map((item) => ({ item, score: fuzzyScore(queryLower, item.label.toLowerCase()) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => ({ id: item.path, primary: item.label, secondary: "Go to page", path: item.path }));
}
