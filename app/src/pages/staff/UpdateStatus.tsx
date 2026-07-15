import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Stack, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getTasks, startTask, completeTask } from "@/api/staffTasks";
import { currentExecutorId } from "@/demo-data/staff/teamMembers";
import type { OpsTask } from "@/types";

export default function UpdateStatus() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<OpsTask[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getTasks().then(setTasks);
  useEffect(() => { load(); }, []);

  const myActive = tasks.filter((t) => t.assigneeId === currentExecutorId && (t.status === "pending" || t.status === "in_progress"));

  return (
    <>
      <PageHeader eyebrow="My Work" title="Update Status" />
      <DataTable<OpsTask>
        columns={[
          { key: "title", label: "Task" },
          { key: "priority", label: "Priority", render: (row) => <StatusChip status={row.priority} /> },
          { key: "status", label: "Current Status", render: (row) => <StatusChip status={row.status} /> },
          { key: "dueDate", label: "Due Date" },
          {
            key: "actions", label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={1}>
                {row.status === "pending" && <Button size="small" variant="contained" onClick={() => startTask(row.id).then(() => { load(); setSnackbar("Task started"); })}>Start</Button>}
                {row.status === "in_progress" && <Button size="small" variant="contained" onClick={() => completeTask(row.id).then(() => { load(); setSnackbar("Task marked as done"); })}>Complete</Button>}
                <Button size="small" onClick={() => navigate(`/staff/tasks/${row.id}`)}>Details</Button>
              </Stack>
            ),
          },
        ]}
        rows={myActive}
        emptyTitle="No active tasks"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
