import type { ReportRow } from "@/types";
import { createRng } from "@/demo-data/generators/random";

const { randomInt } = createRng(20260727);

const deptNames = ["Computer Science", "Electronics & Communication", "Mechanical", "Civil"];

export const reportRows: ReportRow[] = deptNames.map((department) => ({
  department,
  avgAttendancePct: 75 + randomInt(0, 12),
  avgMarksPct: 68 + randomInt(0, 14),
  passRatePct: 80 + randomInt(0, 15),
  atRiskPct: 5 + randomInt(0, 15),
  facultyUtilizationPct: 70 + randomInt(0, 25),
}));
