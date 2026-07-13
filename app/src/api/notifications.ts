import { notifications } from "@/demo-data/communication/notifications";
import { simulateRequest } from "@/api/http";
import type { Notification } from "@/types";

export function getNotifications(): Promise<Notification[]> {
  return simulateRequest(notifications);
}

export function getUnreadNotificationCount(): Promise<number> {
  return simulateRequest(notifications.filter((n) => !n.read).length);
}
