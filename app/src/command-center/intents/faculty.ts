import { getFaculty } from "@/api/faculty";
import { getDepartments } from "@/api/departments";
import { departmentSeeds } from "@/demo-data/academics/departmentSeeds";
import type { CommandResult, CommandTableRow, IntentDefinition } from "@/command-center/types";
import { extractPercent, extractComparisonDirection, matchByNameOrId } from "@/command-center/shared";

const FACULTY_WORDS = ["faculty", "professor", "professors", "teacher", "teachers", "lecturer", "lecturers"];

function mentionsFaculty(queryLower: string): boolean {
  return FACULTY_WORDS.some((w) => queryLower.includes(w));
}

function isFacultyOnLeaveQuery(queryLower: string): boolean {
  return mentionsFaculty(queryLower) && queryLower.includes("leave");
}

async function executeFacultyOnLeaveQuery(): Promise<CommandResult> {
  const faculty = await getFaculty();
  const onLeave = faculty.filter((f) => f.status === "on_leave");

  const rows: CommandTableRow[] = onLeave.slice(0, 8).map((f) => ({
    id: f.id,
    path: "/admin/faculty",
    name: f.name,
    designation: f.designation.replace(/_/g, " "),
    email: f.email,
  }));

  return {
    kind: "record-table",
    summary: `${onLeave.length} faculty member${onLeave.length === 1 ? " is" : "s are"} currently on leave.`,
    note: onLeave.length > 0 ? "Open the Faculty page to see full details for any row." : undefined,
    columns: [
      { key: "name", label: "Name" },
      { key: "designation", label: "Designation" },
      { key: "email", label: "Email" },
    ],
    rows,
    viewAllPath: "/admin/faculty",
    viewAllLabel: "View all faculty",
  };
}

const facultyOnLeaveIntent: IntentDefinition = {
  id: "faculty-on-leave",
  matches: isFacultyOnLeaveQuery,
  execute: executeFacultyOnLeaveQuery,
};

function isFacultyExperienceQuery(queryLower: string): boolean {
  return (
    mentionsFaculty(queryLower) &&
    queryLower.includes("experience") &&
    extractComparisonDirection(queryLower) !== null &&
    extractPercent(queryLower) !== null
  );
}

async function executeFacultyExperienceQuery(query: string): Promise<CommandResult> {
  const queryLower = query.toLowerCase();
  const threshold = extractPercent(queryLower) as number;
  const direction = extractComparisonDirection(queryLower) as "below" | "above";
  const faculty = await getFaculty();
  const matching = faculty.filter((f) => (direction === "below" ? f.experienceYears < threshold : f.experienceYears > threshold));
  const sorted = [...matching].sort((a, b) => (direction === "below" ? a.experienceYears - b.experienceYears : b.experienceYears - a.experienceYears));

  const rows: CommandTableRow[] = sorted.slice(0, 8).map((f) => ({
    id: f.id,
    path: "/admin/faculty",
    name: f.name,
    designation: f.designation.replace(/_/g, " "),
    experience: `${f.experienceYears} yrs`,
  }));

  return {
    kind: "record-table",
    summary: `${matching.length} faculty member${matching.length === 1 ? " has" : "s have"} ${direction === "below" ? "under" : "over"} ${threshold} years of experience.`,
    columns: [
      { key: "name", label: "Name" },
      { key: "designation", label: "Designation" },
      { key: "experience", label: "Experience" },
    ],
    rows,
    viewAllPath: "/admin/faculty",
    viewAllLabel: "View all faculty",
  };
}

const facultyExperienceIntent: IntentDefinition = {
  id: "faculty-experience-threshold",
  matches: isFacultyExperienceQuery,
  execute: executeFacultyExperienceQuery,
};

function isFacultyByDepartmentQuery(queryLower: string): boolean {
  return mentionsFaculty(queryLower) && matchByNameOrId(queryLower, departmentSeeds) !== null;
}

async function executeFacultyByDepartmentQuery(query: string): Promise<CommandResult> {
  const queryLower = query.toLowerCase();
  const seed = matchByNameOrId(queryLower, departmentSeeds) as { id: string; name: string };
  const [faculty, departments] = await Promise.all([getFaculty(), getDepartments()]);
  const department = departments.find((d) => d.id === seed.id);
  const matching = faculty.filter((f) => f.departmentId === seed.id);

  const rows: CommandTableRow[] = matching.slice(0, 8).map((f) => ({
    id: f.id,
    path: "/admin/faculty",
    name: f.name,
    designation: f.designation.replace(/_/g, " "),
    email: f.email,
  }));

  return {
    kind: "record-table",
    summary: `${matching.length} faculty member${matching.length === 1 ? "" : "s"} in ${department?.name ?? seed.name}.`,
    columns: [
      { key: "name", label: "Name" },
      { key: "designation", label: "Designation" },
      { key: "email", label: "Email" },
    ],
    rows,
    viewAllPath: "/admin/faculty",
    viewAllLabel: "View all faculty",
  };
}

const facultyByDepartmentIntent: IntentDefinition = {
  id: "faculty-by-department",
  matches: isFacultyByDepartmentQuery,
  execute: executeFacultyByDepartmentQuery,
};

export const facultyIntents: IntentDefinition[] = [
  facultyOnLeaveIntent,
  facultyExperienceIntent,
  facultyByDepartmentIntent,
];
