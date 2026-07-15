import type { IntentDefinition } from "@/command-center/types";
import { studentIntents } from "@/command-center/intents/students";
import { attendanceTodayIntents } from "@/command-center/intents/attendanceToday";
import { facultyIntents } from "@/command-center/intents/faculty";
import { departmentIntents } from "@/command-center/intents/departments";
import { hostelIntents } from "@/command-center/intents/hostel";

// Order matters: interpret() returns the first matching intent, so more
// specific/keyword-constrained intents should appear before broader ones.
export const intentDefinitions: IntentDefinition[] = [
  ...studentIntents,
  ...attendanceTodayIntents,
  ...facultyIntents,
  ...departmentIntents,
  ...hostelIntents,
];
