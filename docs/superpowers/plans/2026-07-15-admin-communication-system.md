# Admin Communication & System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 1e of the Admin portal — Notices, Document Signatures, Audit Logs, System Health, Configurations, Profile, Settings — completing the entire Admin portal.

**Architecture:** Same as prior phases: demo-data generator modules → thin `api/*.ts` Promise wrappers → page components. No per-record detail routes this phase (none of the 7 source screens have one).

**Tech Stack:** Same as prior phases — no new dependencies.

## Global Constraints

- All new pages live under `app/src/pages/admin/`; new demo-data under `app/src/demo-data/communication/` and `app/src/demo-data/system/`; new API modules under `app/src/api/`. (Paths below are relative to `app/`.)
- Filters/search must actually filter. Notices' Create/Edit/Delete/View/History stay stub `Snackbar` notifications — the source has no real modal for any of them.
- Configurations/Settings/Profile Save Changes are functional, mutating a singleton demo object via `Object.assign` and resolving through `simulateRequest`, matching the Hostel/Facility mutation pattern from Phase 1d.
- Settings' Dark Mode toggle wires into the real `useColorMode` context (`checked={mode === "dark"}`, `onChange={toggleColorMode}`), not a demo-data field.
- Demo data scale: notices = 15 rows; documents = 20 rows; audit logs = 40 rows. System Health, System Config, App Settings, Admin Profile are singleton objects, not arrays.
- Currency formatting: not needed this phase (no monetary fields).

---

### Task 1: Type definitions

**Files:**
- Modify: `src/types/index.ts`

**Interfaces:**
- Produces: `Notice`, `NoticeStatus`, `DocumentSignature`, `DocumentSignatureStatus`, `DocumentUrgency`, `AuditLogEntry`, `AuditStatus`, `ServiceStatus`, `SystemHealthMetrics`, `SystemConfig`, `AppSettings`, `AdminProfile` — consumed by every task below.

- [ ] **Step 1: Append the Communication & System types to `src/types/index.ts`**

```ts

// --- Admin / Communication & System (Phase 1e) ---

export type NoticeStatus = "published" | "scheduled" | "draft";
export interface Notice {
  id: string;
  title: string;
  status: NoticeStatus;
  audience: string;
  author: string;
  publishedDate: string | null;
}

export type DocumentSignatureStatus = "pending" | "in_progress" | "completed";
export type DocumentUrgency = "normal" | "urgent";
export interface DocumentSignature {
  id: string;
  title: string;
  docType: string;
  initiatedBy: string;
  date: string;
  status: DocumentSignatureStatus;
  urgency: DocumentUrgency;
  currentStage?: string;
  pendingWith?: string;
  progressCurrent?: number;
  progressTotal?: number;
  signaturesCollected?: number;
  signaturesTotal?: number;
}

export type AuditStatus = "success" | "failed";
export interface AuditLogEntry {
  id: string;
  timestamp: string;
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
  uptimeDetail: string;
  cpuPct: number;
  memoryPct: number;
  memoryDetail: string;
  diskPct: number;
  diskDetail: string;
  databaseHealthy: boolean;
  apiResponseMs: number;
  activeUsers: number;
  lastBackup: string;
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

export interface AdminProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  actionsToday: number;
  totalActions: number;
  efficiencyPct: number;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "Add Admin/Communication-System type definitions"
```

---

### Task 2: Notices demo data + API

**Files:**
- Create: `src/demo-data/communication/notices.ts`
- Create: `src/api/notices.ts`

**Interfaces:**
- Consumes: `Notice`, `NoticeStatus` from `@/types`; `randomFullName` from `@/demo-data/generators/namePools`; `createRng` from `@/demo-data/generators/random`.
- Produces: `notices: Notice[]` from `notices.ts`; `getNotices(): Promise<Notice[]>` from `api/notices.ts` — used by Task 10. No mutation functions — Notices has no real backing modal in the source.

- [ ] **Step 1: Create `src/demo-data/communication/notices.ts`**

```ts
import type { Notice, NoticeStatus } from "@/types";
import { randomFullName } from "@/demo-data/generators/namePools";
import { createRng } from "@/demo-data/generators/random";

const { pick, weightedPick, randomInt } = createRng(15071501);

const noticeTitles = [
  "Fall Semester Exam Schedule", "Payroll System Maintenance", "Campus Parking Policy Update",
  "Library Holiday Hours", "Mid-Term Break Announcement", "Convocation Ceremony 2026",
  "Hostel Fee Payment Deadline", "New Course Registration Open", "Annual Sports Day",
  "Placement Drive Schedule", "Campus Wi-Fi Maintenance Window", "Scholarship Application Deadline",
  "Guest Lecture Series - AI & Robotics", "Semester Break Notice", "Fee Payment Reminder",
];

const audiences = ["Students", "Faculty", "Staff", "Faculty, Staff", "All"];

const statuses: [NoticeStatus, number][] = [["published", 60], ["scheduled", 20], ["draft", 20]];

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const NOTICE_COUNT = 15;

function generateNotices(): Notice[] {
  const list: Notice[] = [];
  for (let i = 0; i < NOTICE_COUNT; i++) {
    const status = weightedPick(statuses);
    list.push({
      id: `NOT-2026-${String(892 - i * 3).padStart(3, "0")}`,
      title: pick(noticeTitles),
      status,
      audience: status === "draft" ? "Not set" : pick(audiences),
      author: randomFullName(pick),
      publishedDate: status === "draft" ? null : dateStr(2026, randomInt(1, 7), randomInt(1, 28)),
    });
  }
  return list;
}

export const notices: Notice[] = generateNotices();
```

- [ ] **Step 2: Create `src/api/notices.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { notices } from "@/demo-data/communication/notices";
import type { Notice } from "@/types";

export function getNotices(): Promise<Notice[]> {
  return simulateRequest(notices);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/communication/notices.ts src/api/notices.ts
git commit -m "Add notices demo data and API"
```

---

### Task 3: Document Signatures demo data + API

**Files:**
- Create: `src/demo-data/communication/documentSignatures.ts`
- Create: `src/api/documentSignatures.ts`

**Interfaces:**
- Consumes: `DocumentSignature`, `DocumentSignatureStatus`, `DocumentUrgency` from `@/types`; `randomFullName` from `@/demo-data/generators/namePools`; `createRng` from `@/demo-data/generators/random`.
- Produces: `documentSignatures: DocumentSignature[]`, `getDocumentById(id)` from `documentSignatures.ts`; `getDocumentSignatures(): Promise<DocumentSignature[]>`, `signDocument(id): Promise<DocumentSignature | undefined>` from `api/documentSignatures.ts` — used by Task 11.

- [ ] **Step 1: Create `src/demo-data/communication/documentSignatures.ts`**

