import { useEffect, useState } from "react";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, IconButton, Grid, Chip, Typography,
  type SelectChangeEvent,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PeopleIcon from "@mui/icons-material/People";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getFaculty, addFaculty, updateFaculty } from "@/api/faculty";
import { getDepartmentById } from "@/demo-data/academics/departments";
import { departmentSeeds } from "@/demo-data/academics/departmentSeeds";
import type { Faculty, FacultyDesignation, AccountStatus } from "@/types";

const designationLabels: Record<FacultyDesignation, string> = {
  professor: "Professor",
  associate_professor: "Associate Professor",
  assistant_professor: "Assistant Professor",
  lecturer: "Lecturer",
};

const emptyForm = {
  id: "", name: "", departmentId: departmentSeeds[0].id, designation: "assistant_professor" as FacultyDesignation,
  email: "", phone: "", joiningDate: "", qualification: "", specialization: "",
};

export default function FacultyPage() {
  const { mode } = useColorMode();
  const [rows, setRows] = useState<Faculty[]>([]);
  const [designationFilter, setDesignationFilter] = useState<FacultyDesignation | "all">("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewing, setViewing] = useState<Faculty | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => getFaculty().then(setRows);
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((f) =>
    (designationFilter === "all" || f.designation === designationFilter) &&
    (deptFilter === "all" || f.departmentId === deptFilter) &&
    (statusFilter === "all" || f.status === statusFilter) &&
    (search === "" || f.name.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = {
    total: rows.length,
    professor: rows.filter((f) => f.designation === "professor").length,
    associate: rows.filter((f) => f.designation === "associate_professor").length,
    assistant: rows.filter((f) => f.designation === "assistant_professor").length,
  };

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (f: Faculty) => {
    setEditingId(f.id);
    setForm({ id: f.id, name: f.name, departmentId: f.departmentId, designation: f.designation, email: f.email, phone: f.phone, joiningDate: f.joiningDate, qualification: f.qualification, specialization: f.specialization });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      updateFaculty(editingId, form).then(load);
    } else {
      addFaculty({
        ...form,
        id: form.id || `FAC${String(rows.length + 1).padStart(3, "0")}`,
        experienceYears: 2026 - parseInt(form.joiningDate.slice(0, 4) || "2026", 10),
        status: "active",
        coursesTeaching: [],
      }).then(load);
    }
    setDialogOpen(false);
  };

  return (
    <>
      <PageHeader eyebrow="Administration" title="Faculty" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Faculty" icon={<PeopleIcon />} color={getIconAccent(mode, "faculty")} numericValue={counts.total} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Professors" icon={<WorkspacePremiumIcon />} color={getIconAccent(mode, "professors")} numericValue={counts.professor} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Associate Professors" icon={<WorkspacePremiumIcon />} color={getIconAccent(mode, "associate-professors")} numericValue={counts.associate} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Assistant Professors" icon={<WorkspacePremiumIcon />} color={getIconAccent(mode, "assistant-professors")} numericValue={counts.assistant} />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 190 }}>
          <InputLabel>Designation</InputLabel>
          <Select label="Designation" value={designationFilter} onChange={(e: SelectChangeEvent) => setDesignationFilter(e.target.value as FacultyDesignation | "all")}>
            <MenuItem value="all">All Designations</MenuItem>
            {Object.entries(designationLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
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
            <MenuItem value="on_leave">On Leave</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Search faculty..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 220 }} />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" onClick={openAdd}>Add Faculty</Button>
      </Stack>

      <DataTable<Faculty>
        pagination
        columns={[
          { key: "id", label: "Faculty ID" },
          { key: "name", label: "Name" },
          { key: "departmentId", label: "Department", render: (row) => getDepartmentById(row.departmentId)?.name ?? row.departmentId },
          { key: "designation", label: "Designation", render: (row) => designationLabels[row.designation] },
          { key: "email", label: "Contact" },
          { key: "joiningDate", label: "Joining Date" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          {
            key: "actions", label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); setViewing(row); }}><VisibilityIcon fontSize="small" /></IconButton>
              </Stack>
            ),
          },
        ]}
        rows={filtered}
        emptyTitle="No faculty found"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Faculty" : "Add Faculty"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Faculty ID" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} fullWidth disabled={!!editingId} />
          <TextField label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select label="Department" value={form.departmentId} onChange={(e: SelectChangeEvent) => setForm({ ...form, departmentId: e.target.value })}>
              {departmentSeeds.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Designation</InputLabel>
            <Select label="Designation" value={form.designation} onChange={(e: SelectChangeEvent) => setForm({ ...form, designation: e.target.value as FacultyDesignation })}>
              {Object.entries(designationLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth />
          <TextField label="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
          <TextField label="Joining Date" type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="Qualification" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} fullWidth />
          <TextField label="Specialization" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} fullWidth multiline minRows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editingId ? "Save Changes" : "Add Faculty"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!viewing} onClose={() => setViewing(null)} maxWidth="sm" fullWidth>
        {viewing && (
          <>
            <DialogTitle>Faculty Details - {viewing.id}</DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Typography variant="body2"><strong>Name:</strong> {viewing.name}</Typography>
              <Typography variant="body2"><strong>Designation:</strong> {designationLabels[viewing.designation]}</Typography>
              <Typography variant="body2"><strong>Department:</strong> {getDepartmentById(viewing.departmentId)?.name}</Typography>
              <Typography variant="body2"><strong>Email:</strong> {viewing.email}</Typography>
              <Typography variant="body2"><strong>Phone:</strong> {viewing.phone}</Typography>
              <Typography variant="body2"><strong>Qualification:</strong> {viewing.qualification}</Typography>
              <Typography variant="body2"><strong>Experience:</strong> {viewing.experienceYears} years</Typography>
              <Box><StatusChip status={viewing.status} /></Box>
              <Typography variant="body2" color="text.secondary">{viewing.specialization}</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {viewing.coursesTeaching.map((c) => <Chip key={c} size="small" label={c} />)}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewing(null)}>Close</Button>
              <Button variant="contained" onClick={() => { openEdit(viewing); setViewing(null); }}>Edit Faculty</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
