import { useEffect, useState } from "react";
import { Button, Grid, Paper, Stack, Typography, Snackbar } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getFeeSummary, getPaymentTransactions, makePayment } from "@/api/studentFees";
import type { FeeSemesterRow, PaymentTransaction } from "@/types";

export default function Payments() {
  const { mode } = useColorMode();
  const [fees, setFees] = useState<FeeSemesterRow[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => {
    getFeeSummary().then(setFees);
    getPaymentTransactions().then(setTransactions);
  };
  useEffect(() => { load(); }, []);

  const upcoming = fees.filter((f) => f.status !== "paid");
  const totalPaid = transactions.reduce((s, t) => s + t.amount, 0);
  const pending = fees.reduce((s, f) => s + (f.totalFee - f.paid), 0);

  const handlePay = (row: FeeSemesterRow) => {
    const amount = row.totalFee - row.paid;
    makePayment(row.semester, amount, `Semester ${row.semester} Fee`).then(() => { load(); setSnackbar(`Payment of ₹${amount.toLocaleString("en-IN")} successful`); });
  };

  return (
    <>
      <PageHeader eyebrow="Finance" title="Payments" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Total Paid" icon={<AccountBalanceWalletIcon />} color={getIconAccent(mode, "total-paid")} formatValue={(n) => `₹${n.toLocaleString("en-IN")}`} numericValue={totalPaid} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Pending Dues" icon={<ReceiptIcon />} color={getIconAccent(mode, "pending-dues")} formatValue={(n) => `₹${n.toLocaleString("en-IN")}`} numericValue={pending} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Transactions" icon={<ReceiptLongIcon />} color={getIconAccent(mode, "transactions")} numericValue={transactions.length} />
        </Grid>
      </Grid>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Payment History</Typography>
          <DataTable<PaymentTransaction>
            pagination
            columns={[
              { key: "description", label: "Description" },
              { key: "id", label: "Transaction ID" },
              { key: "amount", label: "Amount", render: (row) => `₹${row.amount.toLocaleString("en-IN")}` },
              { key: "date", label: "Date" },
              { key: "mode", label: "Mode" },
              { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
            ]}
            rows={transactions}
            emptyTitle="No transactions yet"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Upcoming Payments</Typography>
          <Stack spacing={2}>
            {upcoming.length === 0 && <Typography variant="body2" color="text.secondary">No pending payments.</Typography>}
            {upcoming.map((row) => (
              <Paper key={row.semester} elevation={0} sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={600}>Semester {row.semester} Fee</Typography>
                <Typography variant="body2" color="text.secondary">Due {row.dueDate}</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>₹{(row.totalFee - row.paid).toLocaleString("en-IN")}</Typography>
                <Button variant="contained" sx={{ mt: 1.5 }} onClick={() => handlePay(row)}>Pay Now</Button>
              </Paper>
            ))}
          </Stack>
        </Grid>
      </Grid>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
