import type { CmoEvent } from "~/lib/gcal/CmoEvent";
import Link from "next/link";

type ShiftCardProps = {
  event: CmoEvent;
};

const DashboardShiftCard: React.FC<ShiftCardProps> = ({ event }) => {
  return (
    <div className="relative inline-flex h-28 w-72 snap-start items-start justify-start gap-4 rounded-md border border-gray-200 py-2.5 pl-2 shadow transition">
      <div className="inline-flex flex-col items-start justify-start gap-1 pr-[59px]">
        <div className="w-[200px] text-sm font-semibold leading-tight text-slate-900">
          {event.roleInEvent("Aldi G.")}
        </div>
        <div className="w-[200px] text-[11px] font-normal leading-tight text-slate-900">
          {event.title}
        </div>
        <div className="inline-flex w-[200px] items-center justify-start gap-1">
          <div className="w-[200px] text-[10px] font-normal leading-none text-slate-500">
            {event.longTimeRangeString}
          </div>
        </div>
      </div>
      <Link href={`/shifts/${event.id}`} className="transition-all">
        <div className="absolute bottom-0 right-0 top-0 inline-flex w-1/6 flex-col items-center justify-center gap-2.5 rounded-br-md rounded-tr-md bg-purple-900 px-[5px] py-2.5 transition-all hover:w-full hover:rounded-md hover:bg-purple-800">
          <div className="w-10 text-center text-xs font-semibold leading-tight text-white">
            Go to <br />
            Event
          </div>
        </div>
      </Link>
    </div>
  );
};

export default DashboardShiftCard;
