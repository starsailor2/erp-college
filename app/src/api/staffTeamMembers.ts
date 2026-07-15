import { simulateRequest } from "@/api/http";
import { teamMembers } from "@/demo-data/staff/teamMembers";
import type { OpsTeamMember } from "@/types";

export function getTeamMembers(): Promise<OpsTeamMember[]> {
  return simulateRequest(teamMembers);
}
