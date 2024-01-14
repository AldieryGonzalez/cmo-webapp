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
    const roleCount: Record<string, number> = {};

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
    this.openShifts = matchMap.open.map((shift) => {
      roleCount[shift[1]!] = (roleCount[shift[1]!] ?? 0) + 1;
      return new Shift({
        id: this.id + "-" + shift[1] + roleCount[shift[1]!],
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
    this.filledShifts = matchMap.filled.map((shift) => {
      roleCount[shift[2]!] = (roleCount[shift[2]!] ?? 0) + 1;
      return new Shift({
        id: this.id + "-" + shift[2] + roleCount[shift[2]!],
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
      if (roleAIndex === -1) {
        const checkIndex =
          roleHierarchy.findIndex((role) => role.includes(a.role)) + 1;
        roleAIndex = checkIndex <= 0 ? roleHierarchy.length : checkIndex;
      }
      if (roleBIndex === -1) {
        const checkIndex =
          roleHierarchy.findIndex((role) => role.includes(b.role)) + 1;
        roleBIndex = checkIndex <= 0 ? roleHierarchy.length : checkIndex;
      }

      return roleAIndex - roleBIndex;
    });
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
