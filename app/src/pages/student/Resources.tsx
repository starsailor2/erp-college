import { useEffect, useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Paper, Stack, TextField, Typography, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getFacilityCatalog, getEquipmentCatalog, getResourceBookings, bookResource } from "@/api/studentResources";
import type { ResourceBooking } from "@/types";
import EventIcon from "@mui/icons-material/Event";

export default function Resources() {
  const { mode } = useColorMode();
  const [facilities, setFacilities] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [bookings, setBookings] = useState<ResourceBooking[]>([]);
  const [target, setTarget] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [purpose, setPurpose] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getResourceBookings().then(setBookings);
  useEffect(() => {
    getFacilityCatalog().then(setFacilities);
    getEquipmentCatalog().then(setEquipment);
    load();
  }, []);

  const handleBook = () => {
    if (!target || !date || !timeSlot) { setSnackbar("Please fill in date and time slot"); return; }
    bookResource(target, date, timeSlot, purpose).then(() => {
      load();
      setTarget(null); setDate(""); setTimeSlot(""); setPurpose("");
      setSnackbar(`${target} booked successfully`);
    });
  };

  return (
    <>
      <PageHeader eyebrow="Resources" title="Facility & Resource Booking" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Facilities" icon={<EventIcon />} color={getIconAccent(mode, "facilities")} numericValue={facilities.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Equipment" icon={<EventIcon />} color={getIconAccent(mode, "equipment")} numericValue={equipment.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Current Bookings" icon={<EventIcon />} color={getIconAccent(mode, "bookings")} numericValue={bookings.length} />
        </Grid>
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Available Facilities</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {facilities.map((f) => (
          <Grid key={f} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2.5, textAlign: "center" }}>
              <Typography variant="subtitle2" fontWeight={600}>{f}</Typography>
              <Button size="small" variant="outlined" sx={{ mt: 1.5 }} onClick={() => setTarget(f)}>Book</Button>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Equipment Inventory</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {equipment.map((e) => (
          <Grid key={e} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2.5, textAlign: "center" }}>
              <Typography variant="subtitle2" fontWeight={600}>{e}</Typography>
              <Button size="small" variant="outlined" sx={{ mt: 1.5 }} onClick={() => setTarget(e)}>Book</Button>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Current Bookings</Typography>
      <DataTable<ResourceBooking>
        columns={[
          { key: "resourceName", label: "Resource" },
          { key: "date", label: "Date" },
          { key: "timeSlot", label: "Time Slot" },
          { key: "purpose", label: "Purpose" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={bookings}
        emptyTitle="No current bookings"
      />
      <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1} sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={() => setSnackbar("Booking calendar is not available in this demo")}>View Booking Calendar</Button>
        <Button variant="outlined" onClick={() => setTarget("Custom Equipment Request")}>Request Equipment</Button>
        <Button variant="outlined" onClick={() => setSnackbar("Usage report download is not available in this demo")}>Download Usage Report</Button>
      </Stack>

      <Dialog open={!!target} onClose={() => setTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Book {target}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Date" type="date" fullWidth value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField label="Time Slot" fullWidth placeholder="e.g. 10:00 - 12:00" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} />
            <TextField label="Purpose" fullWidth multiline minRows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleBook}>Confirm Booking</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
