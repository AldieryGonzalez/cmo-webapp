import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import { TabsContent } from "~/components/ui/tabs";
import { groupEventsByDay, type CheckedEvent } from "~/lib/gcal/utils";

import Link from "next/link";
import { inEvent, roleInEvent, timeRangeString } from "~/lib/events/utils";

type OverviewProps = {
    events: CheckedEvent[];
    searchNames: string[];
};

type DaySectionProps = {
    day: string;
    events: CheckedEvent[];
    searchNames: string[];
};

type ShiftCardProps = {
    event: CheckedEvent;
    searchNames: string[];
};

const DaySection: React.FC<DaySectionProps> = ({
    day,
    events,
    searchNames,
}) => {
    return (
        <div className="space-y-1">
            <h3 className="text-lg font-semibold">{day}</h3>
            {events.map((event) => (
                <ShiftCard
                    key={event.id}
                    event={event}
                    searchNames={searchNames}
                />
            ))}
        </div>
    );
};

const ShiftCard: React.FC<ShiftCardProps> = ({ event, searchNames }) => {
    return (
        <Card className="transition-all hover:scale-x-[1.001] hover:scale-y-[1.005] hover:shadow-lg">
            <Link href={`/shifts/${event.id}`} className="block h-full w-full">
                <CardHeader className="space-y-0 px-4 py-2.5">
                    {!event.cancelled ? (
                        <CardTitle className="text-lg">{`${event.title}`}</CardTitle>
                    ) : (
                        <CardTitle className="text-lg text-red-900 line-through">{`${event.title}`}</CardTitle>
                    )}
                    <CardDescription>
                        <b className="font-semibold">{`${roleInEvent(
                            event,
                            searchNames,
                        )}`}</b>
                        {`${
                            event.location !== undefined
                                ? ` - ${event.location} - `
                                : ""
                        }${timeRangeString(event)}`}
                    </CardDescription>
                </CardHeader>
            </Link>
        </Card>
    );
};

const MyShifts: React.FC<OverviewProps> = async ({ events, searchNames }) => {
    const myEvents = groupEventsByDay(
        events.filter((event) => inEvent(event, searchNames)),
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
                            searchNames={searchNames}
                        />
                    );
                })}
            </div>
        </TabsContent>
    );
};

export default MyShifts;
