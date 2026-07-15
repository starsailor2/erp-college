import { simulateRequest } from "@/api/http";
import { academicRequests, nextRequestId } from "@/demo-data/student/requests";
import type { AcademicRequestType, StudentAcademicRequest } from "@/types";

export function getAcademicRequests(): Promise<StudentAcademicRequest[]> {
  return simulateRequest(academicRequests);
}

export function submitAcademicRequest(type: AcademicRequestType, details: string): Promise<StudentAcademicRequest> {
  const request: StudentAcademicRequest = {
    id: nextRequestId(),
    type,
    details,
    submittedOn: new Date().toISOString().slice(0, 10),
    status: "pending",
  };
  academicRequests.unshift(request);
  return simulateRequest(request);
}
