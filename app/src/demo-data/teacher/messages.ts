import type { MessageContact, Message } from "@/types";

export const messageContacts: MessageContact[] = [
  { id: "MC-1", name: "Prof. Anjali Sharma", role: "HOD" },
  { id: "MC-2", name: "Prof. Vikram Singh", role: "Dean" },
  { id: "MC-3", name: "Library Admin", role: "Library" },
];

export const messages: Message[] = [
  { id: "MSG-1", contactId: "MC-1", fromMe: false, text: "Can you share the CS201 attendance summary by Friday?", timestamp: "2026-07-10 09:15" },
  { id: "MSG-2", contactId: "MC-1", fromMe: true, text: "Sure, I'll have it ready by Thursday evening.", timestamp: "2026-07-10 09:20" },
  { id: "MSG-3", contactId: "MC-2", fromMe: false, text: "Please review the escalated leave request when you get a chance.", timestamp: "2026-07-08 14:00" },
  { id: "MSG-4", contactId: "MC-2", fromMe: true, text: "Reviewing it now, will respond today.", timestamp: "2026-07-08 14:30" },
  { id: "MSG-5", contactId: "MC-3", fromMe: false, text: "Your requested books have arrived and are ready for pickup.", timestamp: "2026-07-05 11:00" },
];

export function getMessagesFor(contactId: string): Message[] {
  return messages.filter((m) => m.contactId === contactId);
}
