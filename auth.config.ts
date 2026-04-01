import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }: any) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnAttendance = nextUrl.pathname.startsWith("/attendance") || nextUrl.pathname.startsWith("/check-in");
      const isOnApiAttendance = nextUrl.pathname.startsWith("/api/attendance");

      if (isOnAdmin) {
        if (isLoggedIn && (auth?.user as any)?.role === "ADMIN") return true;
        if (isLoggedIn) return Response.redirect(new URL("/check-in", nextUrl));
        return false; // Redirect to login
      }

      if (isOnAttendance || isOnApiAttendance) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }

      if (isLoggedIn && nextUrl.pathname === "/login") {
        const dest = (auth?.user as any)?.role === "ADMIN" ? "/admin/dashboard" : "/check-in";
        return Response.redirect(new URL(dest, nextUrl));
      }

      return true;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.branchId = user.branchId;
        token.branchName = user.branchName;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.branchId = token.branchId;
        session.user.branchName = token.branchName;
      }
      return session;
    },
  },
  providers: [], // Add providers in auth.ts
} satisfies NextAuthConfig;
