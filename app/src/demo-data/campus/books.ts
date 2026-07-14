import type { Book, BookStatus } from "@/types";
import { createRng } from "@/demo-data/generators/random";

const { randomInt } = createRng(74110303);

const seedBooks: { title: string; author: string; isbn: string; category: string; status: BookStatus }[] = [
  { title: "Data Structures & Algorithms", author: "Thomas H. Cormen, Charles E. Leiserson", isbn: "978-0262033848", category: "Computer Science", status: "available" },
  { title: "Operating System Concepts", author: "Abraham Silberschatz, Peter B. Galvin", isbn: "978-1118063330", category: "Computer Science", status: "issued" },
  { title: "Computer Networks", author: "Andrew S. Tanenbaum, David J. Wetherall", isbn: "978-0132126953", category: "Computer Science", status: "available" },
  { title: "Database System Concepts", author: "Henry F. Korth, S. Sudarshan", isbn: "978-0073523323", category: "Computer Science", status: "available" },
  { title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell, Peter Norvig", isbn: "978-0136042594", category: "Computer Science", status: "available" },
  { title: "Linear Algebra and Its Applications", author: "Gilbert Strang", isbn: "978-0030105678", category: "Mathematics", status: "reserved" },
  { title: "Introduction to Algorithms", author: "Ronald L. Rivest, Clifford Stein", isbn: "978-0262046305", category: "Computer Science", status: "available" },
  { title: "Compilers: Principles, Techniques, and Tools", author: "Alfred V. Aho, Jeffrey D. Ullman", isbn: "978-0321486813", category: "Computer Science", status: "issued" },
  { title: "Computer Organization and Design", author: "David A. Patterson, John L. Hennessy", isbn: "978-0124077263", category: "Computer Science", status: "available" },
  { title: "Discrete Mathematics and Its Applications", author: "Kenneth H. Rosen", isbn: "978-0073383095", category: "Mathematics", status: "available" },
  { title: "Calculus: Early Transcendentals", author: "James Stewart", isbn: "978-1285741550", category: "Mathematics", status: "available" },
  { title: "Probability and Statistics for Engineers", author: "Ronald E. Walpole", isbn: "978-0321629111", category: "Mathematics", status: "issued" },
  { title: "Introduction to Electrodynamics", author: "David J. Griffiths", isbn: "978-0321856562", category: "Physics", status: "available" },
  { title: "University Physics", author: "Hugh D. Young, Roger A. Freedman", isbn: "978-0133969290", category: "Physics", status: "available" },
  { title: "Concepts of Modern Physics", author: "Arthur Beiser", isbn: "978-0072448481", category: "Physics", status: "reserved" },
  { title: "Quantum Mechanics: Concepts and Applications", author: "Nouredine Zettili", isbn: "978-1119855231", category: "Physics", status: "available" },
  { title: "Microelectronic Circuits", author: "Adel S. Sedra, Kenneth C. Smith", isbn: "978-0199339136", category: "Electronics", status: "available" },
  { title: "Digital Design", author: "M. Morris Mano, Michael D. Ciletti", isbn: "978-0132774208", category: "Electronics", status: "issued" },
  { title: "Electronic Devices and Circuit Theory", author: "Robert L. Boylestad", isbn: "978-0133923605", category: "Electronics", status: "available" },
  { title: "Signals and Systems", author: "Alan V. Oppenheim, Alan S. Willsky", isbn: "978-0138147570", category: "Electronics", status: "available" },
  { title: "A Brief History of Time", author: "Stephen Hawking", isbn: "978-0553380163", category: "General", status: "available" },
  { title: "The Elements of Style", author: "William Strunk Jr., E. B. White", isbn: "978-0205309023", category: "General", status: "available" },
  { title: "Sapiens: A Brief History of Humankind", author: "Yuval Noah Harari", isbn: "978-0062316097", category: "General", status: "issued" },
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", isbn: "978-0374533557", category: "General", status: "available" },
];

function generateBooks(): Book[] {
  return seedBooks.map((b, i) => ({
    id: `BK${String(i + 1).padStart(3, "0")}`,
    title: b.title,
    author: b.author,
    isbn: b.isbn,
    category: b.category,
    status: b.status,
    availableCopies: b.status === "available" ? randomInt(1, 6) : 0,
  }));
}

export const books: Book[] = generateBooks();

export function getBookById(id: string): Book | undefined {
  return books.find((b) => b.id === id);
}
