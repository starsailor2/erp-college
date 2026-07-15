import { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import SchoolIcon from "@mui/icons-material/School";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getFacultyRoster, getCourseCoverage } from "@/api/teacherFacultyRoster";
import type { FacultyRosterEntry, CourseCoverageEntry } from "@/types";

export default function DepartmentOverview() {
  const { mode } = useColorMode();
  const [roster, setRoster] = useState<FacultyRosterEntry[]>([]);
  const [coverage, setCoverage] = useState<CourseCoverageEntry[]>([]);

  useEffect(() => {
    getFacultyRoster().then(setRoster);
    getCourseCoverage().then(setCoverage);
  }, []);

  const totalStudents = roster.reduce((sum, r) => sum + r.studentCount, 0);

  return (
    <>
      <PageHeader eyebrow="HOD Functions" title="Department Overview" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title="Faculty Count" icon={<GroupsIcon />} color={getIconAccent(mode, "students")} numericValue={roster.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title="Total Students" icon={<SchoolIcon />} color={getIconAccent(mode, "attendance")} numericValue={totalStudents} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title="Course Gaps" icon={<ScheduleIcon />} color={getIconAccent(mode, "at-risk")} numericValue={coverage.filter((c) => c.status === "gap").length} />
        </Grid>
      </Grid>

      <DataTable<FacultyRosterEntry>
        title="Faculty List"
        pagination
        columns={[
          { key: "name", label: "Name" },
          { key: "designation", label: "Designation" },
          { key: "courseCount", label: "Courses" },
          { key: "studentCount", label: "Students" },
          { key: "avgLoad", label: "Avg Load" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={roster}
        emptyTitle="No faculty found"
      />
      <div style={{ height: 24 }} />
      <DataTable<CourseCoverageEntry>
        title="Course Coverage"
        pagination
        columns={[
          { key: "course", label: "Course" },
          { key: "facultyName", label: "Faculty" },
          { key: "section", label: "Section" },
          { key: "students", label: "Students" },
          { key: "semester", label: "Semester" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={coverage}
        emptyTitle="No courses found"
      />
    </>
  );
}
