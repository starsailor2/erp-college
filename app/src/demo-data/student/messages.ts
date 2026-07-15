import type { StudentMessage } from "@/types";

export const studentMessages: StudentMessage[] = [
  { id: "MSG001", from: "Dr. Priya Menon (Instructor)", subject: "Regarding Assignment 3 Submission", category: "academic", timeAgo: "2 hours ago", body: "Hi Rahul, I noticed your Assignment 3 submission is pending. Please submit it by tomorrow to avoid a late penalty.", read: false },
  { id: "MSG002", from: "Warden Office", subject: "Room Inspection Notice", category: "hostel", timeAgo: "1 day ago", body: "Routine room inspection is scheduled for this Friday. Please ensure your room is tidy.", read: false },
  { id: "MSG003", from: "Placement Cell", subject: "Resume Review Feedback", category: "placement", timeAgo: "2 days ago", body: "Your resume has been reviewed. A few suggestions have been noted — please check the placement portal for details.", read: true },
  { id: "MSG004", from: "Library", subject: "Book Reservation Confirmed", category: "library", timeAgo: "3 days ago", body: "Your reservation for 'Introduction to Algorithms' has been confirmed. Please collect it within 2 days.", read: true },
];

export function nextMessageId(): string {
  const max = studentMessages.reduce((m, msg) => Math.max(m, Number(msg.id.replace("MSG", ""))), 0);
  return `MSG${String(max + 1).padStart(3, "0")}`;
}
