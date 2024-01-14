"use client";

import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

import MyShifts from "~/app/shifts/_components/MyShifts";
import OpenShifts from "~/app/shifts/_components/OpenShifts";
import AllShifts from "~/app/shifts/_components/AllShifts";
import { type Event } from "~/lib/events/utils";
import SearchBar from "~/components/ui/searchBar";

type TabContainerProps = {
  events: Event[];
  searchParams: Record<string, string | undefined>;
};

const TabContainer: React.FC<TabContainerProps> = ({
  events,
  searchParams,
}) => {
  const tab = searchParams.shifts ?? "myShifts";
  //   const handleTabChange = (value: string) => {
  // const newSearchParams = new URLSearchParams(
  //   Array.from(searchParams),
  // );
  // newSearchParams.set("shifts", value);
  // const query = newSearchParams.toString()
  //   ? `?${newSearchParams.toString()}`
  //   : "";
  // router.push(`${pathname}${query}`);
  //   };
  return (
    <Tabs
      defaultValue={tab}
      //   onValueChange={() => null}
      className="space-y-4 pb-2"
    >
      <div className="flex flex-col items-center justify-between gap-6 space-x-2 md:flex-row">
        <TabsList>
          <TabsTrigger value="myShifts">My Shifts</TabsTrigger>
          <TabsTrigger value="openShifts">Open Shifts</TabsTrigger>
          <TabsTrigger value="allShifts">All Shifts</TabsTrigger>
        </TabsList>
        {/* <SearchBar
            searchParams={searchParams}
          /> */}
      </div>
      <MyShifts events={events} />
      <OpenShifts events={events} />
      <AllShifts events={events} />
    </Tabs>
  );
};

export default TabContainer;
