"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarClock, Clock, RotateCcw } from "lucide-react";
import { useQueryDate } from "~/lib/dates/query-date-context";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

export function QueryDatePicker() {
  const { queryDate, setQueryDate, formattedDate } = useQueryDate();
  const [mounted, setMounted] = useState(false);
  const [tempDate, setTempDate] = useState(queryDate);
  const [tempTime, setTempTime] = useState(format(queryDate, "HH:mm"));
  const [open, setOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(queryDate);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync tempDate/tempTime when queryDate changes (e.g. after reading from cookie)
  useEffect(() => {
    setTempDate(queryDate);
    setTempTime(format(queryDate, "HH:mm"));
    setCalendarMonth(queryDate);
  }, [queryDate]);

  // When popover opens, ensure calendar shows the month of the current tempDate
  useEffect(() => {
    if (open) {
      setCalendarMonth(tempDate);
    }
  }, [open, tempDate]);

  if (!mounted) {
    return null;
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const newDate = new Date(date);
    newDate.setHours(tempDate.getHours());
    newDate.setMinutes(tempDate.getMinutes());
    setTempDate(newDate);
  };

  const handleTimeChange = (timeString: string) => {
    setTempTime(timeString);
    const [hours, minutes] = timeString.split(":").map(Number);
    if (!isNaN(hours!) && !isNaN(minutes!)) {
      const newDate = new Date(tempDate);
      newDate.setHours(hours!);
      newDate.setMinutes(minutes!);
      setTempDate(newDate);
    }
  };

  const handleApply = () => {
    setQueryDate(tempDate);
    setOpen(false);
  };

  const handleReset = () => {
    const defaultDate = new Date("2023-08-01T00:00:00.000Z");
    setTempDate(defaultDate);
    setTempTime(format(defaultDate, "HH:mm"));
    setCalendarMonth(defaultDate);
    setQueryDate(defaultDate);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "fixed bottom-4 right-4 z-50 h-auto gap-2 border-amber-500/40 px-4 py-2 shadow-lg",
            "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          )}
        >
          <CalendarClock className="h-4 w-4 text-amber-500" />
          <span className="hidden text-xs text-amber-600 sm:inline dark:text-amber-400">
            Simulated Date:
          </span>
          <span className="font-mono text-sm">{formattedDate}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="end">
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              Simulated Date &amp; Time
            </Label>
            <p className="text-xs text-muted-foreground">
              Set the date used for querying shifts and events. This does not
              affect real data — it simulates &ldquo;today&rdquo; for browsing.
            </p>
          </div>
          <div className="space-y-2">
            <Calendar
              mode="single"
              selected={tempDate}
              onSelect={handleDateSelect}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time-input">Time</Label>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input
                id="time-input"
                type="time"
                value={tempTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-32"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleApply} className="flex-1">
              Apply
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
