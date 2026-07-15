import { useEffect, useMemo, useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography, Snackbar, type SelectChangeEvent } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getStudentMessages, markMessageRead, sendStudentMessage } from "@/api/studentMessages";
import type { StudentMessage } from "@/types";
import ChatIcon from "@mui/icons-material/Chat";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";

const categories = ["all", "academic", "hostel", "placement", "library"];
const quickContacts: { label: string; recipient: string }[] = [
  { label: "Instructor", recipient: "Instructor" },
  { label: "Warden", recipient: "Warden" },
  { label: "Placement Cell", recipient: "Placement Cell" },
  { label: "Library", recipient: "Library" },
  { label: "Admin", recipient: "Admin Office" },
];

export default function Messages() {
  const { mode } = useColorMode();
  const [messages, setMessages] = useState<StudentMessage[]>([]);
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<StudentMessage | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [recipient, setRecipient] = useState("Instructor");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getStudentMessages().then(setMessages);
  useEffect(() => { load(); }, []);

  const visible = useMemo(() => (category === "all" ? messages : messages.filter((m) => m.category === category)), [messages, category]);
  const unreadCount = messages.filter((m) => !m.read).length;

  const handleOpen = (message: StudentMessage) => {
    setSelected(message);
    if (!message.read) markMessageRead(message.id).then(load);
  };

  const openCompose = (prefillRecipient?: string) => {
    setRecipient(prefillRecipient ?? "Instructor");
    setSubject("");
    setBody("");
    setComposeOpen(true);
  };

  const handleSend = () => {
    if (!subject || !body) { setSnackbar("Please fill in subject and message"); return; }
    sendStudentMessage(recipient, subject, "academic", body).then(() => { load(); setComposeOpen(false); setSnackbar("Message sent"); });
  };

  return (
    <>
      <PageHeader eyebrow="Communication" title="Messages" action={<Button variant="contained" onClick={() => openCompose()}>Compose</Button>} />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatCard title="Total Messages" icon={<ChatIcon />} color={getIconAccent(mode, "messages")} numericValue={messages.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatCard title="Unread" icon={<MarkEmailUnreadIcon />} color={getIconAccent(mode, "unread-messages")} numericValue={unreadCount} />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, flexWrap: "wrap", gap: 1 }}>
        {quickContacts.map((c) => <Button key={c.recipient} variant="outlined" size="small" onClick={() => openCompose(c.recipient)}>{c.label}</Button>)}
      </Stack>

      <ToggleButtonGroup exclusive value={category} onChange={(_, v) => v && setCategory(v)} sx={{ mb: 2.5 }}>
        {categories.map((c) => <ToggleButton key={c} value={c} size="small" sx={{ textTransform: "capitalize" }}>{c}</ToggleButton>)}
      </ToggleButtonGroup>

      <Stack spacing={2}>
        {visible.length === 0 && <Typography variant="body2" color="text.secondary">No messages in this category.</Typography>}
        {visible.map((m) => (
          <Paper key={m.id} elevation={0} sx={{ p: 2.5, cursor: "pointer" }} onClick={() => handleOpen(m)}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="subtitle2" fontWeight={600}>{m.subject}</Typography>
              <StatusChip status={m.read ? "read" : "unread"} />
            </Stack>
            <Typography variant="caption" color="text.secondary">{m.from} · {m.timeAgo}</Typography>
          </Paper>
        ))}
      </Stack>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected?.subject}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{selected?.from} · {selected?.timeAgo}</Typography>
          <Typography variant="body2">{selected?.body}</Typography>
        </DialogContent>
        <DialogActions><Button onClick={() => setSelected(null)}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Compose Message</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Recipient</InputLabel>
              <Select label="Recipient" value={recipient} onChange={(e: SelectChangeEvent) => setRecipient(e.target.value)}>
                {quickContacts.map((c) => <MenuItem key={c.recipient} value={c.recipient}>{c.recipient}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Subject" fullWidth value={subject} onChange={(e) => setSubject(e.target.value)} />
            <TextField label="Message" fullWidth multiline minRows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComposeOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSend}>Send</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
