import { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getChartPalette, getChartTooltipStyle, getIconAccent } from "@/theme/chartPalette";
import { getNotifications, getUnreadNotificationCount } from "@/api/notifications";
import type { Notification } from "@/types";

const weeklyActivity = [
  { day: "Mon", count: 34 },
  { day: "Tue", count: 41 },
  { day: "Wed", count: 28 },
  { day: "Thu", count: 47 },
  { day: "Fri", count: 39 },
];

export default function Dashboard() {
  const { mode } = useColorMode();
  const palette = getChartPalette(mode);
  const [unread, setUnread] = useState(0);
  const [rows, setRows] = useState<Notification[]>([]);

  useEffect(() => {
    let live = true;
    getUnreadNotificationCount().then((count) => { if (live) setUnread(count); });
    getNotifications().then((data) => { if (live) setRows(data); });
    return () => { live = false; };
  }, []);

  return (
    <>
      <PageHeader eyebrow="Overview" title="Admin Dashboard" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Unread Notifications" icon={<NotificationsIcon />} color={getIconAccent(mode, "notifications")} numericValue={unread} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Total Students" icon={<PeopleIcon />} color={getIconAccent(mode, "students")} numericValue={1240} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Faculty Members" icon={<SchoolIcon />} color={getIconAccent(mode, "faculty")} numericValue={86} />
        </Grid>
      </Grid>
      <Grid container spacing={2.5}>
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
        <Grid size={12}>
          <DataTable<Notification>
            title="Recent Notifications"
            columns={[
              { key: "title", label: "Title" },
              { key: "postedBy", label: "Posted By" },
              {
                key: "read",
                label: "Status",
                render: (row) => <StatusChip status={row.read ? "read" : "unread"} />,
              },
              {
                key: "timestamp",
                label: "Date",
                render: (row) => new Date(row.timestamp).toLocaleDateString(),
              },
            ]}
            rows={rows}
            emptyTitle="No notifications yet"
          />
        </Grid>
      </Grid>
    </>
  );
}
