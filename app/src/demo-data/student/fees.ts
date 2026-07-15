import type { FeeSemesterRow, PaymentTransaction, StudentFeeLedgerEntry } from "@/types";

export const feeSemesterRows: FeeSemesterRow[] = [
  { semester: 4, year: "2025", totalFee: 125000, paid: 125000, dueDate: "2025-01-15", status: "paid" },
  { semester: 5, year: "2025", totalFee: 125000, paid: 125000, dueDate: "2025-07-15", status: "paid" },
  { semester: 6, year: "2026", totalFee: 130000, paid: 130000, dueDate: "2026-01-15", status: "paid" },
  { semester: 7, year: "2026", totalFee: 130000, paid: 0, dueDate: "2026-08-15", status: "pending" },
];

export const paymentTransactions: PaymentTransaction[] = [
  { id: "TXN20260110", description: "Semester 6 Fee", amount: 130000, date: "2026-01-10", mode: "Net Banking", status: "success" },
  { id: "TXN20250705", description: "Semester 5 Fee", amount: 125000, date: "2025-07-05", mode: "UPI", status: "success" },
  { id: "TXN20250110", description: "Semester 4 Fee", amount: 125000, date: "2025-01-10", mode: "Credit Card", status: "success" },
];

export const feeLedgerEntries: StudentFeeLedgerEntry[] = [
  { date: "2025-01-10", particulars: "Semester 4 Fee Due", debit: 125000, credit: 0, balance: 125000 },
  { date: "2025-01-10", particulars: "Payment Received", debit: 0, credit: 125000, balance: 0 },
  { date: "2025-07-05", particulars: "Semester 5 Fee Due", debit: 125000, credit: 0, balance: 125000 },
  { date: "2025-07-05", particulars: "Payment Received", debit: 0, credit: 125000, balance: 0 },
  { date: "2026-01-10", particulars: "Semester 6 Fee Due", debit: 130000, credit: 0, balance: 130000 },
  { date: "2026-01-10", particulars: "Payment Received", debit: 0, credit: 130000, balance: 0 },
  { date: "2026-07-01", particulars: "Semester 7 Fee Due", debit: 130000, credit: 0, balance: 130000 },
];
