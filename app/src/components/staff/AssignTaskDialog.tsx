import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem, TextField, Stack, type SelectChangeEvent } from "@mui/material";
import { getTeamMembers } from "@/api/staffTeamMembers";
import type { OpsTeamMember } from "@/types";

interface AssignTaskDialogProps {
  open: boolean;
  taskTitle: string;
  onClose: () => void;
  onConfirm: (assigneeId: string, assigneeName: string, notes: string) => void;
}

export function AssignTaskDialog({ open, taskTitle, onClose, onConfirm }: AssignTaskDialogProps) {
  const [members, setMembers] = useState<OpsTeamMember[]>([]);
  const [assigneeId, setAssigneeId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) getTeamMembers().then(setMembers);
  }, [open]);

  const handleConfirm = () => {
    const member = members.find((m) => m.id === assigneeId);
    if (!member) return;
    onConfirm(member.id, member.name, notes);
    setAssigneeId("");
    setNotes("");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Task</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField label="Task" value={taskTitle} disabled fullWidth />
          <FormControl fullWidth>
            <InputLabel>Assign To</InputLabel>
            <Select label="Assign To" value={assigneeId} onChange={(e: SelectChangeEvent) => setAssigneeId(e.target.value)}>
              {members.map((m) => <MenuItem key={m.id} value={m.id}>{m.name} — {m.role}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Notes (optional)" fullWidth multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!assigneeId} onClick={handleConfirm}>Assign</Button>
      </DialogActions>
    </Dialog>
  );
}
