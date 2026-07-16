# Notifications Bell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the AppBar bell icon actually do something in every portal — a working popover for Admin/Teacher/Student, and a direct link to Staff's existing notifications page — and fix the badge count to read from the right feed per portal.

**Architecture:** Two new mutation functions in `api/notifications.ts` (mirroring the existing pattern in `api/staffNotifications.ts`), one new `NotificationsPopover` component, and a `Layout.tsx` edit that turns the inert bell `Box` into a real `IconButton` whose click behavior and badge-count source both branch on `role`. This is one cohesive change — the role branching for both the click handler and the count-loading effect lives in the same file, so it can't be meaningfully split into independently-testable pieces; it's verified as a whole across all four portals in one step.

**Tech Stack:** React 19, TypeScript 5.8, MUI v7. No new dependencies.

## Global Constraints

- No new full-page notifications view for Admin/Teacher/Student — the popover is the whole UI, no pagination (6 seed rows).
- No changes to `OpsNotification`, its demo data, its API, or `pages/staff/Notifications.tsx` — Staff's existing feature is reused as-is via a new link from the bell.
- No deep-linking from generic notifications (the `Notification` type has no linked task/course/ticket id) — clicking a row only marks it read.
- No automated test framework in this codebase (established project convention) — verify manually via `npm run dev` and the browser.
- Path alias `@/` maps to `app/src/`. Run `npx tsc -b` from `app/` as the type-check gate.

---

### Task 1: Wire up the notifications bell across all four portals

**Files:**
- Modify: `app/src/api/notifications.ts`
- Create: `app/src/components/NotificationsPopover.tsx`
- Modify: `app/src/components/Layout.tsx`

**Interfaces:**
- Produces: `markNotificationRead(id: string): Promise<void>`, `markAllNotificationsRead(): Promise<void>` (added to `api/notifications.ts`, alongside the existing `getNotifications` and `getUnreadNotificationCount`). `NotificationsPopover` default export, props `{ open: boolean; anchorEl: HTMLElement | null; onClose: () => void; onReadStateChanged: () => void }`.
- Consumes: `getOpsNotifications` from `@/api/staffNotifications` (existing), `StatusChip` from `@/components/StatusChip` (existing, already supports `"read"`/`"unread"` status keys), `EmptyState` from `@/components/EmptyState` (existing), `Notification` type from `@/types` (existing: `{ id, title, message, postedBy, read, timestamp }`).

- [ ] **Step 1: Add mark-as-read mutations to the notifications API**

In `app/src/api/notifications.ts`, replace the full file contents with:

```ts
import { notifications } from "@/demo-data/communication/notifications";
import { simulateRequest } from "@/api/http";
import type { Notification } from "@/types";

export function getNotifications(): Promise<Notification[]> {
  return simulateRequest(notifications);
}

export function getUnreadNotificationCount(): Promise<number> {
  return simulateRequest(notifications.filter((n) => !n.read).length);
}

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

- [ ] **Step 2: Create the notifications popover**

Create `app/src/components/NotificationsPopover.tsx`:

```tsx
import { useEffect, useState } from "react";
import Popover from "@mui/material/Popover";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Divider from "@mui/material/Divider";
import StatusChip from "@/components/StatusChip";
import EmptyState from "@/components/EmptyState";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/api/notifications";
import type { Notification } from "@/types";

interface NotificationsPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onReadStateChanged: () => void;
}

export default function NotificationsPopover({ open, anchorEl, onClose, onReadStateChanged }: NotificationsPopoverProps) {
  const [rows, setRows] = useState<Notification[]>([]);

  const load = () => {
    getNotifications().then((data) => {
      setRows([...data].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    });
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const handleRowClick = (row: Notification) => {
    if (row.read) return;
    markNotificationRead(row.id).then(() => {
      load();
      onReadStateChanged();
    });
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead().then(() => {
      load();
      onReadStateChanged();
    });
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{ paper: { sx: { width: 360, maxHeight: 420 } } }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
        <Button size="small" onClick={handleMarkAllRead}>Mark all read</Button>
      </Box>
      <Divider />
      {rows.length === 0 ? (
        <EmptyState title="No notifications" />
      ) : (
        <List dense disablePadding>
          {rows.map((row) => (
            <Box key={row.id}>
              <ListItemButton
                onClick={() => handleRowClick(row)}
                sx={{ py: 1.25, flexDirection: "column", alignItems: "stretch" }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, width: "100%" }}>
                  <Typography variant="body2" fontWeight={600}>{row.title}</Typography>
                  <StatusChip status={row.read ? "read" : "unread"} size="small" />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  {row.message}
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.5 }}>
                  {new Date(row.timestamp).toLocaleString()}
                </Typography>
              </ListItemButton>
              <Divider />
            </Box>
          ))}
        </List>
      )}
    </Popover>
  );
}
```

- [ ] **Step 3: Wire the bell in Layout — imports**

In `app/src/components/Layout.tsx`, add `type MouseEvent` to the existing React import — find:

```ts
import { Suspense, useMemo, useRef, useState, useEffect } from "react";
```

and change it to:

```ts
import { Suspense, useMemo, useRef, useState, useEffect, type MouseEvent } from "react";
```

Add the new imports right after the existing `getUnreadNotificationCount` import:

```ts
import { getUnreadNotificationCount } from "@/api/notifications";
import { getOpsNotifications } from "@/api/staffNotifications";
import NotificationsPopover from "@/components/NotificationsPopover";
```

- [ ] **Step 4: Wire the bell in Layout — state and count-loading logic**

Replace the existing unread-count effect — find:

```tsx
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  useEffect(() => {
    let live = true;
    getUnreadNotificationCount().then((count) => { if (live) setUnreadNotifications(count); });
    return () => { live = false; };
  }, []);
