/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { TRPCError, type inferRouterOutputs } from "@trpc/server";
import { z } from "zod";
import { CmoEvent } from "~/lib/gcal/CmoEvent";
import type { Event } from "~/lib/events/utils";

import {
  createTRPCRouter,
  protectedGapiProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { events } from "~/server/db/schema";

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
    .input(
      z.object({
        title: z.string(),
        location: z.string(),
        id: z.string(),
        creator: z.string(),
        updated: z.date(),
        created: z.date(),
        start: z.date(),
        end: z.date(),
        notes: z.string(),
        shifts: z.array(
          z.object({
            isFilled: z.boolean(),
            id: z.string(),
            eventId: z.string(),
            filledBy: z.string().optional(),
            user: z.string().optional(),
            role: z.string(),
            start: z.date(),
            end: z.date(),
            confirmationNote: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (trx) => {});
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
