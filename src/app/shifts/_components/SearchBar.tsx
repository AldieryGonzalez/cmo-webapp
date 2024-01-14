import React, { useState } from "react";
import { Input, type InputProps } from "~/components/ui/input";
import { SearchIcon, SlidersHorizontal } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { DateRangePicker } from "~/components/ui/date-range-picker";
import { type DateRange } from "react-day-picker";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { getDateRangeFromSearchParams } from "~/lib/gcal/utils";
import { usePathname, useRouter } from "next/navigation";

export type SearchProps = React.InputHTMLAttributes<HTMLInputElement>;

interface SearchBarProps extends InputProps {
  searchParams: Record<string, string | undefined>;
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, searchParams, ...props }, ref) => {
    const router = useRouter();
    const pathname = usePathname();
    const [searchControl, setSearchControl] = useState(
      searchParams.search ?? "",
    );
    const [locationControl, setLocationControl] = useState(
      searchParams.where ?? "",
    );
    const [dateRangeControl, setDateRangeControl] = useState(
      getDateRangeFromSearchParams(searchParams),
    );
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
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      searchParams.search = e.target.value;
      setSearchControl(e.target.value);
      setSearchParams(searchParams);
    };
    const handleLocationChange = (value: string) => {
      searchParams.location = value;
      setLocationControl(value);
      setSearchParams(searchParams);
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
      <div
        className={cn(
          "flex h-10 w-full items-center rounded-md border border-input bg-white px-3 text-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-2",
          className,
        )}
      >
        <SearchIcon className="h-[16px] w-[16px]" />
        <input
          {...props}
          type="search"
          ref={ref}
          onChange={handleSearchChange}
          value={searchControl}
          placeholder="Search for an ensemble, musician, date or role"
          className="w-full p-2 placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Sheet>
          <SheetTrigger>
            <SlidersHorizontal className="w-4" />
          </SheetTrigger>
          <SheetContent>
            <SheetHeader className="mb-2">
              <SheetTitle>Advanced Search</SheetTitle>
            </SheetHeader>
            <Label>Search</Label>
            <Input
              onChange={handleSearchChange}
              value={searchControl}
              placeholder="Search for an ensemble, musician, date or role"
              className="mb-2"
            />
            <Label>Location</Label>
            <Select
              onValueChange={handleLocationChange}
              value={locationControl}
            >
              <SelectTrigger className="mb-2">
                <SelectValue placeholder="Select a hall" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="pick-staiger">Pick-Staiger</SelectItem>
                <SelectItem value="galvin">Galvin</SelectItem>
                <SelectItem value="mcclintock">McClintock</SelectItem>
                <SelectItem value="mcr">MCR</SelectItem>
                <SelectItem value="rot">ROT</SelectItem>
              </SelectContent>
            </Select>
            <Label>Date Range</Label>
            <DateRangePicker
              dateRange={dateRangeControl}
              handleDateChange={handleDateChange}
              className="mb-2"
            />
          </SheetContent>
        </Sheet>
      </div>
    );
  },
);

SearchBar.displayName = "Search";

export default SearchBar;