```

with:

```tsx
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifRefreshKey, setNotifRefreshKey] = useState(0);
  const [notifAnchorEl, setNotifAnchorEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    let live = true;
    const countPromise = role === "staff"
      ? getOpsNotifications().then((rows) => rows.filter((r) => !r.read).length)
      : getUnreadNotificationCount();
    countPromise.then((count) => { if (live) setUnreadNotifications(count); });
    return () => { live = false; };
  }, [role, notifRefreshKey]);

  const handleBellClick = (event: MouseEvent<HTMLElement>) => {
    if (role === "staff") {
      navigate("/staff/notifications");
    } else {
      setNotifAnchorEl(event.currentTarget);
    }
  };
```

- [ ] **Step 5: Wire the bell in Layout — render**

Replace the bell's JSX — find:

```tsx
          <Tooltip title="Notifications">
            <Box sx={{ display: "flex", alignItems: "center", ml: 0.5, px: 0.5, ...CHROME_ICON_SX }}>
              <Badge badgeContent={unreadNotifications} color="error">
                <NotificationsIcon sx={{ color: "text.secondary" }} />
              </Badge>
            </Box>
          </Tooltip>
```

with:

```tsx
          <Tooltip title="Notifications">
            <IconButton onClick={handleBellClick} sx={{ ml: 0.5, ...CHROME_ICON_SX }}>
              <Badge badgeContent={unreadNotifications} color="error">
                <NotificationsIcon sx={{ color: "text.secondary" }} />
              </Badge>
            </IconButton>
          </Tooltip>
          {role !== "staff" && (
            <NotificationsPopover
              open={!!notifAnchorEl}
              anchorEl={notifAnchorEl}
              onClose={() => setNotifAnchorEl(null)}
              onReadStateChanged={() => setNotifRefreshKey((k) => k + 1)}
            />
          )}
```

- [ ] **Step 6: Type-check**

Run from `app/`:

```bash
npx tsc -b
```

Expected: no errors.

- [ ] **Step 7: Manual verification — Admin, Teacher, Student (popover)**

Start the dev server if it isn't running (`npm run dev` from `app/`). For each of the Admin, Teacher, and Student portals:

1. Log in and note the bell's badge count on first load.
2. Click the bell. Confirm a popover opens below it titled "Notifications", listing rows with a title, message, timestamp, and a `StatusChip` reading "Unread" or "Read" per row, most recent first.
3. Click an unread row. Confirm its chip flips to "Read" and the badge count in the AppBar decreases by 1 immediately (no page reload).
4. Click an already-read row. Confirm nothing changes (no-op).
5. Click "Mark all read". Confirm every row's chip becomes "Read" and the badge count drops to 0.
6. Click outside the popover. Confirm it closes. Reopen it and confirm the state (all read) persisted.

- [ ] **Step 8: Manual verification — Staff (existing page link)**

1. Log in as **Operations** (Staff). Note the bell's badge count.
2. Open `/staff/notifications` directly in another check (or note the page's own unread count via its rows) and confirm the bell's badge count matches the number of rows with `read: false` there — not the generic feed's count.
3. Click the bell. Confirm it navigates straight to `/staff/notifications` (the existing page) — no popover appears for this portal.
4. On that page, click "Mark all read", then navigate away and back to any other Staff page. Confirm the bell's badge count is now 0 (re-fetches on the role-scoped effect).

- [ ] **Step 9: Commit**

```bash
git add app/src/api/notifications.ts app/src/components/NotificationsPopover.tsx app/src/components/Layout.tsx
git commit -m "Wire up the notifications bell: popover for Admin/Teacher/Student, link to Staff's existing page, fix per-portal badge count"
```
