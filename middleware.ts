import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

type UserRole = "CLIENT" | "RESTAURANT" | "DELIVERY_DRIVER" | "ADMIN";

function getDashboardPathByRole(role: UserRole) {
  if (role === "ADMIN") return "/admin";
  if (role === "RESTAURANT") return "/restaurant/dashboard";
  if (role === "DELIVERY_DRIVER") return "/driver/dashboard";
  return "/app";
}

const accessRules: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/app", roles: ["CLIENT", "ADMIN"] },
  { prefix: "/restaurant", roles: ["RESTAURANT", "ADMIN"] },
  { prefix: "/driver", roles: ["DELIVERY_DRIVER", "ADMIN"] },
  { prefix: "/admin", roles: ["ADMIN"] }
];

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role as UserRole | undefined;
    const pathname = req.nextUrl.pathname;
    const rule = accessRules.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
    if (!rule || !role || rule.roles.includes(role)) return NextResponse.next();
    return NextResponse.redirect(new URL(getDashboardPathByRole(role), req.url));
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token)
    },
    pages: {
      signIn: "/login"
    }
  }
);

export const config = {
  matcher: ["/app/:path*", "/restaurant/:path*", "/driver/:path*", "/admin/:path*"]
};
