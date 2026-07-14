import { useEffect, useState } from "react";
import {
  Box, Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getPayments } from "@/api/payments";
import { getStudentById } from "@/demo-data/people/students";
import type { Payment, PaymentMode } from "@/types";

function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function Payments() {
  const [rows, setRows] = useState<Payment[]>([]);
  const [modeFilter, setModeFilter] = useState<PaymentMode | "all">("all");
  const [search, setSearch] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getPayments().then(setRows); }, []);

  const filtered = rows.filter((p) => {
    const student = getStudentById(p.studentId);
    return (modeFilter === "all" || p.mode === modeFilter) &&
      (search === "" || !student || student.name.toLowerCase().includes(search.toLowerCase()) || student.rollNo.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Payments & Waivers"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Exporting Payment Records... Download will start shortly.")}>Export</Button>
            <Button variant="contained" onClick={() => setSnackbar("Opening payment form...")}>Record Payment</Button>
          </Stack>
        }
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Payment management includes recording online and offline payments, payment gateway
        integration, receipt generation and printing, refund processing, scholarship and
        waiver management, and payment reminders and notifications.
      </Typography>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Payment Mode</InputLabel>
          <Select<PaymentMode | "all"> label="Payment Mode" value={modeFilter} onChange={(e: SelectChangeEvent<PaymentMode | "all">) => setModeFilter(e.target.value as PaymentMode | "all")}>
            <MenuItem value="all">All Payment Modes</MenuItem>
            <MenuItem value="online">Online</MenuItem>
            <MenuItem value="cash">Cash</MenuItem>
            <MenuItem value="cheque">Cheque</MenuItem>
            <MenuItem value="dd">DD</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Search payments..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 260 }} />
      </Stack>

      <DataTable<Payment>
        pagination
        columns={[
          { key: "id", label: "Receipt No" },
          { key: "date", label: "Date" },
          {
            key: "student", label: "Student",
            render: (row) => {
              const student = getStudentById(row.studentId);
              return (
                <Box>
                  <Typography variant="body2">{student?.name ?? row.studentId}</Typography>
                  <Typography variant="caption" color="text.secondary">{student?.rollNo}</Typography>
                </Box>
              );
            },
          },
          { key: "amount", label: "Amount", render: (row) => formatINR(row.amount) },
          { key: "mode", label: "Mode", render: (row) => row.mode.toUpperCase() },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          {
            key: "actions", label: "Actions",
            render: () => (
              <Stack direction="row" spacing={0.5}>
                <Button size="small" onClick={(e) => { e.stopPropagation(); setSnackbar("Printing receipt..."); }}>Print</Button>
                <Button size="small" onClick={(e) => { e.stopPropagation(); setSnackbar("Loading payment details..."); }}>View</Button>
              </Stack>
            ),
          },
        ]}
        rows={filtered}
        emptyTitle="No payments found"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
