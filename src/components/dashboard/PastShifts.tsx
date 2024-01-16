import { getUser } from "~/lib/auth/utils";
import DashboardShiftCard from "./DashboardShiftCard";
import { inEvent, type Event } from "~/lib/events/utils";
import { isAfter } from "date-fns";

type Props = {
  events: Event[];
};

const PastShifts = async ({ events }: Props) => {
  const res = await getUser();
  if (!res) return null;
  const { contact, ...user } = res;

  const upcomingShifts = events.filter((event) => {
    return inEvent(event, "Aldi G.") && isAfter(new Date(), event.end);
    // return event.start.isBefore(momen);
  });
  return (
    <div className="hidden md:flex md:flex-col">
      <h3 className="block text-xl font-normal">Past Shifts</h3>
      <div className="flex snap-y snap-mandatory scroll-p-0.5 flex-col gap-1 overflow-y-auto px-2 pb-2">
        {upcomingShifts.map((event) => {
          return <DashboardShiftCard key={event.id} event={event} />;
        })}
      </div>
    </div>
  );
};

export default PastShifts;
