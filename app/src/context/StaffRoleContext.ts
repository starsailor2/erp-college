import { createContext, useContext, useState } from "react";
import type { StaffRole } from "@/types";

const STORAGE_KEY = "college_erp_staff_role";

interface StaffRoleContextType {
  role: StaffRole;
  setRole: (role: StaffRole) => void;
}

export const StaffRoleContext = createContext<StaffRoleContextType>({
  role: "assigner",
  setRole: () => {},
});

export function useStaffRoleState() {
  const [role, setRoleState] = useState<StaffRole>(() => (localStorage.getItem(STORAGE_KEY) as StaffRole) || "assigner");
  const setRole = (r: StaffRole) => {
    localStorage.setItem(STORAGE_KEY, r);
    setRoleState(r);
  };
  return { role, setRole };
}

export const useStaffRole = () => useContext(StaffRoleContext);
