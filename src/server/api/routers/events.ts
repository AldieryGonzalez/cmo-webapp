/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { CmoEvent } from "~/lib/gcal/CmoEvent";

import { createTRPCRouter, protectedGapiProcedure } from "~/server/api/trpc";
import { events, shifts } from "~/server/db/schema";

export const eventRouter = createTRPCRouter({
  getEvents: protectedGapiProcedure.query(async ({ ctx }) => {
    return await ctx.calendar.events.list();
  }),
  syncEvents: protectedGapiProcedure
    .input(z.object({ start: z.date(), end: z.date() }))
    .mutation(async ({ ctx, input }) => {
      const start = input.start.toISOString();
      const end = input.end.toISOString();
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
        const newEvent = new CmoEvent(event);
        // // const location =
        // //   event.location ??
        // //   ("Other" as unknown as typeof events.location.dataType);
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
        const eventShifts = newEvent.allShifts.map((shift) => {
          return {
            id: shift.id,
            eventId: shift.eventId,
            userEmail: shift.filledBy,
            role: shift.role,
            start: shift.start,
            end: shift.end,
            confirmationNote: shift.confirmationNote,
          };
        });
        res.push({ event: newEvent, shifts: eventShifts });
        // await ctx.db.insert(shifts).values(eventShifts)
      }
      return res;
    }),
});
