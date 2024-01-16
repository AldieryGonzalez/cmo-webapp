import { getUser } from "~/lib/auth/utils";
import DashboardShiftCard from "./DashboardShiftCard";
import { inEvent, type Event } from "~/lib/events/utils";
import { isAfter } from "date-fns";

type Props = {
  events: Event[];
};

const RecentShifts = async ({ events }: Props) => {
  const res = await getUser();
  if (!res) return null;
  const { contact, ...user } = res;

  const recentShifts = events
    .filter((event) => {
      return inEvent(event, "Aldi G.") && isAfter(new Date(), event.end);
    })
    .reverse();
  if (recentShifts.length === 0) return null;
  return (
    <div className="hidden md:flex md:flex-col">
      <h3 className="block text-xl font-normal">Recent Shifts</h3>
      <div className="flex snap-y snap-mandatory scroll-p-0.5 flex-col gap-1 overflow-y-auto px-2 pb-2">
        {recentShifts.map((event) => {
          return <DashboardShiftCard key={event.id} event={event} />;
        })}
      </div>
    </div>
  );
};

export default RecentShifts;
