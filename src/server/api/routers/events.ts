/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { TRPCError, type inferRouterOutputs } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { CmoEvent } from "~/lib/gcal/CmoEvent";

import {
  createTRPCRouter,
  protectedGapiProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { events, shifts } from "~/server/db/schema";

const InputShift = z.object({
  isFilled: z.boolean(),
  id: z.string(),
  eventId: z.string(),
  filledBy: z.string().optional(),
  user: z.string().optional(),
  role: z.string(),
  start: z.date(),
  end: z.date(),
  confirmationNote: z.string().optional(),
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
              syncedAt: new Date(),
            },
          });
        // Delete all shifts for this event
        await trx.delete(shifts).where(eq(shifts.eventId, input.id));
        // Sync the shifts
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
            };
          }),
        );
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
  // saveShift: protectedProcedure.input(z.object({isFilled: z.boolean(),
  //   id: z.string(),
  //   eventId: z.string(),
  //   filledBy: z.string().optional(),
  //   user: z.string().optional(),
  //   role: z.string(),
  //   start: z.date(),
  //   end: z.date(),
  //   confirmationNote: z.string()})).mutation(async ({ ctx, input }) => {
  //   const res = await ctx.db.insert()
});
export type EventRouter = typeof eventRouter;
export type EventsOutput = inferRouterOutputs<EventRouter>;
export type Event = EventsOutput["getEvent"];
export type Shift = EventsOutput["getEvent"]["shifts"][0];
