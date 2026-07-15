import { simulateRequest } from "@/api/http";
import { placementDrives, placementApplications } from "@/demo-data/student/placements";
import type { PlacementDrive, PlacementApplication } from "@/types";

export function getPlacementDrives(): Promise<PlacementDrive[]> {
  return simulateRequest(placementDrives);
}

export function getPlacementApplications(): Promise<PlacementApplication[]> {
  return simulateRequest(placementApplications);
}

export function applyPlacement(company: string, role: string): Promise<void> {
  placementApplications.unshift({ company, role, appliedOn: new Date().toISOString().slice(0, 10), status: "applied" });
  return simulateRequest(undefined);
}
