import type { FacilityStats } from "@/types";

export const facilitiesList = ["Auditorium", "Conference Room A", "Sports Complex"];
export const bookingTimeSlots = ["09:00 AM - 12:00 PM", "02:00 PM - 05:00 PM", "Full Day"];

export const facilityStats: FacilityStats = {
  todayBookings: 24,
  auditoriumUtilizationPct: 85,
  sportsUtilizationPct: 72,
  pendingApprovals: 8,
};
