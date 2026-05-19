import type { UserRole } from "@/lib/auth/roles";

export function getDashboardPathByRole(role?: UserRole | null) {
  if (role === "ADMIN") return "/admin";
  if (role === "RESTAURANT") return "/restaurant/dashboard";
  if (role === "DELIVERY_DRIVER") return "/driver/dashboard";
  return "/app";
}
