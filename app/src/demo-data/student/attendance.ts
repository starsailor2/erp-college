import type { AttendanceSubject } from "@/types";

export const attendanceSubjects: AttendanceSubject[] = [
  { code: "CS601", name: "Advanced Algorithms", attended: 50, total: 56 },
  { code: "CS602", name: "Machine Learning", attended: 46, total: 56 },
  { code: "CS603", name: "Distributed Systems", attended: 47, total: 52 },
  { code: "CS604", name: "Cloud Computing", attended: 38, total: 48 },
  { code: "HS601", name: "Engineering Ethics", attended: 38, total: 40 },
];

export const monthlyAttendanceTrend = [
  { month: "Nov", pct: 88 },
  { month: "Dec", pct: 84 },
  { month: "Jan", pct: 86 },
  { month: "Feb", pct: 87 },
];
