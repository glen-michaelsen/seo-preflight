import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

const protectedPaths = ["/dashboard", "/profiles", "/settings"];
const authPaths = ["/login", "/register"];

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = protectedPaths.some((p) =>
        nextUrl.pathname.startsWith(p)
      );
      const isAuthPage = authPaths.some((p) =>
        nextUrl.pathname.startsWith(p)
      );

      if (isProtected && !isLoggedIn) {
        const url = nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("callbackUrl", nextUrl.pathname);
        return NextResponse.redirect(url);
      }

      if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
      }

      return NextResponse.next();
    },
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
  providers: [], // Credentials provider added in auth.ts (Node.js only)
};
