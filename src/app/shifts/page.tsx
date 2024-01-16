import { api } from "~/trpc/server";

import { addMonths } from "date-fns";
import { isSearched } from "~/lib/events/utils";

import ShiftDatePicker from "./_components/ShiftDatePicker";
import TabContainer from "./_components/TabContainer";

const Shifts = async ({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) => {
  searchParams.start = searchParams.start ?? new Date().toISOString();
  searchParams.end = searchParams.end ?? addMonths(new Date(), 3).toISOString();
  const start = new Date(searchParams.start);
  const end = new Date(searchParams.end);
  const data = await api.events.getEvents.query({ start, end });
  const events = data.filter((event) => {
    return isSearched(event, searchParams, "Aldi G.");
  });

  return (
    <div className="flex-1 space-y-4 p-5 pt-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-semibold">Shifts</h1>
        <ShiftDatePicker searchParams={searchParams} />
        {/* <div className="flex items-center space-x-2 rounded border bg-white px-4 py-2">{`${start.toLocaleDateString()} - ${end.toLocaleDateString()}`}</div> */}
      </div>
      <TabContainer events={events} searchParams={searchParams} />
    </div>
  );
};

export default Shifts;
