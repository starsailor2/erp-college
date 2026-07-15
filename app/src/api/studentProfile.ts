import { simulateRequest } from "@/api/http";
import { studentProfile } from "@/demo-data/student/profile";
import type { StudentProfile } from "@/types";

export function getStudentProfile(): Promise<StudentProfile> {
  return simulateRequest(studentProfile);
}

export function updateStudentProfile(updates: Partial<StudentProfile>): Promise<StudentProfile> {
  Object.assign(studentProfile, updates);
  return simulateRequest(studentProfile);
}
