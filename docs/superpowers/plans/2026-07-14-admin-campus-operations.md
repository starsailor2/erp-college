# Admin Campus Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 1d of the Admin portal — Assets, Tickets, Hostel, Facility, Library — and add an "Operations" sidebar group between Academics and Finance.

**Architecture:** Same as Phase 1a/1b/1c: demo-data generator modules → thin `api/*.ts` Promise wrappers → page components that fetch via the API layer. Two pages (Assets, Tickets) get a per-record profile route, mirroring Phase 1a's Course/Student profile pattern.

**Tech Stack:** Same as Phase 0/1a/1b/1c — no new dependencies.

## Global Constraints

- All new pages live under `app/src/pages/admin/`; all new demo-data under `app/src/demo-data/campus/`; all new API modules under `app/src/api/`. (Every path below is relative to `app/`.)
- Filters/search must actually filter (client-side, over the in-memory array/state).
- Asset Edit and Asset/Ticket "View" show the clicked record's own data — never a fixed hardcoded sample (same fix as every prior phase).
- Functional mutations only where a real list or counter already exists in the source to attach them to: Allocate Room / New Booking move Hostel/Facility's real KPI counters; Mark Resolved flips a real ticket's status; Issue/Return move a real book's copy count and the real transactions table. "Assign Staff"/"Assign Technician"/"Transfer Asset"/book "View" stay stub `Snackbar` notifications — the source has no staff-picker or per-book detail UI to hook a real mutation into.
- Demo data scale: assets = 30 rows; tickets = 25 rows; books = 24 rows; library transactions = 20 rows. Hostel/Facility stats are single objects, not arrays.
- Currency formatting (Assets' Value field): values ≥ ₹1,00,00,000 show as `₹X.X Cr`; values ≥ ₹1,00,000 show as `₹X.X L`; smaller values show as a plain `₹`-prefixed number with Indian digit grouping (`toLocaleString("en-IN")`). Local `formatINR` helper per page, no shared utils module (consistent with prior phases).
- All dates are ISO `YYYY-MM-DD` strings displayed directly (no prose month-name formatting), consistent with Phase 1c's Payments/Fee Ledger convention.

---

### Task 1: Type definitions

**Files:**
- Modify: `src/types/index.ts`

**Interfaces:**
- Produces: `Asset`, `AssetCondition`, `AssetStatus`, `MaintenanceRecord`, `Ticket`, `TicketPriority`, `TicketStatus`, `SlaState`, `HostelStats`, `FacilityStats`, `Book`, `BookStatus`, `LibraryTransaction`, `LibraryTransactionStatus` — consumed by every task below.

- [ ] **Step 1: Append the Campus-Operations types to `src/types/index.ts`**

Add at the end of the existing file:

```ts

// --- Admin / Campus Operations (Phase 1d) ---

export type AssetCondition = "excellent" | "good" | "fair" | "poor";
export type AssetStatus = "active" | "maintenance" | "retired";
export interface MaintenanceRecord {
  title: string;
  date: string;
}
export interface Asset {
  id: string; // "AST-2024-001"
  name: string; // e.g. "Dell Latitude 5420 Laptop"
  type: string; // e.g. "Projector", "Computer", "Furniture"
  location: string;
  condition: AssetCondition;
  status: AssetStatus;
  lastMaintenance: string;
  value: number;
  purchaseDate: string;
  maintenanceHistory: MaintenanceRecord[];
}

export type TicketPriority = "critical" | "high" | "medium" | "low";
export type TicketStatus = "open" | "in_progress" | "resolved";
export type SlaState = "on_track" | "breached" | "resolved";
export interface Ticket {
  id: string; // "REQ-2095"
  title: string;
  description: string;
  location: string;
  priority: TicketPriority;
  assignedTo: string | null;
  status: TicketStatus;
  createdLabel: string; // e.g. "10:42 AM", "Yesterday"
  slaState: SlaState;
  slaDetail: string; // e.g. "2h 15m overdue", "1h 30m remaining", "45m ahead"
  resolutionHours?: number; // set only once status is "resolved"
}

export interface HostelStats {
  totalBeds: number;
  occupied: number;
  available: number;
  maintenance: number;
}

export interface FacilityStats {
  todayBookings: number;
  auditoriumUtilizationPct: number;
  sportsUtilizationPct: number;
  pendingApprovals: number;
}

export type BookStatus = "available" | "issued" | "reserved";
export interface Book {
  id: string; // "BK001"
  title: string;
  author: string;
  isbn: string;
  category: string;
  status: BookStatus;
  availableCopies: number;
}

export type LibraryTransactionStatus = "active" | "overdue" | "returned";
export interface LibraryTransaction {
  id: string; // "LIB-1234"
  studentId: string;
  bookId: string;
  issueDate: string;
  dueDate: string;
  status: LibraryTransactionStatus;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "Add Admin/Campus-Operations type definitions"
```

---

### Task 2: Assets demo data + API

**Files:**
- Create: `src/demo-data/campus/assets.ts`
- Create: `src/api/assets.ts`

**Interfaces:**
- Consumes: `Asset`, `AssetCondition`, `AssetStatus` from `@/types` (Task 1); `createRng` from `@/demo-data/generators/random`.
- Produces: `assets: Asset[]`, `campusLocations: string[]`, `getAssetById(id): Asset | undefined` from `assets.ts`; `getAssets(): Promise<Asset[]>`, `getAssetByIdAsync(id): Promise<Asset | undefined>`, `addAsset(entry): Promise<Asset>`, `updateAsset(id, updates): Promise<Asset | undefined>` from `api/assets.ts` — `campusLocations` also used by Task 3's tickets generator and Task 9's Assets page; the rest used by Tasks 9–10.

- [ ] **Step 1: Create `src/demo-data/campus/assets.ts`**

```ts
import type { Asset, AssetCondition, AssetStatus } from "@/types";
import { createRng } from "@/demo-data/generators/random";

const { pick, randomInt, weightedPick } = createRng(74110301);

export const campusLocations = [
  "Block A, Room 101", "Block A, Room 205", "Block B, Lab 3", "Block B, Physics Lab",
  "Block C, Room 110", "Block D, Workshop", "Library, Floor 1", "Library, Floor 2",
  "Library, Floor 3", "Admin Office", "Hostel Block A", "Hostel Block C",
  "Sports Complex", "Auditorium", "IT Building, B2",
];

const assetTypes = [
  "Projector", "Computer", "Printer", "Furniture", "Lab Equipment",
  "Whiteboard", "Router", "Air Conditioner", "Photocopier", "Scanner",
];

const namesByType: Record<string, string[]> = {
  Projector: ["Epson EB-X06 Projector", "BenQ MX550 Projector"],
  Computer: ["Dell OptiPlex 7090 Desktop", "HP EliteDesk 800 Desktop", "Dell Latitude 5420 Laptop"],
  Printer: ["HP LaserJet Pro M404", "Canon imageCLASS MF445dw"],
  Furniture: ["Wooden Study Table", "Steel Bookshelf", "Classroom Chair Set"],
  "Lab Equipment": ["Digital Oscilloscope", "Microscope Set", "Spectrometer"],
  Whiteboard: ["Interactive Smart Whiteboard", "Magnetic Whiteboard"],
  Router: ["Cisco Catalyst Router", "TP-Link Enterprise Router"],
  "Air Conditioner": ["Voltas 1.5T Split AC", "Daikin Split AC"],
  Photocopier: ["Xerox WorkCentre 5945", "Ricoh MP 2555"],
  Scanner: ["Canon DR-C225 Scanner", "Epson WorkForce Scanner"],
};

const baseValueByType: Record<string, number> = {
  Projector: 25000, Computer: 55000, Printer: 15000, Furniture: 8000,
  "Lab Equipment": 60000, Whiteboard: 12000, Router: 20000,
  "Air Conditioner": 35000, Photocopier: 70000, Scanner: 18000,
};

const maintenanceTitles = [
  "Routine Checkup", "Filter Replacement", "Software Update",
  "Battery Replacement", "Screen Repair", "Hardware Diagnostic",
  "Parts Replacement", "Calibration Check",
];

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const conditions: [AssetCondition, number][] = [["good", 55], ["excellent", 15], ["fair", 22], ["poor", 8]];
const statuses: [AssetStatus, number][] = [["active", 78], ["maintenance", 15], ["retired", 7]];

const ASSET_COUNT = 30;

function generateAssets(): Asset[] {
  const list: Asset[] = [];
  for (let i = 1; i <= ASSET_COUNT; i++) {
    const type = pick(assetTypes);
    const purchaseYear = 2026 - randomInt(1, 4);
    const historyCount = randomInt(1, 3);
    const maintenanceHistory = Array.from({ length: historyCount }, () => ({
      title: pick(maintenanceTitles),
      date: dateStr(randomInt(2025, 2026), randomInt(1, 12), randomInt(1, 28)),
    }));
    list.push({
      id: `AST-2024-${String(i).padStart(3, "0")}`,
      name: pick(namesByType[type]),
      type,
      location: pick(campusLocations),
      condition: weightedPick(conditions),
      status: weightedPick(statuses),
      lastMaintenance: dateStr(2026, randomInt(1, 7), randomInt(1, 28)),
      value: baseValueByType[type] + randomInt(0, 10000),
      purchaseDate: dateStr(purchaseYear, randomInt(1, 12), randomInt(1, 28)),
      maintenanceHistory,
    });
  }
  return list;
}

export const assets: Asset[] = generateAssets();

export function getAssetById(id: string): Asset | undefined {
  return assets.find((a) => a.id === id);
}
```

- [ ] **Step 2: Create `src/api/assets.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { assets, getAssetById } from "@/demo-data/campus/assets";
import type { Asset } from "@/types";

export function getAssets(): Promise<Asset[]> {
  return simulateRequest(assets);
}

export function getAssetByIdAsync(id: string): Promise<Asset | undefined> {
  return simulateRequest(getAssetById(id));
}

export function addAsset(entry: Asset): Promise<Asset> {
  assets.unshift(entry);
  return simulateRequest(entry);
}

export function updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | undefined> {
  const idx = assets.findIndex((a) => a.id === id);
  if (idx !== -1) assets[idx] = { ...assets[idx], ...updates };
  return simulateRequest(assets[idx]);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/campus/assets.ts src/api/assets.ts
git commit -m "Add assets demo data and API"
```

---

### Task 3: Tickets demo data + API

**Files:**
- Create: `src/demo-data/campus/tickets.ts`
- Create: `src/api/tickets.ts`

**Interfaces:**
- Consumes: `Ticket`, `TicketPriority`, `TicketStatus`, `SlaState` from `@/types` (Task 1); `campusLocations` from `@/demo-data/campus/assets` (Task 2); `randomFullName` from `@/demo-data/generators/namePools`; `createRng` from `@/demo-data/generators/random`.
- Produces: `tickets: Ticket[]`, `getTicketById(id): Ticket | undefined` from `tickets.ts`; `getTickets(): Promise<Ticket[]>`, `getTicketByIdAsync(id): Promise<Ticket | undefined>`, `addTicket(entry): Promise<Ticket>`, `updateTicket(id, updates): Promise<Ticket | undefined>` from `api/tickets.ts` — used by Tasks 11–12.

- [ ] **Step 1: Create `src/demo-data/campus/tickets.ts`**

```ts
import type { Ticket, TicketPriority, TicketStatus, SlaState } from "@/types";
import { campusLocations } from "@/demo-data/campus/assets";
import { createRng } from "@/demo-data/generators/random";

const { pick, weightedPick, randomInt } = createRng(74110302);

const maintenanceStaff = [
  "John Martinez", "IT Support Team", "Plumbing Team", "Priya Nambiar",
  "Ahmed Khan", "Grounds Crew",
];

const issuePool: { title: string; description: string }[] = [
  { title: "HVAC Failure - Server Room", description: "Main cooling unit making loud noises, temperature rising" },
  { title: "Projector Not Working", description: "Classroom projector won't turn on" },
  { title: "Wi-Fi Connectivity Issues", description: "Students reporting intermittent connectivity" },
  { title: "Leaking Faucet", description: "Washroom faucet continuously dripping" },
  { title: "Broken Chair", description: "Classroom chair leg is cracked and unsafe" },
  { title: "Power Outage", description: "Circuit breaker keeps tripping in the lab" },
  { title: "Elevator Malfunction", description: "Elevator stuck between floors intermittently" },
  { title: "Water Cooler Broken", description: "Water cooler not dispensing cold water" },
  { title: "Ceiling Fan Noise", description: "Fan makes rattling noise at high speed" },
  { title: "Door Lock Jammed", description: "Room door lock won't turn with the key" },
];

const createdLabels = ["10:42 AM", "09:15 AM", "Yesterday", "2 days ago", "3 days ago"];
const onTrackDetails = ["1h 30m remaining", "3h remaining", "45m remaining", "5h remaining"];
const breachedDetails = ["2h 15m overdue", "45m overdue", "1h 10m overdue", "4h overdue"];
const resolvedDetails = ["45m ahead", "2h 10m ahead", "1h ahead", "3h ahead"];

const priorities: [TicketPriority, number][] = [["critical", 8], ["high", 20], ["medium", 40], ["low", 32]];
const statuses: [TicketStatus, number][] = [["open", 20], ["in_progress", 32], ["resolved", 48]];

const TICKET_COUNT = 25;

function generateTickets(): Ticket[] {
  const list: Ticket[] = [];
  for (let i = 0; i < TICKET_COUNT; i++) {
    const issue = pick(issuePool);
    const status = weightedPick(statuses);
    const priority = weightedPick(priorities);
    const assignedTo = status === "open" ? null : pick(maintenanceStaff);
    let slaState: SlaState;
    let slaDetail: string;
    let resolutionHours: number | undefined;
    if (status === "resolved") {
      slaState = "resolved";
      slaDetail = pick(resolvedDetails);
      resolutionHours = randomInt(1, 8);
    } else {
      slaState = weightedPick([["on_track", 70], ["breached", 30]]);
      slaDetail = slaState === "breached" ? pick(breachedDetails) : pick(onTrackDetails);
    }
    list.push({
      id: `REQ-${2095 - i}`,
      title: issue.title,
      description: issue.description,
      location: pick(campusLocations),
      priority,
      assignedTo,
      status,
      createdLabel: pick(createdLabels),
      slaState,
      slaDetail,
      resolutionHours,
    });
  }
  return list;
}

export const tickets: Ticket[] = generateTickets();

export function getTicketById(id: string): Ticket | undefined {
  return tickets.find((t) => t.id === id);
}
```

- [ ] **Step 2: Create `src/api/tickets.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { tickets, getTicketById } from "@/demo-data/campus/tickets";
import type { Ticket } from "@/types";

export function getTickets(): Promise<Ticket[]> {
  return simulateRequest(tickets);
}

export function getTicketByIdAsync(id: string): Promise<Ticket | undefined> {
  return simulateRequest(getTicketById(id));
}

export function addTicket(entry: Ticket): Promise<Ticket> {
  tickets.unshift(entry);
  return simulateRequest(entry);
}

export function updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket | undefined> {
  const idx = tickets.findIndex((t) => t.id === id);
  if (idx !== -1) tickets[idx] = { ...tickets[idx], ...updates };
  return simulateRequest(tickets[idx]);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/campus/tickets.ts src/api/tickets.ts
git commit -m "Add tickets demo data and API"
```

---

### Task 4: Hostel stats demo data + API

**Files:**
- Create: `src/demo-data/campus/hostelStats.ts`
- Create: `src/api/hostelStats.ts`

**Interfaces:**
- Consumes: `HostelStats` from `@/types` (Task 1).
- Produces: `hostelStats: HostelStats`, `hostelBlocks: string[]`, `hostelRooms: string[]`, `hostelBeds: string[]` from `hostelStats.ts`; `getHostelStats(): Promise<HostelStats>`, `allocateRoom(): Promise<HostelStats>` from `api/hostelStats.ts` — used by Task 13's Hostel page and Task 16's Dashboard wiring.

- [ ] **Step 1: Create `src/demo-data/campus/hostelStats.ts`**

```ts
import type { HostelStats } from "@/types";

export const hostelBlocks = ["Boys Hostel A", "Boys Hostel B", "Girls Hostel A"];
export const hostelRooms = ["101", "102", "103"];
export const hostelBeds = ["Bed 1", "Bed 2"];

export const hostelStats: HostelStats = {
  totalBeds: 918,
  occupied: 845,
  available: 73,
  maintenance: 18,
};
```

- [ ] **Step 2: Create `src/api/hostelStats.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { hostelStats } from "@/demo-data/campus/hostelStats";
import type { HostelStats } from "@/types";

export function getHostelStats(): Promise<HostelStats> {
  return simulateRequest(hostelStats);
}

export function allocateRoom(): Promise<HostelStats> {
  if (hostelStats.available > 0) {
    hostelStats.available -= 1;
    hostelStats.occupied += 1;
  }
  return simulateRequest(hostelStats);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/campus/hostelStats.ts src/api/hostelStats.ts
git commit -m "Add hostel stats demo data and API"
```

---

### Task 5: Facility stats demo data + API

**Files:**
- Create: `src/demo-data/campus/facilityStats.ts`
- Create: `src/api/facilityStats.ts`

**Interfaces:**
- Consumes: `FacilityStats` from `@/types` (Task 1).
- Produces: `facilityStats: FacilityStats`, `facilitiesList: string[]`, `bookingTimeSlots: string[]` from `facilityStats.ts`; `getFacilityStats(): Promise<FacilityStats>`, `addBooking(): Promise<FacilityStats>` from `api/facilityStats.ts` — used by Task 14's Facility page.

- [ ] **Step 1: Create `src/demo-data/campus/facilityStats.ts`**

```ts
import type { FacilityStats } from "@/types";

export const facilitiesList = ["Auditorium", "Conference Room A", "Sports Complex"];
export const bookingTimeSlots = ["09:00 AM - 12:00 PM", "02:00 PM - 05:00 PM", "Full Day"];

export const facilityStats: FacilityStats = {
  todayBookings: 24,
  auditoriumUtilizationPct: 85,
  sportsUtilizationPct: 72,
  pendingApprovals: 8,
};
```

- [ ] **Step 2: Create `src/api/facilityStats.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { facilityStats } from "@/demo-data/campus/facilityStats";
import type { FacilityStats } from "@/types";

export function getFacilityStats(): Promise<FacilityStats> {
  return simulateRequest(facilityStats);
}

export function addBooking(): Promise<FacilityStats> {
  facilityStats.todayBookings += 1;
  return simulateRequest(facilityStats);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/campus/facilityStats.ts src/api/facilityStats.ts
git commit -m "Add facility stats demo data and API"
```

---

### Task 6: Books demo data + API

**Files:**
- Create: `src/demo-data/campus/books.ts`
- Create: `src/api/books.ts`

**Interfaces:**
- Consumes: `Book`, `BookStatus` from `@/types` (Task 1); `createRng` from `@/demo-data/generators/random`.
- Produces: `books: Book[]`, `getBookById(id): Book | undefined` from `books.ts`; `getBooks(): Promise<Book[]>`, `addBook(entry): Promise<Book>`, `issueBook(bookId): Promise<Book | undefined>` from `api/books.ts` — used by Task 7's transactions generator and Task 15's Library page.

- [ ] **Step 1: Create `src/demo-data/campus/books.ts`**

```ts
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
```

- [ ] **Step 2: Create `src/api/books.ts`**

```ts
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
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/campus/books.ts src/api/books.ts
git commit -m "Add books demo data and API"
```

---

### Task 7: Library transactions demo data + API

**Files:**
- Create: `src/demo-data/campus/libraryTransactions.ts`
- Create: `src/api/libraryTransactions.ts`

**Interfaces:**
- Consumes: `LibraryTransaction`, `LibraryTransactionStatus` from `@/types` (Task 1); `students` from `@/demo-data/people/students` (Phase 1a); `books`, `getBookById` from `@/demo-data/campus/books` (Task 6); `createRng` from `@/demo-data/generators/random`.
- Produces: `libraryTransactions: LibraryTransaction[]` from `libraryTransactions.ts`; `getLibraryTransactions(): Promise<LibraryTransaction[]>`, `returnBook(transactionId): Promise<LibraryTransaction | undefined>` from `api/libraryTransactions.ts` — used by Task 15's Library page.

- [ ] **Step 1: Create `src/demo-data/campus/libraryTransactions.ts`**

```ts
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
```

- [ ] **Step 2: Create `src/api/libraryTransactions.ts`**

```ts
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
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/campus/libraryTransactions.ts src/api/libraryTransactions.ts
git commit -m "Add library transactions demo data and API"
```

---

### Task 8: StatusChip additions

**Files:**
- Modify: `src/components/StatusChip.tsx`

**Interfaces:**
- Produces: `StatusChip` now also handles `"maintenance"`, `"retired"`, `"open"`, `"resolved"`, `"critical"`, `"high"`, `"medium"`, `"low"`, `"available"`, `"reserved"` (`"in_progress"`, `"issued"`, `"returned"`, `"active"` already exist from prior phases) — used by Tasks 9–15.

- [ ] **Step 1: Add the 2 new icon imports**

In `src/components/StatusChip.tsx`, add to the existing icon-import block:

```tsx
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import BookmarkIcon from "@mui/icons-material/Bookmark";
```

- [ ] **Step 2: Add the 10 new status entries**

Find:

```tsx
  // Payments
  verified: { label: "Verified", color: statusTokens.good, icon: CheckCircleIcon },
  pending_clearance: { label: "Pending Clearance", color: statusTokens.warning, icon: HourglassBottomIcon },
};
```

Replace with:

```tsx
  // Payments
  verified: { label: "Verified", color: statusTokens.good, icon: CheckCircleIcon },
  pending_clearance: { label: "Pending Clearance", color: statusTokens.warning, icon: HourglassBottomIcon },
  // Assets
  maintenance: { label: "Maintenance", color: statusTokens.warning, icon: HourglassTopIcon },
  retired: { label: "Retired", color: statusTokens.serious, icon: CancelIcon },
  // Tickets
  open: { label: "Open", color: statusTokens.warning, icon: ScheduleIcon },
  resolved: { label: "Resolved", color: statusTokens.good, icon: CheckCircleIcon },
  // Priority
  critical: { label: "Critical", color: statusTokens.critical, icon: ErrorIcon },
  high: { label: "High", color: statusTokens.serious, icon: WarningAmberIcon },
  medium: { label: "Medium", color: statusTokens.warning, icon: ScheduleIcon },
  low: { label: "Low", color: statusTokens.good, icon: CheckCircleIcon },
  // Library
  available: { label: "Available", color: statusTokens.good, icon: CheckCircleIcon },
  reserved: { label: "Reserved", color: statusTokens.warning, icon: BookmarkIcon },
};
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/StatusChip.tsx
git commit -m "Add campus-operations statuses to StatusChip"
```

---

### Task 9: Assets page

**Files:**
- Create: `src/pages/admin/Assets.tsx`

**Interfaces:**
- Consumes: `getAssets`, `addAsset`, `updateAsset` from `@/api/assets` (Task 2); `campusLocations` from `@/demo-data/campus/assets` (Task 2); `PageHeader`, `DataTable`, `StatusChip` from `@/components/*`.
- Produces: default export consumed by `router.tsx` (Task 17) at `/admin/assets`.

- [ ] **Step 1: Create `src/pages/admin/Assets.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, IconButton, Typography, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getAssets, addAsset, updateAsset } from "@/api/assets";
import { campusLocations } from "@/demo-data/campus/assets";
import type { Asset, AssetCondition, AssetStatus } from "@/types";

const assetTypes = ["Projector", "Computer", "Printer", "Furniture", "Lab Equipment", "Whiteboard", "Router", "Air Conditioner", "Photocopier", "Scanner"];

const conditionColor: Record<AssetCondition, string> = {
  excellent: "#0ca30c", good: "#0ca30c", fair: "#fab219", poor: "#d03b3b",
};
const conditionLabel: Record<AssetCondition, string> = {
  excellent: "Excellent", good: "Good", fair: "Fair", poor: "Poor",
};

const emptyAddForm = { id: "", name: "", type: assetTypes[0], value: 0, purchaseDate: "", location: "" };
const emptyEditForm = { name: "", status: "active" as AssetStatus, value: 0, location: "" };

export default function Assets() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Asset[]>([]);
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getAssets().then(setRows);
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((a) =>
    (locationFilter === "all" || a.location === locationFilter) &&
    (typeFilter === "all" || a.type === typeFilter) &&
    (search === "" || a.id.toLowerCase().includes(search.toLowerCase()) || a.type.toLowerCase().includes(search.toLowerCase()) || a.location.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setAddForm(emptyAddForm); setAddOpen(true); };
  const openEdit = (a: Asset) => { setEditId(a.id); setEditForm({ name: a.name, status: a.status, value: a.value, location: a.location }); };

  const handleAdd = () => {
    addAsset({
      id: addForm.id, name: addForm.name, type: addForm.type, location: addForm.location,
      condition: "good", status: "active", lastMaintenance: addForm.purchaseDate,
      value: addForm.value, purchaseDate: addForm.purchaseDate, maintenanceHistory: [],
    }).then(load);
    setAddOpen(false);
  };

  const handleEditSave = () => {
    if (editId) updateAsset(editId, editForm).then(load);
    setEditId(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Asset Management"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Exporting Asset Report... Download will start shortly.")}>Export Report</Button>
            <Button variant="contained" onClick={openAdd}>Add Asset</Button>
          </Stack>
        }
      />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Location</InputLabel>
          <Select label="Location" value={locationFilter} onChange={(e: SelectChangeEvent) => setLocationFilter(e.target.value)}>
            <MenuItem value="all">All Locations</MenuItem>
            {campusLocations.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Type</InputLabel>
          <Select label="Type" value={typeFilter} onChange={(e: SelectChangeEvent) => setTypeFilter(e.target.value)}>
            <MenuItem value="all">All Types</MenuItem>
            {assetTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Search by ID, Type, or Location..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 260 }} />
      </Stack>

      <DataTable<Asset>
        pagination
        columns={[
          { key: "id", label: "Asset ID" },
          { key: "type", label: "Type" },
          { key: "location", label: "Location" },
          {
            key: "condition", label: "Condition",
            render: (row) => (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: conditionColor[row.condition] }} />
                <Typography variant="body2">{conditionLabel[row.condition]}</Typography>
              </Stack>
            ),
          },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          { key: "lastMaintenance", label: "Last Maintenance" },
          {
            key: "actions", label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/admin/assets/${row.id}`); }}><VisibilityIcon fontSize="small" /></IconButton>
              </Stack>
            ),
          },
        ]}
        rows={filtered}
        emptyTitle="No assets found"
      />

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Asset</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Asset Name" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} fullWidth />
          <TextField label="Asset ID" placeholder="AST-2024-001" value={addForm.id} onChange={(e) => setAddForm({ ...addForm, id: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select label="Category" value={addForm.type} onChange={(e: SelectChangeEvent) => setAddForm({ ...addForm, type: e.target.value })}>
              {assetTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Value" type="number" placeholder="45000" value={addForm.value} onChange={(e) => setAddForm({ ...addForm, value: Number(e.target.value) })} fullWidth />
          <TextField label="Purchase Date" type="date" value={addForm.purchaseDate} onChange={(e) => setAddForm({ ...addForm, purchaseDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="Location" placeholder="Lab 301" value={addForm.location} onChange={(e) => setAddForm({ ...addForm, location: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Add Asset</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editId} onClose={() => setEditId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Asset</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Asset Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={editForm.status} onChange={(e: SelectChangeEvent) => setEditForm({ ...editForm, status: e.target.value as AssetStatus })}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="retired">Retired</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Value" type="number" value={editForm.value} onChange={(e) => setEditForm({ ...editForm, value: Number(e.target.value) })} fullWidth />
          <TextField label="Location" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditId(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>Save Changes</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors (router.tsx is not touched until Task 17, so this new page has no consumer yet, but tsc still type-checks it).

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Assets.tsx
git commit -m "Add Assets page"
```

---

### Task 10: Asset Profile page

**Files:**
- Create: `src/pages/admin/AssetProfile.tsx`

**Interfaces:**
- Consumes: `getAssetByIdAsync`, `updateAsset` from `@/api/assets` (Task 2); `PageHeader`, `EmptyState`, `StatusChip` from `@/components/*`.
- Produces: default export consumed by `router.tsx` (Task 17) at `/admin/assets/:id`. Fixes the source's `viewAssetDetails` bug (always showed the same hardcoded asset regardless of which row was clicked).

- [ ] **Step 1: Create `src/pages/admin/AssetProfile.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, Typography, Paper, Grid, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusChip from "@/components/StatusChip";
import { getAssetByIdAsync, updateAsset } from "@/api/assets";
import type { Asset, AssetStatus } from "@/types";

function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function AssetProfile() {
  const { id } = useParams();
  const [asset, setAsset] = useState<Asset | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", status: "active" as AssetStatus, value: 0, location: "" });
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => {
    if (id) getAssetByIdAsync(id).then((data) => { setAsset(data); setLoaded(true); });
  };
  useEffect(() => { load(); }, [id]);

  if (loaded && !asset) {
    return <EmptyState title="Asset not found" description={`No asset with id "${id}".`} />;
  }
  if (!asset) return null;

  const openEdit = () => { setEditForm({ name: asset.name, status: asset.status, value: asset.value, location: asset.location }); setEditOpen(true); };
  const handleSave = () => { updateAsset(asset.id, editForm).then(load); setEditOpen(false); };

  return (
    <>
      <PageHeader
        eyebrow="Assets"
        title={asset.name}
        breadcrumbs={[{ label: "Assets", to: "/admin/assets" }, { label: asset.id }]}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={openEdit}>Edit Asset</Button>
            <Button variant="contained" onClick={() => setSnackbar("Asset transfer initiated")}>Transfer Asset</Button>
          </Stack>
        }
      />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Asset ID</Typography><Typography variant="body1">{asset.id}</Typography></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Category</Typography><Typography variant="body1">{asset.type}</Typography></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Status</Typography><StatusChip status={asset.status} /></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Purchase Date</Typography><Typography variant="body1">{asset.purchaseDate}</Typography></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Value</Typography><Typography variant="body1">{formatINR(asset.value)}</Typography></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Location</Typography><Typography variant="body1">{asset.location}</Typography></Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Maintenance History</Typography>
        <Stack spacing={1.5}>
          {asset.maintenanceHistory.map((m, i) => (
            <Box key={i} sx={{ p: 1.5, borderLeft: 3, borderColor: "primary.main", bgcolor: "action.hover", borderRadius: 1 }}>
              <Typography variant="body2" fontWeight={600}>{m.title}</Typography>
              <Typography variant="caption" color="text.secondary">Completed on {m.date}</Typography>
            </Box>
          ))}
        </Stack>
      </Paper>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Asset</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Asset Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={editForm.status} onChange={(e: SelectChangeEvent) => setEditForm({ ...editForm, status: e.target.value as AssetStatus })}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="retired">Retired</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Value" type="number" value={editForm.value} onChange={(e) => setEditForm({ ...editForm, value: Number(e.target.value) })} fullWidth />
          <TextField label="Location" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save Changes</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/AssetProfile.tsx
git commit -m "Add Asset Profile page"
```

---

### Task 11: Tickets page

**Files:**
- Create: `src/pages/admin/Tickets.tsx`

**Interfaces:**
- Consumes: `getTickets` from `@/api/tickets` (Task 3); `PageHeader`, `StatCard`, `DataTable`, `StatusChip` from `@/components/*`.
- Produces: default export consumed by `router.tsx` (Task 17) at `/admin/tickets`.

- [ ] **Step 1: Create `src/pages/admin/Tickets.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Grid, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import ErrorIcon from "@mui/icons-material/Error";
import AssignmentLateIcon from "@mui/icons-material/AssignmentLate";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getTickets } from "@/api/tickets";
import type { Ticket, TicketStatus, TicketPriority } from "@/types";

export default function Tickets() {
  const { mode } = useColorMode();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "all">("all");
  const [search, setSearch] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getTickets().then(setRows); }, []);

  const filtered = rows.filter((t) =>
    (statusFilter === "all" || t.status === statusFilter) &&
    (priorityFilter === "all" || t.priority === priorityFilter) &&
    (search === "" || t.id.toLowerCase().includes(search.toLowerCase()) || t.location.toLowerCase().includes(search.toLowerCase()) || t.title.toLowerCase().includes(search.toLowerCase()))
  );

  const openCount = rows.filter((t) => t.status !== "resolved").length;
  const slaBreaches = rows.filter((t) => t.slaState === "breached").length;
  const unassigned = rows.filter((t) => t.assignedTo === null).length;
  const resolvedWithHours = rows.filter((t) => t.resolutionHours !== undefined);
  const avgResolution = resolvedWithHours.length > 0
    ? resolvedWithHours.reduce((sum, t) => sum + (t.resolutionHours ?? 0), 0) / resolvedWithHours.length
    : 0;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Maintenance Requests"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Exporting Maintenance Report... Download will start shortly.")}>Export Report</Button>
            <Button variant="contained" onClick={() => setSnackbar("Opening new request form...")}>Create New Request</Button>
          </Stack>
        }
      />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Open Requests" icon={<ConfirmationNumberIcon />} color={getIconAccent(mode, "tickets")} numericValue={openCount} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="SLA Breaches" icon={<ErrorIcon />} color={getIconAccent(mode, "sla")} numericValue={slaBreaches} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Unassigned Tickets" icon={<AssignmentLateIcon />} color={getIconAccent(mode, "unassigned")} numericValue={unassigned} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Avg Resolution Time" icon={<ScheduleIcon />} color={getIconAccent(mode, "resolution")} value={`${avgResolution.toFixed(1)} hrs`} />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <TextField size="small" placeholder="Search by Request ID, Location, or Description..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 300 }} />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select<TicketStatus | "all"> label="Status" value={statusFilter} onChange={(e: SelectChangeEvent<TicketStatus | "all">) => setStatusFilter(e.target.value as TicketStatus | "all")}>
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Priority</InputLabel>
          <Select<TicketPriority | "all"> label="Priority" value={priorityFilter} onChange={(e: SelectChangeEvent<TicketPriority | "all">) => setPriorityFilter(e.target.value as TicketPriority | "all")}>
            <MenuItem value="all">All Priorities</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <DataTable<Ticket>
        pagination
        columns={[
          {
            key: "id", label: "Req ID",
            render: (row) => (
              <Box>
                <Typography variant="body2" fontWeight={600} color="primary.main">#{row.id}</Typography>
                <Typography variant="caption" color="text.secondary">{row.createdLabel}</Typography>
              </Box>
            ),
          },
          {
            key: "title", label: "Issue & Description",
            render: (row) => (
              <Box>
                <Typography variant="body2" fontWeight={600}>{row.title}</Typography>
                <Typography variant="caption" color="text.secondary">{row.description}</Typography>
              </Box>
            ),
          },
          { key: "location", label: "Location" },
          { key: "priority", label: "Priority", render: (row) => <StatusChip status={row.priority} /> },
          {
            key: "assignedTo", label: "Assigned Staff",
            render: (row) => row.assignedTo
              ? row.assignedTo
              : <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); setSnackbar("Staff assignment dialog opening..."); }}>Assign Staff</Button>,
          },
          {
            key: "sla", label: "SLA Status",
            render: (row) => (
              <Box>
                <Typography variant="body2" fontWeight={600} color={row.slaState === "breached" ? "error.main" : "success.main"}>
                  {row.slaState === "breached" ? "SLA Breached" : row.slaState === "resolved" ? "Resolved" : "On Track"}
                </Typography>
                <Typography variant="caption" color="text.secondary">{row.slaDetail}</Typography>
              </Box>
            ),
          },
          {
            key: "actions", label: "Actions",
            render: (row) => <Button size="small" onClick={(e) => { e.stopPropagation(); navigate(`/admin/tickets/${row.id}`); }}>View</Button>,
          },
        ]}
        rows={filtered}
        emptyTitle="No maintenance requests found"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Tickets.tsx
git commit -m "Add Tickets page"
```

---

### Task 12: Ticket Profile page

**Files:**
- Create: `src/pages/admin/TicketProfile.tsx`

**Interfaces:**
- Consumes: `getTicketByIdAsync`, `updateTicket` from `@/api/tickets` (Task 3); `PageHeader`, `EmptyState`, `StatusChip` from `@/components/*`.
- Produces: default export consumed by `router.tsx` (Task 17) at `/admin/tickets/:id`. Fixes the source's `viewTicketDetails` bug and makes "Mark Resolved" functional.

- [ ] **Step 1: Create `src/pages/admin/TicketProfile.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Stack, Typography, Paper, Grid, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusChip from "@/components/StatusChip";
import { getTicketByIdAsync, updateTicket } from "@/api/tickets";
import type { Ticket } from "@/types";

export default function TicketProfile() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<Ticket | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => {
    if (id) getTicketByIdAsync(id).then((data) => { setTicket(data); setLoaded(true); });
  };
  useEffect(() => { load(); }, [id]);

  if (loaded && !ticket) {
    return <EmptyState title="Ticket not found" description={`No ticket with id "${id}".`} />;
  }
  if (!ticket) return null;

  const handleResolve = () => {
    updateTicket(ticket.id, { status: "resolved", slaState: "resolved", slaDetail: "Resolved just now" }).then(load);
  };

  return (
    <>
      <PageHeader
        eyebrow="Tickets"
        title={ticket.title}
        breadcrumbs={[{ label: "Tickets", to: "/admin/tickets" }, { label: ticket.id }]}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Technician assigned successfully")}>Assign Technician</Button>
            <Button variant="contained" disabled={ticket.status === "resolved"} onClick={handleResolve}>Mark Resolved</Button>
          </Stack>
        }
      />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Ticket ID</Typography><Typography variant="body1">{ticket.id}</Typography></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Priority</Typography><StatusChip status={ticket.priority} /></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Status</Typography><StatusChip status={ticket.status} /></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Location</Typography><Typography variant="body1">{ticket.location}</Typography></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Created</Typography><Typography variant="body1">{ticket.createdLabel}</Typography></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Assigned To</Typography><Typography variant="body1">{ticket.assignedTo ?? "Unassigned"}</Typography></Grid>
        </Grid>
      </Paper>
      <Paper elevation={0} sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Description</Typography>
        <Typography variant="body2" color="text.secondary">{ticket.description}</Typography>
      </Paper>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/TicketProfile.tsx
git commit -m "Add Ticket Profile page"
```

---

### Task 13: Hostel page

**Files:**
- Create: `src/pages/admin/Hostel.tsx`

**Interfaces:**
- Consumes: `getHostelStats`, `allocateRoom` from `@/api/hostelStats` (Task 4); `hostelBlocks`, `hostelRooms`, `hostelBeds` from `@/demo-data/campus/hostelStats` (Task 4); `students` from `@/demo-data/people/students` (Phase 1a); `PageHeader`, `StatCard` from `@/components/*`.
- Produces: default export consumed by `router.tsx` (Task 17) at `/admin/hostel`. "Allocate Room" is functional (moves a bed from Available to Occupied).

- [ ] **Step 1: Create `src/pages/admin/Hostel.tsx`**

```tsx
import { useEffect, useState } from "react";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, InputLabel, FormControl, Stack, Typography, Paper, Grid, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import BedIcon from "@mui/icons-material/Bed";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import BuildIcon from "@mui/icons-material/Build";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getHostelStats, allocateRoom } from "@/api/hostelStats";
import { hostelBlocks, hostelRooms, hostelBeds } from "@/demo-data/campus/hostelStats";
import { students } from "@/demo-data/people/students";
import type { HostelStats } from "@/types";

const dropdownStudents = students.slice(0, 20);

export default function Hostel() {
  const { mode } = useColorMode();
  const [stats, setStats] = useState<HostelStats | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ studentId: dropdownStudents[0].id, hostel: hostelBlocks[0], room: hostelRooms[0], bed: hostelBeds[0] });
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getHostelStats().then(setStats);
  useEffect(() => { load(); }, []);

  const handleAllocate = () => {
    if (!stats || stats.available <= 0) {
      setSnackbar("No beds available to allocate");
      setDialogOpen(false);
      return;
    }
    allocateRoom().then(() => { load(); setDialogOpen(false); setSnackbar("Room allocated successfully!"); });
  };

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Hostel Management"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Exporting Hostel Data... Download will start shortly.")}>Export</Button>
            <Button variant="contained" onClick={() => setDialogOpen(true)}>Allocate Room</Button>
          </Stack>
        }
      />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Hostel management system provides:</Typography>
        <Box component="ul" sx={{ pl: 3, mb: 0 }}>
          {[
            "Room allocation and vacancy tracking",
            "Student check-in/check-out management",
            "Mess and facility booking",
            "Visitor management and gate pass",
            "Hostel fee collection",
            "Complaint and request tracking",
          ].map((item) => (
            <Typography key={item} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{item}</Typography>
          ))}
        </Box>
      </Paper>

      {stats && (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Total Beds" icon={<BedIcon />} color={getIconAccent(mode, "beds")} numericValue={stats.totalBeds} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Occupied" icon={<CheckCircleIcon />} color={getIconAccent(mode, "occupied")} numericValue={stats.occupied} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Available" icon={<EventSeatIcon />} color={getIconAccent(mode, "available")} numericValue={stats.available} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Maintenance" icon={<BuildIcon />} color={getIconAccent(mode, "hostel-maintenance")} numericValue={stats.maintenance} />
          </Grid>
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Allocate Hostel Room</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Student</InputLabel>
            <Select label="Student" value={form.studentId} onChange={(e: SelectChangeEvent) => setForm({ ...form, studentId: e.target.value })}>
              {dropdownStudents.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Hostel</InputLabel>
            <Select label="Hostel" value={form.hostel} onChange={(e: SelectChangeEvent) => setForm({ ...form, hostel: e.target.value })}>
              {hostelBlocks.map((h) => <MenuItem key={h} value={h}>{h}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Room Number</InputLabel>
            <Select label="Room Number" value={form.room} onChange={(e: SelectChangeEvent) => setForm({ ...form, room: e.target.value })}>
              {hostelRooms.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Bed Number</InputLabel>
            <Select label="Bed Number" value={form.bed} onChange={(e: SelectChangeEvent) => setForm({ ...form, bed: e.target.value })}>
              {hostelBeds.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAllocate}>Allocate Room</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Hostel.tsx
git commit -m "Add Hostel page"
```

---

### Task 14: Facility page

**Files:**
- Create: `src/pages/admin/Facility.tsx`

**Interfaces:**
- Consumes: `getFacilityStats`, `addBooking` from `@/api/facilityStats` (Task 5); `facilitiesList`, `bookingTimeSlots` from `@/demo-data/campus/facilityStats` (Task 5); `PageHeader`, `StatCard` from `@/components/*`.
- Produces: default export consumed by `router.tsx` (Task 17) at `/admin/facility`. "New Booking" is functional (increments Today's Bookings).

- [ ] **Step 1: Create `src/pages/admin/Facility.tsx`**

```tsx
import { useEffect, useState } from "react";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, Typography, Paper, Grid, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import TheaterComedyIcon from "@mui/icons-material/TheaterComedy";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getFacilityStats, addBooking } from "@/api/facilityStats";
import { facilitiesList, bookingTimeSlots } from "@/demo-data/campus/facilityStats";
import type { FacilityStats } from "@/types";

const emptyForm = { facility: facilitiesList[0], eventType: "", date: "", timeSlot: bookingTimeSlots[0], purpose: "" };

export default function Facility() {
  const { mode } = useColorMode();
  const [stats, setStats] = useState<FacilityStats | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getFacilityStats().then(setStats);
  useEffect(() => { load(); }, []);

  const handleBook = () => {
    addBooking().then(() => { load(); setDialogOpen(false); setForm(emptyForm); setSnackbar("Booking created successfully!"); });
  };

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Facility Booking"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Opening calendar view...")}>View Calendar</Button>
            <Button variant="contained" onClick={() => setDialogOpen(true)}>New Booking</Button>
          </Stack>
        }
      />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Facility booking system allows:</Typography>
        <Box component="ul" sx={{ pl: 3, mb: 0 }}>
          {[
            "Book auditoriums, conference rooms, labs",
            "Sports facility scheduling",
            "Equipment and resource reservation",
            "Approval workflow management",
            "Conflict detection and prevention",
            "Usage tracking and reports",
          ].map((item) => (
            <Typography key={item} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{item}</Typography>
          ))}
        </Box>
      </Paper>

      {stats && (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Today's Bookings" icon={<EventIcon />} color={getIconAccent(mode, "bookings")} numericValue={stats.todayBookings} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Auditorium" icon={<TheaterComedyIcon />} color={getIconAccent(mode, "auditorium")} numericValue={stats.auditoriumUtilizationPct} formatValue={(n) => `${n}%`} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Sports Complex" icon={<SportsSoccerIcon />} color={getIconAccent(mode, "sports")} numericValue={stats.sportsUtilizationPct} formatValue={(n) => `${n}%`} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Pending Approvals" icon={<PendingActionsIcon />} color={getIconAccent(mode, "facility-pending")} numericValue={stats.pendingApprovals} />
          </Grid>
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Facility Booking</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Facility</InputLabel>
            <Select label="Facility" value={form.facility} onChange={(e: SelectChangeEvent) => setForm({ ...form, facility: e.target.value })}>
              {facilitiesList.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Event Type" placeholder="Seminar, Workshop, etc" value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })} fullWidth />
          <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
          <FormControl fullWidth>
            <InputLabel>Time Slot</InputLabel>
            <Select label="Time Slot" value={form.timeSlot} onChange={(e: SelectChangeEvent) => setForm({ ...form, timeSlot: e.target.value })}>
              {bookingTimeSlots.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Purpose" placeholder="Describe the purpose of booking" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} fullWidth multiline minRows={3} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleBook}>Submit Booking</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Facility.tsx
git commit -m "Add Facility page"
```

---

### Task 15: Library page

**Files:**
- Create: `src/pages/admin/Library.tsx`

**Interfaces:**
- Consumes: `getBooks`, `addBook`, `issueBook` from `@/api/books` (Task 6); `getLibraryTransactions`, `returnBook` from `@/api/libraryTransactions` (Task 7); `getStudentById` from `@/demo-data/people/students` (Phase 1a); `PageHeader`, `DataTable`, `StatusChip` from `@/components/*`.
- Produces: default export consumed by `router.tsx` (Task 17) at `/admin/library`. Issue/Return are functional (move real copy counts and the real transactions table).

- [ ] **Step 1: Create `src/pages/admin/Library.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Library.tsx
git commit -m "Add Library page"
```

---

### Task 16: Wire Overview Dashboard's Open Tickets / Total Assets / Hostel Occupancy KPIs

**Files:**
- Modify: `src/pages/admin/Dashboard.tsx`

**Interfaces:**
- Consumes: `getTickets` from `@/api/tickets` (Task 3); `getAssets` from `@/api/assets` (Task 2); `getHostelStats` from `@/api/hostelStats` (Task 4).

- [ ] **Step 1: Add the 3 new imports**

Add to the existing import block in `src/pages/admin/Dashboard.tsx`:

```tsx
import { getTickets } from "@/api/tickets";
import { getAssets } from "@/api/assets";
import { getHostelStats } from "@/api/hostelStats";
```

- [ ] **Step 2: Add state and fetch it alongside the existing data**

Find this existing block:

```tsx
  const [examCount, setExamCount] = useState(0);
  const [feeCollected, setFeeCollected] = useState(0);

  useEffect(() => {
    let live = true;
    getStudents().then((data) => { if (live) setStudents(data); });
    getFaculty().then((data) => { if (live) setFaculty(data); });
    getActivityLog().then((data) => { if (live) setActivity(data); });
    getExams().then((data) => { if (live) setExamCount(data.length); });
    getFeeLedger().then((data) => { if (live) setFeeCollected(data.reduce((sum, e) => sum + e.paidAmount, 0)); });
    return () => { live = false; };
  }, []);
```

Replace it with:

```tsx
  const [examCount, setExamCount] = useState(0);
  const [feeCollected, setFeeCollected] = useState(0);
  const [openTicketCount, setOpenTicketCount] = useState(0);
  const [assetCount, setAssetCount] = useState(0);
  const [hostelOccupancyPct, setHostelOccupancyPct] = useState(0);

  useEffect(() => {
    let live = true;
    getStudents().then((data) => { if (live) setStudents(data); });
    getFaculty().then((data) => { if (live) setFaculty(data); });
    getActivityLog().then((data) => { if (live) setActivity(data); });
    getExams().then((data) => { if (live) setExamCount(data.length); });
    getFeeLedger().then((data) => { if (live) setFeeCollected(data.reduce((sum, e) => sum + e.paidAmount, 0)); });
    getTickets().then((data) => { if (live) setOpenTicketCount(data.filter((t) => t.status !== "resolved").length); });
    getAssets().then((data) => { if (live) setAssetCount(data.length); });
    getHostelStats().then((data) => { if (live) setHostelOccupancyPct(Math.round((data.occupied / data.totalBeds) * 100)); });
    return () => { live = false; };
  }, []);
```

- [ ] **Step 3: Use the real values in the 3 KPI cards**

Find:

```tsx
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Open Tickets" icon={<ConfirmationNumberIcon />} color={getIconAccent(mode, "tickets")} numericValue={42} />
        </Grid>
```

Replace with:

```tsx
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Open Tickets" icon={<ConfirmationNumberIcon />} color={getIconAccent(mode, "tickets")} numericValue={openTicketCount} />
        </Grid>
```

Find:

```tsx
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Assets" icon={<InventoryIcon />} color={getIconAccent(mode, "assets")} numericValue={1842} />
        </Grid>
```

Replace with:

```tsx
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Assets" icon={<InventoryIcon />} color={getIconAccent(mode, "assets")} numericValue={assetCount} />
        </Grid>
```

Find:

```tsx
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Hostel Occupancy" icon={<HotelIcon />} color={getIconAccent(mode, "hostel")} numericValue={92} formatValue={(n) => `${n}%`} />
        </Grid>
```

Replace with:

```tsx
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Hostel Occupancy" icon={<HotelIcon />} color={getIconAccent(mode, "hostel")} numericValue={hostelOccupancyPct} formatValue={(n) => `${n}%`} />
        </Grid>
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors — `Dashboard.tsx` is already wired into the router from Phase 1a, and `@/api/tickets`, `@/api/assets`, `@/api/hostelStats` already exist from Tasks 2–4.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/Dashboard.tsx
git commit -m "Wire Overview's Open Tickets/Total Assets/Hostel Occupancy KPIs to real data"
```

---

### Task 17: Navigation Operations group + router wiring

**Files:**
- Modify: `src/components/navigation.tsx`
- Modify: `src/router.tsx`

**Interfaces:**
- Consumes: default exports from `Assets.tsx`/`AssetProfile.tsx` (Tasks 9–10), `Tickets.tsx`/`TicketProfile.tsx` (Tasks 11–12), `Hostel.tsx` (Task 13), `Facility.tsx` (Task 14), `Library.tsx` (Task 15).
- Produces: updated `getNavItems("admin")` with an Operations group inserted between Academics and Finance; 7 new routes registered in `router.tsx`.

- [ ] **Step 1: Add the Operations group to the `"admin"` case, between Academics and Finance**

Find the existing (Phase 1c) admin case in `src/components/navigation.tsx`:

```tsx
        { label: "Results", path: "/admin/results", icon: <AssessmentIcon />, group: "Academics" },
        { label: "Fee Structure", path: "/admin/fees/structure", icon: <PaymentIcon />, group: "Finance" },
```

Replace it with:

```tsx
        { label: "Results", path: "/admin/results", icon: <AssessmentIcon />, group: "Academics" },
        { label: "Asset Master", path: "/admin/assets", icon: <InventoryIcon />, group: "Operations" },
        { label: "Maintenance Tickets", path: "/admin/tickets", icon: <ConfirmationNumberIcon />, group: "Operations" },
        { label: "Hostel Management", path: "/admin/hostel", icon: <HotelIcon />, group: "Operations" },
        { label: "Facility / Booking", path: "/admin/facility", icon: <EventIcon />, group: "Operations" },
        { label: "Library Management", path: "/admin/library", icon: <LocalLibraryIcon />, group: "Operations" },
        { label: "Fee Structure", path: "/admin/fees/structure", icon: <PaymentIcon />, group: "Finance" },
```

Add the 5 new icon imports to the existing icon-import block:

```tsx
import InventoryIcon from "@mui/icons-material/Inventory";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import HotelIcon from "@mui/icons-material/Hotel";
import EventIcon from "@mui/icons-material/Event";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
```

- [ ] **Step 2: Add the 7 new lazy imports to `router.tsx`**

Add to the existing admin lazy-import block in `src/router.tsx`:

```tsx
const AdminAssets = lazy(() => import("@/pages/admin/Assets"));
const AdminAssetProfile = lazy(() => import("@/pages/admin/AssetProfile"));
const AdminTickets = lazy(() => import("@/pages/admin/Tickets"));
const AdminTicketProfile = lazy(() => import("@/pages/admin/TicketProfile"));
const AdminHostel = lazy(() => import("@/pages/admin/Hostel"));
const AdminFacility = lazy(() => import("@/pages/admin/Facility"));
const AdminLibrary = lazy(() => import("@/pages/admin/Library"));
```

- [ ] **Step 3: Add the 7 new routes**

Find:

```tsx
      { path: "admin/results", element: <AdminResults /> },
      { path: "admin/fees/structure", element: <AdminFeeStructure /> },
```

Replace with:

```tsx
      { path: "admin/results", element: <AdminResults /> },
      { path: "admin/assets", element: <AdminAssets /> },
      { path: "admin/assets/:id", element: <AdminAssetProfile /> },
      { path: "admin/tickets", element: <AdminTickets /> },
      { path: "admin/tickets/:id", element: <AdminTicketProfile /> },
      { path: "admin/hostel", element: <AdminHostel /> },
      { path: "admin/facility", element: <AdminFacility /> },
      { path: "admin/library", element: <AdminLibrary /> },
      { path: "admin/fees/structure", element: <AdminFeeStructure /> },
```

- [ ] **Step 4: Verify the full project builds**

Run: `npm run build`
Expected: `tsc -b` reports no errors, `vite build` completes with `✓ built in <time>`. No more "Cannot find module" errors — every page referenced by the router now exists.

- [ ] **Step 5: Commit**

```bash
git add src/components/navigation.tsx src/router.tsx
git commit -m "Wire Admin Operations navigation and routes"
```

---

### Task 18: End-to-end manual verification

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: Vite prints a local URL.

- [ ] **Step 2: Log in as Admin and verify the sidebar Operations group**

Navigate to the printed URL, select the Admin portal, sign in with any
credentials. Confirm the sidebar now shows an "Operations" group header
between "Academics" and "Finance", containing Asset Master, Maintenance
Tickets, Hostel Management, Facility / Booking, and Library Management.

- [ ] **Step 3: Verify Assets**

Navigate to Asset Master. Confirm the table shows 30 rows (paginated)
with Asset ID/Type/Location/Condition/Status/Last Maintenance all
populated with real, varied values. Click "Edit" on two different rows
and confirm each modal shows that row's own name/status/value/location
(not always the same one). Click the View icon on a row and confirm
its profile page shows that same asset's real data (not a fixed
"Dell Latitude 5420 Laptop" sample) plus a Maintenance History list.
Use the Location filter, Type filter, and search box one at a time and
confirm the row set actually narrows each time.

- [ ] **Step 4: Verify Tickets**

Navigate to Maintenance Tickets. Confirm the 4 KPI cards show real
computed numbers. Confirm the Status filter, Priority filter, and
search box each actually narrow the row set. Click "View" on a
non-resolved ticket, confirm its profile page shows that ticket's own
title/description/location (not a fixed "AC Not Working - Room 301"
sample), click "Mark Resolved", and confirm the Status chip flips to
"Resolved" and going back to the list shows the same ticket now marked
resolved.

- [ ] **Step 5: Verify Hostel**

Navigate to Hostel Management. Confirm the 4 KPI cards show 918/845/
73/18 (or updated values if allocations already ran this session).
Click "Allocate Room", fill the form, submit, and confirm Occupied
increases by 1 and Available decreases by 1.

- [ ] **Step 6: Verify Facility**

Navigate to Facility / Booking. Confirm the 4 KPI cards show real
values. Click "New Booking", fill the form, submit, and confirm
Today's Bookings increases by 1.

- [ ] **Step 7: Verify Library**

Navigate to Library Management. Confirm the book grid shows real books
with Category/Status filters and search all actually narrowing the
grid. Click "Issue" on an available book and confirm its copy count
decreases (and its status flips to Issued if it reaches 0). In the
Recent Issues & Returns table, click "Return" on an active/overdue row
and confirm its status flips to "Returned" and the corresponding
book's copy count increases.

- [ ] **Step 8: Verify Overview's updated KPIs**

Navigate to Dashboard. Confirm "Open Tickets", "Total Assets", and
"Hostel Occupancy" now show computed values rather than the previous
static 42/1,842/92%.

- [ ] **Step 9: Verify dark mode**

Toggle dark mode from any of the new pages and confirm the tables,
KPI cards, book grid, and status chips all remain legible.

- [ ] **Step 10: Run the linter**

Run: `npm run lint`
Expected: no errors (only the pre-existing `AuthContext.tsx` fast-refresh warning from Phase 0).

- [ ] **Step 11: Stop the dev server, then commit**

No files change in this task unless Step 10 required fixes; if it did,
amend those specific files, then:

```bash
git add -A
git commit -m "Verify Phase 1d end-to-end"
```

(Skip this commit entirely if Step 10 required no changes.)
