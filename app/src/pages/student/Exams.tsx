import { useEffect, useState } from "react";
import { Button, Snackbar, Stack, Typography } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getSemesterResults } from "@/api/studentResults";
import type { SemesterResult } from "@/types";

const upcomingExams = [
  { subject: "Advanced Algorithms", date: "2026-11-20", time: "09:00 - 12:00", venue: "Exam Hall 1", status: "scheduled" },
  { subject: "Machine Learning", date: "2026-11-23", time: "09:00 - 12:00", venue: "Exam Hall 2", status: "scheduled" },
  { subject: "Distributed Systems", date: "2026-11-26", time: "14:00 - 17:00", venue: "Exam Hall 1", status: "scheduled" },
];

export default function Exams() {
  const [results, setResults] = useState<SemesterResult[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getSemesterResults().then(setResults); }, []);

  const stub = (label: string) => setSnackbar(`${label} is not available in this demo`);

  return (
    <>
      <PageHeader eyebrow="Academics" title="Exams & Results" />
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Upcoming Exams</Typography>
      <DataTable
        columns={[
          { key: "subject", label: "Subject" },
          { key: "date", label: "Date" },
          { key: "time", label: "Time" },
          { key: "venue", label: "Venue" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={upcomingExams}
        emptyTitle="No upcoming exams"
      />
      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1.5 }}>Previous Semester Results</Typography>
      <DataTable<SemesterResult>
        columns={[
          { key: "semester", label: "Semester", render: (row) => `Semester ${row.semester}` },
          { key: "year", label: "Year" },
          { key: "sgpa", label: "SGPA", render: (row) => (row.sgpa > 0 ? row.sgpa.toFixed(2) : "—") },
          { key: "credits", label: "Credits" },
          { key: "result", label: "Result", render: (row) => <StatusChip status={row.result} /> },
          { key: "actions", label: "Action", render: (row) => <Button size="small" onClick={() => stub(`Semester ${row.semester} results download`)}>Download</Button> },
        ]}
        rows={results}
        emptyTitle="No results found"
      />
      <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={() => stub("Admit Card download")}>Download Admit Card</Button>
        <Button variant="contained" onClick={() => setSnackbar("Examination form submitted")}>Submit Exam Form</Button>
        <Button variant="outlined" onClick={() => stub("Complete Transcript download")}>Download Transcript</Button>
      </Stack>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
