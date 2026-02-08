/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { db } from "~/server/db";
import { getUserAuth, type MockUser, type MockSession } from "~/lib/auth/utils";

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
    session: MockSession | null;
    user: MockUser | null;
}

export const createContextInner = async (authContext: AuthContext) => {
    return {
        auth: authContext,
        db,
    };
};

export const createTRPCContext = async (opts: { headers: Headers }) => {
    // Get impersonated user from cookie
    const { session, user } = await getUserAuth();

    const innerContext = await createContextInner({
        session: session ?? null,
        user: user ?? null,
    });

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

/**
 * Anonymous procedure
 * 
 * In demo mode this is the same as public — everyone is allowed.
 */
export const anonymousProcedure = t.procedure;

/**
 * Authenticated procedure
 * 
 * In demo mode we still enforce that an impersonated user has been selected.
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
    if (!ctx.auth.user) {
        throw new TRPCError({
            message: "NO IMPERSONATED USER SELECTED",
            code: "UNAUTHORIZED",
        });
    }

    return next({
        ctx: {
            auth: {
                session: ctx.auth.session!,
                user: ctx.auth.user,
            },
        },
    });
});

export const authenticatedProcedure = t.procedure.use(enforceUserIsAuthed);

/**
 * Admin procedure
 * 
 * In demo mode every impersonated user is treated as admin.
 */
const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
    if (!ctx.auth.user) {
        throw new TRPCError({
            message: "NO IMPERSONATED USER SELECTED",
            code: "UNAUTHORIZED",
        });
    }

    return next({
        ctx: {
            auth: {
                session: ctx.auth.session!,
                user: ctx.auth.user,
            },
        },
    });
});

export const adminProcedure = t.procedure.use(enforceUserIsAdmin);

/**
 * Protected procedure (for backwards compatibility)
 * 
 * Same as authenticatedProcedure
 */
export const protectedProcedure = authenticatedProcedure;

/**
 * Legacy: protectedGapiProcedure (now admin-only without Google API)
 * 
 * Used to provide Google API clients, now just admin access
 */
export const protectedGapiProcedure = adminProcedure;
