import { simulateRequest } from "@/api/http";
import { studentMessages, nextMessageId } from "@/demo-data/student/messages";
import type { StudentMessage } from "@/types";

export function getStudentMessages(): Promise<StudentMessage[]> {
  return simulateRequest(studentMessages);
}

export function markMessageRead(id: string): Promise<void> {
  const row = studentMessages.find((m) => m.id === id);
  if (row) row.read = true;
  return simulateRequest(undefined);
}

export function sendStudentMessage(recipient: string, subject: string, category: string, body: string): Promise<StudentMessage> {
  const message: StudentMessage = { id: nextMessageId(), from: `You (to ${recipient})`, subject, category, timeAgo: "just now", body, read: true };
  studentMessages.unshift(message);
  return simulateRequest(message);
}
