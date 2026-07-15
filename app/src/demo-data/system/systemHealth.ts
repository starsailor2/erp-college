import type { SystemHealthMetrics } from "@/types";

export const systemHealth: SystemHealthMetrics = {
  uptimePct: 99.8,
  uptimeDetail: "45 days, 12 hours",
  cpuPct: 42,
  memoryPct: 68,
  memoryDetail: "12.8 GB / 19 GB",
  diskPct: 54,
  diskDetail: "542 GB / 1 TB",
  databaseHealthy: true,
  apiResponseMs: 142,
  activeUsers: 284,
  lastBackup: "2 hrs ago",
  services: [
    { name: "Web Application", description: "Main ERP Interface", status: "running" },
    { name: "Database Server", description: "MySQL 8.0", status: "running" },
    { name: "Email Service", description: "SMTP Gateway", status: "running" },
    { name: "Payment Gateway", description: "Online Payments", status: "running" },
    { name: "SMS Service", description: "Notifications", status: "degraded" },
  ],
};
