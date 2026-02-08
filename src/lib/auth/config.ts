import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins";
import { db } from "~/server/db";
import { env } from "~/env";

/**
 * Better Auth Configuration
 * 
 * This replaces Clerk authentication with:
 * - Admin credentials login
 * - Anonymous sessions for cart functionality
 * - Database-backed session management
 */

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },

  // Enable anonymous sessions for cart functionality
  plugins: [
    anonymous(),
  ],

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // Admin user configuration
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
      },
    },
  },


  // Base URL for auth routes
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: env.BETTER_AUTH_SECRET,

  // Trusted origins
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
