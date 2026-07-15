import type { WorkloadEntry } from "@/types";
import { faculty } from "@/demo-data/people/faculty";
import { createRng } from "@/demo-data/generators/random";

const { randomInt } = createRng(20260724);

function designationLabel(d: string): string {
  return d.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function generateWorkload(): WorkloadEntry[] {
  return faculty.slice(0, 12).map((f) => {
    const courses = 2 + randomInt(0, 3);
    const hrsPerWeek = 8 + randomInt(0, 12);
    const loadPct = Math.round((hrsPerWeek / 18) * 100);
    return {
      facultyName: f.name,
      designation: designationLabel(f.designation),
      courses,
      students: courses * (30 + randomInt(0, 25)),
      hrsPerWeek,
      loadPct,
      status: loadPct > 100 ? "overloaded" : "normal",
    };
  });
}

export const workloadEntries: WorkloadEntry[] = generateWorkload();
