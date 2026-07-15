import { useEffect, useState } from "react";
import { Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Paper, Grid, Snackbar, type SelectChangeEvent } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getResourceRequests, addResourceRequest } from "@/api/teacherRequests";
import type { ResourceRequest } from "@/types";

function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

const resourceTypes = ["Lab Equipment", "Software License", "Books", "IT Infrastructure", "Other"];
const emptyForm = { resourceType: resourceTypes[0], description: "", justification: "", estimatedCost: 0, requiredBy: "" };

const availability = [
  { resource: "Laptops", available: "4/10", status: "Limited" },
  { resource: "MATLAB Licenses", available: "∞", status: "Available" },
  { resource: "Oscilloscopes", available: "2/5", status: "Limited" },
  { resource: "3D Printers", available: "1/3", status: "Limited" },
];

export default function ResourceRequests() {
  const [rows, setRows] = useState<ResourceRequest[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getResourceRequests().then(setRows);
  useEffect(() => { load(); }, []);

  const handleSubmit = () => {
    addResourceRequest(form).then(() => { load(); setForm(emptyForm); setSnackbar("Resource request submitted"); });
  };

  return (
    <>
      <PageHeader eyebrow="Requests" title="Resource Requests" />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>New Resource Request</Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Resource Type</InputLabel>
              <Select label="Resource Type" value={form.resourceType} onChange={(e: SelectChangeEvent) => setForm({ ...form, resourceType: e.target.value })}>
                {resourceTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Required By" type="date" fullWidth value={form.requiredBy} onChange={(e) => setForm({ ...form, requiredBy: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid size={12}><TextField label="Description" fullWidth multiline minRows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Grid>
          <Grid size={12}><TextField label="Justification" fullWidth multiline minRows={2} value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Estimated Cost (₹)" type="number" fullWidth value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: Number(e.target.value) })} /></Grid>
        </Grid>
        <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
          <Button variant="contained" onClick={handleSubmit}>Submit Request</Button>
          <Button variant="outlined" onClick={() => setForm(emptyForm)}>Cancel</Button>
        </Stack>
      </Paper>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Resource Availability</Typography>
      <DataTable
        columns={[
          { key: "resource", label: "Resource" },
          { key: "available", label: "Available" },
          { key: "status", label: "Status" },
        ]}
        rows={availability}
        emptyTitle="No data"
      />

      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 4, mb: 1.5 }}>Your Resource Requests</Typography>
      <DataTable<ResourceRequest>
        pagination
        columns={[
          { key: "description", label: "Resource" },
          { key: "resourceType", label: "Type" },
          { key: "estimatedCost", label: "Cost", render: (row) => formatINR(row.estimatedCost) },
          { key: "hodStatus", label: "HOD Status", render: (row) => <StatusChip status={row.hodStatus} /> },
          { key: "deanStatus", label: "Dean Status", render: (row) => row.deanStatus ? <StatusChip status={row.deanStatus} /> : "—" },
        ]}
        rows={rows}
        emptyTitle="No resource requests"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
