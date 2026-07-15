import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Checkbox, Grid, Paper, Typography } from "@mui/material";
import ClassIcon from "@mui/icons-material/Class";
import EventNoteIcon from "@mui/icons-material/EventNote";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PaymentIcon from "@mui/icons-material/Payment";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getStudentProfile } from "@/api/studentProfile";
import { getStudentCoursesBySemester } from "@/api/studentCourses";
import { getAttendanceSubjects } from "@/api/studentAttendance";
import { getFeeSummary } from "@/api/studentFees";
import type { StudentProfile, StudentCourse, AttendanceSubject, FeeSemesterRow } from "@/types";

const schedule = [
  { title: "Advanced Algorithms", time: "09:00 - 10:30", room: "Lab A", code: "CS601" },
  { title: "Machine Learning", time: "11:00 - 12:30", room: "Hall C", code: "CS602" },
  { title: "Distributed Systems", time: "14:00 - 15:30", room: "Room 204", code: "CS603" },
];

const initialTasks = [
  { id: "T1", title: "Submit ML assignment 3", done: false },
  { id: "T2", title: "Register for elective courses", done: false },
  { id: "T3", title: "Pay Semester 7 fee", done: false },
];

export default function Dashboard() {
  const { mode } = useColorMode();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [attendance, setAttendance] = useState<AttendanceSubject[]>([]);
  const [fees, setFees] = useState<FeeSemesterRow[]>([]);
  const [tasks, setTasks] = useState(initialTasks);

  useEffect(() => {
    getStudentProfile().then(setProfile);
    getAttendanceSubjects().then(setAttendance);
    getFeeSummary().then(setFees);
  }, []);

  useEffect(() => {
    if (profile) getStudentCoursesBySemester(profile.currentSemester).then(setCourses);
  }, [profile]);

  const avgAttendance = useMemo(() => {
    if (attendance.length === 0) return 0;
    const totalAttended = attendance.reduce((s, a) => s + a.attended, 0);
    const total = attendance.reduce((s, a) => s + a.total, 0);
    return total > 0 ? Math.round((totalAttended / total) * 100) : 0;
  }, [attendance]);

  const pendingDues = fees.reduce((s, f) => s + (f.totalFee - f.paid), 0);

  const toggleTask = (id: string) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <>
      <PageHeader eyebrow="Overview" title="Student Dashboard" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Credits" icon={<ClassIcon />} color={getIconAccent(mode, "credits")} numericValue={profile?.creditsEarned ?? 0} onClick={() => navigate("/student/courses")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Avg Attendance" icon={<EventNoteIcon />} color={getIconAccent(mode, "attendance")} value={`${avgAttendance}%`} onClick={() => navigate("/student/attendance")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Current CGPA" icon={<TrendingUpIcon />} color={getIconAccent(mode, "cgpa")} value={profile?.cgpa.toFixed(2) ?? "-"} onClick={() => navigate("/student/marks")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Pending Dues" icon={<PaymentIcon />} color={getIconAccent(mode, "dues")} formatValue={(n) => `₹${n.toLocaleString("en-IN")}`} numericValue={pendingDues} onClick={() => navigate("/student/fees/summary")} />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Today's Schedule</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {schedule.map((s) => (
                <Box key={s.code} sx={{ p: 1.5, borderLeft: 3, borderColor: "primary.main", bgcolor: "action.hover", borderRadius: 1, cursor: "pointer" }} onClick={() => navigate("/student/courses")}>
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
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {tasks.map((t) => (
                <Box key={t.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Checkbox checked={t.done} onChange={() => toggleTask(t.id)} size="small" />
                  <Typography variant="body2" sx={{ textDecoration: t.done ? "line-through" : "none", color: t.done ? "text.disabled" : "text.primary" }}>{t.title}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid size={12}>
          <DataTable<StudentCourse>
            title="Current Courses"
            onRowClick={() => navigate("/student/courses")}
            columns={[
              { key: "code", label: "Code" },
              { key: "name", label: "Course" },
              { key: "instructor", label: "Instructor" },
              { key: "attendancePct", label: "Attendance %", render: (row) => `${row.attendancePct}%` },
            ]}
            rows={courses}
            emptyTitle="No courses found"
          />
        </Grid>
      </Grid>
    </>
  );
}
