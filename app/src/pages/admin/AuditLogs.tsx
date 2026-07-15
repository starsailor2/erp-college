import { useEffect, useMemo, useState } from "react";
import {
  Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getAuditLogs } from "@/api/auditLogs";
import type { AuditLogEntry } from "@/types";

const modules = ["Authentication", "Academics", "Finance", "Operations", "System"];

export default function AuditLogs() {
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getAuditLogs().then(setRows); }, []);

  const users = useMemo(() => Array.from(new Set(rows.map((r) => r.actorEmail))).sort(), [rows]);

  const filtered = rows.filter((r) =>
    (moduleFilter === "all" || r.module === moduleFilter) &&
    (userFilter === "all" || r.actorEmail === userFilter) &&
    (dateFilter === "" || r.timestamp.startsWith(dateFilter)) &&
    (search === "" || r.action.toLowerCase().includes(search.toLowerCase()) || r.actorEmail.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="System Audit Logs"
        action={<Button variant="outlined" onClick={() => setSnackbar("Exporting Audit Logs... Download will start shortly.")}>Export Logs</Button>}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Audit logs track all system activities for security and compliance: user login/logout
        activities, data modifications and deletions, permission changes, financial transactions,
        system configuration changes, and failed access attempts.
      </Typography>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Module</InputLabel>
          <Select label="Module" value={moduleFilter} onChange={(e: SelectChangeEvent) => setModuleFilter(e.target.value)}>
            <MenuItem value="all">All Modules</MenuItem>
            {modules.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>User</InputLabel>
          <Select label="User" value={userFilter} onChange={(e: SelectChangeEvent) => setUserFilter(e.target.value)}>
            <MenuItem value="all">All Users</MenuItem>
            {users.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} sx={{ minWidth: 160 }} />
        <TextField size="small" placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 220 }} />
      </Stack>

      <DataTable<AuditLogEntry>
        pagination
        columns={[
          { key: "timestamp", label: "Timestamp" },
          { key: "actorEmail", label: "User" },
          { key: "action", label: "Action" },
          { key: "module", label: "Module" },
          { key: "ipAddress", label: "IP Address" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={filtered}
        emptyTitle="No audit log entries found"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
