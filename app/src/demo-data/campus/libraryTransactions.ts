import type { LibraryTransaction, LibraryTransactionStatus } from "@/types";
import { students } from "@/demo-data/people/students";
import { books } from "@/demo-data/campus/books";
import { createRng } from "@/demo-data/generators/random";

const { pick, randomInt, weightedPick } = createRng(74110304);

const statuses: [LibraryTransactionStatus, number][] = [["active", 45], ["overdue", 15], ["returned", 40]];

const TRANSACTION_COUNT = 20;

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function generateTransactions(): LibraryTransaction[] {
  const list: LibraryTransaction[] = [];
  for (let i = 0; i < TRANSACTION_COUNT; i++) {
    const student = pick(students);
    const book = pick(books);
    const status = weightedPick(statuses);
    const issueMonth = randomInt(1, 6);
    const issueDate = dateStr(2026, issueMonth, randomInt(1, 28));
    const dueMonth = issueMonth === 12 ? 1 : issueMonth + 1;
    const dueDate = dateStr(issueMonth === 12 ? 2027 : 2026, dueMonth, randomInt(1, 28));
    list.push({
      id: `LIB-${1200 + i}`,
      studentId: student.id,
      bookId: book.id,
      issueDate,
      dueDate,
      status,
    });
  }
  return list;
}

export const libraryTransactions: LibraryTransaction[] = generateTransactions();
