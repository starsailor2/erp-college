import { useEffect, useState } from "react";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, Typography, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { getFeeStructure, addFeeStructure, updateFeeStructure } from "@/api/feeStructure";
import { programByDepartment } from "@/demo-data/academics/departmentSeeds";
import type { FeeStructureItem } from "@/types";

function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

const programs = Object.values(programByDepartment);
const emptyForm = { program: programs[0], year: 1 as 1 | 2 | 3 | 4, tuitionFee: 0, hostelFee: 0, transportFee: 0, otherCharges: 0 };

export default function FeeStructure() {
  const [rows, setRows] = useState<FeeStructureItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getFeeStructure().then(setRows);
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (item: FeeStructureItem) => {
    setEditingId(item.id);
    setForm({ program: item.program, year: item.year, tuitionFee: item.tuitionFee, hostelFee: item.hostelFee, transportFee: item.transportFee, otherCharges: item.otherCharges });
    setDialogOpen(true);
  };

  const total = form.tuitionFee + form.hostelFee + form.transportFee + form.otherCharges;

  const handleSave = () => {
    if (editingId) {
      updateFeeStructure(editingId, { ...form, total }).then(load);
    } else {
      addFeeStructure({ id: `FEE-${String(rows.length + 1).padStart(3, "0")}`, ...form, total }).then(load);
    }
    setDialogOpen(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Fee Structure Management"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Exporting Fee Structure... Download will start shortly.")}>Export</Button>
            <Button variant="contained" onClick={openAdd}>Add Fee Structure</Button>
          </Stack>
        }
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Fee structure management includes defining fee components by program and year,
        setting tuition, hostel, transport, and other fees, configuring payment schedules
        and installments, managing late fee penalties, creating scholarship and waiver
        rules, and academic year-wise fee structures.
      </Typography>

      <DataTable<FeeStructureItem>
        pagination
        columns={[
          { key: "program", label: "Program" },
          { key: "year", label: "Year", render: (row) => `${row.year}${row.year === 1 ? "st" : row.year === 2 ? "nd" : row.year === 3 ? "rd" : "th"} Year` },
          { key: "tuitionFee", label: "Tuition Fee", render: (row) => formatINR(row.tuitionFee) },
          { key: "hostelFee", label: "Hostel Fee", render: (row) => formatINR(row.hostelFee) },
          { key: "transportFee", label: "Transport Fee", render: (row) => formatINR(row.transportFee) },
          { key: "otherCharges", label: "Other Charges", render: (row) => formatINR(row.otherCharges) },
          { key: "total", label: "Total", render: (row) => formatINR(row.total) },
          {
            key: "actions", label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={0.5}>
                <Button size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>Edit</Button>
                <Button size="small" onClick={(e) => { e.stopPropagation(); setSnackbar("Loading fee structure..."); }}>View</Button>
              </Stack>
            ),
          },
        ]}
        rows={rows}
        emptyTitle="No fee structures found"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Fee Structure" : "Add Fee Structure"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Program</InputLabel>
            <Select label="Program" value={form.program} onChange={(e: SelectChangeEvent) => setForm({ ...form, program: e.target.value })}>
              {programs.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Year</InputLabel>
            <Select<1 | 2 | 3 | 4> label="Year" value={form.year} onChange={(e: SelectChangeEvent<1 | 2 | 3 | 4>) => setForm({ ...form, year: Number(e.target.value) as 1 | 2 | 3 | 4 })}>
              <MenuItem value={1}>1st Year</MenuItem>
              <MenuItem value={2}>2nd Year</MenuItem>
              <MenuItem value={3}>3rd Year</MenuItem>
              <MenuItem value={4}>4th Year</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Tuition Fee" type="number" placeholder="₹ 120000" value={form.tuitionFee} onChange={(e) => setForm({ ...form, tuitionFee: Number(e.target.value) })} fullWidth />
          <TextField label="Hostel Fee" type="number" placeholder="₹ 50000" value={form.hostelFee} onChange={(e) => setForm({ ...form, hostelFee: Number(e.target.value) })} fullWidth />
          <TextField label="Transport Fee" type="number" placeholder="₹ 15000" value={form.transportFee} onChange={(e) => setForm({ ...form, transportFee: Number(e.target.value) })} fullWidth />
          <TextField label="Other Charges" type="number" placeholder="₹ 5000" value={form.otherCharges} onChange={(e) => setForm({ ...form, otherCharges: Number(e.target.value) })} fullWidth />
          <Box>
            <Typography variant="caption" color="text.secondary">Total</Typography>
            <Typography variant="body1" fontWeight={700}>{formatINR(total)}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editingId ? "Save Changes" : "Add Fee Structure"}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
