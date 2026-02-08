import { format, formatDistanceToNow } from "date-fns";
import MessageMarkdown from "~/components/dashboard/MessageMarkdown";
import { getUser } from "~/lib/auth/utils";
import { api } from "~/trpc/server";
import MessageCreator from "./_components/MessageCreator";

const Messages = async () => {
    const user = await getUser();
    const messages = user
        ? await api.messages.getAnnouncements.query({
              userEmail: user.email,
          })
        : await api.messages.getAnnouncements.query();

    return (
        <div className="container space-y-4 py-6">
            <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
            {user && (
                <MessageCreator />
            )}
            {messages.length === 0 && (
                <p className="text-muted-foreground">No messages yet.</p>
            )}
            {messages.map((message) => (
                <article
                    key={message.id}
                    className="rounded-lg border bg-card p-4 shadow-sm"
                >
                    <h2 className="text-lg font-semibold">{message.subject}</h2>
                    <div className="mb-2 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                        <span>From: {message.fromEmail}</span>
                        <span>To: {message.toEmail ?? "Everyone"}</span>
                        <span>
                            {format(message.sentAt, "MMM d, yyyy, h:mm a")} (
                            {formatDistanceToNow(message.sentAt, {
                                addSuffix: true,
                            })}
                            )
                        </span>
                    </div>
                    <hr className="mb-3" />
                    <MessageMarkdown
                        content={message.contentMarkdown}
                        resolvedShifts={message.resolvedShifts}
                        resolvedEvents={message.resolvedEvents}
                        resolvedUsers={message.resolvedUsers}
                    />
                </article>
            ))}
        </div>
    );
};

export default Messages;
