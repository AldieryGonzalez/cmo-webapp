"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { hasPast, stringify } from "~/lib/events/utils";
import { cn } from "~/lib/utils";
import type { Event } from "~/server/api/routers/events";
import { api } from "~/trpc/react";

type SaveShiftButtonProps = {
  event: Event;
  mobile?: boolean;
};

const SaveShiftButton: React.FC<SaveShiftButtonProps> = ({
  event,
  mobile = false,
}) => {
  const canSaveShift = !hasPast(event);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          disabled={!canSaveShift}
          variant={"nu"}
          className={cn(
            { "hidden sm:inline-flex": !mobile },
            { "sm:hidden": mobile },
            "disabled:cursor-not-allowed",
          )}
        >
          <span>Save Shift</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What shift?</DialogTitle>
          <DialogDescription>
            <SaveForm event={event} />
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

const SaveForm = ({ event }: { event: Event }) => {
  const FormSchema = z.object({
    shift: z.string({
      required_error: "You need to select a notification type.",
    }),
  });
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });
  const saveShift = api.events.saveShift.useMutation();
  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const findshift = event.shifts.find((shift) => shift.id === data.shift);
    if (!findshift) {
      toast.error("Internal error. Please try again.");
      return;
    }
    //removing id so cart event generates new id
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...shift } = findshift;
    const res = saveShift.mutateAsync(shift);
    toast.promise(res, {
      loading: "Loading...",
      success: () => {
        return `${shift.role} shift has been saved`;
      },
      error: "Error",
    });
  }
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-2/3 space-y-6 p-4"
      >
        <FormField
          control={form.control}
          name="shift"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  {event.shifts.map((shift) => {
                    return (
                      <FormItem
                        key={shift.id}
                        className="flex items-center space-x-3 space-y-0"
                      >
                        <FormControl>
                          <RadioGroupItem
                            disabled={shift.isFilled}
                            value={shift.id}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {stringify(shift)}
                        </FormLabel>
                      </FormItem>
                    );
                  })}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};

export default SaveShiftButton;
