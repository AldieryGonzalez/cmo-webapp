/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { type calendar_v3 } from "@googleapis/calendar";
import { TRPCError, type inferRouterOutputs } from "@trpc/server";
import { cache } from "react";
import { eachMonthOfInterval, endOfMonth } from "date-fns";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { env } from "~/env";
import { CmoEvent } from "~/lib/gcal/CmoEvent";
import { getQueryDate } from "~/lib/dates/utils";

import {
    createTRPCRouter,
    publicProcedure,
    anonymousProcedure,
    adminProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";
import { events, savedShifts, shifts, syncs, users } from "~/server/db/schema";
import { mockListEvents, mockGetEvent } from "~/lib/gcal/mock";
import { buildUserLookup } from "~/lib/users/lookup";

/** Cached per request so getEvents and getEvent only load the users table once. */
const getCachedUserRowsForLookup = cache(async (dbInstance: typeof db) => {
    return dbInstance
        .select({
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            alternativeNames: users.alternativeNames,
        })
        .from(users);
});

const InputShift = z.object({
    isFilled: z.boolean(),
    id: z.string().optional(),
    eventId: z.string(),
    filledBy: z.string().nullable(),
    user: z.string().nullable(),
    role: z.string(),
    start: z.date(),
    end: z.date(),
    confirmationNote: z.string().nullable(),
    cancelled: z.boolean(),
});
const InputEvent = z.object({
    title: z.string(),
    location: z.string(),
    id: z.string(),
    creator: z.string(),
    updated: z.date(),
    created: z.date(),
    start: z.date(),
    end: z.date(),
    notes: z.string(),
    shifts: z.array(InputShift),
    cancelled: z.boolean(),
});

interface FreeBusyCalendar extends calendar_v3.Schema$FreeBusyCalendar {
    name: string;
}

type UserEventShift = {
    id: string;
    eventId: string;
    role: string;
    start: Date;
    end: Date;
    user: string | null;
    filledBy: string | null;
    confirmationNote: string | null;
    cancelled: boolean;
    isFilled: boolean;
};

type UserEvent = {
    id: string;
    title: string;
    location: string;
    notes: string;
    creator: string;
    updated: Date;
    created: Date;
    start: Date;
    end: Date;
    cancelled: boolean;
    shifts: UserEventShift[];
};

export const eventRouter = createTRPCRouter({
    getEvents: publicProcedure
        .input(
            z
                .object({
                    start: z.date(),
                    end: z.date(),
                })
                .optional(),
        )
        .query(async ({ input, ctx }) => {
            const today = await getQueryDate();
            const start = input?.start.toISOString() ?? today.toISOString();
            const end = input?.end.toISOString() ?? undefined;
            const { data } = await mockListEvents({
                timeMin: start,
                timeMax: end,
                orderBy: "startTime",
                singleEvents: true,
                maxResults: 500,
            });
            const gcalEvents = data.items;
            if (!gcalEvents) {
                throw new TRPCError({
                    message: "FAILED TO GET EVENTS",
                    code: "INTERNAL_SERVER_ERROR",
                });
            }
            const userRows = await getCachedUserRowsForLookup(ctx.db);
            const userLookup = buildUserLookup(userRows);
            const res = gcalEvents.map((event) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { openShifts, filledShifts, allShifts, ...newEvent } =
                    new CmoEvent(event, userLookup);
                const shifts = allShifts.map((shift) => {
                    return {
                        ...shift,
                        isFilled: shift.filledBy !== null,
                    };
                });

                return { ...newEvent, shifts: shifts };
            });
            return res;
        }),
    getUserEvents: publicProcedure
        .input(
            z.object({
                userEmail: z.string().email(),
                start: z.date(),
                end: z.date().optional(),
            }),
        )
        .query(async ({ input, ctx }) => {
            const conditions = [
                eq(shifts.userEmail, input.userEmail),
                gte(events.start, input.start),
            ];
            if (input.end) {
                conditions.push(lte(events.end, input.end));
            }

            const rows = await ctx.db
                .select({
                    eventId: events.id,
                    eventTitle: events.title,
                    eventLocation: events.location,
                    eventNotes: events.notes,
                    eventCreator: events.createdByEmail,
                    eventUpdated: events.updatedAt,
                    eventCreated: events.createdAt,
                    eventStart: events.start,
                    eventEnd: events.end,
                    eventCancelled: events.cancelled,
                    shiftId: shifts.id,
                    shiftRole: shifts.role,
                    shiftStart: shifts.start,
                    shiftEnd: shifts.end,
                    shiftUserEmail: shifts.userEmail,
                    shiftFilledBy: shifts.filledBy,
                    shiftConfirmationNote: shifts.confirmationNote,
                    shiftCancelled: shifts.cancelled,
                })
                .from(shifts)
                .innerJoin(events, eq(shifts.eventId, events.id))
                .where(and(...conditions))
                .orderBy(asc(events.start), asc(shifts.start));

            const eventMap = new Map<string, UserEvent>();
            for (const row of rows) {
                const existing = eventMap.get(row.eventId);
                const event =
                    existing ??
                    ({
                        id: row.eventId,
                        title: row.eventTitle,
                        location: row.eventLocation,
                        notes: row.eventNotes ?? "",
                        creator: row.eventCreator,
                        updated: row.eventUpdated,
                        created: row.eventCreated,
                        start: row.eventStart,
                        end: row.eventEnd,
                        cancelled: row.eventCancelled ?? false,
                        shifts: [],
                    } satisfies UserEvent);

                event.shifts.push({
                    id: row.shiftId,
                    eventId: row.eventId,
                    role: row.shiftRole,
                    start: row.shiftStart,
                    end: row.shiftEnd,
                    user: row.shiftUserEmail,
                    filledBy: row.shiftFilledBy,
                    confirmationNote: row.shiftConfirmationNote,
                    cancelled: row.shiftCancelled ?? false,
                    isFilled: row.shiftFilledBy !== null,
                });

                if (!existing) {
                    eventMap.set(row.eventId, event);
                }
            }

            return Array.from(eventMap.values());
        }),
    getEvent: publicProcedure
        .input(z.string())
        .query(async ({ input, ctx }) => {
            const { data: gcalEvent } = await mockGetEvent(input);
            if (!gcalEvent) {
                throw new TRPCError({
                    message: "FAILED TO GET EVENT",
                    code: "INTERNAL_SERVER_ERROR",
                });
            }
            const userRows = await getCachedUserRowsForLookup(ctx.db);
            const userLookup = buildUserLookup(userRows);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { openShifts, filledShifts, allShifts, ...newEvent } =
                new CmoEvent(gcalEvent, userLookup);
            const shifts = allShifts.map((shift) => {
                return {
                    ...shift,
                    isFilled: shift.filledBy !== null,
                };
            });

            return { ...newEvent, shifts };
        }),
    syncEvent: adminProcedure
        .input(InputEvent)
        .mutation(async ({ ctx, input }) => {
            return await ctx.db.transaction(async (trx) => {
                // Sync the event itself
                await trx
                    .insert(events)
                    .values({
                        id: input.id,
                        title: input.title,
                        createdByEmail: input.creator,
                        location: input.location,
                        notes: input.notes,
                        createdAt: input.created,
                        updatedAt: input.updated,
                        start: input.start,
                        end: input.end,
                        cancelled: input.cancelled,
                        syncedAt: new Date(),
                    })
                    .onConflictDoUpdate({
                        target: events.id,
                        set: {
                            title: input.title,
                            createdByEmail: input.creator,
                            location: input.location,
                            notes: input.notes,
                            createdAt: input.created,
                            updatedAt: input.updated,
                            start: input.start,
                            end: input.end,
                            cancelled: input.cancelled,
                            syncedAt: new Date(),
                        },
                    });
                // Delete all shifts for this event
                await trx.delete(shifts).where(eq(shifts.eventId, input.id));
                // Sync the shifts
                if (input.shifts.length > 0) {
                    await trx.insert(shifts).values(
                        input.shifts.map((shift) => {
                            return {
                                eventId: shift.eventId,
                                role: shift.role,
                                start: shift.start,
                                end: shift.end,
                                userEmail: shift.user,
                                filledBy: shift.filledBy,
                                confirmationNote: shift.confirmationNote,
                                cancelled: shift.cancelled,
                            };
                        }),
                    );
                }
                const newShifts = await trx
                    .select()
                    .from(shifts)
                    .where(eq(shifts.eventId, input.id));
                const newEvent = await trx
                    .select()
                    .from(events)
                    .where(eq(events.id, input.id))
                    .limit(1);

                return { ...newEvent, shifts: newShifts };
            });
        }),
    findEventsNotInDb: adminProcedure.query(async ({ ctx }) => {
        const ids = await ctx.db.select({ id: events.id }).from(events);
        const dbSet = new Set(ids.map((id) => id.id));
        const { data } = await mockListEvents({
            timeMin: new Date("2024-02-01").toISOString(),
            orderBy: "startTime",
            singleEvents: true,
            maxResults: 500,
        });
        const gcalEvents = data.items;
        if (!gcalEvents) {
            throw new TRPCError({
                message: "FAILED TO GET EVENTS",
                code: "INTERNAL_SERVER_ERROR",
            });
        }
        const userRows = await ctx.db
            .select({
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
                alternativeNames: users.alternativeNames,
            })
            .from(users);
        const userLookup = buildUserLookup(userRows);
        const res = gcalEvents
            .filter((gce) => !dbSet.has(gce.id ?? ""))
            .map((event) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { openShifts, filledShifts, allShifts, ...newEvent } =
                    new CmoEvent(event, userLookup);
                const newAllShifts = allShifts.map((shift) => {
                    return {
                        ...shift,
                        isFilled: shift.filledBy !== null,
                    };
                });

                return { ...newEvent, shifts: newAllShifts };
            });
        return res;
    }),
    findUpdatedEvents: adminProcedure.query(async ({ ctx }) => {
        const [res] = await ctx.db
            .select({ date: syncs.lastSynced })
            .from(syncs)
            .orderBy(desc(syncs.lastSynced))
            .limit(1);
        if (!res) {
            throw new TRPCError({
                message: "FAILED TO GET LAST SYNC DATE",
                code: "INTERNAL_SERVER_ERROR",
            });
        }
        const { data } = await mockListEvents({
            orderBy: "updated",
            timeMin: res.date.toISOString(),
        });
        const gcalEvents = data.items;
        if (!gcalEvents) {
            throw new TRPCError({
                message: "FAILED TO GET EVENTS",
                code: "INTERNAL_SERVER_ERROR",
            });
        }
        const userRows = await ctx.db
            .select({
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
                alternativeNames: users.alternativeNames,
            })
            .from(users);
        const userLookup = buildUserLookup(userRows);
        return gcalEvents
            .filter((event) => {
                const eventUpdated = new Date(event.updated ?? 0);
                return eventUpdated > res.date;
            })
            .map((event) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { openShifts, filledShifts, allShifts, ...newEvent } =
                    new CmoEvent(event, userLookup);
                const newAllShifts = allShifts.map((shift) => {
                    return {
                        ...shift,
                        isFilled: shift.filledBy !== null,
                    };
                });

                return { ...newEvent, shifts: newAllShifts };
            });
    }),
    saveShift: anonymousProcedure
        .input(InputShift)
        .mutation(async ({ ctx, input }) => {
            if (!ctx.auth.session) {
                throw new TRPCError({
                    message: "NO SESSION FOUND",
                    code: "UNAUTHORIZED",
                });
            }
            
            await ctx.db
                .insert(savedShifts)
                .values({
                    id: input.id,
                    sessionId: ctx.auth.session.id,
                    eventId: input.eventId,
                    role: input.role,
                    start: input.start,
                    end: input.end,
                })
                .onConflictDoUpdate({
                    target: savedShifts.id,
                    set: {
                        sessionId: ctx.auth.session.id,
                        eventId: input.eventId,
                        role: input.role,
                        start: input.start,
                        end: input.end,
                    },
                });
        }),
    getSavedShifts: anonymousProcedure.query(async ({ ctx }) => {
        if (!ctx.auth.session) {
            return [];
        }
        
        const shifts = await ctx.db
            .select()
            .from(savedShifts)
            .where(eq(savedShifts.sessionId, ctx.auth.session.id))
            .leftJoin(events, eq(events.id, savedShifts.eventId))
            .orderBy(asc(savedShifts.start));
        return shifts;
    }),
    deleteSavedShifts: anonymousProcedure
        .input(z.array(z.string()))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.auth.session) {
                throw new TRPCError({
                    message: "NO SESSION FOUND",
                    code: "UNAUTHORIZED",
                });
            }
            
            for (const id of input) {
                await ctx.db
                    .delete(savedShifts)
                    .where(
                        and(
                            eq(savedShifts.sessionId, ctx.auth.session.id),
                            eq(savedShifts.id, id),
                        ),
                    );
            }
        }),
    freeBusy: publicProcedure
        .input(
            z.object({
                start: z.date(),
                end: z.date(),
            }),
        )
        .query(async () => {
            // Return empty freebusy for portfolio version
            return {
                calendars: [] as string[],
                busy: {} as Record<string, { start: Date, end: Date }[]>,
            };
        }),
});
export type EventRouter = typeof eventRouter;
export type EventsOutput = inferRouterOutputs<EventRouter>;
export type Event = EventsOutput["getEvent"];
export type Shift = EventsOutput["getEvent"]["shifts"][0];
