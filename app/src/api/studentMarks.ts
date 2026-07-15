import { simulateRequest } from "@/api/http";
import { marksBySemester, semesterGpaHistory } from "@/demo-data/student/marks";
import type { MarksSubject } from "@/types";

export function getMarksForSemester(semester: number): Promise<MarksSubject[]> {
  return simulateRequest(marksBySemester[semester] ?? []);
}

export function getSemesterGpaHistory(): Promise<typeof semesterGpaHistory> {
  return simulateRequest(semesterGpaHistory);
}
