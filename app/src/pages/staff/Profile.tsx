import { useEffect, useState } from "react";
import { Avatar, Button, Grid, Paper, Stack, TextField, Typography, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { useStaffRole } from "@/context/StaffRoleContext";
import { getCurrentStaffProfile, updateCurrentStaffProfile } from "@/api/staffProfile";
import type { StaffProfile } from "@/types";

export default function Profile() {
  const { role } = useStaffRole();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getCurrentStaffProfile(role).then(setProfile); }, [role]);

  const handleSave = () => {
    if (!profile) return;
    updateCurrentStaffProfile(role, profile).then((p) => { setProfile(p); setSnackbar("Profile updated successfully"); });
  };

  if (!profile) return null;

  return (
    <>
      <PageHeader eyebrow={role === "assigner" ? "Assigner" : "Executor"} title="My Profile" />
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, textAlign: "center" }}>
            <Avatar sx={{ width: 72, height: 72, mx: "auto", mb: 2, fontSize: 28, fontWeight: 700 }}>{profile.name.charAt(0)}</Avatar>
            <Typography variant="subtitle1" fontWeight={600}>{profile.name}</Typography>
            <Typography variant="body2" color="text.secondary">{role === "assigner" ? "Assigner / Operations" : "Executor"}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Full Name" fullWidth value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Email" fullWidth value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Department" fullWidth value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Phone" fullWidth value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Grid>
            </Grid>
            <Stack direction="row" sx={{ mt: 2.5 }}>
              <Button variant="contained" onClick={handleSave}>Save Changes</Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
