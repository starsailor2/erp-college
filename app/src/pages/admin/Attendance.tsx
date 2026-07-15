import { useEffect, useMemo, useState } from "react";
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, Typography, Grid, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getAttendanceStats, getTodayAttendance, markAttendance } from "@/api/attendance";
import { getPendingLeaveCount } from "@/api/leaveRequests";
import { students } from "@/demo-data/people/students";
import { courses } from "@/demo-data/academics/courses";
import type { AttendanceRecord } from "@/types";

const emptyForm = { courseId: courses[0]?.id ?? "", date: "2026-07-14", session: "Morning (9:00 AM - 12:00 PM)" };

export default function Attendance() {
  const { mode } = useColorMode();
  const [stats, setStats] = useState({ present: 0, total: 0, pct: 0 });
  const [pendingLeave, setPendingLeave] = useState(0);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "absent">("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const loadRecords = () => getTodayAttendance().then(setRecords);

  useEffect(() => {
    let live = true;
    getAttendanceStats().then((data) => { if (live) setStats(data); });
    getPendingLeaveCount().then((count) => { if (live) setPendingLeave(count); });
    loadRecords();
    return () => { live = false; };
  }, []);

  const weeklyAvg = students.length > 0
    ? Math.round((students.reduce((sum, s) => sum + s.attendancePct, 0) / students.length) * 10) / 10
    : 0;
  const lowAttendanceCount = students.filter((s) => s.attendancePct < 75).length;

  const rows = useMemo(() => records
    .map((r) => ({ ...r, student: students.find((s) => s.id === r.studentId) }))
    .filter((r) => r.student)
    .filter((r) => statusFilter === "all" || r.status === statusFilter)
    .filter((r) => search === "" || r.student!.name.toLowerCase().includes(search.toLowerCase()) || r.student!.rollNo.toLowerCase().includes(search.toLowerCase())),
    [records, statusFilter, search]);

  const handleToggle = (studentId: string, current: "present" | "absent") => {
    const next = current === "present" ? "absent" : "present";
    markAttendance(studentId, next).then(() => {
      loadRecords();
      getAttendanceStats().then(setStats);
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="Attendance Overview"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Exporting Attendance Report... Download will start shortly.")}>Export Report</Button>
            <Button variant="contained" onClick={() => setDialogOpen(true)}>Mark Attendance</Button>
          </Stack>
        }
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Attendance tracking system provides real-time attendance marking and tracking,
        student-wise and course-wise reports, low attendance alerts and notifications,
        biometric and manual entry integration, leave management and approvals, and
        automated percentage calculations.
      </Typography>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Today's Attendance" icon={<EventNoteIcon />} color={getIconAccent(mode, "attendance-today")} value={`${stats.pct}%`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Weekly Average" icon={<TrendingUpIcon />} color={getIconAccent(mode, "attendance-weekly")} value={`${weeklyAvg}%`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Low Attendance Alerts" icon={<WarningAmberIcon />} color={getIconAccent(mode, "attendance-alerts")} numericValue={lowAttendanceCount} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Leave Requests" icon={<EventBusyIcon />} color={getIconAccent(mode, "leave-requests")} numericValue={pendingLeave} />
        </Grid>
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3.5, mb: 1.5 }}>Today's Attendance</Typography>
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value as "all" | "present" | "absent")}>
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="present">Present</MenuItem>
            <MenuItem value="absent">Absent</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 220 }} />
      </Stack>

      <DataTable
        pagination
        columns={[
          { key: "rollNo", label: "Roll No", render: (row) => row.student!.rollNo },
          { key: "name", label: "Student Name", render: (row) => row.student!.name },
          { key: "program", label: "Program", render: (row) => row.student!.program },
          { key: "status", label: "Today's Status", render: (row) => <StatusChip status={row.status} /> },
          { key: "attendancePct", label: "Overall %", render: (row) => `${row.student!.attendancePct}%` },
          {
            key: "actions", label: "Action",
            render: (row) => (
              <Button size="small" onClick={() => handleToggle(row.studentId, row.status)}>
                {row.status === "present" ? "Mark Absent" : "Mark Present"}
              </Button>
            ),
          },
        ]}
        rows={rows}
        emptyTitle="No attendance records found"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mark Attendance</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Course</InputLabel>
            <Select label="Course" value={form.courseId} onChange={(e: SelectChangeEvent) => setForm({ ...form, courseId: e.target.value })}>
              {courses.map((c) => <MenuItem key={c.id} value={c.id}>{c.id} - {c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
          <FormControl fullWidth>
            <InputLabel>Session</InputLabel>
            <Select label="Session" value={form.session} onChange={(e: SelectChangeEvent) => setForm({ ...form, session: e.target.value })}>
              <MenuItem value="Morning (9:00 AM - 12:00 PM)">Morning (9:00 AM - 12:00 PM)</MenuItem>
              <MenuItem value="Afternoon (2:00 PM - 5:00 PM)">Afternoon (2:00 PM - 5:00 PM)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setDialogOpen(false); setSnackbar(`Showing today's attendance sheet for ${courses.find((c) => c.id === form.courseId)?.name ?? "the selected course"}`); }}>Continue</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
