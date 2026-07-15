import { getLibraryTransactions } from "@/api/libraryTransactions";
import { getBooks } from "@/api/books";
import { getStudents } from "@/api/students";
import type { CommandResult, CommandTableRow, IntentDefinition } from "@/command-center/types";

function isOverdueBooksQuery(queryLower: string): boolean {
  return (queryLower.includes("book") || queryLower.includes("library")) && queryLower.includes("overdue");
}

async function executeOverdueBooksQuery(): Promise<CommandResult> {
  const [transactions, books, students] = await Promise.all([getLibraryTransactions(), getBooks(), getStudents()]);
  const bookById = new Map(books.map((b) => [b.id, b]));
  const studentById = new Map(students.map((s) => [s.id, s]));
  const overdue = transactions.filter((t) => t.status === "overdue");

  const rows: CommandTableRow[] = overdue.slice(0, 8).map((t) => ({
    id: t.id,
    path: "/admin/library",
    title: bookById.get(t.bookId)?.title ?? t.bookId,
    student: studentById.get(t.studentId)?.name ?? t.studentId,
    dueDate: t.dueDate,
  }));

  return {
    kind: "record-table",
    summary: `${overdue.length} book${overdue.length === 1 ? " is" : "s are"} overdue.`,
    columns: [
      { key: "title", label: "Book" },
      { key: "student", label: "Borrower" },
      { key: "dueDate", label: "Due Date" },
    ],
    rows,
    viewAllPath: "/admin/library",
    viewAllLabel: "View library management",
  };
}

const overdueBooksIntent: IntentDefinition = {
  id: "library-overdue-books",
  matches: isOverdueBooksQuery,
  execute: executeOverdueBooksQuery,
};

export const libraryIntents: IntentDefinition[] = [overdueBooksIntent];
