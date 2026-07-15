import { simulateRequest } from "@/api/http";
import { studentCourses, registrationCatalog, registeredCourseCodes } from "@/demo-data/student/courses";
import type { StudentCourse, RegistrationCourse } from "@/types";

export function getStudentCourses(): Promise<StudentCourse[]> {
  return simulateRequest(studentCourses);
}

export function getStudentCoursesBySemester(semester: number): Promise<StudentCourse[]> {
  return simulateRequest(studentCourses.filter((c) => c.semester === semester));
}

export function getRegistrationCatalog(): Promise<RegistrationCourse[]> {
  return simulateRequest(registrationCatalog);
}

export function getRegisteredCourseCodes(): Promise<string[]> {
  return simulateRequest(registeredCourseCodes);
}

export function registerCourse(code: string): Promise<void> {
  if (!registeredCourseCodes.includes(code)) registeredCourseCodes.push(code);
  return simulateRequest(undefined);
}

export function dropCourse(code: string): Promise<void> {
  const idx = registeredCourseCodes.indexOf(code);
  if (idx !== -1) registeredCourseCodes.splice(idx, 1);
  return simulateRequest(undefined);
}
