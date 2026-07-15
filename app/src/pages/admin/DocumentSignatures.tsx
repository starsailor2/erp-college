import { useEffect, useState } from "react";
import { Box, Button, Stack, Typography, Grid, Paper, LinearProgress, Snackbar } from "@mui/material";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DescriptionIcon from "@mui/icons-material/Description";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import DigitalSignDialog from "@/components/DigitalSignDialog";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getDocumentSignatures, signDocument } from "@/api/documentSignatures";
import type { DocumentSignature, DocumentSignatureStatus } from "@/types";

type TabValue = DocumentSignatureStatus | "all";

const workflows = [
  { type: "Academic Documents", chain: "Faculty → HOD → Dean → Admin" },
  { type: "Finance Documents", chain: "Initiator → HOD → Finance → Admin" },
  { type: "Policy Documents", chain: "Dean → Admin → Management" },
  { type: "Research Documents", chain: "Researcher → HOD → Dean → Admin" },
];

export default function DocumentSignatures() {
  const { mode } = useColorMode();
  const [rows, setRows] = useState<DocumentSignature[]>([]);
  const [tab, setTab] = useState<TabValue>("pending");
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [signingDoc, setSigningDoc] = useState<{ id: string; title: string } | null>(null);

  const load = () => getDocumentSignatures().then(setRows);
  useEffect(() => { load(); }, []);

  const filtered = tab === "all" ? rows : rows.filter((d) => d.status === tab);

  const pendingCount = rows.filter((d) => d.status === "pending").length;
  const inProgressCount = rows.filter((d) => d.status === "in_progress").length;
  const completedCount = rows.filter((d) => d.status === "completed").length;

  const handleSign = (id: string) => {
    signDocument(id).then(() => { load(); setSnackbar("Document signed successfully"); });
  };

  return (
    <>
      <PageHeader
        eyebrow="Communication"
        title="Document Signature Management"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Generating signature report...")}>Export Report</Button>
            <Button variant="contained" onClick={() => setSnackbar("Document creation form opening...")}>+ Create Document</Button>
          </Stack>
        }
      />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Pending Approval" icon={<PendingActionsIcon />} color={getIconAccent(mode, "doc-pending")} numericValue={pendingCount} onClick={() => setTab("pending")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="In Progress" icon={<HourglassTopIcon />} color={getIconAccent(mode, "doc-progress")} numericValue={inProgressCount} onClick={() => setTab("in_progress")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Completed" icon={<CheckCircleIcon />} color={getIconAccent(mode, "doc-completed")} numericValue={completedCount} onClick={() => setTab("completed")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Documents" icon={<DescriptionIcon />} color={getIconAccent(mode, "doc-total")} numericValue={rows.length} onClick={() => setTab("all")} />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {(["pending", "in_progress", "completed", "all"] as TabValue[]).map((t) => (
          <Button key={t} variant={tab === t ? "contained" : "outlined"} size="small" onClick={() => setTab(t)}>
            {t === "pending" ? "Pending" : t === "in_progress" ? "In Progress" : t === "completed" ? "Completed" : "All"}
          </Button>
        ))}
      </Stack>

      <DataTable<DocumentSignature>
        pagination
        columns={[
          { key: "id", label: "Document ID" },
          { key: "title", label: "Title" },
          { key: "docType", label: "Type" },
          { key: "initiatedBy", label: "Initiated By" },
          { key: "date", label: "Date" },
          {
            key: "status", label: "Status / Progress",
            render: (row) => {
              if (row.status === "pending") return <StatusChip status={row.urgency === "urgent" ? "urgent" : "awaiting"} />;
              if (row.status === "in_progress") {
                const pct = ((row.progressCurrent ?? 0) / (row.progressTotal ?? 3)) * 100;
                return (
                  <Box sx={{ minWidth: 120 }}>
                    <Typography variant="caption" color="text.secondary">{row.currentStage}</Typography>
                    <LinearProgress variant="determinate" value={pct} sx={{ my: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">{row.progressCurrent}/{row.progressTotal}</Typography>
                  </Box>
                );
              }
              return <Typography variant="body2" color="success.main" fontWeight={600}>{row.signaturesCollected}/{row.signaturesTotal} ✓</Typography>;
            },
          },
          {
            key: "actions", label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={0.5}>
                {row.status !== "completed" && <Button size="small" variant="contained" onClick={() => setSigningDoc({ id: row.id, title: row.title })}>Sign</Button>}
                {row.status === "completed" && <Button size="small" onClick={() => setSnackbar("Downloading signed document...")}>Download</Button>}
                <Button size="small" onClick={() => setSnackbar("Loading signature history...")}>History</Button>
              </Stack>
            ),
          },
        ]}
        rows={filtered}
        emptyTitle="No documents found"
      />

      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 4, mb: 1.5 }}>Signature Workflow Configuration</Typography>
      <Grid container spacing={2}>
        {workflows.map((w) => (
          <Grid key={w.type} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>{w.type}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>{w.chain}</Typography>
              <Button size="small" variant="outlined" onClick={() => setSnackbar("Opening workflow configuration...")}>Configure</Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
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
