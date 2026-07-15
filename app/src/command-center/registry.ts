import type { IntentDefinition } from "@/command-center/types";
import { studentIntents } from "@/command-center/intents/students";

// Order matters: interpret() returns the first matching intent, so more
// specific/keyword-constrained intents should appear before broader ones.
export const intentDefinitions: IntentDefinition[] = [...studentIntents];
