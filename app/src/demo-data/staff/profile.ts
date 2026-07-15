import type { StaffProfile } from "@/types";

// The Assigner role represents the actually-logged-in operations
// supervisor (distinct from any of the 5 team members) — a singleton,
// same pattern as Admin/Teacher's own Profile singletons.
export const assignerProfile: StaffProfile = {
  name: "Admin User",
  email: "admin@kalnet.edu",
  department: "Operations",
  phone: "9812399999",
};
