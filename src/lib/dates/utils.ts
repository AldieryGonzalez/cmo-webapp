export function timeStringToDate(date: Date, timeString: string): Date {
    const chicagoDate = new Date(
        date.toLocaleString("en-US", { timeZone: "America/Chicago" }),
    );
    const defaultHour = chicagoDate.getHours();
    const defaultMinute = chicagoDate.getMinutes();
    const timeMatch = timeString?.match(/(\d{1,2}):(\d{2})([ap]m)/);
    if (timeMatch) {
        let hours = timeMatch[1];
        const minutes = timeMatch[2];
        const locale = timeMatch[3];
        if (locale === "pm") {
            hours = (parseInt(hours ?? defaultHour.toString()) + 12).toString();
        }
        chicagoDate.setHours(parseInt(hours ?? defaultHour.toString()));
        chicagoDate.setMinutes(parseInt(minutes ?? defaultMinute.toString()));
        const formattedDate = new Intl.DateTimeFormat("en-US", {
            timeZone: "America/Chicago",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
        }).format(chicagoDate);
        return new Date(formattedDate);
    } else {
        return chicagoDate;
    }
}
