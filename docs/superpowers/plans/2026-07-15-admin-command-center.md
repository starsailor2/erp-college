# Admin Command Center (Ctrl+K) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global `Ctrl+K` / `Cmd+K` command center to the Admin portal that answers natural-language questions about the college ("students with pending fees", "attendance below 75%") using live demo data, and lets the admin jump straight to any page or record by typing part of its name.

**Architecture:** A new `app/src/command-center/` module. `interpret(query)` matches free text against a registry of `IntentDefinition`s (pure, synchronous, local pattern matching — swappable for a real LLM backend later without touching anything downstream). Each intent's `execute(query)` calls one or more existing `api/*.ts` functions and joins/filters the results inside the command-center module. A fuzzy nav-item search and a fuzzy record search (students/faculty/tickets/assets) run alongside intent matching so the bar is useful even outside the deep-answer intents. A `CommandCenterDialog` (MUI `Dialog`) renders the results and is mounted once in `Layout.tsx`, gated to `role === "admin"`.

**Tech Stack:** React 19, TypeScript 5.8, MUI v7, react-router-dom v7. No new dependencies.

## Global Constraints

- All command-center data access goes through `app/src/api/*.ts` — never import `demo-data/*` for live records (students, faculty, tickets, fee ledger, hostel stats, etc.).
- Exception: static reference/seed constants that aren't wrapped by an api function (e.g. `departmentSeeds` from `@/demo-data/academics/departmentSeeds`) may be imported directly for keyword-matching purposes — this matches existing precedent in `pages/admin/Students.tsx` and `pages/admin/FeeLedger.tsx`, which already import `departmentSeeds`/`programByDepartment` directly.
- No automated test framework in this codebase and none is being introduced — every task is verified manually by running the dev server and exercising the feature in the browser (per explicit project decision; matches how every prior phase in `docs/superpowers/plans/` was verified).
- Read + navigate only. No mutations (creating, editing, resolving) triggered from the command bar.
- Admin portal only for this phase — gate everything on `role === "admin"` from `useAuth()`.
- Path alias `@/` maps to `app/src/` (see `app/vite.config.ts` and `app/tsconfig.app.json`).
- `app/tsconfig.app.json` has `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true` — every new file must type-check with zero unused imports/locals.
- Run `npx tsc -b` from `app/` after every task as a fast type-check gate (this is exactly the first half of `npm run build`).
- All new source files live under `app/src/command-center/`, except the one edit to `app/src/components/Layout.tsx` that mounts the dialog.

---

### Task 1: Command Center Skeleton — types, engine, fallback search, dialog UI, mount in Layout

**Files:**
- Create: `app/src/command-center/types.ts`
- Create: `app/src/command-center/shared.ts`
- Create: `app/src/command-center/registry.ts`
- Create: `app/src/command-center/interpret.ts`
- Create: `app/src/command-center/fallback/navSearch.ts`
- Create: `app/src/command-center/fallback/recordSearch.ts`
- Create: `app/src/command-center/useCommandCenterHotkey.ts`
- Create: `app/src/command-center/ResultView.tsx`
- Create: `app/src/command-center/CommandCenterDialog.tsx`
- Modify: `app/src/components/Layout.tsx`

**Interfaces:**
- Produces (used by every later task):
  - `CommandRecordRow { id: string; primary: string; secondary?: string; path: string }`
  - `CommandTableColumn { key: string; label: string }`
  - `CommandTableRow { id: string; path: string; [key: string]: ReactNode }`
  - `CommandResult` — discriminated union: `stat-answer` / `record-table` / `record-list` / `nav-suggestions` / `no-match` (exact shape in Step 1 below)
  - `IntentDefinition { id: string; matches: (queryLower: string) => boolean; execute: (query: string) => Promise<CommandResult> }`
  - `intentDefinitions: IntentDefinition[]` (from `registry.ts`, empty until Task 2)
  - `interpret(query: string): IntentDefinition | null` (from `interpret.ts`)
  - `fuzzyScore(query: string, target: string): number`, `extractPercent(query: string): number | null`, `extractComparisonDirection(query: string): "below" | "above" | null`, `matchByNameOrId<T extends {id:string;name:string}>(query: string, items: T[]): T | null`, `formatINR(amount: number): string` (from `shared.ts`)
  - `searchNavItems(query: string, navItems: NavItem[], limit?: number): CommandRecordRow[]` (from `fallback/navSearch.ts`)
  - `searchRecords(query: string, limit?: number): Promise<CommandRecordRow[]>` (from `fallback/recordSearch.ts`)
- Consumes: `getNavItems` from `@/components/navigation`, `getStudents` from `@/api/students`, `getFaculty` from `@/api/faculty`, `getTickets` from `@/api/tickets`, `getAssets` from `@/api/assets`, `DataTable` from `@/components/DataTable`, `EmptyState` from `@/components/EmptyState`, `useAuth` from `@/context/AuthContext`.

- [ ] **Step 1: Create the shared types**

Create `app/src/command-center/types.ts`:

```ts
import type { ReactNode } from "react";

export interface CommandRecordRow {
  id: string;
  primary: string;
  secondary?: string;
  path: string;
}

export interface CommandTableColumn {
  key: string;
  label: string;
}

export interface CommandTableRow {
  id: string;
  path: string;
  [key: string]: ReactNode;
}

export type CommandResult =
  | { kind: "stat-answer"; summary: string; note?: string; actionPath?: string; actionLabel?: string }
  | {
      kind: "record-table";
      summary: string;
      note?: string;
      columns: CommandTableColumn[];
      rows: CommandTableRow[];
      viewAllPath: string;
      viewAllLabel: string;
    }
  | { kind: "record-list"; summary: string; records: CommandRecordRow[] }
  | { kind: "nav-suggestions"; records: CommandRecordRow[] }
  | { kind: "no-match"; suggestions: CommandRecordRow[] };

export interface IntentDefinition {
  id: string;
  matches: (queryLower: string) => boolean;
  execute: (query: string) => Promise<CommandResult>;
}
```

- [ ] **Step 2: Create shared parsing/formatting helpers**

Create `app/src/command-center/shared.ts`:

```ts
export function fuzzyScore(query: string, target: string): number {
  if (!query) return 0;
  if (target === query) return 100;
  if (target.startsWith(query)) return 80;
  if (target.includes(query)) return 60;
  if (target.split(/\s+/).some((word) => word.startsWith(query))) return 50;
  return 0;
}

export function extractPercent(query: string): number | null {
  const percentMatch = query.match(/(\d{1,3})\s*%/);
  if (percentMatch) return Number(percentMatch[1]);
  const numberMatch = query.match(/\b(\d{1,3})\b/);
  return numberMatch ? Number(numberMatch[1]) : null;
}

export function extractComparisonDirection(query: string): "below" | "above" | null {
  if (/\b(below|under|less than|lower than)\b/.test(query)) return "below";
  if (/\b(above|over|more than|greater than|higher than)\b/.test(query)) return "above";
  return null;
}

export function matchByNameOrId<T extends { id: string; name: string }>(query: string, items: T[]): T | null {
  const q = query.toLowerCase();
  return items.find((item) => q.includes(item.name.toLowerCase()) || q.includes(item.id.toLowerCase())) ?? null;
}

export function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}
```

