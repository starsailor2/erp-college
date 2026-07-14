import { simulateRequest } from "@/api/http";
import { hostelStats } from "@/demo-data/campus/hostelStats";
import type { HostelStats } from "@/types";

export function getHostelStats(): Promise<HostelStats> {
  return simulateRequest(hostelStats);
}

export function allocateRoom(): Promise<HostelStats> {
  if (hostelStats.available > 0) {
    hostelStats.available -= 1;
    hostelStats.occupied += 1;
  }
  return simulateRequest(hostelStats);
}
