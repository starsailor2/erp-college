import { simulateRequest } from "@/api/http";
import { studentIssues } from "@/demo-data/teacher/studentIssues";
import type { StudentIssue } from "@/types";

export function getStudentIssues(): Promise<StudentIssue[]> {
  return simulateRequest(studentIssues);
}

export function resolveStudentIssue(id: string): Promise<void> {
  const row = studentIssues.find((r) => r.id === id);
  if (row) row.status = "resolved";
  return simulateRequest(undefined);
}
