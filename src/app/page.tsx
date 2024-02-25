import { addMonths, subMonths } from "date-fns";
import DashboardMessages from "~/components/dashboard/DashboardMessages";
import RecentShifts from "~/components/dashboard/RecentShifts";
import UpcomingShifts from "~/components/dashboard/UpcomingShifts";
import { getUser } from "~/lib/auth/utils";
import { api } from "~/trpc/server";

export default async function Home() {
    const events = await api.events.getEvents.query({
        start: subMonths(new Date(), 1),
        end: addMonths(new Date(), 1),
    });
    const messages = await api.messages.getAnnouncements.query();
    const user = await getUser();
    if (!user) return null;

    return (
        <div className="flex max-h-full flex-col px-8 pt-3">
            <div className="grow-[2]">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <UpcomingShifts events={events} user={user} />
            </div>
            <div className="flex grow gap-4 overflow-y-auto p-2">
                <DashboardMessages messages={messages} />
                <RecentShifts events={events} user={user} />
            </div>
        </div>
    );
}
