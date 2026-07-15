import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Snackbar, Stack, TextField } from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getFeeSummary } from "@/api/studentFees";
import type { FeeSemesterRow } from "@/types";

export default function FeeSummary() {
  const { mode } = useColorMode();
  const navigate = useNavigate();
  const [rows, setRows] = useState<FeeSemesterRow[]>([]);
  const [clearanceOpen, setClearanceOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getFeeSummary().then(setRows); }, []);

  const totalPaid = rows.reduce((s, r) => s + r.paid, 0);
  const pending = rows.reduce((s, r) => s + (r.totalFee - r.paid), 0);
  const current = rows[rows.length - 1];

  const handleClearanceSubmit = () => {
    setClearanceOpen(false);
    setReason("");
    setSnackbar("Fee Clearance Certificate request submitted");
  };

  return (
    <>
      <PageHeader eyebrow="Finance" title="Fee Summary" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Current Semester" icon={<PaymentIcon />} color={getIconAccent(mode, "current-fee")} value={current ? (current.status === "paid" ? "PAID" : "PENDING") : "-"} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Total Paid" icon={<AccountBalanceWalletIcon />} color={getIconAccent(mode, "total-paid")} formatValue={(n) => `₹${n.toLocaleString("en-IN")}`} numericValue={totalPaid} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Pending Dues" icon={<ReceiptIcon />} color={getIconAccent(mode, "pending-dues")} formatValue={(n) => `₹${n.toLocaleString("en-IN")}`} numericValue={pending} />
        </Grid>
      </Grid>
      <DataTable<FeeSemesterRow>
        columns={[
          { key: "semester", label: "Semester", render: (row) => `Semester ${row.semester}` },
          { key: "year", label: "Year" },
          { key: "totalFee", label: "Total Fee", render: (row) => `₹${row.totalFee.toLocaleString("en-IN")}` },
          { key: "paid", label: "Paid", render: (row) => `₹${row.paid.toLocaleString("en-IN")}` },
          { key: "dueDate", label: "Due Date" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          { key: "actions", label: "Action", render: () => <Button size="small" onClick={() => setSnackbar("Receipt download is not available in this demo")}>Receipt</Button> },
        ]}
        rows={rows}
        emptyTitle="No fee records found"
      />
      <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
        <Button variant="contained" onClick={() => navigate("/student/fees/payments")}>Make a Payment</Button>
        <Button variant="outlined" onClick={() => setSnackbar("Statement download is not available in this demo")}>Download Statement</Button>
        <Button variant="outlined" onClick={() => setClearanceOpen(true)}>Request Fee Clearance Certificate</Button>
      </Stack>

      <Dialog open={clearanceOpen} onClose={() => setClearanceOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Fee Clearance Certificate</DialogTitle>
        <DialogContent>
          <TextField label="Purpose" fullWidth multiline minRows={2} sx={{ mt: 1 }} value={reason} onChange={(e) => setReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearanceOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleClearanceSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
