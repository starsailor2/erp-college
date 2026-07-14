import { simulateRequest } from "@/api/http";
import { feeLedger, getFeeLedgerByStudent } from "@/demo-data/fees/feeLedger";
import type { FeeLedgerEntry } from "@/types";

export function getFeeLedger(): Promise<FeeLedgerEntry[]> {
  return simulateRequest(feeLedger);
}

export function getFeeLedgerByStudentAsync(studentId: string): Promise<FeeLedgerEntry | undefined> {
  return simulateRequest(getFeeLedgerByStudent(studentId));
}
