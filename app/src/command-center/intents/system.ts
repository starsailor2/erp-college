import { getSystemHealth } from "@/api/systemHealth";
import { getAuditLogs } from "@/api/auditLogs";
import type { CommandResult, CommandTableRow, IntentDefinition } from "@/command-center/types";

function isSystemHealthQuery(queryLower: string): boolean {
  return queryLower.includes("system") && (queryLower.includes("health") || queryLower.includes("status"));
}

async function executeSystemHealthQuery(): Promise<CommandResult> {
  const health = await getSystemHealth();

  return {
    kind: "stat-answer",
    summary: `System uptime is ${health.uptimePct}%. CPU ${health.cpuPct}%, memory ${health.memoryPct}%, disk ${health.diskPct}%.`,
    note: health.databaseHealthy ? "Database is healthy." : "Database is reporting issues.",
    actionPath: "/admin/system-health",
    actionLabel: "View System Health",
  };
}

const systemHealthIntent: IntentDefinition = { id: "system-health", matches: isSystemHealthQuery, execute: executeSystemHealthQuery };

function isFailedLoginsQuery(queryLower: string): boolean {
  return (queryLower.includes("audit") || queryLower.includes("login")) && queryLower.includes("failed");
}

async function executeFailedLoginsQuery(): Promise<CommandResult> {
  const logs = await getAuditLogs();
  const failed = logs.filter((l) => l.status === "failed").sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const rows: CommandTableRow[] = failed.slice(0, 8).map((l) => ({
    id: l.id,
    path: "/admin/audit-logs",
    actorEmail: l.actorEmail,
    action: l.action,
    timestamp: l.timestamp,
  }));

  return {
    kind: "record-table",
    summary: `${failed.length} failed action${failed.length === 1 ? "" : "s"} in the audit log.`,
    columns: [
      { key: "actorEmail", label: "Actor" },
      { key: "action", label: "Action" },
      { key: "timestamp", label: "Timestamp" },
    ],
    rows,
    viewAllPath: "/admin/audit-logs",
    viewAllLabel: "View audit logs",
  };
}

const failedLoginsIntent: IntentDefinition = {
  id: "audit-failed-actions",
  matches: isFailedLoginsQuery,
  execute: executeFailedLoginsQuery,
};

export const systemIntents: IntentDefinition[] = [systemHealthIntent, failedLoginsIntent];
