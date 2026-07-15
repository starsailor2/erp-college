import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Grid, Paper, Typography, LinearProgress } from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ScheduleIcon from "@mui/icons-material/Schedule";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getTasks } from "@/api/staffTasks";
import { getTeamMembers } from "@/api/staffTeamMembers";
import type { OpsTask, OpsTeamMember } from "@/types";

function isOverdue(task: OpsTask): boolean {
  return task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== "completed";
}

export default function Dashboard() {
  const { mode } = useColorMode();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<OpsTask[]>([]);
  const [members, setMembers] = useState<OpsTeamMember[]>([]);

  useEffect(() => {
    getTasks().then(setTasks);
    getTeamMembers().then(setMembers);
  }, []);

  const pending = tasks.filter((t) => t.status === "pending").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const overdue = tasks.filter(isOverdue).length;

  const recent = [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  const completionFor = (memberId: string) => {
    const assigned = tasks.filter((t) => t.assigneeId === memberId);
    const done = assigned.filter((t) => t.status === "completed").length;
    return { assigned: assigned.length, done };
  };

  return (
    <>
      <PageHeader eyebrow="Overview" title="Operations Dashboard" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard title="Total Tasks" icon={<AssignmentIcon />} color={getIconAccent(mode, "tasks")} numericValue={tasks.length} onClick={() => navigate("/staff/tasks")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard title="Pending" icon={<ScheduleIcon />} color={getIconAccent(mode, "pending")} numericValue={pending} onClick={() => navigate("/staff/tasks?status=pending")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard title="In Progress" icon={<HourglassTopIcon />} color={getIconAccent(mode, "in_progress")} numericValue={inProgress} onClick={() => navigate("/staff/tasks?status=in_progress")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard title="Completed" icon={<CheckCircleIcon />} color={getIconAccent(mode, "completed")} numericValue={completed} onClick={() => navigate("/staff/tasks?status=completed")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard title="Overdue" icon={<ErrorIcon />} color="#e34948" numericValue={overdue} onClick={() => navigate("/staff/tasks?status=overdue")} />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <DataTable<OpsTask>
            title="Recent Tasks"
            onRowClick={(row) => navigate(`/staff/tasks/${row.id}`)}
            columns={[
              { key: "title", label: "Task" },
              { key: "assigneeId", label: "Assigned To", render: (row) => members.find((m) => m.id === row.assigneeId)?.name ?? "Unassigned" },
              { key: "status", label: "Status", render: (row) => <StatusChip status={isOverdue(row) ? "overdue" : row.status} /> },
              { key: "dueDate", label: "Due Date" },
            ]}
            rows={recent}
            emptyTitle="No tasks yet"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Team Performance</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {members.slice(0, 4).map((m) => {
                const { assigned, done } = completionFor(m.id);
                return (
                  <Box key={m.id}>
                    <Typography variant="body2" fontWeight={600}>{m.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{done}/{assigned} tasks completed</Typography>
                    <LinearProgress variant="determinate" value={assigned > 0 ? (done / assigned) * 100 : 0} sx={{ mt: 0.5, height: 6, borderRadius: 3 }} />
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
