import { simulateRequest } from "@/api/http";
import { feeStructure, getFeeStructureById } from "@/demo-data/fees/feeStructure";
import type { FeeStructureItem } from "@/types";

export function getFeeStructure(): Promise<FeeStructureItem[]> {
  return simulateRequest(feeStructure);
}

export function getFeeStructureByIdAsync(id: string): Promise<FeeStructureItem | undefined> {
  return simulateRequest(getFeeStructureById(id));
}

export function addFeeStructure(entry: FeeStructureItem): Promise<FeeStructureItem> {
  feeStructure.unshift(entry);
  return simulateRequest(entry);
}

export function updateFeeStructure(id: string, updates: Partial<FeeStructureItem>): Promise<FeeStructureItem | undefined> {
  const idx = feeStructure.findIndex((f) => f.id === id);
  if (idx !== -1) feeStructure[idx] = { ...feeStructure[idx], ...updates };
  return simulateRequest(feeStructure[idx]);
}
