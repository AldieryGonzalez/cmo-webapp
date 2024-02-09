import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { TabsContent } from "~/components/ui/tabs";
import { groupEventsByDay } from "~/lib/gcal/utils";

import { currentUser } from "@clerk/nextjs";
import { type User } from "@clerk/nextjs/server";
import Link from "next/link";
import { contactToSearchNames, getUser, nameToContact } from "~/lib/auth/utils";
import { inEvent, roleInEvent, timeRangeString } from "~/lib/events/utils";
import type { EventsOutput } from "~/server/api/routers/events";

type CmoEvent = EventsOutput["getEvents"][0];
type OverviewProps = {
  events: CmoEvent[];
};

type DaySectionProps = {
  day: string;
  events: CmoEvent[];
  names: string[];
};

type ShiftCardProps = {
  event: CmoEvent;
  names: string[];
};

const DaySection: React.FC<DaySectionProps> = ({ day, events, names }) => {
  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold">{day}</h3>
      {events.map((event) => (
        <ShiftCard key={event.id} event={event} names={names} />
      ))}
    </div>
  );
};

const ShiftCard: React.FC<ShiftCardProps> = ({ event, names }) => {
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
            <b className="font-semibold">{`${roleInEvent(event, names)}`}</b>
            {`${
              event.location !== undefined ? ` - ${event.location} - ` : ""
            }${timeRangeString(event)}`}
          </CardDescription>
        </CardHeader>
      </Link>
    </Card>
  );
};

const MyShifts: React.FC<OverviewProps> = async ({ events }) => {
  // const user = await getUser();
  const user = await currentUser();
  if (!user) return null;
  const contact = nameToContact(user.firstName + " " + user.lastName);
  if (!contact) return null;
  const names = contactToSearchNames(contact);
  const myEvents = groupEventsByDay(
    events.filter((event) => inEvent(event, names)),
  );
  return (
    <TabsContent value="myShifts" className="space-y-4">
      <div className="mx-2 mb-5 flex flex-col gap-2 ">
        <h3 className="text-3xl font-bold">Your Shifts</h3>
        {myEvents.map((day) => {
          return (
            <DaySection
              key={day.day}
              day={day.day}
              events={day.events}
              names={names}
            />
          );
        })}
      </div>
    </TabsContent>
  );
};

export default MyShifts;
