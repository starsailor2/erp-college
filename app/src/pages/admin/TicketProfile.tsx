import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Stack, Typography, Paper, Grid, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusChip from "@/components/StatusChip";
import { getTicketByIdAsync, updateTicket } from "@/api/tickets";
import type { Ticket } from "@/types";

export default function TicketProfile() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<Ticket | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => {
    if (id) getTicketByIdAsync(id).then((data) => { setTicket(data); setLoaded(true); });
  };
  useEffect(() => { load(); }, [id]);

  if (loaded && !ticket) {
    return <EmptyState title="Ticket not found" description={`No ticket with id "${id}".`} />;
  }
  if (!ticket) return null;

  const handleResolve = () => {
    updateTicket(ticket.id, { status: "resolved", slaState: "resolved", slaDetail: "Resolved just now" }).then(load);
  };

  return (
    <>
      <PageHeader
        eyebrow="Tickets"
        title={ticket.title}
        breadcrumbs={[{ label: "Tickets", to: "/admin/tickets" }, { label: ticket.id }]}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Technician assigned successfully")}>Assign Technician</Button>
            <Button variant="contained" disabled={ticket.status === "resolved"} onClick={handleResolve}>Mark Resolved</Button>
          </Stack>
        }
      />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Ticket ID</Typography><Typography variant="body1">{ticket.id}</Typography></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Priority</Typography><StatusChip status={ticket.priority} /></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Status</Typography><StatusChip status={ticket.status} /></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Location</Typography><Typography variant="body1">{ticket.location}</Typography></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Created</Typography><Typography variant="body1">{ticket.createdLabel}</Typography></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Assigned To</Typography><Typography variant="body1">{ticket.assignedTo ?? "Unassigned"}</Typography></Grid>
        </Grid>
      </Paper>
      <Paper elevation={0} sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Description</Typography>
        <Typography variant="body2" color="text.secondary">{ticket.description}</Typography>
      </Paper>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
