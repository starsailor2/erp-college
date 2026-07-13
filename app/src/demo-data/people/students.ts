import type { Student, AcademicStatus, FeeStatus } from "@/types";
import { randomFullName } from "@/demo-data/generators/namePools";
import { pick, randomInt, weightedPick } from "@/demo-data/generators/random";
import { departmentSeeds, programByDepartment } from "@/demo-data/academics/departmentSeeds";
import { getCoursesByDepartment } from "@/demo-data/academics/courses";

const CURRENT_YEAR = 2026;
const STUDENTS_PER_DEPT_PER_YEAR = 25; // 5 depts * 4 years * 25 = 500

const streetNames = ["MG Road", "Park Street", "Station Road", "College Avenue", "Lake View"];

function generateStudents(): Student[] {
  const list: Student[] = [];
  let seq = 1;
  for (const dept of departmentSeeds) {
    const deptCourses = getCoursesByDepartment(dept.id);
    for (let year = 1; year <= 4; year++) {
      const admissionYear = CURRENT_YEAR - (year - 1);
      for (let i = 0; i < STUDENTS_PER_DEPT_PER_YEAR; i++) {
        const status: AcademicStatus = weightedPick([["regular", 9], ["backlog", 1]]);
        const feeStatus: FeeStatus = weightedPick([["paid", 8], ["pending", 2]]);
        list.push({
          id: `STU-${String(seq).padStart(4, "0")}`,
          rollNo: `${admissionYear}-${dept.id}-${String(i + 1).padStart(3, "0")}`,
          name: randomFullName(),
          email: `student${seq}@kalnet.edu`,
          phone: `9${randomInt(100000000, 999999999)}`,
          departmentId: dept.id,
          program: programByDepartment[dept.id],
          year: year as 1 | 2 | 3 | 4,
          semester: year * 2 - pick([0, 1]),
          batch: `${admissionYear}-${admissionYear + 4}`,
          enrollmentDate: `${admissionYear}-08-${String(randomInt(1, 28)).padStart(2, "0")}`,
          status,
          attendancePct: randomInt(65, 99),
          cgpa: randomInt(60, 98) / 10,
          feeStatus,
          address: `${randomInt(1, 200)}, ${pick(streetNames)}, City`,
          guardianName: randomFullName(),
          guardianContact: `9${randomInt(100000000, 999999999)}`,
          courseIds: deptCourses.slice(0, 5).map((c) => c.id),
        });
        seq++;
      }
    }
  }
  return list;
}

export const students: Student[] = generateStudents();

export function getStudentById(id: string): Student | undefined {
  return students.find((s) => s.id === id);
}

export function getStudentsByDepartment(departmentId: string): Student[] {
  return students.filter((s) => s.departmentId === departmentId);
}
