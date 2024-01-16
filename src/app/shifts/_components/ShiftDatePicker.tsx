"use client";
import { usePathname, useRouter } from "next/navigation";
import { DateRangePicker } from "~/components/ui/date-range-picker";
import { type DateRange } from "react-day-picker";
import { getDateRangeFromSearchParams } from "~/lib/gcal/utils";
import { useState } from "react";

type ShiftDatePickerProps = {
  searchParams: Record<string, string | undefined>;
};

const ShiftDatePicker: React.FC<ShiftDatePickerProps> = ({ searchParams }) => {
  const [dateRangeControl, setDateRangeControl] = useState(
    getDateRangeFromSearchParams(searchParams),
  );
  const router = useRouter();
  const pathname = usePathname();
  const setSearchParams = (params: typeof searchParams) => {
    const queryString = Object.entries(params)
      .map(([key, value]) =>
        key && value
          ? `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
          : "",
      )
      .filter(Boolean)
      .join("&");
    const query = queryString ? `?${queryString}` : "";
    router.replace(`${pathname}${query}`);
  };
  const handleDateChange = (dateRange: DateRange | undefined) => {
    if (dateRange) {
      if (dateRange.from) {
        searchParams.start = dateRange.from.toISOString();
      }
      if (dateRange.to) {
        searchParams.end = dateRange.to.toISOString();
      }
      setDateRangeControl(dateRange);
      setSearchParams(searchParams);
    }
  };
  return (
    <DateRangePicker
      dateRange={dateRangeControl}
      handleDateChange={handleDateChange}
      className="mb-2"
      withIcon={false}
    />
  );
};

export default ShiftDatePicker;
