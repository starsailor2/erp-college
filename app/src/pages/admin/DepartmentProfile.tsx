import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Paper, Typography, Stack, Grid } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getDepartmentByIdAsync } from "@/api/departments";
import { getFacultyById, getFacultyByDepartment } from "@/demo-data/people/faculty";
import { getStudentsByDepartment } from "@/demo-data/people/students";
import { getCoursesByDepartment } from "@/demo-data/academics/courses";
import ClassIcon from "@mui/icons-material/Class";
import GroupsIcon from "@mui/icons-material/Groups";
import GradingIcon from "@mui/icons-material/Grading";
import ArticleIcon from "@mui/icons-material/Article";
import type { Department } from "@/types";

export default function DepartmentProfile() {
  const { id } = useParams();
  const { mode } = useColorMode();
  const [dept, setDept] = useState<Department | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    if (id) getDepartmentByIdAsync(id).then((data) => { if (live) { setDept(data); setLoaded(true); } });
    return () => { live = false; };
  }, [id]);

  if (loaded && !dept) {
    return <EmptyState title="Department not found" description={`No department with id "${id}".`} />;
  }
  if (!dept) return null;

  const facultyCount = getFacultyByDepartment(dept.id).length;
  const studentCount = getStudentsByDepartment(dept.id).length;
  const activeCourses = getCoursesByDepartment(dept.id).length;

  return (
    <>
      <PageHeader eyebrow="Departments" title={dept.name} breadcrumbs={[{ label: "Departments", to: "/admin/departments" }, { label: dept.name }]} />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={4}>
          <Box><Typography variant="caption" color="text.secondary">Department Code</Typography><Typography variant="body1">{dept.id}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">HOD</Typography><Typography variant="body1">{getFacultyById(dept.hodFacultyId)?.name ?? "—"}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Building</Typography><Typography variant="body1">{dept.building}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Faculty Count</Typography><Typography variant="body1">{facultyCount}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Student Count</Typography><Typography variant="body1">{studentCount}</Typography></Box>
        </Stack>
      </Paper>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Department Statistics</Typography>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Active Courses" icon={<ClassIcon />} color={getIconAccent(mode, "courses")} numericValue={activeCourses} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Avg. Class Size" icon={<GroupsIcon />} color={getIconAccent(mode, "class-size")} numericValue={dept.avgClassSize} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Pass Rate" icon={<GradingIcon />} color={getIconAccent(mode, "pass-rate")} numericValue={dept.passRatePct} formatValue={(n) => `${n}%`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Research Papers" icon={<ArticleIcon />} color={getIconAccent(mode, "research")} numericValue={dept.researchPapers} />
        </Grid>
      </Grid>
    </>
  );
}
