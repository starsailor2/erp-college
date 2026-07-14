import { useEffect, useState } from "react";
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, Typography, Paper, Grid, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getBooks, addBook, issueBook } from "@/api/books";
import { getLibraryTransactions, returnBook } from "@/api/libraryTransactions";
import { getStudentById } from "@/demo-data/people/students";
import type { Book, LibraryTransaction } from "@/types";

const categories = ["Computer Science", "Mathematics", "Physics", "Electronics", "General"];
const emptyForm = { title: "", author: "", isbn: "", category: categories[0], copies: 1 };

export default function Library() {
  const [books, setBooks] = useState<Book[]>([]);
  const [transactions, setTransactions] = useState<LibraryTransaction[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const loadBooks = () => getBooks().then(setBooks);
  const loadTransactions = () => getLibraryTransactions().then(setTransactions);
  useEffect(() => { loadBooks(); loadTransactions(); }, []);

  const filteredBooks = books.filter((b) =>
    (categoryFilter === "all" || b.category === categoryFilter) &&
    (statusFilter === "all" || b.status === statusFilter) &&
    (search === "" || b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddBook = () => {
    addBook({
      id: `BK${String(books.length + 1).padStart(3, "0")}`,
      title: form.title, author: form.author, isbn: form.isbn, category: form.category,
      status: "available", availableCopies: form.copies,
    }).then(loadBooks);
    setForm(emptyForm);
    setAddOpen(false);
  };

  const handleIssue = (book: Book) => {
    if (book.status !== "available") {
      setSnackbar(book.status === "issued" ? "Book is currently issued" : "Book is reserved");
      return;
    }
    issueBook(book.id).then(() => { loadBooks(); setSnackbar("Book issued successfully"); });
  };

  const handleReturn = (transactionId: string) => {
    returnBook(transactionId).then(() => { loadBooks(); loadTransactions(); setSnackbar("Book returned successfully"); });
  };

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Library Management"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Exporting Library Books... Download will start shortly.")}>Export</Button>
            <Button variant="contained" onClick={() => setAddOpen(true)}>Add Book</Button>
          </Stack>
        }
      />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Category</InputLabel>
          <Select label="Category" value={categoryFilter} onChange={(e: SelectChangeEvent) => setCategoryFilter(e.target.value)}>
            <MenuItem value="all">All Categories</MenuItem>
            {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}>
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="available">Available</MenuItem>
            <MenuItem value="issued">Issued</MenuItem>
            <MenuItem value="reserved">Reserved</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Search books, authors..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 260 }} />
      </Stack>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {filteredBooks.map((book) => (
          <Grid key={book.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Paper elevation={0} sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
              <MenuBookIcon sx={{ fontSize: 40, color: "text.disabled" }} />
              <Typography variant="subtitle2" fontWeight={600}>{book.title}</Typography>
              <Typography variant="caption" color="text.secondary">{book.author}</Typography>
              <Typography variant="caption" color="text.secondary">ISBN: {book.isbn}</Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <StatusChip status={book.status} />
                {book.status === "available" && <Typography variant="caption" color="text.secondary">({book.availableCopies} copies)</Typography>}
                <Typography variant="caption" color="text.secondary">{book.category}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mt: "auto", pt: 1 }}>
                <Button size="small" variant="contained" onClick={() => handleIssue(book)}>Issue</Button>
                <Button size="small" onClick={() => setSnackbar("Loading book details...")}>View</Button>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Recent Issues & Returns</Typography>
      <DataTable<LibraryTransaction>
        pagination
        columns={[
          { key: "id", label: "Transaction ID" },
          {
            key: "student", label: "Student",
            render: (row) => {
              const student = getStudentById(row.studentId);
              return student ? `${student.name} (${student.rollNo})` : row.studentId;
            },
          },
          {
            key: "book", label: "Book",
            render: (row) => books.find((b) => b.id === row.bookId)?.title ?? row.bookId,
          },
          { key: "issueDate", label: "Issue Date" },
          { key: "dueDate", label: "Due Date" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          {
            key: "actions", label: "Actions",
            render: (row) => <Button size="small" disabled={row.status === "returned"} onClick={() => handleReturn(row.id)}>Return</Button>,
          },
        ]}
        rows={transactions}
        emptyTitle="No transactions found"
      />

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Book</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
          <TextField label="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} fullWidth />
          <TextField label="ISBN" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select label="Category" value={form.category} onChange={(e: SelectChangeEvent) => setForm({ ...form, category: e.target.value })}>
              {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Copies" type="number" value={form.copies} onChange={(e) => setForm({ ...form, copies: Number(e.target.value) })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddBook}>Add Book</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
