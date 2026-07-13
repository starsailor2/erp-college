# College ERP Rewrite — Phase 0: Foundation Scaffold

Status: Approved
Date: 2026-07-13

## Program context

`erp-college` is being rewritten from four monolithic static HTML files
(`index.html` 16,784 lines, `faculty.html` 6,827 lines, `ops.html` 4,490
lines, `student.html` 6,020 lines — vanilla JS, `innerHTML`-swapped
"screens," demo data mostly hand-typed as markup) into a React +
TypeScript app that mirrors the architecture of the sibling project
`school-erp` (Vite, React 19, TS, react-router-dom v7, MUI v7, Tailwind
v4, recharts, Framer Motion — `src/{components,context,data,demo-data,
pages/<role>,providers,theme,types}`), following the
`dashboard-design-system` skill.

The rewrite is split into 5 sequential sub-projects, each with its own
spec → plan → build cycle:

| Phase | Source file(s) | Target role folder |
|---|---|---|
| 0 — Foundation | `index.html` (login/role-select portion only) | scaffold, no portal content |
| 1 — Admin | `index.html` (26 admin sections, embedded faculty duplicate discarded) | `pages/admin` |
| 2 — Teacher | `faculty.html` (professor/HOD/dean tiers) | `pages/teacher` |
| 3 — Staff | `ops.html` (assigner/executor task tool) | `pages/staff` |
| 4 — Student | `student.html` (20 sections) | `pages/student` |

No Parent portal (erp-college has no parent-facing content today; out
of scope for this rewrite).

This spec covers **Phase 0 only**. Phases 1–4 each get their own spec
before implementation.

## Decisions carried from brainstorming

- **Stack**: identical to school-erp — no new dependencies introduced
  in Phase 0 (explicitly no TanStack Query or other data-fetching
  library).
- **Components**: recreated locally in erp-college's own
  `src/components` (same patterns/names as school-erp: StatCard,
  ChartCard, DataTable, etc.) — not extracted into a shared package
  between the two repos.
- **Branding**: fully monochrome chrome, no dedicated "KALNET blue"
  brand accent. Color is reserved strictly for the status palette and
  identity palette per the design system; navigation, toolbars, and
  buttons are monochrome.
