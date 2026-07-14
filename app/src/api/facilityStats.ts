import { simulateRequest } from "@/api/http";
import { facilityStats } from "@/demo-data/campus/facilityStats";
import type { FacilityStats } from "@/types";

export function getFacilityStats(): Promise<FacilityStats> {
  return simulateRequest(facilityStats);
}

export function addBooking(): Promise<FacilityStats> {
  facilityStats.todayBookings += 1;
  return simulateRequest(facilityStats);
}
