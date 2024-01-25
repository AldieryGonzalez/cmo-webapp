/* eslint-disable @typescript-eslint/no-unsafe-call */
import { type calendar_v3 } from "@googleapis/calendar";
import { Shift } from "./Shift";

export type MatchMap = {
  filled: RegExpMatchArray[];
  open: RegExpMatchArray[];
  extra: string[];
};

const fullShiftPattern =
  /^(\[cancel{1,2}ed\]\s*)?([a-z]+ [a-z]\.?)\s*\(([^)]+)\):?\s*((\d{1,2}:\d{2}[ap]m)-(\d{1,2}:\d{2}[ap]m|close))\s*(\([a-z]+ confirmed.*)?$/i;
const openShiftPattern =
  /^open\s*\(([^)]+)\):\s*((\d{1,2}:\d{2}[ap]m)-(\d{1,2}:\d{2}[ap]m|close))$/i;
const cancelledPattern = RegExp("\\[cancel{1,2}ed\\]", "gi");
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
  cancelled: boolean;

  constructor(event: calendar_v3.Schema$Event) {
    this.title = event.summary?.replaceAll(cancelledPattern, "").trim() ?? "";
    this.location = event.location ?? "Other";
    this.id = event.id!;
    this.creator = event.creator?.email ?? event.organizer?.email ?? "";
    this.updated = new Date(event.updated!);
    this.created = new Date(event.created!);
    this.start = new Date(event.start?.dateTime ?? new Date(0));
    this.end = new Date(event.end?.dateTime ?? new Date(0));
    this.cancelled = cancelledPattern.test(event.summary!);

    const matchMap: MatchMap = { filled: [], open: [], extra: [] };
    const cleanDescription =
      event.description
        ?.replaceAll("<span>", "")
        .replaceAll("</span>", "")
        .replaceAll("<b>", "")
        .replaceAll("</b>", "")
        .replaceAll("<br>", "\n") ?? "";
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
        cancelled: false,
      });
    });
    this.filledShifts = matchMap.filled.map((shift) => {
      roleCount[shift[3]!] = (roleCount[shift[3]!] ?? 0) + 1;
      return new Shift({
        id: this.id + "-" + shift[3] + roleCount[shift[3]!],
        eventId: this.id,
        filledBy: shift[2]!,
        role: shift[3]!,
        eventStart: this.start,
        eventEnd: this.end,
        start: shift[5]!,
        end: shift[6]!,
        confirmationNote: shift[7] ?? null,
        cancelled: !!shift[1],
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
