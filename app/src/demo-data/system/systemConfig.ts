import type { SystemConfig } from "@/types";

export const systemConfigDefaults: SystemConfig = {
  institutionName: "KALNET College of Engineering",
  institutionCode: "INST-2026-001",
  email: "admin@kalnet.edu",
  phone: "+91 123 456 7890",
  academicYear: "2026-2027",
  currentTerm: "Odd Semester",
  minAttendancePct: 75,
  passingGrade: "40%",
  emailNotifications: true,
  smsNotifications: true,
  twoFactorAuth: false,
  autoBackup: true,
};

export const systemConfig: SystemConfig = { ...systemConfigDefaults };
