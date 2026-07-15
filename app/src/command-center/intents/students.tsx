import { getStudents } from "@/api/students";
import { getFeeLedger } from "@/api/feeLedger";
import StatusChip from "@/components/StatusChip";
import type { CommandResult, CommandTableRow, IntentDefinition } from "@/command-center/types";
import { extractPercent, extractComparisonDirection, formatINR } from "@/command-center/shared";

const FEE_WORDS = ["fee", "fees"];
const UNPAID_WORDS = ["unpaid", "haven't paid", "havent paid", "not paid", "pending", "overdue", "outstanding", "due"];

function isFeeQuery(queryLower: string): boolean {
  return FEE_WORDS.some((w) => queryLower.includes(w)) && UNPAID_WORDS.some((w) => queryLower.includes(w));
}

async function executeFeeQuery(): Promise<CommandResult> {
  const [students, ledger] = await Promise.all([getStudents(), getFeeLedger()]);
  const studentById = new Map(students.map((s) => [s.id, s]));
  const unpaid = ledger.filter((entry) => entry.status !== "paid");

  const rows: CommandTableRow[] = unpaid.slice(0, 8).map((entry) => {
    const student = studentById.get(entry.studentId);
    return {
      id: entry.id,
      path: student ? `/admin/students/${student.id}` : "/admin/fees/ledger",
      name: student?.name ?? entry.studentId,
      rollNo: student?.rollNo ?? "—",
      program: student?.program ?? "—",
      status: <StatusChip status={entry.status} />,
      balance: formatINR(entry.balance),
    };
  });

  return {
    kind: "record-table",
    summary: `${unpaid.length} student${unpaid.length === 1 ? "" : "s"} ${unpaid.length === 1 ? "has" : "have"} pending or overdue fees.`,
    note: "Based on the current fee ledger snapshot — per-calendar-year fee records aren't tracked yet.",
    columns: [
      { key: "name", label: "Student" },
      { key: "rollNo", label: "Roll No" },
      { key: "program", label: "Program" },
      { key: "status", label: "Status" },
      { key: "balance", label: "Balance Due" },
    ],
    rows,
    viewAllPath: "/admin/fees/ledger",
    viewAllLabel: "View all in Fee Ledger",
  };
}

const feeStatusIntent: IntentDefinition = { id: "students-unpaid-fees", matches: isFeeQuery, execute: executeFeeQuery };

function isAttendanceThresholdQuery(queryLower: string): boolean {
  return (
    queryLower.includes("attendance") &&
    extractComparisonDirection(queryLower) !== null &&
    extractPercent(queryLower) !== null
  );
}

async function executeAttendanceThresholdQuery(query: string): Promise<CommandResult> {
  const queryLower = query.toLowerCase();
  const threshold = extractPercent(queryLower) as number;
  const direction = extractComparisonDirection(queryLower) as "below" | "above";
  const students = await getStudents();
  const matching = students.filter((s) => (direction === "below" ? s.attendancePct < threshold : s.attendancePct > threshold));
  const sorted = [...matching].sort((a, b) => (direction === "below" ? a.attendancePct - b.attendancePct : b.attendancePct - a.attendancePct));

  const rows: CommandTableRow[] = sorted.slice(0, 8).map((s) => ({
    id: s.id,
    path: `/admin/students/${s.id}`,
    name: s.name,
    rollNo: s.rollNo,
    program: s.program,
    attendance: `${s.attendancePct}%`,
  }));

  return {
    kind: "record-table",
    summary: `${matching.length} student${matching.length === 1 ? "" : "s"} ${matching.length === 1 ? "has" : "have"} attendance ${direction} ${threshold}%.`,
    columns: [
      { key: "name", label: "Student" },
      { key: "rollNo", label: "Roll No" },
      { key: "program", label: "Program" },
      { key: "attendance", label: "Attendance %" },
    ],
    rows,
    viewAllPath: "/admin/students",
    viewAllLabel: "View all students",
  };
}

const attendanceThresholdIntent: IntentDefinition = {
  id: "students-attendance-threshold",
  matches: isAttendanceThresholdQuery,
  execute: executeAttendanceThresholdQuery,
};

function isBacklogQuery(queryLower: string): boolean {
  return queryLower.includes("backlog");
}

async function executeBacklogQuery(): Promise<CommandResult> {
  const students = await getStudents();
  const backlog = students.filter((s) => s.status === "backlog");

  const rows: CommandTableRow[] = backlog.slice(0, 8).map((s) => ({
    id: s.id,
    path: `/admin/students/${s.id}`,
    name: s.name,
    rollNo: s.rollNo,
    program: s.program,
    year: s.year,
  }));

  return {
    kind: "record-table",
    summary: `${backlog.length} student${backlog.length === 1 ? "" : "s"} ${backlog.length === 1 ? "has" : "have"} backlog status.`,
    columns: [
      { key: "name", label: "Student" },
      { key: "rollNo", label: "Roll No" },
      { key: "program", label: "Program" },
      { key: "year", label: "Year" },
    ],
    rows,
    viewAllPath: "/admin/students",
    viewAllLabel: "View all students",
  };
}

const backlogIntent: IntentDefinition = { id: "students-backlog", matches: isBacklogQuery, execute: executeBacklogQuery };

function isCgpaRankingQuery(queryLower: string): boolean {
  const hasCgpa = queryLower.includes("cgpa");
  const hasRankingWord = ["top", "highest", "best", "bottom", "lowest", "worst"].some((w) => queryLower.includes(w));
  return hasCgpa && hasRankingWord;
}

async function executeCgpaRankingQuery(query: string): Promise<CommandResult> {
  const queryLower = query.toLowerCase();
  const wantsBottom = ["bottom", "lowest", "worst"].some((w) => queryLower.includes(w));
  const students = await getStudents();
  const sorted = [...students].sort((a, b) => (wantsBottom ? a.cgpa - b.cgpa : b.cgpa - a.cgpa));
  const top = sorted.slice(0, 8);

  const rows: CommandTableRow[] = top.map((s) => ({
    id: s.id,
    path: `/admin/students/${s.id}`,
    name: s.name,
    rollNo: s.rollNo,
    program: s.program,
    cgpa: s.cgpa,
  }));

  return {
    kind: "record-table",
    summary: `Students ranked by ${wantsBottom ? "lowest" : "highest"} CGPA.`,
    columns: [
      { key: "name", label: "Student" },
      { key: "rollNo", label: "Roll No" },
      { key: "program", label: "Program" },
      { key: "cgpa", label: "CGPA" },
    ],
    rows,
    viewAllPath: "/admin/students",
    viewAllLabel: "View all students",
  };
}

const cgpaRankingIntent: IntentDefinition = {
  id: "students-cgpa-ranking",
  matches: isCgpaRankingQuery,
  execute: executeCgpaRankingQuery,
};

export const studentIntents: IntentDefinition[] = [
  feeStatusIntent,
  attendanceThresholdIntent,
  backlogIntent,
  cgpaRankingIntent,
];
