import { useEffect, useState } from "react";
import { Button, Stack, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getMarksApprovals, approveMarksApproval, rejectMarksApproval } from "@/api/teacherApprovals";
import type { MarksApprovalEntry } from "@/types";

export default function MarksApproval() {
  const [rows, setRows] = useState<MarksApprovalEntry[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getMarksApprovals().then(setRows);
  useEffect(() => { load(); }, []);

  const handleApprove = (id: string) => approveMarksApproval(id).then(() => { load(); setSnackbar("Marks approved"); });
  const handleReject = (id: string) => rejectMarksApproval(id).then(() => { load(); setSnackbar("Marks rejected"); });

  return (
    <>
      <PageHeader eyebrow="HOD Functions" title="Marks Approval" />
      <DataTable<MarksApprovalEntry>
        pagination
        columns={[
          { key: "course", label: "Course" },
          { key: "facultyName", label: "Faculty" },
          { key: "assessment", label: "Assessment" },
          { key: "maxMarks", label: "Max Marks" },
          { key: "submittedOn", label: "Submitted On" },
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
        emptyTitle="No marks submissions pending review"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
