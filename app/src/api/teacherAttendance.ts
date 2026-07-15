import { simulateRequest } from "@/api/http";
import { attendanceSubmissions, getSubmissionById } from "@/demo-data/teacher/attendance";
import type { AttendanceSubmission } from "@/types";

export function getAttendanceSubmissions(): Promise<AttendanceSubmission[]> {
  return simulateRequest(attendanceSubmissions);
}

export function getAttendanceSubmissionByIdAsync(id: string): Promise<AttendanceSubmission | undefined> {
  return simulateRequest(getSubmissionById(id));
}

export function submitAttendance(entry: AttendanceSubmission): Promise<AttendanceSubmission> {
  attendanceSubmissions.unshift(entry);
  return simulateRequest(entry);
}
