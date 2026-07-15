import { simulateRequest } from "@/api/http";
import { reportRows } from "@/demo-data/teacher/reports";
import type { ReportRow } from "@/types";

export function getReportRows(): Promise<ReportRow[]> {
  return simulateRequest(reportRows);
}
