import { useState } from "react";
import { Button, Stack, Typography, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { DataTable } from "@/components/DataTable";
import { useTeacherRole } from "@/context/TeacherRoleContext";
import { students } from "@/demo-data/people/students";

export default function DepartmentStudents() {
  const { role } = useTeacherRole();
  const [snackbar, setSnackbar] = useState<string | null>(null);

  if (role === "professor") {
    return (
      <>
        <PageHeader eyebrow="Students" title="Department Students" />
        <EmptyState title="Access Denied" description="This feature is only available to HOD and Dean." />
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Students" title="Department Students" />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Computer Science Department — {students.length} Students</Typography>
      <DataTable
        pagination
        columns={[
          { key: "rollNo", label: "Roll No" },
          { key: "name", label: "Name" },
          { key: "program", label: "Program" },
          { key: "year", label: "Year" },
          { key: "attendancePct", label: "Attendance %", render: (row) => `${row.attendancePct}%` },
          { key: "actions", label: "Action", render: () => <Stack direction="row"><Button size="small" onClick={() => setSnackbar("Loading student profile...")}>View</Button></Stack> },
        ]}
        rows={students}
        emptyTitle="No students found"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
