export const userRoles = ["CLIENT", "RESTAURANT", "DELIVERY_DRIVER", "ADMIN"] as const;

export type UserRole = (typeof userRoles)[number];

export function canAccess(userRole: UserRole | undefined, allowedRoles: UserRole[]) {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

export { getDashboardPathByRole } from "@/lib/auth/redirects";
