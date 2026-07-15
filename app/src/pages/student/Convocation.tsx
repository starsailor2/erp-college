import { useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Stack, TextField, Typography, Paper, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";

const eligibility = [
  { criteria: "Minimum CGPA of 6.0", status: "approved" },
  { criteria: "No pending backlogs", status: "approved" },
  { criteria: "No disciplinary action", status: "approved" },
  { criteria: "Fee clearance", status: "pending" },
];

export default function Convocation() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const handleSubmit = () => {
    setOpen(false);
    setReason("");
    setSnackbar("Provisional Certificate request submitted");
  };

  return (
    <>
      <PageHeader eyebrow="Convocation" title="Convocation" />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600}>Convocation Status</Typography>
        <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>PENDING</Typography>
        <Typography variant="body2" color="text.secondary">Expected convocation: May 2027</Typography>
      </Paper>
      <DataTable
        title="Eligibility Criteria"
        columns={[
          { key: "criteria", label: "Criteria" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={eligibility}
        emptyTitle="No eligibility data found"
      />
      <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
        <Button variant="contained" onClick={() => setOpen(true)}>Request Provisional Certificate</Button>
        <Button variant="outlined" onClick={() => setSnackbar("Convocation guidelines download is not available in this demo")}>Download Guidelines</Button>
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Provisional Certificate</DialogTitle>
        <DialogContent>
          <TextField label="Purpose" fullWidth multiline minRows={2} sx={{ mt: 1 }} value={reason} onChange={(e) => setReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
