import { useEffect, useState } from "react";
import {
  Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Grid, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ErrorIcon from "@mui/icons-material/Error";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getFeeLedger } from "@/api/feeLedger";
import { getStudentById } from "@/demo-data/people/students";
import { programByDepartment } from "@/demo-data/academics/departmentSeeds";
import type { FeeLedgerEntry, FeeLedgerStatus } from "@/types";

function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

const programs = Object.values(programByDepartment);

export default function FeeLedger() {
  const { mode } = useColorMode();
  const [rows, setRows] = useState<FeeLedgerEntry[]>([]);
  const [programFilter, setProgramFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<FeeLedgerStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getFeeLedger().then(setRows); }, []);

  const withStudent = rows.map((entry) => ({ entry, student: getStudentById(entry.studentId) })).filter((r) => !!r.student);

  const filtered = withStudent.filter(({ entry, student }) =>
    (programFilter === "all" || student!.program === programFilter) &&
    (statusFilter === "all" || entry.status === statusFilter) &&
    (search === "" || student!.name.toLowerCase().includes(search.toLowerCase()) || student!.rollNo.toLowerCase().includes(search.toLowerCase()))
  );

  const totalCollectible = rows.reduce((sum, e) => sum + e.totalFee, 0);
  const collected = rows.reduce((sum, e) => sum + e.paidAmount, 0);
  const pending = rows.filter((e) => e.status === "pending").reduce((sum, e) => sum + e.balance, 0);
  const overdue = rows.filter((e) => e.status === "overdue").reduce((sum, e) => sum + e.balance, 0);

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Student Fee Ledger"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Exporting Fee Ledger Report... Download will start shortly.")}>Export Report</Button>
            <Button variant="contained" onClick={() => setSnackbar("Opening payment form...")}>Record Payment</Button>
          </Stack>
        }
      />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Collectible" icon={<AccountBalanceWalletIcon />} color={getIconAccent(mode, "collectible")} value={formatINR(totalCollectible)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Collected" icon={<CheckCircleIcon />} color={getIconAccent(mode, "collected")} value={formatINR(collected)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Pending" icon={<ScheduleIcon />} color={getIconAccent(mode, "pending")} value={formatINR(pending)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Overdue" icon={<ErrorIcon />} color={getIconAccent(mode, "overdue")} value={formatINR(overdue)} />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Program</InputLabel>
          <Select label="Program" value={programFilter} onChange={(e: SelectChangeEvent) => setProgramFilter(e.target.value)}>
            <MenuItem value="all">All Programs</MenuItem>
            {programs.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select<FeeLedgerStatus | "all"> label="Status" value={statusFilter} onChange={(e: SelectChangeEvent<FeeLedgerStatus | "all">) => setStatusFilter(e.target.value as FeeLedgerStatus | "all")}>
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="overdue">Overdue</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Search by student name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 260 }} />
      </Stack>

      <DataTable<{ entry: FeeLedgerEntry; student: ReturnType<typeof getStudentById> }>
        pagination
        columns={[
          { key: "rollNo", label: "Roll No", render: (row) => row.student!.rollNo },
          { key: "name", label: "Student Name", render: (row) => row.student!.name },
          { key: "program", label: "Program", render: (row) => row.student!.program },
          { key: "total", label: "Total Fee", render: (row) => formatINR(row.entry.totalFee) },
          { key: "paid", label: "Paid", render: (row) => formatINR(row.entry.paidAmount) },
          { key: "balance", label: "Balance", render: (row) => formatINR(row.entry.balance) },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.entry.status} /> },
          {
            key: "actions", label: "Actions",
            render: () => <Button size="small" onClick={(e) => { e.stopPropagation(); setSnackbar("Loading student ledger..."); }}>View Ledger</Button>,
          },
        ]}
        rows={filtered}
        emptyTitle="No fee ledger entries found"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
