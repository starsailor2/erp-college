import { useEffect, useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography, Snackbar, type SelectChangeEvent } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getHostelRequests, submitHostelRequest, getMealPlan, updateMealPlan } from "@/api/studentHostel";
import type { HostelRequest, HostelRequestType } from "@/types";

const requestTypeLabels: Record<HostelRequestType, string> = {
  room_change: "Room Change",
  maintenance: "Maintenance",
  leave: "Leave Application",
  visitor_pass: "Visitor Pass",
  lost_item: "Lost Item Report",
};

export default function Hostel() {
  const [requests, setRequests] = useState<HostelRequest[]>([]);
  const [mealPlan, setMealPlan] = useState("Standard");
  const [formOpen, setFormOpen] = useState<HostelRequestType | null>(null);
  const [details, setDetails] = useState("");
  const [selected, setSelected] = useState<HostelRequest | null>(null);
  const [mealDialogOpen, setMealDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getHostelRequests().then(setRequests);
  useEffect(() => { load(); getMealPlan().then(setMealPlan); }, []);

  const pendingCount = requests.filter((r) => r.status === "pending" || r.status === "in_progress").length;

  const handleSubmitRequest = () => {
    if (!formOpen || !details) { setSnackbar("Please describe your request"); return; }
    submitHostelRequest(formOpen, details).then(() => { load(); setFormOpen(null); setDetails(""); setSnackbar("Request submitted"); });
  };

  const handleSaveMealPlan = (plan: string) => updateMealPlan(plan).then(() => { setMealPlan(plan); setMealDialogOpen(false); setSnackbar("Meal plan updated"); });

  return (
    <>
      <PageHeader eyebrow="Hostel & Mess" title="Hostel & Mess" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 3 }}><Paper elevation={0} sx={{ p: 2.5 }}><Typography variant="caption" color="text.secondary">Room</Typography><Typography variant="h6" fontWeight={700}>A-205</Typography></Paper></Grid>
        <Grid size={{ xs: 12, sm: 3 }}><Paper elevation={0} sx={{ p: 2.5 }}><Typography variant="caption" color="text.secondary">Mess Balance</Typography><Typography variant="h6" fontWeight={700}>₹2,350</Typography></Paper></Grid>
        <Grid size={{ xs: 12, sm: 3 }}><Paper elevation={0} sx={{ p: 2.5 }}><Typography variant="caption" color="text.secondary">Pending Requests</Typography><Typography variant="h6" fontWeight={700}>{pendingCount}</Typography></Paper></Grid>
        <Grid size={{ xs: 12, sm: 3 }}><Paper elevation={0} sx={{ p: 2.5 }}><Typography variant="caption" color="text.secondary">Hostel Score</Typography><Typography variant="h6" fontWeight={700}>8.5/10</Typography></Paper></Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ p: 3, mb: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Mess Details</Typography>
            <Typography variant="body2">Current Plan: <strong>{mealPlan}</strong></Typography>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1} sx={{ mt: 1.5 }}>
              <Button variant="outlined" onClick={() => setMealDialogOpen(true)}>Change Meal Plan</Button>
              <Button variant="outlined" onClick={() => setSnackbar("Mess menu preview is not available in this demo")}>View Mess Menu</Button>
              <Button variant="outlined" onClick={() => setSnackbar("Mess bill download is not available in this demo")}>Download Mess Bill</Button>
            </Stack>
          </Paper>

          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Quick Actions</Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1} sx={{ mb: 2.5 }}>
            {(Object.keys(requestTypeLabels) as HostelRequestType[]).map((type) => (
              <Button key={type} variant="outlined" onClick={() => setFormOpen(type)}>{requestTypeLabels[type]}</Button>
            ))}
            <Button variant="outlined" onClick={() => setSnackbar("Room photos preview is not available in this demo")}>View Room Photos</Button>
            <Button variant="outlined" onClick={() => setSnackbar("Hostel rules download is not available in this demo")}>Download Hostel Rules</Button>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Active Requests</Typography>
          <DataTable<HostelRequest>
            columns={[
              { key: "type", label: "Type", render: (row) => requestTypeLabels[row.type] },
              { key: "submittedOn", label: "Submitted" },
              { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
              { key: "actions", label: "Action", render: (row) => <Button size="small" onClick={() => setSelected(row)}>Track</Button> },
            ]}
            rows={requests}
            emptyTitle="No hostel requests found"
          />
        </Grid>
      </Grid>

      <Dialog open={!!formOpen} onClose={() => setFormOpen(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{formOpen ? requestTypeLabels[formOpen] : ""}</DialogTitle>
        <DialogContent>
          <TextField label="Details" fullWidth multiline minRows={3} sx={{ mt: 1 }} value={details} onChange={(e) => setDetails(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitRequest}>Submit</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Request {selected?.id} — {selected ? requestTypeLabels[selected.type] : ""}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{selected?.details}</Typography>
          <Stack spacing={1}>
            {selected?.timeline.map((entry, i) => (
              <Stack key={i} direction="row" spacing={1.5}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>{entry.time}</Typography>
                <Typography variant="body2">{entry.action}</Typography>
              </Stack>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setSelected(null)}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={mealDialogOpen} onClose={() => setMealDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Meal Plan</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Meal Plan</InputLabel>
            <Select label="Meal Plan" value={mealPlan} onChange={(e: SelectChangeEvent) => setMealPlan(e.target.value)}>
              <MenuItem value="Standard">Standard</MenuItem>
              <MenuItem value="Vegetarian">Vegetarian</MenuItem>
              <MenuItem value="Jain">Jain</MenuItem>
              <MenuItem value="No Mess">No Mess</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMealDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => handleSaveMealPlan(mealPlan)}>Save</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
