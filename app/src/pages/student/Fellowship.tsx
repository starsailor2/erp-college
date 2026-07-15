import { useEffect, useState } from "react";
import { Button, Paper, Snackbar, Typography } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getScholarships, getScholarshipApplications, applyScholarship } from "@/api/studentScholarships";
import type { StudentScholarship, ScholarshipApplication } from "@/types";

export default function Fellowship() {
  const [scholarships, setScholarships] = useState<StudentScholarship[]>([]);
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => {
    getScholarships().then(setScholarships);
    getScholarshipApplications().then(setApplications);
  };
  useEffect(() => { load(); }, []);

  const handleApply = (name: string) => applyScholarship(name).then(() => { load(); setSnackbar(`Applied for ${name}`); });

  return (
    <>
      <PageHeader eyebrow="Fellowship" title="Fellowship & Scholarships" />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600}>Current Scholarship</Typography>
        <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>Merit Scholarship — ₹50,000/year</Typography>
        <Typography variant="body2" color="text.secondary">Active since 2025-08-15</Typography>
      </Paper>
      <DataTable<StudentScholarship>
        title="Available Scholarships"
        columns={[
          { key: "name", label: "Name" },
          { key: "amount", label: "Amount", render: (row) => `₹${row.amount.toLocaleString("en-IN")}` },
          { key: "eligibility", label: "Eligibility" },
          { key: "deadline", label: "Deadline" },
          { key: "actions", label: "Action", render: (row) => <Button size="small" disabled={row.applied} onClick={() => handleApply(row.name)}>{row.applied ? "Applied" : "Apply"}</Button> },
        ]}
        rows={scholarships}
        emptyTitle="No scholarships available"
      />
      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1.5 }}>Application History</Typography>
      <DataTable<ScholarshipApplication>
        columns={[
          { key: "name", label: "Scholarship" },
          { key: "appliedOn", label: "Applied On" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={applications}
        emptyTitle="No applications yet"
      />
      <Button variant="outlined" sx={{ mt: 3 }} onClick={() => setSnackbar("Scholarship guidelines download is not available in this demo")}>Download Guidelines</Button>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
