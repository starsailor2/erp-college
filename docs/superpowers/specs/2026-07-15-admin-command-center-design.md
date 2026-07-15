# Admin Command Center (Ctrl+K) — Design

## Purpose

A universal search/command overlay for the Admin portal, opened with `Ctrl+K` /
`Cmd+K` from anywhere. An admin can ask a natural-language question about the
college ("how many students haven't paid their fees") and get an answer drawn
from live app data, or just start typing a page/record name to jump straight
to it. This is phase one of a broader command center; later phases extend the
same shell to the Teacher, Staff, and Student portals.

## Scope (v1)

- **Admin portal only.** Teacher/Staff/Student are future phases, reusing the
  same shell with their own intent registries.
- **Read + navigate only.** No mutations (creating notices, resolving tickets,
  etc.) from the command bar. Actions deep-link to the page where the existing
  form/table UI (with its own validation) takes over.
- **Local, rule-based query understanding — designed to be swapped for a real
  LLM later without touching anything else.** No backend, no API keys, no
  network calls in v1.
- **All data access goes through the existing `api/*.ts` layer.** The command
  center never imports from `demo-data/*` directly. Where a question needs
  data from more than one domain (e.g. students + their fee ledger entries),
  the join/filter happens inside the command-center module, calling multiple
  existing `api/*.ts` functions — consistent with how `api/*.ts` files today
  each own a single domain with no cross-domain functions.

## Architecture

New module: `app/src/command-center/`

```
query string
   │
   ▼
interpret(query) ──► Intent (or null)
   │                     │
   │                     ▼
   │                 execute(Intent) ──► calls one or more api/*.ts functions,
   │                                      joins/filters in this module
   │                     │
   │                     ▼
   │                 CommandResult
   ▼
render(CommandResult | fuzzy fallback)
```

- **`interpret(query: string): Intent | null`** — matches the query against a
  registry of intent definitions (one file per domain under
  `command-center/intents/`). Each definition has a keyword/pattern matcher and
  entity extraction (numbers, percentages, status words like "unpaid" /
  "overdue" / "critical", department or program names, "today"). Pure,
  synchronous, no I/O.
  - **This function is the sole extension point for a future real LLM.** Its
    signature and the `Intent` shape it returns stay the same whether the
    implementation is local pattern matching or a network call to a backend —
    nothing downstream needs to change when that swap happens.
