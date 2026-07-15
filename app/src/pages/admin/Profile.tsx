import { useEffect, useState } from "react";
import { Box, Button, Stack, TextField, Typography, Paper, Grid, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getAdminProfile, saveAdminProfile } from "@/api/adminProfile";
import { getAuditLogs } from "@/api/auditLogs";
import type { AdminProfile, AuditLogEntry } from "@/types";

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export default function Profile() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [myActivity, setMyActivity] = useState<AuditLogEntry[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    getAdminProfile().then((data) => { setProfile(data); setForm({ name: data.name, email: data.email, phone: data.phone }); });
    getAuditLogs().then((data) => setMyActivity(data.filter((a) => a.actorEmail === "admin@kalnet.edu")));
  }, []);

  const handleSave = () => {
    saveAdminProfile(form).then((data) => { setProfile(data); setSnackbar("Profile updated successfully!"); });
  };

  if (!profile) return null;

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="My Profile"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Opening password change dialog...")}>Change Password</Button>
            <Button variant="contained" onClick={handleSave}>Save Changes</Button>
          </Stack>
        }
      />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, textAlign: "center" }}>
            <Box sx={{ width: 72, height: 72, borderRadius: "50%", bgcolor: "primary.main", color: "primary.contrastText", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, mx: "auto", mb: 2 }}>
              {initials(profile.name)}
            </Box>
            <Typography variant="h6" fontWeight={700}>{profile.name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{profile.role}</Typography>
            <Grid container spacing={2}>
              <Grid size={4}><Typography variant="h6" fontWeight={700}>{profile.actionsToday}</Typography><Typography variant="caption" color="text.secondary">Actions Today</Typography></Grid>
              <Grid size={4}><Typography variant="h6" fontWeight={700}>{(profile.totalActions / 1000).toFixed(1)}k</Typography><Typography variant="caption" color="text.secondary">Total Actions</Typography></Grid>
              <Grid size={4}><Typography variant="h6" fontWeight={700}>{profile.efficiencyPct}%</Typography><Typography variant="caption" color="text.secondary">Efficiency</Typography></Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Profile Information</Typography>
            <Stack spacing={2.5}>
              <TextField label="Full Name" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <TextField label="Email Address" fullWidth value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <TextField label="Phone Number" fullWidth value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <TextField label="Role" fullWidth value={profile.role} disabled />
              <TextField label="Department" fullWidth value={profile.department} disabled />
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Activity Log</Typography>
      <DataTable<AuditLogEntry>
        pagination
        columns={[
          { key: "action", label: "Action" },
          { key: "module", label: "Module" },
          { key: "timestamp", label: "Date & Time" },
          { key: "ipAddress", label: "IP Address" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={myActivity}
        emptyTitle="No activity found"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
