import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "./db/db";

export default {
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  providers: [GitHub, Google],
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      // 首次登录：将 user.id、user.role 写入 JWT
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      // 用户更新资料时，同步新的 name 到 JWT
      if (trigger === "update" && session) {
        token.name = session.user.name;
      }
      if (trigger === "signIn" || trigger === "signUp") {
        const cookieObject = await cookies();
        const sessionCartId = cookieObject.get("sessionCartId")?.value;
        if (sessionCartId) {
          const sessionCart = await prisma.cart.findFirst({
            where: {
              id: sessionCartId,
            },
          });
          if (sessionCart) {
            await prisma.cart.deleteMany({
              where: {
                userId: user.id,
              },
            });
            await prisma.cart.update({
              where: {
                id: sessionCartId,
              },
              data: {
                userId: user.id,
              },
            });
          }
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      // 每次读取 session 时，从 JWT 把自定义字段注入 session.user
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.sub = token.sub as string;
      }
      return session;
    },
    authorized({ request }: any) {
      if (!request.cookies.get("sessionCartId")) {
        const sessionCartId = crypto.randomUUID();
        const newRequestHeaders = new Headers(request.headers);
        const response = NextResponse.next({
          request: {
            headers: newRequestHeaders,
          },
        });
        response.cookies.set("sessionCartId", sessionCartId);
        return response;
      } else {
        return true;
      }
    },
  },
} satisfies NextAuthConfig;
