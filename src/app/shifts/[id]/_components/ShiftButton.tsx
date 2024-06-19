"use client";

import { isPast } from "date-fns";
import { Contact, MoreHorizontal, XCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { stringify, type Shift } from "~/lib/events/utils";
import { cn } from "~/lib/utils";
import SaveSpecificShiftButton from "./SaveSpecificShiftButton";

interface ShiftButtonProps {
    shift: Shift;
    isUsers: boolean;
}

const ShiftButton: React.FC<ShiftButtonProps> = ({ shift, isUsers }) => {
    const canRequestSub = !isPast(shift.end) && isUsers;
    return (
        <li
            className={cn({
                ["relative w-full rounded-full border-2 bg-primary-foreground py-1 pl-4 pr-10 shadow-md"]:
                    true,
                ["border-black/50 font-medium"]: isUsers,
            })}
        >
            {stringify(shift)}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="absolute bottom-0 right-0 top-0 rounded-e-full bg-purple-800 px-2">
                        <MoreHorizontal
                            className="mx-auto text-white"
                            size={16}
                        />
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
                    {isUsers && (
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
                    <DropdownMenuItem
                        asChild
                        className="rounded hover:bg-black/20"
                    >
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

export default ShiftButton;
