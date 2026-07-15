import { simulateRequest } from "@/api/http";
import { teacherDocuments, getTeacherDocumentById } from "@/demo-data/teacher/documents";
import type { TeacherDocument } from "@/types";

export function getTeacherDocuments(): Promise<TeacherDocument[]> {
  return simulateRequest(teacherDocuments);
}

export function signTeacherDocument(id: string): Promise<TeacherDocument | undefined> {
  const doc = getTeacherDocumentById(id);
  if (doc && doc.status === "pending") {
    doc.status = "completed";
  }
  return simulateRequest(doc);
}
