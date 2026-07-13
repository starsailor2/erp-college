import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { getDepartments, addDepartment, updateDepartment } from "@/api/departments";
import { getFacultyById, getFacultyByDepartment } from "@/demo-data/people/faculty";
import { getStudentsByDepartment } from "@/demo-data/people/students";
import type { Department } from "@/types";

const emptyForm = { name: "", id: "", hodFacultyId: "", building: "" };

export default function Departments() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => getDepartments().then(setRows);
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((d) => search === "" || d.name.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (d: Department) => { setEditingId(d.id); setForm({ name: d.name, id: d.id, hodFacultyId: d.hodFacultyId, building: d.building }); setDialogOpen(true); };

  const handleSave = () => {
    if (editingId) {
      updateDepartment(editingId, { name: form.name, hodFacultyId: form.hodFacultyId, building: form.building }).then(load);
    } else {
      addDepartment({
        id: form.id, name: form.name, hodFacultyId: form.hodFacultyId, building: form.building,
        budgetLakh: 150, status: "active", avgClassSize: 30, passRatePct: 90,
        researchPapers: 10, avgAttendancePct: 85, avgMarksPct: 75, atRiskStudentCount: 5,
      }).then(load);
    }
    setDialogOpen(false);
  };

  return (
    <>
      <PageHeader eyebrow="Administration" title="Departments" />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <TextField size="small" placeholder="Search departments..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 260 }} />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" onClick={openAdd}>Add Department</Button>
      </Stack>

      <DataTable<Department>
        columns={[
          { key: "id", label: "Dept Code" },
          { key: "name", label: "Department Name" },
          { key: "hodFacultyId", label: "HOD", render: (row) => getFacultyById(row.hodFacultyId)?.name ?? "—" },
          { key: "facultyCount", label: "Faculty Count", render: (row) => getFacultyByDepartment(row.id).length },
          { key: "studentCount", label: "Student Count", render: (row) => getStudentsByDepartment(row.id).length },
          { key: "budgetLakh", label: "Budget", render: (row) => `₹${(row.budgetLakh / 100).toFixed(1)} Cr` },
          { key: "status", label: "Status", render: (row) => row.status.charAt(0).toUpperCase() + row.status.slice(1) },
          {
            key: "actions", label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/admin/departments/${row.id}`); }}><VisibilityIcon fontSize="small" /></IconButton>
              </Stack>
            ),
          },
        ]}
        rows={filtered}
        emptyTitle="No departments found"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Department" : "Add Department"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Department Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField label="Department Code" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} fullWidth disabled={!!editingId} />
          <FormControl fullWidth>
            <InputLabel>Head of Department</InputLabel>
            <Select label="Head of Department" value={form.hodFacultyId} onChange={(e) => setForm({ ...form, hodFacultyId: e.target.value })}>
              {getFacultyByDepartment(form.id).map((f) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Building" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editingId ? "Save Changes" : "Add Department"}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
