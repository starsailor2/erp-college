import { useEffect, useState } from "react";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, Typography, Paper, Grid, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import TheaterComedyIcon from "@mui/icons-material/TheaterComedy";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getFacilityStats, addBooking } from "@/api/facilityStats";
import { facilitiesList, bookingTimeSlots } from "@/demo-data/campus/facilityStats";
import type { FacilityStats } from "@/types";

const emptyForm = { facility: facilitiesList[0], eventType: "", date: "", timeSlot: bookingTimeSlots[0], purpose: "" };

export default function Facility() {
  const { mode } = useColorMode();
  const [stats, setStats] = useState<FacilityStats | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getFacilityStats().then(setStats);
  useEffect(() => { load(); }, []);

  const handleBook = () => {
    addBooking().then(() => { load(); setDialogOpen(false); setForm(emptyForm); setSnackbar("Booking created successfully!"); });
  };

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Facility Booking"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Opening calendar view...")}>View Calendar</Button>
            <Button variant="contained" onClick={() => setDialogOpen(true)}>New Booking</Button>
          </Stack>
        }
      />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Facility booking system allows:</Typography>
        <Box component="ul" sx={{ pl: 3, mb: 0 }}>
          {[
            "Book auditoriums, conference rooms, labs",
            "Sports facility scheduling",
            "Equipment and resource reservation",
            "Approval workflow management",
            "Conflict detection and prevention",
            "Usage tracking and reports",
          ].map((item) => (
            <Typography key={item} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{item}</Typography>
          ))}
        </Box>
      </Paper>

      {stats && (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Today's Bookings" icon={<EventIcon />} color={getIconAccent(mode, "bookings")} numericValue={stats.todayBookings} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Auditorium" icon={<TheaterComedyIcon />} color={getIconAccent(mode, "auditorium")} numericValue={stats.auditoriumUtilizationPct} formatValue={(n) => `${n}%`} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Sports Complex" icon={<SportsSoccerIcon />} color={getIconAccent(mode, "sports")} numericValue={stats.sportsUtilizationPct} formatValue={(n) => `${n}%`} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Pending Approvals" icon={<PendingActionsIcon />} color={getIconAccent(mode, "facility-pending")} numericValue={stats.pendingApprovals} />
          </Grid>
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Facility Booking</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Facility</InputLabel>
            <Select label="Facility" value={form.facility} onChange={(e: SelectChangeEvent) => setForm({ ...form, facility: e.target.value })}>
              {facilitiesList.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Event Type" placeholder="Seminar, Workshop, etc" value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })} fullWidth />
          <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
          <FormControl fullWidth>
            <InputLabel>Time Slot</InputLabel>
            <Select label="Time Slot" value={form.timeSlot} onChange={(e: SelectChangeEvent) => setForm({ ...form, timeSlot: e.target.value })}>
              {bookingTimeSlots.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Purpose" placeholder="Describe the purpose of booking" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} fullWidth multiline minRows={3} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleBook}>Submit Booking</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
