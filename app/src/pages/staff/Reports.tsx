import { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { DataTable } from "@/components/DataTable";
import { useColorMode } from "@/context/ColorModeContext";
import { getChartPalette, getChartTooltipStyle, getIconAccent } from "@/theme/chartPalette";
import { getTasks } from "@/api/staffTasks";
import { getTeamMembers } from "@/api/staffTeamMembers";
import type { OpsTask, OpsTeamMember } from "@/types";

function isOverdue(task: OpsTask): boolean {
  return task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== "completed";
}

export default function Reports() {
  const { mode } = useColorMode();
  const palette = getChartPalette(mode);
  const [tasks, setTasks] = useState<OpsTask[]>([]);
  const [members, setMembers] = useState<OpsTeamMember[]>([]);

  useEffect(() => {
    getTasks().then(setTasks);
    getTeamMembers().then(setMembers);
  }, []);

  const completed = tasks.filter((t) => t.status === "completed").length;
  const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
  const totalHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);

  const statusData = [
    { label: "Pending", count: tasks.filter((t) => t.status === "pending").length },
    { label: "In Progress", count: tasks.filter((t) => t.status === "in_progress").length },
    { label: "Completed", count: completed },
    { label: "Cannot Complete", count: tasks.filter((t) => t.status === "cannot_complete").length },
  ];
  const categoryData = ["maintenance", "administrative", "facilities", "supplies", "events", "other"].map((cat) => ({
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    count: tasks.filter((t) => t.category === cat).length,
  }));

  const productivity = members.map((m) => {
    const assigned = tasks.filter((t) => t.assigneeId === m.id);
    const done = assigned.filter((t) => t.status === "completed").length;
    const inProgress = assigned.filter((t) => t.status === "in_progress").length;
    const overdue = assigned.filter(isOverdue).length;
    return { ...m, assigned: assigned.length, done, inProgress, overdue, rate: assigned.length > 0 ? Math.round((done / assigned.length) * 100) : 0 };
  });

  return (
    <>
      <PageHeader eyebrow="Analytics" title="Reports" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Tasks Created" icon={<AssignmentIcon />} color={getIconAccent(mode, "tasks")} numericValue={tasks.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Tasks Completed" icon={<AssignmentTurnedInIcon />} color={getIconAccent(mode, "completed")} numericValue={completed} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Completion Rate" icon={<TrendingUpIcon />} color={getIconAccent(mode, "rate")} value={`${completionRate}%`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Hours Estimated" icon={<ScheduleIcon />} color={getIconAccent(mode, "hours")} numericValue={totalHours} />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard eyebrow="Breakdown" title="Tasks by Status">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Bar dataKey="count" fill={palette.categorical[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard eyebrow="Breakdown" title="Tasks by Category">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Bar dataKey="count" fill={palette.categorical[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      <DataTable
        title="Team Productivity"
        columns={[
          { key: "name", label: "Team Member" },
          { key: "assigned", label: "Assigned" },
          { key: "done", label: "Completed" },
          { key: "inProgress", label: "In Progress" },
          { key: "overdue", label: "Overdue" },
          { key: "rate", label: "Completion Rate", render: (row) => `${row.rate}%` },
        ]}
        rows={productivity}
        emptyTitle="No team data found"
      />
    </>
  );
}
