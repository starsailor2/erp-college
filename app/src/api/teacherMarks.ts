import { simulateRequest } from "@/api/http";
import { marksSubmissions, getMarksSubmissionById } from "@/demo-data/teacher/marks";
import type { MarksSubmission } from "@/types";

export function getMarksSubmissions(): Promise<MarksSubmission[]> {
  return simulateRequest(marksSubmissions);
}

export function getMarksSubmissionByIdAsync(id: string): Promise<MarksSubmission | undefined> {
  return simulateRequest(getMarksSubmissionById(id));
}

export function submitMarks(entry: MarksSubmission): Promise<MarksSubmission> {
  marksSubmissions.unshift(entry);
  return simulateRequest(entry);
}
