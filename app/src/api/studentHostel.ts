import { simulateRequest } from "@/api/http";
import { hostelRequests, nextHostelRequestId, messState } from "@/demo-data/student/hostel";
import type { HostelRequest, HostelRequestType } from "@/types";

export function getHostelRequests(): Promise<HostelRequest[]> {
  return simulateRequest(hostelRequests);
}

export function getHostelRequestById(id: string): Promise<HostelRequest | undefined> {
  return simulateRequest(hostelRequests.find((r) => r.id === id));
}

export function submitHostelRequest(type: HostelRequestType, details: string): Promise<HostelRequest> {
  const request: HostelRequest = {
    id: nextHostelRequestId(),
    type,
    details,
    submittedOn: new Date().toISOString().slice(0, 10),
    status: "pending",
    timeline: [{ time: new Date().toISOString().slice(0, 10), action: "Request submitted" }],
  };
  hostelRequests.unshift(request);
  return simulateRequest(request);
}

export function getMealPlan(): Promise<string> {
  return simulateRequest(messState.mealPlan);
}

export function updateMealPlan(plan: string): Promise<void> {
  messState.mealPlan = plan;
  return simulateRequest(undefined);
}
