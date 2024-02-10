import {
    addYears,
    areIntervalsOverlapping,
    endOfDay,
    isAfter,
    isBefore,
    startOfDay,
} from "date-fns";
import type { DateRange } from "react-day-picker";
import type { EventsOutput } from "~/server/api/routers/events";
import { longDateString } from "../events/utils";

type CmoEvent = EventsOutput["getEvent"];
type FreeBusy = EventsOutput["freeBusy"];
type EventByDayObj = Record<string, CmoEvent[]>;
type NextUrlSearchParams = Record<string, string | undefined>;

const isBetween = (eventDate: Date, start: Date, end: Date) => {
    start = startOfDay(start);
    end = endOfDay(end);
    return isAfter(eventDate, start) && isBefore(eventDate, end);
};

export const getEventsBetween = (
    events: CmoEvent[],
    start = new Date("2021-06-01"),
    end = addYears(new Date(), 1),
) => {
    return events.filter((event) => isBetween(event.start, start, end));
};

export const getDateRangeFromSearchParams = (
    searchParams: NextUrlSearchParams,
) => {
    return {
        from: searchParams.start ? new Date(searchParams.start!) : undefined,
        to: searchParams.end ? new Date(searchParams.end!) : undefined,
    } as DateRange | undefined;
};

export function groupEventsByDay(events: CmoEvent[]) {
    const eventsByDay: EventByDayObj = {};

    for (const event of events) {
        const eventDay = longDateString(event);
        if (!eventsByDay[eventDay]) {
            eventsByDay[eventDay] = [];
        }

        eventsByDay[eventDay]!.push(event);
    }

    const groupedEventsArray = Object.entries(eventsByDay).map(
        ([day, events]) => ({
            day,
            events,
        }),
    );

    return groupedEventsArray;
}

export const getMonthMatrix = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const firstDay = new Date(year, date.getMonth(), 1).getDay();
    let currentDay = 0 - firstDay;
    const daysMatrix = new Array(5).fill([]).map(() => {
        return new Array(7).fill(null).map(() => {
            currentDay++;
            const newDate = new Date(year, date.getMonth(), currentDay);
            return newDate;
        });
    });
    return daysMatrix;
};

// export const checkFreeBusy = (events: CmoEvent[], freeBusy: FreeBusy) => {

//   return events.map((event) => {
//     const isBusy =
//   });
// }

export const checkEventFreeBusy = (event: CmoEvent, freeBusy: FreeBusy) => {
    const busyCalendars = [];
    for (const calendar in freeBusy) {
        const busyTimes = freeBusy[calendar]?.busy ?? [];
        for (const busyTime of busyTimes) {
            if (!busyTime.start || !busyTime.end) continue;
            if (
                areIntervalsOverlapping(
                    { start: event.start, end: event.end },
                    { start: busyTime.start, end: busyTime.end },
                )
            ) {
                busyCalendars.push(freeBusy[calendar]?.name ?? "Unknown");
            }
        }
    }
    return busyCalendars;
};
