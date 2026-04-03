import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          console.log(`[AUTH-DEBUG] Attempting login for email: ${credentials.email}`);
          
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            include: { branch: true },
          });

          if (!user) {
            console.log(`[AUTH-DEBUG] User not found for email: ${credentials.email}`);
            return null;
          }

          if (!user.password) {
            console.log(`[AUTH-DEBUG] User found but has no password set.`);
            return null;
          }

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          console.log(`[AUTH-DEBUG] Password check for ${credentials.email}: ${isPasswordCorrect ? 'MATCHED' : 'FAILED'}`);

          if (!isPasswordCorrect) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            branchId: user.branchId,
            branchName: user.branch?.name,
          };
        } catch (error: any) {
          console.error("[AUTH-ERR] Database or logic error:", error);
          return null; 
        }
      },
    }),
  ],
});
