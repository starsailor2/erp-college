import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, MenuItem, Select, FormControl, Snackbar, type SelectChangeEvent } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import EmptyState from "@/components/EmptyState";
import { getTasks, quickAssign } from "@/api/staffTasks";
import { getTeamMembers } from "@/api/staffTeamMembers";
import type { OpsTask, OpsTeamMember } from "@/types";

export default function AssignTask() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<OpsTask[]>([]);
  const [members, setMembers] = useState<OpsTeamMember[]>([]);
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getTasks().then(setTasks);
  useEffect(() => { load(); getTeamMembers().then(setMembers); }, []);

  const unassigned = tasks.filter((t) => t.assigneeId === null);

  const handleAssign = (taskId: string) => {
    const memberId = selection[taskId];
    const member = members.find((m) => m.id === memberId);
    if (!member) { setSnackbar("Select a team member first"); return; }
    quickAssign(taskId, member.id, member.name).then(() => { load(); setSnackbar(`Assigned to ${member.name}`); });
  };

  if (unassigned.length === 0 && tasks.length > 0) {
    return (
      <>
        <PageHeader eyebrow="Task Management" title="Assign Task" />
        <EmptyState title="No unassigned tasks" description="All current tasks already have an assignee." action={<Button variant="contained" onClick={() => navigate("/staff/create-task")}>Create Task</Button>} />
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Task Management" title="Assign Task" />
      <DataTable<OpsTask>
        columns={[
          { key: "title", label: "Task" },
          { key: "priority", label: "Priority" },
          { key: "category", label: "Category" },
          { key: "dueDate", label: "Due Date" },
          {
            key: "assignee", label: "Assign To",
            render: (row) => (
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <Select value={selection[row.id] ?? ""} displayEmpty onChange={(e: SelectChangeEvent) => setSelection({ ...selection, [row.id]: e.target.value })}>
                  <MenuItem value="" disabled>Select member</MenuItem>
                  {members.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                </Select>
              </FormControl>
            ),
          },
          { key: "action", label: "Action", render: (row) => <Button size="small" variant="contained" onClick={() => handleAssign(row.id)}>Assign</Button> },
        ]}
        rows={unassigned}
        emptyTitle="No unassigned tasks"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