```ts
import type { DocumentSignature, DocumentSignatureStatus, DocumentUrgency } from "@/types";
import { randomFullName } from "@/demo-data/generators/namePools";
import { createRng } from "@/demo-data/generators/random";

const { pick, weightedPick, randomInt } = createRng(15071502);

const docTitles: { title: string; docType: string }[] = [
  { title: "Budget Allocation - Q1 2026", docType: "Finance" },
  { title: "Lab Equipment Procurement", docType: "Procurement" },
  { title: "Faculty Leave Policy Amendment", docType: "Policy" },
  { title: "Annual Academic Calendar 2026-27", docType: "Academic" },
  { title: "Research Grant Application - IoT Lab", docType: "Research" },
  { title: "Mid-Year Performance Review", docType: "Policy" },
  { title: "New Faculty Joining Approval", docType: "HR" },
  { title: "Hostel Renovation Budget", docType: "Finance" },
  { title: "Curriculum Revision Proposal", docType: "Academic" },
  { title: "Sports Equipment Purchase", docType: "Procurement" },
  { title: "Industry Collaboration MoU", docType: "Research" },
  { title: "Staff Promotion Recommendation", docType: "HR" },
];

const stages = ["HOD Review", "Dean Approval", "Finance Review", "Admin Review"];

const statuses: [DocumentSignatureStatus, number][] = [["pending", 25], ["in_progress", 35], ["completed", 40]];
const urgencies: [DocumentUrgency, number][] = [["normal", 85], ["urgent", 15]];

const DOCUMENT_COUNT = 20;

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function generateDocuments(): DocumentSignature[] {
  const list: DocumentSignature[] = [];
  for (let i = 0; i < DOCUMENT_COUNT; i++) {
    const source = pick(docTitles);
    const status = weightedPick(statuses);
    const doc: DocumentSignature = {
      id: `DOC-2026-${String(200 - i * 2).padStart(4, "0")}`,
      title: source.title,
      docType: source.docType,
      initiatedBy: randomFullName(pick),
      date: dateStr(2026, randomInt(1, 7), randomInt(1, 28)),
      status,
      urgency: status === "pending" ? weightedPick(urgencies) : "normal",
    };
    if (status === "in_progress") {
      doc.currentStage = pick(stages);
      doc.pendingWith = randomFullName(pick);
      doc.progressCurrent = randomInt(1, 2);
      doc.progressTotal = 3;
    }
    if (status === "completed") {
      doc.signaturesTotal = randomInt(3, 4);
      doc.signaturesCollected = doc.signaturesTotal;
    }
    list.push(doc);
  }
  return list;
}

export const documentSignatures: DocumentSignature[] = generateDocuments();

export function getDocumentById(id: string): DocumentSignature | undefined {
  return documentSignatures.find((d) => d.id === id);
}
```

- [ ] **Step 2: Create `src/api/documentSignatures.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { documentSignatures, getDocumentById } from "@/demo-data/communication/documentSignatures";
import type { DocumentSignature } from "@/types";

export function getDocumentSignatures(): Promise<DocumentSignature[]> {
  return simulateRequest(documentSignatures);
}

export function signDocument(id: string): Promise<DocumentSignature | undefined> {
  const doc = getDocumentById(id);
  if (doc) {
    if (doc.status === "pending") {
      doc.status = "in_progress";
      doc.currentStage = "HOD Review";
      doc.pendingWith = "Department HOD";
      doc.progressCurrent = 1;
      doc.progressTotal = 3;
    } else if (doc.status === "in_progress") {
      if ((doc.progressCurrent ?? 0) < (doc.progressTotal ?? 3)) {
        doc.progressCurrent = (doc.progressCurrent ?? 0) + 1;
      } else {
        doc.status = "completed";
        doc.signaturesTotal = doc.progressTotal ?? 3;
        doc.signaturesCollected = doc.signaturesTotal;
        doc.currentStage = undefined;
        doc.pendingWith = undefined;
      }
    }
  }
  return simulateRequest(doc);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/communication/documentSignatures.ts src/api/documentSignatures.ts
git commit -m "Add document signatures demo data and API"
```

---

### Task 4: Audit Logs demo data + API

**Files:**
- Create: `src/demo-data/system/auditLogs.ts`
- Create: `src/api/auditLogs.ts`

