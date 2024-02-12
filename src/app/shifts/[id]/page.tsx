import { CalendarX2 } from "lucide-react";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover";

import { getUser } from "~/lib/auth/utils";
import { longTimeRangeString } from "~/lib/events/utils";
import { checkEventFreeBusy } from "~/lib/gcal/utils";
import { api } from "~/trpc/server";
import SaveShiftButton from "./_components/SaveShiftButton";
import ShiftButton from "./_components/ShiftButton";

type ShiftPageProps = {
    params: {
        id: string;
    };
};

const ShiftPage: React.FC<ShiftPageProps> = async ({ params }) => {
    const user = await getUser();
    const event = await api.events.getEvent.query(params.id);
    const freeBusy = await api.events.freeBusy.query({
        start: event.start,
        end: event.end,
    });
    const busyCalendars = checkEventFreeBusy(event, freeBusy);
    return (
        <div className="container py-8">
            <section className="flex flex-col space-y-2">
                <div className="flex justify-between">
                    <h1 className="text-xl font-medium md:text-2xl">
                        {event.title}
                    </h1>

                    <SaveShiftButton event={event} />
                </div>
                <div className="flex flex-col text-sm text-muted-foreground sm:flex-row">
                    <p>{longTimeRangeString(event)}</p>
                    <p>{`@${event.location}`}</p>
                </div>
                <SaveShiftButton event={event} mobile />
                <div>
                    <div className="mb-2 flex justify-between text-lg font-medium">
                        Shifts
                        {busyCalendars.length > 0 && (
                            <Popover>
                                <PopoverTrigger className="rounded-full bg-orange-400 p-1 dark:bg-red-400 dark:text-black">
                                    <CalendarX2 size={20} />
                                </PopoverTrigger>
                                <PopoverContent collisionPadding={20}>
                                    <p className="text-sm font-bold text-gray-600">
                                        Conflicts in the following calendars:
                                    </p>
                                    <ul className="ml-4 list-disc space-y-1">
                                        {busyCalendars.map((calendar) => (
                                            <li
                                                key={calendar}
                                                className="text-xs text-gray-600"
                                            >
                                                {calendar}
                                            </li>
                                        ))}
                                    </ul>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                    <hr className="p-0.5"></hr>
                    <ul className="w-fit space-y-2">
                        {event.shifts.map((shift) => {
                            const isUser =
                                user?.searchNames.some(
                                    (name) => name === shift.filledBy,
                                ) ?? false;
                            return (
                                <ShiftButton
                                    key={shift.id}
                                    shift={shift}
                                    isUsers={isUser}
                                />
                            );
                        })}
                    </ul>
                </div>
                <div>
                    <label className="text-lg font-medium">Notes</label>
                    <hr className="p-0.5"></hr>
                    <pre className="whitespace-pre-wrap">{event.notes}</pre>
                </div>
            </section>
        </div>
    );
};

export default ShiftPage;
