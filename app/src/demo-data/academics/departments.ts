import type { Department } from "@/types";
import { departmentSeeds } from "./departmentSeeds";
import { faculty } from "@/demo-data/people/faculty";
import { randomInt } from "@/demo-data/generators/random";

function generateDepartments(): Department[] {
  return departmentSeeds.map((seed) => {
    const deptFaculty = faculty.filter((f) => f.departmentId === seed.id);
    const hod = deptFaculty.find((f) => f.designation === "professor") ?? deptFaculty[0];
    return {
      id: seed.id,
      name: seed.name,
      hodFacultyId: hod?.id ?? "",
      building: seed.building,
      budgetLakh: randomInt(120, 260),
      status: "active",
      avgClassSize: randomInt(24, 36),
      passRatePct: randomInt(82, 98),
      researchPapers: randomInt(15, 45),
      avgAttendancePct: randomInt(78, 94),
      avgMarksPct: randomInt(65, 88),
      atRiskStudentCount: randomInt(3, 25),
    };
  });
}

export const departments: Department[] = generateDepartments();

export function getDepartmentById(id: string): Department | undefined {
  return departments.find((d) => d.id === id);
}
