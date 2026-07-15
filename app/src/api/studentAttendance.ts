import { simulateRequest } from "@/api/http";
import { attendanceSubjects, monthlyAttendanceTrend } from "@/demo-data/student/attendance";
import type { AttendanceSubject } from "@/types";

export function getAttendanceSubjects(): Promise<AttendanceSubject[]> {
  return simulateRequest(attendanceSubjects);
}

export function getMonthlyAttendanceTrend(): Promise<typeof monthlyAttendanceTrend> {
  return simulateRequest(monthlyAttendanceTrend);
}
