import { useEffect, useState } from "react";
import { Button, Stack, Typography, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import {
  getLeaveRequests, getGradeChangeRequests, getResourceRequests,
  approveDeanRequest, rejectDeanRequest, type DeanRequestType,
} from "@/api/teacherRequests";
import type { TeacherLeaveRequest, GradeChangeRequest, ResourceRequest } from "@/types";

export default function ApprovalsDashboard() {
  const [leave, setLeave] = useState<TeacherLeaveRequest[]>([]);
  const [gradeChange, setGradeChange] = useState<GradeChangeRequest[]>([]);
  const [resource, setResource] = useState<ResourceRequest[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => {
    getLeaveRequests().then(setLeave);
    getGradeChangeRequests().then(setGradeChange);
    getResourceRequests().then(setResource);
  };
  useEffect(() => { load(); }, []);

  const handleApprove = (type: DeanRequestType, id: string) =>
    approveDeanRequest(type, id).then(() => { load(); setSnackbar("Request approved"); });
  const handleReject = (type: DeanRequestType, id: string) =>
    rejectDeanRequest(type, id).then(() => { load(); setSnackbar("Request rejected"); });

  const actionCell = (type: DeanRequestType, id: string, deanStatus: string | null) =>
    deanStatus === "pending_approval" ? (
      <Stack direction="row" spacing={1}>
        <Button size="small" variant="contained" onClick={() => handleApprove(type, id)}>Approve</Button>
        <Button size="small" variant="outlined" color="error" onClick={() => handleReject(type, id)}>Reject</Button>
      </Stack>
    ) : "—";

  return (
    <>
      <PageHeader eyebrow="Dean Functions" title="Approvals Dashboard" />

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Leave Requests (Escalated)</Typography>
      <DataTable<TeacherLeaveRequest>
        columns={[
          { key: "leaveType", label: "Type" },
          { key: "fromDate", label: "From" },
          { key: "toDate", label: "To" },
          { key: "hodStatus", label: "HOD Status", render: (row) => <StatusChip status={row.hodStatus} /> },
          { key: "deanStatus", label: "Dean Status", render: (row) => row.deanStatus ? <StatusChip status={row.deanStatus} /> : "—" },
          { key: "actions", label: "Action", render: (row) => actionCell("leave", row.id, row.deanStatus) },
        ]}
        rows={leave.filter((r) => r.deanStatus !== null)}
        emptyTitle="No leave requests escalated to Dean"
      />

      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1.5 }}>Grade Change Requests (Escalated)</Typography>
      <DataTable<GradeChangeRequest>
        columns={[
          { key: "courseId", label: "Course" },
          { key: "studentRollNo", label: "Roll No" },
          { key: "originalMark", label: "Original" },
          { key: "proposedMark", label: "Proposed" },
          { key: "hodStatus", label: "HOD Status", render: (row) => <StatusChip status={row.hodStatus} /> },
          { key: "deanStatus", label: "Dean Status", render: (row) => row.deanStatus ? <StatusChip status={row.deanStatus} /> : "—" },
          { key: "actions", label: "Action", render: (row) => actionCell("grade-change", row.id, row.deanStatus) },
        ]}
        rows={gradeChange.filter((r) => r.deanStatus !== null)}
        emptyTitle="No grade change requests escalated to Dean"
      />

      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1.5 }}>Resource Requests (Escalated)</Typography>
      <DataTable<ResourceRequest>
        columns={[
          { key: "resourceType", label: "Resource" },
          { key: "description", label: "Description" },
          { key: "estimatedCost", label: "Cost", render: (row) => `₹${row.estimatedCost.toLocaleString("en-IN")}` },
          { key: "hodStatus", label: "HOD Status", render: (row) => <StatusChip status={row.hodStatus} /> },
          { key: "deanStatus", label: "Dean Status", render: (row) => row.deanStatus ? <StatusChip status={row.deanStatus} /> : "—" },
          { key: "actions", label: "Action", render: (row) => actionCell("resource", row.id, row.deanStatus) },
        ]}
        rows={resource.filter((r) => r.deanStatus !== null)}
        emptyTitle="No resource requests escalated to Dean"
      />

      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
