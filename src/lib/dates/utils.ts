export function timeStringToDate(date: Date, timeString: string): Date {
  const defaultHour = date.getHours();
  const defaultMinute = date.getMinutes();
  const timeMatch = timeString?.match(/(\d{1,2}):(\d{2})([ap]m)/);
  if (timeMatch) {
    let hours = timeMatch[1];
    const minutes = timeMatch[2];
    const locale = timeMatch[3];
    if (locale === "pm") {
      hours = (parseInt(hours ?? defaultHour.toString()) + 12).toString();
    }
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      parseInt(hours ?? defaultHour.toString()),
      parseInt(minutes ?? defaultMinute.toString()),
    );
  } else {
    return date;
  }
}
