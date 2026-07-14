import { simulateRequest } from "@/api/http";
import { marks, getMarksByStudent, getStudentRank } from "@/demo-data/academics/marks";
import type { Mark } from "@/types";

export function getMarks(): Promise<Mark[]> {
  return simulateRequest(marks);
}

export function getMarksByStudentAsync(studentId: string): Promise<Mark[]> {
  return simulateRequest(getMarksByStudent(studentId));
}

export function getStudentRankAsync(studentId: string): Promise<{ rank: number; cohortSize: number }> {
  return simulateRequest(getStudentRank(studentId));
}
