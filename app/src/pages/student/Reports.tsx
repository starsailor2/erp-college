import { useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Stack, Typography, Snackbar, type SelectChangeEvent } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DownloadIcon from "@mui/icons-material/Download";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TuneIcon from "@mui/icons-material/Tune";

const academicReports = ["Transcript", "Attendance Report", "Marks Report", "Semester Result"];
const financialReports = ["Fee Statement", "Payment History", "Scholarship Summary", "Tax Certificate"];

export default function Reports() {
  const { mode } = useColorMode();
  const [customOpen, setCustomOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [reportType, setReportType] = useState("Transcript");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const stub = (label: string) => setSnackbar(`${label} is not available in this demo`);

  return (
    <>
      <PageHeader eyebrow="Reports" title="Reports" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Academic Reports" icon={<AssessmentIcon />} color={getIconAccent(mode, "academic-reports")} numericValue={academicReports.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Downloads" icon={<DownloadIcon />} color={getIconAccent(mode, "downloads")} numericValue={12} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="CGPA Trend" icon={<TrendingUpIcon />} color={getIconAccent(mode, "cgpa-trend")} value="↗ 8.75" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Custom Reports" icon={<TuneIcon />} color={getIconAccent(mode, "custom-reports")} numericValue={2} />
        </Grid>
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Academic Reports</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {academicReports.map((r) => (
          <Grid key={r} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2.5, textAlign: "center", cursor: "pointer" }} onClick={() => stub(`${r} download`)}>
              <Typography variant="subtitle2" fontWeight={600}>{r}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Financial Reports</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {financialReports.map((r) => (
          <Grid key={r} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2.5, textAlign: "center", cursor: "pointer" }} onClick={() => stub(`${r} download`)}>
              <Typography variant="subtitle2" fontWeight={600}>{r}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Stack direction="row" spacing={1.5}>
        <Button variant="contained" onClick={() => setCustomOpen(true)}>Generate Custom Report</Button>
        <Button variant="outlined" onClick={() => stub("Report download")}>Download Report</Button>
        <Button variant="outlined" onClick={() => setScheduleOpen(true)}>Schedule Reports</Button>
      </Stack>

      <Dialog open={customOpen} onClose={() => setCustomOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Custom Report</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Report Type</InputLabel>
            <Select label="Report Type" value={reportType} onChange={(e: SelectChangeEvent) => setReportType(e.target.value)}>
              {[...academicReports, ...financialReports].map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setCustomOpen(false); setSnackbar(`${reportType} report generated`); }}>Generate</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Reports</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Report Type</InputLabel>
            <Select label="Report Type" value={reportType} onChange={(e: SelectChangeEvent) => setReportType(e.target.value)}>
              {[...academicReports, ...financialReports].map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setScheduleOpen(false); setSnackbar(`${reportType} report scheduled`); }}>Schedule</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
