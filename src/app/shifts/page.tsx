import { api } from "~/trpc/server";

import { addMonths } from "date-fns";
import { isSearched } from "~/lib/events/utils";

import { getUser } from "~/lib/auth/utils";
import { checkFreeBusy } from "~/lib/gcal/utils";
import { getQueryDate } from "~/lib/dates/utils";
import ShiftDatePicker from "./_components/ShiftDatePicker";
import TabContainer from "./_components/TabContainer";

const Shifts = async ({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | undefined>>;
}) => {
    const resolvedSearchParams = await searchParams;
    const queryDate = await getQueryDate();
    resolvedSearchParams.start = resolvedSearchParams.start ?? queryDate.toISOString();
    resolvedSearchParams.end =
        resolvedSearchParams.end ?? addMonths(queryDate, 3).toISOString();
    const start = new Date(resolvedSearchParams.start);
    const end = new Date(resolvedSearchParams.end);
    const filterBusy = resolvedSearchParams.allowBusy === "false";
    const user = await getUser();
    const searchNames =
        (user as Record<string, unknown>)?.searchNames as string[] ?? [];
    const userEmail = (user as Record<string, unknown>)?.email as
        | string
        | undefined;
    const freeBusy = await api.events.freeBusy.query({ start, end });
    const data = await api.events.getEvents.query({ start, end });
    const userEventsRaw = userEmail
        ? await api.events.getUserEvents.query({
              userEmail,
              start,
              end,
          })
        : [];
    const eventsSearched = data.filter((event) => {
        return isSearched(event, resolvedSearchParams, searchNames);
    });
    const events = checkFreeBusy(eventsSearched, freeBusy).filter((event) =>
        filterBusy ? event.busyCalendars.length === 0 : true,
    );
    const myEvents = checkFreeBusy(userEventsRaw, freeBusy);

    return (
        <div className="flex-1 space-y-4 p-5 pt-6">
            <div className="flex justify-between">
                <h1 className="text-3xl font-semibold">Shifts</h1>
                <ShiftDatePicker searchParams={resolvedSearchParams} />
            </div>
            <TabContainer
                events={events}
                myEvents={myEvents}
                searchParams={resolvedSearchParams}
                searchNames={searchNames}
                userEmail={userEmail}
            />
        </div>
    );
};

export default Shifts;
