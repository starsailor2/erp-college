import { useEffect, useState } from "react";
import {
  Box, Button, TextField, MenuItem, Select, InputLabel, FormControl, Stack, Grid,
  Paper, Typography, Chip, TablePagination, Snackbar, type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { getStudents } from "@/api/students";
import { getMarksByStudent, getStudentRank } from "@/demo-data/academics/marks";
import { getCourseById } from "@/demo-data/academics/courses";
import { departmentSeeds } from "@/demo-data/academics/departmentSeeds";
import type { Student } from "@/types";

const PAGE_SIZE = 12;

export default function Results() {
  const [students, setStudents] = useState<Student[]>([]);
  const [deptFilter, setDeptFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getStudents().then(setStudents); }, []);

  const filtered = students.filter((s) =>
    (deptFilter === "all" || s.departmentId === deptFilter) &&
    (yearFilter === "all" || s.year === yearFilter) &&
    (search === "" || s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.toLowerCase().includes(search.toLowerCase()))
  );

  const visible = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="Results Management"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Exporting Results... Download will start shortly.")}>Export Results</Button>
            <Button variant="contained" onClick={() => setSnackbar("Results published successfully!")}>Publish Results</Button>
          </Stack>
        }
      />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Department</InputLabel>
          <Select label="Department" value={deptFilter} onChange={(e: SelectChangeEvent) => { setDeptFilter(e.target.value); setPage(0); }}>
            <MenuItem value="all">All Departments</MenuItem>
            {departmentSeeds.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Year</InputLabel>
          <Select<number | "all"> label="Year" value={yearFilter} onChange={(e: SelectChangeEvent<number | "all">) => { setYearFilter(e.target.value === "all" ? "all" : Number(e.target.value)); setPage(0); }}>
            <MenuItem value="all">All Years</MenuItem>
            <MenuItem value={1}>1st Year</MenuItem>
            <MenuItem value={2}>2nd Year</MenuItem>
            <MenuItem value={3}>3rd Year</MenuItem>
            <MenuItem value={4}>4th Year</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Search by student name or ID..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ minWidth: 260 }} />
      </Stack>

      <Grid container spacing={2.5}>
        {visible.map((student) => {
          const studentMarks = getMarksByStudent(student.id);
          const { rank, cohortSize } = getStudentRank(student.id);
          return (
            <Grid key={student.id} size={12}>
              <Paper elevation={0} sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{student.name} - {student.id}</Typography>
                    <Typography variant="caption" color="text.secondary">{student.program} - Year {student.year} | Semester {student.semester}</Typography>
                  </Box>
                  <Stack direction="row" spacing={3}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">CGPA</Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ color: "success.main" }}>{student.cgpa}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Rank</Typography>
                      <Typography variant="body1" fontWeight={700}>{rank} / {cohortSize}</Typography>
                    </Box>
                  </Stack>
                </Stack>
                <Stack spacing={1}>
                  {studentMarks.map((m) => {
                    const course = getCourseById(m.courseId);
                    return (
                      <Stack key={m.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5, borderBottom: "1px solid", borderColor: "divider" }}>
                        <Typography variant="body2">{course?.name ?? m.courseId}</Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Typography variant="body2" color="text.secondary">{m.marksObtained}/{m.maxMarks}</Typography>
                          <Chip size="small" label={m.grade} color={m.grade === "D" ? "error" : m.grade === "C" ? "warning" : "success"} variant="outlined" />
                        </Stack>
                      </Stack>
                    );
                  })}
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={PAGE_SIZE}
        rowsPerPageOptions={[PAGE_SIZE]}
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
