import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, IconButton, type SelectChangeEvent,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getUsers, addUser, updateUser } from "@/api/users";
import { getDepartmentById } from "@/demo-data/academics/departments";
import { departmentSeeds } from "@/demo-data/academics/departmentSeeds";
import type { AdminUser, UserRole, AccountStatus } from "@/types";

const emptyForm = { name: "", email: "", role: "faculty" as UserRole, departmentId: departmentSeeds[0].id, phone: "", employeeId: "" };

export default function Users() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => getUsers().then(setRows);
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((u) =>
    (roleFilter === "all" || u.role === roleFilter) &&
    (deptFilter === "all" || u.departmentId === deptFilter) &&
    (statusFilter === "all" || u.status === statusFilter) &&
    (search === "" || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setForm({ name: user.name, email: user.email, role: user.role, departmentId: user.departmentId, phone: user.phone, employeeId: user.employeeId });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      updateUser(editingId, form).then(load);
    } else {
      addUser({ id: `USR-${String(rows.length + 1).padStart(3, "0")}`, ...form, status: "active", lastLogin: new Date().toISOString() }).then(load);
    }
    setDialogOpen(false);
  };

  return (
    <>
      <PageHeader eyebrow="Administration" title="Users" />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Role</InputLabel>
          <Select label="Role" value={roleFilter} onChange={(e: SelectChangeEvent) => setRoleFilter(e.target.value as UserRole | "all")}>
            <MenuItem value="all">All Roles</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="faculty">Faculty</MenuItem>
            <MenuItem value="student">Student</MenuItem>
            <MenuItem value="staff">Staff</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Department</InputLabel>
          <Select label="Department" value={deptFilter} onChange={(e: SelectChangeEvent) => setDeptFilter(e.target.value)}>
            <MenuItem value="all">All Departments</MenuItem>
            {departmentSeeds.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value as AccountStatus | "all")}>
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="on_leave">On Leave</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 220 }} />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" onClick={openAdd}>Add User</Button>
      </Stack>

      <DataTable<AdminUser>
        pagination
        columns={[
          { key: "id", label: "User ID" },
          { key: "name", label: "Name" },
          { key: "role", label: "Role", render: (row) => row.role.charAt(0).toUpperCase() + row.role.slice(1) },
          { key: "departmentId", label: "Department", render: (row) => getDepartmentById(row.departmentId)?.name ?? row.departmentId },
          { key: "email", label: "Email" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          { key: "lastLogin", label: "Last Login", render: (row) => new Date(row.lastLogin).toLocaleString() },
          {
            key: "actions", label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/admin/users/${row.id}`); }}><VisibilityIcon fontSize="small" /></IconButton>
              </Stack>
            ),
          },
        ]}
        rows={filtered}
        emptyTitle="No users found"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit User" : "Add User"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={form.role} onChange={(e: SelectChangeEvent) => setForm({ ...form, role: e.target.value as UserRole })}>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="faculty">Faculty</MenuItem>
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="staff">Staff</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select label="Department" value={form.departmentId} onChange={(e: SelectChangeEvent) => setForm({ ...form, departmentId: e.target.value })}>
              {departmentSeeds.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
          <TextField label="Employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editingId ? "Save Changes" : "Add User"}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
