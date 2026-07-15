import { simulateRequest } from "@/api/http";
import { departmentSummaries, getDepartmentByName } from "@/demo-data/teacher/departments";
import type { DepartmentSummary } from "@/types";

export function getDepartmentSummaries(): Promise<DepartmentSummary[]> {
  return simulateRequest(departmentSummaries);
}

export function getDepartmentByNameAsync(name: string): Promise<DepartmentSummary | undefined> {
  return simulateRequest(getDepartmentByName(name));
}
