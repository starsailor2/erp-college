import { useEffect, useState } from "react";
import { Button, Typography, Grid, Paper } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { useTeacherRole } from "@/context/TeacherRoleContext";
import { getDepartmentSummaries, getDepartmentByNameAsync } from "@/api/teacherDepartments";
import PeopleIcon from "@mui/icons-material/People";
import EventNoteIcon from "@mui/icons-material/EventNote";
import WarningIcon from "@mui/icons-material/Warning";
import GradingIcon from "@mui/icons-material/Grading";
import type { DepartmentSummary } from "@/types";

export default function AcademicCohort() {
  const { role } = useTeacherRole();
  const { mode } = useColorMode();
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [drillDown, setDrillDown] = useState<DepartmentSummary | null>(null);

  useEffect(() => { if (role === "dean") getDepartmentSummaries().then(setDepartments); }, [role]);

  if (role !== "dean") {
    return (
      <>
        <PageHeader eyebrow="Students" title="Academic Cohort" />
        <EmptyState title="Access Denied" description="This feature is only available to Dean." />
      </>
    );
  }

  const totalStudents = departments.reduce((sum, d) => sum + d.totalStudents, 0);
  const avgAttendance = departments.length > 0 ? Math.round(departments.reduce((sum, d) => sum + d.avgAttendancePct, 0) / departments.length) : 0;
  const totalAtRisk = departments.reduce((sum, d) => sum + d.atRiskCount, 0);
  const avgMarks = departments.length > 0 ? Math.round(departments.reduce((sum, d) => sum + d.avgMarksPct, 0) / departments.length) : 0;

  if (drillDown) {
    return (
      <>
        <PageHeader eyebrow="Students" title={`${drillDown.name} — Drill Down`} action={<Button variant="outlined" onClick={() => setDrillDown(null)}>Back</Button>} />
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Students" icon={<PeopleIcon />} color={getIconAccent(mode, "students")} numericValue={drillDown.totalStudents} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Faculty" icon={<PeopleIcon />} color={getIconAccent(mode, "faculty")} numericValue={drillDown.facultyCount} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="At-Risk" icon={<WarningIcon />} color={getIconAccent(mode, "at-risk")} numericValue={drillDown.atRiskCount} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Avg Marks" icon={<GradingIcon />} color={getIconAccent(mode, "marks")} value={`${drillDown.avgMarksPct}%`} /></Grid>
        </Grid>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Year-wise Breakdown</Typography>
        <DataTable
          columns={[
            { key: "year", label: "Year" },
            { key: "students", label: "Students" },
            { key: "avgMarksPct", label: "Avg Marks", render: (row) => `${row.avgMarksPct}%` },
          ]}
          rows={drillDown.yearBreakdown}
          emptyTitle="No data"
        />
        <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1.5 }}>Top Performers</Typography>
        <DataTable
          columns={[
            { key: "rollNo", label: "Roll No" },
            { key: "name", label: "Name" },
            { key: "avgMarksPct", label: "Avg Marks", render: (row) => `${row.avgMarksPct}%` },
          ]}
          rows={drillDown.topPerformers}
          emptyTitle="No data"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Students" title="Academic Cohort" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Total Students" icon={<PeopleIcon />} color={getIconAccent(mode, "students")} numericValue={totalStudents} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Inst. Avg Attendance" icon={<EventNoteIcon />} color={getIconAccent(mode, "attendance")} value={`${avgAttendance}%`} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="At-Risk" icon={<WarningIcon />} color={getIconAccent(mode, "at-risk")} numericValue={totalAtRisk} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Inst. Avg Marks" icon={<GradingIcon />} color={getIconAccent(mode, "marks")} value={`${avgMarks}%`} /></Grid>
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Risk Heatmap by Department</Typography>
      <DataTable<DepartmentSummary>
        columns={[
          { key: "name", label: "Department" },
          { key: "totalStudents", label: "Total" },
          { key: "atRiskCount", label: "At-Risk" },
          { key: "atRiskPct", label: "%", render: (row) => `${Math.round((row.atRiskCount / row.totalStudents) * 100)}%` },
          { key: "avgAttendancePct", label: "Avg Attendance", render: (row) => `${row.avgAttendancePct}%` },
          { key: "avgMarksPct", label: "Avg Marks", render: (row) => `${row.avgMarksPct}%` },
          {
            key: "actions", label: "Action",
            render: (row) => <Button size="small" onClick={() => getDepartmentByNameAsync(row.name).then((d) => setDrillDown(d ?? null))}>Drill Down</Button>,
          },
        ]}
        rows={departments}
        emptyTitle="No departments found"
      />
      <Paper elevation={0} sx={{ p: 3, mt: 3, textAlign: "center", color: "text.secondary" }}>
        Department-wise Performance Comparison Chart
      </Paper>
    </>
  );
}
