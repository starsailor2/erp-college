import { simulateRequest } from "@/api/http";
import { activityLog } from "@/demo-data/administration/activityLog";
import type { ActivityLogEntry } from "@/types";

export function getActivityLog(): Promise<ActivityLogEntry[]> {
  return simulateRequest(activityLog);
}
