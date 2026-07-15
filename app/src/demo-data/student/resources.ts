import type { ResourceBooking } from "@/types";

export const facilityCatalog = ["Auditorium", "Conference Room", "Computer Lab", "Sports Complex"];
export const equipmentCatalog = ["Projector", "Laptop", "Camera", "Sound System"];

export const resourceBookings: ResourceBooking[] = [
  { id: "RB-001", resourceName: "Computer Lab", date: "2026-07-18", timeSlot: "10:00 - 12:00", purpose: "Group project work", status: "confirmed" },
];

export function nextBookingId(): string {
  const max = resourceBookings.reduce((m, b) => Math.max(m, Number(b.id.split("-")[1])), 0);
  return `RB-${String(max + 1).padStart(3, "0")}`;
}
