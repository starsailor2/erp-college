import { getTickets } from "@/api/tickets";
import StatusChip from "@/components/StatusChip";
import type { CommandResult, CommandTableRow, IntentDefinition } from "@/command-center/types";
import type { Ticket } from "@/types";

function mentionsTickets(queryLower: string): boolean {
  return queryLower.includes("ticket");
}

function buildTicketRows(tickets: Ticket[]): CommandTableRow[] {
  return tickets.slice(0, 8).map((t) => ({
    id: t.id,
    path: `/admin/tickets/${t.id}`,
    title: t.title,
    location: t.location,
    priority: <StatusChip status={t.priority} />,
    status: <StatusChip status={t.status} />,
  }));
}

const TICKET_COLUMNS = [
  { key: "title", label: "Issue" },
  { key: "location", label: "Location" },
  { key: "priority", label: "Priority" },
  { key: "status", label: "Status" },
];

function isCriticalTicketsQuery(queryLower: string): boolean {
  return mentionsTickets(queryLower) && queryLower.includes("critical");
}

async function executeCriticalTicketsQuery(): Promise<CommandResult> {
  const tickets = await getTickets();
  const critical = tickets.filter((t) => t.priority === "critical" && t.status !== "resolved");

  return {
    kind: "record-table",
    summary: `${critical.length} critical ticket${critical.length === 1 ? "" : "s"} open.`,
    columns: TICKET_COLUMNS,
    rows: buildTicketRows(critical),
    viewAllPath: "/admin/tickets",
    viewAllLabel: "View all tickets",
  };
}

const criticalTicketsIntent: IntentDefinition = {
  id: "tickets-critical",
  matches: isCriticalTicketsQuery,
  execute: executeCriticalTicketsQuery,
};

function isSlaBreachQuery(queryLower: string): boolean {
  return mentionsTickets(queryLower) && (queryLower.includes("sla") || queryLower.includes("breach"));
}

async function executeSlaBreachQuery(): Promise<CommandResult> {
  const tickets = await getTickets();
  const breached = tickets.filter((t) => t.slaState === "breached");

  return {
    kind: "record-table",
    summary: `${breached.length} ticket${breached.length === 1 ? "" : "s"} breaching SLA.`,
    columns: TICKET_COLUMNS,
    rows: buildTicketRows(breached),
    viewAllPath: "/admin/tickets",
    viewAllLabel: "View all tickets",
  };
}

const slaBreachIntent: IntentDefinition = { id: "tickets-sla-breach", matches: isSlaBreachQuery, execute: executeSlaBreachQuery };

function isOpenTicketsQuery(queryLower: string): boolean {
  return mentionsTickets(queryLower) && (queryLower.includes("open") || queryLower.includes("pending"));
}

async function executeOpenTicketsQuery(): Promise<CommandResult> {
  const tickets = await getTickets();
  const open = tickets.filter((t) => t.status !== "resolved");

  return {
    kind: "record-table",
    summary: `${open.length} ticket${open.length === 1 ? "" : "s"} open.`,
    columns: TICKET_COLUMNS,
    rows: buildTicketRows(open),
    viewAllPath: "/admin/tickets",
    viewAllLabel: "View all tickets",
  };
}

const openTicketsIntent: IntentDefinition = { id: "tickets-open", matches: isOpenTicketsQuery, execute: executeOpenTicketsQuery };

export const ticketIntents: IntentDefinition[] = [criticalTicketsIntent, slaBreachIntent, openTicketsIntent];
