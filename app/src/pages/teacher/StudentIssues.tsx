import { useEffect, useState } from "react";
import { Button, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getStudentIssues, resolveStudentIssue } from "@/api/teacherStudentIssues";
import type { StudentIssue } from "@/types";

export default function StudentIssues() {
  const [rows, setRows] = useState<StudentIssue[]>([]);
  const [selected, setSelected] = useState<StudentIssue | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getStudentIssues().then(setRows);
  useEffect(() => { load(); }, []);

  const handleResolve = (id: string) => resolveStudentIssue(id).then(() => { load(); setSnackbar("Issue marked resolved"); setSelected(null); });

  return (
    <>
      <PageHeader eyebrow="HOD Functions" title="Student Issues" />
      <DataTable<StudentIssue>
        pagination
        columns={[
          { key: "rollNo", label: "Roll No" },
          { key: "name", label: "Name" },
          { key: "issue", label: "Issue" },
          { key: "raisedBy", label: "Raised By" },
          { key: "date", label: "Date" },
          { key: "priority", label: "Priority", render: (row) => <StatusChip status={row.priority} /> },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          { key: "actions", label: "Action", render: (row) => <Button size="small" onClick={() => setSelected(row)}>View</Button> },
        ]}
        rows={rows}
        emptyTitle="No student issues found"
      />
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected?.issue}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{selected?.rollNo} · {selected?.name}</Typography>
          <Typography variant="body2">{selected?.detail}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
            Raised by {selected?.raisedBy} on {selected?.date}
          </Typography>
        </DialogContent>
        <DialogActions>
          {selected?.status === "open" && (
            <Button onClick={() => selected && handleResolve(selected.id)} variant="contained">Mark Resolved</Button>
          )}
          <Button onClick={() => setSelected(null)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
