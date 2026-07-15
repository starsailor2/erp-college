import { useEffect, useState } from "react";
import { Button, Stack, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getAttendanceApprovals, approveAttendanceApproval, rejectAttendanceApproval } from "@/api/teacherApprovals";
import type { AttendanceApprovalEntry } from "@/types";

export default function AttendanceApproval() {
  const [rows, setRows] = useState<AttendanceApprovalEntry[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getAttendanceApprovals().then(setRows);
  useEffect(() => { load(); }, []);

  const handleApprove = (id: string) => approveAttendanceApproval(id).then(() => { load(); setSnackbar("Attendance approved"); });
  const handleReject = (id: string) => rejectAttendanceApproval(id).then(() => { load(); setSnackbar("Attendance rejected"); });

  return (
    <>
      <PageHeader eyebrow="HOD Functions" title="Attendance Approval" />
      <DataTable<AttendanceApprovalEntry>
        pagination
        columns={[
          { key: "course", label: "Course" },
          { key: "facultyName", label: "Faculty" },
          { key: "section", label: "Section" },
          { key: "date", label: "Date" },
          { key: "students", label: "Students" },
          { key: "submitted", label: "Submitted" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          {
            key: "actions", label: "Action",
            render: (row) => row.status === "pending" ? (
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="contained" onClick={() => handleApprove(row.id)}>Approve</Button>
                <Button size="small" variant="outlined" color="error" onClick={() => handleReject(row.id)}>Reject</Button>
              </Stack>
            ) : "—",
          },
        ]}
        rows={rows}
        emptyTitle="No attendance submissions pending review"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
