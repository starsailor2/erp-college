import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import StatusChip from "@/components/StatusChip";
import EmptyState from "@/components/EmptyState";
import { getTasks } from "@/api/staffTasks";
import { currentExecutorId } from "@/demo-data/staff/teamMembers";
import type { OpsTask } from "@/types";

function isOverdue(task: OpsTask): boolean {
  return task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== "completed";
}

export default function ExecutorDashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<OpsTask[]>([]);
  const [filter, setFilter] = useState<"today" | "all">("all");

  useEffect(() => { getTasks().then(setTasks); }, []);

  const myTasks = tasks.filter((t) => t.assigneeId === currentExecutorId && t.status !== "completed" && t.status !== "cannot_complete");
  const today = new Date().toISOString().slice(0, 10);
  const visible = filter === "today" ? myTasks.filter((t) => t.dueDate === today) : myTasks;

  return (
    <>
      <PageHeader eyebrow="My Work" title="My Tasks" />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
        <Button variant={filter === "today" ? "contained" : "outlined"} onClick={() => setFilter("today")}>Today</Button>
        <Button variant={filter === "all" ? "contained" : "outlined"} onClick={() => setFilter("all")}>All Tasks</Button>
      </Stack>

      {visible.length === 0 ? (
        <EmptyState title={filter === "today" ? "No tasks due today" : "No pending tasks"} description="You're all caught up." />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {visible.map((task) => (
            <Paper key={task.id} elevation={0} sx={{ p: 3, cursor: "pointer" }} onClick={() => navigate(`/staff/tasks/${task.id}`)}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="h6" fontWeight={700}>{task.title}</Typography>
                  <Typography variant="body2" color={isOverdue(task) ? "error" : "text.secondary"}>
                    Due {task.dueDate}{isOverdue(task) ? " — Overdue" : ""}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <StatusChip status={task.priority} />
                  <StatusChip status={isOverdue(task) ? "overdue" : task.status} />
                </Stack>
              </Stack>
              <Button size="small" sx={{ mt: 2 }} variant="outlined">View Task</Button>
            </Paper>
          ))}
        </Box>
      )}
    </>
  );
}
