import { type CmoEvent } from "~/lib/gcal/CmoEvent";
import DashboardShiftCard from "./DashboardShiftCard";

type Props = {
  events: CmoEvent[];
};

const UpcomingShifts = ({ events }: Props) => {
  const upcomingShifts = events.filter((event) => {
    return event.inEvent("Aldi G.");
    // return event.start.isBefore(momen);
  });
  return (
    <div className="flex snap-x snap-mandatory scroll-p-4 gap-5 overflow-y-visible overflow-x-scroll pb-2">
      {upcomingShifts.map((event) => {
        return <DashboardShiftCard key={event.id} event={event} />;
      })}
    </div>
  );
};

export default UpcomingShifts;
