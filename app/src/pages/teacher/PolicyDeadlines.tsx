import { useEffect, useState } from "react";
import { Button, Paper, Typography, Stack, Snackbar, Grid } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getCalendarEvents, getAcademicPolicies } from "@/api/teacherCalendar";
import type { CalendarEvent, AcademicPolicy } from "@/types";

export default function PolicyDeadlines() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [policies, setPolicies] = useState<AcademicPolicy[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    getCalendarEvents().then(setEvents);
    getAcademicPolicies().then(setPolicies);
  }, []);

  return (
    <>
      <PageHeader eyebrow="Dean Functions" title="Policy & Deadlines" />
      <DataTable<CalendarEvent>
        title="Academic Calendar"
        columns={[
          { key: "event", label: "Event" },
          { key: "startDate", label: "Start Date" },
          { key: "endDate", label: "End Date" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={events}
        emptyTitle="No calendar events found"
      />
      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1.5 }}>Academic Policies</Typography>
      <Grid container spacing={2.5}>
        {policies.map((p) => (
          <Grid key={p.name} size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ p: 2.5, height: "100%" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Typography variant="subtitle2" fontWeight={600}>{p.name}</Typography>
                <Button size="small" onClick={() => setSnackbar("Policy editing is managed by the Registrar's office")}>Edit</Button>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{p.description}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
