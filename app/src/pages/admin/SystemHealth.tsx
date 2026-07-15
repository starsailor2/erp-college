import { useEffect, useState } from "react";
import { Box, Button, Stack, Typography, Grid, Paper, Snackbar } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MemoryIcon from "@mui/icons-material/Memory";
import StorageIcon from "@mui/icons-material/Storage";
import DnsIcon from "@mui/icons-material/Dns";
import BoltIcon from "@mui/icons-material/Bolt";
import GroupIcon from "@mui/icons-material/Group";
import BackupIcon from "@mui/icons-material/Backup";
import SpeedIcon from "@mui/icons-material/Speed";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getSystemHealth } from "@/api/systemHealth";
import type { SystemHealthMetrics } from "@/types";

export default function SystemHealth() {
  const { mode } = useColorMode();
  const [health, setHealth] = useState<SystemHealthMetrics | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getSystemHealth().then(setHealth); }, []);

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="System Health Monitor"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Refreshing system status...")}>Refresh</Button>
            <Button variant="contained" onClick={() => setSnackbar("Running diagnostics...")}>Run Diagnostics</Button>
          </Stack>
        }
      />
      {health && (
        <>
          <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="System Uptime" icon={<CheckCircleIcon />} color={getIconAccent(mode, "uptime")} value={`${health.uptimePct}%`} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="CPU Usage" icon={<SpeedIcon />} color={getIconAccent(mode, "cpu")} value={`${health.cpuPct}%`} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Memory Usage" icon={<MemoryIcon />} color={getIconAccent(mode, "memory")} value={`${health.memoryPct}%`} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Disk Space" icon={<StorageIcon />} color={getIconAccent(mode, "disk")} value={`${health.diskPct}%`} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Database" icon={<DnsIcon />} color={getIconAccent(mode, "database")} value={health.databaseHealthy ? "Healthy" : "Degraded"} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="API Response" icon={<BoltIcon />} color={getIconAccent(mode, "api")} value={`${health.apiResponseMs} ms`} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Active Users" icon={<GroupIcon />} color={getIconAccent(mode, "active-users")} numericValue={health.activeUsers} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Last Backup" icon={<BackupIcon />} color={getIconAccent(mode, "backup")} value={health.lastBackup} />
            </Grid>
          </Grid>

          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Service Status</Typography>
          <Stack spacing={1.5}>
            {health.services.map((s) => (
              <Paper key={s.name} elevation={0} sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.description}</Typography>
                </Box>
                <StatusChip status={s.status} />
              </Paper>
            ))}
          </Stack>
        </>
      )}
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
