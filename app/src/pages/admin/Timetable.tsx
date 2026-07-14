import { useEffect, useState } from "react";
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Snackbar, type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { getTimetableClasses, addTimetableEntry } from "@/api/timetable";
import { getCourseById, getCoursesByDepartment } from "@/demo-data/academics/courses";
import { getFacultyById, getFacultyByDepartment } from "@/demo-data/people/faculty";
import { departmentSeeds } from "@/demo-data/academics/departmentSeeds";
import type { TimetableClass, TimetableEntry } from "@/types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ROW_TIMES = ["09:00 - 10:00", "10:00 - 11:00", "11:00 - 11:15", "11:15 - 12:15", "12:15 - 13:00", "13:00 - 14:00", "14:00 - 15:00"];
const ADD_SLOT_TIMES = ["09:00 - 10:00", "10:00 - 11:00", "11:15 - 12:15", "13:00 - 14:00", "14:00 - 15:00"];

const emptyForm = { classId: "", day: "Monday", time: ADD_SLOT_TIMES[0], courseId: "", facultyId: "", room: "", type: "Lecture" };

function classLabel(cls: TimetableClass): string {
  return `${departmentSeeds.find((d) => d.id === cls.departmentId)?.name ?? cls.departmentId} - Year ${cls.year}`;
}

export default function Timetable() {
  const [classes, setClasses] = useState<TimetableClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getTimetableClasses().then((data) => {
    setClasses(data);
    setSelectedClassId((prev) => prev || data[0]?.id || "");
  });
  useEffect(() => { load(); }, []);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const cellFor = (day: string, time: string) => selectedClass?.entries.find((e) => e.day === day && e.time === time);

  const openAdd = () => { setForm({ ...emptyForm, classId: selectedClassId }); setDialogOpen(true); };

  const handleSave = () => {
    const entry: TimetableEntry = {
      day: form.day,
      time: form.time,
      type: "class",
      courseId: form.courseId || undefined,
      facultyId: form.facultyId || undefined,
      label: form.courseId ? undefined : form.type,
      room: form.room || undefined,
    };
    addTimetableEntry(form.classId, entry).then(load);
    setDialogOpen(false);
    setSnackbar("Schedule added successfully!");
  };

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="Timetable Management"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Exporting Timetable... Download will start shortly.")}>Export</Button>
            <Button variant="contained" onClick={openAdd}>Add Schedule</Button>
          </Stack>
        }
      />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 260 }}>
          <InputLabel>Class</InputLabel>
          <Select label="Class" value={selectedClassId} onChange={(e: SelectChangeEvent) => setSelectedClassId(e.target.value)}>
            {classes.map((c) => <MenuItem key={c.id} value={c.id}>{classLabel(c)}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              {DAYS.map((d) => <TableCell key={d}>{d}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {ROW_TIMES.map((time) => {
              const firstCell = cellFor("Monday", time);
              if (firstCell?.type === "break" || firstCell?.type === "lunch") {
                return (
                  <TableRow key={time}>
                    <TableCell>{time}</TableCell>
                    <TableCell colSpan={DAYS.length} sx={{ textAlign: "center", fontStyle: "italic", color: "text.secondary" }}>
                      {firstCell.label}
                    </TableCell>
                  </TableRow>
                );
              }
              return (
                <TableRow key={time}>
                  <TableCell>{time}</TableCell>
                  {DAYS.map((day) => {
                    const entry = cellFor(day, time);
                    if (!entry) return <TableCell key={day} />;
                    const course = entry.courseId ? getCourseById(entry.courseId) : undefined;
                    const instructor = entry.facultyId ? getFacultyById(entry.facultyId) : undefined;
                    return (
                      <TableCell key={day}>
                        <Typography variant="body2" fontWeight={600}>{course?.name ?? entry.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{instructor?.name ?? "All Faculty"}</Typography>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Schedule</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Class</InputLabel>
            <Select label="Class" value={form.classId} onChange={(e: SelectChangeEvent) => setForm({ ...form, classId: e.target.value, courseId: "", facultyId: "" })}>
              {classes.map((c) => <MenuItem key={c.id} value={c.id}>{classLabel(c)}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Day</InputLabel>
            <Select label="Day" value={form.day} onChange={(e: SelectChangeEvent) => setForm({ ...form, day: e.target.value })}>
              {DAYS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Time Slot</InputLabel>
            <Select label="Time Slot" value={form.time} onChange={(e: SelectChangeEvent) => setForm({ ...form, time: e.target.value })}>
              {ADD_SLOT_TIMES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Subject</InputLabel>
            <Select label="Subject" value={form.courseId} onChange={(e: SelectChangeEvent) => setForm({ ...form, courseId: e.target.value })}>
              {getCoursesByDepartment(classes.find((c) => c.id === form.classId)?.departmentId ?? "").map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Faculty</InputLabel>
            <Select label="Faculty" value={form.facultyId} onChange={(e: SelectChangeEvent) => setForm({ ...form, facultyId: e.target.value })}>
              {getFacultyByDepartment(classes.find((c) => c.id === form.classId)?.departmentId ?? "").map((f) => (
                <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Room" placeholder="Room 301" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={form.type} onChange={(e: SelectChangeEvent) => setForm({ ...form, type: e.target.value })}>
              <MenuItem value="Lecture">Lecture</MenuItem>
              <MenuItem value="Lab">Lab</MenuItem>
              <MenuItem value="Tutorial">Tutorial</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Add Schedule</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