- **`execute(intent: Intent): Promise<CommandResult>`** — each intent has a
  handler that calls the relevant existing `api/*.ts` function(s) (e.g.
  `getStudents()`, `getFeeLedger()`, `getDepartments()`, `getTickets()`) and
  shapes a `CommandResult`. New `api/*.ts` functions are added only when a
  genuinely reusable single-domain query is missing (e.g. an aggregate that
  doesn't exist yet) — never as a bypass around the layer.
- **`CommandResult`** — a small discriminated union:
  - `stat-answer`: headline sentence + optional supporting number
  - `record-table`: headline + rows rendered via the existing `DataTable`
    component, each row navigable to its profile/detail page
  - `record-list`: fuzzy-matched individual records (student/faculty/ticket/
    asset by name or ID) — jumps straight to the profile
  - `nav-suggestions`: fuzzy-matched admin pages by label
  - `no-match`: friendly fallback message + best-effort nav/record suggestions

### Fallback layer (always active alongside intent matching)

Two cheap, general-purpose matchers run on every query in addition to intent
matching, so the bar is useful even for questions with no dedicated intent:

1. **Nav fuzzy search** — matches the query against all admin nav item labels
   (from the existing `getNavItems()` in `components/navigation.tsx`) so
   typing part of any page name jumps there.
2. **Record fuzzy search** — matches against student/faculty/ticket/asset
   name, roll no., ID, or email (via existing `api/*.ts` list functions) so
   typing a name/ID jumps to that record's profile page.

If a data-question intent matches, its answer is shown first with nav/record
matches as secondary suggestions below. If no intent matches, whichever fuzzy
layer has hits becomes the primary result; if neither hits, the no-match state
is shown.

## UI / Interaction

- **Shortcut**: `Ctrl+K` / `Cmd+K`, registered once in `Layout.tsx` via a
  global `keydown` listener, active only when `role === "admin"`. Fires
  regardless of current focus (standard command-palette convention,
  `preventDefault()`s the browser's own bindings for that combo) except while
  another dialog is already open, to avoid stacking modals.
- **Modal**: MUI `Dialog`, top-anchored overlay, autofocused text input at the
  top, results below. `Esc` closes. `↑`/`↓` move selection through results,
  `Enter` activates the selected result (navigates or is a no-op for a plain
  stat-answer with no rows).
- **Idle state** (empty query): a short list of example questions ("Students
  with pending fees", "Open critical tickets", "Attendance today") and a few
  frequently-used nav shortcuts, to teach discoverability.
- **Answer state**: headline sentence, then (if applicable) a compact
  `DataTable` of matching records, each row clickable, plus a "View all in
  [Page] →" link to the full page for that domain.
- **No-match state**: friendly message ("I don't have an answer for that yet")
  plus any nav/record fuzzy hits, or a couple of example queries if there are
  none. Never a dead end with nothing actionable.

## Domain Coverage (v1)

Backed by fields that already exist on current types — no new data model
needed for these:

| Domain | Backing data | Example questions |
|---|---|---|
| Students & Fees | `Student.feeStatus`, `Student.attendancePct`, `Student.cgpa`, `Student.status` (backlog), `FeeLedgerEntry` (amounts owed) | "How many students haven't paid fees", "students with pending/overdue fees in [dept/program]", "students below 75% attendance", "backlog students", "top/bottom by CGPA" |
| Attendance (today) | `AttendanceRecord` (today's snapshot only) | "how many students absent today", "list of today's absentees" |
| Faculty | `Faculty.status`, `Faculty.departmentId`, `Faculty.experienceYears` | "faculty on leave", "professors in [department]", "faculty with 10+ years experience" |
| Departments | `Department.passRatePct`, `avgAttendancePct`, `atRiskStudentCount` | "department with lowest pass rate / attendance", "at-risk students by department" |
| Hostel | `HostelStats` | "hostel occupancy", "vacant rooms" |
| Library | `LibraryTransaction.status` | "overdue books", "how many books overdue" |
| Tickets | `Ticket.status`, `Ticket.priority`, `SlaState` | "open tickets", "critical tickets", "tickets breaching SLA" |
| Exams / Notices | `Exam`, `Notice` | "upcoming exams", "recent notices" |
| System / Audit | `SystemHealthMetrics`, `AuditLogEntry` | "system health status", "recent failed logins" |

Plus the generic nav + record fallback described above, which covers every
other admin page and named record even without a dedicated intent.

**Known data limitation, stated plainly in-product rather than faked**: there
is no per-calendar-year fee record (no "fees for 2026" dimension) in the
current data model — only a current `feeStatus` / `FeeLedgerEntry` snapshot.
A query naming a year resolves to the current pending/overdue snapshot, and
the answer copy says so (e.g. "Showing current pending/overdue fee status —
per-year records aren't tracked yet") rather than silently ignoring the year.

## Non-Goals (v1)

- No write/mutation actions triggered from the command bar
- No support for Teacher/Staff/Student portals yet (same shell, later phase)
- No real network or LLM calls — `interpret()` is local and swappable later
- No historical/cumulative attendance beyond what `Student.attendancePct` and
  today's `AttendanceRecord` already provide

## File Layout

```
app/src/command-center/
  types.ts                 # Intent, CommandResult, IntentDefinition
  interpret.ts              # matches query -> Intent, entity extraction helpers
  registry.ts                # aggregates all intent definitions
  intents/
    students.ts               # fees, attendance-threshold, cgpa, backlog
    attendance.ts               # today's attendance
    faculty.ts
    departments.ts
    hostel.ts
    library.ts
    tickets.ts
    examsAndNotices.ts
    system.ts
  fallback/
    navSearch.ts              # fuzzy match against nav items
    recordSearch.ts            # fuzzy match against students/faculty/tickets/assets
  CommandCenterDialog.tsx        # MUI Dialog shell, keyboard nav
  ResultView.tsx                  # renders CommandResult variants
  useCommandCenterHotkey.ts        # global Ctrl+K/Cmd+K listener
```

Mounted from `Layout.tsx`, gated by `role === "admin"`.