- [ ] **Step 3: Create the empty intent registry and the interpreter**

Create `app/src/command-center/registry.ts`:

```ts
import type { IntentDefinition } from "@/command-center/types";

// Order matters: interpret() returns the first matching intent, so more
// specific/keyword-constrained intents should appear before broader ones.
// Populated task-by-task as each domain's intents are added.
export const intentDefinitions: IntentDefinition[] = [];
```

Create `app/src/command-center/interpret.ts`:

```ts
import { intentDefinitions } from "@/command-center/registry";
import type { IntentDefinition } from "@/command-center/types";

export function interpret(query: string): IntentDefinition | null {
  const queryLower = query.trim().toLowerCase();
  if (!queryLower) return null;
  return intentDefinitions.find((def) => def.matches(queryLower)) ?? null;
}
```

- [ ] **Step 4: Create the nav-item fuzzy fallback**

Create `app/src/command-center/fallback/navSearch.ts`:

```ts
import type { NavItem } from "@/components/navigation";
import type { CommandRecordRow } from "@/command-center/types";
import { fuzzyScore } from "@/command-center/shared";

export function searchNavItems(query: string, navItems: NavItem[], limit = 5): CommandRecordRow[] {
  const queryLower = query.trim().toLowerCase();
  if (queryLower.length < 2) return [];

  const flatItems: { label: string; path: string }[] = [];
  for (const item of navItems) {
    flatItems.push({ label: item.label, path: item.path });
    if (item.children) {
      for (const child of item.children) flatItems.push({ label: child.label, path: child.path });
    }
  }

  return flatItems
    .map((item) => ({ item, score: fuzzyScore(queryLower, item.label.toLowerCase()) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => ({ id: item.path, primary: item.label, secondary: "Go to page", path: item.path }));
}
```

- [ ] **Step 5: Create the record fuzzy fallback**

Create `app/src/command-center/fallback/recordSearch.ts`:

```ts
import { getStudents } from "@/api/students";
import { getFaculty } from "@/api/faculty";
import { getTickets } from "@/api/tickets";
import { getAssets } from "@/api/assets";
import type { CommandRecordRow } from "@/command-center/types";
import { fuzzyScore } from "@/command-center/shared";

export async function searchRecords(query: string, limit = 6): Promise<CommandRecordRow[]> {
  const queryLower = query.trim().toLowerCase();
  if (queryLower.length < 2) return [];

  const [students, faculty, tickets, assets] = await Promise.all([
    getStudents(),
    getFaculty(),
    getTickets(),
    getAssets(),
  ]);

  const candidates: { row: CommandRecordRow; score: number }[] = [];

  for (const s of students) {
    const score = Math.max(
      fuzzyScore(queryLower, s.name.toLowerCase()),
      fuzzyScore(queryLower, s.rollNo.toLowerCase()),
      fuzzyScore(queryLower, s.id.toLowerCase()),
    );
    if (score > 0) {
      candidates.push({
        score,
        row: { id: `student-${s.id}`, primary: s.name, secondary: `${s.rollNo} · ${s.program}`, path: `/admin/students/${s.id}` },
      });
    }
  }

  for (const f of faculty) {
    const score = Math.max(fuzzyScore(queryLower, f.name.toLowerCase()), fuzzyScore(queryLower, f.id.toLowerCase()));
    if (score > 0) {
      candidates.push({
        score,
        row: { id: `faculty-${f.id}`, primary: f.name, secondary: f.designation.replace(/_/g, " "), path: "/admin/faculty" },
      });
    }
  }

  for (const t of tickets) {
    const score = Math.max(fuzzyScore(queryLower, t.title.toLowerCase()), fuzzyScore(queryLower, t.id.toLowerCase()));
    if (score > 0) {
      candidates.push({
        score,
        row: { id: `ticket-${t.id}`, primary: t.title, secondary: `${t.id} · ${t.location}`, path: `/admin/tickets/${t.id}` },
      });
    }
  }

  for (const a of assets) {
    const score = Math.max(fuzzyScore(queryLower, a.name.toLowerCase()), fuzzyScore(queryLower, a.id.toLowerCase()));
    if (score > 0) {
      candidates.push({
        score,
        row: { id: `asset-${a.id}`, primary: a.name, secondary: `${a.id} · ${a.location}`, path: `/admin/assets/${a.id}` },
      });
    }
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((c) => c.row);
}
```

- [ ] **Step 6: Create the global hotkey hook**

Create `app/src/command-center/useCommandCenterHotkey.ts`:

```ts
import { useEffect } from "react";

export function useCommandCenterHotkey(onTrigger: () => void) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isModifierPressed = event.metaKey || event.ctrlKey;
      if (isModifierPressed && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onTrigger();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTrigger]);
}
```

- [ ] **Step 7: Create the result renderer**

Create `app/src/command-center/ResultView.tsx`:

```tsx
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
```

- [ ] **Step 8: Create the dialog shell**

Create `app/src/command-center/CommandCenterDialog.tsx`:

```tsx
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
```

- [ ] **Step 9: Mount the hotkey and dialog in Layout**

In `app/src/components/Layout.tsx`, add the two imports after the existing `getSidebarTokens` import:

```ts
import { getSidebarTokens } from "@/theme/tokens";
import CommandCenterDialog from "@/command-center/CommandCenterDialog";
import { useCommandCenterHotkey } from "@/command-center/useCommandCenterHotkey";
```

Add state and the hotkey registration right after `const { role, user, logout } = useAuth();`:

```tsx
  const { role, user, logout } = useAuth();
  const { toggleColorMode, mode } = useColorMode();
  const [commandCenterOpen, setCommandCenterOpen] = useState(false);
  useCommandCenterHotkey(() => { if (role === "admin") setCommandCenterOpen(true); });
```

(This replaces the existing two lines `const { role, user, logout } = useAuth();` and `const { toggleColorMode, mode } = useColorMode();` with the four lines above — same two original lines, plus the two new ones directly after.)

Mount the dialog just before the outermost `Box` closes, replacing:

```tsx
      </Box>
    </Box>
    </StaffRoleContext.Provider>
    </TeacherRoleContext.Provider>
  );
}
```

with:

```tsx
      </Box>
      {role === "admin" && (
        <CommandCenterDialog open={commandCenterOpen} onClose={() => setCommandCenterOpen(false)} />
      )}
    </Box>
    </StaffRoleContext.Provider>
    </TeacherRoleContext.Provider>
  );
}
```

- [ ] **Step 10: Type-check**

Run from `app/`:

```bash
npx tsc -b
```

Expected: no errors.

- [ ] **Step 11: Manual verification in the browser**

Run from `app/`: `npm run dev` (skip if already running). Open `http://localhost:5173`, log in (any credentials), pick **Admin** as the role, and land in `/admin`.

Check each of the following:
1. Press `Ctrl+K` (or `Cmd+K` on Mac). The dialog opens with an empty search box and the 5 example queries listed.
2. Type `student` (no data-question intent exists yet, so this should hit the nav fallback). Confirm you see nav suggestions including "Students" — click one and confirm it navigates to `/admin/students` and the dialog closes.
3. Open `/admin/students` directly, copy any visible student's name from the table. Press `Ctrl+K` again and type that name. Confirm a record-list result appears with that student, and clicking it navigates to `/admin/students/<their-id>`.
4. Press `Ctrl+K`, type a nonsense string like `zzzznotarealquery`. Confirm the "No answer for that yet" empty state appears without crashing.
5. Press `Escape` — dialog closes. Press `Ctrl+K` from a different admin page (e.g. `/admin/tickets`) — confirm it still opens (global listener works app-wide).
6. Switch the role to **Student** or **Teacher** from the login flow and confirm `Ctrl+K` does **not** open the dialog (admin-only gate).

