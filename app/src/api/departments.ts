import { simulateRequest } from "@/api/http";
import { departments, getDepartmentById } from "@/demo-data/academics/departments";
import type { Department } from "@/types";

export function getDepartments(): Promise<Department[]> {
  return simulateRequest(departments);
}

export function getDepartmentByIdAsync(id: string): Promise<Department | undefined> {
  return simulateRequest(getDepartmentById(id));
}

export function addDepartment(entry: Department): Promise<Department> {
  departments.unshift(entry);
  return simulateRequest(entry);
}

export function updateDepartment(id: string, updates: Partial<Department>): Promise<Department | undefined> {
  const idx = departments.findIndex((d) => d.id === id);
  if (idx !== -1) departments[idx] = { ...departments[idx], ...updates };
  return simulateRequest(departments[idx]);
}
