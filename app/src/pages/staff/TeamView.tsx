import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Box, Button, Grid, Paper, Typography } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { getTeamMembers } from "@/api/staffTeamMembers";
import { getTasks } from "@/api/staffTasks";
import type { OpsTask, OpsTeamMember } from "@/types";

export default function TeamView() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<OpsTeamMember[]>([]);
  const [tasks, setTasks] = useState<OpsTask[]>([]);

  useEffect(() => {
    getTeamMembers().then(setMembers);
    getTasks().then(setTasks);
  }, []);

  return (
    <>
      <PageHeader eyebrow="Team" title="Team View" />
      <Grid container spacing={2.5}>
        {members.map((m) => {
          const assigned = tasks.filter((t) => t.assigneeId === m.id);
          const active = assigned.filter((t) => t.status === "pending" || t.status === "in_progress").length;
          const done = assigned.filter((t) => t.status === "completed").length;
          return (
            <Grid key={m.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper elevation={0} sx={{ p: 2.5, textAlign: "center", height: "100%" }}>
                <Avatar sx={{ width: 56, height: 56, mx: "auto", mb: 1.5, fontWeight: 700 }}>{m.avatar}</Avatar>
                <Typography variant="subtitle1" fontWeight={600}>{m.name}</Typography>
                <Typography variant="body2" color="text.secondary">{m.role}</Typography>
                <Typography variant="caption" color="text.secondary">{m.department}</Typography>
                <Box sx={{ display: "flex", justifyContent: "center", gap: 3, my: 1.5 }}>
                  <Box><Typography variant="h6" fontWeight={700}>{active}</Typography><Typography variant="caption" color="text.secondary">Active</Typography></Box>
                  <Box><Typography variant="h6" fontWeight={700}>{done}</Typography><Typography variant="caption" color="text.secondary">Done</Typography></Box>
                </Box>
                <Button variant="outlined" size="small" onClick={() => navigate(`/staff/tasks?assignee=${m.id}`)}>View Tasks</Button>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </>
  );
}
