import { parseGmailMessage } from "~/lib/email/utils";
import { api } from "~/trpc/server";

const Messages = async ( ) => {
  const gmailResponses = await api.messages.getEvents.query().then();
  const messages = gmailResponses.map((message) => {
    return parseGmailMessage(message);
    // return message.payload?.mimeType
  });
//   const emailHtml = {__html: Buffer.from(messages[1]?.body?.data, 'base64').toString()}
  return (
    <div className="whitespace-pre-wrap">
      Messages
      {"\n"}
      {/* {JSON.stringify(messages, null, 4)}
      {} */}
      {messages.map((message, index) => {
        return (
          <div key={index} className="p-4 border rounded-lg">
            {message}
          </div>
        );
      })}
      {/* {Buffer.from(messages[0]?.body?.data, 'base64').toString()} */}
      {/* <div dangerouslySetInnerHTML={emailHtml} className="text-black">

      </div> */}
    </div>
  );
};

export default Messages;

