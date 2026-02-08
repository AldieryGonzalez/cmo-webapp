import { auth } from "~/lib/auth/config";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Better Auth API Route Handler
 * 
 * Handles all authentication routes:
 * - POST /api/auth/sign-in/email
 * - POST /api/auth/sign-up/email
 * - POST /api/auth/sign-out
 * - GET /api/auth/session
 * - POST /api/auth/anonymous/link-account
 * - And more...
 */

export const { GET, POST } = toNextJsHandler(auth);
