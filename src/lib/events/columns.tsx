"use client";
import type { ColumnDef } from "@tanstack/react-table";
import type { EventsOutput } from "~/server/api/routers/events";

export const columns: ColumnDef<EventsOutput["getSavedShifts"][0], string>[] = [
  {
    id: "date",
    header: "Date",
    accessorFn: (row) => row.savedShifts.start.toLocaleDateString(),
  },
  {
    id: "start",
    header: "Start",
    accessorFn: (row) => row.savedShifts.start.toLocaleTimeString(),
  },
  {
    id: "end",
    header: "End",
    accessorFn: (row) => row.savedShifts.end.toLocaleTimeString(),
  },
  {
    id: "title",
    header: "Title",
    accessorFn: (row) => row.event?.title ?? "",
  },
  {
    id: "location",
    header: "Location",
    accessorFn: (row) => row.event?.location ?? "",
  },
  {
    id: "role",
    header: "Role",
    accessorFn: (row) => row.savedShifts.role,
  },
];
