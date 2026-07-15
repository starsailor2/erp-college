import { simulateRequest } from "@/api/http";
import { opsNotifications } from "@/demo-data/staff/notifications";
import type { OpsNotification } from "@/types";

export function getOpsNotifications(): Promise<OpsNotification[]> {
  return simulateRequest(opsNotifications);
}

export function markNotificationRead(id: string): Promise<void> {
  const row = opsNotifications.find((n) => n.id === id);
  if (row) row.read = true;
  return simulateRequest(undefined);
}

export function markAllNotificationsRead(): Promise<void> {
  opsNotifications.forEach((n) => { n.read = true; });
  return simulateRequest(undefined);
}
