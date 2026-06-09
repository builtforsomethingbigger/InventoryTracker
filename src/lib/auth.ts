import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) token.id = user.id;
      if (token.id && (user || trigger === "update")) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { setupComplete: true, spreadsheetId: true },
        });
        token.setupComplete = dbUser?.setupComplete ?? false;
        token.spreadsheetId = dbUser?.spreadsheetId ?? null;
      }
      return token;
    },
  },
});
