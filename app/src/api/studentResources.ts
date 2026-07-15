import { simulateRequest } from "@/api/http";
import { facilityCatalog, equipmentCatalog, resourceBookings, nextBookingId } from "@/demo-data/student/resources";
import type { ResourceBooking } from "@/types";

export function getFacilityCatalog(): Promise<string[]> {
  return simulateRequest(facilityCatalog);
}

export function getEquipmentCatalog(): Promise<string[]> {
  return simulateRequest(equipmentCatalog);
}

export function getResourceBookings(): Promise<ResourceBooking[]> {
  return simulateRequest(resourceBookings);
}

export function bookResource(resourceName: string, date: string, timeSlot: string, purpose: string): Promise<ResourceBooking> {
  const booking: ResourceBooking = { id: nextBookingId(), resourceName, date, timeSlot, purpose, status: "confirmed" };
  resourceBookings.unshift(booking);
  return simulateRequest(booking);
}
