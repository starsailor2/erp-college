import { useEffect, useState } from "react";
import { Button, Stack, Snackbar, Grid } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { ChartCard } from "@/components/ChartCard";
import { DataTable } from "@/components/DataTable";
import { useColorMode } from "@/context/ColorModeContext";
import { getChartPalette, getChartTooltipStyle } from "@/theme/chartPalette";
import { getReportRows } from "@/api/teacherReports";
import type { ReportRow } from "@/types";

export default function InterDeptReports() {
  const { mode } = useColorMode();
  const palette = getChartPalette(mode);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getReportRows().then(setRows); }, []);

  return (
    <>
      <PageHeader eyebrow="Dean Functions" title="Inter-Department Reports" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard eyebrow="Attendance & Marks" title="Attendance vs Marks by Department">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="department" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Bar dataKey="avgAttendancePct" name="Avg Attendance %" fill={palette.categorical[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgMarksPct" name="Avg Marks %" fill={palette.categorical[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard eyebrow="Risk & Utilization" title="At-Risk % vs Faculty Utilization %">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="department" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Bar dataKey="atRiskPct" name="At-Risk %" fill={palette.categorical[5]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="facultyUtilizationPct" name="Faculty Utilization %" fill={palette.categorical[2]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <Button variant="contained" onClick={() => setSnackbar("Generating report...")}>Generate Report</Button>
      </Stack>

      <DataTable<ReportRow>
        columns={[
          { key: "department", label: "Department" },
          { key: "avgAttendancePct", label: "Avg Attendance %", render: (row) => `${row.avgAttendancePct}%` },
          { key: "avgMarksPct", label: "Avg Marks %", render: (row) => `${row.avgMarksPct}%` },
          { key: "passRatePct", label: "Pass Rate %", render: (row) => `${row.passRatePct}%` },
          { key: "atRiskPct", label: "At-Risk %", render: (row) => `${row.atRiskPct}%` },
          { key: "facultyUtilizationPct", label: "Faculty Utilization %", render: (row) => `${row.facultyUtilizationPct}%` },
          { key: "actions", label: "Action", render: () => <Button size="small" onClick={() => setSnackbar("Loading report details...")}>View Details</Button> },
        ]}
        rows={rows}
        emptyTitle="No report data found"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
