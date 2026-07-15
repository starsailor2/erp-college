import { getExams } from "@/api/exams";
import { getCourses } from "@/api/courses";
import { getNotices } from "@/api/notices";
import type { CommandResult, CommandTableRow, IntentDefinition } from "@/command-center/types";

function isUpcomingExamsQuery(queryLower: string): boolean {
  return queryLower.includes("exam") && (queryLower.includes("upcoming") || queryLower.includes("schedule"));
}

async function executeUpcomingExamsQuery(): Promise<CommandResult> {
  const [exams, courses] = await Promise.all([getExams(), getCourses()]);
  const courseById = new Map(courses.map((c) => [c.id, c]));
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = exams.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));

  const rows: CommandTableRow[] = upcoming.slice(0, 8).map((e) => ({
    id: e.id,
    path: "/admin/exams",
    course: courseById.get(e.courseId)?.name ?? e.courseId,
    date: e.date,
    venue: e.venue,
  }));

  return {
    kind: "record-table",
    summary: `${upcoming.length} upcoming exam${upcoming.length === 1 ? "" : "s"} scheduled.`,
    columns: [
      { key: "course", label: "Course" },
      { key: "date", label: "Date" },
      { key: "venue", label: "Venue" },
    ],
    rows,
    viewAllPath: "/admin/exams",
    viewAllLabel: "View exam schedule",
  };
}

const upcomingExamsIntent: IntentDefinition = {
  id: "exams-upcoming",
  matches: isUpcomingExamsQuery,
  execute: executeUpcomingExamsQuery,
};

function isRecentNoticesQuery(queryLower: string): boolean {
  return queryLower.includes("notice") && (queryLower.includes("recent") || queryLower.includes("latest"));
}

async function executeRecentNoticesQuery(): Promise<CommandResult> {
  const notices = await getNotices();
  const published = notices
    .filter((n) => n.status === "published" && n.publishedDate)
    .sort((a, b) => (b.publishedDate ?? "").localeCompare(a.publishedDate ?? ""));

  const rows: CommandTableRow[] = published.slice(0, 8).map((n) => ({
    id: n.id,
    path: "/admin/notices",
    title: n.title,
    audience: n.audience,
    publishedDate: n.publishedDate ?? "—",
  }));

  return {
    kind: "record-table",
    summary: `${published.length} published notice${published.length === 1 ? "" : "s"}, most recent first.`,
    columns: [
      { key: "title", label: "Title" },
      { key: "audience", label: "Audience" },
      { key: "publishedDate", label: "Published" },
    ],
    rows,
    viewAllPath: "/admin/notices",
    viewAllLabel: "View all notices",
  };
}

const recentNoticesIntent: IntentDefinition = {
  id: "notices-recent",
  matches: isRecentNoticesQuery,
  execute: executeRecentNoticesQuery,
};

export const examAndNoticeIntents: IntentDefinition[] = [upcomingExamsIntent, recentNoticesIntent];
