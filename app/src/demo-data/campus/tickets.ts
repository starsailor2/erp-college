import type { Ticket, TicketPriority, TicketStatus, SlaState } from "@/types";
import { campusLocations } from "@/demo-data/campus/assets";
import { createRng } from "@/demo-data/generators/random";

const { pick, weightedPick, randomInt } = createRng(74110302);

const maintenanceStaff = [
  "John Martinez", "IT Support Team", "Plumbing Team", "Priya Nambiar",
  "Ahmed Khan", "Grounds Crew",
];

const issuePool: { title: string; description: string }[] = [
  { title: "HVAC Failure - Server Room", description: "Main cooling unit making loud noises, temperature rising" },
  { title: "Projector Not Working", description: "Classroom projector won't turn on" },
  { title: "Wi-Fi Connectivity Issues", description: "Students reporting intermittent connectivity" },
  { title: "Leaking Faucet", description: "Washroom faucet continuously dripping" },
  { title: "Broken Chair", description: "Classroom chair leg is cracked and unsafe" },
  { title: "Power Outage", description: "Circuit breaker keeps tripping in the lab" },
  { title: "Elevator Malfunction", description: "Elevator stuck between floors intermittently" },
  { title: "Water Cooler Broken", description: "Water cooler not dispensing cold water" },
  { title: "Ceiling Fan Noise", description: "Fan makes rattling noise at high speed" },
  { title: "Door Lock Jammed", description: "Room door lock won't turn with the key" },
];

const createdLabels = ["10:42 AM", "09:15 AM", "Yesterday", "2 days ago", "3 days ago"];
const onTrackDetails = ["1h 30m remaining", "3h remaining", "45m remaining", "5h remaining"];
const breachedDetails = ["2h 15m overdue", "45m overdue", "1h 10m overdue", "4h overdue"];
const resolvedDetails = ["45m ahead", "2h 10m ahead", "1h ahead", "3h ahead"];

const priorities: [TicketPriority, number][] = [["critical", 8], ["high", 20], ["medium", 40], ["low", 32]];
const statuses: [TicketStatus, number][] = [["open", 20], ["in_progress", 32], ["resolved", 48]];

const TICKET_COUNT = 25;

function generateTickets(): Ticket[] {
  const list: Ticket[] = [];
  for (let i = 0; i < TICKET_COUNT; i++) {
    const issue = pick(issuePool);
    const status = weightedPick(statuses);
    const priority = weightedPick(priorities);
    const assignedTo = status === "open" ? null : pick(maintenanceStaff);
    let slaState: SlaState;
    let slaDetail: string;
    let resolutionHours: number | undefined;
    if (status === "resolved") {
      slaState = "resolved";
      slaDetail = pick(resolvedDetails);
      resolutionHours = randomInt(1, 8);
    } else {
      slaState = weightedPick([["on_track", 70], ["breached", 30]]);
      slaDetail = slaState === "breached" ? pick(breachedDetails) : pick(onTrackDetails);
    }
    list.push({
      id: `REQ-${2095 - i}`,
      title: issue.title,
      description: issue.description,
      location: pick(campusLocations),
      priority,
      assignedTo,
      status,
      createdLabel: pick(createdLabels),
      slaState,
      slaDetail,
      resolutionHours,
    });
  }
  return list;
}

export const tickets: Ticket[] = generateTickets();

export function getTicketById(id: string): Ticket | undefined {
  return tickets.find((t) => t.id === id);
}
