"use client";
import { format as formateDate } from "date-fns";
import { MoreHorizontal, MoreVertical } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import type { EventsOutput } from "~/server/api/routers/events";

type CartShiftsProps = {
  data: EventsOutput["getSavedShifts"];
};

const CartShifts = ({ data }: CartShiftsProps) => {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelect = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((i) => i !== id));
    } else {
      setSelected([...selected, id]);
    }
  };
  const handleSelectAll = () => {
    if (selected.length == data.length) {
      setSelected([]);
    } else {
      setSelected(data.map((shift) => shift.savedShifts.id));
    }
  };

  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border">
      <div className="flex items-center justify-start divide-x backdrop-brightness-75">
        <div className="px-4 py-2">
          <input
            type="checkbox"
            checked={selected.length == data.length}
            onChange={handleSelectAll}
          />
        </div>
        <div className="flex w-full justify-between px-2">
          <div className="self-center">Shifts</div>
          <div className="self-center">
            {selected.length > 0 && (
              <Button
                variant={"link"}
                className="text-red-600 hover:backdrop-brightness-90"
              >
                Delete Selected
              </Button>
            )}
          </div>
        </div>
      </div>
      {data.map((shift) => {
        return (
          <div
            key={shift.savedShifts.id}
            className="flex items-center justify-start divide-x even:backdrop-brightness-95 hover:backdrop-brightness-90"
          >
            <div className="px-4 py-2">
              <input
                type="checkbox"
                checked={selected.includes(shift.savedShifts.id)}
                onChange={() => handleSelect(shift.savedShifts.id)}
              />
            </div>
            <div className="flex w-full items-center justify-between">
              <div className="p-2 text-xs md:text-sm">
                <p className="max-w-full text-ellipsis">{shift.event?.title}</p>
                <p className="text-neutral-500 dark:text-neutral-400">
                  {formateDate(shift.savedShifts.start, "MMMM d | h:mmbbb")} -{" "}
                  {formateDate(shift.savedShifts.end, "h:mmbbb")} -{" "}
                  {shift.savedShifts.role}
                </p>
              </div>
              <div className="p-2">
                <Button variant={"link"} className="p-0 sm:p-2">
                  <MoreVertical className="opacity-25 hover:opacity-100 sm:hidden" />
                  <MoreHorizontal className="hidden opacity-25 hover:opacity-100 sm:block" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CartShifts;
