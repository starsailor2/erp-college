import { simulateRequest } from "@/api/http";
import { timetableClasses, getTimetableClassById } from "@/demo-data/academics/timetable";
import type { TimetableClass, TimetableEntry } from "@/types";

export function getTimetableClasses(): Promise<TimetableClass[]> {
  return simulateRequest(timetableClasses);
}

export function getTimetableClassByIdAsync(id: string): Promise<TimetableClass | undefined> {
  return simulateRequest(getTimetableClassById(id));
}

export function addTimetableEntry(classId: string, entry: TimetableEntry): Promise<TimetableEntry> {
  const cls = timetableClasses.find((c) => c.id === classId);
  if (cls) cls.entries.push(entry);
  return simulateRequest(entry);
}
