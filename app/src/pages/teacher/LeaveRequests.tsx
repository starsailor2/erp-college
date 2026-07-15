import { useEffect, useState } from "react";
import { Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Paper, Grid, Snackbar, type SelectChangeEvent } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getLeaveRequests, addLeaveRequest } from "@/api/teacherRequests";
import type { TeacherLeaveRequest } from "@/types";

const leaveTypes = ["Casual", "Medical", "Earned", "Academic"];
const emptyForm = { leaveType: leaveTypes[0], fromDate: "", toDate: "", reason: "", coverageArrangements: "" };

export default function LeaveRequests() {
  const [rows, setRows] = useState<TeacherLeaveRequest[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getLeaveRequests().then(setRows);
  useEffect(() => { load(); }, []);

  const handleSubmit = () => {
    addLeaveRequest(form).then(() => { load(); setForm(emptyForm); setSnackbar("Leave request submitted"); });
  };

  return (
    <>
      <PageHeader eyebrow="Requests" title="Leave Requests" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[["Casual", "8/12"], ["Medical", "5/10"], ["Earned", "12/20"], ["Academic", "2/5"]].map(([type, balance]) => (
          <Grid key={type} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">{type}</Typography>
              <Typography variant="h6" fontWeight={700}>{balance}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>New Leave Request</Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Leave Type</InputLabel>
              <Select label="Leave Type" value={form.leaveType} onChange={(e: SelectChangeEvent) => setForm({ ...form, leaveType: e.target.value })}>
                {leaveTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="From Date" type="date" fullWidth value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="To Date" type="date" fullWidth value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid size={12}><TextField label="Reason" fullWidth multiline minRows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Grid>
          <Grid size={12}><TextField label="Course Coverage Arrangements" fullWidth multiline minRows={2} value={form.coverageArrangements} onChange={(e) => setForm({ ...form, coverageArrangements: e.target.value })} /></Grid>
        </Grid>
        <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
          <Button variant="contained" onClick={handleSubmit}>Submit Request</Button>
          <Button variant="outlined" onClick={() => setForm(emptyForm)}>Cancel</Button>
        </Stack>
      </Paper>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Request History</Typography>
      <DataTable<TeacherLeaveRequest>
        pagination
        columns={[
          { key: "leaveType", label: "Type" },
          { key: "fromDate", label: "From" },
          { key: "toDate", label: "To" },
          { key: "raisedOn", label: "Raised On" },
          { key: "hodStatus", label: "HOD Status", render: (row) => <StatusChip status={row.hodStatus} /> },
          { key: "deanStatus", label: "Dean Status", render: (row) => row.deanStatus ? <StatusChip status={row.deanStatus} /> : "—" },
        ]}
        rows={rows}
        emptyTitle="No leave requests"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
