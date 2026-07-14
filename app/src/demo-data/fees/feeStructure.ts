import type { FeeStructureItem } from "@/types";
import { programByDepartment } from "@/demo-data/academics/departmentSeeds";
import { createRng } from "@/demo-data/generators/random";

const { randomInt } = createRng(90260715);

const baseTuitionByProgram: Record<string, number> = {
  "B.Tech CSE": 150000,
  "B.Sc Mathematics": 90000,
  "B.Sc Physics": 95000,
  "B.Tech ECE": 140000,
  "B.Tech MECH": 135000,
};

function generateFeeStructure(): FeeStructureItem[] {
  const list: FeeStructureItem[] = [];
  let seq = 1;
  for (const program of Object.values(programByDepartment)) {
    const baseTuition = baseTuitionByProgram[program] ?? 120000;
    for (let year = 1; year <= 4; year++) {
      const tuitionFee = baseTuition + (year - 1) * 5000;
      const hostelFee = 60000;
      const transportFee = 15000;
      const otherCharges = randomInt(15000, 25000);
      list.push({
        id: `FEE-${String(seq).padStart(3, "0")}`,
        program,
        year: year as 1 | 2 | 3 | 4,
        tuitionFee,
        hostelFee,
        transportFee,
        otherCharges,
        total: tuitionFee + hostelFee + transportFee + otherCharges,
      });
      seq++;
    }
  }
  return list;
}

export const feeStructure: FeeStructureItem[] = generateFeeStructure();

export function getFeeStructureById(id: string): FeeStructureItem | undefined {
  return feeStructure.find((f) => f.id === id);
}

export function getFeeStructureFor(program: string, year: number): FeeStructureItem | undefined {
  return feeStructure.find((f) => f.program === program && f.year === year);
}
