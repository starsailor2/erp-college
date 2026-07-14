import { simulateRequest } from "@/api/http";
import { tickets, getTicketById } from "@/demo-data/campus/tickets";
import type { Ticket } from "@/types";

export function getTickets(): Promise<Ticket[]> {
  return simulateRequest(tickets);
}

export function getTicketByIdAsync(id: string): Promise<Ticket | undefined> {
  return simulateRequest(getTicketById(id));
}

export function addTicket(entry: Ticket): Promise<Ticket> {
  tickets.unshift(entry);
  return simulateRequest(entry);
}

export function updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket | undefined> {
  const idx = tickets.findIndex((t) => t.id === id);
  if (idx !== -1) tickets[idx] = { ...tickets[idx], ...updates };
  return simulateRequest(tickets[idx]);
}
