import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { TabsContent } from "~/components/ui/tabs";
import { groupEventsByDay } from "~/lib/gcal/utils";

import Link from "next/link";
import type { EventsOutput } from "~/server/api/routers/events";
import { inEvent, roleInEvent, timeRangeString } from "~/lib/events/utils";

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
      <h3 className="text-lg font-semibold">{day}</h3>
      {events.map((event) => (
        <ShiftCard key={event.id} event={event} />
      ))}
    </div>
  );
};

const ShiftCard: React.FC<ShiftCardProps> = ({ event }) => {
  return (
    <Card className="">
      <Link href={`/shifts/${event.id}`} className="block h-full w-full">
        <CardHeader className="space-y-0 px-4 py-2.5">
          <CardTitle className="text-lg">{`${event.title}`}</CardTitle>
          <CardDescription>
            <b className="font-semibold">{`${roleInEvent(
              event,
              "Aldi G.",
            )}`}</b>
            {`${
              event.location !== undefined ? ` - ${event.location} - ` : ""
            }${timeRangeString(event)}`}
          </CardDescription>
        </CardHeader>
      </Link>
    </Card>
  );
};

const MyShifts: React.FC<OverviewProps> = ({ events }) => {
  const myEvents = groupEventsByDay(
    events.filter((event) => inEvent(event, "Aldi G.")),
  );
  return (
    <TabsContent value="myShifts" className="space-y-4">
      <div className="mx-2 mb-5 flex flex-col gap-2 ">
        <h3 className="text-3xl font-bold">Your Shifts</h3>
        {myEvents.map((day) => {
          return <DaySection key={day.day} day={day.day} events={day.events} />;
        })}
      </div>
    </TabsContent>
  );
};

export default MyShifts;
