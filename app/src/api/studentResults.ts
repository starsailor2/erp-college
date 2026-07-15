import { simulateRequest } from "@/api/http";
import { semesterResults } from "@/demo-data/student/results";
import type { SemesterResult } from "@/types";

export function getSemesterResults(): Promise<SemesterResult[]> {
  return simulateRequest(semesterResults);
}
