import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Paper, Typography, Stack, Chip, Button } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import StatusChip from "@/components/StatusChip";
import EmptyState from "@/components/EmptyState";
import { getUserByIdAsync } from "@/api/users";
import { getDepartmentById } from "@/demo-data/academics/departments";
import type { AdminUser } from "@/types";

const permissions = [
  { label: "View Students", granted: true },
  { label: "Manage Attendance", granted: true },
  { label: "Submit Grades", granted: true },
  { label: "Manage Users", granted: false },
  { label: "System Settings", granted: false },
];

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    if (id) getUserByIdAsync(id).then((data) => { if (live) { setUser(data); setLoaded(true); } });
    return () => { live = false; };
  }, [id]);

  if (loaded && !user) {
    return <EmptyState title="User not found" description={`No user with id "${id}".`} />;
  }
  if (!user) return null;

  return (
    <>
      <PageHeader
        eyebrow="Users"
        title={user.name}
        breadcrumbs={[{ label: "Users", to: "/admin/users" }, { label: user.name }]}
        action={<Button variant="outlined" color="error" onClick={() => navigate("/admin/users")}>Deactivate</Button>}
      />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={4}>
          <Box><Typography variant="caption" color="text.secondary">User ID</Typography><Typography variant="body1">{user.id}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Email</Typography><Typography variant="body1">{user.email}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Role</Typography><Typography variant="body1" sx={{ textTransform: "capitalize" }}>{user.role}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Department</Typography><Typography variant="body1">{getDepartmentById(user.departmentId)?.name ?? user.departmentId}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Status</Typography><Box sx={{ mt: 0.5 }}><StatusChip status={user.status} /></Box></Box>
          <Box><Typography variant="caption" color="text.secondary">Last Login</Typography><Typography variant="body1">{new Date(user.lastLogin).toLocaleString()}</Typography></Box>
        </Stack>
      </Paper>
      <Paper elevation={0} sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>User Permissions</Typography>
        <Stack spacing={1.5}>
          {permissions.map((p) => (
            <Stack key={p.label} direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">{p.label}</Typography>
              <Chip size="small" label={p.granted ? "Granted" : "Denied"} color={p.granted ? "success" : "error"} variant="outlined" />
            </Stack>
          ))}
        </Stack>
      </Paper>
    </>
  );
}
