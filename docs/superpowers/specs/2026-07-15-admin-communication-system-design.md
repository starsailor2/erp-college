# College ERP Rewrite — Phase 1e: Admin / Communication & System

Status: Approved
Date: 2026-07-15

## Context

Fifth and final content sub-phase of Phase 1 (Admin portal), covering
**Notices, Document Signatures, Audit Logs, System Health,
Configurations, Profile, Settings** — the 7 sections the source groups
under its own "Communication" and "System" sidebar headings. This is
the last Admin sub-phase; once it ships, every original Admin sidebar
group (Academics, Operations, Finance, Communication, System) exists
in the rewrite. Conventions from
`2026-07-13-foundation-scaffold-design.md`,
`2026-07-13-admin-academics-core-design.md`,
`2026-07-14-admin-academic-operations-design.md`,
`2026-07-14-admin-finance-design.md`, and
`2026-07-14-admin-campus-operations-design.md` (stack, folder layout,
fake-async-API pattern, functional filters, real per-record Add/Edit,
demo-data generation approach, sidebar grouping) apply unchanged and
aren't repeated here.

## Source content (from `index.html`, verified against the live file)

- **Notices** (`getNoticesScreen`, sidebar label "Notices &
  Announcements"): Create Notice/View History actions + search +
  Audience/Month filter buttons (decorative, not real `<select>`s,
  none wired) + a table (Status / Notice Title+ID / Target Audience /
  Author / Published Date / Actions), 4 hardcoded rows covering all 3
  statuses (Published/Scheduled/Draft). Draft row gets Edit+Delete,
  others get a single View or Edit stub.
- **Document Signatures** (`getAdminDocumentSignaturesScreen`, sidebar
  label "Document Signatures"): the source's most elaborate screen —
  4 clickable KPI cards (Pending Approval: 12, In Progress: 28,
  Completed Today: 8, Total Documents: 156) that switch between 4
  tabs (Pending/In Progress/Completed/All), each tab rendering a
  differently-shaped table (Pending: Document ID/Title/Type/Initiated
  By/Date/Status/Actions with a "Sign" button that opens a modal
  containing a mouse-drawn HTML canvas signature pad; In Progress:
  ID/Title/Type/Current Stage/Pending With/Progress bar/Track button;
  Completed: ID/Title/Type/Initiated By/Completed date/Signature
  count/Download+History buttons), plus 4 static "Signature Workflow
  Configuration" cards describing each document type's approval chain
  (Academic/Finance/Policy/Research) with a "Configure" stub button.
  Only 2 pending + 2 in-progress + 2 completed sample rows exist
  despite the KPI cards claiming 12/28/8/156.
- **Audit Logs** (`getAuditLogsScreen`, sidebar label "Audit Logs"):
  descriptive blurb (kept verbatim) + Activity/User/Date filters +
  search (none wired) + a read-only table (Timestamp / User / Action /
  Module / IP Address / Status), 5 hardcoded rows including one failed
  login attempt with an inline red tint. No Add/Edit — purely
  informational, only "Export Logs" as an action.
- **System Health** (`getSystemHealthScreen`, sidebar label "System
  Health"): Refresh/Run Diagnostics actions + 8 KPI cards (Uptime,
  CPU, Memory, Disk, Database, API Response, Active Users, Last
  Backup) + a "Service Status" list of 5 services (Web Application/
  Database Server/Email Service/Payment Gateway all "Running", SMS
  Service "Degraded" with a distinct amber row background). Purely a
  monitoring display — no editable data anywhere on this screen.
- **Configurations** (`getConfigurationsScreen`, sidebar label
  "Configurations"): Reset Defaults/Save Changes actions + descriptive
  blurb (kept verbatim) + 3 real sub-forms — Institution Details
  (Name/Code/Email/Phone text inputs), Academic Settings (Academic
  Year select/Term select/Min Attendance %/Passing Grade), System
  Preferences (4 toggle switches: Email Notifications/SMS
  Notifications/Two-Factor Authentication/Auto Backup). All inputs
  pre-filled with hardcoded values; Save/Reset are stub notifications.
- **Profile** (`getProfileScreen`, sidebar label "My Profile"):
  Change Password/Save Changes actions + an avatar card (initials,
  name, role, Edit Profile/Change Password buttons, 3 stat tiles:
  Actions Today/Total Actions/Efficiency) + a Profile Information form
  (Full Name/Email/Phone editable; Role/Department readonly) + the
  admin's own Activity Log table (Action/Module/Date & Time/IP
  Address/Status), 4 hardcoded rows — same column shape as Audit Logs
  minus the "User" column (since it's implicitly "me").
- **Settings** (`getSettingsScreen`, sidebar label "Settings"): Reset
  to Default/Save Settings actions + 5 sub-sections — Appearance
  (Dark Mode/Compact View/Animations toggles), Notifications (Email/
  SMS/Push toggles), General (College Name text + Academic Year/
  Semester/Language/Timezone/Date Format/Time Format selects),
  Security (Two-Factor Authentication/Session Timeout/Login Alerts
  toggles), Backup & Data (Auto Backup/Data Retention toggles +
  "Backup Now" button). Notably overlaps Configurations' own Academic
  Year and notification/2FA/auto-backup toggles — the source itself
  has this redundancy across its two "System" screens; both are kept
  as-is (matching content-fidelity, not an inconsistency we introduced).
- **Cross-cutting**: no function-name shadowing/duplication beyond
  what's noted above. The `Notification` type from Phase 0 (bell-icon
  dropdown items: id/title/message/postedBy/read/timestamp) is a
  different concept from this phase's "Notice" (an admin-authored
  bulletin with status/audience/author/publishedDate) and isn't
  reused.

