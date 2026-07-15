import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { DataTable } from "@/components/DataTable";
import EmptyState from "@/components/EmptyState";
import type { CommandResult, CommandRecordRow, CommandTableRow } from "@/command-center/types";

interface ResultViewProps {
  result: CommandResult;
  selectedIndex: number;
  onNavigate: (path: string) => void;
}

function RecordRowList({
  records,
  selectedIndex,
  onNavigate,
}: {
  records: CommandRecordRow[];
  selectedIndex: number;
  onNavigate: (path: string) => void;
}) {
  if (records.length === 0) return null;
  return (
    <List dense disablePadding>
      {records.map((r, i) => (
        <ListItemButton key={r.id} selected={i === selectedIndex} onClick={() => onNavigate(r.path)}>
          <ListItemText primary={r.primary} secondary={r.secondary} />
          <ChevronRightIcon fontSize="small" sx={{ color: "text.disabled" }} />
        </ListItemButton>
      ))}
    </List>
  );
}

export default function ResultView({ result, selectedIndex, onNavigate }: ResultViewProps) {
  switch (result.kind) {
    case "stat-answer":
      return (
        <Box sx={{ p: 2.5 }}>
          <Typography variant="body1">{result.summary}</Typography>
          {result.note && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              {result.note}
            </Typography>
          )}
          {result.actionPath && (
            <Button size="small" onClick={() => onNavigate(result.actionPath as string)} sx={{ mt: 1.5, pl: 0 }}>
              {result.actionLabel ?? "View page"} →
            </Button>
          )}
        </Box>
      );
    case "record-table":
      return (
        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box>
            <Typography variant="body1">{result.summary}</Typography>
            {result.note && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                {result.note}
              </Typography>
            )}
          </Box>
          <DataTable<CommandTableRow>
            columns={result.columns}
            rows={result.rows}
            onRowClick={(row) => onNavigate(row.path)}
            emptyTitle="No matching records"
          />
          <Button size="small" onClick={() => onNavigate(result.viewAllPath)} sx={{ alignSelf: "flex-start" }}>
            {result.viewAllLabel} →
          </Button>
        </Box>
      );
    case "record-list":
      return (
        <Box sx={{ py: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ px: 2.5, pb: 0.5 }}>
            {result.summary}
          </Typography>
          <RecordRowList records={result.records} selectedIndex={selectedIndex} onNavigate={onNavigate} />
        </Box>
      );
    case "nav-suggestions":
      return (
        <Box sx={{ py: 1 }}>
          <RecordRowList records={result.records} selectedIndex={selectedIndex} onNavigate={onNavigate} />
        </Box>
      );
    case "no-match":
      return (
        <Box>
          <EmptyState
            icon={<SearchOffIcon fontSize="inherit" />}
            title="No answer for that yet"
            description="Try rephrasing, or pick a suggestion below."
          />
          <RecordRowList records={result.suggestions} selectedIndex={selectedIndex} onNavigate={onNavigate} />
        </Box>
      );
  }
}
