import type { FacultyRosterEntry, CourseCoverageEntry } from "@/types";
import { faculty } from "@/demo-data/people/faculty";
import { createRng } from "@/demo-data/generators/random";

const { randomInt, weightedPick } = createRng(20260722);

function designationLabel(d: string): string {
  return d.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const roster: FacultyRosterEntry[] = faculty.slice(0, 12).map((f) => {
  const courseCount = 2 + randomInt(0, 2);
  return {
    id: f.id,
    name: f.name,
    designation: designationLabel(f.designation),
    courseCount,
    studentCount: courseCount * (35 + randomInt(0, 20)),
    avgLoad: `${(4 + randomInt(0, 6)).toFixed(1)} hrs/wk`,
    status: weightedPick([["active", 9], ["on_leave", 1]]),
  };
});

const courseNames = ["CS201", "CS202", "CS203", "CS301", "CS302", "CS401"];

const coverage: CourseCoverageEntry[] = courseNames.map((course, i) => {
  const covered = i < courseNames.length - 1;
  return {
    course,
    facultyName: covered ? roster[i % roster.length].name : "—",
    section: weightedPick([["A", 1], ["B", 1]]),
    students: 35 + randomInt(0, 25),
    semester: `Semester ${3 + (i % 4)}`,
    status: covered ? "covered" : "gap",
  };
});

export const facultyRoster: FacultyRosterEntry[] = roster;
export const courseCoverage: CourseCoverageEntry[] = coverage;
