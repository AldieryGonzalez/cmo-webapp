import { DataTable } from "~/components/ui/data-table";
import { api } from "~/trpc/server";

import { columns } from "~/lib/events/columns";
import ExportButton from "./_components/export";

const Cart = async () => {
  const results = await api.events.getSavedShifts.query();
  console.log(results);
  return (
    <div className="container space-y-4">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">Saved Shifts</h1>
        <ExportButton results={results} />
      </div>
      <DataTable columns={columns} data={results} />
    </div>
  );
};

export default Cart;
