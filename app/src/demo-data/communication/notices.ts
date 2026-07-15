import type { Notice, NoticeStatus } from "@/types";
import { randomFullName } from "@/demo-data/generators/namePools";
import { createRng } from "@/demo-data/generators/random";

const { pick, weightedPick, randomInt } = createRng(15071501);

const noticeTitles = [
  "Fall Semester Exam Schedule", "Payroll System Maintenance", "Campus Parking Policy Update",
  "Library Holiday Hours", "Mid-Term Break Announcement", "Convocation Ceremony 2026",
  "Hostel Fee Payment Deadline", "New Course Registration Open", "Annual Sports Day",
  "Placement Drive Schedule", "Campus Wi-Fi Maintenance Window", "Scholarship Application Deadline",
  "Guest Lecture Series - AI & Robotics", "Semester Break Notice", "Fee Payment Reminder",
];

const audiences = ["Students", "Faculty", "Staff", "Faculty, Staff", "All"];

const statuses: [NoticeStatus, number][] = [["published", 60], ["scheduled", 20], ["draft", 20]];

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const NOTICE_COUNT = 15;

function generateNotices(): Notice[] {
  const list: Notice[] = [];
  for (let i = 0; i < NOTICE_COUNT; i++) {
    const status = weightedPick(statuses);
    list.push({
      id: `NOT-2026-${String(892 - i * 3).padStart(3, "0")}`,
      title: pick(noticeTitles),
      status,
      audience: status === "draft" ? "Not set" : pick(audiences),
      author: randomFullName(pick),
      publishedDate: status === "draft" ? null : dateStr(2026, randomInt(1, 7), randomInt(1, 28)),
    });
  }
  return list;
}

export const notices: Notice[] = generateNotices();
