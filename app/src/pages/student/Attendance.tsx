import { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EventNoteIcon from "@mui/icons-material/EventNote";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { DataTable } from "@/components/DataTable";
import { useColorMode } from "@/context/ColorModeContext";
import { getChartPalette, getChartTooltipStyle, getIconAccent } from "@/theme/chartPalette";
import { getAttendanceSubjects, getMonthlyAttendanceTrend } from "@/api/studentAttendance";
import type { AttendanceSubject } from "@/types";

export default function Attendance() {
  const { mode } = useColorMode();
  const palette = getChartPalette(mode);
  const [subjects, setSubjects] = useState<AttendanceSubject[]>([]);
  const [trend, setTrend] = useState<{ month: string; pct: number }[]>([]);

  useEffect(() => {
    getAttendanceSubjects().then(setSubjects);
    getMonthlyAttendanceTrend().then(setTrend);
  }, []);

  const totalAttended = subjects.reduce((s, a) => s + a.attended, 0);
  const totalClasses = subjects.reduce((s, a) => s + a.total, 0);
  const overallPct = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

  const chartData = subjects.map((s) => ({ name: s.code, pct: Math.round((s.attended / s.total) * 100) }));

  return (
    <>
      <PageHeader eyebrow="Academics" title="Attendance" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Overall Attendance" icon={<CheckCircleIcon />} color={getIconAccent(mode, "attendance")} value={`${overallPct}%`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Classes Attended" icon={<EventNoteIcon />} color={getIconAccent(mode, "attended")} numericValue={totalAttended} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Classes Missed" icon={<EventBusyIcon />} color={getIconAccent(mode, "missed")} numericValue={totalClasses - totalAttended} />
        </Grid>
      </Grid>
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard eyebrow="Breakdown" title="Subject-wise Attendance">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="name" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} domain={[0, 100]} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Bar dataKey="pct" fill={palette.categorical[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard eyebrow="Trend" title="Monthly Attendance Trend">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="month" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} domain={[0, 100]} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Line type="monotone" dataKey="pct" stroke={palette.categorical[1]} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>
      <DataTable<AttendanceSubject>
        title="Subject-wise Attendance"
        columns={[
          { key: "code", label: "Code" },
          { key: "name", label: "Subject" },
          { key: "attended", label: "Attended" },
          { key: "total", label: "Total" },
          { key: "pct", label: "Percentage", render: (row) => `${Math.round((row.attended / row.total) * 100)}%` },
        ]}
        rows={subjects}
        emptyTitle="No attendance data found"
      />
    </>
  );
}
