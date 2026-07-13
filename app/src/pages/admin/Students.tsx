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
import { getStudents, addStudent, updateStudent } from "@/api/students";
import { programByDepartment, departmentSeeds } from "@/demo-data/academics/departmentSeeds";
import type { Student } from "@/types";

const programs = Object.values(programByDepartment);
const emptyForm = { name: "", email: "", phone: "", program: programs[0], year: 1 as 1 | 2 | 3 | 4, address: "" };

export default function Students() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Student[]>([]);
  const [programFilter, setProgramFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => getStudents().then(setRows);
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((s) =>
    (programFilter === "all" || s.program === programFilter) &&
    (yearFilter === "all" || s.year === yearFilter) &&
    (search === "" || s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (s: Student) => { setEditingId(s.id); setForm({ name: s.name, email: s.email, phone: s.phone, program: s.program, year: s.year, address: s.address }); setDialogOpen(true); };

  const handleSave = () => {
    if (editingId) {
      updateStudent(editingId, { name: form.name, email: form.email, phone: form.phone, program: form.program, year: form.year, address: form.address }).then(load);
    } else {
      const dept = departmentSeeds.find((d) => programByDepartment[d.id] === form.program) ?? departmentSeeds[0];
      const admissionYear = 2026 - (form.year - 1);
      const seq = rows.length + 1;
      addStudent({
        id: `STU-${String(seq).padStart(4, "0")}`,
        rollNo: `${admissionYear}-${dept.id}-${String(seq).padStart(3, "0")}`,
        name: form.name, email: form.email, phone: form.phone,
        departmentId: dept.id, program: form.program, year: form.year,
        semester: form.year * 2 - 1, batch: `${admissionYear}-${admissionYear + 4}`,
        enrollmentDate: `${admissionYear}-08-01`, status: "regular",
        attendancePct: 100, cgpa: 0, feeStatus: "pending",
        address: form.address, guardianName: "", guardianContact: "", courseIds: [],
      }).then(load);
    }
    setDialogOpen(false);
  };

  return (
    <>
      <PageHeader eyebrow="Academics" title="Student Master" />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 190 }}>
          <InputLabel>Program</InputLabel>
          <Select label="Program" value={programFilter} onChange={(e: SelectChangeEvent) => setProgramFilter(e.target.value)}>
            <MenuItem value="all">All Programs</MenuItem>
            {programs.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Year</InputLabel>
          <Select<number | "all"> label="Year" value={yearFilter} onChange={(e: SelectChangeEvent<number | "all">) => setYearFilter(e.target.value === "all" ? "all" : Number(e.target.value))}>
            <MenuItem value="all">All Years</MenuItem>
            <MenuItem value={1}>1st Year</MenuItem>
            <MenuItem value={2}>2nd Year</MenuItem>
            <MenuItem value={3}>3rd Year</MenuItem>
            <MenuItem value={4}>4th Year</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 220 }} />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" onClick={openAdd}>Add Student</Button>
      </Stack>

      <DataTable<Student>
        pagination
        columns={[
          { key: "rollNo", label: "Roll No" },
          { key: "name", label: "Student Name" },
          { key: "program", label: "Program" },
          { key: "year", label: "Year", render: (row) => `${row.year}${row.year === 1 ? "st" : row.year === 2 ? "nd" : row.year === 3 ? "rd" : "th"} Year` },
          { key: "attendancePct", label: "Attendance %", render: (row) => `${row.attendancePct}%` },
          { key: "cgpa", label: "CGPA" },
          { key: "feeStatus", label: "Fee Status", render: (row) => <StatusChip status={row.feeStatus} /> },
          { key: "status", label: "Academic Status", render: (row) => <StatusChip status={row.status} /> },
          {
            key: "actions", label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/admin/students/${row.id}`); }}><VisibilityIcon fontSize="small" /></IconButton>
              </Stack>
            ),
          },
        ]}
        rows={filtered}
        emptyTitle="No students found"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Student" : "Add Student"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Student Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth />
          <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Program</InputLabel>
            <Select label="Program" value={form.program} onChange={(e: SelectChangeEvent) => setForm({ ...form, program: e.target.value })}>
              {programs.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Year</InputLabel>
            <Select<1 | 2 | 3 | 4> label="Year" value={form.year} onChange={(e: SelectChangeEvent<1 | 2 | 3 | 4>) => setForm({ ...form, year: Number(e.target.value) as 1 | 2 | 3 | 4 })}>
              <MenuItem value={1}>1st Year</MenuItem>
              <MenuItem value={2}>2nd Year</MenuItem>
              <MenuItem value={3}>3rd Year</MenuItem>
              <MenuItem value={4}>4th Year</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} fullWidth multiline minRows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editingId ? "Save Changes" : "Add Student"}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
