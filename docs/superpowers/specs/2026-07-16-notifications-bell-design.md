# Notifications Bell — Design

## Problem

The bell icon in the shared `AppBar` (`app/src/components/Layout.tsx`) has
never done anything on click, in any portal, since the very first
foundation-scaffold commit — it only shows an unread count via
`getUnreadNotificationCount()`. There is no popover, dropdown, or page wired
to it anywhere.

Investigation also surfaced a second, pre-existing issue: the codebase has
two entirely separate notification systems that were never connected:

- **`Notification`** (`app/src/api/notifications.ts`,
  `demo-data/communication/notifications.ts`) — a generic title/message/
  timestamp feed, 6 seed rows, no linked entity, no mark-as-read mutation.
  This is the feed the bell's badge count currently reads from, in every
  portal including Staff.
- **`OpsNotification`** (`app/src/api/staffNotifications.ts`,
  `demo-data/staff/notifications.ts`) — a fully-built, task-linked feed with
  `markNotificationRead` / `markAllNotificationsRead`, rendered on
  `pages/staff/Notifications.tsx` — but that page isn't linked from the
  Staff sidebar (`components/navigation.tsx` has no "Notifications" entry),
  and the bell's badge count never reads from it, so today a Staff user's
  badge number doesn't even match what their own notifications page would
  show.

## Scope

- **Staff** keeps its existing `OpsNotification` feed. The bell becomes
  clickable and navigates to the existing `/staff/notifications` page — no
  new UI for Staff.
- **Admin, Teacher, Student** get a new popover backed by the generic
  `Notification` feed, opened by clicking the bell.
- **Badge count correctness (bug fix riding along)**: the unread count
  shown in the bell must come from the feed that portal's bell actually
  opens — `getOpsNotifications()`'s unread count for Staff, and
  `getUnreadNotificationCount()` (existing, generic) for the other three
  portals. Today it's the generic count for all four, which is wrong for
  Staff.
- No new full "Notifications" page for Admin/Teacher/Student — 6 seed rows
  fit in a popover with no pagination needed.
- No deep-linking from generic notifications — the `Notification` type has
  no linked task/course/ticket id, so clicking a row can only mark it read.

## Changes

### `app/src/api/notifications.ts`

Add two functions, mirroring the existing pattern in
`app/src/api/staffNotifications.ts` exactly:

```ts
export function markNotificationRead(id: string): Promise<void> {
  const n = notifications.find((x) => x.id === id);
  if (n) n.read = true;
  return simulateRequest(undefined);
}

export function markAllNotificationsRead(): Promise<void> {
  notifications.forEach((n) => { n.read = true; });
  return simulateRequest(undefined);
}
```

### `app/src/components/NotificationsPopover.tsx` (new)

A MUI `Popover` anchored to the bell `IconButton`. Props:
```ts
interface NotificationsPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onReadStateChanged: () => void;
}
```
- Fetches `getNotifications()` each time it opens.
- Renders each notification (title, message, timestamp), most recent
  first. Unread rows are visually distinguished (matching the existing
  `StatusChip`/read-unread convention already used on Staff's page).
  Clicking a row calls `markNotificationRead(id)`, refetches, and calls
  `onReadStateChanged()` so the parent can refresh the badge count.
- A "Mark all read" action at the top calls `markAllNotificationsRead()`,
  refetches, and calls `onReadStateChanged()`.
- Empty state ("No notifications") when the list is empty, reusing the
  existing `EmptyState` component.

### `app/src/components/Layout.tsx`

- The bell's wrapper `Box` becomes an `IconButton` with an `onClick`
  handler:
  - `role === "staff"` → `navigate("/staff/notifications")`.
  - otherwise → opens `NotificationsPopover` (new `anchorEl` state).
- The existing `unreadNotifications` effect branches on role: Staff calls
  `getOpsNotifications()` and counts `!read` rows; the other three roles
  keep calling the existing `getUnreadNotificationCount()`.
- `NotificationsPopover`'s `onReadStateChanged` re-runs that same count
  fetch so the badge updates immediately without a page reload.

## Non-Goals

- No new full-page notifications view for Admin/Teacher/Student.
- No changes to `OpsNotification`, its page, or its API — Staff's existing
  feature is reused as-is, just linked from the bell.
- No cross-linking between the two notification systems, and no unifying
  them into one model — that would be a larger refactor than this fix
  calls for.
- Adding "Notifications" to the Staff sidebar nav is a separate,
  pre-existing gap and out of scope here (the bell now provides a working
  path to that page regardless).
