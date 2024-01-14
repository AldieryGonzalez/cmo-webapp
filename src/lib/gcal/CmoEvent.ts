/* eslint-disable @typescript-eslint/no-unsafe-call */
import { type calendar_v3 } from "@googleapis/calendar";
import { Shift } from "./Shift";
import { format as dateFormat } from "date-fns";

export type MatchMap = {
  filled: RegExpMatchArray[];
  open: RegExpMatchArray[];
  extra: string[];
};

const fullShiftPattern =
  /^([A-Z][a-z]+ [A-Z]\.)\s\(([^)]+)\):\s((\d{1,2}:\d{2}[ap]m)-(\d{1,2}:\d{2}[ap]m|[Cc]lose))\s(\([A-Z]+ confirmed \d{1,2}\/\d{1,2}\/\d{2,4}[^)]*\))$/;
const openShiftPattern =
  /^open\s\(([^)]+)\):\s((\d{1,2}:\d{2}[ap]m)-(\d{1,2}:\d{2}[ap]m|[Cc]lose))$/;
export class CmoEvent {
  title: string;
  location: string;
  notes: string;
  id: string;
  creator: string;
  updated: Date;
  created: Date;
  allShifts: Shift[];
  openShifts: Shift[];
  filledShifts: Shift[];
  start: Date;
  end: Date;

  constructor(event: calendar_v3.Schema$Event) {
    this.title = event.summary!;
    this.location = event.location!;
    this.id = event.id!;
    this.creator = event.creator!.email!;
    this.updated = new Date(event.updated!);
    this.created = new Date(event.created!);
    this.start = new Date(event.start!.dateTime!);
    this.end = new Date(event.end!.dateTime!);

    const matchMap: MatchMap = { filled: [], open: [], extra: [] };
    const cleanDescription = event
      .description!.replaceAll("<span>", "")
      .replaceAll("</span>", "")
      .replaceAll("<br>", "\n");
    const descLines = cleanDescription.split("\n");

    for (const line of descLines) {
      const full = line.match(fullShiftPattern);
      const open = line.match(openShiftPattern);
      if (full) {
        matchMap.filled.push(full);
      } else if (open) {
        matchMap.open.push(open);
      } else {
        matchMap.extra.push(line);
      }
    }
    this.notes = matchMap.extra.join("\n").trim();
    this.openShifts = matchMap.open.map((shift, index) => {
      return new Shift({
        id: this.id + "-" + index,
        eventId: this.id,
        filledBy: null,
        confirmationNote: "",
        role: shift[1]!,
        eventStart: this.start,
        eventEnd: this.end,
        start: shift[3]!,
        end: shift[4]!,
      });
    });
    this.filledShifts = matchMap.filled.map((shift, index) => {
      return new Shift({
        id: this.id + "-" + index,
        eventId: this.id,
        filledBy: shift[1]!,
        role: shift[2]!,
        eventStart: this.start,
        eventEnd: this.end,
        start: shift[4]!,
        end: shift[5]!,
        confirmationNote: shift[6]!,
      });
    });

    this.allShifts = [...this.openShifts, ...this.filledShifts].sort((a, b) => {
      const roleHierarchy = [
        "SM",
        "SM Shadow",
        "Tech",
        "PA",
        "PA Shadow",
        "REC",
        "REC Shadow",
        "VID",
        "VID Shadow",
      ];

      let roleAIndex = roleHierarchy.indexOf(a.role);
      let roleBIndex = roleHierarchy.indexOf(b.role);

      // If role is not found in the hierarchy, assign a high index
      if (roleAIndex === -1) roleAIndex = roleHierarchy.length;
      if (roleBIndex === -1) roleBIndex = roleHierarchy.length;

      return roleAIndex - roleBIndex;
    });
  }

  inEvent(employeeName: string) {
    for (const shift of this.filledShifts) {
      if (shift.filledBy == employeeName) return true;
    }
    return false;
  }

  roleInEvent(employeeName: string) {
    for (const shift of this.filledShifts) {
      if (shift.filledBy == employeeName) return shift.role;
    }
    return false;
  }

  isSearched(searchParam: URLSearchParams, employeeName = "") {
    return (
      this.hasSearchTerm(searchParam.get("search"), employeeName) &&
      this.hasLocationSearchTerm(searchParam.get("location"))
    );
  }

  hasSearchTerm(searchTerm: string | null, employeeName = "") {
    if (searchTerm == null) return true;
    const role = this.roleInEvent(employeeName);
    if (this.title?.toLowerCase().includes(searchTerm.toLowerCase()))
      return true;
    if (this.location?.toLowerCase().includes(searchTerm.toLowerCase()))
      return true;
    if (this.notes?.toLowerCase().includes(searchTerm.toLowerCase()))
      return true;
    if (role !== false && role.toLowerCase().includes(searchTerm.toLowerCase()))
      return true;
    else if (this.hasOpenRoleSearchTerm(searchTerm)) return true;
    return false;
  }
  hasLocationSearchTerm(searchTerm: string | null) {
    if (this.location == null) return false;
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
      if (this.location.toLowerCase().includes(lowerCaseTerm)) return true;
    }
    return false;
  }

  hasOpenRoleSearchTerm(searchTerm: string) {
    for (const shift of this.openShifts) {
      if (shift.role.toLowerCase().includes(searchTerm.toLowerCase()))
        return true;
    }
    return false;
  }
  get allShiftsStringArray() {
    return this.allShifts.map((shift) => shift.stringify);
  }

  get hasFilledShifts() {
    return this.filledShifts.length > 0;
  }

  get hasOpenShifts() {
    return this.openShifts.length > 0 && !this.title.startsWith("[Canceled]");
  }

  get hasPast() {
    return this.end < new Date();
  }

  get longDateString() {
    return dateFormat(this.start, "PPPP");
  }
  get startTimeString() {
    return dateFormat(this.start, "p");
  }
  get endTimeString() {
    return dateFormat(this.end, "p");
  }
  get timeRangeString() {
    return `${this.startTimeString} - ${this.endTimeString}`;
  }
  get longTimeRangeString() {
    return `${dateFormat(this.start, "EEEE MMMM dd, h:mm a")} - ${
      this.endTimeString
    }`;
  }
}

// const locationEnum = [
//   "Pick-Staiger",
//   "Galvin",
//   "McClintock",
//   "Master Class Room",
//   "Ryan Opera Theater",
//   "All Venues",
//   "Lutkin",
//   "Cahn",
//   "Alice Millar",
//   "Regenstein",
//   "Ryan Field",
//   "Norris",
//   "Other",
// ];
