import { simulateRequest } from "@/api/http";
import { users, getUserById } from "@/demo-data/people/users";
import type { AdminUser } from "@/types";

export function getUsers(): Promise<AdminUser[]> {
  return simulateRequest(users);
}

export function getUserByIdAsync(id: string): Promise<AdminUser | undefined> {
  return simulateRequest(getUserById(id));
}

export function addUser(entry: AdminUser): Promise<AdminUser> {
  users.unshift(entry);
  return simulateRequest(entry);
}

export function updateUser(id: string, updates: Partial<AdminUser>): Promise<AdminUser | undefined> {
  const idx = users.findIndex((u) => u.id === id);
  if (idx !== -1) users[idx] = { ...users[idx], ...updates };
  return simulateRequest(users[idx]);
}
