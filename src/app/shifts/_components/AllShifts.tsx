import { TabsContent } from "@radix-ui/react-tabs";
import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { timeRangeString } from "~/lib/events/utils";
import { groupEventsByDay } from "~/lib/gcal/utils";
import type { EventsOutput } from "~/server/api/routers/events";

type CmoEvent = EventsOutput["getEvents"][0];
type OverviewProps = {
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
    <Card className="transition-all hover:scale-x-[1.01] hover:scale-y-105 hover:shadow-lg">
      <Link href={`/shifts/${event.id}`} className="block h-full w-full">
        <CardHeader className="space-y-0 px-4 py-2.5">
          {!event.cancelled ? (
            <CardTitle className="text-lg">{`${event.title}`}</CardTitle>
          ) : (
            <CardTitle className="text-lg text-red-900 line-through">{`${event.title}`}</CardTitle>
          )}
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

const AllShifts: React.FC<OverviewProps> = ({ events }) => {
  const myEvents = groupEventsByDay(events);

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
