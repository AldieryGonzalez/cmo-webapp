import { TRPCError, type inferRouterOutputs } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedGapiProcedure } from "~/server/api/trpc";

export const messageRouter = createTRPCRouter({
  getEvents: protectedGapiProcedure
    .input(
      z
        .object({
          start: z.date(),
          end: z.date(),
        })
        .optional(),
    )
    .query(async ({ ctx }) => {
      const listResponse = await ctx.gmail.users.messages.list({
        userId: "me",
        maxResults: 10,
        q: "from:(w-milgram@northwestern.edu) to:(tech-staff@listserv.it.northwestern.edu)",
      });
      if (listResponse.status !== 200 || !listResponse.data.messages) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch messages",
        });
      }
      //   return listResponse.data.messages;
      //   const id = messages.data.messages[0]?.id;
      const messagePromises = listResponse.data.messages.map(
        async (message) => {
          const id = message.id ?? undefined;
          const messageResponse = await ctx.gmail.users.messages.get({
            userId: "me",
            id,
            format: "full",
          });
          if (messageResponse.status !== 200 || !messageResponse.data) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to fetch individual message ${message.id}`,
              cause: messageResponse,
            });
          }
          return messageResponse.data;
        },
      );
      const messages = await Promise.all(messagePromises)
        .then((message) => {
          return message;
        })
        .catch((error) => {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch individual messages",
            cause: error,
          });
        });
      return messages;
    }),
});
export type MessagesRouter = typeof messageRouter;
export type MessagesOutput = inferRouterOutputs<MessagesRouter>;
