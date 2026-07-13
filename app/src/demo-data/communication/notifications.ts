import type { Notification } from "@/types";
import { randomFullName } from "@/demo-data/generators/namePools";

export const notifications: Notification[] = [
  {
    id: "n1",
    title: "Semester Registration Open",
    message: "Course registration for the upcoming semester is now open. Please complete it before the deadline.",
    postedBy: randomFullName(),
    read: false,
    timestamp: "2026-07-10T09:00:00Z",
  },
  {
    id: "n2",
    title: "Library Book Due Reminder",
    message: "You have a book due for return within the next 3 days.",
    postedBy: randomFullName(),
    read: false,
    timestamp: "2026-07-11T14:30:00Z",
  },
  {
    id: "n3",
    title: "Fee Payment Received",
    message: "Your latest fee installment has been received and recorded.",
    postedBy: randomFullName(),
    read: true,
    timestamp: "2026-07-08T11:15:00Z",
  },
  {
    id: "n4",
    title: "Hostel Maintenance Notice",
    message: "Water supply will be interrupted in Block C on Sunday from 10am-2pm.",
    postedBy: randomFullName(),
    read: false,
    timestamp: "2026-07-12T08:00:00Z",
  },
  {
    id: "n5",
    title: "Exam Schedule Published",
    message: "The end-semester examination schedule has been published.",
    postedBy: randomFullName(),
    read: true,
    timestamp: "2026-07-07T16:45:00Z",
  },
  {
    id: "n6",
    title: "Placement Drive Announcement",
    message: "A new placement drive has been scheduled for final-year students.",
    postedBy: randomFullName(),
    read: true,
    timestamp: "2026-07-06T10:00:00Z",
  },
];
