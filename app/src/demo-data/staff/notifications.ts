import type { OpsNotification } from "@/types";

export const opsNotifications: OpsNotification[] = [
  { id: "ON-001", message: "New task assigned: Fix leaking faucet in Room 204", read: false, time: "2026-07-10", taskId: "OT-001" },
  { id: "ON-002", message: "Task completed, awaiting approval: Restock cleaning supplies - Building B", read: false, time: "2026-07-13", taskId: "OT-003" },
  { id: "ON-003", message: "Help requested on: Replenish first-aid kits across campus", read: false, time: "2026-07-15", taskId: "OT-009" },
  { id: "ON-004", message: "Task marked as cannot complete: Deep clean cafeteria kitchen", read: true, time: "2026-07-12", taskId: "OT-008" },
  { id: "ON-005", message: "Task approved: Prepare monthly security report", read: true, time: "2026-07-10", taskId: "OT-007" },
  { id: "ON-006", message: "Task rejected: Replace exhaust fan in server room", read: false, time: "2026-07-11", taskId: "OT-013" },
  { id: "ON-007", message: "Help requested on: Set up projector for auditorium event", read: false, time: "2026-07-15", taskId: "OT-015" },
];
