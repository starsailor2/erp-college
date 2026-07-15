import { useEffect, useState } from "react";
import { Button, Grid, LinearProgress, Paper, Stack, Snackbar, Typography } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getPlacementDrives, getPlacementApplications, applyPlacement } from "@/api/studentPlacements";
import type { PlacementDrive, PlacementApplication } from "@/types";
import WorkIcon from "@mui/icons-material/Work";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

export default function Placements() {
  const { mode } = useColorMode();
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [applications, setApplications] = useState<PlacementApplication[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => {
    getPlacementDrives().then(setDrives);
    getPlacementApplications().then(setApplications);
  };
  useEffect(() => { load(); }, []);

  const hasApplied = (company: string) => applications.some((a) => a.company === company);
  const handleApply = (drive: PlacementDrive) => applyPlacement(drive.company, drive.role).then(() => { load(); setSnackbar(`Applied to ${drive.company}`); });

  return (
    <>
      <PageHeader eyebrow="Placements" title="Placements" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Upcoming Drives" icon={<WorkIcon />} color={getIconAccent(mode, "drives")} numericValue={drives.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="My Applications" icon={<AssignmentTurnedInIcon />} color={getIconAccent(mode, "applications")} numericValue={applications.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Profile Completion" icon={<AssignmentTurnedInIcon />} color={getIconAccent(mode, "profile-completion")} value="85%" />
        </Grid>
      </Grid>
      <DataTable<PlacementDrive>
        title="Upcoming Drives"
        columns={[
          { key: "company", label: "Company" },
          { key: "role", label: "Role" },
          { key: "ctc", label: "CTC" },
          { key: "date", label: "Date" },
          { key: "eligibility", label: "Eligibility" },
          { key: "actions", label: "Action", render: (row) => <Button size="small" disabled={hasApplied(row.company)} onClick={() => handleApply(row)}>{hasApplied(row.company) ? "Applied" : "Apply"}</Button> },
        ]}
        rows={drives}
        emptyTitle="No upcoming drives"
      />
      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1.5 }}>My Applications</Typography>
      <DataTable<PlacementApplication>
        columns={[
          { key: "company", label: "Company" },
          { key: "role", label: "Role" },
          { key: "appliedOn", label: "Applied On" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={applications}
        emptyTitle="No applications yet"
      />
      <Paper elevation={0} sx={{ p: 3, mt: 3, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Profile Completion</Typography>
        <LinearProgress variant="determinate" value={85} sx={{ height: 8, borderRadius: 4 }} />
      </Paper>
      <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1}>
        <Button variant="outlined" onClick={() => setSnackbar("Placement profile editing is not available in this demo")}>Update Placement Profile</Button>
        <Button variant="outlined" onClick={() => setSnackbar("Resume download is not available in this demo")}>Download Resume</Button>
        <Button variant="outlined" onClick={() => setSnackbar("Placement calendar is not available in this demo")}>View Placement Calendar</Button>
      </Stack>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
