import { api } from "~/trpc/server";

import { addMonths } from "date-fns";
import { isSearched } from "~/lib/events/utils";

import { getUser } from "~/lib/auth/utils";
import { checkFreeBusy } from "~/lib/gcal/utils";
import ShiftDatePicker from "./_components/ShiftDatePicker";
import TabContainer from "./_components/TabContainer";

const Shifts = async ({
    searchParams,
}: {
    searchParams: Record<string, string | undefined>;
}) => {
    searchParams.start = searchParams.start ?? new Date().toISOString();
    searchParams.end =
        searchParams.end ?? addMonths(new Date(), 3).toISOString();
    const start = new Date(searchParams.start);
    const end = new Date(searchParams.end);
    const filterBusy = searchParams.allowBusy === "false";
    const data = await api.events.getEvents.query({ start, end });
    const user = await getUser();
    if (!user) return null;
    const freeBusy = await api.events.freeBusy.query({ start, end });
    const eventsSearched = data.filter((event) => {
        return isSearched(event, searchParams, user.searchNames);
    });
    const events = checkFreeBusy(eventsSearched, freeBusy).filter((event) =>
        filterBusy ? event.busyCalendars.length === 0 : true,
    );

    return (
        <div className="flex-1 space-y-4 p-5 pt-6">
            <div className="flex justify-between">
                <h1 className="text-3xl font-semibold">Shifts</h1>
                <ShiftDatePicker searchParams={searchParams} />
            </div>
            <TabContainer
                events={events}
                searchParams={searchParams}
                searchNames={user.searchNames}
            />
        </div>
    );
};

export default Shifts;