- [ ] **Step 12: Commit**

```bash
git add app/src/command-center app/src/components/Layout.tsx
git commit -m "Add Admin Command Center skeleton (Ctrl+K dialog, nav/record fallback search)"
```

---

### Task 2: Students & Fees Intents

**Files:**
- Create: `app/src/command-center/intents/students.tsx`
- Modify: `app/src/command-center/registry.ts`

**Interfaces:**
- Consumes: `getStudents` (`@/api/students`), `getFeeLedger` (`@/api/feeLedger`), `StatusChip` (`@/components/StatusChip`), `IntentDefinition`/`CommandResult`/`CommandTableRow` (`@/command-center/types`), `extractPercent`/`extractComparisonDirection` (`@/command-center/shared`).
- Produces: `studentIntents: IntentDefinition[]` — 4 intents: unpaid fees, attendance threshold, backlog, CGPA ranking.

- [ ] **Step 1: Create the students & fees intents**

Create `app/src/command-center/intents/students.tsx`:

```tsx
import { getStudents } from "@/api/students";
import { getFeeLedger } from "@/api/feeLedger";
import StatusChip from "@/components/StatusChip";
import type { CommandResult, CommandTableRow, IntentDefinition } from "@/command-center/types";
import { extractPercent, extractComparisonDirection, formatINR } from "@/command-center/shared";

const FEE_WORDS = ["fee", "fees"];
const UNPAID_WORDS = ["unpaid", "haven't paid", "havent paid", "not paid", "pending", "overdue", "outstanding", "due"];

function isFeeQuery(queryLower: string): boolean {
  return FEE_WORDS.some((w) => queryLower.includes(w)) && UNPAID_WORDS.some((w) => queryLower.includes(w));
}

async function executeFeeQuery(): Promise<CommandResult> {
  const [students, ledger] = await Promise.all([getStudents(), getFeeLedger()]);
  const studentById = new Map(students.map((s) => [s.id, s]));
  const unpaid = ledger.filter((entry) => entry.status !== "paid");

  const rows: CommandTableRow[] = unpaid.slice(0, 8).map((entry) => {
    const student = studentById.get(entry.studentId);
    return {
      id: entry.id,
      path: student ? `/admin/students/${student.id}` : "/admin/fees/ledger",
      name: student?.name ?? entry.studentId,
      rollNo: student?.rollNo ?? "—",
      program: student?.program ?? "—",
      status: <StatusChip status={entry.status} />,
      balance: formatINR(entry.balance),
    };
  });

  return {
    kind: "record-table",
    summary: `${unpaid.length} student${unpaid.length === 1 ? "" : "s"} ${unpaid.length === 1 ? "has" : "have"} pending or overdue fees.`,
    note: "Based on the current fee ledger snapshot — per-calendar-year fee records aren't tracked yet.",
    columns: [
      { key: "name", label: "Student" },
      { key: "rollNo", label: "Roll No" },
      { key: "program", label: "Program" },
      { key: "status", label: "Status" },
      { key: "balance", label: "Balance Due" },
    ],
    rows,
    viewAllPath: "/admin/fees/ledger",
    viewAllLabel: "View all in Fee Ledger",
  };
}

const feeStatusIntent: IntentDefinition = { id: "students-unpaid-fees", matches: isFeeQuery, execute: executeFeeQuery };

function isAttendanceThresholdQuery(queryLower: string): boolean {
  return (
    queryLower.includes("attendance") &&
    extractComparisonDirection(queryLower) !== null &&
    extractPercent(queryLower) !== null
  );
}

async function executeAttendanceThresholdQuery(query: string): Promise<CommandResult> {
  const queryLower = query.toLowerCase();
  const threshold = extractPercent(queryLower) as number;
  const direction = extractComparisonDirection(queryLower) as "below" | "above";
  const students = await getStudents();
  const matching = students.filter((s) => (direction === "below" ? s.attendancePct < threshold : s.attendancePct > threshold));
  const sorted = [...matching].sort((a, b) => (direction === "below" ? a.attendancePct - b.attendancePct : b.attendancePct - a.attendancePct));

  const rows: CommandTableRow[] = sorted.slice(0, 8).map((s) => ({
    id: s.id,
    path: `/admin/students/${s.id}`,
    name: s.name,
    rollNo: s.rollNo,
    program: s.program,
    attendance: `${s.attendancePct}%`,
  }));

  return {
    kind: "record-table",
    summary: `${matching.length} student${matching.length === 1 ? "" : "s"} ${matching.length === 1 ? "has" : "have"} attendance ${direction} ${threshold}%.`,
    columns: [
      { key: "name", label: "Student" },
      { key: "rollNo", label: "Roll No" },
      { key: "program", label: "Program" },
      { key: "attendance", label: "Attendance %" },
    ],
    rows,
    viewAllPath: "/admin/students",
    viewAllLabel: "View all students",
  };
}

const attendanceThresholdIntent: IntentDefinition = {
  id: "students-attendance-threshold",
  matches: isAttendanceThresholdQuery,
  execute: executeAttendanceThresholdQuery,
};

function isBacklogQuery(queryLower: string): boolean {
  return queryLower.includes("backlog");
}

async function executeBacklogQuery(): Promise<CommandResult> {
  const students = await getStudents();
  const backlog = students.filter((s) => s.status === "backlog");

  const rows: CommandTableRow[] = backlog.slice(0, 8).map((s) => ({
    id: s.id,
    path: `/admin/students/${s.id}`,
    name: s.name,
    rollNo: s.rollNo,
    program: s.program,
    year: s.year,
  }));

  return {
    kind: "record-table",
    summary: `${backlog.length} student${backlog.length === 1 ? "" : "s"} ${backlog.length === 1 ? "has" : "have"} backlog status.`,
    columns: [
      { key: "name", label: "Student" },
      { key: "rollNo", label: "Roll No" },
      { key: "program", label: "Program" },
      { key: "year", label: "Year" },
    ],
    rows,
    viewAllPath: "/admin/students",
    viewAllLabel: "View all students",
  };
}

const backlogIntent: IntentDefinition = { id: "students-backlog", matches: isBacklogQuery, execute: executeBacklogQuery };

function isCgpaRankingQuery(queryLower: string): boolean {
  const hasCgpa = queryLower.includes("cgpa");
  const hasRankingWord = ["top", "highest", "best", "bottom", "lowest", "worst"].some((w) => queryLower.includes(w));
  return hasCgpa && hasRankingWord;
}

async function executeCgpaRankingQuery(query: string): Promise<CommandResult> {
  const queryLower = query.toLowerCase();
  const wantsBottom = ["bottom", "lowest", "worst"].some((w) => queryLower.includes(w));
  const students = await getStudents();
  const sorted = [...students].sort((a, b) => (wantsBottom ? a.cgpa - b.cgpa : b.cgpa - a.cgpa));
  const top = sorted.slice(0, 8);

  const rows: CommandTableRow[] = top.map((s) => ({
    id: s.id,
    path: `/admin/students/${s.id}`,
    name: s.name,
    rollNo: s.rollNo,
    program: s.program,
    cgpa: s.cgpa,
  }));

  return {
    kind: "record-table",
    summary: `Students ranked by ${wantsBottom ? "lowest" : "highest"} CGPA.`,
    columns: [
      { key: "name", label: "Student" },
      { key: "rollNo", label: "Roll No" },
      { key: "program", label: "Program" },
      { key: "cgpa", label: "CGPA" },
    ],
    rows,
    viewAllPath: "/admin/students",
    viewAllLabel: "View all students",
  };
}

const cgpaRankingIntent: IntentDefinition = {
  id: "students-cgpa-ranking",
  matches: isCgpaRankingQuery,
  execute: executeCgpaRankingQuery,
};

export const studentIntents: IntentDefinition[] = [
  feeStatusIntent,
  attendanceThresholdIntent,
  backlogIntent,
  cgpaRankingIntent,
];
```

