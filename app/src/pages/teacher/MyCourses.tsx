import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Stack, Typography, Grid, Paper } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { getTeacherCourses } from "@/api/teacherCourses";
import type { TeacherCourse } from "@/types";

export default function MyCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);

  useEffect(() => { getTeacherCourses().then(setCourses); }, []);

  return (
    <>
      <PageHeader eyebrow="Academics" title="My Courses" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {courses.map((c) => (
          <Grid key={c.id} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600}>{c.name}</Typography>
              <Typography variant="caption" color="text.secondary">{c.id} · Section {c.section} · {c.studentIds.length} students</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button size="small" variant="contained" onClick={() => navigate("/teacher/attendance")}>Mark Attendance</Button>
                <Button size="small" onClick={() => navigate("/teacher/marks")}>Enter Marks</Button>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Course Statistics</Typography>
      <DataTable<TeacherCourse>
        columns={[
          { key: "name", label: "Course" },
          { key: "section", label: "Section" },
          { key: "studentIds", label: "Students", render: (row) => row.studentIds.length },
          { key: "avgAttendancePct", label: "Avg Attendance", render: (row) => `${row.avgAttendancePct}%` },
          { key: "avgMarksPct", label: "Avg Marks", render: (row) => `${row.avgMarksPct}%` },
        ]}
        rows={courses}
        emptyTitle="No courses found"
      />
    </>
  );
}
