import { simulateRequest } from "@/api/http";
import { workloadEntries } from "@/demo-data/teacher/workload";
import type { WorkloadEntry } from "@/types";

export function getWorkloadEntries(): Promise<WorkloadEntry[]> {
  return simulateRequest(workloadEntries);
}
