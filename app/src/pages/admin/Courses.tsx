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
import { getCourses, addCourse, updateCourse } from "@/api/courses";
import { getCourseLevel } from "@/demo-data/academics/courses";
import { departmentSeeds } from "@/demo-data/academics/departmentSeeds";
import type { Course, CourseType } from "@/types";

const emptyForm = { id: "", name: "", credits: 3, departmentId: departmentSeeds[0].id, type: "core" as CourseType, description: "" };

export default function Courses() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Course[]>([]);
  const [deptFilter, setDeptFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => getCourses().then(setRows);
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((c) =>
    (deptFilter === "all" || c.departmentId === deptFilter) &&
    (levelFilter === "all" || getCourseLevel(c) === levelFilter) &&
    (search === "" || c.name.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: Course) => { setEditingId(c.id); setForm({ id: c.id, name: c.name, credits: c.credits, departmentId: c.departmentId, type: c.type, description: c.description }); setDialogOpen(true); };

  const handleSave = () => {
    if (editingId) {
      updateCourse(editingId, { name: form.name, credits: form.credits, departmentId: form.departmentId, type: form.type, description: form.description }).then(load);
    } else {
      addCourse({
        id: form.id, name: form.name, credits: form.credits, departmentId: form.departmentId, type: form.type,
        status: "active", instructorFacultyId: "", description: form.description,
        learningOutcomes: [], schedule: [], avgAttendancePct: 0, passRatePct: 0,
      }).then(load);
    }
    setDialogOpen(false);
  };

  return (
    <>
      <PageHeader eyebrow="Academics" title="Course & Curriculum Management" />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Department</InputLabel>
          <Select label="Department" value={deptFilter} onChange={(e: SelectChangeEvent) => setDeptFilter(e.target.value)}>
            <MenuItem value="all">All Departments</MenuItem>
            {departmentSeeds.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Level</InputLabel>
          <Select<number | "all"> label="Level" value={levelFilter} onChange={(e: SelectChangeEvent<number | "all">) => setLevelFilter(e.target.value === "all" ? "all" : Number(e.target.value))}>
            <MenuItem value="all">All Levels</MenuItem>
            <MenuItem value={100}>100 Level</MenuItem>
            <MenuItem value={200}>200 Level</MenuItem>
            <MenuItem value={300}>300 Level</MenuItem>
            <MenuItem value={400}>400 Level</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 220 }} />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" onClick={openAdd}>Add Course</Button>
      </Stack>

      <DataTable<Course>
        pagination
        columns={[
          { key: "id", label: "Course Code" },
          { key: "name", label: "Course Name" },
          { key: "credits", label: "Credits" },
          { key: "departmentId", label: "Department", render: (row) => departmentSeeds.find((d) => d.id === row.departmentId)?.name ?? row.departmentId },
          { key: "type", label: "Type", render: (row) => row.type.charAt(0).toUpperCase() + row.type.slice(1) },
          { key: "status", label: "Status", render: (row) => row.status.charAt(0).toUpperCase() + row.status.slice(1) },
          {
            key: "actions", label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/admin/courses/${row.id}`); }}><VisibilityIcon fontSize="small" /></IconButton>
              </Stack>
            ),
          },
        ]}
        rows={filtered}
        emptyTitle="No courses found"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Course" : "Add Course"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Course Code" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} fullWidth disabled={!!editingId} />
          <TextField label="Credits" type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} fullWidth />
          <TextField label="Course Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select label="Department" value={form.departmentId} onChange={(e: SelectChangeEvent) => setForm({ ...form, departmentId: e.target.value })}>
              {departmentSeeds.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={form.type} onChange={(e: SelectChangeEvent) => setForm({ ...form, type: e.target.value as CourseType })}>
              <MenuItem value="core">Core</MenuItem>
              <MenuItem value="elective">Elective</MenuItem>
              <MenuItem value="lab">Lab</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline minRows={3} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editingId ? "Save Changes" : "Add Course"}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
