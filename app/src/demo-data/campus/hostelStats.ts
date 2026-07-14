import type { HostelStats } from "@/types";

export const hostelBlocks = ["Boys Hostel A", "Boys Hostel B", "Girls Hostel A"];
export const hostelRooms = ["101", "102", "103"];
export const hostelBeds = ["Bed 1", "Bed 2"];

export const hostelStats: HostelStats = {
  totalBeds: 918,
  occupied: 845,
  available: 73,
  maintenance: 18,
};
