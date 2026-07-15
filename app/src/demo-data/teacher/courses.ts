import type { TeacherCourse } from "@/types";
import { students } from "@/demo-data/people/students";
import { createRng } from "@/demo-data/generators/random";

const { randomInt } = createRng(20260715);

const courseSeeds = [
  { id: "CS201", name: "Data Structures", section: "A" },
  { id: "CS202", name: "Database Management Systems", section: "B" },
  { id: "CS203", name: "Operating Systems", section: "A" },
  { id: "CS204", name: "Computer Networks", section: "B" },
];

const csStudents = students.filter((s) => s.departmentId === "CSE");

function generateCourses(): TeacherCourse[] {
  return courseSeeds.map((c, i) => {
    const slice = csStudents.slice(i * 45, i * 45 + 45);
    const roster = slice.length > 0 ? slice : csStudents.slice(0, 45);
    return {
      id: c.id,
      name: c.name,
      section: c.section,
      studentIds: roster.map((s) => s.id),
      avgAttendancePct: 78 + randomInt(0, 10),
      avgMarksPct: 70 + randomInt(0, 12),
    };
  });
}

export const teacherCourses: TeacherCourse[] = generateCourses();

export function getTeacherCourseById(id: string): TeacherCourse | undefined {
  return teacherCourses.find((c) => c.id === id);
}
