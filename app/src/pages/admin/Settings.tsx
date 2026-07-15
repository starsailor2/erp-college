import { useEffect, useState } from "react";
import {
  Box, Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Paper, Grid, Switch, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { useColorMode } from "@/context/ColorModeContext";
import { getAppSettings, saveAppSettings, resetAppSettings } from "@/api/appSettings";
import type { AppSettings } from "@/types";

const academicYears = ["2026-2027", "2025-2026", "2024-2025"];
const semesters = ["Odd Semester", "Even Semester"];
const languages = ["English", "Hindi", "Regional"];
const timezones = ["IST (UTC+5:30)", "UTC", "EST"];
const dateFormats = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
const timeFormats = ["12 Hour", "24 Hour"];

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Box>
        <Typography variant="body2" fontWeight={600}>{label}</Typography>
        <Typography variant="caption" color="text.secondary">{description}</Typography>
      </Box>
      <Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </Stack>
  );
}

export default function Settings() {
  const { mode, toggleColorMode } = useColorMode();
  const [form, setForm] = useState<AppSettings | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getAppSettings().then(setForm); }, []);

  const handleSave = () => {
    if (!form) return;
    saveAppSettings(form).then(() => setSnackbar("Settings saved successfully!"));
  };
  const handleReset = () => {
    resetAppSettings().then((data) => { setForm(data); setSnackbar("Settings reset to default"); });
  };

  if (!form) return null;

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Settings"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={handleReset}>Reset to Default</Button>
            <Button variant="contained" onClick={handleSave}>Save Settings</Button>
          </Stack>
        }
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Manage system settings and preferences</Typography>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Appearance Settings</Typography>
            <Stack spacing={2}>
              <ToggleRow label="Dark Mode" description="Switch between light and dark theme" checked={mode === "dark"} onChange={() => toggleColorMode()} />
              <ToggleRow label="Compact View" description="Use a more compact layout for tables" checked={form.compactView} onChange={(v) => setForm({ ...form, compactView: v })} />
              <ToggleRow label="Animations" description="Enable smooth animations and transitions" checked={form.animations} onChange={(v) => setForm({ ...form, animations: v })} />
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Notification Settings</Typography>
            <Stack spacing={2}>
              <ToggleRow label="Email Notifications" description="Receive email notifications for important updates" checked={form.emailNotifications} onChange={(v) => setForm({ ...form, emailNotifications: v })} />
              <ToggleRow label="SMS Notifications" description="Receive SMS alerts for urgent matters" checked={form.smsNotifications} onChange={(v) => setForm({ ...form, smsNotifications: v })} />
              <ToggleRow label="Push Notifications" description="Receive browser push notifications" checked={form.pushNotifications} onChange={(v) => setForm({ ...form, pushNotifications: v })} />
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 3, mb: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>General Settings</Typography>
        <Grid container spacing={2.5}>
          <Grid size={12}><TextField label="College Name" fullWidth value={form.collegeName} onChange={(e) => setForm({ ...form, collegeName: e.target.value })} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Academic Year</InputLabel>
              <Select label="Academic Year" value={form.academicYear} onChange={(e: SelectChangeEvent) => setForm({ ...form, academicYear: e.target.value })}>
                {academicYears.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Current Semester</InputLabel>
              <Select label="Current Semester" value={form.semester} onChange={(e: SelectChangeEvent) => setForm({ ...form, semester: e.target.value })}>
                {semesters.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Default Language</InputLabel>
              <Select label="Default Language" value={form.language} onChange={(e: SelectChangeEvent) => setForm({ ...form, language: e.target.value })}>
                {languages.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Timezone</InputLabel>
              <Select label="Timezone" value={form.timezone} onChange={(e: SelectChangeEvent) => setForm({ ...form, timezone: e.target.value })}>
                {timezones.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Date Format</InputLabel>
              <Select label="Date Format" value={form.dateFormat} onChange={(e: SelectChangeEvent) => setForm({ ...form, dateFormat: e.target.value })}>
                {dateFormats.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Time Format</InputLabel>
              <Select label="Time Format" value={form.timeFormat} onChange={(e: SelectChangeEvent) => setForm({ ...form, timeFormat: e.target.value })}>
                {timeFormats.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Security Settings</Typography>
            <Stack spacing={2}>
              <ToggleRow label="Two-Factor Authentication" description="Require 2FA for admin accounts" checked={form.twoFactorAuth} onChange={(v) => setForm({ ...form, twoFactorAuth: v })} />
              <ToggleRow label="Session Timeout" description="Auto logout after 30 minutes of inactivity" checked={form.sessionTimeout} onChange={(v) => setForm({ ...form, sessionTimeout: v })} />
              <ToggleRow label="Login Alerts" description="Get notified of new login attempts" checked={form.loginAlerts} onChange={(v) => setForm({ ...form, loginAlerts: v })} />
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Backup & Data</Typography>
            <Stack spacing={2}>
              <ToggleRow label="Auto Backup" description="Automatic daily database backup at 2:00 AM" checked={form.autoBackup} onChange={(v) => setForm({ ...form, autoBackup: v })} />
              <ToggleRow label="Data Retention" description="Keep logs for 90 days" checked={form.dataRetention} onChange={(v) => setForm({ ...form, dataRetention: v })} />
              <Button variant="outlined" fullWidth onClick={() => setSnackbar("Backup initiated...")}>Backup Now</Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
