import type { FeeLedgerEntry, FeeLedgerStatus } from "@/types";
import { students } from "@/demo-data/people/students";
import { getFeeStructureFor } from "@/demo-data/fees/feeStructure";
import { createRng } from "@/demo-data/generators/random";

const { weightedPick, randomInt } = createRng(90260716);

const statuses: [FeeLedgerStatus, number][] = [["paid", 88], ["pending", 10], ["overdue", 2]];

function generateFeeLedger(): FeeLedgerEntry[] {
  return students.map((s, i) => {
    const structure = getFeeStructureFor(s.program, s.year);
    const totalFee = structure?.total ?? 200000;
    const status = weightedPick(statuses);
    let paidAmount: number;
    if (status === "paid") {
      paidAmount = totalFee;
    } else if (status === "pending") {
      paidAmount = Math.round(totalFee * (randomInt(40, 80) / 100));
    } else {
      paidAmount = Math.round(totalFee * (randomInt(10, 50) / 100));
    }
    return {
      id: `LEDGER-${String(i + 1).padStart(4, "0")}`,
      studentId: s.id,
      totalFee,
      paidAmount,
      balance: totalFee - paidAmount,
      status,
    };
  });
}

export const feeLedger: FeeLedgerEntry[] = generateFeeLedger();

export function getFeeLedgerByStudent(studentId: string): FeeLedgerEntry | undefined {
  return feeLedger.find((e) => e.studentId === studentId);
}
