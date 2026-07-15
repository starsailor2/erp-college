import { simulateRequest } from "@/api/http";
import { attendanceApprovals, marksApprovals } from "@/demo-data/teacher/approvals";
import type { AttendanceApprovalEntry, MarksApprovalEntry } from "@/types";

export function getAttendanceApprovals(): Promise<AttendanceApprovalEntry[]> {
  return simulateRequest(attendanceApprovals);
}
export function approveAttendanceApproval(id: string): Promise<void> {
  const row = attendanceApprovals.find((r) => r.id === id);
  if (row) row.status = "approved";
  return simulateRequest(undefined);
}
export function rejectAttendanceApproval(id: string): Promise<void> {
  const row = attendanceApprovals.find((r) => r.id === id);
  if (row) row.status = "rejected";
  return simulateRequest(undefined);
}

export function getMarksApprovals(): Promise<MarksApprovalEntry[]> {
  return simulateRequest(marksApprovals);
}
export function approveMarksApproval(id: string): Promise<void> {
  const row = marksApprovals.find((r) => r.id === id);
  if (row) row.status = "approved";
  return simulateRequest(undefined);
}
export function rejectMarksApproval(id: string): Promise<void> {
  const row = marksApprovals.find((r) => r.id === id);
  if (row) row.status = "rejected";
  return simulateRequest(undefined);
}
