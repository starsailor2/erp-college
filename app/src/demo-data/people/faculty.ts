import type { Faculty, FacultyDesignation, AccountStatus } from "@/types";
import { randomFullName } from "@/demo-data/generators/namePools";
import { pick, randomInt, weightedPick } from "@/demo-data/generators/random";
import { departmentSeeds } from "@/demo-data/academics/departmentSeeds";

const designations: [FacultyDesignation, number][] = [
  ["professor", 1],
  ["associate_professor", 2],
  ["assistant_professor", 4],
  ["lecturer", 2],
];

const qualifications = ["Ph.D.", "M.Tech", "M.Sc", "M.E.", "Ph.D. (Postdoc)"];

const specializations = [
  "Artificial Intelligence", "Data Structures", "Signal Processing",
  "Thermodynamics", "Number Theory", "Quantum Mechanics", "Control Systems",
  "Algorithms", "Fluid Dynamics", "Optics",
];

const FACULTY_PER_DEPARTMENT = 12;

function generateFaculty(): Faculty[] {
  const list: Faculty[] = [];
  let seq = 1;
  for (const dept of departmentSeeds) {
    for (let i = 0; i < FACULTY_PER_DEPARTMENT; i++) {
      const status: AccountStatus = weightedPick([["active", 9], ["on_leave", 1]]);
      const joiningYear = randomInt(2000, 2023);
      list.push({
        id: `FAC${String(seq).padStart(3, "0")}`,
        name: randomFullName(),
        departmentId: dept.id,
        designation: weightedPick(designations),
        email: `faculty${seq}@kalnet.edu`,
        phone: `9${randomInt(100000000, 999999999)}`,
        joiningDate: `${joiningYear}-${String(randomInt(1, 12)).padStart(2, "0")}-${String(randomInt(1, 28)).padStart(2, "0")}`,
        qualification: pick(qualifications),
        specialization: pick(specializations),
        experienceYears: 2026 - joiningYear,
        status,
        coursesTeaching: [],
      });
      seq++;
    }
  }
  return list;
}

export const faculty: Faculty[] = generateFaculty();

export function getFacultyById(id: string): Faculty | undefined {
  return faculty.find((f) => f.id === id);
}

export function getFacultyByDepartment(departmentId: string): Faculty[] {
  return faculty.filter((f) => f.departmentId === departmentId);
}