- **Login**: any username/password accepted for a chosen role — no
  real credential validation (matches today's behavior).
- **Data layer**: real API-shaped communication (Promise-returning
  functions), but the page-level consumption idiom matches school-erp
  exactly (see "Data flow" below) — no custom data-fetching hook, no
  query library.
- **Legacy files**: not deleted in Phase 0. Each old HTML file is
  deleted only once every phase that consumes its content is done:
  `index.html` after Phase 1, `faculty.html` after Phase 2, `ops.html`
  after Phase 3, `student.html` after Phase 4.

## Architecture

New Vite + React 19 + TypeScript project at the `erp-college` repo
root (`package.json`/`src` at root level, replacing the old files'
position at the root — the old files stay put until their phase
deletes them, per the table above).

Dependencies (matching school-erp's `package.json`): `react`,
`react-dom`, `react-router-dom` v7, `@mui/material` v7,
`@mui/icons-material` v7, `@emotion/react`, `@emotion/styled`,
`tailwindcss` v4 + `@tailwindcss/vite`, `recharts` v2, `motion` v12.
Dev tooling: Vite 6, TypeScript 5.8 (`tsc -b && vite build`), ESLint 9 +
typescript-eslint — config files (`tsconfig`, `vite.config.ts`,
`eslint.config.js`) ported from school-erp's, adjusted only for the
project name/path aliases.

## Folder structure

```
src/
  api/                    NEW layer — see Data flow
    http.ts               simulateRequest<T>() latency/promise helper
  components/
    Layout.tsx            sidebar + topbar shell
    navigation.tsx         per-role nav config
    StatCard.tsx
    ChartCard.tsx
    DataTable.tsx          dense rows by default
    EmptyState.tsx
    StatusChip.tsx         single status -> {label,color,icon} map
    CategoryTag.tsx
    MetaChip.tsx
    SeverityAvatar.tsx
    PipelineStepper.tsx
    PageHeader.tsx
  context/
    AuthContext.tsx        simulated login/role state
    ColorModeContext.ts
  data/                   (empty in Phase 0; static config added by later phases)
  demo-data/
    generators/
      namePools.ts
      random.ts            seeded PRNG (mulberry32), ported convention
  pages/
    admin/ teacher/ staff/ student/ shared/   (empty dirs; filled in Phases 1-4)
    Login.tsx
    PortalSelection.tsx
  providers/
    ThemeProvider.tsx
  theme/
    tokens.ts               two-tone neutral surfaces, status palette, identity palette
    chartPalette.ts
    index.ts                MUI theme wiring (light/dark)
  types/
    index.ts                Role, User, AuthState — extended per phase
  router.tsx
```

## Data flow

School-erp's "Store" modules are synchronous: `getX()`/`saveX()` read
and write `localStorage` directly, consumed via
`useState(() => getX())` plus a `useEffect` listening for a custom
window event dispatched by `saveX()` for cross-component reactivity.

College-erp keeps that exact convention but every function in
`src/api/<domain>.ts` returns a `Promise`, via a shared
`simulateRequest<T>()` helper in `src/api/http.ts` that wraps a value in
a `Promise` with artificial latency (`setTimeout`). This is the one
deliberate deviation from school-erp — it makes college-erp's data
layer actually API-shaped (per the original request), while remaining
a drop-in swap point for a real backend later.

Pages consume it with the same idiom school-erp uses, adapted for the
async return type — no custom hook, no data-fetching library:

```ts
const [rows, setRows] = useState<Row[]>([]);
useEffect(() => {
  let live = true;
  getStudents().then(data => { if (live) setRows(data); });
  return () => { live = false; };
}, []);
```

Mutations (`saveX`/`addX`) still write to `localStorage` and dispatch
the same custom event for reactivity; they're just also
`Promise`-returning for consistency with the reads.

Phase 0 establishes only the *pattern* (`http.ts` helper, one worked
example) — the actual domain modules (students, fees, tasks, etc.) are
built out per-phase as each portal's spec defines its own data shapes.

## Cross-cutting UI foundation

- **Theme**: two-tone neutral surfaces per mode (light `#F5F5F5`
  base / `#FFFFFF` paper; dark `#0A0A0A` base / `#1D1D1F` paper).
  Status palette (4 hues, state-only) and identity palette (6-8 hues,
  category-only) centralized in `theme/tokens.ts` and
  `theme/chartPalette.ts` — both charts and UI chrome pull from this
  single source. Chrome (nav, toolbars, buttons) is monochrome; no
  brand accent color.
- **Layout**: one sidebar, icon+label rows, inline accordion for
  items with children (no split rail-plus-panel), thin connector line
  for nested rows, active-row pill sized to that row's own indentation.
  Exactly one source of truth for "what section am I in" (the sidebar
  — no duplicate in-page tab bar tracking the same state). Active-route
  matching tested against exact match, listed child, and unlisted
  nested-detail routes (scoped prefix matching, not a naive
  `path.startsWith`). Client-side navigation resets the content pane's
  own scroll container to top.
- **Auth**: `AuthContext` simulates login — user picks a role on
  `PortalSelection.tsx`, enters any username/password on `Login.tsx`,
  is accepted unconditionally, and lands on that role's placeholder
  dashboard. No backend validation.
- **Router**: `router.tsx` using `createBrowserRouter`, every page
  lazy-loaded via `React.lazy`/`Suspense`, `Layout` as the lazy shell.
  Phase 0 wires one placeholder "Dashboard" route per role
  (admin/teacher/staff/student) so the shell is fully navigable
  end-to-end before any real portal content exists.

## Error handling

Simulated API calls in Phase 0's `http.ts` only need to model latency,
not failure — no error-path UI is required until a later phase's data
actually has failure-worthy operations (e.g. a save that can conflict).
Login has no failure path (any credentials are accepted).

## Testing / verification

No test runner (matches school-erp). Verification is `tsc -b`,
`eslint`, and manually driving the app in a browser per the design
system's "verify visually" rule: confirm the shell renders in both
light and dark mode, sidebar navigation and active-state highlighting
work, scroll resets on navigation, and the login → role-selection →
placeholder-dashboard flow completes for each of the 4 roles.

## Out of scope for Phase 0

Any real portal content (all 26 admin sections, faculty/teacher tiers,
staff task tool, student sections) — those are Phases 1-4. Deleting any
old HTML file — none are fully superseded until their consuming phase
completes.
