import { simulateRequest } from "@/api/http";
import { adminProfile } from "@/demo-data/system/adminProfile";
import type { AdminProfile } from "@/types";

export function getAdminProfile(): Promise<AdminProfile> {
  return simulateRequest(adminProfile);
}

export function saveAdminProfile(updates: Pick<AdminProfile, "name" | "email" | "phone">): Promise<AdminProfile> {
  Object.assign(adminProfile, updates);
  return simulateRequest(adminProfile);
}
