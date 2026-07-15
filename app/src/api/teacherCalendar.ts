import { simulateRequest } from "@/api/http";
import { calendarEvents, academicPolicies } from "@/demo-data/teacher/calendar";
import type { CalendarEvent, AcademicPolicy } from "@/types";

export function getCalendarEvents(): Promise<CalendarEvent[]> {
  return simulateRequest(calendarEvents);
}
export function getAcademicPolicies(): Promise<AcademicPolicy[]> {
  return simulateRequest(academicPolicies);
}
