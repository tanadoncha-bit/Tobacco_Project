import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

const routePermissions = [
  { path: "/admin/Financial", roles: ["ADMIN", "MANAGER"] },
  { path: "/admin/history", roles: ["ADMIN", "MANAGER"] },
  { path: "/admin/SaleItem", roles: ["ADMIN", "STAFF", "MANAGER"] },
  { path: "/admin/Stock", roles: ["ADMIN", "STAFF", "MANAGER"] },
  { path: "/admin/Material", roles: ["ADMIN", "STAFF", "MANAGER"] },
  { path: "/admin/employees", roles: ["ADMIN"] },
  { path: "/admin/settings", roles: ["ADMIN"] },
  { path: "/admin", roles: ["ADMIN", "STAFF", "MANAGER"] },
]

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    const userRole = token?.role as string

    const basicAdminRoles = ["ADMIN", "STAFF", "MANAGER"] 

    if (path.startsWith("/admin")) {
      if (!basicAdminRoles.includes(userRole)) {
        return NextResponse.redirect(new URL("/user", req.url))
      }

      const matchedRoute = routePermissions
        .sort((a, b) => b.path.length - a.path.length)
        .find((route) => path.startsWith(route.path))

      if (matchedRoute) {
        if (!matchedRoute.roles.includes(userRole)) {
          return NextResponse.redirect(new URL("/admin", req.url))
        }
      }
    }

    if (path.startsWith("/user")) {
      if (basicAdminRoles.includes(userRole)) {
        return NextResponse.redirect(new URL("/admin", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    "/admin/:path*",
    "/user/OrderStatue/:path*",
    "/user/ShoppingCart/:path*"
  ],
}