import { useEffect, useState } from "react";
import { Grid, MenuItem, Select, FormControl, InputLabel, Paper, Typography, Stack, type SelectChangeEvent } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { getStudentCoursesBySemester } from "@/api/studentCourses";
import type { StudentCourse } from "@/types";

export default function MyCourses() {
  const [semester, setSemester] = useState(6);
  const [courses, setCourses] = useState<StudentCourse[]>([]);

  useEffect(() => { getStudentCoursesBySemester(semester).then(setCourses); }, [semester]);

  const totalCredits = courses.reduce((s, c) => s + c.credits, 0);

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="My Courses"
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
        <Grid size={{ xs: 12, md: 8 }}>
          <DataTable<StudentCourse>
            columns={[
              { key: "code", label: "Code" },
              { key: "name", label: "Course" },
              { key: "instructor", label: "Instructor" },
              { key: "section", label: "Section" },
              { key: "credits", label: "Credits" },
              { key: "grade", label: "Grade" },
              { key: "attendancePct", label: "Attendance %", render: (row) => `${row.attendancePct}%` },
            ]}
            rows={courses}
            emptyTitle="No courses found for this semester"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Semester Summary</Typography>
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Total Credits</Typography><Typography variant="body2" fontWeight={700}>{totalCredits}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Courses</Typography><Typography variant="body2" fontWeight={700}>{courses.length}</Typography></Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
