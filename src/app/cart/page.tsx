import { DataTable } from "~/components/ui/data-table";
import type { EventsOutput } from "~/server/api/routers/events";
import { api } from "~/trpc/server";

import { columns } from "~/lib/events/columns";

const Cart = async () => {
  const results = await api.events.getSavedShifts.query();
  console.log(results);
  return (
    <div className="container space-y-4">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">Saved Shifts</h1>
        <button className="rounded-md bg-blue-500 px-4 py-2 text-white shadow-md">
          Export Shifts
        </button>
      </div>
      <DataTable columns={columns} data={results} />
      {/* <div>
        <h1 className="text-3xl font-bold">Saved Shifts</h1>
      </div>
      <div className="flex max-w-screen-sm flex-col rounded-lg border px-4 py-2 shadow-sm">
        {results.map((res) => (
          <ShiftCard key={res.savedShifts.id} res={res} />
        ))}
      </div> */}
    </div>
  );
};

type ShiftCardProps = {
  res: EventsOutput["getSavedShifts"][0];
};

const ShiftCard: React.FC<ShiftCardProps> = ({ res }) => {
  return (
    <div className="flex gap-2">
      <p className="font-bold">{res.event?.start.toLocaleDateString()}</p>
      <p className="font-bold">{res.event?.start.toLocaleTimeString()}</p>
      <p className="font-bold">{" - "}</p>
      <p className="font-bold">{res.event?.end.toLocaleTimeString()}</p>
      <p className="font-bold">{res.event?.title}</p>
      <div className="">{res.event?.location}</div>
    </div>
  );
};

export default Cart;
