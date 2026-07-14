import { useEffect, useState } from "react";
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, Grid, Typography, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import GradingIcon from "@mui/icons-material/Grading";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ApartmentIcon from "@mui/icons-material/Apartment";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getExams, updateExam } from "@/api/exams";
import { getCourseById } from "@/demo-data/academics/courses";
import { departmentSeeds } from "@/demo-data/academics/departmentSeeds";
import type { Exam, ExamType } from "@/types";

const emptyForm = { date: "", startTime: "", endTime: "", type: "written" as ExamType, venue: "", capacity: 0 };

export default function Exams() {
  const { mode } = useColorMode();
  const [rows, setRows] = useState<Exam[]>([]);
  const [deptFilter, setDeptFilter] = useState("all");
  const [editing, setEditing] = useState<Exam | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getExams().then(setRows);
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((e) => deptFilter === "all" || getCourseById(e.courseId)?.departmentId === deptFilter);

  const stats = {
    total: rows.length,
    scheduled: rows.filter((e) => !!e.date).length,
    conflicts: rows.filter((e) => e.conflict || e.capacityWarning).length,
    venues: new Set(rows.map((e) => e.venue)).size,
  };

  const openEdit = (exam: Exam) => {
    setEditing(exam);
    setForm({ date: exam.date, startTime: exam.startTime, endTime: exam.endTime, type: exam.type, venue: exam.venue, capacity: exam.capacity });
  };

  const handleSave = () => {
    if (!editing) return;
    updateExam(editing.id, form).then(load);
    setEditing(null);
    setSnackbar("Exam schedule updated successfully!");
  };

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="Exams & Results"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Exporting Exams... Download will start shortly.")}>Export</Button>
            <Button variant="outlined" onClick={() => setSnackbar("Opening audit log...")}>Audit Log</Button>
            <Button variant="contained" onClick={() => setSnackbar("Exam schedule published successfully!")}>Publish Schedule</Button>
          </Stack>
        }
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Examination management system includes creating and managing exam schedules, venue
        allocation and capacity management, conflict detection and resolution, invigilator
        assignment, hall ticket generation, and result processing and grade publication.
      </Typography>
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Exams" icon={<GradingIcon />} color={getIconAccent(mode, "exams-total")} numericValue={stats.total} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Scheduled" icon={<EventAvailableIcon />} color={getIconAccent(mode, "exams-scheduled")} numericValue={stats.scheduled} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Conflicts" icon={<WarningAmberIcon />} color={getIconAccent(mode, "exams-conflicts")} numericValue={stats.conflicts} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Venues Used" icon={<ApartmentIcon />} color={getIconAccent(mode, "exams-venues")} numericValue={stats.venues} />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Department</InputLabel>
          <Select label="Department" value={deptFilter} onChange={(e: SelectChangeEvent) => setDeptFilter(e.target.value)}>
            <MenuItem value="all">All Departments</MenuItem>
            {departmentSeeds.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      <DataTable<Exam>
        pagination
        title="Exam Schedule (Draft)"
        columns={[
          { key: "courseId", label: "Code" },
          { key: "courseName", label: "Course Name", render: (row) => getCourseById(row.courseId)?.name ?? row.courseId },
          { key: "date", label: "Date" },
          {
            key: "time", label: "Time Slot",
            render: (row) => (
              <Typography component="span" sx={{ color: row.conflict ? "error.main" : "inherit", fontWeight: row.conflict ? 700 : 400 }}>
                {row.startTime} - {row.endTime}{row.conflict ? " ⚠️" : ""}
              </Typography>
            ),
          },
          { key: "type", label: "Type", render: (row) => row.type.charAt(0).toUpperCase() + row.type.slice(1) },
          { key: "venue", label: "Venue", render: (row) => row.capacityWarning ? `${row.venue} ⚠️` : row.venue },
          {
            key: "actions", label: "Actions",
            render: (row) => <Button size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>Edit</Button>,
          },
        ]}
        rows={filtered}
        emptyTitle="No exams found"
      />

      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        {editing && (
          <>
            <DialogTitle>Edit Exam Schedule</DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <TextField label="Course Code" value={editing.courseId} fullWidth InputProps={{ readOnly: true }} />
              <TextField label="Course Name" value={getCourseById(editing.courseId)?.name ?? ""} fullWidth InputProps={{ readOnly: true }} />
              <TextField label="Exam Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
              <Stack direction="row" spacing={2}>
                <TextField label="Start Time" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
                <TextField label="End Time" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
              </Stack>
              <FormControl fullWidth>
                <InputLabel>Exam Type</InputLabel>
                <Select label="Exam Type" value={form.type} onChange={(e: SelectChangeEvent) => setForm({ ...form, type: e.target.value as ExamType })}>
                  <MenuItem value="written">Written</MenuItem>
                  <MenuItem value="lab">Lab</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="practical">Practical</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} fullWidth />
              <TextField label="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} fullWidth />
              <TextField label="Enrolled Students" value={editing.enrolledCount} fullWidth InputProps={{ readOnly: true }} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="contained" onClick={handleSave}>Save Changes</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
