import type { AuditLogEntry, AuditStatus } from "@/types";
import { createRng } from "@/demo-data/generators/random";

const { pick, weightedPick, randomInt } = createRng(15071503);

const actors = [
  "admin@kalnet.edu", "sarah.j@kalnet.edu", "finance@kalnet.edu",
  "priya.sharma@kalnet.edu", "amit.singh@kalnet.edu",
];

const actionsByModule: { action: string; module: string }[] = [
  { action: "Login Successful", module: "Authentication" },
  { action: "Failed Login Attempt", module: "Authentication" },
  { action: "Logged Out", module: "Authentication" },
  { action: "Updated Course Syllabus", module: "Academics" },
  { action: "Published Exam Schedule", module: "Academics" },
  { action: "Added New Student", module: "Academics" },
  { action: "Updated Fee Structure", module: "Finance" },
  { action: "Processed Payment", module: "Finance" },
  { action: "Issued Refund", module: "Finance" },
  { action: "Allocated Hostel Room", module: "Operations" },
  { action: "Created Maintenance Ticket", module: "Operations" },
  { action: "Updated System Configuration", module: "System" },
  { action: "Changed User Permissions", module: "System" },
  { action: "Created Backup", module: "System" },
];

const statuses: [AuditStatus, number][] = [["success", 92], ["failed", 8]];

function dateTimeStr(month: number, day: number, hour: number, minute: number, second: number): string {
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
}

const LOG_COUNT = 40;

function generateAuditLogs(): AuditLogEntry[] {
  const list: AuditLogEntry[] = [];
  for (let i = 0; i < LOG_COUNT; i++) {
    const { action, module } = pick(actionsByModule);
    const isFailedLogin = action === "Failed Login Attempt";
    list.push({
      id: `LOG-${10000 - i}`,
      timestamp: dateTimeStr(7, randomInt(1, 15), randomInt(0, 23), randomInt(0, 59), randomInt(0, 59)),
      actorEmail: isFailedLogin ? "unknown@external.com" : pick(actors),
      action,
      module,
      ipAddress: isFailedLogin ? `203.45.128.${randomInt(10, 250)}` : `192.168.1.${randomInt(100, 200)}`,
      status: isFailedLogin ? "failed" : weightedPick(statuses),
    });
  }
  return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export const auditLogs: AuditLogEntry[] = generateAuditLogs();
