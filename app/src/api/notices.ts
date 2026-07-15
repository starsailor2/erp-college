import { simulateRequest } from "@/api/http";
import { notices } from "@/demo-data/communication/notices";
import type { Notice } from "@/types";

export function getNotices(): Promise<Notice[]> {
  return simulateRequest(notices);
}
