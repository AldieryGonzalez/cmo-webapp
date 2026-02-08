import { isAfter } from "date-fns";
import Link from "next/link";
import { inEvent } from "~/lib/events/utils";
import { type EventsOutput } from "~/server/api/routers/events";
import DashboardShiftCard from "./DashboardShiftCard";
import type { MockUser } from "~/lib/auth/utils";

type Props = {
    events: EventsOutput["getEvents"];
    user: MockUser | null;
    queryDate: Date;
};

const UpcomingShifts = ({ events, user, queryDate }: Props) => {
    if (!user) {
        return (
            <div className="mt-4 w-full rounded-lg border border-card-foreground/35 bg-card p-4 shadow">
                <h3 className="text-base">
                    Select a user with the{" "}
                    <span className="font-semibold text-purple-700 dark:text-purple-400">
                        Viewing as
                    </span>{" "}
                    control in the bottom-left corner to see upcoming shifts.
                </h3>
            </div>
        );
    }

    const upcomingShifts = events.filter((event) => {
        return (
            inEvent(event, user.searchNames, user.email) &&
            isAfter(event.end, queryDate)
        );
    });
    if (upcomingShifts.length === 0) {
        return (
            <div className="mt-4 w-full rounded-lg border border-card-foreground/35 bg-card p-4 shadow">
                <h3 className="text-base">
                    No upcoming shifts, go to{" "}
                    <Link
                        href={"/shifts?shifts=openShifts"}
                        className="font-semibold text-purple-900 underline dark:text-purple-600"
                    >
                        shifts
                    </Link>{" "}
                    to search for and sign up for shifts.
                </h3>
            </div>
        );
    }
    return (
        <div className="w-full">
            <h3 className="text-xl font-normal">Upcoming Shifts</h3>
            <div className="flex snap-x snap-mandatory scroll-p-4 gap-5 overflow-x-auto pb-2">
                {upcomingShifts.map((event) => {
                    return (
                        <DashboardShiftCard
                            key={event.id}
                            event={event}
                            user={user}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default UpcomingShifts;
