import { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getDepartmentSummaries } from "@/api/teacherDepartments";
import type { DepartmentSummary } from "@/types";

export default function AcademicOverview() {
  const { mode } = useColorMode();
  const [rows, setRows] = useState<DepartmentSummary[]>([]);

  useEffect(() => { getDepartmentSummaries().then(setRows); }, []);

  const totalStudents = rows.reduce((sum, d) => sum + d.totalStudents, 0);
  const totalFaculty = rows.reduce((sum, d) => sum + d.facultyCount, 0);
  const avgCompletion = rows.length > 0 ? Math.round(rows.reduce((sum, d) => sum + (d.completionPct ?? 0), 0) / rows.length) : 0;

  return (
    <>
      <PageHeader eyebrow="Dean Functions" title="Academic Overview" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Departments" icon={<PublicIcon />} color={getIconAccent(mode, "students")} numericValue={rows.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Students" icon={<SchoolIcon />} color={getIconAccent(mode, "attendance")} numericValue={totalStudents} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Faculty" icon={<GroupsIcon />} color={getIconAccent(mode, "marks")} numericValue={totalFaculty} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Avg Curriculum Completion" icon={<TrendingUpIcon />} color={getIconAccent(mode, "at-risk")} value={`${avgCompletion}%`} />
        </Grid>
      </Grid>
      <DataTable<DepartmentSummary>
        title="Department Comparison"
        columns={[
          { key: "name", label: "Department" },
          { key: "totalStudents", label: "Students" },
          { key: "facultyCount", label: "Faculty" },
          { key: "avgAttendancePct", label: "Avg Attendance %", render: (row) => `${row.avgAttendancePct}%` },
          { key: "avgMarksPct", label: "Avg Marks %", render: (row) => `${row.avgMarksPct}%` },
          { key: "completionPct", label: "Curriculum Completion %", render: (row) => `${row.completionPct ?? 0}%` },
        ]}
        rows={rows}
        emptyTitle="No department data found"
      />
    </>
  );
}
