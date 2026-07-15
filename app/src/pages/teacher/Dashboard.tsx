import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Grid, Paper, Typography } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AssessmentIcon from "@mui/icons-material/Assessment";
import GradingIcon from "@mui/icons-material/Grading";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getTeacherCourses } from "@/api/teacherCourses";
import type { TeacherCourse } from "@/types";

const schedule = [
  { title: "CS201 Lecture", time: "09:00 - 10:30", room: "Lab A" },
  { title: "CS202 Lecture", time: "11:00 - 12:30", room: "Hall C" },
  { title: "Dept Meeting", time: "14:00 - 15:30", room: "Conf Rm 1" },
  { title: "Exam Invigilation - CS203", time: "16:00 - 18:00", room: "Exam Hall 2" },
];
const pendingTasks = ["Attendance - CS201 Sec A", "Internal Marks - CS202 Quiz2", "Course Material - CS203", "Grade Change Request Review"];

export default function Dashboard() {
  const { mode } = useColorMode();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);

  useEffect(() => { getTeacherCourses().then(setCourses); }, []);

  const totalStudents = courses.reduce((sum, c) => sum + c.studentIds.length, 0);
  const avgAttendance = courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + c.avgAttendancePct, 0) / courses.length) : 0;
  const avgMarks = courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + c.avgMarksPct, 0) / courses.length) : 0;

  return (
    <>
      <PageHeader eyebrow="Overview" title="Faculty Dashboard" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Students" icon={<PeopleIcon />} color={getIconAccent(mode, "students")} numericValue={totalStudents} onClick={() => navigate("/teacher/students")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Avg Attendance" icon={<EventNoteIcon />} color={getIconAccent(mode, "attendance")} value={`${avgAttendance}%`} onClick={() => navigate("/teacher/attendance")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="At-Risk Students" icon={<AssessmentIcon />} color={getIconAccent(mode, "at-risk")} numericValue={12} onClick={() => navigate("/teacher/students")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Avg Internal Marks" icon={<GradingIcon />} color={getIconAccent(mode, "marks")} value={`${avgMarks}%`} onClick={() => navigate("/teacher/marks")} />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Today's Schedule</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {schedule.map((s) => (
                <Box key={s.title} sx={{ p: 1.5, borderLeft: 3, borderColor: "primary.main", bgcolor: "action.hover", borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight={600}>{s.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.time} · {s.room}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Pending Tasks</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {pendingTasks.map((t) => (
                <Typography key={t} variant="body2">• {t}</Typography>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
