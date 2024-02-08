"use client";
import { format, formatDistanceToNow } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

type Props = {
  messages: ({
    subject: string;
    from: string;
    date: string;
    to: string;
    payload: string | null;
  } | null)[];
};

const formatDate = (date: string) => {
  const formattedDate = format(date, "MMM d, yyyy, h:mm a");
  const hoursAgo = formatDistanceToNow(date, { addSuffix: true });
  return `${formattedDate} (${hoursAgo})`;
};

const DashboardMessages = ({ messages }: Props) => {
  const [index, setIndex] = useState(0);
  return (
    <section className="flex grow flex-col">
      <h3 className="block text-xl font-normal">Announcements</h3>
      <div className="relative grow overflow-y-auto rounded-md border border-card-foreground/35 bg-card shadow-sm shadow-primary/10">
        <nav className="sticky left-0 right-0 top-0 flex h-7 justify-end gap-2 bg-zinc-400 px-6 py-0.5">
          <p>{`${index + 1} of ${messages.length}`}</p>
          <button
            onClick={() =>
              setIndex((prev) =>
                prev - 1 < 0 ? messages.length - 1 : prev - 1,
              )
            }
          >
            <ChevronLeft />
          </button>
          <button
            onClick={() => setIndex((prev) => (prev + 1) % messages.length)}
          >
            <ChevronRight />
          </button>
        </nav>
        <div className="flex flex-col p-3">
          <p className="text-lg font-semibold">{messages[index]?.subject}</p>
          <p className="text-sm font-normal">{messages[index]?.from}</p>
          <p className="text-sm font-normal">To: {messages[index]?.to}</p>
          <p className="text-sm font-normal">{`Sent: ${formatDate(
            messages[index]?.date ?? "0",
          )}`}</p>
          {/* <p className="text-sm font-normal">{`Sent: ${formatDate(date)}`}</p> */}
          <pre className="whitespace-pre-wrap text-sm font-normal">
            {messages[index]?.payload ?? "No message"}
          </pre>
        </div>
      </div>
    </section>
  );
};

export default DashboardMessages;
