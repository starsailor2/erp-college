import type { DepartmentSummary } from "@/types";
import { students } from "@/demo-data/people/students";
import { createRng } from "@/demo-data/generators/random";

const { randomInt } = createRng(20260721);

const deptNames = ["Computer Science", "Electronics & Communication", "Mechanical", "Civil"];

function generateDepartments(): DepartmentSummary[] {
  return deptNames.map((name) => {
    const totalStudents = 280 + randomInt(0, 120);
    const topPerformers = students.slice(0, 3).map((s) => ({ rollNo: s.rollNo, name: s.name, avgMarksPct: 85 + randomInt(0, 12) }));
    return {
      name,
      totalStudents,
      facultyCount: 18 + randomInt(0, 12),
      atRiskCount: 15 + randomInt(0, 20),
      avgAttendancePct: 75 + randomInt(0, 12),
      avgMarksPct: 68 + randomInt(0, 14),
      yearBreakdown: [1, 2, 3, 4].map((year) => ({ year, students: Math.round(totalStudents / 4), avgMarksPct: 65 + randomInt(0, 20) })),
      topPerformers,
      completionPct: 60 + randomInt(0, 35),
    };
  });
}

export const departmentSummaries: DepartmentSummary[] = generateDepartments();

export function getDepartmentByName(name: string): DepartmentSummary | undefined {
  return departmentSummaries.find((d) => d.name === name);
}
