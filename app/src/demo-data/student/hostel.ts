import type { HostelRequest } from "@/types";

function tl(time: string, action: string) {
  return { time, action };
}

export const hostelRequests: HostelRequest[] = [
  { id: "HR-001", type: "maintenance", details: "AC not cooling properly in Room A-205", submittedOn: "2026-07-05", status: "in_progress", timeline: [tl("2026-07-05", "Request submitted"), tl("2026-07-06", "Assigned to maintenance staff"), tl("2026-07-08", "Technician visited, replacement part on order")] },
  { id: "HR-002", type: "visitor_pass", details: "Visitor pass for parents, 2026-07-20 to 2026-07-22", submittedOn: "2026-07-12", status: "resolved", timeline: [tl("2026-07-12", "Request submitted"), tl("2026-07-13", "Approved by warden")] },
];

export function nextHostelRequestId(): string {
  const max = hostelRequests.reduce((m, r) => Math.max(m, Number(r.id.split("-")[1])), 0);
  return `HR-${String(max + 1).padStart(3, "0")}`;
}

export const messState = { mealPlan: "Standard" };
