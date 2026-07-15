import type { TeacherLeaveRequest, GradeChangeRequest, ResourceRequest } from "@/types";
import { students } from "@/demo-data/people/students";

function dateStr(month: number, day: number): string {
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export const leaveRequests: TeacherLeaveRequest[] = [
  { id: "LV-001", leaveType: "Casual", fromDate: dateStr(3, 10), toDate: dateStr(3, 12), reason: "Family function", coverageArrangements: "Dr. Nair to cover CS201", hodStatus: "approved", deanStatus: "approved", raisedOn: dateStr(3, 5) },
  { id: "LV-002", leaveType: "Medical", fromDate: dateStr(4, 2), toDate: dateStr(4, 6), reason: "Medical procedure", coverageArrangements: "Dept to reassign labs", hodStatus: "approved", deanStatus: null, raisedOn: dateStr(3, 28) },
  { id: "LV-003", leaveType: "Academic", fromDate: dateStr(5, 15), toDate: dateStr(5, 17), reason: "Conference attendance", coverageArrangements: "Self-study assigned", hodStatus: "escalated", deanStatus: "pending_approval", raisedOn: dateStr(5, 1) },
];

export const gradeChangeRequests: GradeChangeRequest[] = [
  { id: "GC-001", courseId: "CS201", studentRollNo: students[0]?.rollNo ?? "CSE-001", assessment: "MidExam", originalMark: 16, proposedMark: 18, reason: "Re-evaluation revealed marking error", hodStatus: "approved", deanStatus: "approved", raisedOn: dateStr(3, 20) },
  { id: "GC-002", courseId: "CS202", studentRollNo: students[1]?.rollNo ?? "CSE-002", assessment: "Quiz2", originalMark: 14, proposedMark: 16, reason: "Partial credit for method shown", hodStatus: "pending_approval", deanStatus: null, raisedOn: dateStr(4, 10) },
  { id: "GC-003", courseId: "CS203", studentRollNo: students[2]?.rollNo ?? "CSE-003", assessment: "Assignment1", originalMark: 14, proposedMark: 16, reason: "Late submission excused", hodStatus: "rejected", deanStatus: null, raisedOn: dateStr(3, 15) },
];

export const resourceRequests: ResourceRequest[] = [
  { id: "RS-001", resourceType: "Lab Equipment", description: "6 additional laptops for CS201 lab", justification: "Current lab has 4 fewer laptops than students", estimatedCost: 240000, requiredBy: dateStr(5, 1), hodStatus: "approved", deanStatus: "approved" },
  { id: "RS-002", resourceType: "Software License", description: "MATLAB site license renewal", justification: "Existing license expires next month", estimatedCost: 85000, requiredBy: dateStr(4, 20), hodStatus: "pending_approval", deanStatus: null },
];

export function nextRequestId(prefix: string, list: { id: string }[]): string {
  return `${prefix}-${String(list.length + 1).padStart(3, "0")}`;
}
