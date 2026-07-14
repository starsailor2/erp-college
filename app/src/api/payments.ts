import { simulateRequest } from "@/api/http";
import { payments } from "@/demo-data/fees/payments";
import type { Payment } from "@/types";

export function getPayments(): Promise<Payment[]> {
  return simulateRequest(payments);
}
