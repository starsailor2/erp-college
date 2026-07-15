import { useEffect, useMemo, useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getStudentNotices, markNoticeRead, markAllNoticesRead } from "@/api/studentNotices";
import type { StudentNotice, StudentNoticeCategory } from "@/types";
import CampaignIcon from "@mui/icons-material/Campaign";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const categories: { label: string; value: StudentNoticeCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Academic", value: "academic" },
  { label: "Hostel", value: "hostel" },
  { label: "Placement", value: "placement" },
  { label: "Library", value: "library" },
  { label: "General", value: "general" },
];

export default function Notices() {
  const { mode } = useColorMode();
  const [notices, setNotices] = useState<StudentNotice[]>([]);
  const [category, setCategory] = useState<StudentNoticeCategory | "all">("all");
  const [selected, setSelected] = useState<StudentNotice | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getStudentNotices().then(setNotices);
  useEffect(() => { load(); }, []);

  const visible = useMemo(() => (category === "all" ? notices : notices.filter((n) => n.category === category)), [notices, category]);
  const unreadCount = notices.filter((n) => !n.read).length;
  const urgentCount = notices.filter((n) => n.urgency === "urgent").length;

  const handleOpen = (notice: StudentNotice) => {
    setSelected(notice);
    if (!notice.read) markNoticeRead(notice.id).then(load);
  };

  return (
    <>
      <PageHeader
        eyebrow="Communication"
        title="Notices"
        action={<Button variant="outlined" onClick={() => markAllNoticesRead().then(() => { load(); setSnackbar("All notices marked as read"); })}>Mark all read</Button>}
      />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Total Notices" icon={<CampaignIcon />} color={getIconAccent(mode, "notices")} numericValue={notices.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Unread" icon={<MarkEmailUnreadIcon />} color={getIconAccent(mode, "unread")} numericValue={unreadCount} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Urgent" icon={<WarningAmberIcon />} color={getIconAccent(mode, "urgent")} numericValue={urgentCount} />
        </Grid>
      </Grid>

      <ToggleButtonGroup exclusive value={category} onChange={(_, v) => v && setCategory(v)} sx={{ mb: 2.5, flexWrap: "wrap" }}>
        {categories.map((c) => <ToggleButton key={c.value} value={c.value} size="small">{c.label}</ToggleButton>)}
      </ToggleButtonGroup>

      <Stack spacing={2}>
        {visible.length === 0 && <Typography variant="body2" color="text.secondary">No notices in this category.</Typography>}
        {visible.map((n) => (
          <Paper key={n.id} elevation={0} sx={{ p: 2.5, cursor: "pointer" }} onClick={() => handleOpen(n)}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="subtitle2" fontWeight={600}>{n.title}</Typography>
              <Stack direction="row" spacing={1}>
                <StatusChip status={n.urgency} />
                <StatusChip status={n.read ? "read" : "unread"} />
              </Stack>
            </Stack>
            <Typography variant="caption" color="text.secondary">{n.author} · {n.date}</Typography>
          </Paper>
        ))}
      </Stack>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected?.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{selected?.author} · {selected?.date}</Typography>
          <Typography variant="body2">{selected?.body}</Typography>
        </DialogContent>
        <DialogActions><Button onClick={() => setSelected(null)}>Close</Button></DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
