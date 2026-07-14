import { simulateRequest } from "@/api/http";
import { libraryTransactions } from "@/demo-data/campus/libraryTransactions";
import { getBookById } from "@/demo-data/campus/books";
import type { LibraryTransaction } from "@/types";

export function getLibraryTransactions(): Promise<LibraryTransaction[]> {
  return simulateRequest(libraryTransactions);
}

export function returnBook(transactionId: string): Promise<LibraryTransaction | undefined> {
  const transaction = libraryTransactions.find((t) => t.id === transactionId);
  if (transaction && transaction.status !== "returned") {
    transaction.status = "returned";
    const book = getBookById(transaction.bookId);
    if (book) {
      book.availableCopies += 1;
      if (book.status === "issued") book.status = "available";
    }
  }
  return simulateRequest(transaction);
}
