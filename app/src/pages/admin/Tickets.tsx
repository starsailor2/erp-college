import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Grid, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import ErrorIcon from "@mui/icons-material/Error";
import AssignmentLateIcon from "@mui/icons-material/AssignmentLate";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getTickets } from "@/api/tickets";
import type { Ticket, TicketStatus, TicketPriority } from "@/types";

export default function Tickets() {
  const { mode } = useColorMode();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "all">("all");
  const [search, setSearch] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getTickets().then(setRows); }, []);

  const filtered = rows.filter((t) =>
    (statusFilter === "all" || t.status === statusFilter) &&
    (priorityFilter === "all" || t.priority === priorityFilter) &&
    (search === "" || t.id.toLowerCase().includes(search.toLowerCase()) || t.location.toLowerCase().includes(search.toLowerCase()) || t.title.toLowerCase().includes(search.toLowerCase()))
  );

  const openCount = rows.filter((t) => t.status !== "resolved").length;
  const slaBreaches = rows.filter((t) => t.slaState === "breached").length;
  const unassigned = rows.filter((t) => t.assignedTo === null).length;
  const resolvedWithHours = rows.filter((t) => t.resolutionHours !== undefined);
  const avgResolution = resolvedWithHours.length > 0
    ? resolvedWithHours.reduce((sum, t) => sum + (t.resolutionHours ?? 0), 0) / resolvedWithHours.length
    : 0;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Maintenance Requests"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Exporting Maintenance Report... Download will start shortly.")}>Export Report</Button>
            <Button variant="contained" onClick={() => setSnackbar("Opening new request form...")}>Create New Request</Button>
          </Stack>
        }
      />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Open Requests" icon={<ConfirmationNumberIcon />} color={getIconAccent(mode, "tickets")} numericValue={openCount} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="SLA Breaches" icon={<ErrorIcon />} color={getIconAccent(mode, "sla")} numericValue={slaBreaches} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Unassigned Tickets" icon={<AssignmentLateIcon />} color={getIconAccent(mode, "unassigned")} numericValue={unassigned} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Avg Resolution Time" icon={<ScheduleIcon />} color={getIconAccent(mode, "resolution")} value={`${avgResolution.toFixed(1)} hrs`} />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <TextField size="small" placeholder="Search by Request ID, Location, or Description..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 300 }} />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select<TicketStatus | "all"> label="Status" value={statusFilter} onChange={(e: SelectChangeEvent<TicketStatus | "all">) => setStatusFilter(e.target.value as TicketStatus | "all")}>
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Priority</InputLabel>
          <Select<TicketPriority | "all"> label="Priority" value={priorityFilter} onChange={(e: SelectChangeEvent<TicketPriority | "all">) => setPriorityFilter(e.target.value as TicketPriority | "all")}>
            <MenuItem value="all">All Priorities</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <DataTable<Ticket>
        pagination
        columns={[
          {
            key: "id", label: "Req ID",
            render: (row) => (
              <Box>
                <Typography variant="body2" fontWeight={600} color="primary.main">#{row.id}</Typography>
                <Typography variant="caption" color="text.secondary">{row.createdLabel}</Typography>
              </Box>
            ),
          },
          {
            key: "title", label: "Issue & Description",
            render: (row) => (
              <Box>
                <Typography variant="body2" fontWeight={600}>{row.title}</Typography>
                <Typography variant="caption" color="text.secondary">{row.description}</Typography>
              </Box>
            ),
          },
          { key: "location", label: "Location" },
          { key: "priority", label: "Priority", render: (row) => <StatusChip status={row.priority} /> },
          {
            key: "assignedTo", label: "Assigned Staff",
            render: (row) => row.assignedTo
              ? row.assignedTo
              : <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); setSnackbar("Staff assignment dialog opening..."); }}>Assign Staff</Button>,
          },
          {
            key: "sla", label: "SLA Status",
            render: (row) => (
              <Box>
                <Typography variant="body2" fontWeight={600} color={row.slaState === "breached" ? "error.main" : "success.main"}>
                  {row.slaState === "breached" ? "SLA Breached" : row.slaState === "resolved" ? "Resolved" : "On Track"}
                </Typography>
                <Typography variant="caption" color="text.secondary">{row.slaDetail}</Typography>
              </Box>
            ),
          },
          {
            key: "actions", label: "Actions",
            render: (row) => <Button size="small" onClick={(e) => { e.stopPropagation(); navigate(`/admin/tickets/${row.id}`); }}>View</Button>,
          },
        ]}
        rows={filtered}
        emptyTitle="No maintenance requests found"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
