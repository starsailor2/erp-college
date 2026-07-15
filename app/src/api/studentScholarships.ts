import { simulateRequest } from "@/api/http";
import { scholarships, scholarshipApplications } from "@/demo-data/student/scholarships";
import type { StudentScholarship, ScholarshipApplication } from "@/types";

export function getScholarships(): Promise<StudentScholarship[]> {
  return simulateRequest(scholarships);
}

export function getScholarshipApplications(): Promise<ScholarshipApplication[]> {
  return simulateRequest(scholarshipApplications);
}

export function applyScholarship(name: string): Promise<void> {
  const row = scholarships.find((s) => s.name === name);
  if (row) row.applied = true;
  scholarshipApplications.unshift({ name, appliedOn: new Date().toISOString().slice(0, 10), status: "pending" });
  return simulateRequest(undefined);
}
