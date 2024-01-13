// import { addDays } from "date-fns";
import DashboardMessages from "~/components/dashboard/DashboardMessages";
// import PastShifts from "~/components/dashboard/PastShifts";
// import UpcomingShifts from "~/components/dashboard/UpcomingShifts";

// import { api } from "~/trpc/server";

export default async function Home() {
  // const { data } = await api.post.getEvents.query();
  // const startDate = new Date();
  // const endDate = addDays(startDate, 7);
  // const data = await api.events.getApiEvents.query({
  //   start: startDate,
  //   end: endDate,
  // });

  // const { items } = data;
  // if (items)
  return (
    <div className="row-span-1 grid h-full grid-cols-1 grid-rows-[max-content_max-content_1fr] px-8 pt-3">
      <div className="">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="w-full">
        <h3 className="text-xl font-normal">Upcoming Shifts</h3>
        {/* <UpcomingShifts events={data} /> */}
      </div>
      <div className="flex gap-4 overflow-auto p-2">
        <DashboardMessages />
        {/* <PastShifts events={data} /> */}
      </div>
    </div>
  );
}
