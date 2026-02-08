import { type inferRouterOutputs } from "@trpc/server";
import { eq, inArray, isNull, or } from "drizzle-orm";
import { z } from "zod";

import {
    createTRPCRouter,
    authenticatedProcedure,
    publicProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";
import { events, messages, shifts, users } from "~/server/db/schema";

/** Extract all shift IDs from cmo://shift?id=<id> links in markdown. */
function extractShiftIds(markdown: string): string[] {
    const regex = /cmo:\/\/shift\?id=([a-zA-Z0-9_-]+)/g;
    const ids: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(markdown)) !== null) ids.push(match[1]!);
    return ids;
}

/** Extract all event IDs from cmo://event?id=<id> links in markdown. */
function extractEventIds(markdown: string): string[] {
    const regex = /cmo:\/\/event\?id=([a-zA-Z0-9_.-]+)/g;
    const ids: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(markdown)) !== null) ids.push(match[1]!);
    return ids;
}

/** Extract user refs from cmo://user?id=<id> or cmo://user?email=<email> links. Returns list of { type, value }. */
function extractUserRefs(
    markdown: string,
): Array<{ type: "id"; value: string } | { type: "email"; value: string }> {
    const out: Array<{ type: "id"; value: string } | { type: "email"; value: string }> = [];
    const idRegex = /cmo:\/\/user\?id=([a-zA-Z0-9_-]+)/g;
    const emailRegex = /cmo:\/\/user\?email=([a-zA-Z0-9_.@+-]+)/g;
    let m: RegExpExecArray | null;
    while ((m = idRegex.exec(markdown)) !== null) out.push({ type: "id", value: m[1]! });
    while ((m = emailRegex.exec(markdown)) !== null) out.push({ type: "email", value: m[1]! });
    return out;
}

