import { getStudents } from "@/api/students";
import { getFaculty } from "@/api/faculty";
import { getTickets } from "@/api/tickets";
import { getAssets } from "@/api/assets";
import type { CommandRecordRow } from "@/command-center/types";
import { fuzzyScore } from "@/command-center/shared";

export async function searchRecords(query: string, limit = 6): Promise<CommandRecordRow[]> {
  const queryLower = query.trim().toLowerCase();
  if (queryLower.length < 2) return [];

  const [students, faculty, tickets, assets] = await Promise.all([
    getStudents(),
    getFaculty(),
    getTickets(),
    getAssets(),
  ]);

  const candidates: { row: CommandRecordRow; score: number }[] = [];

  for (const s of students) {
    const score = Math.max(
      fuzzyScore(queryLower, s.name.toLowerCase()),
      fuzzyScore(queryLower, s.rollNo.toLowerCase()),
      fuzzyScore(queryLower, s.id.toLowerCase()),
    );
    if (score > 0) {
      candidates.push({
        score,
        row: { id: `student-${s.id}`, primary: s.name, secondary: `${s.rollNo} · ${s.program}`, path: `/admin/students/${s.id}` },
      });
    }
  }

  for (const f of faculty) {
    const score = Math.max(fuzzyScore(queryLower, f.name.toLowerCase()), fuzzyScore(queryLower, f.id.toLowerCase()));
    if (score > 0) {
      candidates.push({
        score,
        row: { id: `faculty-${f.id}`, primary: f.name, secondary: f.designation.replace(/_/g, " "), path: "/admin/faculty" },
      });
    }
  }

  for (const t of tickets) {
    const score = Math.max(fuzzyScore(queryLower, t.title.toLowerCase()), fuzzyScore(queryLower, t.id.toLowerCase()));
    if (score > 0) {
      candidates.push({
        score,
        row: { id: `ticket-${t.id}`, primary: t.title, secondary: `${t.id} · ${t.location}`, path: `/admin/tickets/${t.id}` },
      });
    }
  }

  for (const a of assets) {
    const score = Math.max(fuzzyScore(queryLower, a.name.toLowerCase()), fuzzyScore(queryLower, a.id.toLowerCase()));
    if (score > 0) {
      candidates.push({
        score,
        row: { id: `asset-${a.id}`, primary: a.name, secondary: `${a.id} · ${a.location}`, path: `/admin/assets/${a.id}` },
      });
    }
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((c) => c.row);
}
