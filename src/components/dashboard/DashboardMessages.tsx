"use client";
import { format, formatDistanceToNow } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

type Props = {
    messages: {
        date: string | undefined;
        attatchments: never[];
        id: string | undefined;
        from: string;
        to: string[];
        subject: string | undefined;
        text: string | undefined;
        html: string;
    }[];
};

const formatDate = (date: Date) => {
    const formattedDate = format(date, "MMM d, yyyy, h:mm a");
    const hoursAgo = formatDistanceToNow(date, { addSuffix: true });
    return `${formattedDate} (${hoursAgo})`;
};

const DashboardMessages = ({ messages: serialMessages }: Props) => {
    const [index, setIndex] = useState<number>(0);
    const messages = serialMessages.map((message) => ({
        ...message,
        date: new Date(message.date ?? 0),
    }));
    const handleNextIndex = () => {
        setIndex((prev) => (prev + 1) % messages.length);
    };
    const handlePrevIndex = () => {
        setIndex((prev) => (prev - 1 + messages.length) % messages.length);
    };
    const message = messages[index];
    if (!message) {
        return null;
    }

    return (
        <section className="flex max-h-full grow flex-col">
            <h3 className="text-xl font-normal">Announcements</h3>
            <div className="flex grow flex-col overflow-y-auto rounded-md border border-card-foreground/35 bg-card shadow-sm shadow-primary/10">
                <nav className="flex justify-end gap-2 bg-zinc-400 px-6 py-0.5">
                    <p>{`${index + 1} of ${messages.length}`}</p>
                    <button onClick={handlePrevIndex}>
                        <ChevronLeft />
                    </button>
                    <button onClick={handleNextIndex}>
                        <ChevronRight />
                    </button>
                </nav>
                <div className="grow overflow-y-auto">
                    <div className="flex max-h-full flex-col overflow-auto p-3">
                        <p className="text-lg font-semibold">
                            {message.subject}
                        </p>
                        <p className="text-sm font-normal">
                            From: {message.from}
                        </p>
                        <p className="text-sm font-normal">To: {message.to}</p>
                        <p className="text-sm font-normal">{`Sent: ${formatDate(
                            message.date,
                        )}`}</p>
                        <hr className="my-2" />
                        <div
                            dangerouslySetInnerHTML={{
                                __html: message.html,
                            }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DashboardMessages;