export const messageRouter = createTRPCRouter({
    getAnnouncements: publicProcedure
        .input(z.object({ userEmail: z.string().optional() }).optional())
        .query(async ({ input }) => {
            const userEmail = input?.userEmail;

            // Fetch messages visible to this user (toEmail is null = broadcast, or matches user)
            const rows = await db
                .select()
                .from(messages)
                .where(
                    userEmail
                        ? or(
                              isNull(messages.toEmail),
                              eq(messages.toEmail, userEmail),
                          )
                        : isNull(messages.toEmail),
                )
                .orderBy(messages.sentAt);

            // Collect every referenced entity ID across all messages
            const allShiftIds = [
                ...new Set(rows.flatMap((r) => extractShiftIds(r.contentMarkdown))),
            ];
            const allEventIds = [
                ...new Set(rows.flatMap((r) => extractEventIds(r.contentMarkdown))),
            ];
            const userRefs = rows.flatMap((r) => extractUserRefs(r.contentMarkdown));
            const userIds = [...new Set(userRefs.filter((u) => u.type === "id").map((u) => u.value))];
            const userEmails = [...new Set(userRefs.filter((u) => u.type === "email").map((u) => u.value))];

            // Resolve shifts + parent events
            const resolvedShifts =
                allShiftIds.length > 0
                    ? await db
                          .select({
                              shiftId: shifts.id,
                              eventId: shifts.eventId,
                              role: shifts.role,
                              start: shifts.start,
                              end: shifts.end,
                              userEmail: shifts.userEmail,
                              filledBy: shifts.filledBy,
                              cancelled: shifts.cancelled,
                              eventTitle: events.title,
                              eventLocation: events.location,
                              eventCancelled: events.cancelled,
                          })
                          .from(shifts)
                          .innerJoin(events, eq(shifts.eventId, events.id))
                          .where(inArray(shifts.id, allShiftIds))
                    : [];

            // Resolve events (standalone event embeds)
            const resolvedEventsRows =
                allEventIds.length > 0
                    ? await db
                          .select({
                              id: events.id,
                              title: events.title,
                              location: events.location,
                              start: events.start,
                              end: events.end,
                              cancelled: events.cancelled,
                          })
                          .from(events)
                          .where(inArray(events.id, allEventIds))
                    : [];

            // Resolve users by id and/or email
            const resolvedUsersRows: Array<{
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            }> = [];
            if (userIds.length > 0) {
                const byId = await db
                    .select({
                        id: users.id,
                        email: users.email,
                        firstName: users.firstName,
                        lastName: users.lastName,
                    })
                    .from(users)
                    .where(inArray(users.id, userIds));
                resolvedUsersRows.push(...byId);
            }
            if (userEmails.length > 0) {
                const byEmail = await db
                    .select({
                        id: users.id,
                        email: users.email,
                        firstName: users.firstName,
                        lastName: users.lastName,
                    })
                    .from(users)
                    .where(inArray(users.email, userEmails));
                const seen = new Set(resolvedUsersRows.map((u) => u.id));
                for (const u of byEmail) {
                    if (!seen.has(u.id)) {
                        resolvedUsersRows.push(u);
                        seen.add(u.id);
                    }
                }
            }

            const shiftMap = Object.fromEntries(
                resolvedShifts.map((s) => [s.shiftId, s]),
            );
            const eventMap = Object.fromEntries(
                resolvedEventsRows.map((e) => [e.id, e]),
            );
            const userMap: Record<string, (typeof resolvedUsersRows)[number]> = {};
            for (const u of resolvedUsersRows) {
                userMap[u.id] = u;
                userMap[u.email] = u;
            }

            return rows.map((msg) => ({
                ...msg,
                resolvedShifts: shiftMap,
                resolvedEvents: eventMap,
                resolvedUsers: userMap,
            }));
        }),

    /** Resolve cmo:// embeds in draft markdown for preview. Returns same shape as one message's resolved maps. */
    previewDraft: publicProcedure
        .input(z.object({ contentMarkdown: z.string() }))
        .query(async ({ input }) => {
            const markdown = input.contentMarkdown;
            const allShiftIds = [...new Set(extractShiftIds(markdown))];
            const allEventIds = [...new Set(extractEventIds(markdown))];
            const userRefs = extractUserRefs(markdown);
            const userIds = [...new Set(userRefs.filter((u) => u.type === "id").map((u) => u.value))];
            const userEmails = [...new Set(userRefs.filter((u) => u.type === "email").map((u) => u.value))];

            const resolvedShifts =
                allShiftIds.length > 0
                    ? await db
                          .select({
                              shiftId: shifts.id,
                              eventId: shifts.eventId,
                              role: shifts.role,
                              start: shifts.start,
                              end: shifts.end,
                              userEmail: shifts.userEmail,
                              filledBy: shifts.filledBy,
                              cancelled: shifts.cancelled,
                              eventTitle: events.title,
                              eventLocation: events.location,
                              eventCancelled: events.cancelled,
                          })
                          .from(shifts)
                          .innerJoin(events, eq(shifts.eventId, events.id))
                          .where(inArray(shifts.id, allShiftIds))
                    : [];

            const resolvedEventsRows =
                allEventIds.length > 0
                    ? await db
                          .select({
                              id: events.id,
                              title: events.title,
                              location: events.location,
                              start: events.start,
                              end: events.end,
                              cancelled: events.cancelled,
                          })
                          .from(events)
                          .where(inArray(events.id, allEventIds))
                    : [];

            const resolvedUsersRows: Array<{
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            }> = [];
            if (userIds.length > 0) {
                const byId = await db
                    .select({
                        id: users.id,
                        email: users.email,
                        firstName: users.firstName,
                        lastName: users.lastName,
                    })
                    .from(users)
                    .where(inArray(users.id, userIds));
                resolvedUsersRows.push(...byId);
            }
            if (userEmails.length > 0) {
                const byEmail = await db
                    .select({
                        id: users.id,
                        email: users.email,
                        firstName: users.firstName,
                        lastName: users.lastName,
                    })
                    .from(users)
                    .where(inArray(users.email, userEmails));
                const seen = new Set(resolvedUsersRows.map((u) => u.id));
                for (const u of byEmail) {
                    if (!seen.has(u.id)) {
                        resolvedUsersRows.push(u);
                        seen.add(u.id);
                    }
                }
            }

            const shiftMap = Object.fromEntries(
                resolvedShifts.map((s) => [s.shiftId, s]),
            );
            const eventMap = Object.fromEntries(
                resolvedEventsRows.map((e) => [e.id, e]),
            );
            const userMap: Record<string, (typeof resolvedUsersRows)[number]> = {};
            for (const u of resolvedUsersRows) {
                userMap[u.id] = u;
                userMap[u.email] = u;
            }

            return {
                resolvedShifts: shiftMap,
                resolvedEvents: eventMap,
                resolvedUsers: userMap,
            };
        }),

    sendAnnouncement: authenticatedProcedure
        .input(
            z.object({
                subject: z.string().min(1),
                toEmail: z.string().nullable().optional(),
                contentMarkdown: z.string().min(1),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const [created] = await db
                .insert(messages)
                .values({
                    subject: input.subject,
                    fromEmail: ctx.auth.user.email,
                    toEmail: input.toEmail ?? null,
                    sentAt: new Date(),
                    contentMarkdown: input.contentMarkdown,
                })
                .returning();
            if (!created) throw new Error("Failed to create message");
            return created;
        }),
});
export type MessagesRouter = typeof messageRouter;
export type MessagesOutput = inferRouterOutputs<MessagesRouter>;

export type ResolvedShift = MessagesOutput["getAnnouncements"][number]["resolvedShifts"][string];
export type ResolvedEvent = MessagesOutput["getAnnouncements"][number]["resolvedEvents"][string];
export type ResolvedUser = MessagesOutput["getAnnouncements"][number]["resolvedUsers"][string];
