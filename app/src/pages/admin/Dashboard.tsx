import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Grid, Box, MenuItem, Select, type SelectChangeEvent } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import PaymentIcon from "@mui/icons-material/Payment";
import EventNoteIcon from "@mui/icons-material/EventNote";
import InventoryIcon from "@mui/icons-material/Inventory";
import HotelIcon from "@mui/icons-material/Hotel";
import GradingIcon from "@mui/icons-material/Grading";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getChartPalette, getChartTooltipStyle, getIconAccent } from "@/theme/chartPalette";
import { getStudents } from "@/api/students";
import { getFaculty } from "@/api/faculty";
import { getActivityLog } from "@/api/activityLog";
import { getExams } from "@/api/exams";
import { getDepartmentById } from "@/demo-data/academics/departments";
import type { ActivityLogEntry, Student, Faculty } from "@/types";

const weeklyActivity = [
  { day: "Mon", count: 34 }, { day: "Tue", count: 41 }, { day: "Wed", count: 28 },
  { day: "Thu", count: 47 }, { day: "Fri", count: 39 },
];

type CategoryFilter = "all" | ActivityLogEntry["category"];

export default function Dashboard() {
  const { mode } = useColorMode();
  const palette = getChartPalette(mode);
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [examCount, setExamCount] = useState(0);

  useEffect(() => {
    let live = true;
    getStudents().then((data) => { if (live) setStudents(data); });
    getFaculty().then((data) => { if (live) setFaculty(data); });
    getActivityLog().then((data) => { if (live) setActivity(data); });
    getExams().then((data) => { if (live) setExamCount(data.length); });
    return () => { live = false; };
  }, []);

  const filteredActivity = category === "all" ? activity : activity.filter((a) => a.category === category);
  const avgAttendance = students.length > 0
    ? Math.round((students.reduce((sum, s) => sum + s.attendancePct, 0) / students.length) * 10) / 10
    : 0;

  return (
    <>
      <PageHeader eyebrow="Overview" title="Admin Dashboard" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Students" icon={<PeopleIcon />} color={getIconAccent(mode, "students")} numericValue={students.length} onClick={() => navigate("/admin/students")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Faculty Members" icon={<SchoolIcon />} color={getIconAccent(mode, "faculty")} numericValue={faculty.length} onClick={() => navigate("/admin/faculty")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Open Tickets" icon={<ConfirmationNumberIcon />} color={getIconAccent(mode, "tickets")} numericValue={42} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Fee Collection" icon={<PaymentIcon />} color={getIconAccent(mode, "fees")} value="₹3.2 Cr" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Avg Attendance" icon={<EventNoteIcon />} color={getIconAccent(mode, "attendance")} value={`${avgAttendance}%`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Assets" icon={<InventoryIcon />} color={getIconAccent(mode, "assets")} numericValue={1842} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Hostel Occupancy" icon={<HotelIcon />} color={getIconAccent(mode, "hostel")} numericValue={92} formatValue={(n) => `${n}%`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Upcoming Exams" icon={<GradingIcon />} color={getIconAccent(mode, "exams")} numericValue={examCount} />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={12}>
          <ChartCard eyebrow="This Week" title="Activity Overview">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="day" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Bar dataKey="count" fill={palette.categorical[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Select
          size="small"
          value={category}
          onChange={(e: SelectChangeEvent) => setCategory(e.target.value as CategoryFilter)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="all">All Activities</MenuItem>
          <MenuItem value="academic">Academic</MenuItem>
          <MenuItem value="operations">Operations</MenuItem>
          <MenuItem value="finance">Finance</MenuItem>
        </Select>
      </Box>
      <DataTable<ActivityLogEntry>
        title="Recent Activity"
        columns={[
          { key: "timestamp", label: "Timestamp", render: (row) => new Date(row.timestamp).toLocaleString() },
          { key: "actorName", label: "User" },
          { key: "activity", label: "Activity" },
          { key: "departmentId", label: "Department", render: (row) => getDepartmentById(row.departmentId)?.name ?? row.departmentId },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={filteredActivity}
        emptyTitle="No activity found"
      />
    </>
  );
}
