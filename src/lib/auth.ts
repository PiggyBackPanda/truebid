import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Rate limit login attempts per email address (20 per 15 minutes)
        const { success } = await rateLimit(`login:${email.toLowerCase()}`, 20, 900);
        if (!success) return null; // NextAuth maps null to CredentialsSignin error

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            firstName: true,
            lastName: true,
            role: true,
            verificationStatus: true,
            publicAlias: true,
            avatarUrl: true,
          },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          verificationStatus: user.verificationStatus,
          publicAlias: user.publicAlias,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as Record<string, unknown>;
        token.id = user.id;
        token.firstName = u.firstName as string;
        token.lastName = u.lastName as string;
        token.role = u.role as string;
        token.verificationStatus = u.verificationStatus as string;
        token.publicAlias = u.publicAlias as string;
      }
      // If user data is not being set for the first time, re-fetch mutable fields
      if (!user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { passwordChangedAt: true, verificationStatus: true, role: true },
        });
        if (dbUser?.passwordChangedAt) {
          const changedAt = dbUser.passwordChangedAt.getTime() / 1000;
          const issuedAt = token.iat as number | undefined;
          if (issuedAt && changedAt > issuedAt) {
            // Password was changed after this token was issued, invalidating it
            return {} as typeof token;
          }
        }
        // Sync verificationStatus and role so changes (e.g. dev bypass) take effect immediately
        if (dbUser) {
          token.verificationStatus = dbUser.verificationStatus;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Token was invalidated (empty): return null-like session
      if (!token.id) {
        return { ...session, user: undefined as unknown as typeof session.user };
      }
      if (token && session.user) {
        const u = session.user as unknown as Record<string, unknown>;
        u.id = token.id as string;
        u.firstName = token.firstName;
        u.lastName = token.lastName;
        u.role = token.role;
        u.verificationStatus = token.verificationStatus;
        u.publicAlias = token.publicAlias;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
};
