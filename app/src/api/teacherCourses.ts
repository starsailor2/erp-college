import { simulateRequest } from "@/api/http";
import { teacherCourses, getTeacherCourseById } from "@/demo-data/teacher/courses";
import type { TeacherCourse } from "@/types";

export function getTeacherCourses(): Promise<TeacherCourse[]> {
  return simulateRequest(teacherCourses);
}

export function getTeacherCourseByIdAsync(id: string): Promise<TeacherCourse | undefined> {
  return simulateRequest(getTeacherCourseById(id));
}
