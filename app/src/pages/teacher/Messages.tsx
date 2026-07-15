import { useEffect, useState } from "react";
import { Box, Button, TextField, Typography, Paper, Stack, List, ListItemButton, ListItemText, Avatar } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { PageHeader } from "@/components/PageHeader";
import { getMessageContacts, getMessagesForContact, sendMessage } from "@/api/teacherMessages";
import type { MessageContact, Message } from "@/types";

export default function Messages() {
  const [contacts, setContacts] = useState<MessageContact[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    getMessageContacts().then((data) => {
      setContacts(data);
      if (data.length > 0) setActiveId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (activeId) getMessagesForContact(activeId).then(setThread);
  }, [activeId]);

  const handleSend = () => {
    if (!activeId || !draft.trim()) return;
    sendMessage(activeId, draft).then(() => {
      getMessagesForContact(activeId).then(setThread);
      setDraft("");
    });
  };

  const activeContact = contacts.find((c) => c.id === activeId);

  return (
    <>
      <PageHeader eyebrow="Communication" title="Messages" />
      <Paper elevation={0} sx={{ display: "flex", height: 520, overflow: "hidden" }}>
        <Box sx={{ width: 280, borderRight: 1, borderColor: "divider", overflowY: "auto" }}>
          <List disablePadding>
            {contacts.map((c) => (
              <ListItemButton key={c.id} selected={c.id === activeId} onClick={() => setActiveId(c.id)}>
                <Avatar sx={{ width: 32, height: 32, mr: 1.5, fontSize: 14 }}>{c.name[0]}</Avatar>
                <ListItemText primary={c.name} secondary={c.role} />
              </ListItemButton>
            ))}
          </List>
        </Box>
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="subtitle1" fontWeight={600}>{activeContact?.name}</Typography>
            <Typography variant="caption" color="text.secondary">{activeContact?.role}</Typography>
          </Box>
          <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
            {thread.map((m) => (
              <Box key={m.id} sx={{ alignSelf: m.fromMe ? "flex-end" : "flex-start", maxWidth: "70%" }}>
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: m.fromMe ? "primary.main" : "action.hover", color: m.fromMe ? "primary.contrastText" : "text.primary" }}>
                  <Typography variant="body2">{m.text}</Typography>
                </Paper>
                <Typography variant="caption" color="text.secondary">{m.timestamp}</Typography>
              </Box>
            ))}
          </Box>
          <Stack direction="row" spacing={1} sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <TextField size="small" fullWidth placeholder="Type a message..." value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} />
            <Button variant="contained" onClick={handleSend} startIcon={<SendIcon />}>Send</Button>
          </Stack>
        </Box>
      </Paper>
    </>
  );
}
