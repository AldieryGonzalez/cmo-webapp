"use client";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

import { addMonths } from "date-fns";
import MyShifts from "./_components/MyShifts";
// import OpenShifts from "./_components/OpenShifts";
// import SearchBar from "./_components/SearchBar";
// import AllShifts from "./_components/AllShifts";
import { api } from "~/trpc/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import OpenShifts from "./_components/OpenShifts";
import AllShifts from "./_components/AllShifts";

const Shifts = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const start = new Date(searchParams.get("start") ?? new Date().toISOString());
  const end = new Date(
    searchParams.get("end") ?? addMonths(start, 1).toISOString(),
  );
  const tab = searchParams.get("shifts") ?? "myShifts";
  const { data, status } = api.events.getEvents.useQuery();

  const handleTabChange = (value: string) => {
    const newSearchParams = new URLSearchParams(
      Array.from(searchParams.entries()),
    );
    newSearchParams.set("shifts", value);
    const query = newSearchParams.toString()
      ? `?${newSearchParams.toString()}`
      : "";
    router.push(`${pathname}${query}`);
  };
  if (status === "loading") return <div>Loading...</div>;
  if (status === "error") return <div>Error</div>;
  return (
    <div className="flex-1 space-y-4 p-5 pt-6">
      <h1 className="text-3xl font-semibold">Shifts</h1>
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
          {/* <SearchBar
            searchParams={searchParams}
            setSearchParams={setSearchParams}
          /> */}
        </div>
        <MyShifts events={data} searchParams={searchParams} />
        <OpenShifts events={data} searchParams={searchParams} />
        <AllShifts events={data} searchParams={searchParams} />
      </Tabs>
    </div>
  );
};

export default Shifts;
