"use client";

import { format } from "date-fns";
import { CalendarClock, CalendarDays, ExternalLink, User, XCircle } from "lucide-react";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
    ResolvedEvent,
    ResolvedShift,
    ResolvedUser,
} from "~/server/api/routers/messages";

type MessageMarkdownProps = {
    content: string;
    /** Map of shiftId -> live-resolved shift+event data */
    resolvedShifts: Record<string, ResolvedShift>;
    /** Map of eventId -> event data for cmo://event embeds */
    resolvedEvents: Record<string, ResolvedEvent>;
    /** Map of userId or email -> user data for cmo://user embeds */
    resolvedUsers: Record<string, ResolvedUser>;
};

const Unavailable = ({
    icon: Icon,
    label,
}: {
    icon: typeof XCircle;
    label: string;
}) => (
    <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
    </span>
);

/**
 * Renders markdown with special handling for cmo:// links:
 * - cmo://shift?id=<id> → shift embed card
 * - cmo://event?id=<id> → event embed card
 * - cmo://user?id=<id> or cmo://user?email=<email> → user/coworker embed card
 */
const MessageMarkdown: React.FC<MessageMarkdownProps> = ({
    content,
    resolvedShifts,
    resolvedEvents,
    resolvedUsers,
}) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            urlTransform={(url) => {
                // Allow our custom cmo:// protocol through the sanitizer
                if (url.startsWith("cmo://")) return url;
                return url;
            }}
            components={{
                a: ({ href, children, ...rest }: ComponentPropsWithoutRef<"a">) => {
                    if (!href?.startsWith("cmo://")) {
                        return (
                            <a
                                href={href}
                                className="text-purple-700 underline hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                                target="_blank"
                                rel="noopener noreferrer"
                                {...rest}
                            >
                                {children}
                            </a>
                        );
                    }
                    const url = new URL(href.replace("cmo://", "https://cmo.internal/"));

                    if (href.startsWith("cmo://shift")) {
                        const shiftId = url.searchParams.get("id");
                        const shift = shiftId ? resolvedShifts[shiftId] : undefined;
                        if (shift) return <ShiftEmbedCard shift={shift} />;
                        return <Unavailable icon={XCircle} label="Shift no longer available" />;
                    }

                    if (href.startsWith("cmo://event")) {
                        const eventId = url.searchParams.get("id");
                        const event = eventId ? resolvedEvents[eventId] : undefined;
                        if (event) return <EventEmbedCard event={event} />;
                        return <Unavailable icon={XCircle} label="Event no longer available" />;
                    }

                    if (href.startsWith("cmo://user")) {
                        const userId = url.searchParams.get("id");
                        const userEmail = url.searchParams.get("email");
                        const key = userId ?? userEmail ?? null;
                        const user = key ? resolvedUsers[key] : undefined;
                        if (user) return <UserEmbedCard user={user} />;
                        return <Unavailable icon={User} label="User not found" />;
                    }

                    // Unknown cmo:// type — render as normal link
                    return (
                        <a
                            href={href}
                            className="text-purple-700 underline hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...rest}
                        >
                            {children}
                        </a>
                    );
                },
                p: ({ children }) => (
                    <p className="mb-2 leading-relaxed">{children}</p>
                ),
                h1: ({ children }) => (
                    <h1 className="mb-2 text-xl font-bold">{children}</h1>
                ),
                h2: ({ children }) => (
                    <h2 className="mb-1.5 text-lg font-semibold">{children}</h2>
                ),
                h3: ({ children }) => (
                    <h3 className="mb-1 text-base font-semibold">{children}</h3>
                ),
                ul: ({ children }) => (
                    <ul className="mb-2 ml-4 list-disc space-y-0.5">{children}</ul>
                ),
                ol: ({ children }) => (
                    <ol className="mb-2 ml-4 list-decimal space-y-0.5">{children}</ol>
                ),
                blockquote: ({ children }) => (
                    <blockquote className="my-2 border-l-4 border-purple-300 pl-3 italic text-muted-foreground dark:border-purple-700">
                        {children}
                    </blockquote>
                ),
                code: ({ children }) => (
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">
                        {children}
                    </code>
                ),
                hr: () => <hr className="my-3 border-muted-foreground/20" />,
                strong: ({ children }) => (
                    <strong className="font-semibold">{children}</strong>
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    );
};

/**
 * Compact inline card for a live-resolved shift reference.
 * Shows role, event title, time range, assignment status, and cancelled state.
 * Links to /shifts/<eventId>?highlightShiftId=<shiftId>.
 */
function ShiftEmbedCard({ shift }: { shift: ResolvedShift }) {
    const timeRange = `${format(shift.start, "MMM d, h:mm a")} - ${format(shift.end, "h:mm a")}`;
    const href = `/shifts/${shift.eventId}?highlightShiftId=${shift.shiftId}`;
    const isCancelled = shift.cancelled || shift.eventCancelled;
    const isFilled = !!shift.filledBy;

    return (
        <Link
            href={href}
            className={`my-1.5 flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                isCancelled
                    ? "border-red-200 bg-red-50 hover:border-red-400 dark:border-red-800 dark:bg-red-950 dark:hover:border-red-600"
                    : "border-purple-200 bg-purple-50 hover:border-purple-400 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950 dark:hover:border-purple-600 dark:hover:bg-purple-900"
            }`}
        >
            <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isCancelled
                        ? "bg-red-200 dark:bg-red-800"
                        : "bg-purple-200 dark:bg-purple-800"
                }`}
            >
                {isCancelled ? (
                    <XCircle className="h-4 w-4 text-red-700 dark:text-red-300" />
                ) : (
                    <CalendarClock className="h-4 w-4 text-purple-700 dark:text-purple-300" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${isCancelled ? "text-red-900 line-through dark:text-red-200" : "text-purple-900 dark:text-purple-200"}`}>
                    {shift.role}
                </p>
                <p className={`text-xs ${isCancelled ? "text-red-700 dark:text-red-400" : "text-purple-700 dark:text-purple-400"}`}>
                    {shift.eventTitle} &middot; {timeRange}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                    {isCancelled
                        ? "Cancelled"
                        : isFilled
                          ? `Assigned to ${shift.filledBy}`
                          : "Open — not yet filled"}
                </p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-purple-400" />
        </Link>
    );
}

