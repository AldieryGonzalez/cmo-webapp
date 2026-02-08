import { cache } from "react";
import { DateTime } from "luxon";
import { cookies } from "next/headers";

const QUERY_DATE_COOKIE_NAME = "query-date";
const DEFAULT_QUERY_DATE = new Date("2024-02-20T23:00:00.000Z");

/**
 * Returns the "current" date for query purposes.
 * Reads from cookie if set, otherwise defaults to August 1st, 2023.
 * Cached per request so multiple callers (e.g. page + getEvents) only read cookies once.
 */
export const getQueryDate = cache(async (): Promise<Date> => {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(QUERY_DATE_COOKIE_NAME)?.value;

    if (cookieValue) {
        try {
            const parsedDate = new Date(decodeURIComponent(cookieValue));
            if (!isNaN(parsedDate.getTime())) {
                return parsedDate;
            }
        } catch (e) {
            console.error("Failed to parse query date from cookie:", e);
        }
    }

    return DEFAULT_QUERY_DATE;
});

export function timeStringToDate(date: Date, timeString: string): Date {
    const timeMatch = timeString.match(/(\d+)(?::(\d+))?(am|pm)?/i);

    const defaultHour = date.getHours();
    const defaultMinute = date.getMinutes();

    const luxDateTime = DateTime.fromJSDate(date).setZone("America/Chicago");

    if (timeMatch) {
        let hours = timeMatch[1] ? parseInt(timeMatch[1], 10) : defaultHour;
        const minutes = timeMatch[2]
            ? parseInt(timeMatch[2], 10)
            : defaultMinute;
        const period = timeMatch[3] ? timeMatch[3].toLowerCase() : undefined;
        if (period === "pm" && hours !== 12) {
            hours += 12;
        } else if (period === "am" && hours === 12) {
            hours = 0;
        }

        return luxDateTime
            .set({ hour: hours, minute: minutes, second: 0 })
            .toJSDate();
    } else {
        return date;
    }
}
