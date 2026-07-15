import type { TeacherNotice, TeacherNoticeAudience } from "@/types";
import { createRng } from "@/demo-data/generators/random";

const { pick, weightedPick, randomInt } = createRng(20260719);

const titles = [
  "CS201 Lab Rescheduled", "Project Deadline Extended", "Guest Lecture on AI Ethics",
  "Mid-Sem Doubt Clearing Session", "Lab Manual Updated", "Assignment Submission Portal Live",
  "Extra Class This Saturday", "Semester Project Groups Finalized",
];
const audiences: [TeacherNoticeAudience, number][] = [["my_courses", 60], ["department", 25], ["institute", 15]];

function dateStr(month: number, day: number): string {
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const NOTICE_COUNT = 8;

function generateNotices(): TeacherNotice[] {
  const list: TeacherNotice[] = [];
  for (let i = 0; i < NOTICE_COUNT; i++) {
    const publishedMonth = randomInt(1, 6);
    list.push({
      id: `TNOT-${100 + i}`,
      title: pick(titles),
      content: "Please see attached details and reach out with questions.",
      audience: weightedPick(audiences),
      priority: i === 0 ? "high" : "normal",
      expiryDate: dateStr(publishedMonth + 1, randomInt(1, 28)),
      publishedDate: dateStr(publishedMonth, randomInt(1, 28)),
      views: randomInt(10, 60),
    });
  }
  return list;
}

export const teacherNotices: TeacherNotice[] = generateNotices();
