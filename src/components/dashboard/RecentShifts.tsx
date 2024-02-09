import type { User } from "@clerk/nextjs/server";
import { isAfter } from "date-fns";
import { getUser } from "~/lib/auth/utils";
import { inEvent, type Event } from "~/lib/events/utils";
import DashboardShiftCard from "./DashboardShiftCard";

type Props = {
  events: Event[];
  user: namedUser;
};

interface namedUser extends User {
  searchNames: string[];
}

const RecentShifts = async ({ events, user }: Props) => {
  const res = await getUser();
  if (!res) return null;

  const recentShifts = events
    .filter((event) => {
      return inEvent(event, user.searchNames) && isAfter(new Date(), event.end);
    })
    .reverse();
  if (recentShifts.length === 0) return null;
  return (
    <div className="hidden md:flex md:flex-col">
      <h3 className="block text-xl font-normal">Recent Shifts</h3>
      <div className="flex snap-y snap-mandatory scroll-p-0.5 flex-col gap-1 overflow-y-auto px-2 pb-2">
        {recentShifts.map((event) => {
          return (
            <DashboardShiftCard key={event.id} event={event} user={user} />
          );
        })}
      </div>
    </div>
  );
};

export default RecentShifts;
