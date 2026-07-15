import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import Dialog from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import SearchIcon from "@mui/icons-material/Search";
import { getNavItems } from "@/components/navigation";
import { interpret } from "@/command-center/interpret";
import { searchNavItems } from "@/command-center/fallback/navSearch";
import { searchRecords } from "@/command-center/fallback/recordSearch";
import ResultView from "@/command-center/ResultView";
import type { CommandResult, CommandRecordRow } from "@/command-center/types";

const EXAMPLE_QUERIES = [
  "Students with pending fees",
  "Students below 75% attendance",
  "Open critical tickets",
  "How many students absent today",
  "Overdue library books",
];

interface CommandCenterDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandCenterDialog({ open, onClose }: CommandCenterDialogProps) {
  const navigate = useNavigate();
  const navItems = useMemo(() => getNavItems("admin"), []);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CommandResult | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResult(null);
      setSelectedIndex(0);
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    const thisRequestId = ++requestIdRef.current;
    if (!trimmed) {
      setResult(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      const intent = interpret(trimmed);
      Promise.all([intent ? intent.execute(trimmed) : Promise.resolve(null), searchRecords(trimmed)]).then(
        ([intentResult, recordHits]) => {
          if (thisRequestId !== requestIdRef.current) return; // stale response, ignore
          const navHits = searchNavItems(trimmed, navItems);
          setLoading(false);
          setSelectedIndex(0);
          if (intentResult) {
            setResult(intentResult);
          } else if (recordHits.length > 0) {
            setResult({ kind: "record-list", summary: "Matching records", records: [...recordHits, ...navHits] });
          } else if (navHits.length > 0) {
            setResult({ kind: "nav-suggestions", records: navHits });
          } else {
            setResult({ kind: "no-match", suggestions: [] });
          }
        },
      );
    }, 150);
    return () => clearTimeout(timer);
  }, [query, navItems]);

  const isIdle = !query.trim();

  const listRows: CommandRecordRow[] = useMemo(() => {
    if (isIdle) return EXAMPLE_QUERIES.map((text, i) => ({ id: `example-${i}`, primary: text, path: "" }));
    if (!result) return [];
    if (result.kind === "record-list" || result.kind === "nav-suggestions") return result.records;
    if (result.kind === "no-match") return result.suggestions;
    return [];
  }, [isIdle, result]);

  const handleSelect = (row: CommandRecordRow) => {
    if (isIdle) {
      setQuery(row.primary);
      return;
    }
    if (!row.path) return;
    navigate(row.path);
    onClose();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, Math.max(listRows.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const row = listRows[selectedIndex];
      if (row) handleSelect(row);
    } else if (event.key === "Escape") {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { position: "fixed", top: 96, m: 0, borderRadius: 2 } } }}
    >
      <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1.5, gap: 1.5 }}>
        <SearchIcon sx={{ color: "text.secondary" }} />
        <InputBase
          autoFocus
          fullWidth
          placeholder="Ask anything about the college…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{ fontSize: 16 }}
        />
        {loading && <CircularProgress size={18} />}
      </Box>
      <Divider />
      <Box sx={{ maxHeight: 420, overflowY: "auto" }}>
        {isIdle ? (
          <List dense disablePadding>
            {listRows.map((row, i) => (
              <ListItemButton key={row.id} selected={i === selectedIndex} onClick={() => handleSelect(row)}>
                <ListItemText primary={row.primary} secondary={i === 0 ? "Try an example" : undefined} />
              </ListItemButton>
            ))}
          </List>
        ) : (
          result && <ResultView result={result} selectedIndex={selectedIndex} onNavigate={(path) => { navigate(path); onClose(); }} />
        )}
      </Box>
    </Dialog>
  );
}
