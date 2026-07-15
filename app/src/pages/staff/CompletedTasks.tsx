import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getTasks } from "@/api/staffTasks";
import { currentExecutorId } from "@/demo-data/staff/teamMembers";
import type { OpsTask } from "@/types";

export default function CompletedTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<OpsTask[]>([]);

  useEffect(() => { getTasks().then(setTasks); }, []);

  const myCompleted = tasks.filter((t) => t.assigneeId === currentExecutorId && t.status === "completed");

  return (
    <>
      <PageHeader eyebrow="My Work" title="Completed Tasks" />
      <DataTable<OpsTask>
        columns={[
          { key: "title", label: "Task" },
          { key: "category", label: "Category" },
          { key: "completedAt", label: "Completed On" },
          { key: "approvalStatus", label: "Approval Status", render: (row) => row.approvalStatus ? <StatusChip status={row.approvalStatus} /> : "—" },
          { key: "actions", label: "Action", render: (row) => <Button size="small" onClick={() => navigate(`/staff/tasks/${row.id}`)}>View</Button> },
        ]}
        rows={myCompleted}
        emptyTitle="No completed tasks yet"
      />
    </>
  );
}
