import { simulateRequest } from "@/api/http";
import { todayAttendance, getTodayAttendanceStats } from "@/demo-data/attendance/todayAttendance";
import type { AttendanceRecord } from "@/types";

export function getTodayAttendance(): Promise<AttendanceRecord[]> {
  return simulateRequest(todayAttendance);
}

export function getAttendanceStats(): Promise<{ present: number; total: number; pct: number }> {
  return simulateRequest(getTodayAttendanceStats());
}
