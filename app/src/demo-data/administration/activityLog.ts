import type { ActivityLogEntry, ActivityCategory } from "@/types";
import { randomFullName } from "@/demo-data/generators/namePools";
import { createRng } from "@/demo-data/generators/random";
import { departmentSeeds } from "@/demo-data/academics/departmentSeeds";

const { pick, randomInt } = createRng(80260711);

const activitiesByCategory: [string, ActivityCategory][] = [
  ["Updated course syllabus", "academic"],
  ["Published exam results", "academic"],
  ["Uploaded lecture notes", "academic"],
  ["Added new course", "academic"],
  ["Submitted attendance report", "operations"],
  ["Approved leave request", "operations"],
  ["Reviewed student grievance", "operations"],
  ["Scheduled department meeting", "operations"],
  ["Updated fee structure", "finance"],
  ["Processed admission request", "finance"],
];

const statuses: ActivityLogEntry["status"][] = ["completed", "pending_approval", "scheduled"];

function generateActivityLog(): ActivityLogEntry[] {
  const list: ActivityLogEntry[] = [];
  for (let i = 0; i < 15; i++) {
    const [activity, category] = pick(activitiesByCategory);
    const day = String(randomInt(1, 13)).padStart(2, "0");
    const hour = String(randomInt(8, 18)).padStart(2, "0");
    const minute = String(randomInt(0, 59)).padStart(2, "0");
    list.push({
      id: `act-${i + 1}`,
      timestamp: `2026-07-${day}T${hour}:${minute}:00Z`,
      actorName: randomFullName(pick),
      activity,
      departmentId: pick(departmentSeeds).id,
      category,
      status: pick(statuses),
    });
  }
  return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export const activityLog: ActivityLogEntry[] = generateActivityLog();
