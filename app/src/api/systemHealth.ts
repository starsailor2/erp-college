import { simulateRequest } from "@/api/http";
import { systemHealth } from "@/demo-data/system/systemHealth";
import type { SystemHealthMetrics } from "@/types";

export function getSystemHealth(): Promise<SystemHealthMetrics> {
  return simulateRequest(systemHealth);
}
