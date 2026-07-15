import { useEffect, useState } from "react";
import {
  Button, MenuItem, Select, InputLabel, FormControl, Stack, Typography, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getTeacherCourses } from "@/api/teacherCourses";
import { students } from "@/demo-data/people/students";
import type { TeacherCourse, Student } from "@/types";

export default function MyCourseStudents() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getTeacherCourses().then(setCourses); }, []);

  const rosterIds = new Set(courses.flatMap((c) => courseFilter === "all" || c.id === courseFilter ? c.studentIds : []));
  const roster = students.filter((s) => rosterIds.has(s.id));

  const statusFor = (s: Student) => s.attendancePct < 70 || s.cgpa < 6 ? "At Risk" : s.attendancePct > 90 && s.cgpa > 8.5 ? "Excellent" : "Good";
  const filtered = roster.filter((s) => statusFilter === "all" || statusFor(s) === statusFilter);

  const atRisk = roster.filter((s) => statusFor(s) === "At Risk").slice(0, 5);

  return (
    <>
      <PageHeader eyebrow="Students" title="My Course Students" />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Course</InputLabel>
          <Select label="Course" value={courseFilter} onChange={(e: SelectChangeEvent) => setCourseFilter(e.target.value)}>
            <MenuItem value="all">All Courses</MenuItem>
            {courses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}>
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="Excellent">Excellent</MenuItem>
            <MenuItem value="Good">Good</MenuItem>
            <MenuItem value="At Risk">At Risk</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <DataTable<Student>
        pagination
        columns={[
          { key: "rollNo", label: "Roll No" },
          { key: "name", label: "Name" },
          { key: "program", label: "Program" },
          { key: "year", label: "Year" },
          { key: "attendancePct", label: "Attendance %", render: (row) => `${row.attendancePct}%` },
          { key: "cgpa", label: "Internal Marks %", render: (row) => `${Math.round(row.cgpa * 10)}%` },
          { key: "status", label: "Status", render: (row) => <StatusChip status={statusFor(row) === "At Risk" ? "overdue" : statusFor(row) === "Excellent" ? "active" : "present"} /> },
          { key: "actions", label: "Action", render: () => <Button size="small" onClick={() => setSnackbar("Loading student profile...")}>View</Button> },
        ]}
        rows={filtered}
        emptyTitle="No students found"
      />

      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 4, mb: 1.5 }}>At-Risk Students Summary</Typography>
      <DataTable<Student>
        columns={[
          { key: "rollNo", label: "Roll No" },
          { key: "name", label: "Name" },
          { key: "issue", label: "Issue", render: (row) => row.attendancePct < 70 ? "Low Attendance" : "Low Marks" },
          { key: "attendancePct", label: "Attendance", render: (row) => `${row.attendancePct}%` },
          { key: "cgpa", label: "Marks", render: (row) => `${Math.round(row.cgpa * 10)}%` },
          { key: "actions", label: "Action", render: () => <Button size="small" onClick={() => setSnackbar("Flagged to HOD")}>Flag to HOD</Button> },
        ]}
        rows={atRisk}
        emptyTitle="No at-risk students"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
