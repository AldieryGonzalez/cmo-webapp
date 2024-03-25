"use client";
import { Dialog } from "@radix-ui/react-dialog";
import { format as formateDate } from "date-fns";
import { ArrowRight, MoreHorizontal, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { EventsOutput } from "~/server/api/routers/events";
import { api } from "~/trpc/react";

type CartShiftsProps = {
    data: EventsOutput["getSavedShifts"];
};

const CartShifts = ({ data }: CartShiftsProps) => {
    const [selected, setSelected] = useState<string[]>([]);
    const [deleteList, setDeleteList] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const deleteShifts = api.events.deleteSavedShifts.useMutation().mutateAsync;
    const utils = api.useUtils();

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
    const handleDelete = (list = selected) => {
        setDeleteList(list);
        setOpen(true);
    };
    const idListToString = (list: string[]) => {
        const shifts = list.map((id) => {
            const shift = data.find((shift) => shift.savedShifts.id === id);
            return `${shift?.event?.title} - ${formateDate(
                shift?.savedShifts.start ?? "0",
                "MMMM d | h:mmbbb",
            )} - ${formateDate(
                shift?.savedShifts.end ?? "0",
                "h:mmbbb",
            )} - ${shift?.savedShifts.role}`;
        });
        return shifts.join("\n");
    };

    if (data.length === 0) {
        return (
            <div className="flex h-32 items-center justify-center">
                <p className="text-neutral-500 dark:text-neutral-400">
                    No shifts saved yet
                </p>
            </div>
        );
    }

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
                                onClick={() => handleDelete()}
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
                                checked={selected.includes(
                                    shift.savedShifts.id,
                                )}
                                onChange={() =>
                                    handleSelect(shift.savedShifts.id)
                                }
                            />
                        </div>
                        <div className="flex w-full items-center justify-between">
                            <div className="p-2 text-xs md:text-sm">
                                <p className="max-w-full text-ellipsis">
                                    {shift.event?.title}
                                </p>
                                <p className="text-neutral-500 dark:text-neutral-400">
                                    {formateDate(
                                        shift.savedShifts.start,
                                        "MMMM d | h:mmbbb",
                                    )}{" "}
                                    -{" "}
                                    {formateDate(
                                        shift.savedShifts.end,
                                        "h:mmbbb",
                                    )}{" "}
                                    - {shift.savedShifts.role}
                                </p>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant={"link"}
                                        className="mr-2 p-0 sm:p-2"
                                    >
                                        <MoreVertical className="opacity-25 hover:opacity-100 sm:hidden" />
                                        <MoreHorizontal className="hidden opacity-25 hover:opacity-100 sm:block" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    sideOffset={-10}
                                >
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={`/shifts/${shift.event?.id}`}
                                            className="underline"
                                        >
                                            Go to Event <ArrowRight size={12} />
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Button
                                            variant={"link"}
                                            className="w-full py-0 text-red-600"
                                            onClick={() =>
                                                handleDelete([
                                                    shift.savedShifts.id,
                                                ])
                                            }
                                        >
                                            Delete
                                        </Button>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                );
            })}
            <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
                <DialogContent className="max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>Are you sure</DialogTitle>
                        <DialogDescription className="space-y-4">
                            You are about to delete {deleteList.length} shift(s)
                            <div className="rounded-sm border bg-slate-100 p-4 text-left">
                                <p className="whitespace-pre-line text-sm">
                                    {idListToString(deleteList)}
                                </p>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant={"destructive"}
                                    onClick={async () => {
                                        const res = deleteShifts(deleteList);
                                        toast.promise(res, {
                                            loading: "Loading...",
                                            success: () => {
                                                setOpen(false);
                                                return `Successfully deleted ${deleteList.length} shift(s)`;
                                            },
                                            error: "Error",
                                        });
                                        await res.then(async () => {
                                            await utils.events.getSavedShifts.refetch();
                                        });
                                    }}
                                >
                                    <span>Delete</span>
                                </Button>
                                <Button
                                    variant={"outline"}
                                    onClick={() => {
                                        setOpen(false);
                                        setDeleteList([]);
                                    }}
                                >
                                    <span>Cancel</span>
                                </Button>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CartShifts;
