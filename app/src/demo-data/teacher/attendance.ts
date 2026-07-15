import type { AttendanceSubmission, AttendanceMarkStatus } from "@/types";
import { teacherCourses } from "@/demo-data/teacher/courses";
import { createRng } from "@/demo-data/generators/random";

const { pick, weightedPick, randomInt } = createRng(20260716);

const statuses: [AttendanceMarkStatus, number][] = [["present", 82], ["absent", 12], ["medical", 4], ["other", 2]];

function dateStr(month: number, day: number): string {
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const SUBMISSION_COUNT = 10;

function generateSubmissions(): AttendanceSubmission[] {
  const list: AttendanceSubmission[] = [];
  for (let i = 0; i < SUBMISSION_COUNT; i++) {
    const course = pick(teacherCourses);
    list.push({
      id: `ATT-${1000 + i}`,
      courseId: course.id,
      section: course.section,
      session: i % 2 === 0 ? "forenoon" : "afternoon",
      date: dateStr(randomInt(1, 7), randomInt(1, 28)),
      records: course.studentIds.map((studentId) => ({
        studentId,
        status: weightedPick(statuses),
        remarks: "",
      })),
    });
  }
  return list;
}

export const attendanceSubmissions: AttendanceSubmission[] = generateSubmissions();

export function getSubmissionById(id: string): AttendanceSubmission | undefined {
  return attendanceSubmissions.find((s) => s.id === id);
}
