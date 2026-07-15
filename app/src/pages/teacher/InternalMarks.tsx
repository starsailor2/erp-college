import { useEffect, useState } from "react";
import {
  Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Paper, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getTeacherCourses } from "@/api/teacherCourses";
import { getMarksSubmissions, getMarksSubmissionByIdAsync, submitMarks } from "@/api/teacherMarks";
import { getStudentById } from "@/demo-data/people/students";
import type { TeacherCourse, MarksSubmission } from "@/types";

const assessments = ["Quiz1", "Quiz2", "Assignment1", "MidExam"];

export default function InternalMarks() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [courseId, setCourseId] = useState("");
  const [assessment, setAssessment] = useState(assessments[0]);
  const [maxMarks, setMaxMarks] = useState(20);
  const [records, setRecords] = useState<{ studentId: string; marks: number }[]>([]);
  const [history, setHistory] = useState<MarksSubmission[]>([]);
  const [detail, setDetail] = useState<MarksSubmission | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getTeacherCourses().then(setCourses); loadHistory(); }, []);
  const loadHistory = () => getMarksSubmissions().then(setHistory);

  const handleCourseChange = (id: string) => {
    setCourseId(id);
    const course = courses.find((c) => c.id === id);
    setRecords(course ? course.studentIds.map((studentId) => ({ studentId, marks: 0 })) : []);
  };

  const handleSubmit = (status: MarksSubmission["status"]) => {
    if (!courseId) return;
    submitMarks({ id: `MRK-${Date.now()}`, courseId, assessment, maxMarks, date: new Date().toISOString().slice(0, 10), status, records }).then(() => {
      loadHistory();
      setSnackbar(status === "submitted" ? "Marks submitted successfully!" : "Saved as draft");
    });
  };

  const openDetail = (id: string) => getMarksSubmissionByIdAsync(id).then((data) => setDetail(data ?? null));

  if (detail) {
    const avg = detail.records.reduce((sum, r) => sum + r.marks, 0) / (detail.records.length || 1);
    return (
      <>
        <PageHeader eyebrow="Academics" title={`Marks Detail — ${detail.courseId} ${detail.assessment}`} action={<Button variant="outlined" onClick={() => setDetail(null)}>Back</Button>} />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Max Marks: {detail.maxMarks} · Average: {avg.toFixed(1)}</Typography>
        <DataTable
          pagination
          columns={[
            { key: "studentId", label: "Roll No", render: (r) => getStudentById(r.studentId)?.rollNo ?? r.studentId },
            { key: "name", label: "Name", render: (r) => getStudentById(r.studentId)?.name ?? "—" },
            { key: "marks", label: "Marks" },
            { key: "pct", label: "%", render: (r) => `${Math.round((r.marks / detail.maxMarks) * 100)}%` },
          ]}
          rows={detail.records}
          emptyTitle="No records"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Academics" title="Internal Marks" />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Course</InputLabel>
          <Select label="Course" value={courseId} onChange={(e: SelectChangeEvent) => handleCourseChange(e.target.value)}>
            {courses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name} ({c.id})</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Assessment</InputLabel>
          <Select label="Assessment" value={assessment} onChange={(e: SelectChangeEvent) => setAssessment(e.target.value)}>
            {assessments.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" label="Max Marks" type="number" value={maxMarks} onChange={(e) => setMaxMarks(Number(e.target.value))} sx={{ width: 120 }} />
      </Stack>

      {records.length > 0 && (
        <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
          <DataTable
            pagination
            columns={[
              { key: "studentId", label: "Roll No", render: (r) => getStudentById(r.studentId)?.rollNo ?? r.studentId },
              { key: "name", label: "Name", render: (r) => getStudentById(r.studentId)?.name ?? "—" },
              {
                key: "marks", label: "Marks",
                render: (r, i) => <TextField size="small" type="number" value={r.marks} onChange={(e) => setRecords(records.map((rec, idx) => idx === i ? { ...rec, marks: Number(e.target.value) } : rec))} sx={{ width: 80 }} />,
              },
              { key: "outOf", label: "Out of", render: () => maxMarks },
              { key: "pct", label: "%", render: (r) => `${Math.round((r.marks / maxMarks) * 100)}%` },
            ]}
            rows={records}
            emptyTitle="No students"
          />
          <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={() => handleSubmit("submitted")}>Submit Marks</Button>
            <Button variant="outlined" onClick={() => handleSubmit("pending_hod_review")}>Save as Draft</Button>
          </Stack>
        </Paper>
      )}

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Marks Submission History</Typography>
      <DataTable<MarksSubmission>
        pagination
        columns={[
          { key: "courseId", label: "Course" },
          { key: "assessment", label: "Assessment" },
          { key: "date", label: "Date" },
          { key: "records", label: "Total Marks", render: (row) => row.records.length },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          { key: "actions", label: "Action", render: (row) => <Button size="small" onClick={() => openDetail(row.id)}>View</Button> },
        ]}
        rows={history}
        emptyTitle="No submissions yet"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
