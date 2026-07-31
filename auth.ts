import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compareSync } from "bcrypt-ts-edge";
import { cookies } from "next/headers";
import authConfig from "@/auth.config";
import prisma from "./db/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: authConfig.session,
  pages: authConfig.pages,
  providers: [
    ...authConfig.providers,
    CredentialsProvider({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (credentials == null) return null;
        const user = await prisma.user.findFirst({
          where: { email: credentials.email as string },
        });

        if (user && user.password) {
          const isMatch = compareSync(
            credentials.password as string,
            user.password,
          );
          if (isMatch) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          }
          return null;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt(args: any) {
      // 先执行 auth.config.ts 中的基础 jwt 回调
      const token = await authConfig.callbacks!.jwt!(args);

      // 登录时：合并匿名购物车到登录用户
      if (args.trigger === "signIn" || args.trigger === "signUp") {
        const cookieObject = await cookies();
        const sessionCartId = cookieObject.get("sessionCartId")?.value;
        if (sessionCartId) {
          const sessionCart = await prisma.cart.findFirst({
            where: { sessionCartId },
          });
          if (sessionCart) {
            // 删掉用户已有的购物车（如果有），用匿名购物车替换
            await prisma.cart.deleteMany({
              where: { userId: args.user.id },
            });
            // 把匿名购物车绑定到登录用户
            await prisma.cart.update({
              where: { id: sessionCart.id },
              data: { userId: args.user.id },
            });
          }
        }
      }

      return token;
    },
    async session(args: any) {
      return authConfig.callbacks!.session!(args);
    },
  },
});
