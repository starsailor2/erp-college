import { getDepartments } from "@/api/departments";
import type { CommandResult, CommandTableRow, IntentDefinition } from "@/command-center/types";

function isAtRiskQuery(queryLower: string): boolean {
  return queryLower.includes("at-risk") || queryLower.includes("at risk");
}

async function executeAtRiskQuery(): Promise<CommandResult> {
  const departments = await getDepartments();
  const sorted = [...departments].sort((a, b) => b.atRiskStudentCount - a.atRiskStudentCount);
  const totalAtRisk = departments.reduce((sum, d) => sum + d.atRiskStudentCount, 0);

  const rows: CommandTableRow[] = sorted.map((d) => ({
    id: d.id,
    path: `/admin/departments/${d.id}`,
    name: d.name,
    atRisk: d.atRiskStudentCount,
  }));

  return {
    kind: "record-table",
    summary: `${totalAtRisk} student${totalAtRisk === 1 ? " is" : "s are"} flagged as at-risk across all departments.`,
    columns: [
      { key: "name", label: "Department" },
      { key: "atRisk", label: "At-Risk Students" },
    ],
    rows,
    viewAllPath: "/admin/departments",
    viewAllLabel: "View all departments",
  };
}

const atRiskIntent: IntentDefinition = { id: "at-risk-by-department", matches: isAtRiskQuery, execute: executeAtRiskQuery };

function isDepartmentRankingQuery(queryLower: string): boolean {
  return (
    queryLower.includes("department") &&
    (queryLower.includes("attendance") || queryLower.includes("pass rate") || queryLower.includes("passing")) &&
    (queryLower.includes("lowest") || queryLower.includes("highest") || queryLower.includes("best") || queryLower.includes("worst") || queryLower.includes("top"))
  );
}

async function executeDepartmentRankingQuery(query: string): Promise<CommandResult> {
  const queryLower = query.toLowerCase();
  const departments = await getDepartments();
  const metric: "avgAttendancePct" | "passRatePct" = queryLower.includes("attendance") ? "avgAttendancePct" : "passRatePct";
  const wantsLowest = queryLower.includes("lowest") || queryLower.includes("worst");
  const sorted = [...departments].sort((a, b) => (wantsLowest ? a[metric] - b[metric] : b[metric] - a[metric]));
  const top = sorted.slice(0, 5);
  const metricLabel = metric === "avgAttendancePct" ? "Attendance %" : "Pass Rate %";

  const rows: CommandTableRow[] = top.map((d) => ({
    id: d.id,
    path: `/admin/departments/${d.id}`,
    name: d.name,
    metric: `${d[metric]}%`,
  }));

  return {
    kind: "record-table",
    summary: `Departments ranked by ${wantsLowest ? "lowest" : "highest"} ${metricLabel.toLowerCase()}.`,
    columns: [
      { key: "name", label: "Department" },
      { key: "metric", label: metricLabel },
    ],
    rows,
    viewAllPath: "/admin/departments",
    viewAllLabel: "View all departments",
  };
}

const departmentRankingIntent: IntentDefinition = {
  id: "department-ranking",
  matches: isDepartmentRankingQuery,
  execute: executeDepartmentRankingQuery,
};

export const departmentIntents: IntentDefinition[] = [atRiskIntent, departmentRankingIntent];
