/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { TRPCError, type inferRouterOutputs } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { CmoEvent } from "~/lib/gcal/CmoEvent";

import {
  createTRPCRouter,
  protectedGapiProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { events, savedShifts, shifts, syncs } from "~/server/db/schema";

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

export const eventRouter = createTRPCRouter({
  getEvents: protectedGapiProcedure
    .input(
      z
        .object({
          start: z.date(),
          end: z.date(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const today = new Date();
      const start = input?.start.toISOString() ?? today.toISOString();
      const end = input?.end.toISOString() ?? undefined;
      const { data } = await ctx.calendar.events.list({
        timeMin: start,
        timeMax: end,
        orderBy: "startTime",
        singleEvents: true,
        maxResults: 500,
      });
      const gcalEvents = data.items;
      if (!gcalEvents) {
        throw new TRPCError({
          message: "FAILED TO GET GCAL EVENTS",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
      const res = gcalEvents.map((event) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { openShifts, filledShifts, allShifts, ...newEvent } =
          new CmoEvent(event);
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
  getEvent: protectedGapiProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const { data: gcalEvent } = await ctx.calendar.events.get({
        eventId: input,
      });
      if (!gcalEvent) {
        throw new TRPCError({
          message: "FAILED TO GET GCAL EVENT",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { openShifts, filledShifts, allShifts, ...newEvent } = new CmoEvent(
        gcalEvent,
      );
      const shifts = allShifts.map((shift) => {
        return {
          ...shift,
          isFilled: shift.filledBy !== null,
        };
      });

      return { ...newEvent, shifts };
    }),
  syncEvent: protectedProcedure
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
          .onDuplicateKeyUpdate({
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
        const newEvent = await trx.query.events.findFirst({
          where: eq(events.id, input.id),
        });

        return { ...newEvent, shifts: newShifts };
      });
    }),
  findEventsNotInDb: protectedGapiProcedure.query(async ({ ctx }) => {
    const ids = await ctx.db.select({ id: events.id }).from(events);
    const dbSet = new Set(ids.map((id) => id.id));
    const { data } = await ctx.calendar.events.list({
      timeMin: new Date("2023-08-01").toISOString(),
      orderBy: "startTime",
      singleEvents: true,
      maxResults: 500,
    });
    const gcalEvents = data.items;
    if (!gcalEvents) {
      throw new TRPCError({
        message: "FAILED TO GET GCAL EVENTS",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
    const res = gcalEvents
      .filter((gce) => !dbSet.has(gce.id ?? ""))
      .map((event) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { openShifts, filledShifts, allShifts, ...newEvent } =
          new CmoEvent(event);
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
  findUpdatedEvents: protectedGapiProcedure.query(async ({ ctx }) => {
    const [res] = await ctx.db
      .select({ date: syncs.lastSynced })
      .from(syncs)
      .orderBy(desc(syncs.lastSynced))
      .limit(1);
    console.log(res);
    if (!res) {
      throw new TRPCError({
        message: "FAILED TO GET LAST SYNC DATE",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
    const { data } = await ctx.calendar.events.list({
      updatedMin: res.date.toISOString(),
      orderBy: "updated",
      timeMin: res.date.toISOString(),
    });
    const gcalEvents = data.items;
    if (!gcalEvents) {
      throw new TRPCError({
        message: "FAILED TO GET GCAL EVENTS",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
    return gcalEvents
      .filter((event) => {
        const eventUpdated = new Date(event.updated ?? 0);
        return eventUpdated > res.date;
      })
      .map((event) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { openShifts, filledShifts, allShifts, ...newEvent } =
          new CmoEvent(event);
        const newAllShifts = allShifts.map((shift) => {
          return {
            ...shift,
            isFilled: shift.filledBy !== null,
          };
        });

        return { ...newEvent, shifts: newAllShifts };
      });
  }),
  saveShift: protectedProcedure
    .input(InputShift)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(savedShifts)
        .values({
          id: input.id,
          userId: ctx.auth.user.id,
          eventId: input.eventId,
          role: input.role,
          start: input.start,
          end: input.end,
        })
        .onDuplicateKeyUpdate({
          set: {
            userId: ctx.auth.user.id,
            eventId: input.eventId,
            role: input.role,
            start: input.start,
            end: input.end,
          },
        });
    }),
  getSavedShifts: protectedProcedure.query(async ({ ctx }) => {
    const shifts = await ctx.db
      .select()
      .from(savedShifts)
      .where(eq(savedShifts.userId, ctx.auth.user.id))
      .leftJoin(events, eq(events.id, savedShifts.eventId));
    return shifts;
  }),
});
export type EventRouter = typeof eventRouter;
export type EventsOutput = inferRouterOutputs<EventRouter>;
export type Event = EventsOutput["getEvent"];
export type Shift = EventsOutput["getEvent"]["shifts"][0];
