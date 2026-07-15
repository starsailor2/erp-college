import { useEffect, useState } from "react";
import { Grid, MenuItem, Select, FormControl, InputLabel, type SelectChangeEvent } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { ChartCard } from "@/components/ChartCard";
import { DataTable } from "@/components/DataTable";
import EmptyState from "@/components/EmptyState";
import { useColorMode } from "@/context/ColorModeContext";
import { getChartPalette, getChartTooltipStyle } from "@/theme/chartPalette";
import { getMarksForSemester, getSemesterGpaHistory } from "@/api/studentMarks";
import type { MarksSubject } from "@/types";

export default function Marks() {
  const { mode } = useColorMode();
  const palette = getChartPalette(mode);
  const [semester, setSemester] = useState(6);
  const [subjects, setSubjects] = useState<MarksSubject[]>([]);
  const [gpaHistory, setGpaHistory] = useState<{ semester: number; gpa: number }[]>([]);

  useEffect(() => { getMarksForSemester(semester).then(setSubjects); }, [semester]);
  useEffect(() => { getSemesterGpaHistory().then(setGpaHistory); }, []);

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="Internal Marks"
        action={
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Semester</InputLabel>
            <Select label="Semester" value={semester} onChange={(e: SelectChangeEvent<number>) => setSemester(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((s) => <MenuItem key={s} value={s}>Semester {s}</MenuItem>)}
            </Select>
          </FormControl>
        }
      />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={12}>
          <ChartCard eyebrow="Trend" title="Academic Progress (Semester GPA)">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gpaHistory}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="semester" stroke={palette.axis} fontSize={12} tickFormatter={(v) => `Sem ${v}`} />
                <YAxis stroke={palette.axis} fontSize={12} domain={[0, 10]} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Line type="monotone" dataKey="gpa" stroke={palette.categorical[0]} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>
      {subjects.length === 0 ? (
        <EmptyState title="No marks recorded" description={`No internal marks have been recorded for Semester ${semester} yet.`} />
      ) : (
        <DataTable<MarksSubject>
          title="Subject-wise Performance"
          columns={[
            { key: "code", label: "Code" },
            { key: "name", label: "Subject" },
            { key: "test1", label: "Test 1" },
            { key: "test2", label: "Test 2" },
            { key: "assignment", label: "Assignment" },
            { key: "total", label: "Total", render: (row) => `${row.total}/${row.maxTotal}` },
          ]}
          rows={subjects}
          emptyTitle="No marks recorded"
        />
      )}
    </>
  );
}
