import type { CmoEvent } from "@/utilities/classes/CmoEvent";
import DashboardShiftCard from "./DashboardShiftCard";

type Props = {
  events: CmoEvent[];
};

const PastShifts = ({ events }: Props) => {
  const upcomingShifts = events.filter((event) => {
    return event.inEvent("Aldi G.");
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