**Interfaces:**
- Consumes: `AuditLogEntry`, `AuditStatus` from `@/types`; `createRng` from `@/demo-data/generators/random`.
- Produces: `auditLogs: AuditLogEntry[]` from `auditLogs.ts`; `getAuditLogs(): Promise<AuditLogEntry[]>` from `api/auditLogs.ts` — used by Task 12 and Task 15 (Profile's own filtered activity log).

- [ ] **Step 1: Create `src/demo-data/system/auditLogs.ts`**

```ts
import type { AuditLogEntry, AuditStatus } from "@/types";
import { createRng } from "@/demo-data/generators/random";

const { pick, weightedPick, randomInt } = createRng(15071503);

const actors = [
  "admin@kalnet.edu", "sarah.j@kalnet.edu", "finance@kalnet.edu",
  "priya.sharma@kalnet.edu", "amit.singh@kalnet.edu",
];

const actionsByModule: { action: string; module: string }[] = [
  { action: "Login Successful", module: "Authentication" },
  { action: "Failed Login Attempt", module: "Authentication" },
  { action: "Logged Out", module: "Authentication" },
  { action: "Updated Course Syllabus", module: "Academics" },
  { action: "Published Exam Schedule", module: "Academics" },
  { action: "Added New Student", module: "Academics" },
  { action: "Updated Fee Structure", module: "Finance" },
  { action: "Processed Payment", module: "Finance" },
  { action: "Issued Refund", module: "Finance" },
  { action: "Allocated Hostel Room", module: "Operations" },
  { action: "Created Maintenance Ticket", module: "Operations" },
  { action: "Updated System Configuration", module: "System" },
  { action: "Changed User Permissions", module: "System" },
  { action: "Created Backup", module: "System" },
];

const statuses: [AuditStatus, number][] = [["success", 92], ["failed", 8]];

function dateTimeStr(month: number, day: number, hour: number, minute: number, second: number): string {
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
}

const LOG_COUNT = 40;

function generateAuditLogs(): AuditLogEntry[] {
  const list: AuditLogEntry[] = [];
  for (let i = 0; i < LOG_COUNT; i++) {
    const { action, module } = pick(actionsByModule);
    const isFailedLogin = action === "Failed Login Attempt";
    list.push({
      id: `LOG-${10000 - i}`,
      timestamp: dateTimeStr(7, randomInt(1, 15), randomInt(0, 23), randomInt(0, 59), randomInt(0, 59)),
      actorEmail: isFailedLogin ? "unknown@external.com" : pick(actors),
      action,
      module,
      ipAddress: isFailedLogin ? `203.45.128.${randomInt(10, 250)}` : `192.168.1.${randomInt(100, 200)}`,
      status: isFailedLogin ? "failed" : weightedPick(statuses),
    });
  }
  return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export const auditLogs: AuditLogEntry[] = generateAuditLogs();
```

- [ ] **Step 2: Create `src/api/auditLogs.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { auditLogs } from "@/demo-data/system/auditLogs";
import type { AuditLogEntry } from "@/types";

export function getAuditLogs(): Promise<AuditLogEntry[]> {
  return simulateRequest(auditLogs);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/system/auditLogs.ts src/api/auditLogs.ts
git commit -m "Add audit logs demo data and API"
```

---

### Task 5: System Health demo data + API

**Files:**
- Create: `src/demo-data/system/systemHealth.ts`
- Create: `src/api/systemHealth.ts`

**Interfaces:**
- Consumes: `SystemHealthMetrics` from `@/types`.
- Produces: `systemHealth: SystemHealthMetrics` from `systemHealth.ts`; `getSystemHealth(): Promise<SystemHealthMetrics>` from `api/systemHealth.ts` — used by Task 13.

- [ ] **Step 1: Create `src/demo-data/system/systemHealth.ts`**

```ts
import type { SystemHealthMetrics } from "@/types";

export const systemHealth: SystemHealthMetrics = {
  uptimePct: 99.8,
  uptimeDetail: "45 days, 12 hours",
  cpuPct: 42,
  memoryPct: 68,
  memoryDetail: "12.8 GB / 19 GB",
  diskPct: 54,
  diskDetail: "542 GB / 1 TB",
  databaseHealthy: true,
  apiResponseMs: 142,
  activeUsers: 284,
  lastBackup: "2 hrs ago",
  services: [
    { name: "Web Application", description: "Main ERP Interface", status: "running" },
    { name: "Database Server", description: "MySQL 8.0", status: "running" },
    { name: "Email Service", description: "SMTP Gateway", status: "running" },
    { name: "Payment Gateway", description: "Online Payments", status: "running" },
    { name: "SMS Service", description: "Notifications", status: "degraded" },
  ],
};
```

- [ ] **Step 2: Create `src/api/systemHealth.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { systemHealth } from "@/demo-data/system/systemHealth";
import type { SystemHealthMetrics } from "@/types";

export function getSystemHealth(): Promise<SystemHealthMetrics> {
  return simulateRequest(systemHealth);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/system/systemHealth.ts src/api/systemHealth.ts
git commit -m "Add system health demo data and API"
```

---

### Task 6: System Config demo data + API

**Files:**
- Create: `src/demo-data/system/systemConfig.ts`
- Create: `src/api/systemConfig.ts`

**Interfaces:**
- Consumes: `SystemConfig` from `@/types`.
- Produces: `systemConfig: SystemConfig`, `systemConfigDefaults: SystemConfig` from `systemConfig.ts`; `getSystemConfig(): Promise<SystemConfig>`, `saveSystemConfig(updates): Promise<SystemConfig>`, `resetSystemConfig(): Promise<SystemConfig>` from `api/systemConfig.ts` — used by Task 14.

- [ ] **Step 1: Create `src/demo-data/system/systemConfig.ts`**

```ts
import type { SystemConfig } from "@/types";

export const systemConfigDefaults: SystemConfig = {
  institutionName: "KALNET College of Engineering",
  institutionCode: "INST-2026-001",
  email: "admin@kalnet.edu",
  phone: "+91 123 456 7890",
  academicYear: "2026-2027",
  currentTerm: "Odd Semester",
  minAttendancePct: 75,
  passingGrade: "40%",
  emailNotifications: true,
  smsNotifications: true,
  twoFactorAuth: false,
  autoBackup: true,
};

export const systemConfig: SystemConfig = { ...systemConfigDefaults };
```

- [ ] **Step 2: Create `src/api/systemConfig.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { systemConfig, systemConfigDefaults } from "@/demo-data/system/systemConfig";
import type { SystemConfig } from "@/types";

export function getSystemConfig(): Promise<SystemConfig> {
  return simulateRequest(systemConfig);
}

export function saveSystemConfig(updates: SystemConfig): Promise<SystemConfig> {
  Object.assign(systemConfig, updates);
  return simulateRequest(systemConfig);
}

export function resetSystemConfig(): Promise<SystemConfig> {
  Object.assign(systemConfig, systemConfigDefaults);
  return simulateRequest(systemConfig);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/system/systemConfig.ts src/api/systemConfig.ts
git commit -m "Add system config demo data and API"
```

---

### Task 7: App Settings demo data + API

**Files:**
- Create: `src/demo-data/system/appSettings.ts`
- Create: `src/api/appSettings.ts`

**Interfaces:**
- Consumes: `AppSettings` from `@/types`.
- Produces: `appSettings: AppSettings`, `appSettingsDefaults: AppSettings` from `appSettings.ts`; `getAppSettings(): Promise<AppSettings>`, `saveAppSettings(updates): Promise<AppSettings>`, `resetAppSettings(): Promise<AppSettings>` from `api/appSettings.ts` — used by Task 16.

- [ ] **Step 1: Create `src/demo-data/system/appSettings.ts`**

```ts
import type { AppSettings } from "@/types";

export const appSettingsDefaults: AppSettings = {
  compactView: false,
  animations: true,
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  collegeName: "KALNET College of Engineering",
  academicYear: "2026-2027",
  semester: "Odd Semester",
  language: "English",
  timezone: "IST (UTC+5:30)",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24 Hour",
  twoFactorAuth: false,
  sessionTimeout: true,
  loginAlerts: true,
  autoBackup: true,
  dataRetention: true,
};

export const appSettings: AppSettings = { ...appSettingsDefaults };
```

- [ ] **Step 2: Create `src/api/appSettings.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { appSettings, appSettingsDefaults } from "@/demo-data/system/appSettings";
import type { AppSettings } from "@/types";

export function getAppSettings(): Promise<AppSettings> {
  return simulateRequest(appSettings);
}

export function saveAppSettings(updates: AppSettings): Promise<AppSettings> {
  Object.assign(appSettings, updates);
  return simulateRequest(appSettings);
}

export function resetAppSettings(): Promise<AppSettings> {
  Object.assign(appSettings, appSettingsDefaults);
  return simulateRequest(appSettings);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/system/appSettings.ts src/api/appSettings.ts
git commit -m "Add app settings demo data and API"
```

---

### Task 8: Admin Profile demo data + API

**Files:**
- Create: `src/demo-data/system/adminProfile.ts`
- Create: `src/api/adminProfile.ts`

**Interfaces:**
- Consumes: `AdminProfile` from `@/types`.
- Produces: `adminProfile: AdminProfile` from `adminProfile.ts`; `getAdminProfile(): Promise<AdminProfile>`, `saveAdminProfile(updates): Promise<AdminProfile>` from `api/adminProfile.ts` — used by Task 15.

- [ ] **Step 1: Create `src/demo-data/system/adminProfile.ts`**

```ts
import type { AdminProfile } from "@/types";

export const adminProfile: AdminProfile = {
  name: "Admin User",
  email: "admin@kalnet.edu",
  phone: "+91 9876543210",
  role: "System Administrator",
  department: "Administration",
  actionsToday: 156,
  totalActions: 2543,
  efficiencyPct: 98,
};
```

- [ ] **Step 2: Create `src/api/adminProfile.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { adminProfile } from "@/demo-data/system/adminProfile";
import type { AdminProfile } from "@/types";

export function getAdminProfile(): Promise<AdminProfile> {
  return simulateRequest(adminProfile);
}

export function saveAdminProfile(updates: Pick<AdminProfile, "name" | "email" | "phone">): Promise<AdminProfile> {
  Object.assign(adminProfile, updates);
  return simulateRequest(adminProfile);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/system/adminProfile.ts src/api/adminProfile.ts
git commit -m "Add admin profile demo data and API"
```

---

### Task 9: StatusChip additions

**Files:**
- Modify: `src/components/StatusChip.tsx`

**Interfaces:**
- Produces: `StatusChip` now also handles `"published"`, `"awaiting"`, `"urgent"`, `"success"`, `"failed"`, `"running"`, `"degraded"` (`"scheduled"`, `"pending"`, `"in_progress"`, `"completed"` already exist). `"draft"` is deliberately left unmapped — it falls back to StatusChip's existing generic gray default, which already matches the source's own gray "neutral" badge for drafts. No new icon imports needed (all reused from existing imports).

- [ ] **Step 1: Add the 7 new status entries**

Find:

```tsx
  // Library
  available: { label: "Available", color: statusTokens.good, icon: CheckCircleIcon },
  reserved: { label: "Reserved", color: statusTokens.warning, icon: BookmarkIcon },
};
```

Replace with:

```tsx
  // Library
  available: { label: "Available", color: statusTokens.good, icon: CheckCircleIcon },
  reserved: { label: "Reserved", color: statusTokens.warning, icon: BookmarkIcon },
  // Notices
  published: { label: "Published", color: statusTokens.good, icon: CheckCircleIcon },
  // Document signatures
  awaiting: { label: "Awaiting", color: statusTokens.warning, icon: HourglassTopIcon },
  urgent: { label: "Urgent", color: statusTokens.critical, icon: ErrorIcon },
  // Audit / system
  success: { label: "Success", color: statusTokens.good, icon: CheckCircleIcon },
  failed: { label: "Failed", color: statusTokens.critical, icon: CancelIcon },
  running: { label: "Running", color: statusTokens.good, icon: CheckCircleIcon },
  degraded: { label: "Degraded", color: statusTokens.warning, icon: WarningAmberIcon },
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/StatusChip.tsx
git commit -m "Add communication/system statuses to StatusChip"
```

---

### Task 10: Notices page

**Files:**
- Create: `src/pages/admin/Notices.tsx`

**Interfaces:**
- Consumes: `getNotices` from `@/api/notices` (Task 2); `PageHeader`, `DataTable`, `StatusChip` from `@/components/*`.
- Produces: default export consumed by `router.tsx` (Task 17) at `/admin/notices`.

- [ ] **Step 1: Create `src/pages/admin/Notices.tsx`**

```tsx
import { useEffect, useState } from "react";
import {
  Box, Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getNotices } from "@/api/notices";
import type { Notice } from "@/types";

const audiences = ["Students", "Faculty", "Staff", "Faculty, Staff", "All"];
const months = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07"];
const monthLabels: Record<string, string> = {
  "2026-01": "January 2026", "2026-02": "February 2026", "2026-03": "March 2026",
  "2026-04": "April 2026", "2026-05": "May 2026", "2026-06": "June 2026", "2026-07": "July 2026",
};

export default function Notices() {
  const [rows, setRows] = useState<Notice[]>([]);
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getNotices().then(setRows); }, []);

  const filtered = rows.filter((n) =>
    (audienceFilter === "all" || n.audience === audienceFilter) &&
    (monthFilter === "all" || (n.publishedDate?.startsWith(monthFilter) ?? false)) &&
    (search === "" || n.title.toLowerCase().includes(search.toLowerCase()) || n.id.toLowerCase().includes(search.toLowerCase()) || n.author.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <PageHeader
        eyebrow="Communication"
        title="Communications & Notices"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Loading notice history...")}>View History</Button>
            <Button variant="contained" onClick={() => setSnackbar("Notice creation form opening...")}>Create Notice</Button>
          </Stack>
        }
      />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <TextField size="small" placeholder="Search notices by title, ID or author..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 300 }} />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Audience</InputLabel>
          <Select label="Audience" value={audienceFilter} onChange={(e: SelectChangeEvent) => setAudienceFilter(e.target.value)}>
            <MenuItem value="all">All Audiences</MenuItem>
            {audiences.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Month</InputLabel>
          <Select label="Month" value={monthFilter} onChange={(e: SelectChangeEvent) => setMonthFilter(e.target.value)}>
            <MenuItem value="all">All Months</MenuItem>
            {months.map((m) => <MenuItem key={m} value={m}>{monthLabels[m]}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      <DataTable<Notice>
        pagination
        columns={[
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          {
            key: "title", label: "Notice Title",
            render: (row) => (
              <Box>
                <Typography variant="body2" fontWeight={600}>{row.title}</Typography>
                <Typography variant="caption" color="text.secondary">ID: {row.id}</Typography>
              </Box>
            ),
          },
          { key: "audience", label: "Target Audience" },
          { key: "author", label: "Author" },
          { key: "publishedDate", label: "Published Date", render: (row) => row.publishedDate ?? "—" },
          {
            key: "actions", label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={0.5}>
                {row.status === "draft" ? (
                  <>
                    <Button size="small" onClick={() => setSnackbar("Opening notice editor...")}>Edit</Button>
                    <Button size="small" onClick={() => setSnackbar("Deleting notice...")}>Delete</Button>
                  </>
                ) : row.status === "scheduled" ? (
                  <Button size="small" onClick={() => setSnackbar("Opening notice editor...")}>Edit</Button>
                ) : (
                  <Button size="small" onClick={() => setSnackbar("Loading notice...")}>View</Button>
                )}
              </Stack>
            ),
          },
        ]}
        rows={filtered}
        emptyTitle="No notices found"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors (router.tsx is not touched until Task 17, so this new page has no consumer yet, but tsc still type-checks it).

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Notices.tsx
git commit -m "Add Notices page"
```

---

### Task 11: Document Signatures page

**Files:**
- Create: `src/pages/admin/DocumentSignatures.tsx`

**Interfaces:**
- Consumes: `getDocumentSignatures`, `signDocument` from `@/api/documentSignatures` (Task 3); `PageHeader`, `StatCard`, `DataTable`, `StatusChip` from `@/components/*`.
- Produces: default export consumed by `router.tsx` (Task 17) at `/admin/documents`.

- [ ] **Step 1: Create `src/pages/admin/DocumentSignatures.tsx`**

```tsx
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
                {row.status !== "completed" && <Button size="small" variant="contained" onClick={() => handleSign(row.id)}>Sign</Button>}
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
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/DocumentSignatures.tsx
git commit -m "Add Document Signatures page"
```

---

### Task 12: Audit Logs page

**Files:**
- Create: `src/pages/admin/AuditLogs.tsx`

**Interfaces:**
- Consumes: `getAuditLogs` from `@/api/auditLogs` (Task 4); `PageHeader`, `DataTable`, `StatusChip` from `@/components/*`.
- Produces: default export consumed by `router.tsx` (Task 17) at `/admin/audit-logs`.

- [ ] **Step 1: Create `src/pages/admin/AuditLogs.tsx`**

```tsx
import { useEffect, useMemo, useState } from "react";
import {
  Box, Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getAuditLogs } from "@/api/auditLogs";
import type { AuditLogEntry } from "@/types";

const modules = ["Authentication", "Academics", "Finance", "Operations", "System"];

export default function AuditLogs() {
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getAuditLogs().then(setRows); }, []);

  const users = useMemo(() => Array.from(new Set(rows.map((r) => r.actorEmail))).sort(), [rows]);

  const filtered = rows.filter((r) =>
    (moduleFilter === "all" || r.module === moduleFilter) &&
    (userFilter === "all" || r.actorEmail === userFilter) &&
    (dateFilter === "" || r.timestamp.startsWith(dateFilter)) &&
    (search === "" || r.action.toLowerCase().includes(search.toLowerCase()) || r.actorEmail.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="System Audit Logs"
        action={<Button variant="outlined" onClick={() => setSnackbar("Exporting Audit Logs... Download will start shortly.")}>Export Logs</Button>}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Audit logs track all system activities for security and compliance: user login/logout
        activities, data modifications and deletions, permission changes, financial transactions,
        system configuration changes, and failed access attempts.
      </Typography>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Module</InputLabel>
          <Select label="Module" value={moduleFilter} onChange={(e: SelectChangeEvent) => setModuleFilter(e.target.value)}>
            <MenuItem value="all">All Modules</MenuItem>
            {modules.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>User</InputLabel>
          <Select label="User" value={userFilter} onChange={(e: SelectChangeEvent) => setUserFilter(e.target.value)}>
            <MenuItem value="all">All Users</MenuItem>
            {users.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} sx={{ minWidth: 160 }} />
        <TextField size="small" placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 220 }} />
      </Stack>

      <DataTable<AuditLogEntry>
        pagination
        columns={[
          { key: "timestamp", label: "Timestamp" },
          { key: "actorEmail", label: "User" },
          { key: "action", label: "Action" },
          { key: "module", label: "Module" },
          { key: "ipAddress", label: "IP Address" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={filtered}
        emptyTitle="No audit log entries found"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

Note: the `Box` import is unused in this file — omit it from the import list (only `Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Snackbar` are needed).

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/AuditLogs.tsx
git commit -m "Add Audit Logs page"
```

---

### Task 13: System Health page

**Files:**
- Create: `src/pages/admin/SystemHealth.tsx`

**Interfaces:**
- Consumes: `getSystemHealth` from `@/api/systemHealth` (Task 5); `PageHeader`, `StatCard`, `StatusChip` from `@/components/*`.
- Produces: default export consumed by `router.tsx` (Task 17) at `/admin/system-health`.

- [ ] **Step 1: Create `src/pages/admin/SystemHealth.tsx`**

```tsx
import { useEffect, useState } from "react";
import { Box, Button, Stack, Typography, Grid, Paper, Snackbar } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MemoryIcon from "@mui/icons-material/Memory";
import StorageIcon from "@mui/icons-material/Storage";
import DnsIcon from "@mui/icons-material/Dns";
import BoltIcon from "@mui/icons-material/Bolt";
import GroupIcon from "@mui/icons-material/Group";
import BackupIcon from "@mui/icons-material/Backup";
import SpeedIcon from "@mui/icons-material/Speed";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getSystemHealth } from "@/api/systemHealth";
import type { SystemHealthMetrics } from "@/types";

export default function SystemHealth() {
  const { mode } = useColorMode();
  const [health, setHealth] = useState<SystemHealthMetrics | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getSystemHealth().then(setHealth); }, []);

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="System Health Monitor"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Refreshing system status...")}>Refresh</Button>
            <Button variant="contained" onClick={() => setSnackbar("Running diagnostics...")}>Run Diagnostics</Button>
          </Stack>
        }
      />
      {health && (
        <>
          <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="System Uptime" icon={<CheckCircleIcon />} color={getIconAccent(mode, "uptime")} value={`${health.uptimePct}%`} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="CPU Usage" icon={<SpeedIcon />} color={getIconAccent(mode, "cpu")} value={`${health.cpuPct}%`} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Memory Usage" icon={<MemoryIcon />} color={getIconAccent(mode, "memory")} value={`${health.memoryPct}%`} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Disk Space" icon={<StorageIcon />} color={getIconAccent(mode, "disk")} value={`${health.diskPct}%`} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Database" icon={<DnsIcon />} color={getIconAccent(mode, "database")} value={health.databaseHealthy ? "Healthy" : "Degraded"} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="API Response" icon={<BoltIcon />} color={getIconAccent(mode, "api")} value={`${health.apiResponseMs} ms`} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Active Users" icon={<GroupIcon />} color={getIconAccent(mode, "active-users")} numericValue={health.activeUsers} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Last Backup" icon={<BackupIcon />} color={getIconAccent(mode, "backup")} value={health.lastBackup} />
            </Grid>
          </Grid>

          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Service Status</Typography>
          <Stack spacing={1.5}>
            {health.services.map((s) => (
              <Paper key={s.name} elevation={0} sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.description}</Typography>
                </Box>
                <StatusChip status={s.status} />
              </Paper>
            ))}
          </Stack>
        </>
      )}
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/SystemHealth.tsx
git commit -m "Add System Health page"
```

---

### Task 14: Configurations page

**Files:**
- Create: `src/pages/admin/Configurations.tsx`

**Interfaces:**
- Consumes: `getSystemConfig`, `saveSystemConfig`, `resetSystemConfig` from `@/api/systemConfig` (Task 6).
- Produces: default export consumed by `router.tsx` (Task 17) at `/admin/configurations`.

- [ ] **Step 1: Create `src/pages/admin/Configurations.tsx`**

```tsx
import { useEffect, useState } from "react";
import {
  Box, Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Paper, Grid, Switch, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { getSystemConfig, saveSystemConfig, resetSystemConfig } from "@/api/systemConfig";
import type { SystemConfig } from "@/types";

const academicYears = ["2026-2027", "2025-2026", "2024-2025"];
const terms = ["Odd Semester", "Even Semester", "Summer Term"];

export default function Configurations() {
  const [form, setForm] = useState<SystemConfig | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getSystemConfig().then(setForm); }, []);

  const handleSave = () => {
    if (!form) return;
    saveSystemConfig(form).then(() => setSnackbar("Configuration saved successfully!"));
  };
  const handleReset = () => {
    resetSystemConfig().then((data) => { setForm(data); setSnackbar("Reset to default configuration"); });
  };

  if (!form) return null;

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="System Configurations"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={handleReset}>Reset Defaults</Button>
            <Button variant="contained" onClick={handleSave}>Save Changes</Button>
          </Stack>
        }
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Configure global system settings and parameters: institution details and branding,
        academic calendar settings, user roles and permissions, email and notification templates,
        payment gateway configuration, and backup and security settings.
      </Typography>

      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Institution Details</Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Institution Name" fullWidth value={form.institutionName} onChange={(e) => setForm({ ...form, institutionName: e.target.value })} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Institution Code" fullWidth value={form.institutionCode} onChange={(e) => setForm({ ...form, institutionCode: e.target.value })} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Email" fullWidth value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Phone" fullWidth value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Academic Settings</Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Current Academic Year</InputLabel>
              <Select label="Current Academic Year" value={form.academicYear} onChange={(e: SelectChangeEvent) => setForm({ ...form, academicYear: e.target.value })}>
                {academicYears.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Current Term</InputLabel>
              <Select label="Current Term" value={form.currentTerm} onChange={(e: SelectChangeEvent) => setForm({ ...form, currentTerm: e.target.value })}>
                {terms.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Minimum Attendance %" type="number" fullWidth value={form.minAttendancePct} onChange={(e) => setForm({ ...form, minAttendancePct: Number(e.target.value) })} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Passing Grade" fullWidth value={form.passingGrade} onChange={(e) => setForm({ ...form, passingGrade: e.target.value })} /></Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>System Preferences</Typography>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2" fontWeight={600}>Email Notifications</Typography>
              <Typography variant="caption" color="text.secondary">Send automated email notifications to users</Typography>
            </Box>
            <Switch checked={form.emailNotifications} onChange={(e) => setForm({ ...form, emailNotifications: e.target.checked })} />
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2" fontWeight={600}>SMS Notifications</Typography>
              <Typography variant="caption" color="text.secondary">Send SMS for critical updates</Typography>
            </Box>
            <Switch checked={form.smsNotifications} onChange={(e) => setForm({ ...form, smsNotifications: e.target.checked })} />
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2" fontWeight={600}>Two-Factor Authentication</Typography>
              <Typography variant="caption" color="text.secondary">Require 2FA for admin accounts</Typography>
            </Box>
            <Switch checked={form.twoFactorAuth} onChange={(e) => setForm({ ...form, twoFactorAuth: e.target.checked })} />
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2" fontWeight={600}>Auto Backup</Typography>
              <Typography variant="caption" color="text.secondary">Automatic daily database backup at 2:00 AM</Typography>
            </Box>
            <Switch checked={form.autoBackup} onChange={(e) => setForm({ ...form, autoBackup: e.target.checked })} />
          </Stack>
        </Stack>
      </Paper>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Configurations.tsx
git commit -m "Add Configurations page"
```

---

### Task 15: Profile page

**Files:**
- Create: `src/pages/admin/Profile.tsx`

**Interfaces:**
- Consumes: `getAdminProfile`, `saveAdminProfile` from `@/api/adminProfile` (Task 8); `getAuditLogs` from `@/api/auditLogs` (Task 4); `PageHeader`, `StatusChip` from `@/components/*`.
- Produces: default export consumed by `router.tsx` (Task 17) at `/admin/profile`.

- [ ] **Step 1: Create `src/pages/admin/Profile.tsx`**

```tsx
import { useEffect, useState } from "react";
import { Box, Button, Stack, TextField, Typography, Paper, Grid, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getAdminProfile, saveAdminProfile } from "@/api/adminProfile";
import { getAuditLogs } from "@/api/auditLogs";
import type { AdminProfile, AuditLogEntry } from "@/types";

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export default function Profile() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [myActivity, setMyActivity] = useState<AuditLogEntry[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    getAdminProfile().then((data) => { setProfile(data); setForm({ name: data.name, email: data.email, phone: data.phone }); });
    getAuditLogs().then((data) => setMyActivity(data.filter((a) => a.actorEmail === "admin@kalnet.edu")));
  }, []);

  const handleSave = () => {
    saveAdminProfile(form).then((data) => { setProfile(data); setSnackbar("Profile updated successfully!"); });
  };

  if (!profile) return null;

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="My Profile"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Opening password change dialog...")}>Change Password</Button>
            <Button variant="contained" onClick={handleSave}>Save Changes</Button>
          </Stack>
        }
      />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, textAlign: "center" }}>
            <Box sx={{ width: 72, height: 72, borderRadius: "50%", bgcolor: "primary.main", color: "primary.contrastText", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, mx: "auto", mb: 2 }}>
              {initials(profile.name)}
            </Box>
            <Typography variant="h6" fontWeight={700}>{profile.name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{profile.role}</Typography>
            <Grid container spacing={2}>
              <Grid size={4}><Typography variant="h6" fontWeight={700}>{profile.actionsToday}</Typography><Typography variant="caption" color="text.secondary">Actions Today</Typography></Grid>
              <Grid size={4}><Typography variant="h6" fontWeight={700}>{(profile.totalActions / 1000).toFixed(1)}k</Typography><Typography variant="caption" color="text.secondary">Total Actions</Typography></Grid>
              <Grid size={4}><Typography variant="h6" fontWeight={700}>{profile.efficiencyPct}%</Typography><Typography variant="caption" color="text.secondary">Efficiency</Typography></Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Profile Information</Typography>
            <Stack spacing={2.5}>
              <TextField label="Full Name" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <TextField label="Email Address" fullWidth value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <TextField label="Phone Number" fullWidth value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <TextField label="Role" fullWidth value={profile.role} disabled />
              <TextField label="Department" fullWidth value={profile.department} disabled />
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Activity Log</Typography>
      <DataTable<AuditLogEntry>
        pagination
        columns={[
          { key: "action", label: "Action" },
          { key: "module", label: "Module" },
          { key: "timestamp", label: "Date & Time" },
          { key: "ipAddress", label: "IP Address" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={myActivity}
        emptyTitle="No activity found"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Profile.tsx
git commit -m "Add Profile page"
```

---

### Task 16: Settings page

**Files:**
- Create: `src/pages/admin/Settings.tsx`

**Interfaces:**
- Consumes: `getAppSettings`, `saveAppSettings`, `resetAppSettings` from `@/api/appSettings` (Task 7); `useColorMode` from `@/context/ColorModeContext`.
- Produces: default export consumed by `router.tsx` (Task 17) at `/admin/settings`.

- [ ] **Step 1: Create `src/pages/admin/Settings.tsx`**

```tsx
import { useEffect, useState } from "react";
import {
  Box, Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Paper, Grid, Switch, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { useColorMode } from "@/context/ColorModeContext";
import { getAppSettings, saveAppSettings, resetAppSettings } from "@/api/appSettings";
import type { AppSettings } from "@/types";

const academicYears = ["2026-2027", "2025-2026", "2024-2025"];
const semesters = ["Odd Semester", "Even Semester"];
const languages = ["English", "Hindi", "Regional"];
const timezones = ["IST (UTC+5:30)", "UTC", "EST"];
const dateFormats = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
const timeFormats = ["12 Hour", "24 Hour"];

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Box>
        <Typography variant="body2" fontWeight={600}>{label}</Typography>
        <Typography variant="caption" color="text.secondary">{description}</Typography>
      </Box>
      <Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </Stack>
  );
}

export default function Settings() {
  const { mode, toggleColorMode } = useColorMode();
  const [form, setForm] = useState<AppSettings | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getAppSettings().then(setForm); }, []);

  const handleSave = () => {
    if (!form) return;
    saveAppSettings(form).then(() => setSnackbar("Settings saved successfully!"));
  };
  const handleReset = () => {
    resetAppSettings().then((data) => { setForm(data); setSnackbar("Settings reset to default"); });
  };

  if (!form) return null;

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Settings"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={handleReset}>Reset to Default</Button>
            <Button variant="contained" onClick={handleSave}>Save Settings</Button>
          </Stack>
        }
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Manage system settings and preferences</Typography>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Appearance Settings</Typography>
            <Stack spacing={2}>
              <ToggleRow label="Dark Mode" description="Switch between light and dark theme" checked={mode === "dark"} onChange={() => toggleColorMode()} />
              <ToggleRow label="Compact View" description="Use a more compact layout for tables" checked={form.compactView} onChange={(v) => setForm({ ...form, compactView: v })} />
              <ToggleRow label="Animations" description="Enable smooth animations and transitions" checked={form.animations} onChange={(v) => setForm({ ...form, animations: v })} />
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Notification Settings</Typography>
            <Stack spacing={2}>
              <ToggleRow label="Email Notifications" description="Receive email notifications for important updates" checked={form.emailNotifications} onChange={(v) => setForm({ ...form, emailNotifications: v })} />
              <ToggleRow label="SMS Notifications" description="Receive SMS alerts for urgent matters" checked={form.smsNotifications} onChange={(v) => setForm({ ...form, smsNotifications: v })} />
              <ToggleRow label="Push Notifications" description="Receive browser push notifications" checked={form.pushNotifications} onChange={(v) => setForm({ ...form, pushNotifications: v })} />
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 3, mb: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>General Settings</Typography>
        <Grid container spacing={2.5}>
          <Grid size={12}><TextField label="College Name" fullWidth value={form.collegeName} onChange={(e) => setForm({ ...form, collegeName: e.target.value })} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Academic Year</InputLabel>
              <Select label="Academic Year" value={form.academicYear} onChange={(e: SelectChangeEvent) => setForm({ ...form, academicYear: e.target.value })}>
                {academicYears.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Current Semester</InputLabel>
              <Select label="Current Semester" value={form.semester} onChange={(e: SelectChangeEvent) => setForm({ ...form, semester: e.target.value })}>
                {semesters.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Default Language</InputLabel>
              <Select label="Default Language" value={form.language} onChange={(e: SelectChangeEvent) => setForm({ ...form, language: e.target.value })}>
                {languages.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Timezone</InputLabel>
              <Select label="Timezone" value={form.timezone} onChange={(e: SelectChangeEvent) => setForm({ ...form, timezone: e.target.value })}>
                {timezones.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Date Format</InputLabel>
              <Select label="Date Format" value={form.dateFormat} onChange={(e: SelectChangeEvent) => setForm({ ...form, dateFormat: e.target.value })}>
                {dateFormats.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Time Format</InputLabel>
              <Select label="Time Format" value={form.timeFormat} onChange={(e: SelectChangeEvent) => setForm({ ...form, timeFormat: e.target.value })}>
                {timeFormats.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Security Settings</Typography>
            <Stack spacing={2}>
              <ToggleRow label="Two-Factor Authentication" description="Require 2FA for admin accounts" checked={form.twoFactorAuth} onChange={(v) => setForm({ ...form, twoFactorAuth: v })} />
              <ToggleRow label="Session Timeout" description="Auto logout after 30 minutes of inactivity" checked={form.sessionTimeout} onChange={(v) => setForm({ ...form, sessionTimeout: v })} />
              <ToggleRow label="Login Alerts" description="Get notified of new login attempts" checked={form.loginAlerts} onChange={(v) => setForm({ ...form, loginAlerts: v })} />
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Backup & Data</Typography>
            <Stack spacing={2}>
              <ToggleRow label="Auto Backup" description="Automatic daily database backup at 2:00 AM" checked={form.autoBackup} onChange={(v) => setForm({ ...form, autoBackup: v })} />
              <ToggleRow label="Data Retention" description="Keep logs for 90 days" checked={form.dataRetention} onChange={(v) => setForm({ ...form, dataRetention: v })} />
              <Button variant="outlined" fullWidth onClick={() => setSnackbar("Backup initiated...")}>Backup Now</Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Settings.tsx
git commit -m "Add Settings page"
```

---

### Task 17: Navigation Communication+System groups + router wiring

**Files:**
- Modify: `src/components/navigation.tsx`
- Modify: `src/router.tsx`

**Interfaces:**
- Consumes: default exports from `Notices.tsx` (Task 10), `DocumentSignatures.tsx` (Task 11), `AuditLogs.tsx` (Task 12), `SystemHealth.tsx` (Task 13), `Configurations.tsx` (Task 14), `Profile.tsx` (Task 15), `Settings.tsx` (Task 16).
- Produces: updated `getNavItems("admin")` with Communication and System groups inserted between Finance and Administration; 7 new routes registered in `router.tsx`.

- [ ] **Step 1: Add the Communication and System groups, between Finance and Administration**

Find:

```tsx
        { label: "Payments & Waivers", path: "/admin/fees/payments", icon: <ReceiptIcon />, group: "Finance" },
        { label: "Users", path: "/admin/users", icon: <PeopleIcon />, group: "Administration" },
```

Replace with:

```tsx
        { label: "Payments & Waivers", path: "/admin/fees/payments", icon: <ReceiptIcon />, group: "Finance" },
        { label: "Notices & Announcements", path: "/admin/notices", icon: <CampaignIcon />, group: "Communication" },
        { label: "Document Signatures", path: "/admin/documents", icon: <HistoryEduIcon />, group: "Communication" },
        { label: "Audit Logs", path: "/admin/audit-logs", icon: <ManageSearchIcon />, group: "System" },
        { label: "System Health", path: "/admin/system-health", icon: <MonitorHeartIcon />, group: "System" },
        { label: "Configurations", path: "/admin/configurations", icon: <TuneIcon />, group: "System" },
        { label: "My Profile", path: "/admin/profile", icon: <AccountCircleIcon />, group: "System" },
        { label: "Settings", path: "/admin/settings", icon: <SettingsIcon />, group: "System" },
        { label: "Users", path: "/admin/users", icon: <PeopleIcon />, group: "Administration" },
```

Add the 7 new icon imports to the existing icon-import block:

```tsx
import CampaignIcon from "@mui/icons-material/Campaign";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import TuneIcon from "@mui/icons-material/Tune";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SettingsIcon from "@mui/icons-material/Settings";
```

- [ ] **Step 2: Add the 7 new lazy imports to `router.tsx`**

Add to the existing admin lazy-import block in `src/router.tsx`:

```tsx
const AdminNotices = lazy(() => import("@/pages/admin/Notices"));
const AdminDocumentSignatures = lazy(() => import("@/pages/admin/DocumentSignatures"));
const AdminAuditLogs = lazy(() => import("@/pages/admin/AuditLogs"));
const AdminSystemHealth = lazy(() => import("@/pages/admin/SystemHealth"));
const AdminConfigurations = lazy(() => import("@/pages/admin/Configurations"));
const AdminProfilePage = lazy(() => import("@/pages/admin/Profile"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
```

(Named `AdminProfilePage` to avoid colliding with the `AdminUserProfile` import already present.)

- [ ] **Step 3: Add the 7 new routes**

Find:

```tsx
      { path: "admin/fees/payments", element: <AdminPayments /> },
      { path: "teacher", element: <TeacherDashboard /> },
```

Replace with:

```tsx
      { path: "admin/fees/payments", element: <AdminPayments /> },
      { path: "admin/notices", element: <AdminNotices /> },
      { path: "admin/documents", element: <AdminDocumentSignatures /> },
      { path: "admin/audit-logs", element: <AdminAuditLogs /> },
      { path: "admin/system-health", element: <AdminSystemHealth /> },
      { path: "admin/configurations", element: <AdminConfigurations /> },
      { path: "admin/profile", element: <AdminProfilePage /> },
      { path: "admin/settings", element: <AdminSettings /> },
      { path: "teacher", element: <TeacherDashboard /> },
```

- [ ] **Step 4: Verify the full project builds**

Run: `npm run build`
Expected: `tsc -b` reports no errors, `vite build` completes with `✓ built in <time>`. No more "Cannot find module" errors — every page referenced by the router now exists.

- [ ] **Step 5: Commit**

```bash
git add src/components/navigation.tsx src/router.tsx
git commit -m "Wire Admin Communication and System navigation and routes"
```

---

### Task 18: End-to-end manual verification

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: Vite prints a local URL.

- [ ] **Step 2: Log in as Admin and verify the sidebar Communication + System groups**

Confirm the sidebar now shows "Communication" (Notices & Announcements,
Document Signatures) and "System" (Audit Logs, System Health,
Configurations, My Profile, Settings) groups between Finance and
Administration.

- [ ] **Step 3: Verify Notices**

Navigate to Notices & Announcements. Confirm the table shows 15 rows
with real Status/Title/Audience/Author/Published Date. Use the
Audience filter, Month filter, and search box one at a time and
confirm the row set actually narrows each time. Click any action
button and confirm it shows a stub Snackbar notification (not a real
modal).

- [ ] **Step 4: Verify Document Signatures**

Navigate to Document Signatures. Confirm the 4 KPI cards show real
counts and clicking each one switches the active tab. Confirm the 4
tab buttons filter the table. Click "Sign" on a pending document and
confirm it moves to the In Progress tab with a real progress bar;
click "Sign" on that same document repeatedly and confirm it
eventually moves to Completed with a signature count.

- [ ] **Step 5: Verify Audit Logs**

Navigate to Audit Logs. Confirm the table shows 40 rows. Use the
Module filter, User filter, Date filter, and search box one at a time
and confirm the row set actually narrows each time.

- [ ] **Step 6: Verify System Health**

Navigate to System Health. Confirm all 8 KPI cards and the 5-row
Service Status list render, with the SMS Service row showing a
"Degraded" chip distinct from the other "Running" rows.

- [ ] **Step 7: Verify Configurations**

Navigate to Configurations. Change the Institution Name field and
toggle a switch, click "Save Changes", navigate away and back, and
confirm the changes persisted. Click "Reset Defaults" and confirm the
original seed values return.

- [ ] **Step 8: Verify Profile**

Navigate to My Profile. Confirm the avatar/stats/form render with real
data. Edit the Phone Number field, click "Save Changes", navigate away
and back, and confirm it persisted. Confirm the Activity Log table
below shows only entries for `admin@kalnet.edu`.

- [ ] **Step 9: Verify Settings**

Navigate to Settings. Toggle "Dark Mode" and confirm the entire app's
theme actually switches (not just this page). Toggle a couple of other
switches and change a select, click "Save Settings", navigate away and
back, and confirm they persisted. Click "Reset to Default" and confirm
they revert.

- [ ] **Step 10: Verify dark mode rendering**

With dark mode now on (from Step 9), visit each of the 7 new pages and
confirm tables, KPI cards, chips, and toggles all remain legible.

- [ ] **Step 11: Run the linter**

Run: `npm run lint`
Expected: no errors (only the pre-existing `AuthContext.tsx`
fast-refresh warning from Phase 0).

- [ ] **Step 12: Stop the dev server, then commit**

No files change in this task unless Step 11 required fixes; if it did,
amend those specific files, then:

```bash
git add -A
git commit -m "Verify Phase 1e end-to-end"
```

(Skip this commit entirely if Step 11 required no changes.)
