import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@radix-ui/react-tabs";
import {
  getDateRangeFromSearchParams,
  getEventsBetween,
  groupEventsByDay,
} from "@/utilities/dateUtils";
import { CmoEvent } from "@/utilities/classes/CmoEvent";
import { Link } from "react-router-dom";

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
      <Link to={`/shifts/${event.id}`} className="block h-full w-full">
        <CardHeader className="space-y-0 px-4 py-2.5">
          <CardTitle className="text-lg">{`${event.title}`}</CardTitle>
          <CardDescription>
            {`${event.location !== undefined ? `${event.location} - ` : ""}${
              event.timeRangeString
            }`}
          </CardDescription>
        </CardHeader>
      </Link>
    </Card>
  );
};

const OpenShifts: React.FC<OverviewProps> = ({ searchParams, events }) => {
  const dateRange = getDateRangeFromSearchParams(searchParams);
  const inRangeEvents = getEventsBetween(
    events,
    dateRange?.from,
    dateRange?.to,
  );
  const searchedEvents = inRangeEvents.filter((event) => {
    return event.isSearched(searchParams);
  });
  const myEvents = groupEventsByDay(
    searchedEvents.filter((event) => event.hasOpenShifts),
  );

  return (
    <TabsContent value="openShifts" className="space-y-4">
      <div className="mx-2 mb-5 flex flex-col gap-2 ">
        <h3 className="text-3xl font-bold">Open Shifts</h3>
        {myEvents.map((day) => {
          return <DaySection key={day.day} day={day.day} events={day.events} />;
        })}
      </div>
    </TabsContent>
  );
};

export default OpenShifts;
