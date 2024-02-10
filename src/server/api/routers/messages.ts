import { TRPCError, type inferRouterOutputs } from "@trpc/server";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { simpleParser } from "mailparser";
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
                        format: "raw",
                    });
                    if (
                        messageResponse.status !== 200 ||
                        !messageResponse.data
                    ) {
                        throw new TRPCError({
                            code: "INTERNAL_SERVER_ERROR",
                            message: `Failed to fetch individual message ${message.id}`,
                            cause: messageResponse,
                        });
                    }
                    if (!messageResponse.data.raw) {
                        throw new TRPCError({
                            code: "INTERNAL_SERVER_ERROR",
                            message: `No raw data for message ${message.id}`,
                            cause: messageResponse,
                        });
                    }
                    const decodedMessage = Buffer.from(
                        messageResponse.data.raw,
                        "base64",
                    ).toString("utf-8");
                    const parsed = await simpleParser(decodedMessage);
                    return parsed;
                },
            );
            const messages = await Promise.all(messagePromises)
                .then((messages) => {
                    return messages.map((message) => {
                        const attatchments = message.attachments || [];
                        const to = Array.isArray(message.to)
                            ? message.to.map(
                                  (to) =>
                                      to.value[0]?.address?.toLocaleLowerCase() ??
                                      "Unknown",
                              )
                            : [
                                  message.to?.value[0]?.address?.toLocaleLowerCase() ??
                                      "Unknown",
                              ];
                        const window = new JSDOM("").window;
                        const purify = DOMPurify(window);
                        const html = purify.sanitize(
                            message.html || "No Message",
                        );
                        return {
                            id: message.messageId,
                            from:
                                message.from?.value[0]?.address?.toLocaleLowerCase() ??
                                "Unknown",
                            to: to,
                            subject: message.subject,
                            date: message.date,
                            text: message.text,
                            html: html,
                            attatchments: attatchments,
                        };
                    });
                })
                .catch((error) => {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to fetch individual messages",
                        cause: error,
                    });
                });
            console.log(messages[8]);
            return messages;
        }),
});
export type MessagesRouter = typeof messageRouter;
export type MessagesOutput = inferRouterOutputs<MessagesRouter>;
