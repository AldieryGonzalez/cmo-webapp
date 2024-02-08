import { DataTable } from "~/components/ui/data-table";
import { api } from "~/trpc/server";

import { Button } from "~/components/ui/button";
import { columns } from "~/lib/events/columns";
import CartShifts from "./_components/cartshifts";
import ExportButton from "./_components/export";

const Cart = async () => {
  const results = await api.events.getSavedShifts.query();
  return (
    <div className="container space-y-4">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">Saved Shifts</h1>
        <div className="space-x-2">
          <ExportButton results={results} />
        </div>
      </div>
      {/* <DataTable columns={columns} data={results} /> */}
      <CartShifts data={results} />
    </div>
  );
};

export default Cart;
