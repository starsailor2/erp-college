import type { TeacherDocument } from "@/types";
import { createRng } from "@/demo-data/generators/random";

const { pick, randomInt } = createRng(20260720);

const docTitles: { title: string; docType: string }[] = [
  { title: "Annual Examination Schedule - 2026", docType: "academic" },
  { title: "Lab Safety Compliance Form", docType: "administrative" },
  { title: "Research Grant Endorsement", docType: "research" },
  { title: "Student Disciplinary Report", docType: "student" },
  { title: "Semester Budget Approval", docType: "finance" },
  { title: "Course Curriculum Revision", docType: "academic" },
];

function dateStr(month: number, day: number): string {
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const DOCUMENT_COUNT = 12;

function generateDocuments(): TeacherDocument[] {
  const list: TeacherDocument[] = [];
  for (let i = 0; i < DOCUMENT_COUNT; i++) {
    const source = pick(docTitles);
    const direction: TeacherDocument["direction"] = i < 4 ? "assigned_to_me" : i < 7 ? "sent_by_me" : "assigned_to_me";
    const status: TeacherDocument["status"] = i < 4 ? "pending" : i < 7 ? "in_progress" : "completed";
    list.push({
      id: `TDOC-${300 + i}`,
      title: source.title,
      docType: source.docType,
      fromName: "Dr. Amit Singh",
      initiatedDate: dateStr(randomInt(1, 6), randomInt(1, 28)),
      priority: i === 0 ? "urgent" : "normal",
      status,
      direction,
      progressPct: direction === "sent_by_me" && status === "in_progress" ? randomInt(30, 80) : undefined,
    });
  }
  return list;
}

export const teacherDocuments: TeacherDocument[] = generateDocuments();

export function getTeacherDocumentById(id: string): TeacherDocument | undefined {
  return teacherDocuments.find((d) => d.id === id);
}
