import type { Payment, PaymentMode, PaymentStatus } from "@/types";
import { feeLedger } from "@/demo-data/fees/feeLedger";
import { createRng } from "@/demo-data/generators/random";

const { pick, randomInt, weightedPick } = createRng(90260717);

const modes: [PaymentMode, number][] = [["online", 6], ["cash", 2], ["cheque", 1], ["dd", 1]];

const PAYMENT_COUNT = 40;

function generatePayments(): Payment[] {
  const payers = feeLedger.filter((e) => e.paidAmount > 0);

  const list: Payment[] = [];
  for (let i = 0; i < PAYMENT_COUNT; i++) {
    const entry = pick(payers);
    const mode = weightedPick(modes);
    const status: PaymentStatus = mode === "cheque" ? weightedPick([["verified", 5], ["pending_clearance", 3]]) : "verified";
    const day = randomInt(1, 28);
    list.push({
      id: `REC-2026-${1800 + i}`,
      date: `2026-12-${String(day).padStart(2, "0")}`,
      studentId: entry.studentId,
      amount: randomInt(15000, 250000),
      mode,
      status,
    });
  }
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

export const payments: Payment[] = generatePayments();
