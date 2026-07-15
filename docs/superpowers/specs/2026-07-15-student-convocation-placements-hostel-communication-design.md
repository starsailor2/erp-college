# College ERP Rewrite — Phase 4b: Student / Convocation, Fellowship, Placements, Hostel, Resources, Reports, Communication

Status: Approved
Date: 2026-07-15

## Context

Second (final) sub-phase of Phase 4 (Student portal), completing `student.html`'s
remaining 8 pages: Convocation, Fellowship, Placements, Hostel & Mess,
Facility & Resource Booking, Reports, Notices, Messages. This is the **last
phase of the entire rewrite** — once it ships, `student.html` is deleted and
the legacy static app is fully retired. Conventions from all prior phases
apply unchanged. Phase 4a's `StudentProfile`/`StudentCourse`/etc. are reused
where relevant (Fee Ledger-style header blocks, course references).

## Source findings

- **Notices' `filterNotices(category)` is a no-op toast** — the notice list
  never actually filters by the clicked category button. Fixed to a real
  client-side filter.
- **Notices' `viewNotice(id)` is an ID-ignored bug**: regardless of which of
  the 4 different notices is clicked, the modal always renders the same
  hardcoded "Semester Examination Schedule Released" content. Fixed to real
  per-notice detail.
- **Notices' `markAllRead()` never changes the "2 unread" badge** — a no-op
  toast. Fixed to really mark every notice read and recompute the badge.
- **Messages' `filterMessages(category)` is a no-op toast**, same pattern as
  Notices — fixed to a real client-side filter.
- **Messages' 5 "Quick Contact" buttons** (`messageInstructor`,
  `messageWarden`, `messagePlacement`, `messageLibrary`, `messageAdmin`) are
  identical one-line wrappers that all call the generic, unprefilled
  `composeMessage()` — none actually pre-fills its named recipient. Collapsed
  into one parameterized compose action that pre-fills the recipient group.
- **Messages' `viewMessage(id)` is already correctly implemented in the
  source** (a real per-id content lookup) — carried over as-is, just typed.
- **Hostel's `trackRequest(id)` is an ID-ignored bug**: the header echoes the
  clicked request's id, but the entire 4-step timeline below it is static
  regardless of which request was clicked. Fixed to real per-request
  tracking, backed by one shared `HostelRequest` list that the 5 request
  forms (Room Change, Maintenance, Leave, Visitor Pass, Lost Item) also feed.
- **Fellowship's `applyScholarship(name)` and Placements'
  `applyPlacement(company)` are both STUBs** — applying never adds anything
  to "Application History" / "My Applications". Fixed: applying appends a
  real, tracked application record.
- **Resources' `submitBooking(name)` (used by both `bookFacility` and
  `bookEquipment`) is a STUB** — booking never appears in "Current
  Bookings". Fixed to a real, shared booking list.
