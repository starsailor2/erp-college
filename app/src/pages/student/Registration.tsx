import { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Grid, Paper, Stack, Tab, Tabs, TextField, Typography, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { getRegistrationCatalog, getRegisteredCourseCodes, registerCourse, dropCourse } from "@/api/studentCourses";
import type { CourseCategory, RegistrationCourse } from "@/types";

const tabs: { label: string; value: CourseCategory }[] = [
  { label: "Core", value: "core" },
  { label: "Electives", value: "elective" },
  { label: "Interdisciplinary", value: "interdisciplinary" },
  { label: "Minors", value: "minor" },
];

export default function Registration() {
  const [catalog, setCatalog] = useState<RegistrationCourse[]>([]);
  const [registered, setRegistered] = useState<string[]>([]);
  const [tab, setTab] = useState<CourseCategory>("core");
  const [search, setSearch] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => {
    getRegistrationCatalog().then(setCatalog);
    getRegisteredCourseCodes().then(setRegistered);
  };
  useEffect(() => { load(); }, []);

  const visible = useMemo(() => catalog.filter((c) => c.category === tab && (c.code.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()))), [catalog, tab, search]);
  const registeredCourses = catalog.filter((c) => registered.includes(c.code));
  const totalCredits = registeredCourses.reduce((s, c) => s + c.credits, 0);

  const handleRegister = (code: string) => registerCourse(code).then(() => { load(); setSnackbar(`Registered for ${code}`); });
  const handleDrop = (code: string) => dropCourse(code).then(() => { load(); setSnackbar(`Dropped ${code}`); });

  return (
    <>
      <PageHeader eyebrow="Academics" title="Course Registration" />
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <TextField fullWidth size="small" placeholder="Search courses by code or name" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ mb: 2 }} />
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            {tabs.map((t) => <Tab key={t.value} label={t.label} value={t.value} />)}
          </Tabs>
          <Grid container spacing={2}>
            {visible.map((c) => {
              const isRegistered = registered.includes(c.code);
              return (
                <Grid key={c.code} size={{ xs: 12, sm: 6 }}>
                  <Paper elevation={0} sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>{c.code} — {c.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{c.instructor} · {c.credits} credits · {c.seatsAvailable} seats</Typography>
                      </Box>
                      <Chip size="small" label={c.category} />
                    </Stack>
                    <Button
                      size="small"
                      sx={{ mt: 1.5 }}
                      variant={isRegistered ? "outlined" : "contained"}
                      color={isRegistered ? "error" : "primary"}
                      onClick={() => (isRegistered ? handleDrop(c.code) : handleRegister(c.code))}
                    >
                      {isRegistered ? "Drop" : "Register"}
                    </Button>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, mb: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Registration Summary</Typography>
            <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Registered Credits</Typography><Typography variant="body2" fontWeight={700}>{totalCredits}</Typography></Stack>
          </Paper>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Currently Registered</Typography>
            <Stack spacing={1.5}>
              {registeredCourses.length === 0 && <Typography variant="body2" color="text.secondary">No courses registered yet.</Typography>}
              {registeredCourses.map((c) => (
                <Stack key={c.code} direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">{c.code} — {c.name}</Typography>
                  <Button size="small" color="error" onClick={() => handleDrop(c.code)}>Drop</Button>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
