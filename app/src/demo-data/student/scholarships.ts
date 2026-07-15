import type { StudentScholarship, ScholarshipApplication } from "@/types";

export const scholarships: StudentScholarship[] = [
  { name: "Merit Scholarship", amount: 50000, eligibility: "CGPA >= 8.5", deadline: "2026-08-30", applied: true },
  { name: "Need-Based Grant", amount: 30000, eligibility: "Family income below ₹5,00,000/year", deadline: "2026-09-15", applied: false },
  { name: "Sports Excellence Award", amount: 20000, eligibility: "State/National level sports achievement", deadline: "2026-09-01", applied: false },
];

export const scholarshipApplications: ScholarshipApplication[] = [
  { name: "Merit Scholarship", appliedOn: "2025-08-15", status: "approved" },
];
