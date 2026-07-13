import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Paper, Typography, Stack, Chip, Grid } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import StatusChip from "@/components/StatusChip";
import EmptyState from "@/components/EmptyState";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getStudentByIdAsync } from "@/api/students";
import { getCourseById } from "@/demo-data/academics/courses";
import GradingIcon from "@mui/icons-material/Grading";
import EventNoteIcon from "@mui/icons-material/EventNote";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ClassIcon from "@mui/icons-material/Class";
import type { Student } from "@/types";

export default function StudentProfile() {
  const { id } = useParams();
  const { mode } = useColorMode();
  const [student, setStudent] = useState<Student | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    if (id) getStudentByIdAsync(id).then((data) => { if (live) { setStudent(data); setLoaded(true); } });
    return () => { live = false; };
  }, [id]);

  if (loaded && !student) {
    return <EmptyState title="Student not found" description={`No student with id "${id}".`} />;
  }
  if (!student) return null;

  const courses = student.courseIds.map((cid) => getCourseById(cid)).filter((c) => !!c);
  const completedCredits = courses.reduce((sum, c) => sum + (c?.credits ?? 0), 0);

  return (
    <>
      <PageHeader eyebrow="Students" title={student.name} breadcrumbs={[{ label: "Students", to: "/admin/students" }, { label: student.name }]} />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={4}>
          <Box><Typography variant="caption" color="text.secondary">Student ID</Typography><Typography variant="body1">{student.id}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Email</Typography><Typography variant="body1">{student.email}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Phone</Typography><Typography variant="body1">{student.phone}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Program</Typography><Typography variant="body1">{student.program}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Year / Semester</Typography><Typography variant="body1">Year {student.year} · Sem {student.semester}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Batch</Typography><Typography variant="body1">{student.batch}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Status</Typography><Box sx={{ mt: 0.5 }}><StatusChip status={student.status} /></Box></Box>
        </Stack>
      </Paper>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Personal Information</Typography>
            <Stack spacing={1.5}>
              <Box><Typography variant="caption" color="text.secondary">Enrollment Date</Typography><Typography variant="body2">{student.enrollmentDate}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Address</Typography><Typography variant="body2">{student.address}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Guardian Name</Typography><Typography variant="body2">{student.guardianName}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Guardian Contact</Typography><Typography variant="body2">{student.guardianContact}</Typography></Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Enrolled Courses</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {courses.map((c) => <Chip key={c!.id} size="small" label={c!.name} />)}
              {courses.length === 0 && <Typography variant="body2" color="text.secondary">No courses enrolled.</Typography>}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Academic Performance</Typography>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Overall CGPA" icon={<GradingIcon />} color={getIconAccent(mode, "cgpa")} value={student.cgpa} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Attendance" icon={<EventNoteIcon />} color={getIconAccent(mode, "attendance")} value={`${student.attendancePct}%`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Completed Credits" icon={<MenuBookIcon />} color={getIconAccent(mode, "credits")} numericValue={completedCredits} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Active Courses" icon={<ClassIcon />} color={getIconAccent(mode, "active-courses")} numericValue={courses.length} />
        </Grid>
      </Grid>
    </>
  );
}
