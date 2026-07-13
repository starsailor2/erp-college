import { simulateRequest } from "@/api/http";
import { students, getStudentById } from "@/demo-data/people/students";
import type { Student } from "@/types";

export function getStudents(): Promise<Student[]> {
  return simulateRequest(students);
}

export function getStudentByIdAsync(id: string): Promise<Student | undefined> {
  return simulateRequest(getStudentById(id));
}

export function addStudent(entry: Student): Promise<Student> {
  students.unshift(entry);
  return simulateRequest(entry);
}

export function updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined> {
  const idx = students.findIndex((s) => s.id === id);
  if (idx !== -1) students[idx] = { ...students[idx], ...updates };
  return simulateRequest(students[idx]);
}
