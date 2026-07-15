import type { MarksSubmission } from "@/types";
import { teacherCourses } from "@/demo-data/teacher/courses";
import { createRng } from "@/demo-data/generators/random";

const { pick, randomInt } = createRng(20260717);

const assessments = ["Quiz1", "Quiz2", "Assignment1", "MidExam"];
const statuses: MarksSubmission["status"][] = ["approved", "submitted", "pending_hod_review"];

function dateStr(month: number, day: number): string {
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const SUBMISSION_COUNT = 8;

function generateSubmissions(): MarksSubmission[] {
  const list: MarksSubmission[] = [];
  for (let i = 0; i < SUBMISSION_COUNT; i++) {
    const course = pick(teacherCourses);
    const maxMarks = 20;
    list.push({
      id: `MRK-${2000 + i}`,
      courseId: course.id,
      assessment: pick(assessments),
      maxMarks,
      date: dateStr(randomInt(1, 7), randomInt(1, 28)),
      status: statuses[i % statuses.length],
      records: course.studentIds.map((studentId) => ({ studentId, marks: randomInt(8, maxMarks) })),
    });
  }
  return list;
}

export const marksSubmissions: MarksSubmission[] = generateSubmissions();

export function getMarksSubmissionById(id: string): MarksSubmission | undefined {
  return marksSubmissions.find((s) => s.id === id);
}
