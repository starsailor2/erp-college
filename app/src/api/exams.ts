import { simulateRequest } from "@/api/http";
import { exams, getExamById } from "@/demo-data/academics/exams";
import type { Exam } from "@/types";

export function getExams(): Promise<Exam[]> {
  return simulateRequest(exams);
}

export function getExamByIdAsync(id: string): Promise<Exam | undefined> {
  return simulateRequest(getExamById(id));
}

export function updateExam(id: string, updates: Partial<Exam>): Promise<Exam | undefined> {
  const idx = exams.findIndex((e) => e.id === id);
  if (idx !== -1) exams[idx] = { ...exams[idx], ...updates };
  return simulateRequest(exams[idx]);
}
