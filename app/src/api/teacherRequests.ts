import { simulateRequest } from "@/api/http";
import { leaveRequests, gradeChangeRequests, resourceRequests, nextRequestId } from "@/demo-data/teacher/requests";
import type { TeacherLeaveRequest, GradeChangeRequest, ResourceRequest } from "@/types";

export function getLeaveRequests(): Promise<TeacherLeaveRequest[]> {
  return simulateRequest(leaveRequests);
}
export function addLeaveRequest(entry: Omit<TeacherLeaveRequest, "id" | "hodStatus" | "deanStatus" | "raisedOn">): Promise<TeacherLeaveRequest> {
  const full: TeacherLeaveRequest = { ...entry, id: nextRequestId("LV", leaveRequests), hodStatus: "pending_approval", deanStatus: null, raisedOn: new Date().toISOString().slice(0, 10) };
  leaveRequests.unshift(full);
  return simulateRequest(full);
}

export function getGradeChangeRequests(): Promise<GradeChangeRequest[]> {
  return simulateRequest(gradeChangeRequests);
}
export function addGradeChangeRequest(entry: Omit<GradeChangeRequest, "id" | "hodStatus" | "deanStatus" | "raisedOn">): Promise<GradeChangeRequest> {
  const full: GradeChangeRequest = { ...entry, id: nextRequestId("GC", gradeChangeRequests), hodStatus: "pending_approval", deanStatus: null, raisedOn: new Date().toISOString().slice(0, 10) };
  gradeChangeRequests.unshift(full);
  return simulateRequest(full);
}

export function getResourceRequests(): Promise<ResourceRequest[]> {
  return simulateRequest(resourceRequests);
}
export function addResourceRequest(entry: Omit<ResourceRequest, "id" | "hodStatus" | "deanStatus">): Promise<ResourceRequest> {
  const full: ResourceRequest = { ...entry, id: nextRequestId("RS", resourceRequests), hodStatus: "pending_approval", deanStatus: null };
  resourceRequests.unshift(full);
  return simulateRequest(full);
}

export type DeanRequestType = "leave" | "grade-change" | "resource";

function listForType(type: DeanRequestType) {
  if (type === "leave") return leaveRequests;
  if (type === "grade-change") return gradeChangeRequests;
  return resourceRequests;
}

export function approveDeanRequest(type: DeanRequestType, id: string): Promise<void> {
  const row = listForType(type).find((r) => r.id === id);
  if (row) row.deanStatus = "approved";
  return simulateRequest(undefined);
}

export function rejectDeanRequest(type: DeanRequestType, id: string): Promise<void> {
  const row = listForType(type).find((r) => r.id === id);
  if (row) row.deanStatus = "rejected";
  return simulateRequest(undefined);
}
