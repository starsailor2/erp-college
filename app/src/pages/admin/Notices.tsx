import { useEffect, useState } from "react";
import {
  Box, Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getNotices } from "@/api/notices";
import type { Notice } from "@/types";

const audiences = ["Students", "Faculty", "Staff", "Faculty, Staff", "All"];
const months = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07"];
const monthLabels: Record<string, string> = {
  "2026-01": "January 2026", "2026-02": "February 2026", "2026-03": "March 2026",
  "2026-04": "April 2026", "2026-05": "May 2026", "2026-06": "June 2026", "2026-07": "July 2026",
};

export default function Notices() {
  const [rows, setRows] = useState<Notice[]>([]);
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getNotices().then(setRows); }, []);

  const filtered = rows.filter((n) =>
    (audienceFilter === "all" || n.audience === audienceFilter) &&
    (monthFilter === "all" || (n.publishedDate?.startsWith(monthFilter) ?? false)) &&
    (search === "" || n.title.toLowerCase().includes(search.toLowerCase()) || n.id.toLowerCase().includes(search.toLowerCase()) || n.author.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <PageHeader
        eyebrow="Communication"
        title="Communications & Notices"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Loading notice history...")}>View History</Button>
            <Button variant="contained" onClick={() => setSnackbar("Notice creation form opening...")}>Create Notice</Button>
          </Stack>
        }
      />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <TextField size="small" placeholder="Search notices by title, ID or author..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 300 }} />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Audience</InputLabel>
          <Select label="Audience" value={audienceFilter} onChange={(e: SelectChangeEvent) => setAudienceFilter(e.target.value)}>
            <MenuItem value="all">All Audiences</MenuItem>
            {audiences.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Month</InputLabel>
          <Select label="Month" value={monthFilter} onChange={(e: SelectChangeEvent) => setMonthFilter(e.target.value)}>
            <MenuItem value="all">All Months</MenuItem>
            {months.map((m) => <MenuItem key={m} value={m}>{monthLabels[m]}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      <DataTable<Notice>
        pagination
        columns={[
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          {
            key: "title", label: "Notice Title",
            render: (row) => (
              <Box>
                <Typography variant="body2" fontWeight={600}>{row.title}</Typography>
                <Typography variant="caption" color="text.secondary">ID: {row.id}</Typography>
              </Box>
            ),
          },
          { key: "audience", label: "Target Audience" },
          { key: "author", label: "Author" },
          { key: "publishedDate", label: "Published Date", render: (row) => row.publishedDate ?? "—" },
          {
            key: "actions", label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={0.5}>
                {row.status === "draft" ? (
                  <>
                    <Button size="small" onClick={() => setSnackbar("Opening notice editor...")}>Edit</Button>
                    <Button size="small" onClick={() => setSnackbar("Deleting notice...")}>Delete</Button>
                  </>
                ) : row.status === "scheduled" ? (
                  <Button size="small" onClick={() => setSnackbar("Opening notice editor...")}>Edit</Button>
                ) : (
                  <Button size="small" onClick={() => setSnackbar("Loading notice...")}>View</Button>
                )}
              </Stack>
            ),
          },
        ]}
        rows={filtered}
        emptyTitle="No notices found"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
