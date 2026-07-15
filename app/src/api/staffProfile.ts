import { simulateRequest } from "@/api/http";
import { assignerProfile } from "@/demo-data/staff/profile";
import { teamMembers, currentExecutorId } from "@/demo-data/staff/teamMembers";
import type { StaffProfile, StaffRole } from "@/types";

function currentExecutor() {
  return teamMembers.find((m) => m.id === currentExecutorId)!;
}

export function getCurrentStaffProfile(role: StaffRole): Promise<StaffProfile> {
  if (role === "executor") {
    const exec = currentExecutor();
    return simulateRequest({ name: exec.name, email: exec.email, department: exec.department, phone: exec.phone });
  }
  return simulateRequest(assignerProfile);
}

export function updateCurrentStaffProfile(role: StaffRole, updates: Partial<StaffProfile>): Promise<StaffProfile> {
  if (role === "executor") {
    const exec = currentExecutor();
    Object.assign(exec, updates);
    return simulateRequest({ name: exec.name, email: exec.email, department: exec.department, phone: exec.phone });
  }
  Object.assign(assignerProfile, updates);
  return simulateRequest(assignerProfile);
}

// Synchronous on purpose: Layout's sidebar header (chrome, not page content)
// needs the current role's display name/avatar-initial on every render
// without an async round-trip or loading flicker, the same way it already
// reads useAuth()'s user synchronously for every other portal.
export function getStaffDisplayIdentity(role: StaffRole): { name: string; initial: string } {
  if (role === "executor") {
    const exec = currentExecutor();
    return { name: exec.name, initial: exec.avatar.charAt(0) };
  }
  return { name: assignerProfile.name, initial: assignerProfile.name.charAt(0) };
}
