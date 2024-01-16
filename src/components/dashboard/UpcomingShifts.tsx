import { inEvent } from "~/lib/events/utils";
import DashboardShiftCard from "./DashboardShiftCard";
import { type EventsOutput } from "~/server/api/routers/events";
import { isAfter } from "date-fns";
import Link from "next/link";

type Props = {
  events: EventsOutput["getEvents"];
};

const UpcomingShifts = ({ events }: Props) => {
  const upcomingShifts = events.filter((event) => {
    return inEvent(event, "Aldi G.") && isAfter(event.start, new Date());
  });
  if (upcomingShifts.length === 0) {
    return (
      <div className="mt-4 w-full rounded-lg bg-white p-4 shadow">
        <h3 className="text-base">
          No upcoming shifts, go to{" "}
          <Link
            href={"/shifts?shifts=allShifts"}
            className="font-semibold text-purple-900 underline"
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
          return <DashboardShiftCard key={event.id} event={event} />;
        })}
      </div>
    </div>
  );
};

export default UpcomingShifts;
