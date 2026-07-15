export interface CommandCategory {
  id: string;
  label: string;
  keywords: string[];
  examples: string[];
}

export const commandCategories: CommandCategory[] = [
  { id: "fees", label: "Fees", keywords: ["fee", "fees"], examples: ["Students with pending fees", "Students with overdue fees"] },
  { id: "students", label: "Students", keywords: ["student", "students", "cgpa", "backlog"], examples: ["Students below 75% attendance", "Backlog students", "Top students by CGPA"] },
  { id: "attendance", label: "Attendance", keywords: ["attendance", "absent"], examples: ["How many students absent today"] },
  { id: "faculty", label: "Faculty", keywords: ["faculty", "professor", "professors", "teacher", "lecturer"], examples: ["Faculty on leave", "Professors in CSE department", "Faculty with more than 10 years experience"] },
  { id: "departments", label: "Departments", keywords: ["department", "departments"], examples: ["At-risk students by department", "Department with lowest attendance"] },
  { id: "hostel", label: "Hostel", keywords: ["hostel"], examples: ["Hostel occupancy"] },
  { id: "library", label: "Library", keywords: ["book", "books", "library"], examples: ["Overdue library books"] },
  { id: "tickets", label: "Tickets", keywords: ["ticket", "tickets"], examples: ["Open critical tickets", "Tickets breaching SLA"] },
  { id: "exams", label: "Exams & Notices", keywords: ["exam", "exams", "notice", "notices"], examples: ["Upcoming exams", "Recent notices"] },
  { id: "system", label: "System", keywords: ["system", "audit"], examples: ["System health status", "Failed logins"] },
];

export function matchCategory(queryLower: string): CommandCategory | null {
  return commandCategories.find((c) => c.keywords.some((k) => queryLower.includes(k))) ?? null;
}
