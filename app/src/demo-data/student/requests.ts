import type { StudentAcademicRequest } from "@/types";

export const academicRequests: StudentAcademicRequest[] = [
  { id: "AR-001", type: "section_change", details: "Request to move CS603 from Section B to Section A", submittedOn: "2026-06-10", status: "rejected" },
  { id: "AR-002", type: "leave_application", details: "Medical leave for 3 days due to fever", submittedOn: "2026-07-01", status: "pending" },
  { id: "AR-003", type: "re_evaluation", details: "Re-evaluation request for CS602 Mid Exam", submittedOn: "2026-06-20", status: "approved" },
];

export function nextRequestId(): string {
  const max = academicRequests.reduce((m, r) => Math.max(m, Number(r.id.split("-")[1])), 0);
  return `AR-${String(max + 1).padStart(3, "0")}`;
}
