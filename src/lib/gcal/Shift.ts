import { timeStringToDate } from "../dates/utils";
import { contacts } from "../const/contacts";

function nameToEmail(name: string | null) {
  if (!name) return null;
  try {
    const firstName = name.split(" ")[0]?.toLowerCase();
    const lastInitial = name.split(" ")[1]?.[0];
    if (!firstName || !lastInitial) return null;
    const contact = contacts.find((contact) => {
      return (
        contact.firstName.toLowerCase() === firstName &&
        contact.lastName.startsWith(lastInitial)
      );
    });
    if (!contact) return null;
    return contact.emailAddress;
  } catch (e) {
    return null;
  }
}

interface ShiftParams {
  id: string;
  eventId: string;
  filledBy: string | null;
  role: string;
  eventStart: Date;
  eventEnd: Date;
  start: string;
  end: string;
  confirmationNote: string;
}
export class Shift {
  id: string;
  eventId: string;
  filledBy: string | null;
  user: string | null;
  role: string;
  start: Date;
  end: Date;
  confirmationNote: string;

  constructor(obj: ShiftParams) {
    this.id = obj.id;
    this.eventId = obj.eventId;
    this.filledBy = obj.filledBy;
    this.user = nameToEmail(obj.filledBy);
    this.role = obj.role;
    this.start = timeStringToDate(obj.eventStart, obj.start);
    this.end = timeStringToDate(obj.eventEnd, obj.end);
    this.confirmationNote = obj.confirmationNote;
  }
  get isFilled() {
    return this.filledBy !== null;
  }
  get isConfirmed() {
    return this.confirmationNote !== "";
  }
  get isUnconfirmed() {
    return this.confirmationNote === "";
  }
  get isUnfilled() {
    return this.filledBy === null;
  }
  get stringify() {
    return `${this.isFilled ? this.filledBy : "open"} (${
      this.role
    }): ${this.start.toISOString()}-${this.end.toISOString()}`;
  }
}
