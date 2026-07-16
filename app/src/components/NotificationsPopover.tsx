import { useEffect, useState } from "react";
import Popover from "@mui/material/Popover";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Divider from "@mui/material/Divider";
import StatusChip from "@/components/StatusChip";
import EmptyState from "@/components/EmptyState";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/api/notifications";
import type { Notification } from "@/types";

interface NotificationsPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onReadStateChanged: () => void;
}

export default function NotificationsPopover({ open, anchorEl, onClose, onReadStateChanged }: NotificationsPopoverProps) {
  const [rows, setRows] = useState<Notification[]>([]);

  const load = () => {
    getNotifications().then((data) => {
      setRows([...data].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    });
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const handleRowClick = (row: Notification) => {
    if (row.read) return;
    markNotificationRead(row.id).then(() => {
      load();
      onReadStateChanged();
    });
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead().then(() => {
      load();
      onReadStateChanged();
    });
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{ paper: { sx: { width: 360, maxHeight: 420 } } }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
        <Button size="small" onClick={handleMarkAllRead}>Mark all read</Button>
      </Box>
      <Divider />
      {rows.length === 0 ? (
        <EmptyState title="No notifications" />
      ) : (
        <List dense disablePadding>
          {rows.map((row) => (
            <Box key={row.id}>
              <ListItemButton
                onClick={() => handleRowClick(row)}
                sx={{ py: 1.25, flexDirection: "column", alignItems: "stretch" }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, width: "100%" }}>
                  <Typography variant="body2" fontWeight={600}>{row.title}</Typography>
                  <StatusChip status={row.read ? "read" : "unread"} size="small" />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  {row.message}
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.5 }}>
                  {new Date(row.timestamp).toLocaleString()}
                </Typography>
              </ListItemButton>
              <Divider />
            </Box>
          ))}
        </List>
      )}
    </Popover>
  );
}
