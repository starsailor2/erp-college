import { simulateRequest } from "@/api/http";
import { teacherProfile } from "@/demo-data/teacher/profile";
import type { TeacherProfile } from "@/types";

export function getTeacherProfile(): Promise<TeacherProfile> {
  return simulateRequest(teacherProfile);
}

export function updateTeacherProfile(updates: Partial<TeacherProfile>): Promise<TeacherProfile> {
  Object.assign(teacherProfile, updates);
  return simulateRequest(teacherProfile);
}
