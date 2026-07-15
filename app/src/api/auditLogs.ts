import { simulateRequest } from "@/api/http";
import { auditLogs } from "@/demo-data/system/auditLogs";
import type { AuditLogEntry } from "@/types";

export function getAuditLogs(): Promise<AuditLogEntry[]> {
  return simulateRequest(auditLogs);
}
