import { useEffect, useState } from "react";
import { Box, Button, Stack, Typography, Grid, LinearProgress, Snackbar } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArchiveIcon from "@mui/icons-material/Archive";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import DigitalSignDialog from "@/components/DigitalSignDialog";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getTeacherDocuments, signTeacherDocument } from "@/api/teacherDocuments";
import type { TeacherDocument } from "@/types";

type Tab = "all" | "assigned" | "sent" | "completed";

export default function DocumentSignatures() {
  const { mode } = useColorMode();
  const [rows, setRows] = useState<TeacherDocument[]>([]);
  const [tab, setTab] = useState<Tab>("assigned");
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [signingDoc, setSigningDoc] = useState<{ id: string; title: string } | null>(null);

  const load = () => getTeacherDocuments().then(setRows);
  useEffect(() => { load(); }, []);

  const assignedToMe = rows.filter((d) => d.direction === "assigned_to_me" && d.status !== "completed");
  const sentByMe = rows.filter((d) => d.direction === "sent_by_me");
  const completed = rows.filter((d) => d.status === "completed");

  const filtered = tab === "all" ? rows : tab === "assigned" ? assignedToMe : tab === "sent" ? sentByMe : completed;

  const handleSign = (id: string) => signTeacherDocument(id).then(() => { load(); setSnackbar("Document signed successfully"); });

  return (
    <>
      <PageHeader
        eyebrow="Communication"
        title="Document Signatures"
        action={<Button variant="contained" onClick={() => setSnackbar("Opening document initiation form...")}>+ Initiate New Document</Button>}
      />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Assigned to Me" icon={<DescriptionIcon />} color={getIconAccent(mode, "assigned")} numericValue={assignedToMe.length} onClick={() => setTab("assigned")} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Sent by Me" icon={<SendIcon />} color={getIconAccent(mode, "sent")} numericValue={sentByMe.length} onClick={() => setTab("sent")} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Completed" icon={<CheckCircleIcon />} color={getIconAccent(mode, "completed")} numericValue={completed.length} onClick={() => setTab("completed")} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Archived" icon={<ArchiveIcon />} color={getIconAccent(mode, "archived")} numericValue={rows.length} onClick={() => setTab("all")} /></Grid>
      </Grid>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {(["all", "assigned", "sent", "completed"] as Tab[]).map((t) => (
          <Button key={t} variant={tab === t ? "contained" : "outlined"} size="small" onClick={() => setTab(t)}>
            {t === "all" ? "All Documents" : t === "assigned" ? "Assigned to Me" : t === "sent" ? "Sent by Me" : "Completed"}
          </Button>
        ))}
      </Stack>

      <DataTable<TeacherDocument>
        pagination
        columns={[
          { key: "title", label: "Document" },
          { key: "docType", label: "Type" },
          { key: "fromName", label: "From" },
          { key: "initiatedDate", label: "Initiated" },
          { key: "priority", label: "Priority", render: (row) => <StatusChip status={row.priority === "urgent" ? "urgent" : row.priority === "high" ? "high" : "medium"} /> },
          {
            key: "status", label: "Status",
            render: (row) => row.direction === "sent_by_me" && row.status === "in_progress"
              ? <Box sx={{ minWidth: 100 }}><LinearProgress variant="determinate" value={row.progressPct ?? 0} /><Typography variant="caption">{row.progressPct}%</Typography></Box>
              : <StatusChip status={row.status} />,
          },
          {
            key: "actions", label: "Action",
            render: (row) => row.direction === "assigned_to_me" && row.status === "pending"
              ? <Button size="small" variant="contained" onClick={() => setSigningDoc({ id: row.id, title: row.title })}>Review & Sign</Button>
              : <Button size="small" onClick={() => setSnackbar("Loading signature history...")}>History</Button>,
          },
        ]}
        rows={filtered}
        emptyTitle="No documents found"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
      <DigitalSignDialog
        open={!!signingDoc}
        documentTitle={signingDoc?.title ?? ""}
        onClose={() => setSigningDoc(null)}
        onConfirm={() => {
          if (signingDoc) handleSign(signingDoc.id);
          setSigningDoc(null);
        }}
      />
    </>
  );
}
