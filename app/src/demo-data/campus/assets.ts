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
