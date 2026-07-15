import { intentDefinitions } from "@/command-center/registry";
import type { IntentDefinition } from "@/command-center/types";

export function interpret(query: string): IntentDefinition | null {
  const queryLower = query.trim().toLowerCase();
  if (!queryLower) return null;
  return intentDefinitions.find((def) => def.matches(queryLower)) ?? null;
}
