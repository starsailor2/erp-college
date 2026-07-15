# KALNET College ERP

A multi-portal college ERP system, rewritten as a modern React application. The
project began as a set of four large static HTML/vanilla-JS files (one per
portal) and has been fully migrated into a single Vite + React + TypeScript app
under [`app/`](app/) — the legacy static files no longer exist in this repo.

## Portals

The app serves four role-based portals from one codebase. There is no real
backend: signing in with any credentials and picking a role takes you straight
into that portal.

| Portal | Route | Notes |
|---|---|---|
| Admin | `/admin` | Academics, operations, finance, communication, and system administration |
| Faculty (Teacher) | `/teacher` | Switches between **Professor / HOD / Dean** views via an in-app role selector |
| Operations (Staff) | `/staff` | Switches between **Assigner / Executor** views via an in-app role selector |
| Student | `/student` | Single student identity, no sub-roles |

### Admin
Users, Faculty, Departments, Students, Courses, Registration, Attendance,
Timetable, Exams, Results, Asset Master, Maintenance Tickets, Hostel
Management, Facility Booking, Library, Fee Structure/Ledger/Payments, Notices,
Document Signatures, Audit Logs, System Health, Configurations, Settings.

### Faculty (Teacher)
My Courses, Attendance, Internal Marks, Exams, Course Materials, My/Department
Course Students, Academic Cohort, Student Performance, Leave/Grade-Change/
Resource Requests, Notices, Messages, Document Signatures — plus, once the
role selector is switched to HOD or Dean: Department Overview, Attendance/
Marks Approval, Faculty Workload, Student Issues, Academic Overview, Policy &
Deadlines, Inter-Department Reports, Approvals Dashboard.

### Operations (Staff)
**Assigner** view: Dashboard, Create Task, Assign Task, Task Overview, Team
View, Reports. **Executor** view: My Tasks, Update Status, Completed Tasks.
Both views share one task-tracking data model, so assigning, starting,
completing, approving, or rejecting a task is reflected consistently across
every screen.

### Student
Identity & Records, My Courses, Registration, Attendance, Internal Marks,
Exams & Results, Academic Requests, Fee Summary, Payments, Fee Ledger,
Convocation, Fellowship, Placements, Hostel & Mess, Facility & Resource
Booking, Reports, Notices, Messages, My Profile.

## Tech Stack

- **React 19** + **TypeScript 5.8**
- **Vite 6** (build tool / dev server)
- **react-router-dom v7** (routing, with lazy-loaded route chunks)
- **MUI v7** + **Emotion** (component library and styling)
- **Tailwind CSS v4** (utility styling alongside MUI)
- **recharts v2** (charts)
- **motion v12** (animation)

## Getting Started

The app lives in the `app/` subdirectory.

```bash
cd app
npm install
npm run dev       # start the dev server (http://localhost:5173)
```

Other scripts (run from `app/`):

```bash
npm run build      # type-check (tsc -b) and produce a production build in app/dist
npm run lint       # eslint
npm run preview    # preview the production build locally
```

Sign-in is fully mocked: on the login screen, any Institution Code / User ID /
Password is accepted. Select a role from the dropdown and submit — you land
directly in that portal. The chosen role persists in `localStorage`
(`college_erp_role`) across reloads.

## Project Structure

```
erp-college/
├── vercel.json              # Vercel deployment config (see below)
├── docs/superpowers/        # design specs and implementation plans written during development
└── app/
    └── src/
        ├── pages/            # one folder per portal: admin/, teacher/, staff/, student/
        ├── components/       # shared UI (Layout, DataTable, StatCard, ChartCard, StatusChip, ...)
        ├── context/          # AuthContext, ColorModeContext, TeacherRoleContext, StaffRoleContext
        ├── api/               # one file per data domain — the app's fake network layer
        ├── demo-data/          # seed data consumed by api/, one subfolder per domain
        ├── theme/               # MUI theme, design tokens, chart palette
        ├── types/                # shared TypeScript types
        ├── router.tsx             # route table (all routes lazy-loaded)
        └── components/navigation.tsx  # sidebar nav items per role
```

## Architecture Notes

- **No backend.** Every `api/*.ts` file wraps an in-memory `demo-data/*` module
  with `simulateRequest()`, which resolves after an artificial ~250ms delay so
  the UI behaves like it's talking to a real network. Reads and writes mutate
  the same in-memory objects, so state persists for the lifetime of the page
  (until a full reload resets everything back to the seed data).
- **Deterministic seed data.** Demo-data modules that generate randomized
  values use a seeded PRNG (`createRng`), with each module owning its own
  independent seed so generated data stays stable regardless of which routes
  happen to load first.
- **Role-switchers.** The Teacher and Staff portals each have a `<Select>` in
  the top bar (Professor/HOD/Dean, and Assigner/Executor respectively) backed
  by a small context (`TeacherRoleContext`, `StaffRoleContext`) that also
  drives which sidebar sections are visible.
- **Design language.** Dense, monochrome, data-table-and-dashboard oriented UI
  — consistent `StatusChip`, `DataTable`, `StatCard`, and `ChartCard`
  components are reused across all four portals, with light/dark theme
  support via `ColorModeContext`.

## Deployment

[`vercel.json`](vercel.json) at the repo root configures a Vercel deployment
that builds the app inside `app/` and serves it as a single-page app (all
paths rewrite to `index.html` so client-side routes like `/teacher/marks`
resolve correctly on direct navigation or refresh).

## Development History

This app was built by systematically porting each legacy portal, phase by
phase, fixing real bugs along the way (crash-causing undefined handlers,
functions that ignored their arguments and always showed the same row's data,
broken navigation links, and inconsistent duplicated data across pages) rather
than reproducing them. The design specs and implementation plans for each
phase are kept in [`docs/superpowers/`](docs/superpowers/) for reference.
