import { simulateRequest } from "@/api/http";
import { feeSemesterRows, paymentTransactions, feeLedgerEntries } from "@/demo-data/student/fees";
import type { FeeSemesterRow, PaymentTransaction, StudentFeeLedgerEntry } from "@/types";

export function getFeeSummary(): Promise<FeeSemesterRow[]> {
  return simulateRequest(feeSemesterRows);
}

export function getPaymentTransactions(): Promise<PaymentTransaction[]> {
  return simulateRequest(paymentTransactions);
}

export function getFeeLedger(): Promise<StudentFeeLedgerEntry[]> {
  return simulateRequest(feeLedgerEntries);
}

export function makePayment(semester: number, amount: number, description: string): Promise<void> {
  const row = feeSemesterRows.find((r) => r.semester === semester);
  if (row) {
    row.paid += amount;
    row.status = row.paid >= row.totalFee ? "paid" : "pending";
  }
  const now = new Date().toISOString().slice(0, 10);
  paymentTransactions.unshift({
    id: `TXN${now.replace(/-/g, "")}${Math.floor(Math.random() * 900 + 100)}`,
    description,
    amount,
    date: now,
    mode: "Net Banking",
    status: "success",
  });
  const lastBalance = feeLedgerEntries[feeLedgerEntries.length - 1]?.balance ?? 0;
  feeLedgerEntries.push({ date: now, particulars: "Payment Received", debit: 0, credit: amount, balance: Math.max(0, lastBalance - amount) });
  return simulateRequest(undefined);
}
