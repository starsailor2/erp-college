import { notifications } from "@/demo-data/communication/notifications";
import { simulateRequest } from "@/api/http";
import type { Notification } from "@/types";

export function getNotifications(): Promise<Notification[]> {
  return simulateRequest(notifications);
}

export function getUnreadNotificationCount(): Promise<number> {
  return simulateRequest(notifications.filter((n) => !n.read).length);
}

export function markNotificationRead(id: string): Promise<void> {
  const n = notifications.find((x) => x.id === id);
  if (n) n.read = true;
  return simulateRequest(undefined);
}

export function markAllNotificationsRead(): Promise<void> {
  notifications.forEach((n) => { n.read = true; });
  return simulateRequest(undefined);
}
