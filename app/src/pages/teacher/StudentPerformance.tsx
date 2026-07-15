import { MenuItem, Select, InputLabel, FormControl, Stack, Grid } from "@mui/material";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { ChartCard } from "@/components/ChartCard";
import { DataTable } from "@/components/DataTable";
import { useColorMode } from "@/context/ColorModeContext";
import { getChartPalette, getChartTooltipStyle } from "@/theme/chartPalette";
import { students } from "@/demo-data/people/students";

const trendData = [
  { assessment: "Quiz1", avg: 72 }, { assessment: "Quiz2", avg: 75 },
  { assessment: "Assignment1", avg: 79 }, { assessment: "MidExam", avg: 74 },
];
const distributionData = [
  { range: "0-40%", count: 4 }, { range: "40-60%", count: 12 },
  { range: "60-80%", count: 28 }, { range: "80-100%", count: 18 },
];

export default function StudentPerformance() {
  const { mode } = useColorMode();
  const palette = getChartPalette(mode);
  const sample = students.slice(0, 10);

  return (
    <>
      <PageHeader eyebrow="Students" title="Student Performance" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard eyebrow="Trend" title="Assessment-wise Performance Trend">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="assessment" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Line type="monotone" dataKey="avg" stroke={palette.categorical[0]} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard eyebrow="Distribution" title="Score Distribution">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="range" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Bar dataKey="count" fill={palette.categorical[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Course</InputLabel>
          <Select label="Course" defaultValue="all">
            <MenuItem value="all">All Courses</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Assessment</InputLabel>
          <Select label="Assessment" defaultValue="all">
            <MenuItem value="all">All Assessments</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <DataTable
        columns={[
          { key: "rollNo", label: "Roll No" },
          { key: "name", label: "Name" },
          { key: "quiz1", label: "Quiz1", render: (r) => Math.round(r.cgpa * 2) },
          { key: "quiz2", label: "Quiz2", render: (r) => Math.round(r.cgpa * 2.1) },
          { key: "assignment", label: "Assignment", render: (r) => Math.round(r.cgpa * 2.2) },
          { key: "avg", label: "Avg %", render: (r) => `${Math.round(r.cgpa * 10)}%` },
          { key: "status", label: "Status", render: (r) => r.attendancePct < 70 ? "At Risk" : "Good" },
        ]}
        rows={sample}
        emptyTitle="No students found"
      />
    </>
  );
}
