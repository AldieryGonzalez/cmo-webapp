import { format as dateFormat } from "date-fns";
import type { EventsOutput } from "~/server/api/routers/events";

export type Event = EventsOutput["getEvents"][0];
type NextUrlSearchParams = Record<string, string | undefined>;

export function getOpenShifts(event: Event) {
    return event.shifts.filter((shift) => !shift.isFilled);
}
export function getFilledShifts(event: Event) {
    return event.shifts.filter((shift) => shift.isFilled);
}

export function inEvent(event: Event, employeeNames: string[]) {
    for (const shift of event.shifts) {
        if (employeeNames.some((name) => name == shift.filledBy)) return true;
    }
    return false;
}

export function roleInEvent(event: Event, employeeNames: string[]) {
    for (const shift of event.shifts) {
        if (employeeNames.some((name) => name == shift.filledBy))
            return shift.role;
    }
    return false;
}

export function isSearched(
    event: Event,
    searchParam: NextUrlSearchParams,
    employeeNames = [""],
) {
    return (
        hasSearchTerm(event, searchParam.search ?? null, employeeNames) &&
        hasLocationSearchTerm(event, searchParam.location ?? null)
    );
}

export function hasSearchTerm(
    event: Event,
    searchTerm: string | null,
    employeeNames = [""],
) {
    if (searchTerm == null) return true;
    const role = roleInEvent(event, employeeNames);
    if (event.title?.toLowerCase().includes(searchTerm.toLowerCase()))
        return true;
    if (event.location?.toLowerCase().includes(searchTerm.toLowerCase()))
        return true;
    if (event.notes?.toLowerCase().includes(searchTerm.toLowerCase()))
        return true;
    if (role !== false && role.toLowerCase().includes(searchTerm.toLowerCase()))
        return true;
    else if (hasOpenRoleSearchTerm(event, searchTerm)) return true;
    return false;
}
export function hasLocationSearchTerm(event: Event, searchTerm: string | null) {
    if (event.location == null) return false;
    if (searchTerm == null) return true;

    const searchTermsMap: Record<string, string[]> = {
        "pick-staiger": ["pick-staiger", "pick", "pick staiger"],
        galvin: ["galvin"],
        mcclintock: ["mcclintock"],
        mcr: ["mcr", "master class room"],
        rot: ["rot", "ryan opera theatre", "ryan opera theater"],
    };
    const searchTerms = searchTermsMap[searchTerm] ?? [searchTerm];

    for (const term of searchTerms) {
        const lowerCaseTerm = term.toLowerCase();
        if (event.location.toLowerCase().includes(lowerCaseTerm)) return true;
    }
    return false;
}

export function hasOpenRoleSearchTerm(event: Event, searchTerm: string) {
    for (const shift of getOpenShifts(event)) {
        if (shift.role.toLowerCase().includes(searchTerm.toLowerCase()))
            return true;
    }
    return false;
}
export function allShiftsStringArray(event: Event) {
    return event.shifts.map((shift) => stringify(shift));
}

export function hasOpenShifts(event: Event) {
    return getOpenShifts(event).length > 0 && !event.cancelled;
}

export function hasPast(event: Event) {
    return event.end < new Date();
}

export function longDateString(event: Event) {
    return dateFormat(event.start, "PPPP");
}
export function startTimeString(event: Event) {
    return dateFormat(event.start, "p");
}
export function endTimeString(event: Event) {
    return dateFormat(event.end, "p");
}
export function timeRangeString(event: Event) {
    return `${startTimeString(event)} - ${endTimeString(event)}`;
}
export function longTimeRangeString(event: Event) {
    return `${dateFormat(
        event.start,
        "EEEE MMMM dd, h:mm a",
    )} - ${endTimeString(event)}`;
}

//
// Shift Utils
//
export type Shift = EventsOutput["getEvents"][0]["shifts"][0];

export function isFilled(shift: Shift) {
    return shift.filledBy !== null;
}

export function isConfirmed(shift: Shift) {
    return shift.confirmationNote !== "";
}

export function isUnconfirmed(shift: Shift) {
    return shift.confirmationNote === "";
}
export function isUnfilled(shift: Shift) {
    return shift.filledBy === null;
}
export function stringify(shift: Shift) {
    return `${shift.isFilled ? shift.filledBy : "open"} (${
        shift.role
    }): ${dateFormat(shift.start, "p O")}-${dateFormat(shift.end, "p O")}`;
}