/**
 * Compact inline card for a live-resolved event reference.
 * Shows title, location, date range. Links to /shifts/<eventId>.
 */
function EventEmbedCard({ event }: { event: ResolvedEvent }) {
    const timeRange = `${format(event.start, "MMM d, h:mm a")} - ${format(event.end, "h:mm a")}`;
    const href = `/shifts/${event.id}`;
    const isCancelled = event.cancelled;

    return (
        <Link
            href={href}
            className={`my-1.5 flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                isCancelled
                    ? "border-red-200 bg-red-50 hover:border-red-400 dark:border-red-800 dark:bg-red-950 dark:hover:border-red-600"
                    : "border-sky-200 bg-sky-50 hover:border-sky-400 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950 dark:hover:border-sky-600 dark:hover:bg-sky-900"
            }`}
        >
            <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isCancelled
                        ? "bg-red-200 dark:bg-red-800"
                        : "bg-sky-200 dark:bg-sky-800"
                }`}
            >
                {isCancelled ? (
                    <XCircle className="h-4 w-4 text-red-700 dark:text-red-300" />
                ) : (
                    <CalendarDays className="h-4 w-4 text-sky-700 dark:text-sky-300" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${isCancelled ? "text-red-900 line-through dark:text-red-200" : "text-sky-900 dark:text-sky-200"}`}>
                    {event.title}
                </p>
                <p className={`text-xs ${isCancelled ? "text-red-700 dark:text-red-400" : "text-sky-700 dark:text-sky-400"}`}>
                    {event.location} &middot; {timeRange}
                </p>
                {isCancelled && (
                    <p className="text-xs text-red-600 dark:text-red-400">Cancelled</p>
                )}
            </div>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-sky-400" />
        </Link>
    );
}

/**
 * Compact inline card for a coworker/user reference.
 * Shows name and email. Links to mailto: for contact.
 */
function UserEmbedCard({ user }: { user: ResolvedUser }) {
    const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
    const href = `mailto:${user.email}`;

    return (
        <a
            href={href}
            className="my-1.5 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 transition-colors hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:hover:border-emerald-600 dark:hover:bg-emerald-900"
        >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-200 dark:bg-emerald-800">
                <User className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    {displayName}
                </p>
                <p className="truncate text-xs text-emerald-700 dark:text-emerald-400">
                    {user.email}
                </p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
        </a>
    );
}

export default MessageMarkdown;
