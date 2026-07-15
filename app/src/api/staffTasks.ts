import { simulateRequest } from "@/api/http";
import { tasks, nextTaskId } from "@/demo-data/staff/tasks";
import type { OpsTask } from "@/types";

function now(): string {
  return new Date().toISOString().slice(0, 10);
}

function findTask(id: string): OpsTask | undefined {
  return tasks.find((t) => t.id === id);
}

export function getTasks(): Promise<OpsTask[]> {
  return simulateRequest(tasks);
}

export function getTaskById(id: string): Promise<OpsTask | undefined> {
  return simulateRequest(findTask(id));
}

export function addTask(entry: Pick<OpsTask, "title" | "description" | "staffInstructions" | "priority" | "category" | "dueDate" | "estimatedHours">): Promise<OpsTask> {
  const task: OpsTask = {
    ...entry,
    id: nextTaskId(),
    status: "pending",
    assigneeId: null,
    createdAt: now(),
    needsHelp: false,
    timeline: [{ time: now(), action: "Task created" }],
  };
  tasks.unshift(task);
  return simulateRequest(task);
}

function assign(taskId: string, assigneeId: string, assigneeName: string, notes?: string) {
  const task = findTask(taskId);
  if (!task) return;
  task.assigneeId = assigneeId;
  task.timeline.push({ time: now(), action: `Assigned to ${assigneeName}` });
  if (notes) task.notes = notes;
}

export function quickAssign(taskId: string, assigneeId: string, assigneeName: string): Promise<void> {
  assign(taskId, assigneeId, assigneeName);
  return simulateRequest(undefined);
}

export function assignTask(taskId: string, assigneeId: string, assigneeName: string, notes?: string): Promise<void> {
  assign(taskId, assigneeId, assigneeName, notes);
  return simulateRequest(undefined);
}

export function approveTask(id: string): Promise<void> {
  const task = findTask(id);
  if (task) {
    task.approvalStatus = "approved";
    task.timeline.push({ time: now(), action: "Approved by supervisor" });
  }
  return simulateRequest(undefined);
}

export function rejectTask(id: string): Promise<void> {
  const task = findTask(id);
  if (task) {
    task.approvalStatus = "rejected";
    task.timeline.push({ time: now(), action: "Rejected by supervisor" });
  }
  return simulateRequest(undefined);
}

export function deleteTask(id: string): Promise<void> {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx !== -1) tasks.splice(idx, 1);
  return simulateRequest(undefined);
}

export function startTask(id: string): Promise<void> {
  const task = findTask(id);
  if (task) {
    task.status = "in_progress";
    task.timeline.push({ time: now(), action: "Started working on task" });
  }
  return simulateRequest(undefined);
}

export function completeTask(id: string): Promise<void> {
  const task = findTask(id);
  if (task) {
    task.status = "completed";
    task.completedAt = now();
    task.approvalStatus = "pending";
    task.timeline.push({ time: now(), action: "Marked as done, awaiting approval" });
  }
  return simulateRequest(undefined);
}

export function resolveHelpRequest(id: string): Promise<void> {
  const task = findTask(id);
  if (task) {
    task.needsHelp = false;
    task.timeline.push({ time: now(), action: "Help request resolved" });
  }
  return simulateRequest(undefined);
}

export function submitRequestHelp(id: string, reason: string): Promise<void> {
  const task = findTask(id);
  if (task) {
    task.needsHelp = true;
    task.helpNeededReason = reason;
    task.timeline.push({ time: now(), action: `Requested help: ${reason}` });
  }
  return simulateRequest(undefined);
}

export function submitCannotComplete(id: string, reason: string): Promise<void> {
  const task = findTask(id);
  if (task) {
    task.status = "cannot_complete";
    task.cannotCompleteReason = reason;
    task.timeline.push({ time: now(), action: "Marked as cannot complete" });
  }
  return simulateRequest(undefined);
}
