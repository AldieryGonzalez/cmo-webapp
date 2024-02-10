import { api } from "~/trpc/server";

const Messages = async () => {
    const messages = await api.messages.getEvents.query();

    return (
        <div className="whitespace-pre-wrap">
            Messages
            {"\n"}
            {messages.map((message, index) => {
                return (
                    <div
                        key={index}
                        className="rounded-lg border p-4"
                        dangerouslySetInnerHTML={{ __html: message.html }}
                    />
                );
            })}
        </div>
    );
};

export default Messages;
