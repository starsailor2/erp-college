import type { IntentDefinition } from "@/command-center/types";

// Order matters: interpret() returns the first matching intent, so more
// specific/keyword-constrained intents should appear before broader ones.
// Populated task-by-task as each domain's intents are added.
export const intentDefinitions: IntentDefinition[] = [];
