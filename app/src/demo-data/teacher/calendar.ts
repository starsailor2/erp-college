import type { CalendarEvent, AcademicPolicy } from "@/types";

export const calendarEvents: CalendarEvent[] = [
  { id: "CE-001", event: "Mid-Semester Exams", startDate: "2026-08-10", endDate: "2026-08-17", status: "upcoming" },
  { id: "CE-002", event: "Internal Marks Submission Deadline", startDate: "2026-07-20", endDate: "2026-07-20", status: "active" },
  { id: "CE-003", event: "Summer Break", startDate: "2026-06-01", endDate: "2026-06-30", status: "closed" },
  { id: "CE-004", event: "End-Semester Exams", startDate: "2026-11-20", endDate: "2026-12-05", status: "upcoming" },
];

export const academicPolicies: AcademicPolicy[] = [
  { name: "Minimum Attendance Policy", description: "Students must maintain at least 75% attendance per course to be eligible for end-semester exams." },
  { name: "Grade Change Window", description: "Grade change requests must be raised within 10 days of result publication." },
  { name: "Leave Approval Escalation", description: "Faculty leave requests exceeding 5 days require Dean approval in addition to HOD sign-off." },
  { name: "Re-evaluation Policy", description: "Students may request re-evaluation of a single assessment per course, per semester." },
];
