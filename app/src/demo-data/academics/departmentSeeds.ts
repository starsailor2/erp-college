export interface DepartmentSeed {
  id: string;
  name: string;
  building: string;
}

export const departmentSeeds: DepartmentSeed[] = [
  { id: "CSE", name: "Computer Science & Engineering", building: "Block A" },
  { id: "MATH", name: "Mathematics", building: "Block B" },
  { id: "PHY", name: "Physics", building: "Block B" },
  { id: "ECE", name: "Electronics & Communication Engineering", building: "Block C" },
  { id: "MECH", name: "Mechanical Engineering", building: "Block D" },
];

export const programByDepartment: Record<string, string> = {
  CSE: "B.Tech CSE",
  MATH: "B.Sc Mathematics",
  PHY: "B.Sc Physics",
  ECE: "B.Tech ECE",
  MECH: "B.Tech MECH",
};
