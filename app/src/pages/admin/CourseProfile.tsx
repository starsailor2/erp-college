import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Paper, Typography, Stack, Grid, List, ListItem, ListItemText } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getCourseByIdAsync } from "@/api/courses";
import { getFacultyById } from "@/demo-data/people/faculty";
import { students } from "@/demo-data/people/students";
import EventNoteIcon from "@mui/icons-material/EventNote";
import GradingIcon from "@mui/icons-material/Grading";
import type { Course } from "@/types";

export default function CourseProfile() {
  const { id } = useParams();
  const { mode } = useColorMode();
  const [course, setCourse] = useState<Course | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    if (id) getCourseByIdAsync(id).then((data) => { if (live) { setCourse(data); setLoaded(true); } });
    return () => { live = false; };
  }, [id]);

  if (loaded && !course) {
    return <EmptyState title="Course not found" description={`No course with id "${id}".`} />;
  }
  if (!course) return null;

  const enrolledCount = students.filter((s) => s.courseIds.includes(course.id)).length;
  const instructor = getFacultyById(course.instructorFacultyId);

  return (
    <>
      <PageHeader eyebrow="Courses" title={`${course.name} - ${course.id}`} breadcrumbs={[{ label: "Courses", to: "/admin/courses" }, { label: course.id }]} />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={4}>
          <Box><Typography variant="caption" color="text.secondary">Course Code</Typography><Typography variant="body1">{course.id}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Department</Typography><Typography variant="body1">{course.departmentId}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Credits</Typography><Typography variant="body1">{course.credits} Credits</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Instructor</Typography><Typography variant="body1">{instructor?.name ?? "Unassigned"}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Enrolled Students</Typography><Typography variant="body1">{enrolledCount} Students</Typography></Box>
        </Stack>
      </Paper>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Course Description</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{course.description}</Typography>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Learning Outcomes</Typography>
            <List dense>
              {course.learningOutcomes.map((o, i) => (
                <ListItem key={i} sx={{ py: 0.25 }}><ListItemText primary={`• ${o}`} /></ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Schedule</Typography>
            <Stack spacing={1}>
              {course.schedule.map((s, i) => (
                <Typography key={i} variant="body2">{s.day}: {s.time} ({s.room})</Typography>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Course Statistics</Typography>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Avg. Attendance" icon={<EventNoteIcon />} color={getIconAccent(mode, "attendance")} numericValue={course.avgAttendancePct} formatValue={(n) => `${n}%`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Pass Rate" icon={<GradingIcon />} color={getIconAccent(mode, "pass-rate")} numericValue={course.passRatePct} formatValue={(n) => `${n}%`} />
        </Grid>
      </Grid>
    </>
  );
}
