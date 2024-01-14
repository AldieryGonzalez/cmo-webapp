import { api } from "~/trpc/server";
import { addMonths } from "date-fns";
import TabContainer from "./_components/TabContainer";
import { isSearched } from "~/lib/events/utils";

const Shifts = async ({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) => {
  const start = new Date(
    searchParams.start ?? new Date("2023-09-01").toISOString(),
  );
  const end = new Date(searchParams.end ?? addMonths(start, 3).toISOString());

  const data = await api.events.getEvents.query({ start, end });
  const events = data.filter((event) => {
    return isSearched(event, searchParams, "Aldi G.");
  });

  return (
    <div className="flex-1 space-y-4 p-5 pt-6">
      <h1 className="text-3xl font-semibold">Shifts</h1>
      <TabContainer events={events} searchParams={searchParams} />
    </div>
  );
};

export default Shifts;
