import { createContext, useContext, useState } from "react";
import type { TeacherRole } from "@/types";

const STORAGE_KEY = "college_erp_teacher_role";

interface TeacherRoleContextType {
  role: TeacherRole;
  setRole: (role: TeacherRole) => void;
}

export const TeacherRoleContext = createContext<TeacherRoleContextType>({
  role: "professor",
  setRole: () => {},
});

export function useTeacherRoleState() {
  const [role, setRoleState] = useState<TeacherRole>(() => (localStorage.getItem(STORAGE_KEY) as TeacherRole) || "professor");
  const setRole = (r: TeacherRole) => {
    localStorage.setItem(STORAGE_KEY, r);
    setRoleState(r);
  };
  return { role, setRole };
}

export const useTeacherRole = () => useContext(TeacherRoleContext);
