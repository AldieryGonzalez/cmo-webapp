import { api } from "~/trpc/server";
import { addMonths, subMonths } from "date-fns";
import DashboardMessages from "~/components/dashboard/DashboardMessages";
import RecentShifts from "~/components/dashboard/RecentShifts";
import UpcomingShifts from "~/components/dashboard/UpcomingShifts";

export default async function Home() {
  const events = await api.events.getEvents.query({
    start: subMonths(new Date(), 1),
    end: addMonths(new Date(), 1),
  });

  if (events)
    return (
      <div className="row-span-1 grid h-full grid-cols-1 grid-rows-[max-content_max-content_1fr] px-8 pt-3">
        <div className="">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>

        <UpcomingShifts events={events} />
        <div className="flex gap-4 overflow-auto p-2">
          <DashboardMessages />
          <RecentShifts events={events} />
        </div>
      </div>
    );
}
