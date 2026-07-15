import { simulateRequest } from "@/api/http";
import { teacherNotices } from "@/demo-data/teacher/notices";
import type { TeacherNotice } from "@/types";

export function getTeacherNotices(): Promise<TeacherNotice[]> {
  return simulateRequest(teacherNotices);
}

export function addTeacherNotice(entry: TeacherNotice): Promise<TeacherNotice> {
  teacherNotices.unshift(entry);
  return simulateRequest(entry);
}
