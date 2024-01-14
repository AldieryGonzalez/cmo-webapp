import { inEvent } from "~/lib/events/utils";
import DashboardShiftCard from "./DashboardShiftCard";
import { type EventsOutput } from "~/server/api/routers/events";

type Props = {
  events: EventsOutput["getEvents"];
};

const UpcomingShifts = ({ events }: Props) => {
  const upcomingShifts = events.filter((event) => {
    return inEvent(event, "Aldi G.");
  });
  if (upcomingShifts.length === 0) {
    return <h3>No upcoming shifts</h3>;
  }
  return (
    <div className="flex snap-x snap-mandatory scroll-p-4 gap-5 overflow-y-visible overflow-x-scroll pb-2">
      {upcomingShifts.map((event) => {
        return <DashboardShiftCard key={event.id} event={event} />;
      })}
    </div>
  );
};

export default UpcomingShifts;
