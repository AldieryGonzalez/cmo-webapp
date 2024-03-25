import { ChevronDown } from "lucide-react";

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "~/components/ui/collapsible";

import { api } from "~/trpc/server";

import { type EventsOutput } from "~/server/api/routers/events";
import SyncButton from "./_components/button";

const SyncPage: React.FC = async () => {
    const events = await api.events.findEventsNotInDb.query();
    console.log(events);

    if (events.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-5xl font-semibold">
                <p className="animate-[ping_5s_ease-in-out_infinite]">
                    Up to date!!
                </p>
            </div>
        );
    }

    return (
        <div className="flex justify-center">
            <EventSyncContent events={events} />
        </div>
    );
};

type EventSyncContentProps = {
    events: EventsOutput["getEvents"];
};

const EventSyncContent: React.FC<EventSyncContentProps> = ({ events }) => {
    return (
        <div>
            {events.map((event) => {
                return (
                    <div
                        key={event.id}
                        className="m-1 justify-center rounded-md border-2  border-purple-900/15 bg-white p-3 shadow-md"
                    >
                        <h3 className="text-xl font-bold">{`${
                            event.title
                        } - ${event.start.toDateString()} - ${
                            event.location
                        }`}</h3>
                        {event.cancelled && (
                            <p className="text-lg font-semibold text-red-600 underline">
                                Cancelled
                            </p>
                        )}
                        <p className="text-lg font-semibold italic">
                            {event.start.toLocaleString()}
                            {" - "}
                            {event.end.toLocaleString()}
                        </p>

                        <p className="whitespace-pre-wrap">{event.notes}</p>
                        <p className="text-sm font-semibold">
                            Created by:
                            {event.creator}
                        </p>
                        <Collapsible>
                            <CollapsibleTrigger>
                                <div className="flex text-lg">
                                    Shifts <ChevronDown />
                                </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <ul>
                                    {event.shifts.map((shift) => {
                                        return (
                                            <ShiftCard
                                                key={shift.id}
                                                shift={shift}
                                            />
                                        );
                                    })}
                                </ul>
                            </CollapsibleContent>
                        </Collapsible>
                        <div className="mt-4 flex justify-between">
                            <SyncButton event={event} />
                            <div>
                                <p className="text-right text-xs">
                                    {"created: "}
                                    {event.created.toLocaleString()} -{" "}
                                    {"updated: "}
                                    {event.updated.toLocaleString()}
                                </p>
                                <p className="text-right text-xs">{event.id}</p>
                            </div>
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
            {shift.cancelled ? (
                <div className="text-red-500 line-through">
                    {shift.isFilled ? shift.filledBy : "(open)"} ({shift.role})
                    - {shift.start.toLocaleTimeString()}{" "}
                    {shift.end.toLocaleTimeString()}
                    {shift.confirmationNote && ` - ${shift.confirmationNote}`}
                </div>
            ) : (
                <div>
                    {shift.isFilled ? shift.filledBy : "(open)"} ({shift.role})
                    - {shift.start.toLocaleTimeString()}{" "}
                    {shift.end.toLocaleTimeString()}
                    {shift.confirmationNote && ` - ${shift.confirmationNote}`}
                    {` - ${shift.cancelled} `}
                </div>
            )}
            <p className="text-xs font-semibold">
                {shift.user ?? "Not in system yet"}
            </p>
        </li>
    );
};

export default SyncPage;
