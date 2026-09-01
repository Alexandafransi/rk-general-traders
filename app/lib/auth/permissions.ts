import type { RoleDef, RoleKey } from "../../dashboard/types";

export const FIXED_ROLES = ["superadmin", "admin"] as const;

// Mirrors ALLOWED_MODULES in ops/permissions.py — the full set of module
// keys a dynamic Role can be granted. "accounts" (login-account registry)
// and role management itself stay hardcoded to admin/superadmin.
export const ALLOWED_MODULES = [
  "dashboard", "branches", "jobs", "leads", "customers", "staff", "payroll",
  "finance", "sales", "purchases", "inventory", "expenses", "suppliers", "categories",
];

export function buildRoleModulesMap(roles: RoleDef[]): Record<string, string[]> {
  return Object.fromEntries(roles.map((r) => [r.key, r.modules]));
}

export function canAccessModule(role: RoleKey | undefined, roleModulesMap: Record<string, string[]>, module: string) {
  if (!role) return false;
  if (role === "superadmin" || role === "admin") return true;
  return roleModulesMap[role]?.includes(module) ?? false;
}

// Which role keys `currentRole` may hand out when registering/editing other
// accounts — mirrors assignable_roles_for() in ops/permissions.py.
export function assignableRoles(currentRole: RoleKey | undefined, roles: RoleDef[]): RoleKey[] {
  const dynamicKeys = roles.map((r) => r.key);
  if (currentRole === "superadmin") return ["superadmin", "admin", ...dynamicKeys];
  if (currentRole === "admin") return dynamicKeys;
  return [];
}
