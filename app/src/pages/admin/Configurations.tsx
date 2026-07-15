import { useEffect, useState } from "react";
import {
  Box, Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Paper, Grid, Switch, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { getSystemConfig, saveSystemConfig, resetSystemConfig } from "@/api/systemConfig";
import type { SystemConfig } from "@/types";

const academicYears = ["2026-2027", "2025-2026", "2024-2025"];
const terms = ["Odd Semester", "Even Semester", "Summer Term"];

export default function Configurations() {
  const [form, setForm] = useState<SystemConfig | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getSystemConfig().then(setForm); }, []);

  const handleSave = () => {
    if (!form) return;
    saveSystemConfig(form).then(() => setSnackbar("Configuration saved successfully!"));
  };
  const handleReset = () => {
    resetSystemConfig().then((data) => { setForm(data); setSnackbar("Reset to default configuration"); });
  };

  if (!form) return null;

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="System Configurations"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={handleReset}>Reset Defaults</Button>
            <Button variant="contained" onClick={handleSave}>Save Changes</Button>
          </Stack>
        }
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Configure global system settings and parameters: institution details and branding,
        academic calendar settings, user roles and permissions, email and notification templates,
        payment gateway configuration, and backup and security settings.
      </Typography>

      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Institution Details</Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Institution Name" fullWidth value={form.institutionName} onChange={(e) => setForm({ ...form, institutionName: e.target.value })} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Institution Code" fullWidth value={form.institutionCode} onChange={(e) => setForm({ ...form, institutionCode: e.target.value })} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Email" fullWidth value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Phone" fullWidth value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Academic Settings</Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Current Academic Year</InputLabel>
              <Select label="Current Academic Year" value={form.academicYear} onChange={(e: SelectChangeEvent) => setForm({ ...form, academicYear: e.target.value })}>
                {academicYears.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Current Term</InputLabel>
              <Select label="Current Term" value={form.currentTerm} onChange={(e: SelectChangeEvent) => setForm({ ...form, currentTerm: e.target.value })}>
                {terms.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Minimum Attendance %" type="number" fullWidth value={form.minAttendancePct} onChange={(e) => setForm({ ...form, minAttendancePct: Number(e.target.value) })} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Passing Grade" fullWidth value={form.passingGrade} onChange={(e) => setForm({ ...form, passingGrade: e.target.value })} /></Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>System Preferences</Typography>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2" fontWeight={600}>Email Notifications</Typography>
              <Typography variant="caption" color="text.secondary">Send automated email notifications to users</Typography>
            </Box>
            <Switch checked={form.emailNotifications} onChange={(e) => setForm({ ...form, emailNotifications: e.target.checked })} />
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2" fontWeight={600}>SMS Notifications</Typography>
              <Typography variant="caption" color="text.secondary">Send SMS for critical updates</Typography>
            </Box>
            <Switch checked={form.smsNotifications} onChange={(e) => setForm({ ...form, smsNotifications: e.target.checked })} />
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2" fontWeight={600}>Two-Factor Authentication</Typography>
              <Typography variant="caption" color="text.secondary">Require 2FA for admin accounts</Typography>
            </Box>
            <Switch checked={form.twoFactorAuth} onChange={(e) => setForm({ ...form, twoFactorAuth: e.target.checked })} />
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2" fontWeight={600}>Auto Backup</Typography>
              <Typography variant="caption" color="text.secondary">Automatic daily database backup at 2:00 AM</Typography>
            </Box>
            <Switch checked={form.autoBackup} onChange={(e) => setForm({ ...form, autoBackup: e.target.checked })} />
          </Stack>
        </Stack>
      </Paper>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
