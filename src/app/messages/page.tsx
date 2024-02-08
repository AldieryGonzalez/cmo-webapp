import { parseGmailMessage } from "~/lib/email/utils";
import { api } from "~/trpc/server";

const Messages = async () => {
  const gmailResponses = await api.messages.getEvents.query();
  const messages = gmailResponses.map((message) => {
    return parseGmailMessage(message);
  });

  return (
    <div className="whitespace-pre-wrap">
      Messages
      {"\n"}
      {messages.map((message, index) => {
        return (
          <div key={index} className="rounded-lg border p-4">
            {message?.payload}
          </div>
        );
      })}
    </div>
  );
};

export default Messages;
