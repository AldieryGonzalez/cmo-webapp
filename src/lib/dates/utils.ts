export function timeStringToDate(date: Date, timeString: string): Date {
    const chicagoDate = new Date(
        date.toLocaleString("en-US", { timeZone: "America/Chicago" }),
    );
    const timeMatch = timeString.match(/(\d+)(?::(\d+))?(am|pm)?/i);
    const defaultHour = chicagoDate.getHours();
    const defaultMinute = chicagoDate.getMinutes();
    // const timeMatch = timeString?.match(/(\d{1,2}):(\d{2})([ap]m)/);
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
        // let hours = timeMatch[1];
        // const minutes = timeMatch[2];
        // const locale = timeMatch[3];
        // if (locale === "pm") {
        //     hours = (parseInt(hours ?? defaultHour.toString()) + 12).toString();
        // }
        chicagoDate.setHours(hours, minutes);
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
        return date;
    }
}
