import { useEffect, useState } from "react";
import { Button, Grid, Paper, Stack, Typography, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { getStudentProfile } from "@/api/studentProfile";
import type { StudentProfile } from "@/types";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.75, borderBottom: 1, borderColor: "divider" }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={600}>{value}</Typography>
    </Stack>
  );
}

export default function Identity() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getStudentProfile().then(setProfile); }, []);

  if (!profile) return null;

  const stub = (label: string) => setSnackbar(`${label} is not available in this demo`);

  return (
    <>
      <PageHeader eyebrow="Identity" title="Identity & Records" />
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ p: 3, mb: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Contact Information</Typography>
            <InfoRow label="Personal Email" value={profile.personalEmail} />
            <InfoRow label="College Email" value={profile.collegeEmail} />
            <InfoRow label="Mobile" value={profile.mobile} />
            <InfoRow label="Date of Birth" value={profile.dob} />
            <InfoRow label="Blood Group" value={profile.bloodGroup} />
            <InfoRow label="Father's Name" value={profile.fatherName} />
          </Paper>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Address Information</Typography>
            <InfoRow label="Current Address" value={profile.address} />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, mb: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Quick Downloads</Typography>
            <Stack spacing={1}>
              <Button variant="outlined" onClick={() => stub("ID Card download")}>ID Card</Button>
              <Button variant="outlined" onClick={() => stub("Transcript download")}>Transcript</Button>
              <Button variant="outlined" onClick={() => stub("Enrollment Certificate download")}>Enrollment Certificate</Button>
            </Stack>
          </Paper>
          <Paper elevation={0} sx={{ p: 3, mb: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Document Requests</Typography>
            <Stack spacing={1}>
              <Button variant="outlined" onClick={() => stub("Bonafide Certificate request")}>Bonafide Certificate</Button>
              <Button variant="outlined" onClick={() => stub("Character Certificate request")}>Character Certificate</Button>
              <Button variant="outlined" onClick={() => stub("No-Dues Certificate request")}>No-Dues Certificate</Button>
            </Stack>
          </Paper>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Account Security</Typography>
            <Stack spacing={1}>
              <Button variant="outlined" onClick={() => stub("Change Password")}>Change Password</Button>
              <Button variant="outlined" onClick={() => stub("Update Security Questions")}>Update Security Questions</Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
