import type { LeaveRequest, LeaveStatus } from "@/types";
import { students } from "@/demo-data/people/students";
import { createRng } from "@/demo-data/generators/random";

const { pick, randomInt, weightedPick } = createRng(90260712);

const reasons = ["Medical leave", "Family function", "Personal reasons", "Sick leave", "Travel", "Bereavement"];
const statuses: [LeaveStatus, number][] = [["pending", 4], ["approved", 5], ["rejected", 1]];

const LEAVE_REQUEST_COUNT = 20;

function generateLeaveRequests(): LeaveRequest[] {
  const list: LeaveRequest[] = [];
  for (let i = 0; i < LEAVE_REQUEST_COUNT; i++) {
    const student = pick(students);
    const fromDay = randomInt(1, 20);
    const duration = randomInt(1, 4);
    list.push({
      id: `leave-${i + 1}`,
      studentId: student.id,
      fromDate: `2026-07-${String(fromDay).padStart(2, "0")}`,
      toDate: `2026-07-${String(fromDay + duration).padStart(2, "0")}`,
      reason: pick(reasons),
      status: weightedPick(statuses),
    });
  }
  return list;
}

export const leaveRequests: LeaveRequest[] = generateLeaveRequests();

export function getPendingLeaveRequestCount(): number {
  return leaveRequests.filter((l) => l.status === "pending").length;
}
