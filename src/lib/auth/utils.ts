import { cache } from "react";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";

const IMPERSONATION_COOKIE_NAME = "impersonate-user";

/**
 * Mock user type used throughout the app when impersonating a user.
 */
export type MockUser = {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user";
  isAnonymous: false;
  searchNames: string[];
};

export type MockSession = {
  id: string;
  user: MockUser;
};

export type AuthSession = {
  session: MockSession | null;
  user: MockUser | null;
};

type DbUser = typeof users.$inferSelect;

const splitAltNames = (altNames?: string | null) =>
  altNames
    ? altNames
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
    : [];

/** Build a mock user from a db entry */
function dbUserToMockUser(user: DbUser): MockUser {
  const fullName = `${user.firstName} ${user.lastName}`;
  return {
    id: user.id,
    email: user.email,
    name: fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    role: "user",
    isAnonymous: false as const,
    searchNames: [fullName, ...splitAltNames(user.alternativeNames)],
  };
}

/**
 * Read impersonation cookie and return the corresponding mock user (server-side).
 * Cached per request so layout + page only do one cookie read and one DB lookup.
 */
export const getUserAuth = cache(async (): Promise<AuthSession> => {
  const cookieStore = await cookies();
  const email = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value;

  if (email) {
    try {
      const decoded = decodeURIComponent(email);
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, decoded))
        .limit(1);
      if (dbUser) {
        const user = dbUserToMockUser(dbUser);
        return { session: { id: `mock-session-${user.email}`, user }, user };
      }
    } catch {
      // ignore decode or lookup errors
    }
  }

  return { session: null, user: null };
});

/**
 * Get current impersonated user (server-side)
 */
export const getUser = async () => {
  const { user } = await getUserAuth();
  return user;
};

/**
 * Check if a user is being impersonated. Never redirects — this is a demo app.
 */
export const checkAuth = async () => {
  const { user } = await getUserAuth();
  // In demo mode we return the user or null — no redirects
  return user;
};

/**
 * In demo mode every impersonated user is treated as admin.
 */
export const checkAdmin = async () => {
  const user = await checkAuth();
  return user;
};

