import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { createHash } from "crypto";
import { prisma } from "./lib/prisma";

/**
 * Auth.js refuses to run without a secret. Use AUTH_SECRET (or the older NEXTAUTH_SECRET) when set.
 * Preview deployments only: if neither is set, derive a private secret from other server-side
 * secrets so a missing variable cannot take the whole preview down. Production never falls back,
 * so a missing secret there still fails loudly.
 */
function authSecret(): string | undefined {
  const explicit = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (explicit) return explicit;
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV) return undefined;
  const seed = [process.env.DATABASE_URL, process.env.AUTH_GOOGLE_SECRET, process.env.UPSTASH_REDIS_REST_TOKEN, process.env.DEEPSEEK_API_KEY]
    .filter(Boolean)
    .join("|");
  return createHash("sha256").update(`preview-auth-secret:${seed || "no-secrets-set"}`).digest("hex");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret(),
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
});