- [ ] **Step 2: Wire into the registry**

Replace the full contents of `app/src/command-center/registry.ts`:

```ts
import type { IntentDefinition } from "@/command-center/types";
import { studentIntents } from "@/command-center/intents/students";

// Order matters: interpret() returns the first matching intent, so more
// specific/keyword-constrained intents should appear before broader ones.
export const intentDefinitions: IntentDefinition[] = [...studentIntents];
```

- [ ] **Step 3: Type-check**

Run from `app/`: `npx tsc -b`. Expected: no errors.

- [ ] **Step 4: Manual verification in the browser**

With `npm run dev` running, open `/admin`, press `Ctrl+K`, and check:
1. Type `students with pending fees` — confirm a record-table appears with a headline count, and each row shows a colored Paid/Pending/Overdue-style `StatusChip` and a balance in ₹. Click a row and confirm it navigates to that student's profile.
2. Cross-check the count: open `/admin/fees/ledger` in a new tab, set the Status filter to something other than "Paid" one at a time (Pending, Overdue) and sum the row counts shown — it should equal the count in the command-center headline (the ledger page paginates, so use the pagination control's total if shown, or count via the Status filter one value at a time).
3. Type `students below 75% attendance` — confirm the headline count and table match rows filtered from `/admin/students` sorted ascending by Attendance %.
4. Type `backlog students` — confirm only students with "Academic Status" = Backlog on `/admin/students` appear.
5. Type `top students by cgpa` and then `bottom students by cgpa` — confirm the two results show opposite sort order.

- [ ] **Step 5: Commit**

```bash
git add app/src/command-center
git commit -m "Add students & fees intents to the command center"
```

---

### Task 3: Attendance-Today & Faculty Intents

**Files:**
- Create: `app/src/command-center/intents/attendanceToday.ts`
- Create: `app/src/command-center/intents/faculty.ts`
- Modify: `app/src/command-center/registry.ts`

**Interfaces:**
- Consumes: `getTodayAttendance` (`@/api/attendance`), `getStudents` (`@/api/students`), `getFaculty` (`@/api/faculty`), `getDepartments` (`@/api/departments`), `departmentSeeds` (`@/demo-data/academics/departmentSeeds` — static reference constant, see Global Constraints), `extractPercent`/`extractComparisonDirection`/`matchByNameOrId` (`@/command-center/shared`).
- Produces: `attendanceTodayIntents: IntentDefinition[]` (1 intent), `facultyIntents: IntentDefinition[]` (3 intents: on-leave, experience threshold, by-department).

- [ ] **Step 1: Create the attendance-today intent**

Create `app/src/command-center/intents/attendanceToday.ts`:

```ts
import { getTodayAttendance } from "@/api/attendance";
import { getStudents } from "@/api/students";
import type { CommandResult, CommandTableRow, IntentDefinition } from "@/command-center/types";

function isAbsentTodayQuery(queryLower: string): boolean {
  return queryLower.includes("absent") || (queryLower.includes("attendance") && queryLower.includes("today"));
}

async function executeAbsentTodayQuery(): Promise<CommandResult> {
  const [attendance, students] = await Promise.all([getTodayAttendance(), getStudents()]);
  const studentById = new Map(students.map((s) => [s.id, s]));
  const absentees = attendance.filter((a) => a.status === "absent");

  const rows: CommandTableRow[] = absentees.slice(0, 8).map((a) => {
    const student = studentById.get(a.studentId);
    return {
      id: a.id,
      path: student ? `/admin/students/${student.id}` : "/admin/attendance",
      name: student?.name ?? a.studentId,
      rollNo: student?.rollNo ?? "—",
      program: student?.program ?? "—",
    };
  });

  return {
    kind: "record-table",
    summary: `${absentees.length} of ${attendance.length} students are absent today.`,
    columns: [
      { key: "name", label: "Student" },
      { key: "rollNo", label: "Roll No" },
      { key: "program", label: "Program" },
    ],
    rows,
    viewAllPath: "/admin/attendance",
    viewAllLabel: "View attendance",
  };
}

const absentTodayIntent: IntentDefinition = {
  id: "attendance-absent-today",
  matches: isAbsentTodayQuery,
  execute: executeAbsentTodayQuery,
};

export const attendanceTodayIntents: IntentDefinition[] = [absentTodayIntent];
```

- [ ] **Step 2: Create the faculty intents**

Create `app/src/command-center/intents/faculty.ts`:

```ts
import { getFaculty } from "@/api/faculty";
import { getDepartments } from "@/api/departments";
import { departmentSeeds } from "@/demo-data/academics/departmentSeeds";
import type { CommandResult, CommandTableRow, IntentDefinition } from "@/command-center/types";
import { extractPercent, extractComparisonDirection, matchByNameOrId } from "@/command-center/shared";

const FACULTY_WORDS = ["faculty", "professor", "professors", "teacher", "teachers", "lecturer", "lecturers"];

function mentionsFaculty(queryLower: string): boolean {
  return FACULTY_WORDS.some((w) => queryLower.includes(w));
}

function isFacultyOnLeaveQuery(queryLower: string): boolean {
  return mentionsFaculty(queryLower) && queryLower.includes("leave");
}

async function executeFacultyOnLeaveQuery(): Promise<CommandResult> {
  const faculty = await getFaculty();
  const onLeave = faculty.filter((f) => f.status === "on_leave");

  const rows: CommandTableRow[] = onLeave.slice(0, 8).map((f) => ({
    id: f.id,
    path: "/admin/faculty",
    name: f.name,
    designation: f.designation.replace(/_/g, " "),
    email: f.email,
  }));

  return {
    kind: "record-table",
    summary: `${onLeave.length} faculty member${onLeave.length === 1 ? " is" : "s are"} currently on leave.`,
    columns: [
      { key: "name", label: "Name" },
      { key: "designation", label: "Designation" },
      { key: "email", label: "Email" },
    ],
    rows,
    viewAllPath: "/admin/faculty",
    viewAllLabel: "View all faculty",
  };
}

const facultyOnLeaveIntent: IntentDefinition = {
  id: "faculty-on-leave",
  matches: isFacultyOnLeaveQuery,
  execute: executeFacultyOnLeaveQuery,
};

function isFacultyExperienceQuery(queryLower: string): boolean {
  return (
    mentionsFaculty(queryLower) &&
    queryLower.includes("experience") &&
    extractComparisonDirection(queryLower) !== null &&
    extractPercent(queryLower) !== null
  );
}

async function executeFacultyExperienceQuery(query: string): Promise<CommandResult> {
  const queryLower = query.toLowerCase();
  const threshold = extractPercent(queryLower) as number;
  const direction = extractComparisonDirection(queryLower) as "below" | "above";
  const faculty = await getFaculty();
  const matching = faculty.filter((f) => (direction === "below" ? f.experienceYears < threshold : f.experienceYears > threshold));
  const sorted = [...matching].sort((a, b) => (direction === "below" ? a.experienceYears - b.experienceYears : b.experienceYears - a.experienceYears));

  const rows: CommandTableRow[] = sorted.slice(0, 8).map((f) => ({
    id: f.id,
    path: "/admin/faculty",
    name: f.name,
    designation: f.designation.replace(/_/g, " "),
    experience: `${f.experienceYears} yrs`,
  }));

  return {
    kind: "record-table",
    summary: `${matching.length} faculty member${matching.length === 1 ? " has" : "s have"} ${direction === "below" ? "under" : "over"} ${threshold} years of experience.`,
    columns: [
      { key: "name", label: "Name" },
      { key: "designation", label: "Designation" },
      { key: "experience", label: "Experience" },
    ],
    rows,
    viewAllPath: "/admin/faculty",
    viewAllLabel: "View all faculty",
  };
}

const facultyExperienceIntent: IntentDefinition = {
  id: "faculty-experience-threshold",
  matches: isFacultyExperienceQuery,
  execute: executeFacultyExperienceQuery,
};

function isFacultyByDepartmentQuery(queryLower: string): boolean {
  return mentionsFaculty(queryLower) && matchByNameOrId(queryLower, departmentSeeds) !== null;
}

async function executeFacultyByDepartmentQuery(query: string): Promise<CommandResult> {
  const queryLower = query.toLowerCase();
  const seed = matchByNameOrId(queryLower, departmentSeeds) as { id: string; name: string };
  const [faculty, departments] = await Promise.all([getFaculty(), getDepartments()]);
  const department = departments.find((d) => d.id === seed.id);
  const matching = faculty.filter((f) => f.departmentId === seed.id);

  const rows: CommandTableRow[] = matching.slice(0, 8).map((f) => ({
    id: f.id,
    path: "/admin/faculty",
    name: f.name,
    designation: f.designation.replace(/_/g, " "),
    email: f.email,
  }));

  return {
    kind: "record-table",
    summary: `${matching.length} faculty member${matching.length === 1 ? "" : "s"} in ${department?.name ?? seed.name}.`,
    columns: [
      { key: "name", label: "Name" },
      { key: "designation", label: "Designation" },
      { key: "email", label: "Email" },
    ],
    rows,
    viewAllPath: "/admin/faculty",
    viewAllLabel: "View all faculty",
  };
}

const facultyByDepartmentIntent: IntentDefinition = {
  id: "faculty-by-department",
  matches: isFacultyByDepartmentQuery,
  execute: executeFacultyByDepartmentQuery,
};

export const facultyIntents: IntentDefinition[] = [
  facultyOnLeaveIntent,
  facultyExperienceIntent,
  facultyByDepartmentIntent,
];
```

- [ ] **Step 3: Wire into the registry**

Replace the full contents of `app/src/command-center/registry.ts`:

```ts
import type { IntentDefinition } from "@/command-center/types";
import { studentIntents } from "@/command-center/intents/students";
import { attendanceTodayIntents } from "@/command-center/intents/attendanceToday";
import { facultyIntents } from "@/command-center/intents/faculty";

// Order matters: interpret() returns the first matching intent, so more
// specific/keyword-constrained intents should appear before broader ones.
export const intentDefinitions: IntentDefinition[] = [
  ...studentIntents,
  ...attendanceTodayIntents,
  ...facultyIntents,
];
```

- [ ] **Step 4: Type-check**

Run from `app/`: `npx tsc -b`. Expected: no errors.

- [ ] **Step 5: Manual verification in the browser**

With the dev server running, press `Ctrl+K` and check:
1. Type `how many students absent today` — confirm the headline count matches what you see by opening `/admin/attendance` and counting rows marked Absent.
2. Type `faculty on leave` — confirm rows shown match faculty with Account Status "on_leave" on `/admin/faculty` (open the "view" dialog on a couple of rows there to cross-check status).
3. Type `professors in CSE department` (or another department name, e.g. `faculty in mechanical`) — confirm every row belongs to that department.
4. Type `faculty with 10 years experience` — confirm results are faculty with experience above 10 (the word "with" alone doesn't set a direction; use "more than 10 years experience" or "under 5 years experience" to exercise both directions explicitly).

- [ ] **Step 6: Commit**

```bash
git add app/src/command-center
git commit -m "Add attendance-today and faculty intents to the command center"
```

---

### Task 4: Department & Hostel Intents

**Files:**
- Create: `app/src/command-center/intents/departments.ts`
- Create: `app/src/command-center/intents/hostel.ts`
- Modify: `app/src/command-center/registry.ts`

**Interfaces:**
- Consumes: `getDepartments` (`@/api/departments`), `getHostelStats` (`@/api/hostelStats`).
- Produces: `departmentIntents: IntentDefinition[]` (2 intents: at-risk, ranking by attendance/pass-rate), `hostelIntents: IntentDefinition[]` (1 intent: occupancy).

- [ ] **Step 1: Create the department intents**

Create `app/src/command-center/intents/departments.ts`:

```ts
import { getDepartments } from "@/api/departments";
import type { CommandResult, CommandTableRow, IntentDefinition } from "@/command-center/types";

function isAtRiskQuery(queryLower: string): boolean {
  return queryLower.includes("at-risk") || queryLower.includes("at risk");
}

async function executeAtRiskQuery(): Promise<CommandResult> {
  const departments = await getDepartments();
  const sorted = [...departments].sort((a, b) => b.atRiskStudentCount - a.atRiskStudentCount);
  const totalAtRisk = departments.reduce((sum, d) => sum + d.atRiskStudentCount, 0);

  const rows: CommandTableRow[] = sorted.map((d) => ({
    id: d.id,
    path: `/admin/departments/${d.id}`,
    name: d.name,
    atRisk: d.atRiskStudentCount,
  }));

  return {
    kind: "record-table",
    summary: `${totalAtRisk} student${totalAtRisk === 1 ? " is" : "s are"} flagged as at-risk across all departments.`,
    columns: [
      { key: "name", label: "Department" },
      { key: "atRisk", label: "At-Risk Students" },
    ],
    rows,
    viewAllPath: "/admin/departments",
    viewAllLabel: "View all departments",
  };
}

const atRiskIntent: IntentDefinition = { id: "at-risk-by-department", matches: isAtRiskQuery, execute: executeAtRiskQuery };

function isDepartmentRankingQuery(queryLower: string): boolean {
  return (
    queryLower.includes("department") &&
    (queryLower.includes("attendance") || queryLower.includes("pass rate") || queryLower.includes("passing")) &&
    (queryLower.includes("lowest") || queryLower.includes("highest") || queryLower.includes("best") || queryLower.includes("worst") || queryLower.includes("top"))
  );
}

async function executeDepartmentRankingQuery(query: string): Promise<CommandResult> {
  const queryLower = query.toLowerCase();
  const departments = await getDepartments();
  const metric: "avgAttendancePct" | "passRatePct" = queryLower.includes("attendance") ? "avgAttendancePct" : "passRatePct";
  const wantsLowest = queryLower.includes("lowest") || queryLower.includes("worst");
  const sorted = [...departments].sort((a, b) => (wantsLowest ? a[metric] - b[metric] : b[metric] - a[metric]));
  const top = sorted.slice(0, 5);
  const metricLabel = metric === "avgAttendancePct" ? "Attendance %" : "Pass Rate %";

  const rows: CommandTableRow[] = top.map((d) => ({
    id: d.id,
    path: `/admin/departments/${d.id}`,
    name: d.name,
    metric: `${d[metric]}%`,
  }));

  return {
    kind: "record-table",
    summary: `Departments ranked by ${wantsLowest ? "lowest" : "highest"} ${metricLabel.toLowerCase()}.`,
    columns: [
      { key: "name", label: "Department" },
      { key: "metric", label: metricLabel },
    ],
    rows,
    viewAllPath: "/admin/departments",
    viewAllLabel: "View all departments",
  };
}

const departmentRankingIntent: IntentDefinition = {
  id: "department-ranking",
  matches: isDepartmentRankingQuery,
  execute: executeDepartmentRankingQuery,
};

export const departmentIntents: IntentDefinition[] = [atRiskIntent, departmentRankingIntent];
```

- [ ] **Step 2: Create the hostel intent**

Create `app/src/command-center/intents/hostel.ts`:

```ts
import { getHostelStats } from "@/api/hostelStats";
import type { CommandResult, IntentDefinition } from "@/command-center/types";

function isHostelOccupancyQuery(queryLower: string): boolean {
  const occupancyWords = ["occupancy", "occupied", "vacant", "available", "rooms", "beds"];
  return queryLower.includes("hostel") && occupancyWords.some((w) => queryLower.includes(w));
}

async function executeHostelOccupancyQuery(): Promise<CommandResult> {
  const stats = await getHostelStats();
  const occupancyPct = Math.round((stats.occupied / stats.totalBeds) * 1000) / 10;

  return {
    kind: "stat-answer",
    summary: `${stats.occupied} of ${stats.totalBeds} hostel beds are occupied (${occupancyPct}%).`,
    note: `${stats.available} beds available, ${stats.maintenance} under maintenance.`,
    actionPath: "/admin/hostel",
    actionLabel: "View Hostel Management",
  };
}

const hostelOccupancyIntent: IntentDefinition = {
  id: "hostel-occupancy",
  matches: isHostelOccupancyQuery,
  execute: executeHostelOccupancyQuery,
};

export const hostelIntents: IntentDefinition[] = [hostelOccupancyIntent];
```

- [ ] **Step 3: Wire into the registry**

Replace the full contents of `app/src/command-center/registry.ts`:

```ts
import type { IntentDefinition } from "@/command-center/types";
import { studentIntents } from "@/command-center/intents/students";
import { attendanceTodayIntents } from "@/command-center/intents/attendanceToday";
import { facultyIntents } from "@/command-center/intents/faculty";
import { departmentIntents } from "@/command-center/intents/departments";
import { hostelIntents } from "@/command-center/intents/hostel";

// Order matters: interpret() returns the first matching intent, so more
// specific/keyword-constrained intents should appear before broader ones.
export const intentDefinitions: IntentDefinition[] = [
  ...studentIntents,
  ...attendanceTodayIntents,
  ...facultyIntents,
  ...departmentIntents,
  ...hostelIntents,
];
```

- [ ] **Step 4: Type-check**

Run from `app/`: `npx tsc -b`. Expected: no errors.

- [ ] **Step 5: Manual verification in the browser**

With the dev server running, press `Ctrl+K` and check:
1. Type `at-risk students by department` — confirm the departments are sorted descending by At-Risk Students, and the total in the headline equals the sum shown across the rows.
2. Type `department with lowest attendance` and then `department with highest pass rate` — confirm the sort direction and metric column change accordingly (cross-check against `/admin/departments`, which shows `avgAttendancePct` and `passRatePct` per department).
3. Type `hostel occupancy` — confirm the numbers match `/admin/hostel` (Total Beds, Occupied, Available, Maintenance), and clicking "View Hostel Management" navigates there.

- [ ] **Step 6: Commit**

```bash
git add app/src/command-center
git commit -m "Add department and hostel intents to the command center"
```

---

### Task 5: Library & Ticket Intents

**Files:**
- Create: `app/src/command-center/intents/library.ts`
- Create: `app/src/command-center/intents/tickets.tsx`
- Modify: `app/src/command-center/registry.ts`

**Interfaces:**
- Consumes: `getLibraryTransactions` (`@/api/libraryTransactions`), `getBooks` (`@/api/books`), `getStudents` (`@/api/students`), `getTickets` (`@/api/tickets`), `StatusChip` (`@/components/StatusChip`), `Ticket` type (`@/types`).
- Produces: `libraryIntents: IntentDefinition[]` (1 intent: overdue books), `ticketIntents: IntentDefinition[]` (3 intents: critical, SLA-breach, open).

- [ ] **Step 1: Create the library intent**

Create `app/src/command-center/intents/library.ts`:

```ts
import { getLibraryTransactions } from "@/api/libraryTransactions";
import { getBooks } from "@/api/books";
import { getStudents } from "@/api/students";
import type { CommandResult, CommandTableRow, IntentDefinition } from "@/command-center/types";

function isOverdueBooksQuery(queryLower: string): boolean {
  return (queryLower.includes("book") || queryLower.includes("library")) && queryLower.includes("overdue");
}

async function executeOverdueBooksQuery(): Promise<CommandResult> {
  const [transactions, books, students] = await Promise.all([getLibraryTransactions(), getBooks(), getStudents()]);
  const bookById = new Map(books.map((b) => [b.id, b]));
  const studentById = new Map(students.map((s) => [s.id, s]));
  const overdue = transactions.filter((t) => t.status === "overdue");

  const rows: CommandTableRow[] = overdue.slice(0, 8).map((t) => ({
    id: t.id,
    path: "/admin/library",
    title: bookById.get(t.bookId)?.title ?? t.bookId,
    student: studentById.get(t.studentId)?.name ?? t.studentId,
    dueDate: t.dueDate,
  }));

  return {
    kind: "record-table",
    summary: `${overdue.length} book${overdue.length === 1 ? " is" : "s are"} overdue.`,
    columns: [
      { key: "title", label: "Book" },
      { key: "student", label: "Borrower" },
      { key: "dueDate", label: "Due Date" },
    ],
    rows,
    viewAllPath: "/admin/library",
    viewAllLabel: "View library management",
  };
}

const overdueBooksIntent: IntentDefinition = {
  id: "library-overdue-books",
  matches: isOverdueBooksQuery,
  execute: executeOverdueBooksQuery,
};

export const libraryIntents: IntentDefinition[] = [overdueBooksIntent];
```

- [ ] **Step 2: Create the ticket intents**

Create `app/src/command-center/intents/tickets.tsx`:

```tsx
import { getTickets } from "@/api/tickets";
import StatusChip from "@/components/StatusChip";
import type { CommandResult, CommandTableRow, IntentDefinition } from "@/command-center/types";
import type { Ticket } from "@/types";

function mentionsTickets(queryLower: string): boolean {
  return queryLower.includes("ticket");
}

function buildTicketRows(tickets: Ticket[]): CommandTableRow[] {
  return tickets.slice(0, 8).map((t) => ({
    id: t.id,
    path: `/admin/tickets/${t.id}`,
    title: t.title,
    location: t.location,
    priority: <StatusChip status={t.priority} />,
    status: <StatusChip status={t.status} />,
  }));
}

const TICKET_COLUMNS = [
  { key: "title", label: "Issue" },
  { key: "location", label: "Location" },
  { key: "priority", label: "Priority" },
  { key: "status", label: "Status" },
];

function isCriticalTicketsQuery(queryLower: string): boolean {
  return mentionsTickets(queryLower) && queryLower.includes("critical");
}

async function executeCriticalTicketsQuery(): Promise<CommandResult> {
  const tickets = await getTickets();
  const critical = tickets.filter((t) => t.priority === "critical" && t.status !== "resolved");

  return {
    kind: "record-table",
    summary: `${critical.length} critical ticket${critical.length === 1 ? "" : "s"} open.`,
    columns: TICKET_COLUMNS,
    rows: buildTicketRows(critical),
    viewAllPath: "/admin/tickets",
    viewAllLabel: "View all tickets",
  };
}

const criticalTicketsIntent: IntentDefinition = {
  id: "tickets-critical",
  matches: isCriticalTicketsQuery,
  execute: executeCriticalTicketsQuery,
};

function isSlaBreachQuery(queryLower: string): boolean {
  return mentionsTickets(queryLower) && (queryLower.includes("sla") || queryLower.includes("breach"));
}

async function executeSlaBreachQuery(): Promise<CommandResult> {
  const tickets = await getTickets();
  const breached = tickets.filter((t) => t.slaState === "breached");

  return {
    kind: "record-table",
    summary: `${breached.length} ticket${breached.length === 1 ? "" : "s"} breaching SLA.`,
    columns: TICKET_COLUMNS,
    rows: buildTicketRows(breached),
    viewAllPath: "/admin/tickets",
    viewAllLabel: "View all tickets",
  };
}

const slaBreachIntent: IntentDefinition = { id: "tickets-sla-breach", matches: isSlaBreachQuery, execute: executeSlaBreachQuery };

function isOpenTicketsQuery(queryLower: string): boolean {
  return mentionsTickets(queryLower) && (queryLower.includes("open") || queryLower.includes("pending"));
}

async function executeOpenTicketsQuery(): Promise<CommandResult> {
  const tickets = await getTickets();
  const open = tickets.filter((t) => t.status !== "resolved");

  return {
    kind: "record-table",
    summary: `${open.length} ticket${open.length === 1 ? "" : "s"} open.`,
    columns: TICKET_COLUMNS,
    rows: buildTicketRows(open),
    viewAllPath: "/admin/tickets",
    viewAllLabel: "View all tickets",
  };
}

const openTicketsIntent: IntentDefinition = { id: "tickets-open", matches: isOpenTicketsQuery, execute: executeOpenTicketsQuery };

export const ticketIntents: IntentDefinition[] = [criticalTicketsIntent, slaBreachIntent, openTicketsIntent];
```

- [ ] **Step 3: Wire into the registry**

Replace the full contents of `app/src/command-center/registry.ts`:

```ts
import type { IntentDefinition } from "@/command-center/types";
import { studentIntents } from "@/command-center/intents/students";
import { attendanceTodayIntents } from "@/command-center/intents/attendanceToday";
import { facultyIntents } from "@/command-center/intents/faculty";
import { departmentIntents } from "@/command-center/intents/departments";
import { hostelIntents } from "@/command-center/intents/hostel";
import { libraryIntents } from "@/command-center/intents/library";
import { ticketIntents } from "@/command-center/intents/tickets";

// Order matters: interpret() returns the first matching intent, so more
// specific/keyword-constrained intents should appear before broader ones.
export const intentDefinitions: IntentDefinition[] = [
  ...studentIntents,
  ...attendanceTodayIntents,
  ...facultyIntents,
  ...departmentIntents,
  ...hostelIntents,
  ...libraryIntents,
  ...ticketIntents,
];
```

- [ ] **Step 4: Type-check**

Run from `app/`: `npx tsc -b`. Expected: no errors.

- [ ] **Step 5: Manual verification in the browser**

With the dev server running, press `Ctrl+K` and check:
1. Type `overdue library books` — confirm rows match `/admin/library` transactions with status Overdue, with the correct book title and borrower name.
2. Type `critical tickets` — confirm every row has a "Critical" priority chip and none show "Resolved" status, matching `/admin/tickets` filtered.
3. Type `tickets breaching sla` — confirm rows match tickets whose SLA state is "breached" on `/admin/tickets`.
4. Type `open tickets` — confirm resolved tickets are excluded. Click a row and confirm it navigates to `/admin/tickets/<id>`.

- [ ] **Step 6: Commit**

```bash
git add app/src/command-center
git commit -m "Add library and ticket intents to the command center"
```

---

### Task 6: Exam/Notice & System/Audit Intents + Full Smoke Test

**Files:**
- Create: `app/src/command-center/intents/examsAndNotices.ts`
- Create: `app/src/command-center/intents/system.ts`
- Modify: `app/src/command-center/registry.ts`

**Interfaces:**
- Consumes: `getExams` (`@/api/exams`), `getCourses` (`@/api/courses`), `getNotices` (`@/api/notices`), `getSystemHealth` (`@/api/systemHealth`), `getAuditLogs` (`@/api/auditLogs`).
- Produces: `examAndNoticeIntents: IntentDefinition[]` (2 intents), `systemIntents: IntentDefinition[]` (2 intents). This is the final registry — all 9 domain intent groups now wired.

- [ ] **Step 1: Create the exam/notice intents**

Create `app/src/command-center/intents/examsAndNotices.ts`:

```ts
import { getExams } from "@/api/exams";
import { getCourses } from "@/api/courses";
import { getNotices } from "@/api/notices";
import type { CommandResult, CommandTableRow, IntentDefinition } from "@/command-center/types";

function isUpcomingExamsQuery(queryLower: string): boolean {
  return queryLower.includes("exam") && (queryLower.includes("upcoming") || queryLower.includes("schedule"));
}

async function executeUpcomingExamsQuery(): Promise<CommandResult> {
  const [exams, courses] = await Promise.all([getExams(), getCourses()]);
  const courseById = new Map(courses.map((c) => [c.id, c]));
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = exams.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));

  const rows: CommandTableRow[] = upcoming.slice(0, 8).map((e) => ({
    id: e.id,
    path: "/admin/exams",
    course: courseById.get(e.courseId)?.name ?? e.courseId,
    date: e.date,
    venue: e.venue,
  }));

  return {
    kind: "record-table",
    summary: `${upcoming.length} upcoming exam${upcoming.length === 1 ? "" : "s"} scheduled.`,
    columns: [
      { key: "course", label: "Course" },
      { key: "date", label: "Date" },
      { key: "venue", label: "Venue" },
    ],
    rows,
    viewAllPath: "/admin/exams",
    viewAllLabel: "View exam schedule",
  };
}

const upcomingExamsIntent: IntentDefinition = {
  id: "exams-upcoming",
  matches: isUpcomingExamsQuery,
  execute: executeUpcomingExamsQuery,
};

function isRecentNoticesQuery(queryLower: string): boolean {
  return queryLower.includes("notice") && (queryLower.includes("recent") || queryLower.includes("latest"));
}

async function executeRecentNoticesQuery(): Promise<CommandResult> {
  const notices = await getNotices();
  const published = notices
    .filter((n) => n.status === "published" && n.publishedDate)
    .sort((a, b) => (b.publishedDate ?? "").localeCompare(a.publishedDate ?? ""));

  const rows: CommandTableRow[] = published.slice(0, 8).map((n) => ({
    id: n.id,
    path: "/admin/notices",
    title: n.title,
    audience: n.audience,
    publishedDate: n.publishedDate ?? "—",
  }));

  return {
    kind: "record-table",
    summary: `${published.length} published notice${published.length === 1 ? "" : "s"}, most recent first.`,
    columns: [
      { key: "title", label: "Title" },
      { key: "audience", label: "Audience" },
      { key: "publishedDate", label: "Published" },
    ],
    rows,
    viewAllPath: "/admin/notices",
    viewAllLabel: "View all notices",
  };
}

const recentNoticesIntent: IntentDefinition = {
  id: "notices-recent",
  matches: isRecentNoticesQuery,
  execute: executeRecentNoticesQuery,
};

export const examAndNoticeIntents: IntentDefinition[] = [upcomingExamsIntent, recentNoticesIntent];
```

- [ ] **Step 2: Create the system/audit intents**

Create `app/src/command-center/intents/system.ts`:

```ts
import { getSystemHealth } from "@/api/systemHealth";
import { getAuditLogs } from "@/api/auditLogs";
import type { CommandResult, CommandTableRow, IntentDefinition } from "@/command-center/types";

function isSystemHealthQuery(queryLower: string): boolean {
  return queryLower.includes("system") && (queryLower.includes("health") || queryLower.includes("status"));
}

async function executeSystemHealthQuery(): Promise<CommandResult> {
  const health = await getSystemHealth();

  return {
    kind: "stat-answer",
    summary: `System uptime is ${health.uptimePct}%. CPU ${health.cpuPct}%, memory ${health.memoryPct}%, disk ${health.diskPct}%.`,
    note: health.databaseHealthy ? "Database is healthy." : "Database is reporting issues.",
    actionPath: "/admin/system-health",
    actionLabel: "View System Health",
  };
}

const systemHealthIntent: IntentDefinition = { id: "system-health", matches: isSystemHealthQuery, execute: executeSystemHealthQuery };

function isFailedLoginsQuery(queryLower: string): boolean {
  return (queryLower.includes("audit") || queryLower.includes("login")) && queryLower.includes("failed");
}

async function executeFailedLoginsQuery(): Promise<CommandResult> {
  const logs = await getAuditLogs();
  const failed = logs.filter((l) => l.status === "failed").sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const rows: CommandTableRow[] = failed.slice(0, 8).map((l) => ({
    id: l.id,
    path: "/admin/audit-logs",
    actorEmail: l.actorEmail,
    action: l.action,
    timestamp: l.timestamp,
  }));

  return {
    kind: "record-table",
    summary: `${failed.length} failed action${failed.length === 1 ? "" : "s"} in the audit log.`,
    columns: [
      { key: "actorEmail", label: "Actor" },
      { key: "action", label: "Action" },
      { key: "timestamp", label: "Timestamp" },
    ],
    rows,
    viewAllPath: "/admin/audit-logs",
    viewAllLabel: "View audit logs",
  };
}

const failedLoginsIntent: IntentDefinition = {
  id: "audit-failed-actions",
  matches: isFailedLoginsQuery,
  execute: executeFailedLoginsQuery,
};

export const systemIntents: IntentDefinition[] = [systemHealthIntent, failedLoginsIntent];
```

- [ ] **Step 3: Wire into the registry (final form)**

Replace the full contents of `app/src/command-center/registry.ts`:

```ts
import type { IntentDefinition } from "@/command-center/types";
import { studentIntents } from "@/command-center/intents/students";
import { attendanceTodayIntents } from "@/command-center/intents/attendanceToday";
import { facultyIntents } from "@/command-center/intents/faculty";
import { departmentIntents } from "@/command-center/intents/departments";
import { hostelIntents } from "@/command-center/intents/hostel";
import { libraryIntents } from "@/command-center/intents/library";
import { ticketIntents } from "@/command-center/intents/tickets";
import { examAndNoticeIntents } from "@/command-center/intents/examsAndNotices";
import { systemIntents } from "@/command-center/intents/system";

// Order matters: interpret() returns the first matching intent, so more
// specific/keyword-constrained intents should appear before broader ones.
export const intentDefinitions: IntentDefinition[] = [
  ...studentIntents,
  ...attendanceTodayIntents,
  ...facultyIntents,
  ...departmentIntents,
  ...hostelIntents,
  ...libraryIntents,
  ...ticketIntents,
  ...examAndNoticeIntents,
  ...systemIntents,
];
```

- [ ] **Step 4: Type-check**

Run from `app/`: `npx tsc -b`. Expected: no errors.

- [ ] **Step 5: Full manual smoke test across every domain**

With the dev server running, open `/admin`, press `Ctrl+K` for each query below, and confirm a sensible, non-crashing result appears (either a stat/table matching the corresponding admin page, or in the exam/notice case, dates in Dec 2026 relative to a `2026-07-15` "today"):

1. `upcoming exams` — table sorted by date ascending, all in Dec 2026.
2. `recent notices` — table of published notices, most recent `publishedDate` first.
3. `system health status` — stat-answer with uptime/CPU/memory/disk figures matching `/admin/system-health`.
4. `failed logins` (and `audit failed`) — table of audit entries with Status = Failed, most recent first, matching `/admin/audit-logs`.
5. Re-run every example query from Tasks 2–5 once more end-to-end (fees, attendance threshold, backlog, CGPA, absent-today, faculty on-leave/experience/department, at-risk, department ranking, hostel occupancy, overdue books, critical/SLA/open tickets) to confirm nothing in the final registry ordering broke an earlier intent.
6. Confirm the idle-state example queries (from Task 1) still work by clicking one directly.
7. Confirm keyboard-only flow: `Ctrl+K` → type partial query → `↓`/`↑` to move through nav/record suggestions → `Enter` to navigate, for at least one no-match-with-suggestions case and one nav-suggestion case.

- [ ] **Step 6: Commit**

```bash
git add app/src/command-center
git commit -m "Add exam/notice and system/audit intents; complete command center v1 coverage"
```

---

## Post-Implementation Note

This completes v1 (Admin, read-only). Future phases (not part of this plan): extending the same `CommandCenterDialog` shell to Teacher/Staff/Student portals with their own intent registries, and swapping `interpret()`'s local pattern matching for a real LLM-backed backend — both were designed for explicitly in the approved spec (`docs/superpowers/specs/2026-07-15-admin-command-center-design.md`) and require no changes to `CommandResult`, `execute()`, or `ResultView.tsx`.
