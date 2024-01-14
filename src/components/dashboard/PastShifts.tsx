import { getUser } from "~/lib/auth/utils";
import DashboardShiftCard from "./DashboardShiftCard";
import { inEvent, type Event } from "~/lib/events/utils";

type Props = {
  events: Event[];
};

const PastShifts = async ({ events }: Props) => {
  const res = await getUser();
  if (!res) return null;
  const { contact, ...user } = res;

  const upcomingShifts = events.filter((event) => {
    return inEvent(event, "Aldi G.");
    // return event.start.isBefore(momen);
  });
  return (
    <div className="hidden md:flex md:flex-col">
      <h3 className="block text-xl font-normal">Past Shifts</h3>
      <div className="flex snap-y snap-mandatory scroll-p-0.5 flex-col gap-1  overflow-x-hidden overflow-y-scroll px-2 pb-2">
        {upcomingShifts.map((event) => {
          return <DashboardShiftCard key={event.id} event={event} />;
        })}
      </div>
    </div>
  );
};

export default PastShifts;
