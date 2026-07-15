import { simulateRequest } from "@/api/http";
import { studentNotices } from "@/demo-data/student/notices";
import type { StudentNotice } from "@/types";

export function getStudentNotices(): Promise<StudentNotice[]> {
  return simulateRequest(studentNotices);
}

export function markNoticeRead(id: string): Promise<void> {
  const row = studentNotices.find((n) => n.id === id);
  if (row) row.read = true;
  return simulateRequest(undefined);
}

export function markAllNoticesRead(): Promise<void> {
  studentNotices.forEach((n) => { n.read = true; });
  return simulateRequest(undefined);
}
