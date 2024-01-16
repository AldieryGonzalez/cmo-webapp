import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Contact, MoreHorizontal, ShoppingCart, XCircle } from "lucide-react";
import { longTimeRangeString, stringify, type Shift } from "~/lib/events/utils";
import { isPast } from "date-fns";
import { cn } from "~/lib/utils";
import { currentUser, type User } from "@clerk/nextjs/server";
import { api } from "~/trpc/server";
import { Button } from "~/components/ui/button";

type ShiftPageProps = {
  params: {
    id: string;
  };
};

interface ShiftButtonProps {
  shift: Shift;
  user: User | null;
}

const ShiftButton: React.FC<ShiftButtonProps> = async ({ shift, user }) => {
  const usersShift = shift.filledBy == user?.lastName;
  const canAddToCart = !isPast(shift.end) && !shift.isFilled;
  const canRequestSub = !isPast(shift.end) && usersShift;
  return (
    <li
      className={cn({
        ["relative w-full rounded-full border-2 py-1 pl-4 pr-10 shadow-md"]:
          true,
        ["border-black/50 font-medium"]: usersShift,
      })}
    >
      {stringify(shift)}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="absolute bottom-0 right-0 top-0 rounded-e-full bg-purple-800 px-2">
            <MoreHorizontal className="mx-auto text-white" size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          alignOffset={-26}
          side="bottom"
          className="rounded-lg bg-white px-3 py-2.5"
        >
          {!shift.isFilled && (
            <>
              <DropdownMenuItem asChild>
                <button
                  disabled={!canAddToCart}
                  className="flex w-52 items-center gap-3 rounded text-left text-purple-800 hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingCart size={20} />
                  Add to Cart
                </button>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {usersShift && (
            <>
              <DropdownMenuItem asChild>
                <button
                  disabled={!canRequestSub}
                  className="disabled:cursor-autonot-allowed flex w-52 items-center gap-2 rounded text-left text-red-700 hover:bg-black/20 disabled:opacity-50"
                >
                  <XCircle size={20} />
                  <span>Request Shift Sub</span>
                </button>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem asChild className="rounded hover:bg-black/20">
            <button className="flex w-52 items-center gap-2 rounded text-left hover:bg-black/20">
              <Contact size={20} />
              <span>Go to contact</span>
            </button>
          </DropdownMenuItem>
          {shift.confirmationNote && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="max-w-[30ch] font-thin text-gray-600">
                {shift.confirmationNote}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
};

const ShiftPage: React.FC<ShiftPageProps> = async ({ params }) => {
  const user = await currentUser();
  const event = await api.events.getEvent.query(params.id);
  const saveShift = api.events.saveShift.mutate;
  return (
    <div className="container py-8">
      <section className="flex flex-col space-y-2">
        <div className="flex justify-between">
          <h1 className="text-xl font-medium md:text-2xl">{event.title}</h1>
          <Button variant={"nu"} className="hidden sm:inline-flex">
            <span>Save Shift</span>
          </Button>
        </div>
        <div className="flex flex-col text-sm text-gray-600 sm:flex-row">
          <p>{longTimeRangeString(event)}</p>
          <p>{`@${event.location}`}</p>
        </div>
        <Button variant={"nu"} className=" sm:hidden">
          <span>Save Shift</span>
        </Button>
        <div>
          <label className="text-lg font-medium">Shifts</label>
          <hr className="p-0.5"></hr>
          <ul className="w-fit space-y-2">
            {event.shifts.map((shift) => {
              return <ShiftButton key={shift.id} shift={shift} user={user} />;
            })}
          </ul>
        </div>
        <div>
          <label className="text-lg font-medium">Notes</label>
          <hr className="p-0.5"></hr>
          <pre className="whitespace-pre-wrap">{event.notes}</pre>
        </div>
      </section>
    </div>
  );
};

export default ShiftPage;
