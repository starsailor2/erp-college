import { useState } from "react";
import { Button, MenuItem, Select, InputLabel, FormControl, Typography, Paper, Snackbar, type SelectChangeEvent } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";

const courses = ["CS201", "CS202", "CS203", "CS204"];

const materials = [
  { file: "Lecture1_Intro.pdf", course: "CS201", type: "PDF", size: "2.4 MB", uploaded: "2026-06-01" },
  { file: "Lab_Manual_Unit2.docx", course: "CS202", type: "DOCX", size: "1.1 MB", uploaded: "2026-06-05" },
  { file: "Assignment3_Spec.pdf", course: "CS203", type: "PDF", size: "0.8 MB", uploaded: "2026-06-10" },
  { file: "Reference_Slides.pptx", course: "CS201", type: "PPTX", size: "5.2 MB", uploaded: "2026-06-12" },
  { file: "Practice_Problems.pdf", course: "CS204", type: "PDF", size: "1.6 MB", uploaded: "2026-06-15" },
];

export default function CourseMaterials() {
  const [courseFilter, setCourseFilter] = useState("all");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const filtered = materials.filter((m) => courseFilter === "all" || m.course === courseFilter);

  return (
    <>
      <PageHeader eyebrow="Academics" title="Course Materials" />
      <FormControl size="small" sx={{ minWidth: 180, mb: 2 }}>
        <InputLabel>Course</InputLabel>
        <Select label="Course" value={courseFilter} onChange={(e: SelectChangeEvent) => setCourseFilter(e.target.value)}>
          <MenuItem value="all">All Courses</MenuItem>
          {courses.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </Select>
      </FormControl>

      <Paper
        elevation={0}
        onClick={() => setSnackbar("Opening file picker...")}
        sx={{ p: 4, mb: 3, textAlign: "center", border: "2px dashed", borderColor: "divider", cursor: "pointer" }}
      >
        <UploadFileIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
        <Typography variant="body2" color="text.secondary">Drag and drop files here, or click to browse</Typography>
      </Paper>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Recently Uploaded</Typography>
      <DataTable
        columns={[
          { key: "file", label: "File Name" },
          { key: "course", label: "Course" },
          { key: "type", label: "Type" },
          { key: "size", label: "Size" },
          { key: "uploaded", label: "Uploaded" },
          {
            key: "actions", label: "Action",
            render: (row) => <Button size="small" onClick={() => setSnackbar(`Deleting ${row.file}...`)}>Delete</Button>,
          },
        ]}
        rows={filtered}
        emptyTitle="No materials found"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
