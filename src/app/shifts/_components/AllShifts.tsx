import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { TabsContent } from "@radix-ui/react-tabs";
import {
  getDateRangeFromSearchParams,
  getEventsBetween,
  groupEventsByDay,
} from "~/lib/gcal/utils";
import Link from "next/link";
import type { EventsOutput } from "~/server/api/routers/events";
import { isSearched, timeRangeString } from "~/lib/events/utils";

type CmoEvent = EventsOutput["getEvents"][0];
type OverviewProps = {
  searchParams: URLSearchParams;
  events: CmoEvent[];
};

type DaySectionProps = {
  day: string;
  events: CmoEvent[];
};

type ShiftCardProps = {
  event: CmoEvent;
};

const DaySection: React.FC<DaySectionProps> = ({ day, events }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold">{day}</h3>
      {events.map((event) => (
        <ShiftCard key={event.id} event={event} />
      ))}
    </div>
  );
};

const ShiftCard: React.FC<ShiftCardProps> = ({ event }) => {
  return (
    <Card>
      <Link href={`/shifts/${event.id}`} className="block h-full w-full">
        <CardHeader className="space-y-0 px-4 py-2.5">
          <CardTitle className="text-lg">{`${event.title}`}</CardTitle>
          <CardDescription>
            {`${
              event.location !== undefined ? `${event.location} - ` : ""
            }${timeRangeString(event)}`}
          </CardDescription>
        </CardHeader>
      </Link>
    </Card>
  );
};

const AllShifts: React.FC<OverviewProps> = ({ searchParams, events }) => {
  const dateRange = getDateRangeFromSearchParams(searchParams);
  const inRangeEvents = getEventsBetween(
    events,
    dateRange?.from,
    dateRange?.to,
  );
  const searchedEvents = inRangeEvents.filter((event) => {
    return isSearched(event, searchParams);
  });
  const myEvents = groupEventsByDay(searchedEvents);

  return (
    <TabsContent value="allShifts" className="space-y-4">
      <div className="mx-2 mb-5 flex flex-col gap-2 ">
        <h3 className="text-3xl font-bold">Shift Schedule</h3>
        {myEvents.map((day) => {
          return <DaySection key={day.day} day={day.day} events={day.events} />;
        })}
      </div>
    </TabsContent>
  );
};

export default AllShifts;
