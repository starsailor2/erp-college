import { getHostelStats } from "@/api/hostelStats";
import type { CommandResult, IntentDefinition } from "@/command-center/types";

function isHostelOccupancyQuery(queryLower: string): boolean {
  const occupancyWords = ["occupancy", "occupied", "vacant", "available", "rooms", "beds"];
  return queryLower.includes("hostel") && occupancyWords.some((w) => queryLower.includes(w));
}

async function executeHostelOccupancyQuery(): Promise<CommandResult> {
  const stats = await getHostelStats();
  const occupancyPct = Math.round((stats.occupied / stats.totalBeds) * 1000) / 10;

  return {
    kind: "stat-answer",
    summary: `${stats.occupied} of ${stats.totalBeds} hostel beds are occupied (${occupancyPct}%).`,
    note: `${stats.available} beds available, ${stats.maintenance} under maintenance.`,
    actionPath: "/admin/hostel",
    actionLabel: "View Hostel Management",
  };
}

const hostelOccupancyIntent: IntentDefinition = {
  id: "hostel-occupancy",
  matches: isHostelOccupancyQuery,
  execute: executeHostelOccupancyQuery,
};

export const hostelIntents: IntentDefinition[] = [hostelOccupancyIntent];
