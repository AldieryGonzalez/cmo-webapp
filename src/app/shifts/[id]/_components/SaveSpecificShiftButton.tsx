"use client";

import { isPast } from "date-fns";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { type Shift } from "~/lib/events/utils";
import { api } from "~/trpc/react";

type SaveSpecificShiftButtonProps = {
  shift: Shift;
};

const SaveSpecificShiftButton: React.FC<SaveSpecificShiftButtonProps> = ({
  shift,
}) => {
  const saveShift = api.events.saveShift.useMutation();
  const canAddToCart = !isPast(shift.end) && !shift.isFilled;
  const addToCart = async () => {
    const res = saveShift.mutateAsync(shift);
    toast.promise(res, {
      loading: "Loading...",
      success: () => {
        return `${shift.role} shift has been saved`;
      },
      error: "Error",
    });
  };

  return (
    <button
      disabled={!canAddToCart}
      onClick={addToCart}
      className="flex w-52 items-center gap-3 rounded text-left text-purple-800 hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <ShoppingCart size={20} />
      Add to Cart
    </button>
  );
};

export default SaveSpecificShiftButton;
