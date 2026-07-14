import type { AttendanceRecord } from "@/types";
import { students } from "@/demo-data/people/students";
import { createRng } from "@/demo-data/generators/random";

const { weightedPick } = createRng(90260711);

function generateTodayAttendance(): AttendanceRecord[] {
  const today = new Date().toISOString().slice(0, 10);
  return students.map((s, i) => ({
    id: `att-${i + 1}`,
    studentId: s.id,
    date: today,
    status: weightedPick<"present" | "absent">([["present", 89], ["absent", 11]]),
  }));
}

export const todayAttendance: AttendanceRecord[] = generateTodayAttendance();

export function getTodayAttendanceStats(): { present: number; total: number; pct: number } {
  const present = todayAttendance.filter((a) => a.status === "present").length;
  const total = todayAttendance.length;
  return { present, total, pct: Math.round((present / total) * 1000) / 10 };
}
