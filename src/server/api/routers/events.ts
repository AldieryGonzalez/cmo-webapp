/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { TRPCError, type inferRouterOutputs } from "@trpc/server";
import { z } from "zod";
import { CmoEvent } from "~/lib/gcal/CmoEvent";

import { createTRPCRouter, protectedGapiProcedure } from "~/server/api/trpc";
// import { events, shifts } from "~/server/db/schema";

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
      const today = new Date("2023-06-01");
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
  getApiEvents: protectedGapiProcedure
    .input(
      z.object({
        start: z.date().default(new Date()),
        end: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const start = input.start.toISOString();
      const end = input.end?.toISOString() ?? undefined;
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
      const res = [];
      for (const event of gcalEvents) {
        const { ...newEvent } = new CmoEvent(event);
        const eventShifts = newEvent.allShifts.map((shift) => {
          return {
            ...shift,
            isFilled: shift.filledBy !== null,
          };
        });
        res.push({ event: newEvent, shifts: eventShifts });
      }
      return res;
    }),
});
export type EventRouter = typeof eventRouter;
export type EventsOutput = inferRouterOutputs<EventRouter>;
// const location =
//   event.location ??
//   ("Other" as unknown as typeof events.location.dataType);
// await ctx.db.insert(events).values({
//   id: newEvent.id,
//   createdByEmail: newEvent.creator,
//   location: newEvent.location,
//   title: newEvent.title,
//   start: newEvent.start,
//   end: newEvent.end,
//   createdAt: newEvent.created,
//   updatedAt: newEvent.updated,
//   notes: event.description,
// });
// await ctx.db.insert(shifts).values(eventShifts)
