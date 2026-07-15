import type { StudentIssue } from "@/types";
import { students } from "@/demo-data/people/students";
import { createRng } from "@/demo-data/generators/random";

const { pick, randomInt, weightedPick } = createRng(20260725);

const issueTypes = [
  { issue: "Fee Payment Discrepancy", detail: "Fee ledger shows an unresolved discrepancy of ₹4,500 flagged by the student for the current semester." },
  { issue: "Hostel Room Conflict", detail: "Room allocation dispute with roommate over shared amenities, requesting mediation." },
  { issue: "Attendance Shortage Appeal", detail: "Student disputes an absence marked during a medical emergency and has supporting documents." },
  { issue: "Exam Re-evaluation Request", detail: "Requesting re-evaluation of Mid Exam answer script citing a marking inconsistency." },
  { issue: "Scholarship Delay", detail: "Merit scholarship disbursement is pending beyond the expected date, causing a fee payment delay." },
];
const raisers = ["Class Representative", "Warden", "Self", "Parent", "Counselor"];

function generateIssues(): StudentIssue[] {
  return students.slice(0, 8).map((s, i) => {
    const t = issueTypes[i % issueTypes.length];
    return {
      id: `SI-${String(i + 1).padStart(3, "0")}`,
      rollNo: s.rollNo,
      name: s.name,
      issue: t.issue,
      detail: t.detail,
      raisedBy: pick(raisers),
      date: `2026-0${2 + (i % 4)}-${String(10 + randomInt(0, 15)).padStart(2, "0")}`,
      priority: weightedPick([["normal", 5], ["high", 3], ["urgent", 1]]),
      status: i < 5 ? "open" : "resolved",
    };
  });
}

export const studentIssues: StudentIssue[] = generateIssues();
