/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC, TRPCError } from "@trpc/server";
// import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";
import { ZodError } from "zod";
import { env } from "~/env";

import { db } from "~/server/db";

import {
    calendar as CalendarClient,
    type calendar_v3,
} from "@googleapis/calendar";
import { gmail as GmailClient, type gmail_v1 } from "@googleapis/gmail";

import {
    clerkClient,
    auth as getAuth,
    type SignedInAuthObject,
    type SignedOutAuthObject,
} from "@clerk/nextjs/server";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */

interface AuthContext {
    auth: SignedInAuthObject | SignedOutAuthObject;
}

export const createContextInner = async ({ auth }: AuthContext) => {
    const calendar: calendar_v3.Calendar | null = null;
    const gmail: gmail_v1.Gmail | null = null;

    const session = await clerkClient.sessions.getSession(auth.sessionId ?? "");
    const user = await clerkClient.users.getUser(auth.userId ?? "");

    return {
        auth: { session, user },
        db,
        calendar,
        gmail,
    };
};
export const createTRPCContext = async (opts: { headers: Headers }) => {
    const innerContext = await createContextInner({ auth: getAuth() });

    return {
        ...innerContext,
        ...opts,
    };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError:
                    error.cause instanceof ZodError
                        ? error.cause.flatten()
                        : null,
            },
        };
    },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

/** Reusable middleware that enforces users are logged in before running the procedure. */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
    if (!ctx.auth.session || !ctx.auth.user) {
        throw new TRPCError({
            message: "NO SESSION/USER FOUND",
            code: "UNAUTHORIZED",
        });
    }
    return next({
        ctx: {
            // infers the `session` as non-nullable
            auth: {
                ...ctx.auth,
                session: ctx.auth.session,
                user: ctx.auth.user,
            },
        },
    });
});

/** Reusable middleware for piping a api clients to trpc procedures */
const googleApiMiddleware = t.middleware(async ({ ctx, next }) => {
    if (!ctx.auth.session || !ctx.auth.user) {
        throw new TRPCError({
            message: "NO SESSION/USER FOUND",
            code: "UNAUTHORIZED",
        });
    }
    const [OauthAccessToken] = await clerkClient.users.getUserOauthAccessToken(
        ctx.auth.user.id,
        "oauth_google",
    );

    const { token } = OauthAccessToken!;
    const calendar = CalendarClient({
        version: "v3",
        headers: { Authorization: `Bearer ${token}` },
        params: {
            calendarId: env.GOOGLE_CALENDAR_ID,
            order: "startTime",
        },
    });
    const gmail = GmailClient({
        version: "v1",
        headers: { Authorization: `Bearer ${token}` },
    });
    return next({
        ctx: {
            auth: {
                ...ctx.auth,
                session: ctx.auth.session,
                user: ctx.auth.user,
            },
            calendar,
            gmail,
        },
    });
});

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

/**
 * Protected Google API Procedure
 *
 * If you want to use a verified client of GoogleAPI, and also the session, use this. It verifies
 * the session and user, and provides clients built into the context instead of creating one on a
 * per route basis.
 */
export const protectedGapiProcedure = t.procedure.use(googleApiMiddleware);
