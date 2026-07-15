import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Paper, Grid, Snackbar, type SelectChangeEvent } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { addTask } from "@/api/staffTasks";
import type { TaskCategory, TaskPriority } from "@/types";

const emptyForm = {
  title: "", description: "", priority: "medium" as TaskPriority, dueDate: "",
  category: "maintenance" as TaskCategory, estimatedHours: 1, staffInstructions: "",
};

export default function CreateTask() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!form.title) { setSnackbar("Task title is required"); return; }
    addTask(form).then(() => {
      setSnackbar("Task created successfully");
      navigate("/staff/assign-task");
    });
  };

  return (
    <>
      <PageHeader eyebrow="Task Management" title="Create Task" />
      <Paper elevation={0} sx={{ p: 3 }}>
        <Grid container spacing={2.5}>
          <Grid size={12}><TextField label="Task Title" fullWidth required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Grid>
          <Grid size={12}><TextField label="Description" fullWidth multiline minRows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select label="Priority" value={form.priority} onChange={(e: SelectChangeEvent) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Due Date" type="date" fullWidth value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select label="Category" value={form.category} onChange={(e: SelectChangeEvent) => setForm({ ...form, category: e.target.value as TaskCategory })}>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="administrative">Administrative</MenuItem>
                <MenuItem value="facilities">Facilities</MenuItem>
                <MenuItem value="supplies">Supplies</MenuItem>
                <MenuItem value="events">Events</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Estimated Hours" type="number" fullWidth value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: Number(e.target.value) })} /></Grid>
          <Grid size={12}><TextField label="Instructions for Staff" fullWidth multiline minRows={3} value={form.staffInstructions} onChange={(e) => setForm({ ...form, staffInstructions: e.target.value })} /></Grid>
        </Grid>
        <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
          <Button variant="contained" onClick={handleSubmit}>Create Task</Button>
          <Button variant="outlined" onClick={() => setForm(emptyForm)}>Cancel</Button>
        </Stack>
      </Paper>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>New tasks are created unassigned — assign them from the Assign Task page.</Typography>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
