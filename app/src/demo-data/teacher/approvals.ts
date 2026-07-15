import type { AttendanceApprovalEntry, MarksApprovalEntry } from "@/types";
import { faculty } from "@/demo-data/people/faculty";
import { createRng } from "@/demo-data/generators/random";

const { randomInt, weightedPick, pick } = createRng(20260723);

const courses = ["CS201", "CS202", "CS203", "CS301", "CS302"];
const sections = ["A", "B"];

function dateStr(month: number, day: number): string {
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function generateAttendanceApprovals(): AttendanceApprovalEntry[] {
  return courses.map((course, i) => ({
    id: `AA-${String(i + 1).padStart(3, "0")}`,
    course,
    facultyName: pick(faculty).name,
    date: dateStr(3, 10 + i),
    section: pick(sections),
    students: 35 + randomInt(0, 20),
    submitted: dateStr(3, 10 + i),
    status: weightedPick([["pending", 3], ["approved", 4], ["rejected", 1]]),
  }));
}

function generateMarksApprovals(): MarksApprovalEntry[] {
  const assessments = ["Quiz1", "Quiz2", "MidExam", "Assignment1"];
  const maxMarksByAssessment: Record<string, number> = { Quiz1: 10, Quiz2: 10, MidExam: 30, Assignment1: 20 };
  return courses.map((course, i) => {
    const assessment = assessments[i % assessments.length];
    return {
      id: `MA-${String(i + 1).padStart(3, "0")}`,
      course,
      facultyName: pick(faculty).name,
      assessment,
      maxMarks: maxMarksByAssessment[assessment],
      submittedOn: dateStr(4, 5 + i),
      status: weightedPick([["pending", 3], ["approved", 4], ["rejected", 1]]),
    };
  });
}

export const attendanceApprovals: AttendanceApprovalEntry[] = generateAttendanceApprovals();
export const marksApprovals: MarksApprovalEntry[] = generateMarksApprovals();
