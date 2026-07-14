import { useEffect, useState } from "react";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, InputLabel, FormControl, Stack, Typography, Paper, Grid, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import BedIcon from "@mui/icons-material/Bed";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import BuildIcon from "@mui/icons-material/Build";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getHostelStats, allocateRoom } from "@/api/hostelStats";
import { hostelBlocks, hostelRooms, hostelBeds } from "@/demo-data/campus/hostelStats";
import { students } from "@/demo-data/people/students";
import type { HostelStats } from "@/types";

const dropdownStudents = students.slice(0, 20);

export default function Hostel() {
  const { mode } = useColorMode();
  const [stats, setStats] = useState<HostelStats | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ studentId: dropdownStudents[0].id, hostel: hostelBlocks[0], room: hostelRooms[0], bed: hostelBeds[0] });
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getHostelStats().then(setStats);
  useEffect(() => { load(); }, []);

  const handleAllocate = () => {
    if (!stats || stats.available <= 0) {
      setSnackbar("No beds available to allocate");
      setDialogOpen(false);
      return;
    }
    allocateRoom().then(() => { load(); setDialogOpen(false); setSnackbar("Room allocated successfully!"); });
  };

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Hostel Management"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Exporting Hostel Data... Download will start shortly.")}>Export</Button>
            <Button variant="contained" onClick={() => setDialogOpen(true)}>Allocate Room</Button>
          </Stack>
        }
      />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Hostel management system provides:</Typography>
        <Box component="ul" sx={{ pl: 3, mb: 0 }}>
          {[
            "Room allocation and vacancy tracking",
            "Student check-in/check-out management",
            "Mess and facility booking",
            "Visitor management and gate pass",
            "Hostel fee collection",
            "Complaint and request tracking",
          ].map((item) => (
            <Typography key={item} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{item}</Typography>
          ))}
        </Box>
      </Paper>

      {stats && (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Total Beds" icon={<BedIcon />} color={getIconAccent(mode, "beds")} numericValue={stats.totalBeds} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Occupied" icon={<CheckCircleIcon />} color={getIconAccent(mode, "occupied")} numericValue={stats.occupied} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Available" icon={<EventSeatIcon />} color={getIconAccent(mode, "available")} numericValue={stats.available} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Maintenance" icon={<BuildIcon />} color={getIconAccent(mode, "hostel-maintenance")} numericValue={stats.maintenance} />
          </Grid>
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Allocate Hostel Room</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Student</InputLabel>
            <Select label="Student" value={form.studentId} onChange={(e: SelectChangeEvent) => setForm({ ...form, studentId: e.target.value })}>
              {dropdownStudents.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Hostel</InputLabel>
            <Select label="Hostel" value={form.hostel} onChange={(e: SelectChangeEvent) => setForm({ ...form, hostel: e.target.value })}>
              {hostelBlocks.map((h) => <MenuItem key={h} value={h}>{h}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Room Number</InputLabel>
            <Select label="Room Number" value={form.room} onChange={(e: SelectChangeEvent) => setForm({ ...form, room: e.target.value })}>
              {hostelRooms.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Bed Number</InputLabel>
            <Select label="Bed Number" value={form.bed} onChange={(e: SelectChangeEvent) => setForm({ ...form, bed: e.target.value })}>
              {hostelBeds.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAllocate}>Allocate Room</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
