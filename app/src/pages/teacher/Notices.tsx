import { useEffect, useState } from "react";
import { Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Paper, Grid, Snackbar, type SelectChangeEvent } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { getTeacherNotices, addTeacherNotice } from "@/api/teacherNotices";
import type { TeacherNotice, TeacherNoticeAudience } from "@/types";

const audienceLabels: Record<TeacherNoticeAudience, string> = { my_courses: "My Courses", department: "Department", institute: "Institute-wide" };
const emptyForm = { title: "", content: "", audience: "my_courses" as TeacherNoticeAudience, priority: "normal" as TeacherNotice["priority"], expiryDate: "" };

export default function Notices() {
  const [rows, setRows] = useState<TeacherNotice[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getTeacherNotices().then(setRows);
  useEffect(() => { load(); }, []);

  const handlePublish = () => {
    addTeacherNotice({ ...form, id: `TNOT-${Date.now()}`, publishedDate: new Date().toISOString().slice(0, 10), views: 0 }).then(() => {
      load(); setForm(emptyForm); setSnackbar("Notice published successfully!");
    });
  };

  return (
    <>
      <PageHeader eyebrow="Communication" title="Notices & Announcements" />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>New Notice</Typography>
        <Grid container spacing={2.5}>
          <Grid size={12}><TextField label="Title" fullWidth value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Grid>
          <Grid size={12}><TextField label="Content" fullWidth multiline minRows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Audience</InputLabel>
              <Select label="Audience" value={form.audience} onChange={(e: SelectChangeEvent) => setForm({ ...form, audience: e.target.value as TeacherNoticeAudience })}>
                <MenuItem value="my_courses">My Courses</MenuItem>
                <MenuItem value="department">Department</MenuItem>
                <MenuItem value="institute">Institute-wide</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select label="Priority" value={form.priority} onChange={(e: SelectChangeEvent) => setForm({ ...form, priority: e.target.value as TeacherNotice["priority"] })}>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Expiry Date" type="date" fullWidth value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
        </Grid>
        <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
          <Button variant="contained" onClick={handlePublish}>Publish Notice</Button>
          <Button variant="outlined" onClick={() => setSnackbar("Saved as draft")}>Save as Draft</Button>
        </Stack>
      </Paper>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Published Notices</Typography>
      <DataTable<TeacherNotice>
        pagination
        columns={[
          { key: "title", label: "Title" },
          { key: "publishedDate", label: "Date" },
          { key: "audience", label: "Audience", render: (row) => audienceLabels[row.audience] },
          { key: "views", label: "Views" },
          { key: "actions", label: "Action", render: () => <Button size="small" onClick={() => setSnackbar("Opening notice editor...")}>Edit</Button> },
        ]}
        rows={rows}
        emptyTitle="No notices published"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
