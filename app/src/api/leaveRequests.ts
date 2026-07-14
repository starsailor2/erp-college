import { simulateRequest } from "@/api/http";
import { leaveRequests, getPendingLeaveRequestCount } from "@/demo-data/attendance/leaveRequests";
import type { LeaveRequest } from "@/types";

export function getLeaveRequests(): Promise<LeaveRequest[]> {
  return simulateRequest(leaveRequests);
}

export function getPendingLeaveCount(): Promise<number> {
  return simulateRequest(getPendingLeaveRequestCount());
}
