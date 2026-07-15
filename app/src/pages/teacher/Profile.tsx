import { useEffect, useState } from "react";
import { Button, Grid, Paper, Stack, TextField, Typography, Snackbar, Avatar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { getTeacherProfile, updateTeacherProfile } from "@/api/teacherProfile";
import { getTeacherCourses } from "@/api/teacherCourses";
import type { TeacherProfile, TeacherCourse } from "@/types";

export default function Profile() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [form, setForm] = useState({ phone: "", office: "" });
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    getTeacherProfile().then((p) => { setProfile(p); setForm({ phone: p.phone, office: p.office }); });
    getTeacherCourses().then(setCourses);
  }, []);

  const handleSave = () => {
    updateTeacherProfile(form).then((p) => { setProfile(p); setSnackbar("Profile updated successfully"); });
  };

  if (!profile) return null;

  return (
    <>
      <PageHeader eyebrow="My Profile" title={profile.name} />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, textAlign: "center" }}>
            <Avatar sx={{ width: 72, height: 72, mx: "auto", mb: 2, fontSize: 28, fontWeight: 700 }}>{profile.name.charAt(0)}</Avatar>
            <Typography variant="subtitle1" fontWeight={600}>{profile.name}</Typography>
            <Typography variant="body2" color="text.secondary">{profile.facultyId}</Typography>
            <Button size="small" sx={{ mt: 1.5 }} onClick={() => setSnackbar("Photo upload is not available in this demo")}>Change Photo</Button>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Profile Details</Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Email" fullWidth value={profile.email} disabled /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Date of Joining" fullWidth value={profile.dateOfJoining} disabled /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Phone" fullWidth value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Office" fullWidth value={form.office} onChange={(e) => setForm({ ...form, office: e.target.value })} /></Grid>
              <Grid size={12}><TextField label="Qualifications" fullWidth value={profile.qualifications.join(", ")} disabled /></Grid>
              <Grid size={12}><TextField label="Specializations" fullWidth value={profile.specializations.join(", ")} disabled /></Grid>
            </Grid>
            <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
              <Button variant="contained" onClick={handleSave}>Save Changes</Button>
              {["Change Password", "Notification Preferences", "Privacy Settings"].map((label) => (
                <Button key={label} variant="outlined" onClick={() => setSnackbar(`${label} is not available in this demo`)}>{label}</Button>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Current Courses</Typography>
      <DataTable<TeacherCourse>
        columns={[
          { key: "name", label: "Course" },
          { key: "section", label: "Section" },
          { key: "studentIds", label: "Students", render: (row) => row.studentIds.length },
          { key: "avgAttendancePct", label: "Avg Attendance %", render: (row) => `${row.avgAttendancePct}%` },
          { key: "avgMarksPct", label: "Avg Marks %", render: (row) => `${row.avgMarksPct}%` },
        ]}
        rows={courses}
        emptyTitle="No courses assigned"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
