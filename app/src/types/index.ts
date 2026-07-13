export type Role = "admin" | "teacher" | "staff" | "student";

export interface User {
  id: string;
  name: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  postedBy: string;
  read: boolean;
  timestamp: string;
}
