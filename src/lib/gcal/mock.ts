import { type calendar_v3 } from "@googleapis/calendar";
import { db } from "~/server/db";
import { events, shifts } from "~/server/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

/**
 * Mock Google Calendar API Responses
 * 
 * This module provides functions that return data in Google Calendar API format
 * by reading from the database instead of making actual API calls.
 * 
 * This allows the existing CmoEvent class to work without modification.
 */

/**
 * Transform database event to Google Calendar API format
 */
function dbEventToCalendarEvent(
  dbEvent: {
    id: string;
    title: string;
    location: string;
    notes: string | null;
    createdByEmail: string;
    createdAt: Date;
    updatedAt: Date;
    start: Date;
    end: Date;
    cancelled: boolean;
  },
  dbShifts: Array<{
    id: string;
    eventId: string;
    role: string;
    start: Date;
    end: Date;
    userEmail: string | null;
    filledBy: string | null;
    confirmationNote: string | null;
    cancelled: boolean;
  }>,
): calendar_v3.Schema$Event {
  // Build description from shifts
  const description = buildDescriptionFromShifts(dbShifts, dbEvent.start, dbEvent.end);

  return {
    id: dbEvent.id,
    summary: dbEvent.cancelled ? `[cancelled] ${dbEvent.title}` : dbEvent.title,
    location: dbEvent.location,
    description: description + (dbEvent.notes ? `\n\n${dbEvent.notes}` : ""),
    start: {
      dateTime: dbEvent.start.toISOString(),
    },
    end: {
      dateTime: dbEvent.end.toISOString(),
    },
    created: dbEvent.createdAt.toISOString(),
    updated: dbEvent.updatedAt.toISOString(),
    creator: {
      email: dbEvent.createdByEmail,
    },
    organizer: {
      email: dbEvent.createdByEmail,
    },
  };
}

/**
 * Build event description from shifts in the format expected by CmoEvent parser
 */
function buildDescriptionFromShifts(
  dbShifts: Array<{
    role: string;
    start: Date;
    end: Date;
    filledBy: string | null;
    confirmationNote: string | null;
    cancelled: boolean;
  }>,
  eventStart: Date,
  eventEnd: Date,
): string {
  const lines: string[] = [];

  for (const shift of dbShifts) {
    const startTime = formatTimeOfDay(shift.start);
    const endTime = formatTimeOfDay(shift.end);

    if (shift.filledBy) {
      // Filled shift format: [cancelled] FirstName L. (Role): 12:00pm-3:00pm (confirmed note)
      let line = "";
      if (shift.cancelled) {
        line += "[cancelled] ";
      }
      line += `${shift.filledBy} (${shift.role}): ${startTime}-${endTime}`;
      if (shift.confirmationNote) {
        line += ` ${shift.confirmationNote}`;
      }
      lines.push(line);
    } else {
      // Open shift format: open (Role): 12:00pm-3:00pm
      lines.push(`open (${shift.role}): ${startTime}-${endTime}`);
    }
  }

  return lines.join("\n");
}

/**
 * Format time in 12-hour format with am/pm
 */
function formatTimeOfDay(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHours}:${displayMinutes}${ampm}`;
}

/**
 * Mock events.list() - Get events from database
 */
export async function mockListEvents(params: {
  timeMin?: string;
  timeMax?: string;
  orderBy?: "startTime" | "updated";
  singleEvents?: boolean;
  maxResults?: number;
}): Promise<{ data: { items: calendar_v3.Schema$Event[] | undefined } }> {
  // Build query conditions
  const conditions = [];
  
  if (params.timeMin) {
    conditions.push(gte(events.start, new Date(params.timeMin)));
  }
  
  if (params.timeMax) {
    conditions.push(lte(events.start, new Date(params.timeMax)));
  }

  // Query database
  const dbEvents = await db
    .select()
    .from(events)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(events.start)
    .limit(params.maxResults || 500);

  // Get shifts for all events
  const eventIds = dbEvents.map((e) => e.id);
  const allShifts = eventIds.length > 0
    ? await db
        .select()
        .from(shifts)
        .where(
          eq(shifts.eventId, eventIds.length === 1 ? eventIds[0] ?? "" : shifts.eventId)
        )
    : [];

  // Group shifts by event
  const shiftsByEvent = new Map<string, typeof allShifts>();
  for (const shift of allShifts) {
    if (!shiftsByEvent.has(shift.eventId)) {
      shiftsByEvent.set(shift.eventId, []);
    }
    shiftsByEvent.get(shift.eventId)!.push(shift);
  }

  // Transform to calendar events
  const calendarEvents = dbEvents.map((event) => {
    const eventShifts = shiftsByEvent.get(event.id) || [];
    return dbEventToCalendarEvent(event, eventShifts);
  });

  return {
    data: {
      items: calendarEvents,
    },
  };
}

/**
 * Mock events.get() - Get single event from database
 */
export async function mockGetEvent(eventId: string): Promise<{
  data: calendar_v3.Schema$Event;
}> {
  const [dbEvent] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!dbEvent) {
    throw new Error(`Event ${eventId} not found`);
  }

  const dbShifts = await db
    .select()
    .from(shifts)
    .where(eq(shifts.eventId, eventId));

  return {
    data: dbEventToCalendarEvent(dbEvent, dbShifts),
  };
}

/**
 * Mock calendarList.list() - Not needed for portfolio version
 */
export async function mockCalendarList(): Promise<{
  data: { items: calendar_v3.Schema$CalendarListEntry[] | undefined };
}> {
  return {
    data: {
      items: [],
    },
  };
}

/**
 * Mock freebusy.query() - Not needed for portfolio version
 */
export async function mockFreeBusy(): Promise<{
  data: { calendars: Record<string, calendar_v3.Schema$FreeBusyCalendar> | undefined };
}> {
  return {
    data: {
      calendars: undefined,
    },
  };
}
