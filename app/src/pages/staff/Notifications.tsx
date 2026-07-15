import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getOpsNotifications, markNotificationRead, markAllNotificationsRead } from "@/api/staffNotifications";
import type { OpsNotification } from "@/types";

export default function Notifications() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<OpsNotification[]>([]);

  const load = () => getOpsNotifications().then(setRows);
  useEffect(() => { load(); }, []);

  const handleClick = (row: OpsNotification) => {
    markNotificationRead(row.id).then(load);
    if (row.taskId) navigate(`/staff/tasks/${row.taskId}`);
  };

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Notifications"
        action={<Button variant="outlined" onClick={() => markAllNotificationsRead().then(load)}>Mark all read</Button>}
      />
      <DataTable<OpsNotification>
        pagination
        onRowClick={handleClick}
        columns={[
          { key: "message", label: "Message" },
          { key: "time", label: "Date" },
          { key: "read", label: "Status", render: (row) => <StatusChip status={row.read ? "read" : "unread"} /> },
        ]}
        rows={rows}
        emptyTitle="No notifications"
      />
    </>
  );
}
