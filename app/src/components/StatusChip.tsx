import Chip from "@mui/material/Chip";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ErrorIcon from "@mui/icons-material/Error";
import CancelIcon from "@mui/icons-material/Cancel";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import EventIcon from "@mui/icons-material/Event";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import { statusTokens } from "@/theme/tokens";
import type { SvgIconComponent } from "@mui/icons-material";

interface StatusMeta {
  label: string;
  color: string;
  icon: SvgIconComponent;
}

const STATUS_MAP: Record<string, StatusMeta> = {
  // Fees
  paid: { label: "Paid", color: statusTokens.good, icon: CheckCircleIcon },
  pending: { label: "Pending", color: statusTokens.warning, icon: ScheduleIcon },
  overdue: { label: "Overdue", color: statusTokens.critical, icon: ErrorIcon },
  // Attendance
  present: { label: "Present", color: statusTokens.good, icon: CheckCircleIcon },
  absent: { label: "Absent", color: statusTokens.critical, icon: CancelIcon },
  late: { label: "Late", color: statusTokens.warning, icon: HourglassTopIcon },
  // Library
  issued: { label: "Issued", color: statusTokens.warning, icon: ScheduleIcon },
  returned: { label: "Returned", color: statusTokens.good, icon: CheckCircleIcon },
  // Tasks / requests
  in_progress: { label: "In Progress", color: statusTokens.warning, icon: HourglassTopIcon },
  completed: { label: "Completed", color: statusTokens.good, icon: CheckCircleIcon },
  rejected: { label: "Rejected", color: statusTokens.critical, icon: CancelIcon },
  approved: { label: "Approved", color: statusTokens.good, icon: CheckCircleIcon },
  fulfilled: { label: "Fulfilled", color: statusTokens.good, icon: CheckCircleIcon },
  active: { label: "Active", color: statusTokens.good, icon: CheckCircleIcon },
  inactive: { label: "Inactive", color: statusTokens.serious, icon: CancelIcon },
  // Notifications / messages
  read: { label: "Read", color: statusTokens.good, icon: MarkEmailReadIcon },
  unread: { label: "Unread", color: statusTokens.warning, icon: MarkEmailUnreadIcon },
  // Activity log
  pending_approval: { label: "Pending Approval", color: statusTokens.warning, icon: PendingActionsIcon },
  scheduled: { label: "Scheduled", color: statusTokens.warning, icon: EventIcon },
  // Payments
  verified: { label: "Verified", color: statusTokens.good, icon: CheckCircleIcon },
  pending_clearance: { label: "Pending Clearance", color: statusTokens.warning, icon: HourglassBottomIcon },
  // Assets
  maintenance: { label: "Maintenance", color: statusTokens.warning, icon: HourglassTopIcon },
  retired: { label: "Retired", color: statusTokens.serious, icon: CancelIcon },
  // Tickets
  open: { label: "Open", color: statusTokens.warning, icon: ScheduleIcon },
  resolved: { label: "Resolved", color: statusTokens.good, icon: CheckCircleIcon },
  // Priority
  critical: { label: "Critical", color: statusTokens.critical, icon: ErrorIcon },
  high: { label: "High", color: statusTokens.serious, icon: WarningAmberIcon },
  medium: { label: "Medium", color: statusTokens.warning, icon: ScheduleIcon },
  low: { label: "Low", color: statusTokens.good, icon: CheckCircleIcon },
  // Library
  available: { label: "Available", color: statusTokens.good, icon: CheckCircleIcon },
  reserved: { label: "Reserved", color: statusTokens.warning, icon: BookmarkIcon },
  // Notices
  published: { label: "Published", color: statusTokens.good, icon: CheckCircleIcon },
  // Document signatures
  awaiting: { label: "Awaiting", color: statusTokens.warning, icon: HourglassTopIcon },
  urgent: { label: "Urgent", color: statusTokens.critical, icon: ErrorIcon },
  // Audit / system
  success: { label: "Success", color: statusTokens.good, icon: CheckCircleIcon },
  failed: { label: "Failed", color: statusTokens.critical, icon: CancelIcon },
  running: { label: "Running", color: statusTokens.good, icon: CheckCircleIcon },
  degraded: { label: "Degraded", color: statusTokens.warning, icon: WarningAmberIcon },
};

interface StatusChipProps {
  status: string;
  size?: "small" | "medium";
}

export default function StatusChip({ status, size = "small" }: StatusChipProps) {
  const meta = STATUS_MAP[status] ?? {
    label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    color: "#898781",
    icon: ScheduleIcon,
  };
  const Icon = meta.icon;

  return (
    <Chip
      size={size}
      icon={<Icon style={{ color: meta.color, fontSize: 16 }} />}
      label={meta.label}
      sx={{
        bgcolor: `${meta.color}1a`, // ~10% alpha
        color: meta.color,
        border: "1px solid",
        borderColor: `${meta.color}33`, // ~20% alpha
        "& .MuiChip-icon": { color: meta.color },
      }}
    />
  );
}
