import { createContext, useContext, useState, type ReactNode } from "react";
import type { Role, User } from "@/types";

interface AuthState {
  role: Role;
  user: User;
  logout: () => void;
  setRole: (role: Role) => void;
}

const AuthContext = createContext<AuthState | null>(null);

const roleUserMap: Record<Role, User> = {
  admin: { id: "admin", name: "Admin User" },
  teacher: { id: "t1", name: "Prof. Sharma" },
  staff: { id: "sf1", name: "Rakesh Kumar" },
  student: { id: "stu1", name: "Aditya Verma" },
};

const validRoles: Role[] = ["admin", "teacher", "staff", "student"];

function detectRoleFromPath(): Role {
  const path = window.location.pathname.split("/")[1] ?? "";
  if (validRoles.includes(path as Role)) return path as Role;
  return (localStorage.getItem("college_erp_role") as Role) || "admin";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(detectRoleFromPath);

  const setRole = (r: Role) => {
    localStorage.setItem("college_erp_role", r);
    setRoleState(r);
  };

  const logout = () => {
    localStorage.removeItem("college_erp_role");
    setRoleState("admin");
  };

  const user = roleUserMap[role];

  return (
    <AuthContext.Provider value={{ role, user, logout, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
