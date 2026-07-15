import type { AppSettings } from "@/types";

export const appSettingsDefaults: AppSettings = {
  compactView: false,
  animations: true,
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  collegeName: "KALNET College of Engineering",
  academicYear: "2026-2027",
  semester: "Odd Semester",
  language: "English",
  timezone: "IST (UTC+5:30)",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24 Hour",
  twoFactorAuth: false,
  sessionTimeout: true,
  loginAlerts: true,
  autoBackup: true,
  dataRetention: true,
};

export const appSettings: AppSettings = { ...appSettingsDefaults };
