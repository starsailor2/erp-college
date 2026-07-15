import { simulateRequest } from "@/api/http";
import { todayAttendance, getTodayAttendanceStats } from "@/demo-data/attendance/todayAttendance";
import type { AttendanceRecord } from "@/types";

export function getTodayAttendance(): Promise<AttendanceRecord[]> {
  return simulateRequest(todayAttendance);
}

export function getAttendanceStats(): Promise<{ present: number; total: number; pct: number }> {
  return simulateRequest(getTodayAttendanceStats());
}

export function markAttendance(studentId: string, status: "present" | "absent"): Promise<void> {
  const row = todayAttendance.find((a) => a.studentId === studentId);
  if (row) row.status = status;
  return simulateRequest(undefined);
}
