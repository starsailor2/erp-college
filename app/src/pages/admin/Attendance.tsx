import { useEffect, useState } from "react";
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
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getAttendanceStats } from "@/api/attendance";
import { getPendingLeaveCount } from "@/api/leaveRequests";
import { students } from "@/demo-data/people/students";
import { courses } from "@/demo-data/academics/courses";

const emptyForm = { courseId: courses[0]?.id ?? "", date: "2026-07-14", session: "Morning (9:00 AM - 12:00 PM)" };

export default function Attendance() {
  const { mode } = useColorMode();
  const [stats, setStats] = useState({ present: 0, total: 0, pct: 0 });
  const [pendingLeave, setPendingLeave] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getAttendanceStats().then((data) => { if (live) setStats(data); });
    getPendingLeaveCount().then((count) => { if (live) setPendingLeave(count); });
    return () => { live = false; };
  }, []);

  const weeklyAvg = students.length > 0
    ? Math.round((students.reduce((sum, s) => sum + s.attendancePct, 0) / students.length) * 10) / 10
    : 0;
  const lowAttendanceCount = students.filter((s) => s.attendancePct < 75).length;

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
          <Button variant="contained" onClick={() => { setDialogOpen(false); setSnackbar("Opening attendance sheet..."); }}>Continue</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
