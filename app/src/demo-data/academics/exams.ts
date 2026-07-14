import type { Exam, ExamType } from "@/types";
import { courses } from "./courses";
import { students } from "@/demo-data/people/students";
import { createRng } from "@/demo-data/generators/random";

const { pick, weightedPick } = createRng(90260713);

const examTypes: [ExamType, number][] = [["written", 6], ["lab", 2], ["online", 1], ["practical", 1]];
const timeSlots: [string, string][] = [["09:00", "12:00"], ["13:00", "16:00"], ["14:00", "17:00"]];
const venuesWithCapacity: [string, number][] = [
  ["Hall A (Capacity: 200)", 200],
  ["Hall B (Capacity: 150)", 150],
  ["Hall C (Capacity: 50)", 50],
  ["Lab 1 (Capacity: 45)", 45],
  ["Lab 2 (Capacity: 45)", 45],
  ["Lab 3 (Capacity: 45)", 45],
  ["Remote Proctoring", 999],
];

function generateExams(): Exam[] {
  return courses.map((course, i) => {
    const day = 10 + (i % 15); // spreads across Dec 10-24
    const enrolledCount = students.filter((s) => s.courseIds.includes(course.id)).length;
    const [venue, capacity] = venuesWithCapacity[i % venuesWithCapacity.length];
    const [startTime, endTime] = pick(timeSlots);
    return {
      id: `exam-${i + 1}`,
      courseId: course.id,
      date: `2026-12-${String(day).padStart(2, "0")}`,
      startTime,
      endTime,
      type: weightedPick(examTypes),
      venue,
      capacity,
      enrolledCount,
      conflict: i === 1,
      capacityWarning: i === 4,
    };
  });
}

export const exams: Exam[] = generateExams();

export function getExamById(id: string): Exam | undefined {
  return exams.find((e) => e.id === id);
}
