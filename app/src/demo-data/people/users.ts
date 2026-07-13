import type { AdminUser, UserRole, AccountStatus } from "@/types";
import { randomFullName } from "@/demo-data/generators/namePools";
import { pick, randomInt, weightedPick } from "@/demo-data/generators/random";
import { departmentSeeds } from "@/demo-data/academics/departmentSeeds";

const roles: [UserRole, number][] = [
  ["faculty", 5],
  ["staff", 3],
  ["admin", 1],
  ["student", 2],
];

const USER_COUNT = 40;

function generateUsers(): AdminUser[] {
  const list: AdminUser[] = [];
  for (let i = 1; i <= USER_COUNT; i++) {
    const status: AccountStatus = weightedPick([["active", 9], ["inactive", 1]]);
    list.push({
      id: `USR-${String(i).padStart(3, "0")}`,
      name: randomFullName(),
      role: weightedPick(roles),
      departmentId: pick(departmentSeeds).id,
      email: `user${i}@kalnet.edu`,
      phone: `9${randomInt(100000000, 999999999)}`,
      employeeId: `EMP-${randomInt(1000, 9999)}`,
      status,
      lastLogin: `2026-07-${String(randomInt(1, 13)).padStart(2, "0")}T${String(randomInt(8, 18)).padStart(2, "0")}:${String(randomInt(0, 59)).padStart(2, "0")}:00Z`,
    });
  }
  return list;
}

export const users: AdminUser[] = generateUsers();

export function getUserById(id: string): AdminUser | undefined {
  return users.find((u) => u.id === id);
}
