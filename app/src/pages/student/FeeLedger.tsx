import { useEffect, useState } from "react";
import { Button, Paper, Stack, Typography, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { getFeeLedger } from "@/api/studentFees";
import { getStudentProfile } from "@/api/studentProfile";
import type { StudentFeeLedgerEntry, StudentProfile } from "@/types";

export default function FeeLedger() {
  const [entries, setEntries] = useState<StudentFeeLedgerEntry[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    getFeeLedger().then(setEntries);
    getStudentProfile().then(setProfile);
  }, []);

  return (
    <>
      <PageHeader eyebrow="Finance" title="Fee Ledger" />
      {profile && (
        <Paper elevation={0} sx={{ p: 2.5, mb: 2.5 }}>
          <Stack direction="row" spacing={4}>
            <Typography variant="body2"><strong>{profile.name}</strong> · {profile.rollNo}</Typography>
            <Typography variant="body2" color="text.secondary">{profile.program} · {profile.batch}</Typography>
          </Stack>
        </Paper>
      )}
      <DataTable<StudentFeeLedgerEntry>
        columns={[
          { key: "date", label: "Date" },
          { key: "particulars", label: "Particulars" },
          { key: "debit", label: "Debit", render: (row) => (row.debit > 0 ? `₹${row.debit.toLocaleString("en-IN")}` : "—") },
          { key: "credit", label: "Credit", render: (row) => (row.credit > 0 ? `₹${row.credit.toLocaleString("en-IN")}` : "—") },
          { key: "balance", label: "Balance", render: (row) => `₹${row.balance.toLocaleString("en-IN")}` },
        ]}
        rows={entries}
        emptyTitle="No ledger entries found"
      />
      <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={() => setSnackbar("Ledger download is not available in this demo")}>Download Ledger</Button>
        <Button variant="outlined" onClick={() => setSnackbar("Fee Clearance Certificate request submitted")}>Request Fee Clearance Certificate</Button>
      </Stack>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
