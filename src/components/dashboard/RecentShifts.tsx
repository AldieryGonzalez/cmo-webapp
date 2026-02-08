import { isAfter } from "date-fns";
import { inEvent, type Event } from "~/lib/events/utils";
import DashboardShiftCard from "./DashboardShiftCard";
import type { MockUser } from "~/lib/auth/utils";

type Props = {
    events: Event[];
    user: MockUser | null;
    queryDate: Date;
};

const RecentShifts = ({ events, user, queryDate }: Props) => {
    if (!user) return null;

    const recentShifts = events
        .filter((event) => {
            return (
                inEvent(event, user.searchNames, user.email) &&
                isAfter(queryDate, event.end)
            );
        })
        .reverse();
    if (recentShifts.length === 0) return null;
    return (
        <div className="hidden md:flex md:flex-col">
            <h3 className="block text-xl font-normal">Recent Shifts</h3>
            <div className="flex snap-y snap-mandatory scroll-p-0.5 flex-col gap-1 overflow-y-auto overflow-x-clip px-2 pb-2">
                {recentShifts.map((event) => {
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

export default RecentShifts;
