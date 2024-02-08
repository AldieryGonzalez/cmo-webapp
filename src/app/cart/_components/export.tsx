"use client";

import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { type EventsOutput } from "~/server/api/routers/events";

type ExportButtonProps = {
  results: EventsOutput["getSavedShifts"];
};

const ExportButton: React.FC<ExportButtonProps> = ({ results }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={"nu"} disabled={results.length == 0}>
          <span>Save Shifts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Email Blob</DialogTitle>
          <DialogDescription>
            Copy and paste this to send to CMO Managers
            <ExportForm shifts={results} />
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

type ExportFormProps = {
  shifts: EventsOutput["getSavedShifts"];
};

const ExportForm: React.FC<ExportFormProps> = ({ shifts }) => {
  const exportShifts = shifts
    .map((shift) => {
      const date = shift.savedShifts.start.toLocaleDateString();
      const startTime = format(shift.savedShifts.start, "h:mmaaa");
      const endTime = format(shift.savedShifts.end, "h:mmaaa");
      const role = shift.savedShifts.role;
      const location = shift.event?.location ?? "";
      const name = shift.event?.title ?? "";
      return `${date}, ${startTime}-${endTime} - ${location} - ${role} - [${name}]`;
    })
    .join("\n");
  return (
    <div className="flex flex-col justify-start gap-4">
      <div className="rounded-sm border bg-slate-100 p-4 text-left">
        <p className="whitespace-pre-line text-sm">{exportShifts}</p>
      </div>
      <Button
        variant={"outline"}
        onClick={async () => {
          const res = navigator.clipboard.writeText(exportShifts);
          toast.promise(res, {
            loading: "Loading...",
            success: () => {
              return `Copied to clipboard`;
            },
            error: "Error",
          });
        }}
      >
        <span>Copy</span>
      </Button>
    </div>
  );
};

export default ExportButton;
