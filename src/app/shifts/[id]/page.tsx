import { currentUser, type User } from "@clerk/nextjs/server";
import { isPast } from "date-fns";
import { Contact, MoreHorizontal, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { longTimeRangeString, stringify, type Shift } from "~/lib/events/utils";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/server";
import SaveShiftButton from "./_components/SaveShiftButton";
import SaveSpecificShiftButton from "./_components/SaveSpecificShiftButton";

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
  const canRequestSub = !isPast(shift.end) && usersShift;
  return (
    <li
      className={cn({
        ["relative w-full rounded-full border-2 py-1 pl-4 pr-10 bg-primary-foreground shadow-md"]:
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
          className="rounded-lg bg-primary-foreground px-3 py-2.5"
        >
          {!shift.isFilled && (
            <>
              <DropdownMenuItem asChild>
                <SaveSpecificShiftButton shift={shift} />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {usersShift && (
            <>
              <DropdownMenuItem asChild>
                <button
                  disabled={!canRequestSub}
                  className="flex w-52 items-center gap-2 rounded text-left text-red-700 hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-50"
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
              <DropdownMenuItem className="max-w-[30ch] font-light text-gray-600">
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
  return (
    <div className="container py-8">
      <section className="flex flex-col space-y-2">
        <div className="flex justify-between">
          <h1 className="text-xl font-medium md:text-2xl">{event.title}</h1>

          <SaveShiftButton event={event} />
        </div>
        <div className="flex flex-col text-sm text-muted-foreground sm:flex-row">
          <p>{longTimeRangeString(event)}</p>
          <p>{`@${event.location}`}</p>
        </div>
        <SaveShiftButton event={event} mobile />
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
