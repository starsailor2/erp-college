import { simulateRequest } from "@/api/http";
import { courses, getCourseById } from "@/demo-data/academics/courses";
import type { Course } from "@/types";

export function getCourses(): Promise<Course[]> {
  return simulateRequest(courses);
}

export function getCourseByIdAsync(id: string): Promise<Course | undefined> {
  return simulateRequest(getCourseById(id));
}

export function addCourse(entry: Course): Promise<Course> {
  courses.unshift(entry);
  return simulateRequest(entry);
}

export function updateCourse(id: string, updates: Partial<Course>): Promise<Course | undefined> {
  const idx = courses.findIndex((c) => c.id === id);
  if (idx !== -1) courses[idx] = { ...courses[idx], ...updates };
  return simulateRequest(courses[idx]);
}
