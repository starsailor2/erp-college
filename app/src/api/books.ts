import { simulateRequest } from "@/api/http";
import { books, getBookById } from "@/demo-data/campus/books";
import type { Book } from "@/types";

export function getBooks(): Promise<Book[]> {
  return simulateRequest(books);
}

export function addBook(entry: Book): Promise<Book> {
  books.unshift(entry);
  return simulateRequest(entry);
}

export function issueBook(bookId: string): Promise<Book | undefined> {
  const book = getBookById(bookId);
  if (book && book.availableCopies > 0) {
    book.availableCopies -= 1;
    if (book.availableCopies === 0) book.status = "issued";
  }
  return simulateRequest(book);
}
