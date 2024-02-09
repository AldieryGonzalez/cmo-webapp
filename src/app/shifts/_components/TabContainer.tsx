"use client";

import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

import { usePathname, useRouter } from "next/navigation";
import AllShifts from "~/app/shifts/_components/AllShifts";
import MyShifts from "~/app/shifts/_components/MyShifts";
import OpenShifts from "~/app/shifts/_components/OpenShifts";
import SearchBar from "~/app/shifts/_components/SearchBar";
import { type Event } from "~/lib/events/utils";

type TabContainerProps = {
    events: Event[];
    searchParams: Record<string, string | undefined>;
    searchNames: string[];
};

const TabContainer: React.FC<TabContainerProps> = ({
    events,
    searchParams,
    searchNames,
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const tab = searchParams.shifts ?? "myShifts";
    const handleTabChange = (value: string) => {
        searchParams.shifts = value;
        const queryString = Object.entries(searchParams)
            .map(([key, value]) =>
                key && value
                    ? `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
                    : "",
            )
            .filter(Boolean)
            .join("&");
        const query = queryString ? `?${queryString}` : "";
        router.replace(`${pathname}${query}`);
    };
    return (
        <Tabs
            defaultValue={tab}
            onValueChange={handleTabChange}
            className="space-y-4 pb-2"
        >
            <div className="flex flex-col items-center justify-between gap-6 space-x-2 md:flex-row">
                <TabsList>
                    <TabsTrigger value="myShifts">My Shifts</TabsTrigger>
                    <TabsTrigger value="openShifts">Open Shifts</TabsTrigger>
                    <TabsTrigger value="allShifts">All Shifts</TabsTrigger>
                </TabsList>
                <SearchBar searchParams={searchParams} />
            </div>
            <MyShifts events={events} searchNames={searchNames} />
            <OpenShifts events={events} />
            <AllShifts events={events} />
        </Tabs>
    );
};

export default TabContainer;
