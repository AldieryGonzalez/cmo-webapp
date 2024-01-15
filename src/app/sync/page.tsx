"use client";
import { addDays } from "date-fns";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "~/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { DateRangePicker } from "~/components/ui/date-range-picker";
import { type EventsOutput } from "~/server/api/routers/events";
import { api } from "~/trpc/react";

const SyncPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 30),
  });

  const baseDate = new Date("2023-09-01");
  const today = new Date();

  const { data, error, isLoading, refetch } = api.events.getEvents.useQuery(
    { start: dateRange?.from ?? baseDate, end: dateRange?.to ?? today },
    { enabled: false },
  );

  const renderSwitch = () => {
    switch (true) {
      case isLoading:
        return <h3>Click Refresh button to load Google Calendar Events</h3>;
      case error != null:
        return <h3>Error: {error.message}</h3>;
      default:
        return <EventSyncContent events={data} />;
    }
  };

  return (
    <main>
      <div className="flex justify-center">
        <Button variant={"outline"} onClick={() => refetch()}>
          Refresh Diff Checker
        </Button>
        <DateRangePicker
          dateRange={dateRange}
          handleDateChange={(range) => setDateRange(range)}
        />
      </div>
      <div className="flex justify-center">{renderSwitch()}</div>
    </main>
  );
};

type EventSyncContentProps = {
  events: EventsOutput["getEvents"];
};

const EventSyncContent: React.FC<EventSyncContentProps> = ({ events }) => {
  return (
    <div>
      console.log(events);
      {events.map((event) => {
        return (
          <div
            key={event.id}
            className="m-1 justify-center rounded-md border-2 border-purple-900/15 p-3 shadow-md"
          >
            <h3 className="text-xl font-bold">{`${
              event.title
            } - ${event.start.toDateString()}`}</h3>
            <p className="text-lg font-semibold italic">
              {event.location} {event.start.toLocaleString()}
              {" - "}
              {event.end.toLocaleString()}
            </p>

            <p>{event.notes}</p>
            <p className="text-sm font-semibold">
              Created by:
              {event.creator}
            </p>
            <Collapsible>
              <CollapsibleTrigger>
                <div className="flex">
                  Shifts <ChevronDown />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul>
                  {event.shifts.map((shift) => {
                    return <ShiftCard key={shift.id} shift={shift} />;
                  })}
                </ul>
              </CollapsibleContent>
            </Collapsible>
            <div>
              <p className="text-right text-xs">
                {"created: "}
                {event.updated.toLocaleString()} - {"updated: "}
                {event.created.toLocaleString()}
              </p>
              <p className="text-right text-xs">{event.id}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

type ShiftCardProps = {
  shift: EventsOutput["getEvents"][0]["shifts"][0];
};

const ShiftCard: React.FC<ShiftCardProps> = ({ shift }) => {
  return (
    <li className="rounded-full border-2 border-purple-900/5 px-4 py-2">
      <div>
        {shift.isFilled ? shift.filledBy : "(open)"} ({shift.role}) -{" "}
        {shift.start.toLocaleTimeString()} {shift.end.toLocaleTimeString()}
        {shift.confirmationNote && ` - ${shift.confirmationNote}`}
      </div>
      <p className="text-xs font-semibold">
        {shift.user ?? "Not in system yet"}
      </p>
    </li>
  );
};

export default SyncPage;
