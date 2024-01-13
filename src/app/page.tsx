import { api } from "~/trpc/server";
import { addDays, subDays } from "date-fns";
import DashboardMessages from "~/components/dashboard/DashboardMessages";
import PastShifts from "~/components/dashboard/PastShifts";
import UpcomingShifts from "~/components/dashboard/UpcomingShifts";

export default async function Home() {
  const events = await api.events.getEvents.query({
    start: subDays(new Date(), 60),
    end: addDays(new Date(), 30),
  });

  if (events)
    return (
      <div className="row-span-1 grid h-full grid-cols-1 grid-rows-[max-content_max-content_1fr] px-8 pt-3">
        <div className="">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="w-full">
          <h3 className="text-xl font-normal">Upcoming Shifts</h3>
          <UpcomingShifts events={events} />
        </div>
        <div className="flex gap-4 overflow-auto p-2">
          <DashboardMessages />
          <PastShifts events={events} />
        </div>
      </div>
    );
}
