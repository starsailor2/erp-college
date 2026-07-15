import type { StudentNotice } from "@/types";

export const studentNotices: StudentNotice[] = [
  { id: "SN-001", title: "Semester Examination Schedule Released", body: "The semester 6 examination schedule has been published. Please check the Exams & Results page for your subject-wise timetable.", date: "2026-07-10", author: "Examination Cell", category: "academic", urgency: "urgent", read: false },
  { id: "SN-002", title: "Hostel Fee Payment Reminder", body: "Semester 7 hostel fee payment is due by 2026-08-15. Late payments will attract a fine.", date: "2026-07-08", author: "Hostel Office", category: "hostel", urgency: "important", read: false },
  { id: "SN-003", title: "TCS Campus Placement Drive", body: "TCS will be conducting a campus placement drive on 2026-08-25. Eligible students must register by 2026-08-20.", date: "2026-07-05", author: "Placement Cell", category: "placement", urgency: "normal", read: false },
  { id: "SN-004", title: "Library Book Return Reminder", body: "Please return all overdue library books by 2026-07-20 to avoid fines.", date: "2026-07-01", author: "Library", category: "library", urgency: "normal", read: true },
];
