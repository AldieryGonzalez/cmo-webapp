"use client";

import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

import MyShifts from "~/app/shifts/_components/MyShifts";
import OpenShifts from "~/app/shifts/_components/OpenShifts";
import AllShifts from "~/app/shifts/_components/AllShifts";
import { type Event } from "~/lib/events/utils";
import SearchBar from "~/app/shifts/_components/SearchBar";
import { usePathname, useRouter } from "next/navigation";

type TabContainerProps = {
  events: Event[];
  searchParams: Record<string, string | undefined>;
};

const TabContainer: React.FC<TabContainerProps> = ({
  events,
  searchParams,
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
      <MyShifts events={events} />
      <OpenShifts events={events} />
      <AllShifts events={events} />
    </Tabs>
  );
};

export default TabContainer;
