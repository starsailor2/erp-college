import { simulateRequest } from "@/api/http";
import { facultyRoster, courseCoverage } from "@/demo-data/teacher/facultyRoster";
import type { FacultyRosterEntry, CourseCoverageEntry } from "@/types";

export function getFacultyRoster(): Promise<FacultyRosterEntry[]> {
  return simulateRequest(facultyRoster);
}

export function getCourseCoverage(): Promise<CourseCoverageEntry[]> {
  return simulateRequest(courseCoverage);
}