## Decisions

- **Document Signatures' canvas signature pad is dropped; "Sign"
  becomes a functional status-advancing action instead** (per your
  explicit choice). A real document list backs a real `status` field
  (`"pending" | "in_progress" | "completed"`), and the 4 KPI cards are
  real counts over it — clicking "Sign" on a pending document flips it
  to `"in_progress"` (or `"completed"` if there's nothing further to
  track, since we don't model the source's multi-stage
  Faculty→HOD→Dean→Admin chain positions). This preserves the
  workflow's *meaning* (advancing a document toward completion)
  without building a specialized mouse-drawn canvas widget that's out
  of proportion to every other page in this app. The 4 "Signature
  Workflow Configuration" cards are kept as static descriptive display
  (their own "Configure" stays a stub, matching the same
  no-real-editor-behind-it reasoning already applied elsewhere).
- **Audit Logs and Profile's Activity Log share one `AuditLogEntry`
  type**, not reused from Phase 1a's `ActivityLogEntry` (Dashboard's
  "Recent Activity" feed — different field shape: actorName/activity/
  departmentId/category vs this phase's actorEmail/action/module/
  ipAddress). Profile's table is the same entries filtered to
  `actorEmail === currentAdminEmail`; Audit Logs shows all of them.
  This mirrors Phase 1c's Fee Ledger precedent of not entangling a new
  screen's data with an already-shipped, already-verified type.
- **Notices' Create/Edit/Delete/View/History stay stub notifications**
  — unlike Assets/Fee Structure/etc., the source never built a real
  modal anywhere for any Notices action (`onclick` handlers are all
  bare `showNotification(...)` calls), so there's no real form to
  adapt. Same reasoning already applied to Payments' "Record Payment"
  in Phase 1c: no real flow exists in the source to rebuild, so adding
  one would be new content, not a port. Notices' Audience and Month
  filters plus search are still made real and functional, since a real
  underlying dataset exists to filter.
- **Configurations, Profile, and Settings all get real Save behavior**,
  since each has a real form with real fields in the source —
  Configurations' and Settings' Save Changes persist their respective
  singleton config objects (Reset restores the original seed values);
  Profile's Save Changes persists Name/Email/Phone to the
  current-admin record.
- **Settings' Dark Mode toggle wires into the real `useColorMode`
  context** instead of being a decorative switch with no effect — the
  app already has genuine light/dark mode infrastructure from Phase 0,
  so this is a natural, low-effort connection rather than new scope.
  Compact View and Animations toggles have no real backing feature in
  the rewrite (no compact-density mode or animation-disable feature
  exists to hook into) and stay visually real but inert switches,
  matching how Settings' own toggle UI is source-faithful even where
  the underlying feature doesn't exist to wire up.
- **System Health stays entirely static** — every value on this screen
  is a monitoring readout in the source (uptime, CPU%, memory%, service
  status), not an editable resource, so there's nothing to make
  "functional" the way Hostel/Facility's KPIs became in Phase 1d.
  Refresh and Run Diagnostics stay stub notifications.
- **Filters and search made real** across Notices (Audience/Month),
  Document Signatures (tab-based status filter), Audit Logs (Activity/
  User/Date/search) — matching every prior phase's "no decorative
  no-op controls" rule.

## Data model (additions to `src/types/index.ts`)

