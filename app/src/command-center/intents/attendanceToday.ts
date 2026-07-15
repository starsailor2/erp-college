import { getTodayAttendance } from "@/api/attendance";
import { getStudents } from "@/api/students";
import type { CommandResult, CommandTableRow, IntentDefinition } from "@/command-center/types";

function isAbsentTodayQuery(queryLower: string): boolean {
  return queryLower.includes("absent") || (queryLower.includes("attendance") && queryLower.includes("today"));
}

async function executeAbsentTodayQuery(): Promise<CommandResult> {
  const [attendance, students] = await Promise.all([getTodayAttendance(), getStudents()]);
  const studentById = new Map(students.map((s) => [s.id, s]));
  const absentees = attendance.filter((a) => a.status === "absent");

  const rows: CommandTableRow[] = absentees.slice(0, 8).map((a) => {
    const student = studentById.get(a.studentId);
    return {
      id: a.id,
      path: student ? `/admin/students/${student.id}` : "/admin/attendance",
      name: student?.name ?? a.studentId,
      rollNo: student?.rollNo ?? "—",
      program: student?.program ?? "—",
    };
  });

  return {
    kind: "record-table",
    summary: `${absentees.length} of ${attendance.length} students are absent today.`,
    columns: [
      { key: "name", label: "Student" },
      { key: "rollNo", label: "Roll No" },
      { key: "program", label: "Program" },
    ],
    rows,
    viewAllPath: "/admin/attendance",
    viewAllLabel: "View attendance",
  };
}

const absentTodayIntent: IntentDefinition = {
  id: "attendance-absent-today",
  matches: isAbsentTodayQuery,
  execute: executeAbsentTodayQuery,
};

export const attendanceTodayIntents: IntentDefinition[] = [absentTodayIntent];
