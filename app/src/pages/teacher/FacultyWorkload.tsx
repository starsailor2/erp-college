import { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getWorkloadEntries } from "@/api/teacherWorkload";
import type { WorkloadEntry } from "@/types";

export default function FacultyWorkload() {
  const { mode } = useColorMode();
  const [rows, setRows] = useState<WorkloadEntry[]>([]);

  useEffect(() => { getWorkloadEntries().then(setRows); }, []);

  const overloaded = rows.filter((r) => r.status === "overloaded").length;
  const avgLoad = rows.length > 0 ? Math.round(rows.reduce((sum, r) => sum + r.loadPct, 0) / rows.length) : 0;

  return (
    <>
      <PageHeader eyebrow="HOD Functions" title="Faculty Workload" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title="Faculty Tracked" icon={<GroupsIcon />} color={getIconAccent(mode, "students")} numericValue={rows.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title="Avg Load %" icon={<GroupsIcon />} color={getIconAccent(mode, "attendance")} value={`${avgLoad}%`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title="Overloaded" icon={<WarningAmberIcon />} color={getIconAccent(mode, "at-risk")} numericValue={overloaded} />
        </Grid>
      </Grid>
      <DataTable<WorkloadEntry>
        pagination
        columns={[
          { key: "facultyName", label: "Faculty" },
          { key: "designation", label: "Designation" },
          { key: "courses", label: "Courses" },
          { key: "students", label: "Students" },
          { key: "hrsPerWeek", label: "Hrs/Week" },
          { key: "loadPct", label: "Load %", render: (row) => `${row.loadPct}%` },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={rows}
        emptyTitle="No workload data found"
      />
    </>
  );
}
