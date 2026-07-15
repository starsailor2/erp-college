import { simulateRequest } from "@/api/http";
import { messageContacts, messages, getMessagesFor } from "@/demo-data/teacher/messages";
import type { MessageContact, Message } from "@/types";

export function getMessageContacts(): Promise<MessageContact[]> {
  return simulateRequest(messageContacts);
}

export function getMessagesForContact(contactId: string): Promise<Message[]> {
  return simulateRequest(getMessagesFor(contactId));
}

export function sendMessage(contactId: string, text: string): Promise<Message> {
  const entry: Message = { id: `MSG-${messages.length + 1}`, contactId, fromMe: true, text, timestamp: new Date().toISOString().slice(0, 16).replace("T", " ") };
  messages.push(entry);
  return simulateRequest(entry);
}
