import type { TimetableClass, TimetableEntry } from "@/types";
import { departmentSeeds } from "./departmentSeeds";
import { courses, getCourseLevel } from "./courses";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DAY_SLOT_TEMPLATE: { time: string; type: "class" | "break" | "lunch" }[] = [
  { time: "09:00 - 10:00", type: "class" },
  { time: "10:00 - 11:00", type: "class" },
  { time: "11:00 - 11:15", type: "break" },
  { time: "11:15 - 12:15", type: "class" },
  { time: "12:15 - 13:00", type: "lunch" },
  { time: "13:00 - 14:00", type: "class" },
  { time: "14:00 - 15:00", type: "class" },
];

function buildEntriesForClass(departmentId: string, year: 1 | 2 | 3 | 4): TimetableEntry[] {
  const level = year * 100;
  const yearCourses = courses.filter((c) => c.departmentId === departmentId && getCourseLevel(c) === level);
  const pool = yearCourses.length > 0 ? yearCourses : courses.filter((c) => c.departmentId === departmentId);

  const entries: TimetableEntry[] = [];
  let courseCursor = 0;

  for (const day of DAYS) {
    let classSlotIndex = 0;
    for (const slot of DAY_SLOT_TEMPLATE) {
      if (slot.type === "break") {
        entries.push({ day, time: slot.time, type: "break", label: "Break" });
      } else if (slot.type === "lunch") {
        entries.push({ day, time: slot.time, type: "lunch", label: "Lunch Break" });
      } else if (day === "Saturday") {
        entries.push({ day, time: slot.time, type: "class", label: "Lab Session" });
        classSlotIndex++;
      } else if (day === "Friday" && classSlotIndex >= 3) {
        entries.push({ day, time: slot.time, type: "class", label: "Tutorial" });
        classSlotIndex++;
      } else {
        const course = pool[courseCursor % pool.length];
        courseCursor++;
        entries.push({ day, time: slot.time, type: "class", courseId: course.id, facultyId: course.instructorFacultyId });
        classSlotIndex++;
      }
    }
  }
  return entries;
}

function generateTimetableClasses(): TimetableClass[] {
  const list: TimetableClass[] = [];
  for (const dept of departmentSeeds) {
    for (let year = 1; year <= 4; year++) {
      const y = year as 1 | 2 | 3 | 4;
      list.push({
        id: `${dept.id}-Y${y}`,
        departmentId: dept.id,
        year: y,
        entries: buildEntriesForClass(dept.id, y),
      });
    }
  }
  return list;
}

export const timetableClasses: TimetableClass[] = generateTimetableClasses();

export function getTimetableClassById(id: string): TimetableClass | undefined {
  return timetableClasses.find((t) => t.id === id);
}
