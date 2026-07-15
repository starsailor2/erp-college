import { useEffect, useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Paper, Stack, TextField, Typography, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getAcademicRequests, submitAcademicRequest } from "@/api/studentRequests";
import type { AcademicRequestType, StudentAcademicRequest } from "@/types";

const requestTypes: { type: AcademicRequestType; label: string }[] = [
  { type: "course_drop", label: "Course Drop" },
  { type: "section_change", label: "Section Change" },
  { type: "re_evaluation", label: "Re-evaluation" },
  { type: "grade_improvement", label: "Grade Improvement" },
  { type: "leave_application", label: "Leave Application" },
];

export default function AcademicRequests() {
  const [rows, setRows] = useState<StudentAcademicRequest[]>([]);
  const [open, setOpen] = useState<AcademicRequestType | null>(null);
  const [details, setDetails] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getAcademicRequests().then(setRows);
  useEffect(() => { load(); }, []);

  const handleSubmit = () => {
    if (!open || !details) { setSnackbar("Please describe your request"); return; }
    submitAcademicRequest(open, details).then(() => { load(); setOpen(null); setDetails(""); setSnackbar("Request submitted"); });
  };

  return (
    <>
      <PageHeader eyebrow="Academics" title="Academic Requests" />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>New Request</Typography>
        <Grid container spacing={1.5}>
          {requestTypes.map((r) => (
            <Grid key={r.type} size={{ xs: 12, sm: 6, md: "auto" }}>
              <Button variant="outlined" fullWidth onClick={() => setOpen(r.type)}>{r.label}</Button>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Request Status</Typography>
      <DataTable<StudentAcademicRequest>
        pagination
        columns={[
          { key: "type", label: "Type", render: (row) => requestTypes.find((r) => r.type === row.type)?.label ?? row.type },
          { key: "details", label: "Details" },
          { key: "submittedOn", label: "Submitted On" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={rows}
        emptyTitle="No requests submitted yet"
      />

      <Dialog open={!!open} onClose={() => setOpen(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{requestTypes.find((r) => r.type === open)?.label}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Details" fullWidth multiline minRows={3} value={details} onChange={(e) => setDetails(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