```ts
export type NoticeStatus = "published" | "scheduled" | "draft";
export interface Notice {
  id: string; // "NOT-2026-892"
  title: string;
  status: NoticeStatus;
  audience: string; // "Students" | "Faculty, Staff" | "All" | "Not set"
  author: string;
  publishedDate: string | null; // null for drafts
}

export type DocumentSignatureStatus = "pending" | "in_progress" | "completed";
export type DocumentUrgency = "normal" | "urgent";
export interface DocumentSignature {
  id: string; // "DOC-2026-0156"
  title: string;
  docType: string; // "Finance" | "Procurement" | "Policy" | "Academic" | "Research" | "HR"
  initiatedBy: string;
  date: string;
  status: DocumentSignatureStatus;
  urgency: DocumentUrgency;
  currentStage?: string; // only when in_progress, e.g. "HOD Review"
  pendingWith?: string; // only when in_progress
  progressCurrent?: number; // only when in_progress, e.g. 1
  progressTotal?: number; // only when in_progress, e.g. 3
  signaturesCollected?: number; // only when completed
  signaturesTotal?: number; // only when completed
}

export type AuditStatus = "success" | "failed";
export interface AuditLogEntry {
  id: string;
  timestamp: string; // "2026-12-08 14:45:23"
  actorEmail: string;
  action: string;
  module: string;
  ipAddress: string;
  status: AuditStatus;
}

export interface ServiceStatus {
  name: string;
  description: string;
  status: "running" | "degraded";
}
export interface SystemHealthMetrics {
  uptimePct: number;
  uptimeDetail: string; // "45 days, 12 hours"
  cpuPct: number;
  memoryPct: number;
  memoryDetail: string; // "12.8 GB / 19 GB"
  diskPct: number;
  diskDetail: string; // "542 GB / 1 TB"
  databaseHealthy: boolean;
  apiResponseMs: number;
  activeUsers: number;
  lastBackup: string; // "2 hrs ago"
  services: ServiceStatus[];
}

export interface SystemConfig {
  institutionName: string;
  institutionCode: string;
  email: string;
  phone: string;
  academicYear: string;
  currentTerm: string;
  minAttendancePct: number;
  passingGrade: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  twoFactorAuth: boolean;
  autoBackup: boolean;
}

export interface AppSettings {
  compactView: boolean;
  animations: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  collegeName: string;
  academicYear: string;
  semester: string;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  twoFactorAuth: boolean;
  sessionTimeout: boolean;
  loginAlerts: boolean;
  autoBackup: boolean;
  dataRetention: boolean;
}
```

## Folder additions

```
src/
  demo-data/
    communication/
      notices.ts
      documentSignatures.ts
    system/
      auditLogs.ts
      systemHealth.ts
      systemConfig.ts
      appSettings.ts
  api/
    notices.ts
    documentSignatures.ts
    auditLogs.ts
    systemHealth.ts
    systemConfig.ts
    appSettings.ts
  pages/admin/
    Notices.tsx
    DocumentSignatures.tsx
    AuditLogs.tsx
    SystemHealth.tsx
    Configurations.tsx
    Profile.tsx
    Settings.tsx
```

## Routing additions (`router.tsx`)

```
/admin/notices         -> Notices
/admin/documents        -> DocumentSignatures
/admin/audit-logs      -> AuditLogs
/admin/system-health    -> SystemHealth
/admin/configurations   -> Configurations
/admin/profile          -> Profile
/admin/settings         -> Settings
```

No per-record detail routes for any of these 7 screens — none have a
per-record "View" page in the original (all such actions are stub
notifications).

## Navigation changes (`navigation.tsx`, `"admin"` case)

Add **Communication** and **System** groups (matching the source's own
sidebar section titles) after the existing Finance group:

```
Dashboard                          (ungrouped)
Academics group:                   (unchanged from Phase 1b)
Operations group:                  (unchanged from Phase 1d)
Finance group:                     (unchanged from Phase 1c)
Communication group:
  Notices & Announcements, Document Signatures
System group:
  Audit Logs, System Health, Configurations, My Profile, Settings
```

This completes every sidebar group from the original Admin portal.

## Component reuse

Same as prior phases: `PageHeader`, `StatCard`, `DataTable`,
`StatusChip` (needs `published`, `scheduled` reused as-is from Phase
1a; `draft`, `in_progress` reused; new: `awaiting`, `urgent`,
`success`, `failed`, `degraded`, `running` — see plan for exact
mapping), plus MUI `Dialog`/`TextField`/`Select`/`Switch`/`Snackbar`
for modals, toggles, and stub-action feedback. No new shared
components.

## Error handling

Same as prior phases — in-memory array/object mutations only, no
simulated failure. All Add/Edit/Save/Sign actions resolve through the
existing `simulateRequest`-based API pattern.

## Testing / verification

Same as prior phases: `tsc -b` via `npm run build`, `eslint .`, and a
browser-driven pass confirming: Notices' Audience/Month filters +
search actually filter (Create/Edit/Delete/View/History remain stub
snackbars, matching the source); Document Signatures' 4 KPIs are real, tab switching actually changes
the visible rows, and Sign actually advances a document's status;
Audit Logs' 3 filters + search actually filter; System Health renders
its static KPIs and service list; Configurations' Save Changes
persists edited values (verified by navigating away and back within
the same session, consistent with the established in-memory-only
persistence pattern) and Reset Defaults restores seed values;
Profile's Save Changes persists Name/Email/Phone edits
and its Activity Log shows only the current admin's entries; Settings'
real Dark Mode toggle actually flips the whole app's theme and its
other toggles/selects persist through Save; both light/dark modes
render correctly across all 7 pages.

## Out of scope for Phase 1e

Nothing remains in the Admin portal after this phase. Teacher/Faculty
portal (Phase 2), Staff/Operations portal (Phase 3), and Student
portal (Phase 4) are separate, later phases (rebuilt from `faculty.html`,
`ops.html`, `student.html` respectively) — `index.html` (the legacy
Admin portal) can be deleted once this phase ships, per the
established per-file legacy-deletion policy.
