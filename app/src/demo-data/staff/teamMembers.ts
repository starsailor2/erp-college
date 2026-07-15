import type { OpsTeamMember } from "@/types";

export const teamMembers: OpsTeamMember[] = [
  { id: "TM001", name: "John Smith", role: "Maintenance Staff", avatar: "JS", department: "Facilities", email: "john.smith@kalnet.edu", phone: "9812300001" },
  { id: "TM002", name: "Sarah Johnson", role: "Administrative Assistant", avatar: "SJ", department: "Admin", email: "sarah.johnson@kalnet.edu", phone: "9812300002" },
  { id: "TM003", name: "Mike Davis", role: "Security Guard", avatar: "MD", department: "Security", email: "mike.davis@kalnet.edu", phone: "9812300003" },
  { id: "TM004", name: "Lisa Chen", role: "Cleaner", avatar: "LC", department: "Facilities", email: "lisa.chen@kalnet.edu", phone: "9812300004" },
  { id: "TM005", name: "Tom Wilson", role: "Lab Assistant", avatar: "TW", department: "Science", email: "tom.wilson@kalnet.edu", phone: "9812300005" },
];

// The single team member whose perspective the "Executor" role simulates —
// mirrors the source's hardcoded executorId, but named/exported so every
// consumer reads it from one place instead of re-hardcoding "1"/"TM001".
export const currentExecutorId = "TM001";

export function getTeamMemberById(id: string): OpsTeamMember | undefined {
  return teamMembers.find((m) => m.id === id);
}
