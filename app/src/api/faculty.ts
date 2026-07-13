import { simulateRequest } from "@/api/http";
import { faculty, getFacultyById } from "@/demo-data/people/faculty";
import type { Faculty } from "@/types";

export function getFaculty(): Promise<Faculty[]> {
  return simulateRequest(faculty);
}

export function getFacultyByIdAsync(id: string): Promise<Faculty | undefined> {
  return simulateRequest(getFacultyById(id));
}

export function addFaculty(entry: Faculty): Promise<Faculty> {
  faculty.unshift(entry);
  return simulateRequest(entry);
}

export function updateFaculty(id: string, updates: Partial<Faculty>): Promise<Faculty | undefined> {
  const idx = faculty.findIndex((f) => f.id === id);
  if (idx !== -1) faculty[idx] = { ...faculty[idx], ...updates };
  return simulateRequest(faculty[idx]);
}
