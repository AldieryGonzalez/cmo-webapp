import { addHours, subHours } from "date-fns";

export function timeStringToDate(date: Date, timeString: string): Date {
    const timeMatch = timeString.match(/(\d+)(?::(\d+))?(am|pm)?/i);
    const chicagoOffest = -6;
    const defaultHour = date.getHours();
    const defaultMinute = date.getMinutes();
    const timeDifference = chicagoOffest - date.getTimezoneOffset();
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

        const newDate = addHours(date, timeDifference);
        newDate.setHours(hours, minutes);
        return subHours(newDate, timeDifference);
    } else {
        return date;
    }
}
