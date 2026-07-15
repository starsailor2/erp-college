import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Chip, Paper, Stack, TextField, Typography, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import StatusChip from "@/components/StatusChip";
import EmptyState from "@/components/EmptyState";
import { AssignTaskDialog } from "@/components/staff/AssignTaskDialog";
import { useStaffRole } from "@/context/StaffRoleContext";
import {
  getTaskById, approveTask, rejectTask, deleteTask, resolveHelpRequest,
  startTask, completeTask, submitRequestHelp, submitCannotComplete, assignTask,
} from "@/api/staffTasks";
import { getTeamMembers } from "@/api/staffTeamMembers";
import type { OpsTask, OpsTeamMember } from "@/types";

function isOverdue(task: OpsTask): boolean {
  return task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== "completed";
}

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useStaffRole();
  const [task, setTask] = useState<OpsTask | null | undefined>(undefined);
  const [members, setMembers] = useState<OpsTeamMember[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpReason, setHelpReason] = useState("");
  const [cannotOpen, setCannotOpen] = useState(false);
  const [cannotReason, setCannotReason] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => { if (id) getTaskById(id).then((t) => setTask(t ?? null)); };
  useEffect(() => { load(); getTeamMembers().then(setMembers); }, [id]);

  if (task === undefined) return null;
  if (task === null) return <EmptyState title="Task not found" description="This task may have been deleted." />;

  const assignee = members.find((m) => m.id === task.assigneeId);

  const doDelete = () => {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    deleteTask(task.id).then(() => navigate("/staff/tasks"));
  };

  const doAssign = (assigneeId: string, assigneeName: string, notes: string) => {
    assignTask(task.id, assigneeId, assigneeName, notes || undefined).then(() => { load(); setAssignOpen(false); setSnackbar(`Assigned to ${assigneeName}`); });
  };

  return (
    <>
      <PageHeader
        eyebrow="Task Management"
        title={task.title}
        summary={<StatusChip status={isOverdue(task) ? "overdue" : task.status} />}
        action={
          role === "assigner" ? (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => setAssignOpen(true)}>{task.assigneeId ? "Reassign" : "Assign Task"}</Button>
              {task.status === "completed" && task.approvalStatus === "pending" && (
                <>
                  <Button variant="contained" onClick={() => approveTask(task.id).then(() => { load(); setSnackbar("Task approved"); })}>Approve</Button>
                  <Button variant="outlined" color="error" onClick={() => rejectTask(task.id).then(() => { load(); setSnackbar("Task rejected"); })}>Reject</Button>
                </>
              )}
              <Button variant="outlined" color="error" onClick={doDelete}>Delete</Button>
            </Stack>
          ) : undefined
        }
      />

      {task.needsHelp && (
        <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderLeft: 3, borderColor: "warning.main", bgcolor: "action.hover" }}>
          <Typography variant="subtitle2" fontWeight={600}>⚠️ Help Requested</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>{task.helpNeededReason}</Typography>
          {role === "assigner" && (
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
              <Button size="small" variant="contained" onClick={() => resolveHelpRequest(task.id).then(() => { load(); setSnackbar("Help request resolved"); })}>Mark as Resolved</Button>
              <Button size="small" variant="outlined" onClick={() => setAssignOpen(true)}>Reassign</Button>
            </Stack>
          )}
        </Paper>
      )}
      {task.status === "cannot_complete" && (
        <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderLeft: 3, borderColor: "error.main", bgcolor: "action.hover" }}>
          <Typography variant="subtitle2" fontWeight={600}>🛑 Cannot Complete</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>{task.cannotCompleteReason}</Typography>
          {role === "assigner" && (
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
              <Button size="small" variant="outlined" onClick={() => setAssignOpen(true)}>Reassign</Button>
              <Button size="small" variant="outlined" color="error" onClick={doDelete}>Cancel Task</Button>
            </Stack>
          )}
        </Paper>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 2.5 }}>
        <Paper elevation={0} sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Description</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{task.description}</Typography>

          {role === "executor" && (
            <>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>What You Need To Do</Typography>
              <Box component="ol" sx={{ pl: 2.5, mb: 2 }}>
                {task.staffInstructions.split("\n").map((line, i) => <li key={i}><Typography variant="body2">{line.replace(/^\d+\.\s*/, "")}</Typography></li>)}
              </Box>
            </>
          )}

          {task.notes && (
            <>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Notes</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{task.notes}</Typography>
            </>
          )}

          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Activity Timeline</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {task.timeline.map((entry, i) => (
              <Box key={i} sx={{ display: "flex", gap: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>{entry.time}</Typography>
                <Typography variant="body2">{entry.action}</Typography>
              </Box>
            ))}
          </Box>

          {role === "executor" && task.status !== "completed" && task.status !== "cannot_complete" && (
            <Stack spacing={1.5} sx={{ mt: 3 }}>
              <Stack direction="row" spacing={1.5}>
                {task.status === "pending" && <Button variant="contained" onClick={() => startTask(task.id).then(() => { load(); setSnackbar("Task started"); })}>Start Working</Button>}
                {task.status === "in_progress" && <Button variant="contained" onClick={() => completeTask(task.id).then(() => { load(); setSnackbar("Task marked as done"); })}>Mark as Done</Button>}
                <Button variant="outlined" color="warning" onClick={() => setHelpOpen(!helpOpen)}>Request Help</Button>
                <Button variant="outlined" color="error" onClick={() => setCannotOpen(!cannotOpen)}>Cannot Complete</Button>
              </Stack>
              {helpOpen && (
                <Stack spacing={1}>
                  <TextField label="Why do you need help?" fullWidth multiline minRows={2} value={helpReason} onChange={(e) => setHelpReason(e.target.value)} />
                  <Button variant="contained" onClick={() => {
                    if (!helpReason) { setSnackbar("Please describe why you need help"); return; }
                    submitRequestHelp(task.id, helpReason).then(() => { load(); setHelpOpen(false); setHelpReason(""); setSnackbar("Help request sent"); });
                  }}>Send Help Request</Button>
                </Stack>
              )}
              {cannotOpen && (
                <Stack spacing={1}>
                  <TextField label="Why can't this be completed?" fullWidth multiline minRows={2} value={cannotReason} onChange={(e) => setCannotReason(e.target.value)} />
                  <Button variant="contained" color="error" onClick={() => {
                    if (!cannotReason) { setSnackbar("Please describe the issue"); return; }
                    submitCannotComplete(task.id, cannotReason).then(() => { load(); setCannotOpen(false); setCannotReason(""); setSnackbar("Issue submitted"); });
                  }}>Submit Issue</Button>
                </Stack>
              )}
            </Stack>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 3, height: "fit-content" }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Task Info</Typography>
          <Stack spacing={1.5}>
            <Box><Typography variant="caption" color="text.secondary">ID</Typography><Typography variant="body2">{task.id}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Assigned To</Typography><Typography variant="body2">{assignee?.name ?? "Unassigned"}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Category</Typography><Typography variant="body2" sx={{ textTransform: "capitalize" }}>{task.category}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Priority</Typography><Chip size="small" label={task.priority} /></Box>
            <Box><Typography variant="caption" color="text.secondary">Due Date</Typography><Typography variant="body2">{task.dueDate}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Created</Typography><Typography variant="body2">{task.createdAt}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Est. Hours</Typography><Typography variant="body2">{task.estimatedHours}</Typography></Box>
            {task.approvalStatus && <Box><Typography variant="caption" color="text.secondary">Approval</Typography><StatusChip status={task.approvalStatus} /></Box>}
          </Stack>
        </Paper>
      </Box>

      <AssignTaskDialog open={assignOpen} taskTitle={task.title} onClose={() => setAssignOpen(false)} onConfirm={doAssign} />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
