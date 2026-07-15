import { useEffect, useState } from "react";
import { Avatar, Button, Grid, Paper, Stack, TextField, Typography, Snackbar } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ClassIcon from "@mui/icons-material/Class";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getStudentProfile, updateStudentProfile } from "@/api/studentProfile";
import type { StudentProfile } from "@/types";

export default function Profile() {
  const { mode } = useColorMode();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [form, setForm] = useState({ mobile: "", personalEmail: "", address: "" });
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    getStudentProfile().then((p) => { setProfile(p); setForm({ mobile: p.mobile, personalEmail: p.personalEmail, address: p.address }); });
  }, []);

  const handleSave = () => {
    updateStudentProfile(form).then((p) => { setProfile(p); setSnackbar("Profile updated successfully"); });
  };

  if (!profile) return null;

  return (
    <>
      <PageHeader eyebrow="My Profile" title={profile.name} />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="CGPA" icon={<TrendingUpIcon />} color={getIconAccent(mode, "cgpa")} value={profile.cgpa.toFixed(2)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Current Semester" icon={<EventNoteIcon />} color={getIconAccent(mode, "semester")} numericValue={profile.currentSemester} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Credits Earned" icon={<ClassIcon />} color={getIconAccent(mode, "credits")} numericValue={profile.creditsEarned} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Status" icon={<CheckCircleIcon />} color={getIconAccent(mode, "status")} value={profile.status === "active" ? "Active" : "Inactive"} />
        </Grid>
      </Grid>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, textAlign: "center" }}>
            <Avatar sx={{ width: 72, height: 72, mx: "auto", mb: 2, fontSize: 28, fontWeight: 700 }}>{profile.name.charAt(0)}</Avatar>
            <Typography variant="subtitle1" fontWeight={600}>{profile.name}</Typography>
            <Typography variant="body2" color="text.secondary">{profile.rollNo}</Typography>
            <Button size="small" sx={{ mt: 1.5 }} onClick={() => setSnackbar("Profile PDF download is not available in this demo")}>Download Profile</Button>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Personal Information</Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="College Email" fullWidth value={profile.collegeEmail} disabled /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Date of Birth" fullWidth value={profile.dob} disabled /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Personal Email" fullWidth value={form.personalEmail} onChange={(e) => setForm({ ...form, personalEmail: e.target.value })} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Mobile" fullWidth value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></Grid>
              <Grid size={12}><TextField label="Address" fullWidth multiline minRows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Grid>
            </Grid>

            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, mt: 3 }}>Academic Information</Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Program" fullWidth value={profile.program} disabled /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Branch" fullWidth value={profile.branch} disabled /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Batch" fullWidth value={profile.batch} disabled /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Admission Date" fullWidth value={profile.admissionDate} disabled /></Grid>
            </Grid>

            <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
              <Button variant="contained" onClick={handleSave}>Save Changes</Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
