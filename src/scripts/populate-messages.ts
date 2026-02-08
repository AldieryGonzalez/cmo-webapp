#!/usr/bin/env node

/**
 * Seed Script: Populate Announcements
 *
 * Pulls a handful of events/shifts from the database and creates mock
 * announcement messages with embedded shift links (cmo://shift?id=<shiftId>).
 * Shift data is resolved live at query time — no separate embeds table needed.
 *
 * Usage:
 *   bun run populate-messages
 *   tsx src/scripts/populate-messages.ts
 */

import "dotenv/config";
import { db } from "~/server/db";
import { events, shifts, messages, users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { subDays, subHours } from "date-fns";

async function main() {
    console.log("Fetching existing events and shifts...");

    const allEvents = await db.select().from(events).limit(20);
    const allShifts = await db.select().from(shifts).limit(100);
    const allUsers = await db.select().from(users).limit(10);

    if (allEvents.length === 0 || allShifts.length === 0) {
        console.error(
            "No events or shifts found in the database. Run populate-events first.",
        );
        process.exit(1);
    }

    // Group shifts by event
    const shiftsByEvent = new Map<string, (typeof allShifts)[number][]>();
    for (const s of allShifts) {
        const list = shiftsByEvent.get(s.eventId) ?? [];
        list.push(s);
        shiftsByEvent.set(s.eventId, list);
    }

    const eventsWithShifts = allEvents.filter(
        (e) => (shiftsByEvent.get(e.id)?.length ?? 0) > 0,
    );

    if (eventsWithShifts.length === 0) {
        console.error("No events with shifts found.");
        process.exit(1);
    }

    const adminEmail =
        allUsers.find((u) => u.email.includes("admin"))?.email ??
        allUsers[0]?.email ??
        "admin@cmo.northwestern.edu";

    const now = new Date();

    // Helper to pick event + shifts by index (clamped)
    const pick = (i: number) => {
        const event = eventsWithShifts[Math.min(i, eventsWithShifts.length - 1)]!;
        return { event, shifts: shiftsByEvent.get(event.id) ?? [] };
    };

    const e1 = pick(0);
    const e2 = pick(1);
    const e3 = pick(2);

    // ──────── Messages ────────

    const messagesToInsert = [
        {
            id: uuid(),
            subject: "Dress Code",
            fromEmail: adminEmail,
            toEmail: null,
            sentAt: subDays(now, 2),
            contentMarkdown: `Hey all,

Just a quick reminder about our **dress code policy** for all upcoming events. Please make sure you're following the standard guidelines:

- **Black pants or skirt** (no jeans)
- **Black dress shoes** (no sneakers)
- **White or black top** (collared preferred for front-of-house)

If you're working the following shift, please arrive **15 minutes early** for a sound check:

[View your shift](cmo://shift?id=${e1.shifts[0]?.id ?? "unknown"})

Thanks for keeping things professional! Reach out if you have any questions.

Best,
CMO Admin`,
        },
        {
            id: uuid(),
            subject: "Schedule Update - Shift Changes",
            fromEmail: adminEmail,
            toEmail: null,
            sentAt: subHours(now, 12),
            contentMarkdown: `Hi team,

We've had a few changes to the upcoming schedule. Please check your shifts carefully.

### Updated shifts

The following shifts have been reassigned or are now open:

[Shift 1](cmo://shift?id=${e2.shifts[0]?.id ?? "unknown"})

${e2.shifts[1] ? `[Shift 2](cmo://shift?id=${e2.shifts[1].id})` : ""}

If you can't make your assigned shift, please use the **Request Shift Sub** feature on the event page as soon as possible.

> Reminder: Sub requests must be submitted at least **24 hours** before the event start time.

Thanks for staying on top of things!`,
        },
        {
            id: uuid(),
            subject: "Welcome to CMO!",
            fromEmail: adminEmail,
            toEmail: (allUsers[1] ?? allUsers[0])?.email ?? null,
            sentAt: subDays(now, 5),
            contentMarkdown: `Welcome to the Concert Management Office team!

We're excited to have you on board. Here's your first assigned shift:

[Your first shift](cmo://shift?id=${e3.shifts[0]?.id ?? "unknown"})

A few things to keep in mind:

1. Check the **Dashboard** regularly for upcoming shifts
2. You can save shifts to your cart from the Shifts page
3. If you need to swap a shift, use the dropdown menu on the shift button

Don't hesitate to reach out if you have any questions. Looking forward to working with you!`,
        },
        {
            id: uuid(),
            subject: "Office Closed Monday & Congrats!",
            fromEmail: adminEmail,
            toEmail: null,
            sentAt: subDays(now, 1),
            contentMarkdown: `Hello everyone,

Just a heads up that the office will be **closed next Monday** for the holiday. All regularly scheduled meetings are cancelled.

If you have any urgent scheduling conflicts, please email the admin team directly.

---

Also, congratulations to the crew on last week's performances! We received great feedback from the artists and audience. Keep up the great work!

Happy holidays!`,
        },
        {
            id: uuid(),
            subject: "Event & contact reference examples",
            fromEmail: adminEmail,
            toEmail: null,
            sentAt: subHours(now, 6),
            contentMarkdown: `This message shows **event** and **coworker** embeds:

- Event: [${e1.event.title}](cmo://event?id=${e1.event.id})
- Contact your admin: [Admin](cmo://user?email=${adminEmail})

You can use \`cmo://event?id=<eventId>\` for events and \`cmo://user?email=<email>\` or \`cmo://user?id=<userId>\` for coworkers.`,
        },
    ];

    // Clear old messages and re-seed
    console.log("Clearing existing messages...");
    await db.delete(messages);

    console.log("Inserting messages...");
    await db.insert(messages).values(messagesToInsert);

    const shiftLinksCount = messagesToInsert.reduce(
        (n, m) => n + (m.contentMarkdown.match(/cmo:\/\/shift\?id=/g) ?? []).length,
        0,
    );
    const eventLinksCount = messagesToInsert.reduce(
        (n, m) => n + (m.contentMarkdown.match(/cmo:\/\/event\?id=/g) ?? []).length,
        0,
    );
    const userLinksCount = messagesToInsert.reduce(
        (n, m) =>
            n +
            (m.contentMarkdown.match(/cmo:\/\/user\?(id|email)=/g) ?? []).length,
        0,
    );

    console.log(
        `\nDone! Inserted ${messagesToInsert.length} messages (shifts: ${shiftLinksCount}, events: ${eventLinksCount}, users: ${userLinksCount} embed links).`,
    );
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
