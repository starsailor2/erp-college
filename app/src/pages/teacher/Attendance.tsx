import { useEffect, useState } from "react";
import {
  Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Paper, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { getTeacherCourses } from "@/api/teacherCourses";
import { getAttendanceSubmissions, getAttendanceSubmissionByIdAsync, submitAttendance } from "@/api/teacherAttendance";
import { getStudentById } from "@/demo-data/people/students";
import type { TeacherCourse, AttendanceSubmission, AttendanceMarkStatus } from "@/types";

const statusOptions: AttendanceMarkStatus[] = ["present", "absent", "medical", "other"];

export default function Attendance() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [session, setSession] = useState<"forenoon" | "afternoon">("forenoon");
  const [records, setRecords] = useState<{ studentId: string; status: AttendanceMarkStatus; remarks: string }[]>([]);
  const [history, setHistory] = useState<AttendanceSubmission[]>([]);
  const [detail, setDetail] = useState<AttendanceSubmission | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getTeacherCourses().then(setCourses); loadHistory(); }, []);
  const loadHistory = () => getAttendanceSubmissions().then(setHistory);

  const handleCourseChange = (id: string) => {
    setCourseId(id);
    const course = courses.find((c) => c.id === id);
    setRecords(course ? course.studentIds.map((studentId) => ({ studentId, status: "present" as AttendanceMarkStatus, remarks: "" })) : []);
  };

  const handleSubmit = () => {
    if (!courseId) return;
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    submitAttendance({ id: `ATT-${Date.now()}`, courseId, section: course.section, session, date, records }).then(() => {
      loadHistory();
      setSnackbar("Attendance submitted successfully!");
    });
  };

  const openDetail = (id: string) => {
    getAttendanceSubmissionByIdAsync(id).then((data) => setDetail(data ?? null));
  };

  if (detail) {
    const present = detail.records.filter((r) => r.status === "present").length;
    return (
      <>
        <PageHeader eyebrow="Academics" title={`Attendance Detail — ${detail.courseId}`} action={<Button variant="outlined" onClick={() => setDetail(null)}>Back</Button>} />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{detail.date} · {detail.session} · Section {detail.section}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>{present}/{detail.records.length} present ({Math.round((present / detail.records.length) * 100)}%)</Typography>
        <DataTable
          columns={[
            { key: "studentId", label: "Roll No", render: (r) => getStudentById(r.studentId)?.rollNo ?? r.studentId },
            { key: "name", label: "Name", render: (r) => getStudentById(r.studentId)?.name ?? "—" },
            { key: "status", label: "Status" },
          ]}
          rows={detail.records}
          emptyTitle="No records"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Academics" title="Attendance" />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Course</InputLabel>
          <Select label="Course" value={courseId} onChange={(e: SelectChangeEvent) => handleCourseChange(e.target.value)}>
            {courses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name} ({c.id})</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Session</InputLabel>
          <Select label="Session" value={session} onChange={(e: SelectChangeEvent) => setSession(e.target.value as "forenoon" | "afternoon")}>
            <MenuItem value="forenoon">Forenoon</MenuItem>
            <MenuItem value="afternoon">Afternoon</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {records.length > 0 && (
        <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
          <DataTable
            pagination
            columns={[
              { key: "studentId", label: "Roll No", render: (r) => getStudentById(r.studentId)?.rollNo ?? r.studentId },
              { key: "name", label: "Name", render: (r) => getStudentById(r.studentId)?.name ?? "—" },
              {
                key: "status", label: "Status",
                render: (r, i) => (
                  <Select size="small" value={r.status} onChange={(e: SelectChangeEvent) => setRecords(records.map((rec, idx) => idx === i ? { ...rec, status: e.target.value as AttendanceMarkStatus } : rec))}>
                    {statusOptions.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                ),
              },
              {
                key: "remarks", label: "Remarks",
                render: (r, i) => <TextField size="small" value={r.remarks} onChange={(e) => setRecords(records.map((rec, idx) => idx === i ? { ...rec, remarks: e.target.value } : rec))} />,
              },
            ]}
            rows={records}
            emptyTitle="No students"
          />
          <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={handleSubmit}>Submit Attendance</Button>
            <Button variant="outlined" onClick={() => handleCourseChange(courseId)}>Clear Form</Button>
          </Stack>
        </Paper>
      )}

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Submission History</Typography>
      <DataTable<AttendanceSubmission>
        pagination
        columns={[
          { key: "date", label: "Date" },
          { key: "courseId", label: "Course" },
          { key: "section", label: "Section" },
          { key: "session", label: "Session" },
          { key: "records", label: "Students", render: (row) => row.records.length },
          {
            key: "actions", label: "Action",
            render: (row) => <Button size="small" onClick={() => openDetail(row.id)}>View</Button>,
          },
        ]}
        rows={history}
        emptyTitle="No submissions yet"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