- **Convocation's `requestDocument('Provisional Certificate')` silently
  falls through to a generic "being prepared" placeholder** (missing key in
  the source's forms map) — fixed with a real form, same treatment as Fee
  Clearance Certificate in Phase 4a.
- **`downloadFile()`-equivalent actions stay stub `Snackbar`s everywhere**
  (Reports' report tiles, Mess Bill, Hostel Rules, Scholarship/Placement/
  Booking Calendar guidelines, etc.) — no real files exist to download in
  the source, matching the established rule from every prior phase.
- **Reports' `generateCustomReport()`/`scheduleReports()` are real, fillable
  forms in the source** but there's no real report-generation engine to
  connect them to — they stay real forms whose submission is a confirmation
  `Snackbar` (no artifact produced), the same treatment as Phase 4a's Exam
  Form submission.
- **Hostel's "Change Meal Plan"** is a simple radio-selection form worth
  making genuinely real (a single mutable "current plan" value the Mess
  Details display reads from) — low cost, avoids leaving an obviously
  fillable form as a pure stub.
- Decorative/informational-only modals with no real fillable fields
  (View Room Photos, View Mess Menu, View Booking/Scholarship/Placement
  Calendar, View Complaint-equivalent guidance) stay simple informational
  displays or stub `Snackbar`s — no real form exists in the source to adapt.

## Decisions

- **One shared `HostelRequest` list** backs all 5 hostel request forms and
  the "Active Requests" tracker — submitting any of the 5 forms appends a
  record with its own `id`, `type`, and `timeline`, and `trackRequest`
  reads that specific record instead of static content.
- **Scholarships and Placements each carry an `applied`/status field
  directly on their catalog entries** (not a separate junction table) —
  simplest model matching the source's 1:1 "apply once" behavior.
- **Resource bookings share one list across Facilities and Equipment** —
  both `bookFacility`/`bookEquipment` write to the same `ResourceBooking[]`,
  matching the source's shared "Current Bookings" panel.
- **Notices and Messages get their own types** (`StudentNotice`,
  `StudentMessage`) distinct from the shared top-level `Notice`/`Message`
  types (Phase 0's topbar-badge notification and Teacher Phase 2a's
  `Message`/`MessageContact`) — same precedent as every prior phase keeping
  a portal-specific list separate from the shared badge/count mechanism.
- **Messages' 5 Quick Contact buttons become one `composeMessage(recipientGroup?)`
  action** — passing a recipient group pre-fills the compose form's
  recipient field instead of opening an identical blank form 5 times.
- **Reports' report tiles and calendar/guideline modals stay stub
  `Snackbar`s** — no real backing exists to build against.

## Data model (additions to `src/types/index.ts`)

```ts
export interface StudentScholarship {
  name: string;
  amount: number;
  eligibility: string;
  deadline: string;
  applied: boolean;
}

export type ScholarshipAppStatus = "pending" | "approved" | "rejected";
export interface ScholarshipApplication {
  name: string;
  appliedOn: string;
  status: ScholarshipAppStatus;
}

export interface PlacementDrive {
  company: string;
  role: string;
  ctc: string;
  date: string;
  eligibility: string;
}

export type PlacementAppStatus = "applied" | "shortlisted" | "rejected" | "selected";
export interface PlacementApplication {
  company: string;
  role: string;
  appliedOn: string;
  status: PlacementAppStatus;
}

export type HostelRequestType = "room_change" | "maintenance" | "leave" | "visitor_pass" | "lost_item";
export type HostelRequestStatus = "pending" | "in_progress" | "resolved";
export interface HostelRequest {
  id: string;
  type: HostelRequestType;
  details: string;
  submittedOn: string;
  status: HostelRequestStatus;
  timeline: { time: string; action: string }[];
}

export type ResourceBookingStatus = "confirmed" | "pending";
export interface ResourceBooking {
  id: string;
  resourceName: string;
  date: string;
  timeSlot: string;
  purpose: string;
  status: ResourceBookingStatus;
}

export type StudentNoticeCategory = "academic" | "hostel" | "placement" | "library" | "general";
export type StudentNoticeUrgency = "urgent" | "important" | "normal";
export interface StudentNotice {
  id: string;
  title: string;
  body: string;
  date: string;
  author: string;
  category: StudentNoticeCategory;
  urgency: StudentNoticeUrgency;
  read: boolean;
}

export interface StudentMessage {
  id: string;
  from: string;
  subject: string;
  category: string;
  timeAgo: string;
  body: string;
  read: boolean;
}
```

## Folder additions

```
src/
  demo-data/
    student/
      scholarships.ts   (StudentScholarship[] + ScholarshipApplication[])
      placements.ts      (PlacementDrive[] + PlacementApplication[])
      hostel.ts           (HostelRequest[] + current meal plan)
      resources.ts         (facility/equipment catalog + ResourceBooking[])
      notices.ts            (StudentNotice[])
      messages.ts            (StudentMessage[])
  api/
    studentScholarships.ts
    studentPlacements.ts
    studentHostel.ts
    studentResources.ts
    studentNotices.ts
    studentMessages.ts
  pages/student/
    Convocation.tsx
    Fellowship.tsx
    Placements.tsx
    Hostel.tsx
    Resources.tsx
    Reports.tsx
    Notices.tsx
    Messages.tsx
```

## Routing additions (`router.tsx`)

```
/student/convocation  -> Convocation
/student/fellowship   -> Fellowship
/student/placements   -> Placements
/student/hostel       -> Hostel
/student/resources    -> Resources
/student/reports      -> Reports
/student/notices      -> Notices
/student/messages     -> Messages
```

## Navigation changes (`components/navigation.tsx`, `"student"` case)

Appended after Phase 4a's Finance group, matching the source's own
top-level (ungrouped) sidebar placement for each of these sections except
Notices/Messages, which share a `"Communication"` group header:

```
Convocation                                                   (ungrouped)
Fellowship                                                    (ungrouped)
Placements                                                    (ungrouped)
Hostel & Mess                                                 (ungrouped)
Facility & Resource Booking                                   (ungrouped)
Reports                                                        (ungrouped)
Communication group:
  Notices, Messages
My Profile                                                    (stays final "_bottom" item)
```

## Component reuse

Same as every prior phase: `PageHeader`, `StatCard`, `ChartCard`,
`DataTable`, `EmptyState`, `StatusChip`, `Snackbar`. `StatusChip` needs new
entries: `shortlisted`, `selected` (placements); `confirmed` (bookings);
`pending`/`approved`/`rejected`/`in_progress`/`resolved`/`read`/`unread`
already exist and are reused.

## Error handling

Same as every prior phase — in-memory mutations only, resolved through
`simulateRequest`.

## Testing / verification

Notices' category filter buttons actually filter the visible list; clicking
different notice cards shows each one's own real title/body (ID-ignored bug
fix); Mark All Read clears the unread badge. Messages' category filter
actually filters; a Quick Contact button opens compose pre-filled with that
recipient; sending a message appends it to the list. Hostel: submitting any
of the 5 request forms adds a new entry to Active Requests, and clicking
different requests shows each one's own real timeline (ID-ignored bug fix).
Applying to a scholarship/placement adds a real tracked record to
Application History/My Applications. Booking a facility or piece of
equipment adds it to Current Bookings. Requesting a Provisional Certificate
on Convocation opens a real form instead of the generic fallback. Both
light/dark modes render correctly.

## Out of scope for Phase 4b

None — this is the final phase. `student.html` is deleted once this ships,
completing the entire `erp-college` → `app/` rewrite.
