import { useEffect, useState } from "react";
import { Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Paper, Grid, Snackbar, type SelectChangeEvent } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getTeacherCourses } from "@/api/teacherCourses";
import { getGradeChangeRequests, addGradeChangeRequest } from "@/api/teacherRequests";
import type { TeacherCourse, GradeChangeRequest } from "@/types";

const assessments = ["Quiz1", "Quiz2", "Assignment1", "MidExam"];
const emptyForm = { courseId: "", studentRollNo: "", assessment: assessments[0], originalMark: 0, proposedMark: 0, reason: "" };

export default function GradeChangeRequests() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [rows, setRows] = useState<GradeChangeRequest[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getGradeChangeRequests().then(setRows);
  useEffect(() => { getTeacherCourses().then(setCourses); load(); }, []);

  const handleSubmit = () => {
    addGradeChangeRequest(form).then(() => { load(); setForm(emptyForm); setSnackbar("Grade change request submitted"); });
  };

  return (
    <>
      <PageHeader eyebrow="Requests" title="Grade Change Requests" />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Approval chain: Professor → HOD → Dean. All changes are logged.</Typography>

      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>New Grade Change Request</Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Course</InputLabel>
              <Select label="Course" value={form.courseId} onChange={(e: SelectChangeEvent) => setForm({ ...form, courseId: e.target.value })}>
                {courses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name} ({c.id})</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Student Roll No" fullWidth value={form.studentRollNo} onChange={(e) => setForm({ ...form, studentRollNo: e.target.value })} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Assessment</InputLabel>
              <Select label="Assessment" value={form.assessment} onChange={(e: SelectChangeEvent) => setForm({ ...form, assessment: e.target.value })}>
                {assessments.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Original Mark" type="number" fullWidth value={form.originalMark} onChange={(e) => setForm({ ...form, originalMark: Number(e.target.value) })} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Proposed Mark" type="number" fullWidth value={form.proposedMark} onChange={(e) => setForm({ ...form, proposedMark: Number(e.target.value) })} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Difference" fullWidth disabled value={form.proposedMark - form.originalMark} /></Grid>
          <Grid size={12}><TextField label="Reason" fullWidth multiline minRows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Grid>
        </Grid>
        <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
          <Button variant="contained" onClick={handleSubmit}>Submit Request</Button>
          <Button variant="outlined" onClick={() => setForm(emptyForm)}>Cancel</Button>
        </Stack>
      </Paper>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Request History</Typography>
      <DataTable<GradeChangeRequest>
        pagination
        columns={[
          { key: "studentRollNo", label: "Roll No" },
          { key: "courseId", label: "Course" },
          { key: "assessment", label: "Assessment" },
          { key: "change", label: "Original → Proposed", render: (row) => `${row.originalMark} → ${row.proposedMark}` },
          { key: "raisedOn", label: "Raised On" },
          { key: "hodStatus", label: "HOD Status", render: (row) => <StatusChip status={row.hodStatus} /> },
          { key: "deanStatus", label: "Dean Status", render: (row) => row.deanStatus ? <StatusChip status={row.deanStatus} /> : "—" },
        ]}
        rows={rows}
        emptyTitle="No grade change requests"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
