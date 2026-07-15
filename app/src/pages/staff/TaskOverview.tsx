import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, MenuItem, Select, InputLabel, FormControl, Stack, Chip } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { AssignTaskDialog } from "@/components/staff/AssignTaskDialog";
import { getTasks, assignTask } from "@/api/staffTasks";
import { getTeamMembers } from "@/api/staffTeamMembers";
import type { OpsTask, OpsTeamMember } from "@/types";

function isOverdue(task: OpsTask): boolean {
  return task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== "completed";
}

export default function TaskOverview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState<OpsTask[]>([]);
  const [members, setMembers] = useState<OpsTeamMember[]>([]);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState(searchParams.get("assignee") ?? "all");
  const [assignDialogTask, setAssignDialogTask] = useState<OpsTask | null>(null);

  const load = () => getTasks().then(setTasks);
  useEffect(() => { load(); getTeamMembers().then(setMembers); }, []);

  const filtered = useMemo(() => tasks.filter((t) => {
    if (statusFilter === "overdue" && !isOverdue(t)) return false;
    if (statusFilter !== "all" && statusFilter !== "overdue" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (assigneeFilter !== "all" && t.assigneeId !== assigneeFilter) return false;
    return true;
  }), [tasks, statusFilter, priorityFilter, assigneeFilter]);

  const handleConfirmAssign = (assigneeId: string, assigneeName: string, notes: string) => {
    if (!assignDialogTask) return;
    assignTask(assignDialogTask.id, assigneeId, assigneeName, notes || undefined).then(() => { load(); setAssignDialogTask(null); });
  };

  return (
    <>
      <PageHeader
        eyebrow="Task Management"
        title="Task Overview"
        action={<Button variant="contained" onClick={() => navigate("/staff/create-task")}>+ New Task</Button>}
      />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cannot_complete">Cannot Complete</MenuItem>
            <MenuItem value="overdue">Overdue</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Priority</InputLabel>
          <Select label="Priority" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <MenuItem value="all">All Priorities</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Assignee</InputLabel>
          <Select label="Assignee" value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
            <MenuItem value="all">All Assignees</MenuItem>
            {members.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      <DataTable<OpsTask>
        pagination
        columns={[
          { key: "id", label: "ID" },
          {
            key: "title", label: "Task",
            render: (row) => (
              <Stack direction="row" spacing={1} alignItems="center">
                <span>{row.title}</span>
                {row.needsHelp && <Chip size="small" label="⚠️ Help" color="warning" variant="outlined" />}
                {row.status === "cannot_complete" && <Chip size="small" label="🛑 Cannot Complete" color="error" variant="outlined" />}
              </Stack>
            ),
          },
          { key: "assigneeId", label: "Assigned To", render: (row) => members.find((m) => m.id === row.assigneeId)?.name ?? "Unassigned" },
          { key: "priority", label: "Priority", render: (row) => <StatusChip status={row.priority} /> },
          { key: "status", label: "Status", render: (row) => <StatusChip status={isOverdue(row) ? "overdue" : row.status} /> },
          { key: "dueDate", label: "Due Date" },
          {
            key: "actions", label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={() => navigate(`/staff/tasks/${row.id}`)}>View</Button>
                {row.assigneeId === null && <Button size="small" onClick={() => setAssignDialogTask(row)}>Assign</Button>}
              </Stack>
            ),
          },
        ]}
        rows={filtered}
        emptyTitle="No tasks match these filters"
      />
      <AssignTaskDialog
        open={!!assignDialogTask}
        taskTitle={assignDialogTask?.title ?? ""}
        onClose={() => setAssignDialogTask(null)}
        onConfirm={handleConfirmAssign}
      />
    </>
  );
}
