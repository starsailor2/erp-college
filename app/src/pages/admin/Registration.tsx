import { useState } from "react";
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Select, InputLabel, FormControl,
  Stack, Switch, Button, Snackbar, type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";

export default function Registration() {
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const [term, setTerm] = useState("fall");
  const [startDateTime, setStartDateTime] = useState("2026-08-15T08:00");
  const [endDateTime, setEndDateTime] = useState("2026-08-25T23:59");
  const [maxCredits, setMaxCredits] = useState(18);
  const [gracePeriod, setGracePeriod] = useState(0);
  const [allowAddDrop, setAllowAddDrop] = useState(true);
  const [advisorApproval, setAdvisorApproval] = useState(false);
  const [lateRegistration, setLateRegistration] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="Course Registration Control"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Draft saved.")}>Save Draft</Button>
            <Button variant="contained" onClick={() => setSnackbar("Registration window published.")}>Publish Window</Button>
          </Stack>
        }
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Configure registration windows, credit limits, add/drop deadlines, advisor approval, late-registration policy, and program eligibility rules.
      </Typography>

      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Registration Window Settings</Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Academic Year</InputLabel>
              <Select label="Academic Year" value={academicYear} onChange={(e: SelectChangeEvent) => setAcademicYear(e.target.value)}>
                <MenuItem value="2026-2027">2026 - 2027</MenuItem>
                <MenuItem value="2025-2026">2025 - 2026</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Term</InputLabel>
              <Select label="Term" value={term} onChange={(e: SelectChangeEvent) => setTerm(e.target.value)}>
                <MenuItem value="fall">Fall Semester</MenuItem>
                <MenuItem value="spring">Spring Semester</MenuItem>
                <MenuItem value="summer">Summer Term</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Start Date & Time" type="datetime-local" value={startDateTime} onChange={(e) => setStartDateTime(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="End Date & Time" type="datetime-local" value={endDateTime} onChange={(e) => setEndDateTime(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Max Credits Per Student" type="number" value={maxCredits} onChange={(e) => setMaxCredits(Number(e.target.value))} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Grace Period (Hours)" type="number" value={gracePeriod} onChange={(e) => setGracePeriod(Number(e.target.value))} fullWidth />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Rules & Policies</Typography>
        <Stack spacing={2.5} divider={<Box sx={{ borderBottom: "1px solid", borderColor: "divider" }} />}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2" fontWeight={600}>Allow Add/Drop</Typography>
              <Typography variant="caption" color="text.secondary">Students can modify courses after initial registration</Typography>
            </Box>
            <Switch checked={allowAddDrop} onChange={(e) => setAllowAddDrop(e.target.checked)} />
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2" fontWeight={600}>Advisor Approval</Typography>
              <Typography variant="caption" color="text.secondary">Require advisor sign-off before confirming schedule</Typography>
            </Box>
            <Switch checked={advisorApproval} onChange={(e) => setAdvisorApproval(e.target.checked)} />
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2" fontWeight={600}>Late Registration</Typography>
              <Typography variant="caption" color="text.secondary">Allow registration after window close with fee</Typography>
            </Box>
            <Switch checked={lateRegistration} onChange={(e) => setLateRegistration(e.target.checked)} />
          </Stack>
        </Stack>
      </Paper>

      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
