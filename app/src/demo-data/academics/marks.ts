import type { Mark } from "@/types";
import { students } from "@/demo-data/people/students";
import { createRng } from "@/demo-data/generators/random";

const { randomInt } = createRng(90260714);

function gradeForMarks(marksObtained: number): string {
  if (marksObtained >= 90) return "A+";
  if (marksObtained >= 80) return "A";
  if (marksObtained >= 70) return "B";
  if (marksObtained >= 60) return "C";
  return "D";
}

function generateMarks(): Mark[] {
  const list: Mark[] = [];
  let seq = 1;
  for (const student of students) {
    for (const courseId of student.courseIds) {
      const marksObtained = randomInt(55, 98);
      list.push({
        id: `mark-${seq}`,
        studentId: student.id,
        courseId,
        marksObtained,
        maxMarks: 100,
        grade: gradeForMarks(marksObtained),
      });
      seq++;
    }
  }
  return list;
}

export const marks: Mark[] = generateMarks();

export function getMarksByStudent(studentId: string): Mark[] {
  return marks.filter((m) => m.studentId === studentId);
}

export function getStudentRank(studentId: string): { rank: number; cohortSize: number } {
  const student = students.find((s) => s.id === studentId);
  if (!student) return { rank: 0, cohortSize: 0 };
  const cohort = students
    .filter((s) => s.departmentId === student.departmentId && s.year === student.year)
    .sort((a, b) => b.cgpa - a.cgpa);
  const rank = cohort.findIndex((s) => s.id === studentId) + 1;
  return { rank, cohortSize: cohort.length };
}
